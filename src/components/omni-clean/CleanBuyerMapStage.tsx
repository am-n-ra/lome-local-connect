import { ArrowRight, MapPin, X } from "lucide-react";
import { MapCanvas, type MapFacility } from "@/components/omni/MapCanvas";
import { OmniResumeBar } from "@/components/omni/ui/OmniPrimitives";
import { CleanBuyerSearchDock } from "@/components/omni-clean/CleanBuyerSearchDock";
import type { MapFilters } from "@/lib/search-dock-contract";

type LocationStatus = "pending" | "granted" | "fallback" | "unavailable";
type BrowserPermissionStatus = "unknown" | "prompt" | "granted" | "denied" | "unsupported";
type CoverageStatus = "idle" | "loading" | "ready" | "error";
type ViewportSnapshot = { west: number; south: number; east: number; north: number; zoom: number };

type BuyerFacility = MapFacility & {
  distanceKm?: number;
  min_price?: number | null;
  max_discount_percent?: number | null;
  matched_product_name?: string | null;
  matched_product_price?: number | null;
  matched_product_photo_url?: string | null;
  cover_url?: string | null;
  isPro?: boolean;
  mobile_presence?: boolean;
};

type Props = {
  discoveryFacilities: MapFacility[];
  results: BuyerFacility[];
  selected: BuyerFacility | null;
  userPosition: { lat: number; lng: number; accuracy?: number | null } | null;
  approximatePosition: { lat: number; lng: number; accuracy?: number | null } | null;
  marketCenter: { lat: number; lng: number } | null;
  marketZoom: number;
  revealKey: string | null;
  fitPoints: { lat: number; lng: number }[] | null;
  routeCoords: [number, number][] | null;
  query: string;
  submittedQuery: string;
  category: string | null;
  filters: MapFilters;
  quantity: number;
  hasActiveSearch: boolean;
  locationStatus: LocationStatus;
  browserPermission: BrowserPermissionStatus;
  coverageStatus: CoverageStatus;
  activeTransactionCount: number;
  revealRunning: boolean;
  isAuthenticated: boolean;
  onQueryChange: (value: string) => void;
  onCategoryChange: (value: string | null) => void;
  onFiltersChange: (value: MapFilters) => void;
  onQuantityChange: (value: number) => void;
  onSearchSubmit: () => void;
  onSelect: (facility: BuyerFacility) => void;
  onClearSelection: () => void;
  onCheckAvailability: (facility: BuyerFacility) => void;
  onOpenCatalog: (facility: BuyerFacility) => void;
  onClaim: (facility: BuyerFacility) => void;
  onOpenBulkAvailability: () => void;
  onOpenActivity: () => void;
  onRequestLocation: () => void;
  onUseMarketFallback: () => void;
  onRetryCoverage: () => void;
  onViewportChange: (viewport: ViewportSnapshot) => void;
  onRevealStateChange: (running: boolean) => void;
};

function statusLabel(status: string | null | undefined) {
  if (status === "confirmed") return "Confirmée";
  if (status === "certified") return "Certifiée";
  if (status === "unconfirmed") return "Active · non confirmée";
  if (status === "unclaimed") return "Non revendiquée";
  return "Facilité";
}

function facilityTypeLabel(facility: BuyerFacility) {
  if (facility.mobile_presence || facility.type === "mobile") return "Mobile";
  if (facility.type === "digital") return "Digitale";
  return "Fixe";
}

function formatDistance(distanceKm?: number) {
  if (distanceKm == null || !Number.isFinite(distanceKm)) return null;
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
  return `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km`;
}

