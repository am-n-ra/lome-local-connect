import { useMemo } from "react";
import { formatDistance, haversineKm } from "@/lib/omni";
import type { WishlistRow } from "@/lib/vendor";

export function DemandPanel({
  wishlists,
  origin,
}: {
  wishlists: WishlistRow[];
  origin: { lat: number; lng: number };
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, { term: string; count: number; nearest: number | null }>();
    wishlists.forEach((w) => {
      const key = w.search_term.trim().toLowerCase();
      const d =
        w.latitude !== null && w.longitude !== null
          ? haversineKm(origin, { lat: w.latitude, lng: w.longitude })
          : null;
      const prev = map.get(key);
      if (!prev) {
        map.set(key, { term: w.search_term.trim(), count: 1, nearest: d });
      } else {
        prev.count += 1;
        if (d !== null && (prev.nearest === null || d < prev.nearest)) prev.nearest = d;
      }
    });
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [wishlists, origin]);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-secondary p-4 text-sm">
        Ce que les acheteurs autour de vous cherchent sans trouver. Ajoutez ces produits à votre
        catalogue pour capter la demande.
      </div>
      <ul className="space-y-2">
        {grouped.map((g) => (
          <li key={g.term} className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="font-medium">{g.term}</p>
              <p className="text-sm text-muted-foreground">
                {g.count} recherche(s)
                {g.nearest !== null ? ` · la plus proche à ${formatDistance(g.nearest)}` : ""}
              </p>
            </div>
          </li>
        ))}
        {grouped.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucune demande enregistrée pour l'instant.</p>
        )}
      </ul>
    </div>
  );
}
