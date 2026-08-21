import { describe, expect, it, beforeEach } from "vitest";
import { actionRegistry, validateActionRegistry } from "./action-registry";
import { initialSurfaceState, reduceSurface } from "./surface-state";
import { rejectClientAuthority } from "../server/authority";
import { auditLog, executeIdempotent, resetProofLedger } from "../server/ledger";

describe("V0 surface contract", () => {
  it("keeps the map context while opening and closing surfaces", () => {
    const opened = reduceSurface(initialSurfaceState, { type: "open", surface: "dock" });
    const withQuery = reduceSurface(opened, { type: "set-query", query: "maize" });
    const result = reduceSurface(withQuery, { type: "open", surface: "result", returnSurface: "dock" });
    const closed = reduceSurface(result, { type: "close" });
    expect(result.active).toBe("result");
    expect(result.query).toBe("maize");
    expect(closed.active).toBe("map");
    expect(closed.query).toBe("maize");
  });
});

describe("V0 action registry", () => {
  it("has no incomplete or duplicate actions", () => {
    expect(validateActionRegistry()).toEqual([]);
    expect(actionRegistry.length).toBeGreaterThan(0);
  });
});

describe("V0 authority and idempotency", () => {
  beforeEach(() => resetProofLedger());

  it("rejects client-authoritative values", () => {
    expect(() => rejectClientAuthority("status")).toThrow(/status/);
  });

  it("returns one result and one audit event for duplicate mutation keys", () => {
    const first = executeIdempotent("fixture.mutation", { actor: "buyer", idempotencyKey: "same-key" }, () => ({ value: 1 }));
    const second = executeIdempotent("fixture.mutation", { actor: "buyer", idempotencyKey: "same-key" }, () => ({ value: 2 }));
    expect(first).toEqual(second);
    expect(auditLog()).toHaveLength(1);
  });
});
