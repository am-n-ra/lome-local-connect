import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@/lib/useServerFn";
import {
  ChevronDown,
  LoaderCircle,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Minus,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { SmartSearchBar } from "@/components/omni/SmartSearchBar";
import { categoryLabel, CATEGORIES, LOCATION_APPROXIMATE_ACCURACY_METERS } from "@/lib/omni";
import { useMarket } from "@/lib/market";
import { recordProductEvent } from "@/lib/analytics.functions";
import { getAnalyticsSessionId, hasAnalyticsConsent } from "@/lib/analytics-browser";
import { deriveSearchDockActionMode, isSubmitWithinGuard, shouldShowStructuredRow } from "@/lib/search-dock-state";
import { DEFAULT_FILTERS, activeFilterCount, type MapFilters } from "@/lib/search-dock-contract";

export { DEFAULT_FILTERS, activeFilterCount } from "@/lib/search-dock-contract";
export type { MapFilters } from "@/lib/search-dock-contract";

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit?: (() => void) | undefined;
  category: string | null;
  onCategoryChange: (value: string | null) => void;
  filters: MapFilters;
  onFiltersChange: (value: MapFilters) => void;
  resultCount: number;
  onVerifyAvailability?: () => void;
  quantity?: number;
  onQuantityChange?: (value: number) => void;
  activeSearch?: boolean;
  coverageStatus?: "idle" | "loading" | "ready" | "error";
  locationStatus?: "pending" | "granted" | "fallback" | "unavailable";
  browserPermission?: "unknown" | "prompt" | "granted" | "denied" | "unsupported";
  locationAccuracy?: number | null;
  onRequestLocation?: () => void;
  onUseMarketFallback?: () => void;
  onRetryCoverage?: () => void;
};

const CHIPS = [
  { value: null, label: "Tout" },
  ...CATEGORIES.map((category) => ({ ...category })),
] as {
  value: string | null;
  label: string;
}[];

