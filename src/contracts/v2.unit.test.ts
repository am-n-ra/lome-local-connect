import { describe, expect, it } from "vitest";
import {
  isRetryableV2Error,
  v2SliceStates,
  type V2AdapterResult,
} from "./v2";
import { getV2SafeRuntimeInfo } from "../lib/server/v2-health.server";

describe("V2 foundation contracts", () => {
  it("defines every shared slice state", () => {
    expect(v2SliceStates).toEqual(["idle", "loading", "ready", "empty", "error", "cancelled"]);
  });

  it("distinguishes retryable and terminal adapter failures", () => {
    const retryable = { kind: "retryable", code: "NETWORK", message: "Retry", retry: true } as const;
    const terminal = { kind: "terminal", code: "FORBIDDEN", message: "Denied", retry: false } as const;

    expect(isRetryableV2Error(retryable)).toBe(true);
    expect(isRetryableV2Error(terminal)).toBe(false);
  });

  it("supports ready and empty typed adapter outcomes", () => {
    const ready: V2AdapterResult<string[]> = { state: "ready", data: ["facility"] };
    const empty: V2AdapterResult<string[]> = { state: "empty", data: [] };

    expect(ready.data).toEqual(["facility"]);
    expect(empty.state).toBe("empty");
  });

  it("returns only allow-listed runtime information", () => {
    expect(getV2SafeRuntimeInfo("preview")).toEqual({
      ok: true,
      version: "v2",
      environment: "preview",
    });
    expect(getV2SafeRuntimeInfo("unknown")).toEqual({
      ok: true,
      version: "v2",
      environment: "development",
    });
  });
});
