import { isRedirect, useRouter } from "@tanstack/react-router";
import * as React from "react";

/**
 * Client-only wrapper for TanStack server functions.
 * Keeping this hook local avoids importing the React Start root barrel into UI
 * modules, which also exposes server storage-context code to Vite's client graph.
 */
export function useServerFn<T extends (...deps: Array<any>) => Promise<any>>(
  serverFn: T,
): (...args: Parameters<T>) => ReturnType<T> {
  const router = useRouter();

  return React.useCallback(
    async (...args: Array<any>) => {
      try {
        const response = await serverFn(...args);
        if (isRedirect(response)) throw response;
        return response;
      } catch (error) {
        if (isRedirect(error)) {
          error.options._fromLocation = router.stores.location.get();
          return router.navigate(router.resolveRedirect(error).options);
        }
        throw error;
      }
    },
    [router, serverFn],
  ) as ReturnType<typeof useServerFn<T>>;
}