export function SearchDock({
  query,
  onQueryChange,
  onSubmit,
  category,
  onCategoryChange,
  filters,
  onFiltersChange,
  resultCount,
  onVerifyAvailability,
  quantity = 1,
  onQuantityChange,
  activeSearch = false,
  coverageStatus = "idle",
  locationStatus = "fallback",
  browserPermission = "unknown",
  locationAccuracy = null,
  onRequestLocation,
  onUseMarketFallback,
  onRetryCoverage,
}: Props) {
  const { formatMoney } = useMarket();
  const sendEvent = useServerFn(recordProductEvent);
  const dockRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const lastSubmitAtRef = useRef(0);
  const [refinementOpen, setRefinementOpen] = useState(false);
  const [structuredOpen, setStructuredOpen] = useState(false);
  const [quantityDraft, setQuantityDraft] = useState(String(quantity));
  const [budgetDraft, setBudgetDraft] = useState(
    filters.maxPrice == null ? "" : String(filters.maxPrice),
  );
  const activeCount = activeFilterCount(filters);
  const hasExplicitStructuredValues = quantity !== 1 || filters.maxPrice !== null;
  // Untouched defaults stay quiet in idle; explicitly entered values remain visible through the active flow.
  const structuredRowOpen = shouldShowStructuredRow(structuredOpen, quantity, filters.maxPrice);
  const actionMode = deriveSearchDockActionMode({
    activeSearch,
    resultCount,
    coverageStatus,
  });
  const isPrecise =
    locationStatus === "granted" &&
    locationAccuracy != null &&
    locationAccuracy <= LOCATION_APPROXIMATE_ACCURACY_METERS;
  const isApproximate =
    locationStatus === "granted" &&
    locationAccuracy != null &&
    locationAccuracy > LOCATION_APPROXIMATE_ACCURACY_METERS;

  useEffect(() => {
    setQuantityDraft(String(quantity));
  }, [quantity]);

  useEffect(() => {
    setBudgetDraft(filters.maxPrice == null ? "" : String(filters.maxPrice));
  }, [filters.maxPrice]);

  function commitQuantity() {
    const parsed = Number.parseInt(quantityDraft, 10);
    const next = Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
    setQuantityDraft(String(next));
    setStructuredOpen(true);
    onQuantityChange?.(next);
  }

  function commitBudget() {
    const parsed = Number.parseInt(budgetDraft, 10);
    const next = Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
    setBudgetDraft(next == null ? "" : String(next));
    setStructuredOpen(true);
    onFiltersChange({ ...filters, maxPrice: next });
  }

  useEffect(() => {
    const dock = dockRef.current;
    if (!dock) return;
    const updateClearance = () => {
      document.documentElement.style.setProperty(
        "--omni-dock-clearance",
        `${Math.ceil(dock.getBoundingClientRect().height + 24)}px`,
      );
    };
    updateClearance();
    const observer = new ResizeObserver(updateClearance);
    observer.observe(dock);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--omni-dock-clearance");
    };
  }, []);

  function slide(direction: 1 | -1) {
    railRef.current?.scrollBy({
      left: direction * Math.max(180, railRef.current.clientWidth * 0.75),
      behavior: "smooth",
    });
  }

  async function handleSubmit() {
    const now = Date.now();
    if (isSubmitWithinGuard(now, lastSubmitAtRef.current)) return;
    lastSubmitAtRef.current = now;
    onSubmit?.();
    if (hasAnalyticsConsent()) {
      void sendEvent({
        data: {
          eventName: "search_submitted",
          sessionId: getAnalyticsSessionId(),
          role: "buyer",
          objectType: "search",
          source: "search_dock",
          metadata: {
            hasCategory: Boolean(category),
            hasBudget: filters.maxPrice !== null,
            quantity,
          },
        },
      }).catch(() => undefined);
    }
  }

  const locationLabel =
    browserPermission === "prompt" && locationStatus === "pending"
      ? "Autorisez votre position…"
      : locationStatus === "pending"
        ? "Localisation en cours…"
        : isPrecise
          ? "Position précise"
          : isApproximate
            ? "Zone approximative"
            : browserPermission === "denied"
              ? "Localisation bloquée"
              : locationStatus === "unavailable"
                ? "Localisation indisponible"
                : "Marché approximatif";

  return (
    <div
      ref={dockRef}
      data-omni-dock="true"
      data-omni-dock-mode={actionMode}
      data-omni-stage="buyer"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:px-5"
    >
      <div className="pointer-events-auto w-full max-w-[42rem] space-y-2.5">
        {structuredRowOpen && (
          <div
            data-omni-dock-row="structured"
            className="omni-atlas-surface grid grid-cols-1 gap-2 rounded-[1.25rem] p-2 sm:grid-cols-[1fr_1fr]"
            aria-label="Paramètres de recherche"
          >
            <div className="rounded-2xl bg-background/72 px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <Label
                  htmlFor="omni-quantity"
                  className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground"
                >
                  Quantité
                </Label>
                <span className="text-[10px] text-muted-foreground">unités</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Diminuer la quantité"
                  onClick={() => {
                    setStructuredOpen(true);
                    onQuantityChange?.(Math.max(1, quantity - 1));
                  }}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary text-foreground transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <Input
                  id="omni-quantity"
                  inputMode="numeric"
                  min={1}
                  value={quantityDraft}
                  onChange={(event) => {
                    setStructuredOpen(true);
                    setQuantityDraft(event.target.value.replace(/\D/g, ""));
                  }}
                  onBlur={commitQuantity}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") commitQuantity();
                  }}
                  className="h-9 min-w-0 flex-1 bg-[var(--atlas-paper)]/70 text-center text-base font-bold sm:text-sm"
                  aria-label="Quantité souhaitée"
                />
                <button
                  type="button"
                  aria-label="Augmenter la quantité"
                  onClick={() => {
                    setStructuredOpen(true);
                    onQuantityChange?.(quantity + 1);
                  }}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary text-foreground transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="rounded-2xl bg-background/72 px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <Label
                  htmlFor="omni-budget"
                  className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground"
                >
                  Budget maximum
                </Label>
                <button
                  type="button"
                  aria-pressed={filters.maxPrice === null}
                  onClick={() => {
                    setStructuredOpen(true);
                    setBudgetDraft("");
                    onFiltersChange({ ...filters, maxPrice: null });
                  }}
                  className={`rounded-full px-2 py-1 text-[10px] font-bold ${filters.maxPrice === null ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}
                >
                  Illimité
                </button>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <Input
                  id="omni-budget"
                  inputMode="numeric"
                  min={0}
                  value={budgetDraft}
                  placeholder="Montant"
                  onChange={(event) => {
                    setStructuredOpen(true);
                    setBudgetDraft(event.target.value.replace(/\D/g, ""));
                  }}
                  onBlur={commitBudget}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") commitBudget();
                  }}
                  className="h-9 min-w-0 flex-1 bg-[var(--atlas-paper)]/70 text-base font-bold sm:text-sm"
                  aria-label="Budget maximum"
                />
                <span className="shrink-0 text-xs text-muted-foreground">
                  {filters.maxPrice === null ? "sans limite" : formatMoney(filters.maxPrice)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div
          data-omni-dock-row="discovery"
          className="flex min-w-0 flex-wrap items-center gap-2"
          aria-label="Découverte et affinage"
        >
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <button
              type="button"
              aria-label={refinementOpen ? "Fermer les options d’affinage" : "Ouvrir les options d’affinage"}
              aria-expanded={refinementOpen}
              onClick={() => setRefinementOpen((open) => !open)}
              className="omni-glass inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-[11px] font-bold text-foreground transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {refinementOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              Affiner
              {activeCount > 0 ? <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">{activeCount}</span> : null}
            </button>
            {!hasExplicitStructuredValues ? (
              <button
                type="button"
                aria-label={structuredOpen ? "Masquer les paramètres" : "Afficher les paramètres"}
                aria-expanded={structuredOpen}
                onClick={() => setStructuredOpen((open) => !open)}
                className="omni-glass inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-[11px] font-bold text-foreground transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {structuredOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                Paramètres
              </button>
            ) : (
              <span className="omni-glass inline-flex min-h-11 items-center rounded-full px-3 text-[11px] font-bold text-primary">Paramètres actifs</span>
            )}
          </div>
          {refinementOpen && (
            <div className="omni-atlas-surface max-h-[min(42dvh,22rem)] min-w-full space-y-2 overflow-y-auto rounded-[1.35rem] p-2 sm:min-w-[22rem]">
              <div className="flex min-w-0 items-center gap-1 rounded-full bg-background/35 p-1">
                <button
                  type="button"
                  aria-label="Catégories précédentes"
                  onClick={() => slide(-1)}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-background/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div
                  ref={railRef}
                  className="flex min-w-0 gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {CHIPS.map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => onCategoryChange(chip.value)}
                      className={`min-h-11 shrink-0 rounded-full px-3 py-2 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        category === chip.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-background/65 text-foreground hover:bg-background"
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  aria-label="Catégories suivantes"
                  onClick={() => slide(1)}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-background/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <RefinementPanel
                filters={filters}
                activeCount={activeCount}
                onFiltersChange={onFiltersChange}
              />
            </div>
          )}
        </div>

        <div
          data-omni-dock-row="context"
          className="flex min-w-0 items-center justify-start gap-1.5 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {coverageStatus === "loading" && (
            <span className="omni-glass rounded-full px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">
              <LoaderCircle
                className="mr-1.5 inline-block h-3.5 w-3.5 animate-spin"
                aria-hidden="true"
              />
              Recherche de la zone…
            </span>
          )}
          {coverageStatus === "ready" && (
            <span className="omni-glass rounded-full px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">
              Zone cartographiée
            </span>
          )}
          {coverageStatus === "error" && (
            <>
              <span className="omni-glass rounded-full border border-destructive/25 px-3 py-1.5 text-[11px] font-semibold text-destructive">
                Résultats non actualisés
              </span>
              {onRetryCoverage ? (
                <button
                  type="button"
                  onClick={onRetryCoverage}
                  className="omni-glass rounded-full px-3 py-1.5 text-[11px] font-bold text-primary"
                >
                  Réessayer
                </button>
              ) : null}
            </>
          )}
          <span
            data-omni-browser-permission={browserPermission}
            data-omni-location-band={isPrecise ? "precise" : isApproximate ? "approximate" : "none"}
            className={`omni-glass rounded-full px-3 py-1.5 text-[11px] font-semibold ${
              isPrecise
                ? "text-primary"
                : isApproximate
                  ? "text-amber-800"
                  : "text-muted-foreground"
            }`}
            data-omni-location-status={locationStatus}
          >
            {locationStatus === "pending" && (
              <LoaderCircle
                className="mr-1.5 inline-block h-3.5 w-3.5 animate-spin"
                aria-hidden="true"
              />
            )}
            {locationLabel}
          </span>
          {isApproximate && onRequestLocation && (
            <button
              type="button"
              onClick={onRequestLocation}
              className="omni-glass rounded-full px-3 py-1.5 text-[11px] font-bold text-primary"
            >
              Affiner ma position
            </button>
          )}
          {locationStatus === "unavailable" && onRequestLocation && (
            <button
              type="button"
              onClick={onRequestLocation}
              className="omni-glass rounded-full px-3 py-1.5 text-[11px] font-bold text-primary"
            >
              Réessayer
            </button>
          )}
          {locationStatus !== "pending" && !isPrecise && onUseMarketFallback && (
            <button
              type="button"
              onClick={onUseMarketFallback}
              className="rounded-full px-3 py-1.5 text-[11px] font-semibold text-muted-foreground underline underline-offset-2"
            >
              Explorer le marché approximatif
            </button>
          )}
        </div>

        {actionMode === "loading" && (
          <div data-omni-dock-row="action" className="flex justify-center gap-2">
            <span className="omni-glass rounded-full px-3 py-2 text-[11px] font-semibold text-muted-foreground">
              <LoaderCircle className="mr-1.5 inline-block h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Recherche en cours…
            </span>
          </div>
        )}

        {(actionMode === "results" || actionMode === "request") && (
          <div data-omni-dock-row="action" className="flex justify-center gap-2">
            {resultCount > 0 ? (
              <>
                <span className="omni-glass rounded-full px-3 py-2 text-[11px] font-semibold text-muted-foreground">
                  {resultCount} résultat{resultCount > 1 ? "s" : ""}
                </span>
                {onVerifyAvailability && (
                  <button
                    type="button"
                    onClick={onVerifyAvailability}
                    className="rounded-full bg-primary px-4 py-2 text-[11px] font-bold text-primary-foreground shadow-[var(--shadow-soft)] transition-transform active:scale-[0.98]"
                  >
                    Comparer les disponibilités
                  </button>
                )}
              </>
            ) : (
              <div className="omni-glass flex w-full items-center justify-between gap-3 rounded-2xl border border-primary/15 bg-card/90 p-3 shadow-[var(--shadow-soft)]">
                <div className="min-w-0">
                  <p className="text-xs font-bold">Dites-nous ce que vous cherchez</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {query.trim() || (category ? categoryLabel(category) : "Votre demande")}
                  </p>
                </div>
                {onVerifyAvailability && (
                  <button
                    type="button"
                    onClick={onVerifyAvailability}
                    className="shrink-0 rounded-full bg-primary px-3 py-2 text-[11px] font-bold text-primary-foreground"
                  >
                    Créer une demande
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div data-omni-dock-row="primary" className="omni-atlas-surface rounded-[1.6rem] p-1.5">
          <SmartSearchBar
            layout="dock"
            value={query}
            onChange={onQueryChange}
            onSubmit={() => void handleSubmit()}
            placeholder="Chercher un produit ou un commerce"
            enablePhotoSearch={false}
          />
        </div>
      </div>
    </div>
  );
}

type RefinementPanelProps = {
  filters: MapFilters;
  activeCount: number;
  onFiltersChange: (value: MapFilters) => void;
};

function RefinementPanel({ filters, activeCount, onFiltersChange }: RefinementPanelProps) {
  function patchFilters(next: Partial<MapFilters>) {
    onFiltersChange({ ...filters, ...next });
  }

  return (
    <div
      data-omni-refinement="true"
      className="omni-atlas-surface space-y-3 rounded-[1.25rem] p-3"
      aria-label="Options d'affinage"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold">Affiner la recherche</p>
          <p className="text-[11px] text-muted-foreground">
            Ajustez la zone, le budget et les priorités.
          </p>
        </div>
        {activeCount > 0 && (
          <span className="shrink-0 rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground">
            {activeCount} actif{activeCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Rayon</Label>
          <span className="text-xs text-muted-foreground">
            {filters.radiusKm >= 50 ? "Monde" : `${filters.radiusKm} km`}
          </span>
        </div>
        <Slider
          min={1}
          max={50}
          step={1}
          value={[filters.radiusKm]}
          onValueChange={([value]) => patchFilters({ radiusKm: value ?? 10 })}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-xl bg-background/55 px-3 py-2">
          <Label htmlFor="omni-open-only" className="text-xs">
            Ouverts maintenant
          </Label>
          <Switch
            id="omni-open-only"
            checked={filters.openOnly}
            onCheckedChange={(value) => patchFilters({ openOnly: value })}
          />
        </div>
        <div className="flex items-center justify-between rounded-xl bg-background/55 px-3 py-2">
          <Label htmlFor="omni-discount-only" className="text-xs">
            Avec réduction
          </Label>
          <Switch
            id="omni-discount-only"
            checked={filters.discountOnly}
            onCheckedChange={(value) => patchFilters({ discountOnly: value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Trier par</Label>
        <div className="grid grid-cols-3 gap-1">
          {(
            [
              ["rank", "Pertinence"],
              ["distance", "Proximité"],
              ["price", "Prix"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => patchFilters({ sort: value })}
              className={`min-h-11 rounded-full px-3 py-2 text-[11px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                filters.sort === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="w-full"
        onClick={() => onFiltersChange(DEFAULT_FILTERS)}
      >
        Réinitialiser
      </Button>
    </div>
  );
}
