import { useRef } from "react";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BrandMark } from "@/components/omni/BrandMark";
import { SmartSearchBar } from "@/components/omni/SmartSearchBar";
import { CATEGORIES, formatFcfa } from "@/lib/omni";

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
  sort: "distance",
};

export function activeFilterCount(f: MapFilters): number {
  let n = 0;
  if (f.radiusKm !== DEFAULT_FILTERS.radiusKm) n++;
  if (f.maxPrice !== null) n++;
  if (f.openOnly) n++;
  if (f.discountOnly) n++;
  if (f.sort !== "distance") n++;
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
};

const CHIPS = [{ value: null, label: "Tout" }, ...CATEGORIES.map((c) => ({ ...c }))] as {
  value: string | null;
  label: string;
}[];

/**
 * Bottom-anchored frosted dock: search pill (photo + voice + brand action),
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
}: Props) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const activeCount = activeFilterCount(filters);

  function slide(direction: 1 | -1) {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * Math.max(160, rail.clientWidth * 0.75), behavior: "smooth" });
  }

  function patch(next: Partial<MapFilters>) {
    onFiltersChange({ ...filters, ...next });
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-3 pb-4">
      <div className="pointer-events-auto w-full max-w-xl space-y-2">
        {/* Category carousel: three chips visible, arrows on desktop, swipe on mobile. */}
        <div className="omni-glass grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1 rounded-full p-1">
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
        </div>

        {/* Filters + result count */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="omni-glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filtres
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
                    {filters.maxPrice === null ? "Tous" : formatFcfa(filters.maxPrice)}
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
                      ["distance", "Proximité"],
                      ["price", "Prix"],
                      ["rank", "Pertinence"],
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

          <span className="omni-glass rounded-full px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
            {resultCount} résultat(s)
          </span>
        </div>

        {/* Search pill */}
        <SmartSearchBar
          layout="dock"
          value={query}
          onChange={onQueryChange}
          onSubmit={onSubmit}
          placeholder="Que cherchez-vous ?"
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
  );
}
