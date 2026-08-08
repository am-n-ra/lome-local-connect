import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MapCanvas } from "@/components/omni/MapCanvas";
import { FacilityPanel } from "@/components/omni/FacilityPanel";
import { TopNav } from "@/components/omni/TopNav";
import { haversineKm, isProActive, LOME_CENTER, type FacilityRow, type SubscriptionRow } from "@/lib/omni";

export const Route = createFileRoute("/fiche/$id")({
  head: () => ({
    meta: [
      { title: "Fiche commerce — OmniView" },
      { name: "description", content: "Produits disponibles, disponibilité en temps réel et itinéraire vers ce commerce de Lomé." },
      { property: "og:title", content: "Fiche commerce — OmniView" },
      { property: "og:description", content: "Voir les produits, la disponibilité et l'itinéraire." },
    ],
  }),
  component: FichePage,
});

function FichePage() {
  const { id } = Route.useParams();
  const [facility, setFacility] = useState<FacilityRow | null>(null);
  const [sub, setSub] = useState<SubscriptionRow | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from("facilities").select("*").eq("id", id).maybeSingle();
      setFacility((data ?? null) as FacilityRow | null);
      const { data: s } = await supabase.from("subscriptions").select("*").eq("facility_id", id).maybeSingle();
      setSub((s ?? null) as SubscriptionRow | null);
    })();
  }, [id]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserPos(null),
      { timeout: 8000 },
    );
  }, []);

  async function itinerary() {
    if (!facility) return;
    const from = userPos ?? LOME_CENTER;
    setBusy(true);
    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/foot/${from.lng},${from.lat};${facility.longitude},${facility.latitude}?overview=full&geometries=geojson`,
      );
      const json = (await res.json()) as { routes?: { geometry: { coordinates: [number, number][] } }[] };
      if (!json.routes?.[0]) {
        toast.error("Itinéraire indisponible.");
        return;
      }
      setRouteCoords(json.routes[0].geometry.coordinates);
    } catch {
      toast.error("Impossible de calculer l'itinéraire.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav activeRole="acheteur" />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/carte">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Retour à la carte
          </Link>
        </Button>

        {!facility && <p className="text-sm text-muted-foreground">Chargement…</p>}

        {facility && (
          <div className="grid gap-6 md:grid-cols-[1fr_360px]">
            <div className="omni-card p-5">
              <FacilityPanel
                facility={{ ...facility, isPro: isProActive(sub) }}
                distanceKm={haversineKm(userPos ?? LOME_CENTER, { lat: facility.latitude, lng: facility.longitude })}
                routingBusy={busy}
                onItinerary={() => void itinerary()}
              />
            </div>
            <div className="h-[420px] overflow-hidden rounded-2xl border border-border md:sticky md:top-24">
              <MapCanvas
                facilities={[{ ...facility, isPro: isProActive(sub) }]}
                routeCoords={routeCoords}
                userPosition={userPos}
                focus={{ lat: facility.latitude, lng: facility.longitude, zoom: 15 }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
