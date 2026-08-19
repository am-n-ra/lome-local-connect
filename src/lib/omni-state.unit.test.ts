import { describe, expect, it } from "vitest";
import { deriveOmniMotionState, deriveOmniSurfaceState } from "./omni-state";

describe("Omni map motion state", () => {
  it("keeps the globe in idle when no operation is active", () => {
    expect(deriveOmniMotionState({})).toBe("idle");
  });

  it("prioritizes locating before search", () => {
    expect(deriveOmniMotionState({ locating: true, searching: true })).toBe("searching");
    expect(deriveOmniMotionState({ locating: true })).toBe("locating");
  });

  it("distinguishes region reveal from final result framing", () => {
    expect(deriveOmniMotionState({ revealRunning: true, revealLabel: "Région" })).toBe(
      "revealing-region",
    );
    expect(deriveOmniMotionState({ revealRunning: true, revealLabel: "Votre position" })).toBe(
      "revealing-results",
    );
  });

  it("prioritizes transaction and selection contexts", () => {
    expect(deriveOmniMotionState({ transaction: true, selected: true })).toBe("transaction");
    expect(deriveOmniMotionState({ selected: true })).toBe("selected");
  });
});

describe("Omni surface state", () => {
  it("represents the auth and replay states before ordinary search results", () => {
    const base = {
      hasSearch: true,
      hasResults: false,
      selectedFacility: false,
      availabilityOpen: false,
    };
    expect(deriveOmniSurfaceState({ ...base, authRequired: true })).toBe("auth_required");
    expect(deriveOmniSurfaceState({ ...base, onboarding: true })).toBe("onboarding");
    expect(deriveOmniSurfaceState({ ...base, searchRestored: true })).toBe("search_restored");
  });

  it("keeps search results visible after reveal completes", () => {
    expect(
      deriveOmniSurfaceState({
        hasSearch: true,
        hasResults: true,
        selectedFacility: false,
        availabilityOpen: false,
        revealRunning: false,
      }),
    ).toBe("search_results");
  });
});
