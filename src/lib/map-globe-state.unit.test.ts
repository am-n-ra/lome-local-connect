import { describe, expect, it } from "vitest";

import {
  compareCameraPriority,
  nextRevealToken,
  shouldAcceptCameraIntent,
  shouldCancelReveal,
} from "./map-globe-state";

describe("map/globe camera contract", () => {
  it("gives manual interaction priority over every automated intent", () => {
    expect(shouldAcceptCameraIntent("search_reveal", "manual_navigation")).toBe(true);
    expect(shouldAcceptCameraIntent("selected_facility", "result_framing")).toBe(false);
    expect(compareCameraPriority("resting_globe", "selected_facility")).toBeGreaterThan(0);
  });

  it("cancels an active reveal for user, selection, provider and lifecycle interruptions", () => {
    expect(shouldCancelReveal("manual_interaction")).toBe(true);
    expect(shouldCancelReveal("new_search")).toBe(true);
    expect(shouldCancelReveal("selected_facility")).toBe(true);
    expect(shouldCancelReveal("provider_error")).toBe(true);
    expect(shouldCancelReveal("unmount")).toBe(true);
  });

  it("generates monotonic reveal tokens and recovers invalid counters", () => {
    expect(nextRevealToken(0)).toBe(1);
    expect(nextRevealToken(42)).toBe(43);
    expect(nextRevealToken(Number.NaN)).toBe(1);
    expect(nextRevealToken(-1)).toBe(1);
  });
});
