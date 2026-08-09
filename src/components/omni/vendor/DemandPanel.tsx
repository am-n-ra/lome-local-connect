import { formatDateFr } from "@/lib/omni";
import type { DemandSignal } from "@/lib/vendor.functions";

export function DemandPanel({ demand }: { demand: DemandSignal[] }) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-secondary p-4 text-sm">
        Ce que les acheteurs autour de vous cherchent sans trouver. Ajoutez ces produits à votre
        catalogue pour capter la demande.
      </div>
      <ul className="space-y-2">
        {demand.map((g) => (
          <li
            key={g.search_term}
            className="flex items-center justify-between rounded-lg border border-border p-3"
          >
            <div>
              <p className="font-medium">{g.search_term}</p>
              <p className="text-sm text-muted-foreground">
                {g.hits} recherche(s) · dernière le {formatDateFr(g.last_seen)}
              </p>
            </div>
          </li>
        ))}
        {demand.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucune demande enregistrée pour l'instant.</p>
        )}
      </ul>
    </div>
  );
}
