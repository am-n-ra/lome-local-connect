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
