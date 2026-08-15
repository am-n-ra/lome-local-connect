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
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BrandMark } from "@/components/omni/BrandMark";
import { SmartSearchBar } from "@/components/omni/SmartSearchBar";
import { categoryLabel, CATEGORIES } from "@/lib/omni";
import { useMarket } from "@/lib/market";

export type MapFilters = {
  /** Max distance from the user, in km. */
  radiusKm: number;
  /** Max product price in the local currency, or null for no cap. */
  maxPrice: number | null;
  /** Only facilities currently open. */
  openOnly: boolean;
  /** Only facilities running a discount. */
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

export function activeFilterCount(f: MapFilters): number {
  let n = 0;
  if (f.radiusKm !== DEFAULT_FILTERS.radiusKm) n++;
  if (f.maxPrice !== null) n++;
  if (f.openOnly) n++;
  if (f.discountOnly) n++;
  if (f.sort !== DEFAULT_FILTERS.sort) n++;
  return n;
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
  onRequestLocation?: () => void;
  onUseMarketFallback?: () => void;
};

const CHIPS = [{ value: null, label: "Tout" }, ...CATEGORIES.map((c) => ({ ...c }))] as {
  value: string | null;
  label: string;
}[];

/**
 * Bottom-anchored frosted dock: search pill, manual parameters,
 * a horizontally sliding category carousel and the result filters.
 */
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
  onRequestLocation,
  onUseMarketFallback,
}: Props) {
  const { formatMoney } = useMarket();
  const railRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const activeCount = activeFilterCount(filters);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  useEffect(() => {
    const dock = dockRef.current;
    if (!dock) return;
    const updateClearance = () => {
      document.documentElement.style.setProperty(
        "--omni-dock-clearance",
        `${Math.ceil(dock.getBoundingClientRect().height + 20)}px`,
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
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * Math.max(160, rail.clientWidth * 0.75), behavior: "smooth" });
  }

  function patch(next: Partial<MapFilters>) {
    onFiltersChange({ ...filters, ...next });
  }

  return (
    <div
      ref={dockRef}
      data-omni-dock="true"
      data-omni-dock-mode={
        query.trim() || category ? (resultCount > 0 ? "results" : "request") : "idle"
      }
      className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]"
    >
      <div className="pointer-events-auto w-full max-w-xl space-y-2">
        <div data-omni-dock-row="discovery" className="flex justify-center">
          <button
            type="button"
            aria-label={categoriesOpen ? "Masquer les catégories" : "Afficher les catégories"}
            aria-expanded={categoriesOpen}
            onClick={() => setCategoriesOpen((open) => !open)}
            className="omni-glass rounded-full p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            {categoriesOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
        </div>

        {categoriesOpen && (
          <div
            data-omni-dock-row="discovery"
            className="omni-glass grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-1 rounded-full p-1"
          >
            <button
              type="button"
              aria-label="Catégories précédentes"
              onClick={() => slide(-1)}
              className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div
              ref={railRef}
              className="flex min-w-0 snap-x snap-mandatory items-center gap-1.5 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {CHIPS.map((c) => {
                const active = category === c.value;
                return (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => onCategoryChange(c.value)}
                    className={`w-[calc((100%-0.75rem)/3)] shrink-0 snap-start truncate rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-background/60 text-foreground hover:bg-background/80"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              aria-label="Catégories suivantes"
              onClick={() => slide(1)}
              className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="omni-glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  {activeCount > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
                      {activeCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" side="top" className="w-72 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Proximité</Label>
                    <span className="text-xs text-muted-foreground">
                      {filters.radiusKm >= 50 ? "Sans limite" : `${filters.radiusKm} km`}
                    </span>
                  </div>
                  <Slider
                    min={1}
                    max={50}
                    step={1}
                    value={[filters.radiusKm]}
                    onValueChange={([v]) => patch({ radiusKm: v ?? 10 })}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Prix maximum</Label>
                    <span className="text-xs text-muted-foreground">
                      {filters.maxPrice === null ? "Tous" : formatMoney(filters.maxPrice)}
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={100000}
                    step={1000}
                    value={[filters.maxPrice ?? 0]}
                    onValueChange={([v]) => patch({ maxPrice: !v ? null : v })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="filter-open" className="text-xs">
                    Ouverts maintenant
                  </Label>
                  <Switch
                    id="filter-open"
                    checked={filters.openOnly}
                    onCheckedChange={(v) => patch({ openOnly: v })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="filter-discount" className="text-xs">
                    Avec réduction
                  </Label>
                  <Switch
                    id="filter-discount"
                    checked={filters.discountOnly}
                    onCheckedChange={(v) => patch({ discountOnly: v })}
                  />
                </div>

                <div className="space-y-1.5">
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
                        onClick={() => patch({ sort: value })}
                        className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
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

        {(query.trim() || category) && (
          <div
            data-omni-dock-row="structured"
            className="omni-glass mx-auto grid max-w-xl grid-cols-2 gap-2 rounded-2xl p-2 text-xs sm:grid-cols-4"
          >
            <div className="rounded-xl bg-background/60 p-2">
              <span className="text-muted-foreground">Quantité</span>
              <div className="mt-1 flex items-center justify-between gap-2">
                <button
                  type="button"
                  aria-label="Diminuer la quantité"
                  onClick={() => onQuantityChange?.(Math.max(1, quantity - 1))}
                  className="rounded-full bg-secondary p-1 text-foreground"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <strong aria-live="polite">{quantity}</strong>
                <button
                  type="button"
                  aria-label="Augmenter la quantité"
                  onClick={() => onQuantityChange?.(quantity + 1)}
                  className="rounded-full bg-secondary p-1 text-foreground"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="rounded-xl bg-background/60 p-2">
              <span className="text-muted-foreground">Budget max</span>
              <div className="mt-1 truncate font-semibold">
                {filters.maxPrice === null ? "Non défini" : formatMoney(filters.maxPrice)}
              </div>
            </div>
          </div>
        )}

        <div
          data-omni-dock-row="context"
          className="flex flex-wrap items-center justify-center gap-2"
        >
          <span
            className={`omni-glass rounded-full px-3 py-1.5 text-[11px] font-medium ${
              locationStatus === "granted" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {locationStatus === "granted"
              ? "Position actuelle active"
              : locationStatus === "pending"
                ? "Autorisation de localisation en cours…"
                : browserPermission === "denied"
                  ? "Localisation bloquée par le navigateur — autorisez-la puis réessayez"
                  : locationStatus === "unavailable"
                    ? "Localisation indisponible — réessayez ou utilisez le marché"
                    : "Marché approximatif — aucune position partagée"}
          </span>
          {locationStatus === "unavailable" && onRequestLocation && (
            <button
              type="button"
              onClick={onRequestLocation}
              className="omni-glass rounded-full px-3 py-1.5 text-[11px] font-semibold text-primary"
            >
              Réessayer
            </button>
          )}
          {locationStatus !== "granted" && locationStatus !== "pending" && onUseMarketFallback && (
            <button
              type="button"
              onClick={onUseMarketFallback}
              className="rounded-full px-3 py-1.5 text-[11px] font-medium text-muted-foreground underline underline-offset-2"
            >
              Utiliser le marché approximatif
            </button>
          )}
        </div>

        {(query.trim() || category) && (
          <div data-omni-dock-row="action" className="space-y-2">
            {resultCount > 0 ? (
              <div className="flex justify-center gap-2">
                <span className="omni-glass rounded-full px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
                  {resultCount} résultat{resultCount > 1 ? "s" : ""}
                </span>
                {onVerifyAvailability && (
                  <button
                    type="button"
                    onClick={onVerifyAvailability}
                    className="omni-glass rounded-full px-3 py-1.5 text-[11px] font-semibold text-primary"
                  >
                    Vérifier la disponibilité de tous
                  </button>
                )}
              </div>
            ) : (
              <div className="omni-glass grid gap-2 rounded-2xl border border-primary/20 bg-card/90 p-3 shadow-[var(--shadow-soft)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0 text-left">
                  <p className="text-sm font-bold">Dites-nous ce que vous cherchez</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {query.trim() || (category ? categoryLabel(category) : "Votre demande")}
                  </p>
                </div>
                {onVerifyAvailability && (
                  <button
                    type="button"
                    onClick={onVerifyAvailability}
                    className="rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
                  >
                    Créer une demande
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Search pill */}
        <div data-omni-dock-row="primary">
          <SmartSearchBar
            layout="dock"
            value={query}
            onChange={onQueryChange}
            onSubmit={onSubmit}
            placeholder="Search for a product or service"
            enablePhotoSearch={false}
            trailing={
              <button
                type="button"
                aria-label="Recentrer sur ma position"
                onClick={onBrandClick}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 transition-transform hover:scale-105"
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
