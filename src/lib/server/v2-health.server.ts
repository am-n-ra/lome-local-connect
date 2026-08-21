import type { V2SafeRuntimeInfo } from "../../contracts/v2";

export function getV2SafeRuntimeInfo(environment = "development"): V2SafeRuntimeInfo {
  const normalizedEnvironment =
    environment === "production" || environment === "preview" ? environment : "development";

  return {
    ok: true,
    version: "v2",
    environment: normalizedEnvironment,
  };
}
