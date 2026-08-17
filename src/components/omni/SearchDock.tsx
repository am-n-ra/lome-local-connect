import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
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

export type MapFilters = {
  radiusKm: number;
  maxPrice: number | null;
  openOnly: boolean;
  discountOnly: boolean;
  sort: "distance" | "price" | "rank";
};

export const DEFAULT_FILTERS: MapFilters = {
  radiusKm: 10,
  maxPrice: null,
  openOnly: false,
  discountOnly: false,
  sort: "rank",
};

export function activeFilterCount(filters: MapFilters): number {
  return [
    filters.radiusKm !== DEFAULT_FILTERS.radiusKm,
    filters.maxPrice !== null,
    filters.openOnly,
    filters.discountOnly,
    filters.sort !== DEFAULT_FILTERS.sort,
  ].filter(Boolean).length;
}

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
}: Props) {
  const { formatMoney } = useMarket();
  const sendEvent = useServerFn(recordProductEvent);
  const dockRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [parametersOpen, setParametersOpen] = useState(false);
  const [quantityDraft, setQuantityDraft] = useState(String(quantity));
  const [budgetDraft, setBudgetDraft] = useState(
    filters.maxPrice == null ? "" : String(filters.maxPrice),
  );
  const activeCount = activeFilterCount(filters);
  const hasExplicitStructuredValues = quantity !== 1 || filters.maxPrice !== null;
  const controlsOpen = parametersOpen || hasExplicitStructuredValues;
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
    onQuantityChange?.(next);
  }

  function commitBudget() {
    const parsed = Number.parseInt(budgetDraft, 10);
    const next = Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
    setBudgetDraft(next == null ? "" : String(next));
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
    locationStatus === "pending"
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
      data-omni-dock-mode={activeSearch ? (resultCount > 0 ? "results" : "request") : "idle"}

      className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+0.85rem)] sm:px-5"
    >
      <div className="pointer-events-auto w-full max-w-4xl space-y-2.5">
        <div className="flex items-center justify-between px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-foreground/55">
          <span>Omni · le monde est recherchable</span>
          {activeSearch && (
            <span>
              {resultCount} résultat{resultCount === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {controlsOpen && (
          <div
            data-omni-dock-row="structured"
            className="omni-glass grid grid-cols-1 gap-2 rounded-[1.4rem] p-2 sm:grid-cols-[1fr_1fr]"
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
                  onClick={() => onQuantityChange?.(Math.max(1, quantity - 1))}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-foreground transition-transform active:scale-95"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <Input
                  id="omni-quantity"
                  inputMode="numeric"
                  min={1}
                  value={quantityDraft}
                  onChange={(event) => setQuantityDraft(event.target.value.replace(/\D/g, ""))}
                  onBlur={commitQuantity}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") commitQuantity();
                  }}
                  className="h-9 min-w-0 flex-1 bg-background/70 text-center text-sm font-bold"
                  aria-label="Quantité souhaitée"
                />
                <button
                  type="button"
                  aria-label="Augmenter la quantité"
                  onClick={() => onQuantityChange?.(quantity + 1)}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-foreground transition-transform active:scale-95"
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
                  onChange={(event) => setBudgetDraft(event.target.value.replace(/\D/g, ""))}
                  onBlur={commitBudget}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") commitBudget();
                  }}
                  className="h-9 min-w-0 flex-1 bg-background/70 text-sm font-bold"
                  aria-label="Budget maximum"
                />
                <span className="shrink-0 text-xs text-muted-foreground">
                  {filters.maxPrice === null ? "sans limite" : formatMoney(filters.maxPrice)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div data-omni-dock-row="discovery" className="flex items-center gap-2">
          <button
            type="button"
            aria-label={controlsOpen ? "Masquer les paramètres" : "Afficher les paramètres"}
            aria-expanded={controlsOpen}
            onClick={() => setParametersOpen((open) => !open)}
            className="omni-glass grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-transform active:scale-95"
          >
            {controlsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          {controlsOpen && (
            <div className="omni-glass min-w-0 flex-1 space-y-2 rounded-[1.35rem] p-2">
              {hasExplicitStructuredValues && !parametersOpen && (
                <p className="px-2 text-[11px] text-muted-foreground">
                  Paramètres actifs. Ouvrez le chevron pour les modifier.
                </p>
              )}
              <div className="flex min-w-0 items-center gap-1 rounded-full bg-background/35 p-1">
                <button
                  type="button"
                  aria-label="Catégories précédentes"
                  onClick={() => slide(-1)}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-background/60"
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
                      className={`shrink-0 rounded-full px-3 py-2 text-[11px] font-bold transition-colors ${
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
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-background/60"
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
          className="flex flex-wrap items-center justify-center gap-2"
        >
          {coverageStatus !== "idle" && (
            <span className="omni-glass rounded-full px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">
              {coverageStatus === "loading" && (
                <LoaderCircle
                  className="mr-1.5 inline-block h-3.5 w-3.5 animate-spin"
                  aria-hidden="true"
                />
              )}
              {coverageStatus === "loading"
                ? "Exploration en cours…"
                : coverageStatus === "error"
                  ? "Exploration indisponible"
                  : "Zone cartographiée"}
            </span>
          )}
          <span
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

        {activeSearch && (
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
                    Vérifier la disponibilité
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

        <div
          data-omni-dock-row="primary"
          className="omni-glass rounded-[1.6rem] p-1.5 shadow-[var(--shadow-soft)]"
        >
          <SmartSearchBar
            layout="dock"
            value={query}
            onChange={onQueryChange}
            onSubmit={() => void handleSubmit()}
            placeholder="Que cherchez-vous dans le monde ?"
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
      className="space-y-3 rounded-2xl bg-background/55 p-3"
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
              className={`rounded-full px-2 py-1.5 text-[11px] font-bold ${
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
