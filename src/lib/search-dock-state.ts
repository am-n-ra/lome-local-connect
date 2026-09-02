export type SearchDockActionMode = "idle" | "loading" | "results" | "request" | "error";

export function hasExplicitStructuredValues(quantity: number, maxPrice: number | null): boolean {
  return quantity !== 1 || maxPrice !== null;
}

export function shouldShowStructuredRow(
  structuredOpen: boolean,
  quantity: number,
  maxPrice: number | null,
): boolean {
  return structuredOpen || hasExplicitStructuredValues(quantity, maxPrice);
}

export function deriveSearchDockActionMode(input: {
  activeSearch: boolean;
  resultCount: number;
  coverageStatus: "idle" | "loading" | "ready" | "error";
}): SearchDockActionMode {
  if (!input.activeSearch) return "idle";
  if (input.coverageStatus === "loading") return "loading";
  if (input.coverageStatus === "error") return "error";
  return input.resultCount > 0 ? "results" : "request";
}

export function isSubmitWithinGuard(
  now: number,
  previous: number,
  windowMs = 450,
): boolean {
  return now - previous < windowMs;
}
