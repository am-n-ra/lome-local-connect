import { describe, expect, it } from "vitest";
import {
  deriveSearchDockActionMode,
  hasExplicitStructuredValues,
  isSubmitWithinGuard,
  shouldShowStructuredRow,
} from "./search-dock-state";

describe("SearchDock state contract", () => {
  it("keeps untouched defaults quiet and shows explicit structured values", () => {
    expect(hasExplicitStructuredValues(1, null)).toBe(false);
    expect(shouldShowStructuredRow(false, 1, null)).toBe(false);
    expect(shouldShowStructuredRow(true, 1, null)).toBe(true);
    expect(shouldShowStructuredRow(false, 2, null)).toBe(true);
    expect(shouldShowStructuredRow(false, 1, 12000)).toBe(true);
  });

  it("derives mutually exclusive action modes", () => {
    expect(deriveSearchDockActionMode({ activeSearch: false, resultCount: 0, coverageStatus: "idle" })).toBe("idle");
    expect(deriveSearchDockActionMode({ activeSearch: true, resultCount: 0, coverageStatus: "loading" })).toBe("loading");
    expect(deriveSearchDockActionMode({ activeSearch: true, resultCount: 3, coverageStatus: "ready" })).toBe("results");
    expect(deriveSearchDockActionMode({ activeSearch: true, resultCount: 0, coverageStatus: "ready" })).toBe("request");
    expect(deriveSearchDockActionMode({ activeSearch: true, resultCount: 3, coverageStatus: "error" })).toBe("error");
  });

  it("blocks only the duplicate event inside the submit guard window", () => {
    expect(isSubmitWithinGuard(1000, 700)).toBe(true);
    expect(isSubmitWithinGuard(1150, 700)).toBe(false);
    expect(isSubmitWithinGuard(1150, 700, 500)).toBe(true);
  });
});
