import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Volume2, X } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { listFacilities, type MapFacility as ApiFacility } from "@/lib/omni.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapCanvas, type MapFacility } from "@/components/omni/MapCanvas";
import { FacilityPanel } from "@/components/omni/FacilityPanel";
import { CartPanel } from "@/components/omni/CartPanel";
import { WishlistPanel } from "@/components/omni/WishlistPanel";
import { OrdersPanel } from "@/components/omni/OrdersPanel";
import { TopNav } from "@/components/omni/TopNav";
import { CATEGORIES, formatDistance, haversineKm, LOME_CENTER } from "@/lib/omni";

export const Route = createFileRoute("/carte")({
  head: () => ({
    meta: [
      { title: "Carte des commerces à Lomé — OmniView" },
      {
        name: "description",
        content:
          "Explorez la carte OmniView : commerces ouverts, produits disponibles, distance et itinéraire à pied dans Lomé.",
      },
      { property: "og:title", content: "Carte des commerces à Lomé — OmniView" },
      { property: "og:description", content: "Trouvez un produit disponible près de vous à Lomé." },
    ],
  }),
  component: CartePage,
});

type RouteStep = { instruction: string; distance: number };

function CartePage() {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState<ApiFacility[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<MapFacility | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [geoReady, setGeoReady] = useState(false);
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
  const [steps, setSteps] = useState<RouteStep[]>([]);
  const [routingBusy, setRoutingBusy] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishOpen, setWishOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [nearbyMobile, setNearbyMobile] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const fetchFacilities = useServerFn(listFacilities);

  useEffect(() => {
    let active = true;
    const handle = window.setTimeout(
      () => {
        void (async () => {
          try {
            const rows = await fetchFacilities({
              data: {
                search: query.trim() || undefined,
                category: category ?? undefined,
                includeUnclaimed: true,
              },
            });
            if (active) setFacilities(rows);
          } catch {
            if (active) setFacilities([]);
          }
        })();
      },
      query.trim() ? 300 : 0,
    );
    return () => {
      active = false;
      window.clearTimeout(handle);
    };
  }, [fetchFacilities, query, category]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoReady(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoReady(true);
      },
      () => {
        setUserPos(null);
        setGeoReady(true);
      },
      { timeout: 8000 },
    );
  }, []);

  // Proximity banner (mode démo) — computed on load, no background tracking
  useEffect(() => {
    if (!userPos || facilities.length === 0) return;
    const near = facilities.find(
      (f) =>
        f.type === "mobile" &&
        f.is_online &&
        haversineKm(userPos, { lat: f.latitude, lng: f.longitude }) <= 2,
    );
    setNearbyMobile(near ? near.name : null);
  }, [userPos, facilities]);

  const origin = userPos ?? LOME_CENTER;

  const results = useMemo(
    () =>
      facilities
        .map((f) => ({
          ...f,
          isPro: f.sponsored || f.tier === "pro",
          distanceKm: haversineKm(origin, { lat: f.latitude, lng: f.longitude }),
        }))
        .sort((a, b) => {
          if (a.isPro !== b.isPro) return a.isPro ? -1 : 1;
          return a.distanceKm - b.distanceKm;
        }),
    [facilities, origin],
  );

  const initialCenter = useMemo(() => userPos, [userPos]);

  // After each search, frame the user plus the five nearest matches.
  const [fitPoints, setFitPoints] = useState<{ lat: number; lng: number }[] | null>(null);
  const searchKey = `${query.trim()}|${category ?? ""}`;
  useEffect(() => {
    if (!searchKey.replace("|", "")) {
      setFitPoints(null);
      return;
    }
    if (results.length === 0) return;
    const nearest = [...results]
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 5)
      .map((f) => ({ lat: f.latitude, lng: f.longitude }));
    setFitPoints(userPos ? [userPos, ...nearest] : nearest);
    // Only re-frame when the search itself changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKey, facilities]);


  async function buildItinerary(f: MapFacility) {
    const from = userPos ?? LOME_CENTER;
    setRoutingBusy(true);
    try {
      const url = `https://router.project-osrm.org/route/v1/foot/${from.lng},${from.lat};${f.longitude},${f.latitude}?overview=full&geometries=geojson&steps=true`;
      const res = await fetch(url);
      const json = (await res.json()) as {
        routes?: {
          geometry: { coordinates: [number, number][] };
          legs: {
            steps: {
              maneuver: { type: string; modifier?: string };
              name: string;
              distance: number;
            }[];
          }[];
        }[];
      };
      const route = json.routes?.[0];
      if (!route) {
        toast.error("Itinéraire indisponible.");
        return;
      }
      setRouteCoords(route.geometry.coordinates);
      const list: RouteStep[] = (route.legs[0]?.steps ?? []).map((s) => ({
        instruction: `${translateManeuver(s.maneuver.type, s.maneuver.modifier)}${s.name ? ` sur ${s.name}` : ""}`,
        distance: s.distance,
      }));
      setSteps(list);
      speak(`Itinéraire vers ${f.name}. ${list[0]?.instruction ?? ""}`);
    } catch {
      toast.error("Impossible de calculer l'itinéraire.");
    } finally {
      setRoutingBusy(false);
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <TopNav
        query={query}
        onQueryChange={setQuery}
        onOpenCart={() => setCartOpen(true)}
        onOpenWishlist={() => setWishOpen(true)}
        onOpenOrders={() => setOrdersOpen(true)}
        activeRole="acheteur"
        hideSearch
      />


      {nearbyMobile && !bannerDismissed && (
        <div className="flex items-center gap-2 bg-accent px-4 py-2 text-sm text-accent-foreground">
          <span className="font-medium">{nearbyMobile} est à proximité de vous</span>
          <Badge variant="secondary">Mode démo</Badge>
          <button
            type="button"
            className="ml-auto"
            onClick={() => setBannerDismissed(true)}
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="relative flex-1 overflow-hidden">
        {geoReady ? (
          <MapCanvas
            facilities={results}
            selectedId={selected?.id ?? null}
            onSelect={(f) => {
              setSelected(f);
              setRouteCoords(null);
              setSteps([]);
            }}
            routeCoords={routeCoords}
            userPosition={userPos}
            initialCenter={initialCenter}
            initialZoom={userPos ? 15.5 : 12.2}
            focus={selected ? { lat: selected.latitude, lng: selected.longitude } : null}
            fitPoints={selected ? null : fitPoints}
            className="h-full w-full"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground">
            Localisation en cours…
          </div>
        )}

        {!selected && steps.length === 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-3 pb-4">
            <div className="omni-glass pointer-events-auto w-full max-w-xl space-y-2 p-2.5">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                }}
              >
                <SmartSearchBar
                  value={query}
                  onChange={setQuery}
                  placeholder="Que cherchez-vous à Lomé ?"
                />
              </form>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                <button
                  type="button"
                  onClick={() => setCategory(null)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${
                    category === null
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card/70"
                  }`}
                >
                  Tout
                </button>
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${
                      category === c.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card/70"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
                <span className="ml-auto shrink-0 pl-2 text-[11px] text-muted-foreground">
                  {results.length} résultat(s)
                </span>
              </div>
            </div>
          </div>
        )}



        {selected && (
          <div className="absolute inset-x-0 bottom-0 max-h-[70%] overflow-y-auto rounded-t-3xl border-t border-border bg-card p-4 shadow-[var(--shadow-sheet)] md:left-auto md:right-4 md:top-4 md:max-h-[calc(100%-2rem)] md:w-[420px] md:rounded-2xl md:border">
            <div className="mb-2 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: "/fiche/$id", params: { id: selected.id } })}
              >
                Page complète
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Fermer"
                onClick={() => setSelected(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <FacilityPanel
              facility={selected}
              distanceKm={haversineKm(origin, { lat: selected.latitude, lng: selected.longitude })}
              routingBusy={routingBusy}
              onItinerary={() => void buildItinerary(selected)}
            />
          </div>
        )}

        {steps.length > 0 && (
          <div className="absolute inset-x-3 bottom-3 max-h-48 overflow-y-auto rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-soft)] md:right-[460px] md:inset-x-auto md:left-3 md:w-96">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-display font-bold">Guidage à pied</p>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Relire"
                  onClick={() => speak(steps[0]?.instruction ?? "")}
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Arrêter le guidage"
                  onClick={() => {
                    setSteps([]);
                    setRouteCoords(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <ol className="space-y-1.5 text-sm">
              {steps.map((s, i) => (
                <li key={`${s.instruction}-${i}`} className="flex gap-2">
                  <span className="font-semibold text-primary">{i + 1}.</span>
                  <span>
                    {s.instruction}{" "}
                    <span className="text-muted-foreground">
                      ({formatDistance(s.distance / 1000)})
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <CartPanel open={cartOpen} onOpenChange={setCartOpen} />
      <OrdersPanel open={ordersOpen} onOpenChange={setOrdersOpen} />
      <WishlistPanel
        open={wishOpen}
        onOpenChange={setWishOpen}
        onRerun={(term) => setQuery(term)}
      />
    </div>
  );
}

function translateManeuver(type: string, modifier?: string): string {
  const dir: Record<string, string> = {
    left: "à gauche",
    right: "à droite",
    "slight left": "légèrement à gauche",
    "slight right": "légèrement à droite",
    straight: "tout droit",
    uturn: "demi-tour",
  };
  if (type === "depart") return "Départ";
  if (type === "arrive") return "Vous êtes arrivé";
  if (type === "turn") return `Tournez ${dir[modifier ?? ""] ?? ""}`.trim();
  if (type === "roundabout") return "Prenez le rond-point";
  return `Continuez ${dir[modifier ?? ""] ?? "tout droit"}`;
}

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !text) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "fr-FR";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}
