import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Minus,
  Plus,
  SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { BrandMark } from "@/components/omni/BrandMark";
import { SmartSearchBar } from "@/components/omni/SmartSearchBar";
import { categoryLabel, CATEGORIES, LOCATION_APPROXIMATE_ACCURACY_METERS } from "@/lib/omni";
import { useMarket } from "@/lib/market";

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
  onBrandClick?: () => void;
  onVerifyAvailability?: () => void;
  quantity?: number;
  onQuantityChange?: (value: number) => void;
  locationStatus?: "pending" | "granted" | "fallback" | "unavailable";
  browserPermission?: "unknown" | "prompt" | "granted" | "denied" | "unsupported";
  locationAccuracy?: number | null;
  locationCoordinates?: { lat: number; lng: number } | null;
  locationRequestId?: number | null;
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
  onBrandClick,
  onVerifyAvailability,
  quantity = 1,
  onQuantityChange,
  locationStatus = "fallback",
  browserPermission = "unknown",
  locationAccuracy = null,
  locationCoordinates = null,
  locationRequestId = null,
  onRequestLocation,
  onUseMarketFallback,
}: Props) {
  const { formatMoney } = useMarket();
  const dockRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const activeCount = activeFilterCount(filters);
  const hasIntent = Boolean(query.trim() || category);
  const isPrecise =
    locationStatus === "granted" &&
    locationAccuracy != null &&
    locationAccuracy <= LOCATION_APPROXIMATE_ACCURACY_METERS;
  const isApproximate =
    locationStatus === "granted" &&
    locationAccuracy != null &&
    locationAccuracy > LOCATION_APPROXIMATE_ACCURACY_METERS;
  const accuracyText = locationAccuracy != null ? `±${Math.round(locationAccuracy)} m` : "";

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

  function patchFilters(next: Partial<MapFilters>) {
    onFiltersChange({ ...filters, ...next });
  }

  function slide(direction: 1 | -1) {
    railRef.current?.scrollBy({
      left: direction * Math.max(180, railRef.current.clientWidth * 0.75),
      behavior: "smooth",
    });
  }

  const locationLabel =
    locationStatus === "pending"
      ? "Autorisation de localisation en cours…"
      : isPrecise
        ? `Position GPS précise · ${accuracyText}`
        : isApproximate
          ? `Zone réseau approximative · ${accuracyText}`
          : browserPermission === "denied"
            ? "Localisation bloquée — autorisez-la puis réessayez"
            : locationStatus === "unavailable"
              ? "Localisation indisponible — réessayez"
              : "Marché approximatif — aucune position exacte";

  return (
    <div
      ref={dockRef}
      data-omni-dock="true"
      data-omni-dock-mode={hasIntent ? (resultCount > 0 ? "results" : "request") : "idle"}
      className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+0.85rem)] sm:px-5"
    >
      <div className="pointer-events-auto w-full max-w-4xl space-y-2.5">
        <div className="flex items-center justify-between px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-foreground/55">
          <span>Omni · le monde est recherchable</span>
          {hasIntent && (
            <span>
              {resultCount} résultat{resultCount === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {hasIntent && (
          <div
            data-omni-dock-row="structured"
            className="omni-glass grid grid-cols-2 gap-2 rounded-[1.4rem] p-2 sm:grid-cols-[1fr_1fr_auto]"
          >
            <div className="rounded-2xl bg-background/72 px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Quantité
                </span>
                <span className="text-[10px] text-muted-foreground">unités</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-3">
                <button
                  type="button"
                  aria-label="Diminuer la quantité"
                  onClick={() => onQuantityChange?.(Math.max(1, quantity - 1))}
                  className="grid h-7 w-7 place-items-center rounded-full bg-secondary text-foreground transition-transform active:scale-95"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <strong className="text-base" aria-live="polite">
                  {quantity}
                </strong>
                <button
                  type="button"
                  aria-label="Augmenter la quantité"
                  onClick={() => onQuantityChange?.(quantity + 1)}
                  className="grid h-7 w-7 place-items-center rounded-full bg-secondary text-foreground transition-transform active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="rounded-2xl bg-background/72 px-3 py-2.5">
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Budget maximum
              </div>
              <div className="mt-2 truncate text-sm font-bold">
                {filters.maxPrice === null ? "À définir" : formatMoney(filters.maxPrice)}
              </div>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Ouvrir les filtres"
                  className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-background/72 px-3 text-xs font-bold text-foreground transition-colors hover:bg-background"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="hidden sm:inline">Affiner</span>
                  {activeCount > 0 && (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
                      {activeCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" side="top" className="w-80 space-y-4 rounded-2xl">
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Budget maximum</Label>
                    <span className="text-xs text-muted-foreground">
                      {filters.maxPrice === null ? "À définir" : formatMoney(filters.maxPrice)}
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={100000}
                    step={1000}
                    value={[filters.maxPrice ?? 0]}
                    onValueChange={([value]) => patchFilters({ maxPrice: value ? value : null })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="omni-open-only" className="text-xs">
                    Ouverts maintenant
                  </Label>
                  <Switch
                    id="omni-open-only"
                    checked={filters.openOnly}
                    onCheckedChange={(value) => patchFilters({ openOnly: value })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="omni-discount-only" className="text-xs">
                    Avec réduction
                  </Label>
                  <Switch
                    id="omni-discount-only"
                    checked={filters.discountOnly}
                    onCheckedChange={(value) => patchFilters({ discountOnly: value })}
                  />
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
              </PopoverContent>
            </Popover>
          </div>
        )}

        <div data-omni-dock-row="discovery" className="flex items-center gap-2">
          <button
            type="button"
            aria-label={categoriesOpen ? "Masquer les catégories" : "Afficher les catégories"}
            aria-expanded={categoriesOpen}
            onClick={() => setCategoriesOpen((open) => !open)}
            className="omni-glass grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-transform active:scale-95"
          >
            {categoriesOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
          {categoriesOpen && (
            <div className="omni-glass flex min-w-0 flex-1 items-center gap-1 rounded-full p-1">
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
          )}
        </div>

        <div
          data-omni-dock-row="context"
          className="flex flex-wrap items-center justify-center gap-2"
        >
          <span
            className={`omni-glass rounded-full px-3 py-1.5 text-[11px] font-semibold ${
              isPrecise
                ? "text-primary"
                : isApproximate
                  ? "text-amber-800"
                  : "text-muted-foreground"
            }`}
            data-omni-location-status={locationStatus}
            data-omni-location-lat={locationCoordinates?.lat ?? ""}
            data-omni-location-lng={locationCoordinates?.lng ?? ""}
            data-omni-location-accuracy={locationAccuracy ?? ""}
          >
            {locationLabel}
          </span>
          {locationStatus === "granted" && locationCoordinates && (
            <details className="omni-glass rounded-full px-3 py-1.5 text-[11px] text-muted-foreground">
              <summary className="cursor-pointer list-none font-bold">Détails</summary>
              <span className="ml-2 whitespace-nowrap font-mono text-[10px]">
                lat {locationCoordinates.lat.toFixed(6)}, lng {locationCoordinates.lng.toFixed(6)}
                {locationRequestId != null ? ` · requête ${locationRequestId}` : ""}
              </span>
            </details>
          )}
          {isApproximate && onRequestLocation && (
            <button
              type="button"
              onClick={onRequestLocation}
              className="omni-glass rounded-full px-3 py-1.5 text-[11px] font-bold text-primary"
            >
              Réessayer en GPS précis
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

        {hasIntent && (
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
            onSubmit={onSubmit}
            placeholder="Que cherchez-vous dans le monde ?"
            enablePhotoSearch={false}
            trailing={
              <button
                type="button"
                aria-label="Omni"
                onClick={onBrandClick}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 transition-transform hover:scale-105"
              >
                <BrandMark className="h-7 w-7" />
              </button>
            }
          />
        </div>
      </div>
    </div>
  );
}
