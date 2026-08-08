import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Mic, Volume2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapCanvas, type MapFacility } from "@/components/omni/MapCanvas";
import { FacilityPanel } from "@/components/omni/FacilityPanel";
import { CartPanel } from "@/components/omni/CartPanel";
import { WishlistPanel } from "@/components/omni/WishlistPanel";
import { TopNav } from "@/components/omni/TopNav";
import {
  CATEGORIES,
  formatDistance,
  haversineKm,
  isProActive,
  LOME_CENTER,
  type FacilityRow,
  type ProductRow,
  type SubscriptionRow,
} from "@/lib/omni";

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
  const [facilities, setFacilities] = useState<FacilityRow[]>([]);
  const [subs, setSubs] = useState<Record<string, SubscriptionRow>>({});
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<MapFacility | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
  const [steps, setSteps] = useState<RouteStep[]>([]);
  const [routingBusy, setRoutingBusy] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishOpen, setWishOpen] = useState(false);
  const [nearbyMobile, setNearbyMobile] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    void (async () => {
      const [{ data: f }, { data: s }, { data: p }] = await Promise.all([
        supabase.from("facilities").select("*").eq("is_online", true),
        supabase.from("subscriptions").select("*"),
        supabase.from("products").select("*"),
      ]);
      setFacilities((f ?? []) as FacilityRow[]);
      setProducts((p ?? []) as ProductRow[]);
      const map: Record<string, SubscriptionRow> = {};
      ((s ?? []) as SubscriptionRow[]).forEach((row) => {
        map[row.facility_id] = row;
      });
      setSubs(map);
    })();
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserPos(null),
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

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matchIds = new Set(
      products.filter((p) => q && p.name.toLowerCase().includes(q)).map((p) => p.facility_id),
    );
    return facilities
      .filter((f) => f.is_online)
      .filter((f) => (category ? f.category === category : true))
      .filter((f) => (q ? f.name.toLowerCase().includes(q) || matchIds.has(f.id) : true))
      .map((f) => ({
        ...f,
        isPro: isProActive(subs[f.id]),
        distanceKm: haversineKm(origin, { lat: f.latitude, lng: f.longitude }),
      }))
      .sort((a, b) => {
        if (a.isPro !== b.isPro) return a.isPro ? -1 : 1;
        return a.distanceKm - b.distanceKm;
      });
  }, [facilities, products, subs, query, category, origin]);

  const voiceSearch = useCallback(() => {
    const SR =
      (window as unknown as { SpeechRecognition?: new () => never; webkitSpeechRecognition?: new () => never })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => never }).webkitSpeechRecognition;
    if (!SR) {
      toast.error("La recherche vocale n'est pas disponible sur ce navigateur.");
      return;
    }
    const recognition = new SR() as unknown as {
      lang: string;
      start: () => void;
      onresult: (e: { results: { 0: { 0: { transcript: string } } } }) => void;
      onerror: () => void;
    };
    recognition.lang = "fr-FR";
    recognition.onresult = (e) => setQuery(e.results[0][0].transcript);
    recognition.onerror = () => toast.error("Je n'ai pas compris, réessayez.");
    recognition.start();
  }, []);

  async function buildItinerary(f: MapFacility) {
    const from = userPos ?? LOME_CENTER;
    setRoutingBusy(true);
    try {
      const url = `https://router.project-osrm.org/route/v1/foot/${from.lng},${from.lat};${f.longitude},${f.latitude}?overview=full&geometries=geojson&steps=true`;
      const res = await fetch(url);
      const json = (await res.json()) as {
        routes?: {
          geometry: { coordinates: [number, number][] };
          legs: { steps: { maneuver: { type: string; modifier?: string }; name: string; distance: number }[] }[];
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
        activeRole="acheteur"
      />

      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card px-3 py-2">
        <Button variant="outline" size="sm" onClick={voiceSearch}>
          <Mic className="mr-1.5 h-4 w-4" /> Recherche vocale
        </Button>
        <button
          type="button"
          onClick={() => setCategory(null)}
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
            category === null ? "border-primary bg-primary text-primary-foreground" : "border-border"
          }`}
        >
          Tout
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCategory(c.value)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              category === c.value ? "border-primary bg-primary text-primary-foreground" : "border-border"
            }`}
          >
            {c.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">
          Tri : Sponsorisé puis distance · {results.length} résultat(s)
        </span>
      </div>

      {nearbyMobile && !bannerDismissed && (
        <div className="flex items-center gap-2 bg-accent px-4 py-2 text-sm text-accent-foreground">
          <span className="font-medium">{nearbyMobile} est à proximité de vous</span>
          <Badge variant="secondary">Mode démo</Badge>
          <button type="button" className="ml-auto" onClick={() => setBannerDismissed(true)} aria-label="Fermer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="relative flex-1 overflow-hidden">
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
          focus={selected ? { lat: selected.latitude, lng: selected.longitude } : null}
          className="h-full w-full"
        />

        {selected && (
          <div
            className="absolute inset-x-0 bottom-0 max-h-[70%] overflow-y-auto rounded-t-3xl border-t border-border bg-card p-4 shadow-[var(--shadow-sheet)] md:left-auto md:right-4 md:top-4 md:max-h-[calc(100%-2rem)] md:w-[420px] md:rounded-2xl md:border"
          >
            <div className="mb-2 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/fiche/$id", params: { id: selected.id } })}>
                Page complète
              </Button>
              <Button variant="ghost" size="icon" aria-label="Fermer" onClick={() => setSelected(null)}>
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
                <Button variant="ghost" size="icon" aria-label="Relire" onClick={() => speak(steps[0]?.instruction ?? "")}>
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
                    <span className="text-muted-foreground">({formatDistance(s.distance / 1000)})</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <CartPanel open={cartOpen} onOpenChange={setCartOpen} />
      <WishlistPanel open={wishOpen} onOpenChange={setWishOpen} onRerun={(term) => setQuery(term)} />
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
