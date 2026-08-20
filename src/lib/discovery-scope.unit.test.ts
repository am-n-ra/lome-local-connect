import { describe, expect, it } from "vitest";

import { applyFreeDiscoveryScope, type DiscoveryScope } from "./discovery-scope.server";

function build(scope: DiscoveryScope, shouldApply = true) {
  const clauses = ["f.is_online = true"];
  const params: unknown[] = [];
  applyFreeDiscoveryScope(clauses, params, scope, shouldApply);
  return { clauses, params };
}

describe("discovery scope", () => {
  it("does not restrict Pro discovery", () => {
    expect(build({ plan: "pro", city: "London", marketCode: "GLOBAL" })).toEqual({
      clauses: ["f.is_online = true"],
      params: [],
    });
  });

  it("uses the resolved city and preserves null-city migration fallback", () => {
    const result = build({ plan: "free", city: "Lomé", marketCode: "TG-LOME" });
    expect(result.params).toEqual(["Lomé", "TG-LOME"]);
    expect(result.clauses[1]).toContain("lower(f.city) = lower($1)");
    expect(result.clauses[1]).toContain("f.city IS NULL AND f.market_code = $2");
  });

  it("falls back to market scope only while city resolution is missing", () => {
    expect(build({ plan: "free", city: null, marketCode: "TG-LOME" })).toEqual({
      clauses: ["f.is_online = true", "f.market_code = $1"],
      params: ["TG-LOME"],
    });
  });

  it("does not invent a boundary without a known city or market", () => {
    expect(build({ plan: "free", city: null, marketCode: null })).toEqual({
      clauses: ["f.is_online = true"],
      params: [],
    });
  });

  it("can be disabled for resting discovery", () => {
    expect(build({ plan: "free", city: "Lomé", marketCode: "TG-LOME" }, false)).toEqual({
      clauses: ["f.is_online = true"],
      params: [],
    });
  });
});
