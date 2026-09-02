import { Badge } from "@/components/ui/badge";
import type { MapFacility } from "@/lib/omni.functions";
import { categoryLabel, formatDistance } from "@/lib/omni";
import { useMarket } from "@/lib/market";

export type ResultFacility = MapFacility & {
  distanceKm?: number | null;
  isPro?: boolean;
  mobile_presence?: boolean;
};

export function FacilityResultCard({
  facility,
  index,
  queryLabel,
  onSelect,
}: {
  facility: ResultFacility;
  index: number;
  queryLabel: string;
  onSelect: (facility: ResultFacility) => void;
}) {
  const { formatMoney } = useMarket();
  const isUnclaimed = facility.status === "unclaimed";
  const isTrusted = facility.status === "confirmed" || facility.status === "certified";
  const hasMatchedProduct = Boolean(facility.matched_product_name);
  const productLabel =
    facility.matched_product_name || queryLabel || categoryLabel(facility.category);

  return (
    <button
      type="button"
      aria-label={`${facility.name}. ${isUnclaimed ? "Facility non réclamée" : "Facility vérifiée"}. ${facility.product_count} offre${facility.product_count > 1 ? "s" : ""}.`}
      aria-posinset={index + 1}
      onClick={() => onSelect(facility)}
      data-omni-result-card="true"
      className="omni-atlas-surface group min-w-0 w-[min(20rem,calc(100vw-3rem))] max-w-full shrink-0 snap-start rounded-[1.5rem] p-2.5 text-left transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--atlas-orange)] active:scale-[0.99] md:p-3.5"
    >
      <div className="mb-3 overflow-hidden rounded-2xl bg-secondary/60">
        {facility.cover_url || facility.matched_product_photo_url ? (
          <img
            src={facility.cover_url ?? facility.matched_product_photo_url ?? undefined}
            alt={`Aperçu de ${facility.name}`}
            loading="lazy"
            className="aspect-[16/9] w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="grid aspect-[16/9] place-items-center bg-secondary/50 px-4 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Aperçu média indisponible
          </div>
        )}
      </div>
      <div className="rounded-[1.15rem] border border-[var(--atlas-glass-border)] bg-[var(--atlas-paper)]/72 px-3 py-2.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          Produit recherché
        </p>
        <p className="mt-1 break-words text-base font-semibold">{productLabel}</p>
        <p className="mt-0.5 break-words text-[11px] text-muted-foreground">
          {hasMatchedProduct
            ? `Correspond à votre recherche${facility.matched_product_price != null ? ` · ${formatMoney(facility.matched_product_price)}` : ""}${facility.matched_product_quantity != null ? ` · ${facility.matched_product_quantity} disponible(s)` : ""}`
            : isUnclaimed
              ? "Correspondance à confirmer · achat non disponible"
              : "Correspondance à confirmer · disponibilité à vérifier"}
        </p>
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0">
            <p className="break-words text-sm font-bold">{facility.name}</p>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {isUnclaimed ? "Découverte OSM · non réclamée" : "Présence Omni vérifiée"}
            </p>
          </div>
        </div>
        <Badge variant={isTrusted ? "default" : "secondary"} className="shrink-0 text-[10px]">
          {isTrusted ? "Vérifiée" : "À confirmer"}
        </Badge>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px]">
        <span className="rounded-full bg-[var(--atlas-paper)]/72 px-2.5 py-1.5 font-semibold">
          {facility.min_price != null
            ? `Dès ${formatMoney(facility.min_price)}`
            : "Prix à confirmer"}
        </span>
        <span className="rounded-full bg-[var(--atlas-paper)]/72 px-2.5 py-1.5 text-right font-semibold">
          {formatDistance(facility.distanceKm ?? null)}
        </span>
        <span className="rounded-full bg-[var(--atlas-paper)]/72 px-2.5 py-1.5 text-muted-foreground">
          {facility.product_count} offre{facility.product_count > 1 ? "s" : ""}
        </span>
        <span className="rounded-full bg-[var(--atlas-paper)]/72 px-2.5 py-1.5 text-right text-primary">
          {facility.max_discount_percent > 0
            ? `${facility.max_discount_percent}% de réduction`
            : "Disponibilité à vérifier"}
        </span>
      </div>
      <div
        className={`mt-3 grid min-h-11 place-items-center rounded-full px-3 py-2 text-center text-[11px] font-bold transition-colors ${isUnclaimed ? "bg-[var(--atlas-paper-deep)] text-[var(--atlas-ink)] group-hover:bg-[var(--atlas-paper)]" : "bg-[var(--atlas-orange)] text-white group-hover:bg-[#e85c0a]"}`}
      >
        {isUnclaimed ? "Voir la fiche et réclamer" : "Voir et vérifier la disponibilité"}
      </div>
    </button>
  );
}
