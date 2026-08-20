import { useEffect, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  LocateFixed,
  MapPin,
  Menu,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { BrandMark } from "@/components/omni/BrandMark";
import { MapCanvas, type MapFacility } from "@/components/omni/MapCanvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type LocationStatus = "pending" | "granted" | "fallback" | "unavailable";
type BrowserPermissionStatus = "unknown" | "prompt" | "granted" | "denied" | "unsupported";
type CoverageStatus = "idle" | "loading" | "ready" | "error";
type ViewportSnapshot = { west: number; south: number; east: number; north: number; zoom: number };

type BuyerFacility = MapFacility & {
  distanceKm?: number;
  min_price?: number | null;
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
  hasActiveSearch: boolean;
  locationStatus: LocationStatus;
  browserPermission: BrowserPermissionStatus;
  coverageStatus: CoverageStatus;
  activeTransactionCount: number;
  revealRunning: boolean;
  isAuthenticated: boolean;
  onQueryChange: (value: string) => void;
  onSearchSubmit: () => void;
  onSelect: (facility: BuyerFacility) => void;
  onClearSelection: () => void;
  onCheckAvailability: (facility: BuyerFacility) => void;
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

function locationCopy(
  status: LocationStatus,
  permission: BrowserPermissionStatus,
): { label: string; detail: string; tone: "neutral" | "active" | "muted" | "warning" } {
  if (status === "pending") {
    return {
      label: "Localisation en cours…",
      detail: "La carte reste disponible pendant la demande du navigateur.",
      tone: "active",
    };
  }
  if (status === "granted" && permission === "granted") {
    return {
      label: "Votre position",
      detail: "Les résultats locaux utiliseront votre zone autorisée.",
      tone: "active",
    };
  }
  if (status === "fallback" || permission === "denied") {
    return {
      label: "Explorer le monde",
      detail: "Vous pouvez chercher sans partager votre position.",
      tone: "muted",
    };
  }
  return {
    label: "Autoriser ma position",
    detail: "Obtenez une vue locale plus précise.",
    tone: "warning",
  };
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
  hasActiveSearch,
  locationStatus,
  browserPermission,
  coverageStatus,
  activeTransactionCount,
  revealRunning,
  isAuthenticated,
  onQueryChange,
  onSearchSubmit,
  onSelect,
  onClearSelection,
  onCheckAvailability,
  onOpenBulkAvailability,
  onOpenActivity,
  onRequestLocation,
  onUseMarketFallback,
  onRetryCoverage,
  onViewportChange,
  onRevealStateChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const location = locationCopy(locationStatus, browserPermission);
  const hasQuery = Boolean(query.trim());
  const locationButtonLabel =
    locationStatus === "pending"
      ? "Localisation…"
      : locationStatus === "granted"
        ? "Ma position"
        : "Autoriser ma position";

  useEffect(() => {
    if (hasActiveSearch && !selected) inputRef.current?.blur();
  }, [hasActiveSearch, selected]);

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

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between">
          <div className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-white/70 bg-[color-mix(in_oklab,var(--omni-paper-bright)_82%,transparent)] px-2.5 py-2 shadow-[var(--omni-shadow-float)] backdrop-blur-xl">
            <BrandMark className="h-8 w-8 rounded-[24%]" />
            <div className="hidden pr-2 sm:block">
              <p className="font-display text-sm font-extrabold tracking-[-0.03em]">Omni</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--omni-ink-muted)]">Supply, visible.</p>
            </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            {activeTransactionCount > 0 ? (
              <button
                type="button"
                onClick={onOpenActivity}
                className="omni-clean-chip hidden min-h-11 items-center gap-2 rounded-full px-4 text-xs font-bold sm:flex"
              >
                <span className="h-2 w-2 rounded-full bg-[var(--omni-orange)]" aria-hidden="true" />
                {activeTransactionCount} transaction{activeTransactionCount > 1 ? "s" : ""} en cours
              </button>
            ) : null}
            <button
              type="button"
              onClick={onOpenActivity}
              aria-label="Ouvrir votre activité Omni"
              className="omni-clean-icon-button"
            >
              {activeTransactionCount > 0 ? <Sparkles className="h-4 w-4" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {revealRunning ? (
        <div className="pointer-events-none absolute left-1/2 top-[24%] z-20 -translate-x-1/2 rounded-full border border-white/75 bg-[color-mix(in_oklab,var(--omni-paper-bright)_78%,transparent)] px-4 py-2 text-xs font-bold text-[var(--omni-ink)] shadow-[var(--omni-shadow-float)] backdrop-blur-xl">
          Recherche du monde vers votre zone…
        </div>
      ) : null}

      <section className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3">
          {!selected && hasActiveSearch && !revealRunning ? (
            <div className="pointer-events-auto flex items-center justify-between gap-3 self-start rounded-2xl border border-white/75 bg-[color-mix(in_oklab,var(--omni-paper-bright)_88%,transparent)] px-4 py-3 shadow-[var(--omni-shadow-float)] backdrop-blur-xl">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--omni-ink-muted)]">Résultats préqualifiés</p>
                <p className="font-display text-base font-extrabold tracking-[-0.02em]">
                  {results.length} offre{results.length === 1 ? "" : "s"} pour « {submittedQuery || "votre recherche"} »
                </p>
              </div>
              <button type="button" onClick={onOpenBulkAvailability} className="omni-clean-secondary-button min-h-11 whitespace-nowrap">
                Vérifier plusieurs
              </button>
            </div>
          ) : null}

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
                    <p className="mt-3 line-clamp-1 font-display text-lg font-extrabold tracking-[-0.03em]">{facility.name}</p>
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
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--omni-orange-wash)] text-[var(--omni-orange-deep)]">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--omni-ink-muted)]">Facilité sélectionnée</p>
                  <h1 className="mt-1 line-clamp-2 font-display text-xl font-extrabold tracking-[-0.03em]">{selected.name}</h1>
                  <p className="mt-1 text-xs font-semibold text-[var(--omni-ink-muted)]">{statusLabel(selected.status)} · {facilityTypeLabel(selected)}</p>
                </div>
              </div>
              {selected.status === "unclaimed" ? (
                <div className="mt-4 rounded-2xl bg-[var(--omni-paper)] px-3 py-3 text-sm leading-5 text-[var(--omni-ink-muted)]">
                  Cette fiche provient de données publiques. La disponibilité, le contact privé et l’achat Omni ne sont pas disponibles.
                </div>
              ) : (
                <div className="mt-4 rounded-2xl bg-[var(--omni-paper)] px-3 py-3 text-sm leading-5 text-[var(--omni-ink-muted)]">
                  Cette offre correspond à votre recherche. Vérifiez la disponibilité réelle avant de créer une intention d’achat.
                </div>
              )}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                {selected.status === "unclaimed" ? (
                  <button type="button" className="omni-clean-secondary-button min-h-12 flex-1">
                    Revendiquer cette facilité
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
            <div className="pointer-events-auto mx-auto w-full max-w-3xl rounded-[1.75rem] border border-white/80 bg-[color-mix(in_oklab,var(--omni-paper-bright)_90%,transparent)] p-2 shadow-[var(--omni-shadow-float)] backdrop-blur-2xl sm:p-3">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  onSearchSubmit();
                }}
                className="flex items-center gap-2"
              >
                <Search className="ml-2 h-5 w-5 shrink-0 text-[var(--omni-ink-muted)]" aria-hidden="true" />
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => onQueryChange(event.target.value)}
                  placeholder="Que recherchez-vous ?"
                  aria-label="Rechercher une offre, un produit ou un service"
                  className="h-12 min-w-0 flex-1 border-0 bg-transparent px-1 text-[16px] font-semibold text-[var(--omni-ink)] shadow-none outline-none placeholder:text-[var(--omni-ink-muted)] focus-visible:ring-0"
                />
                <Button type="submit" aria-label="Lancer la recherche" className="h-12 w-12 shrink-0 rounded-2xl bg-[var(--omni-orange)] text-white shadow-[0_10px_22px_-12px_var(--omni-orange-deep)] hover:bg-[var(--omni-orange-deep)]">
                  <Search className="h-5 w-5" />
                </Button>
              </form>
              <div className="mt-2 flex flex-wrap items-center gap-2 px-1">
                <button
                  type="button"
                  onClick={locationStatus === "granted" ? undefined : onRequestLocation}
                  disabled={locationStatus === "pending" || locationStatus === "granted"}
                  className={cn("omni-clean-context-chip", location.tone === "active" && "omni-clean-context-chip-active")}
                >
                  <LocateFixed className="h-3.5 w-3.5" />
                  {locationButtonLabel}
                </button>
                <button type="button" onClick={onUseMarketFallback} className="omni-clean-context-chip">
                  <Compass className="h-3.5 w-3.5" />
                  Explorer le monde
                </button>
                {hasQuery && !isAuthenticated ? <span className="ml-auto text-[11px] font-semibold text-[var(--omni-ink-muted)]">Un compte sera demandé pour afficher les offres.</span> : null}
                {coverageStatus === "loading" ? <span className="ml-auto text-[11px] font-bold text-[var(--omni-orange-deep)]">Recherche…</span> : null}
                {coverageStatus === "error" ? <button type="button" onClick={onRetryCoverage} className="ml-auto text-[11px] font-extrabold text-[var(--omni-danger)]">Réessayer</button> : null}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
