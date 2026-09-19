import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@/lib/useServerFn";
import {
  getFacility,
  type FacilityMediaRow,
  type MapFacility as ApiFacility,
} from "@/lib/omni.functions";
import { Button } from "@/components/ui/button";
import { MapCanvas } from "@/components/omni/MapCanvas";
import { FacilityPanel } from "@/components/omni/FacilityPanel";
import { MediaCarousel } from "@/components/omni/MediaCarousel";
import { haversineKm, DEFAULT_CENTER } from "@/lib/omni";
import { useMarket } from "@/lib/market";

export const Route = createFileRoute("/fiche/$id")({
  head: () => ({
    meta: [
      { title: "Fiche commerce — OmniView" },
      {
        name: "description",
        content:
          "Produits disponibles, disponibilité en temps réel et itinéraire vers ce commerce de Lomé.",
      },
      { property: "og:title", content: "Fiche commerce — OmniView" },
      {
        property: "og:description",
        content: "Voir les produits, la disponibilité et l'itinéraire.",
      },
    ],
  }),
  component: FichePage,
});

function FichePage() {
  const { id } = Route.useParams();
  const { market } = useMarket();
  const fallbackCenter =
    market?.default_lat != null
      ? { lat: market.default_lat, lng: market.default_lng }
      : DEFAULT_CENTER;
  const [facility, setFacility] = useState<ApiFacility | null>(null);
  const [media, setMedia] = useState<FacilityMediaRow[]>([]);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useServerFn(getFacility);

  useEffect(() => {
    void (async () => {
      try {
        const result = await load({ data: { id } });
        setFacility(result?.facility ?? null);
        setMedia(result?.media ?? []);
      } catch {
        setFacility(null);
        setMedia([]);
      }
    })();
  }, [id, load]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserPos(null),
      { timeout: 8000 },
    );
  }, []);

  // DEAD CODE — orphaned in the trunk rebuild (`src/main.tsx` mounts only
  // `TrunkAppV13`). Kept as reference. Routing must go through the Omni proxy
  // (`GET /api/v2/public/routing`), never a browser call to a public provider.
  async function itinerary() {
    if (!facility) return;
    const from = userPos ?? fallbackCenter;
    setBusy(true);
    try {
      const params = new URLSearchParams({
        from_lat: String(from.lat),
        from_lng: String(from.lng),
        to_lat: String(facility.latitude),
        to_lng: String(facility.longitude),
        profile: "foot",
      });
      const res = await fetch(`/api/v2/public/routing?${params.toString()}`, { headers: { Accept: "application/json" } });
      const payload = (await res.json()) as {
        data?: { available?: boolean; coordinates?: [number, number][] };
      };
      if (!payload.data?.available || !payload.data.coordinates) {
        toast.error("Itinéraire routier indisponible pour ce lieu.");
        return;
      }
      setRouteCoords(payload.data.coordinates);
    } catch {
      toast.error("Impossible de calculer l'itinéraire.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/carte">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Retour à la carte
          </Link>
        </Button>

        {!facility && <p className="text-sm text-muted-foreground">Chargement…</p>}

        {facility && (
          <div className="grid gap-6 md:grid-cols-[1fr_360px]">
            <div className="omni-card space-y-4 p-5">
              <MediaCarousel media={media} />
              <FacilityPanel
                facility={{ ...facility, isPro: facility.sponsored || facility.tier === "pro" }}
                distanceKm={haversineKm(userPos ?? fallbackCenter, {
                  lat: facility.latitude,
                  lng: facility.longitude,
                })}
                routingBusy={busy}
                onItinerary={() => void itinerary()}
              />
            </div>
            <div className="h-[420px] overflow-hidden rounded-2xl border border-border md:sticky md:top-24">
              <MapCanvas
                facilities={[{ ...facility, isPro: facility.sponsored || facility.tier === "pro" }]}
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
