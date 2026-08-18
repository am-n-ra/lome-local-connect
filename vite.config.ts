// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { fileURLToPath } from "node:url";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

const START_STORAGE_ID = "@tanstack/start-storage-context";
const browserStartStorage = fileURLToPath(
  new URL("./src/lib/start-storage-context.browser.ts", import.meta.url),
);

/**
 * `@tanstack/start-storage-context` imports `node:async_hooks` at module scope.
 * In the browser bundle that stub throws `AsyncLocalStorage is not a
 * constructor` and hydration dies on every route. Swap it for a browser-safe
 * implementation in the client environment only.
 */
function startStorageBrowserShim(): Plugin {
  return {
    name: "omni-start-storage-browser-shim",
    enforce: "pre",
    resolveId(source) {
      if (source !== START_STORAGE_ID) return null;
      const environmentName = (this as unknown as { environment?: { name?: string } }).environment
        ?.name;
      if (environmentName && environmentName !== "client") return null;
      return browserStartStorage;
    },
  };
}

export default defineConfig({
  // Pin Vercel's SSR target so deployment uses the platform function adapter.
  nitro: { preset: "vercel" },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [startStorageBrowserShim()],
  },
});