function formatMoney(value?: number | null) {
  if (value == null || !Number.isFinite(value)) return null;
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value)} FCFA`;
}

export function CleanBuyerMapStage({
  discoveryFacilities,
  results,
  selected,
  userPosition,
  approximatePosition,
  marketCenter,
  marketZoom,
  revealKey,
  fitPoints,
  routeCoords,
  query,
  submittedQuery,
  category,
  filters,
  quantity,
  hasActiveSearch,
  locationStatus,
  browserPermission,
  coverageStatus,
  activeTransactionCount,
  revealRunning,
  isAuthenticated,
  onQueryChange,
  onCategoryChange,
  onFiltersChange,
  onQuantityChange,
  onSearchSubmit,
  onSelect,
  onClearSelection,
  onCheckAvailability,
  onOpenCatalog,
  onClaim,
  onOpenBulkAvailability,
  onOpenActivity,
  onRequestLocation,
  onUseMarketFallback,
  onRetryCoverage,
  onViewportChange,
  onRevealStateChange,
}: Props) {
  const selectedMedia = selected?.matched_product_photo_url ?? selected?.cover_url ?? null;
  const selectedOffer = selected?.max_discount_percent && selected.max_discount_percent > 0
    ? `Offre jusqu’à -${selected.max_discount_percent}%`
    : "Aucune remise active";

  return (
    <main className="omni-clean-stage relative isolate min-h-[100dvh] overflow-hidden bg-[var(--omni-paper)] text-[var(--omni-ink)]" data-omni-clean-stage>
      <div className="absolute inset-0 z-0">
        <MapCanvas
          facilities={hasActiveSearch ? results : discoveryFacilities}
          selectedId={selected?.id ?? null}
          onSelect={(facility) => onSelect(facility as BuyerFacility)}
          routeCoords={routeCoords}
          userPosition={userPosition}
          approximatePosition={approximatePosition}
          marketCenter={marketCenter}
          marketZoom={marketZoom}
          revealKey={revealKey}
          showFacilities
          showUserLocation={Boolean(userPosition)}
          onRevealStateChange={onRevealStateChange}
          onViewportChange={onViewportChange}
          focus={selected ? { lat: selected.latitude, lng: selected.longitude } : null}
          fitPoints={selected ? null : fitPoints}
          className="h-full w-full"
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(244,238,231,.86)_0%,rgba(244,238,231,.16)_18%,transparent_42%,rgba(244,238,231,.1)_100%)]" />

      {revealRunning ? (
        <div className="pointer-events-none absolute left-1/2 top-[24%] z-20 -translate-x-1/2 rounded-full border border-white/75 bg-[color-mix(in_oklab,var(--omni-paper-bright)_78%,transparent)] px-4 py-2 text-xs font-bold text-[var(--omni-ink)] shadow-[var(--omni-shadow-float)] backdrop-blur-xl">
          Recherche du monde vers votre zone…
        </div>
      ) : null}

      <section className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3">
          {activeTransactionCount > 0 && !selected ? <div className="pointer-events-auto mx-auto w-full max-w-3xl"><OmniResumeBar label={`${activeTransactionCount} transaction${activeTransactionCount > 1 ? "s" : ""} en cours`} detail="Reprendre votre activité sans perdre la recherche" onClick={onOpenActivity} /></div> : null}

          {!selected && hasActiveSearch && !revealRunning && results.length > 0 ? (
            <div className="pointer-events-auto -mx-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0" aria-label="Résultats de recherche">
              <div className="flex min-w-0 gap-3 sm:grid sm:grid-cols-2 lg:max-w-4xl lg:grid-cols-3">
                {results.slice(0, 8).map((facility) => (
                  <button
                    key={facility.id}
                    type="button"
                    onClick={() => onSelect(facility)}
                    className="omni-clean-result-card group min-w-[min(78vw,19rem)] text-left sm:min-w-0"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="rounded-full bg-[var(--omni-orange-wash)] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--omni-orange-deep)]">
                        {facility.status === "unclaimed" ? "Données publiques" : "Préqualifiée"}
                      </span>
                      <ArrowRight className="h-4 w-4 text-[var(--omni-ink-muted)] transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <p className="mt-3 line-clamp-1 font-display text-lg font-extrabold tracking-[-0.03em]">{facility.matched_product_name ?? "Offre à découvrir"}</p>
                    <p className="mt-1 line-clamp-1 text-sm font-bold text-[var(--omni-ink)]">{facility.name}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-[var(--omni-ink-muted)]">
                      <span>{statusLabel(facility.status)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{facilityTypeLabel(facility)}</span>
                      {formatDistance(facility.distanceKm) ? <><span aria-hidden="true">·</span><span>{formatDistance(facility.distanceKm)}</span></> : null}
                    </div>
                    {formatMoney(facility.min_price) ? (
                      <p className="mt-3 text-sm font-extrabold text-[var(--omni-ink)]">À partir de {formatMoney(facility.min_price)}</p>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {selected ? (
            <article className="pointer-events-auto omni-clean-selected-card relative w-full max-w-xl self-center lg:mr-0 lg:max-w-md lg:self-end" aria-label={`Détails de ${selected.name}`}>
              <button
                type="button"
                onClick={onClearSelection}
                aria-label="Fermer la fiche de la facilité"
                className="omni-clean-icon-button absolute right-3 top-3 z-10 h-10 w-10 bg-white/80"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-start gap-3 pr-12">
                {selectedMedia ? <img src={selectedMedia} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover" /> : <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--omni-orange-wash)] text-[var(--omni-orange-deep)]"><MapPin className="h-5 w-5" /></div>}
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--omni-ink-muted)]">{selected.matched_product_name ?? "Offre correspondant à votre recherche"}</p>
                  <h1 className="mt-1 line-clamp-2 font-display text-xl font-extrabold tracking-[-0.03em]">{selected.name}</h1>
                  <p className="mt-1 text-xs font-semibold text-[var(--omni-ink-muted)]">{statusLabel(selected.status)} · {facilityTypeLabel(selected)} · {selected.is_online ? "Ouverte" : "À confirmer"}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold">
                <div className="rounded-xl bg-[var(--omni-paper)] p-3"><span className="block text-[var(--omni-ink-muted)]">Prix</span><strong className="mt-1 block">{formatMoney(selected.matched_product_price ?? selected.min_price) ?? "À confirmer"}</strong></div>
                <div className="rounded-xl bg-[var(--omni-paper)] p-3"><span className="block text-[var(--omni-ink-muted)]">Offre</span><strong className="mt-1 block">{selectedOffer}</strong></div>
              </div>
              {selected.address || selected.neighbourhood ? <p className="mt-3 text-xs font-semibold text-[var(--omni-ink-muted)]">{selected.address ?? selected.neighbourhood}</p> : null}
              {selected.status === "unclaimed" ? (
                <div className="mt-4 rounded-2xl bg-[var(--omni-paper)] px-3 py-3 text-sm leading-5 text-[var(--omni-ink-muted)]">
                  Cette fiche provient de données publiques. La disponibilité, le contact privé et l’achat Omni ne sont pas disponibles. Une demande de vérification crée un dossier ; elle ne revendique pas la facilité.
                </div>
              ) : (
                <div className="mt-4 rounded-2xl bg-[var(--omni-paper)] px-3 py-3 text-sm leading-5 text-[var(--omni-ink-muted)]">
                  Cette offre correspond à votre recherche. Vérifiez la disponibilité réelle avant de créer une intention d’achat.
                </div>
              )}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                {(selected.product_count ?? 0) > 0 ? (
                  <button type="button" onClick={() => onOpenCatalog(selected)} className="omni-clean-secondary-button min-h-12 flex-1">
                    Voir les produits
                  </button>
                ) : null}
                {selected.status === "unclaimed" ? (
                  <button type="button" onClick={() => onClaim(selected)} className="omni-clean-secondary-button min-h-12 flex-1">
                    Demander une vérification
                  </button>
                ) : (
                  <button type="button" onClick={() => onCheckAvailability(selected)} className="omni-clean-primary-button min-h-12 flex-1">
                    Vérifier la disponibilité
                  </button>
                )}
                <button type="button" onClick={onClearSelection} className="omni-clean-secondary-button min-h-12 sm:w-32">
                  Retour à la carte
                </button>
              </div>
            </article>
          ) : null}

          {!selected ? (
            <CleanBuyerSearchDock
              query={query}
              category={category}
              filters={filters}
              quantity={quantity}
              hasActiveSearch={hasActiveSearch}
              resultCount={results.length}
              submittedQuery={submittedQuery}
              locationStatus={locationStatus}
              browserPermission={browserPermission}
              coverageStatus={revealRunning ? "loading" : coverageStatus}
              userPosition={userPosition}
              approximatePosition={approximatePosition}
              isAuthenticated={isAuthenticated}
              onQueryChange={onQueryChange}
              onCategoryChange={onCategoryChange}
              onFiltersChange={onFiltersChange}
              onQuantityChange={onQuantityChange}
              onSearchSubmit={onSearchSubmit}
              onOpenBulkAvailability={onOpenBulkAvailability}
              onRequestLocation={onRequestLocation}
              onUseMarketFallback={onUseMarketFallback}
              onRetryCoverage={onRetryCoverage}
            />
          ) : null}
        </div>
      </section>
    </main>
  );
}
