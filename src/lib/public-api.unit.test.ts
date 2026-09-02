import { describe, expect, it } from "vitest";
import { CORS, json, listQuerySchema, preflight } from "./public-api.server";

describe("public API query contract", () => {
  it("applies safe defaults for market, limit and offset", () => {
    expect(listQuerySchema.parse({})).toMatchObject({
      market_code: "TG-LOME",
      limit: 50,
      offset: 0,
    });
  });

  it("rejects oversized pages and invalid statuses", () => {
    expect(listQuerySchema.safeParse({ limit: "201" }).success).toBe(false);
    expect(listQuerySchema.safeParse({ status: "draft" }).success).toBe(false);
  });

  it("bounds pagination offsets", () => {
    expect(listQuerySchema.safeParse({ offset: "-1" }).success).toBe(false);
    expect(listQuerySchema.safeParse({ offset: "100001" }).success).toBe(false);
  });
});

describe("public API response headers", () => {
  it("caches successful reads briefly", () => {
    const response = json({ data: [] });
    expect(response.headers.get("access-control-allow-origin")).toBe(
      CORS["access-control-allow-origin"],
    );
    expect(response.headers.get("cache-control")).toContain("max-age=60");
  });

  it("never caches errors or preflight responses", () => {
    expect(json({ error: "rate_limited" }, 429).headers.get("cache-control")).toBe("no-store");
    expect(preflight().headers.get("cache-control")).toBe("no-store");
  });
});
