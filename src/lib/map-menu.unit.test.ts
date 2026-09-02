import { beforeEach, describe, expect, it } from "vitest";
import {
  clearMapContext,
  createMapContextSnapshot,
  readMapContext,
  saveMapContext,
} from "@/lib/map-context";
import { createMenuAction, filterMenuActions } from "@/lib/omni-menu";
import { DEFAULT_FILTERS } from "@/lib/search-dock-contract";

describe("map context adapter", () => {
  beforeEach(() => {
    clearMapContext();
  });

  it("round-trips only safe map/search context", () => {
    const snapshot = createMapContextSnapshot({
      route: "/carte",
      role: "acheteur",
      query: "riz",
      category: null,
      filters: DEFAULT_FILTERS,
      quantity: 2,
      budget: null,
      selectedFacilityId: "facility-1",
      viewport: { west: 1, south: 6, east: 2, north: 7, zoom: 10 },
      returnTo: "/carte",
    });
    saveMapContext(snapshot);
    expect(readMapContext()).toMatchObject({ query: "riz", quantity: 2, selectedFacilityId: "facility-1" });
    expect(JSON.stringify(readMapContext())).not.toContain("token");
  });

  it("rejects expired context and clears it", () => {
    const now = Date.now();
    const snapshot = createMapContextSnapshot({
      route: "/vendeur",
      role: "vendeur",
      query: "",
      category: null,
      filters: DEFAULT_FILTERS,
      quantity: 1,
      budget: null,
      selectedFacilityId: "facility-1",
      viewport: null,
      returnTo: "/vendeur",
      ttlMs: 1_000,
    }, now);
    saveMapContext(snapshot);
    expect(readMapContext(now + 2_000)).toBeNull();
  });
});

describe("menu action registry", () => {
  const buyerOnly = createMenuAction({
    id: "buyer-orders",
    label: "Transactions",
    icon: "↺",
    surface: "transactions",
    roles: ["acheteur"],
    requiresAuth: true,
    onSelect: () => undefined,
  });
  const sellerOnly = createMenuAction({
    id: "seller-scanner",
    label: "Scanner QR",
    icon: "▣",
    surface: "scanner",
    roles: ["vendeur"],
    requiresAuth: true,
    onSelect: () => undefined,
  });

  it("filters by active role while keeping auth-gated actions explicit", () => {
    expect(filterMenuActions([buyerOnly, sellerOnly], "acheteur", false).map((item) => item.id)).toEqual(["buyer-orders"]);
    expect(filterMenuActions([buyerOnly, sellerOnly], "vendeur", true).map((item) => item.id)).toEqual(["seller-scanner"]);
  });
});
