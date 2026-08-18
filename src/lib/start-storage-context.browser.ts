/**
 * Browser replacement for `@tanstack/start-storage-context`.
 *
 * The published package imports `node:async_hooks` at module scope. When that
 * module reaches the client bundle the browser stub throws
 * `AsyncLocalStorage is not a constructor`, which kills hydration on every
 * route. The client never needs real async-local storage: it only needs a
 * context object so client-side function middleware can run.
 */

const GLOBAL_STORAGE_KEY = Symbol.for("tanstack-start:start-storage-context");

type StartContext = Record<string, unknown>;

type StartStorage = {
  run: <T>(context: StartContext, fn: () => T) => T;
  getStore: () => StartContext | undefined;
};

const globalObj = globalThis as typeof globalThis & {
  [GLOBAL_STORAGE_KEY]?: StartStorage;
  __TSS_START_OPTIONS__?: unknown;
};

let currentContext: StartContext = {
  startOptions: globalObj.__TSS_START_OPTIONS__ ?? { functionMiddleware: [] },
  contextAfterGlobalMiddlewares: {},
  executedRequestMiddlewares: new Set(),
  handlerType: "serverFn",
};

const startStorage: StartStorage = globalObj[GLOBAL_STORAGE_KEY] ?? {
  run: (context, fn) => {
    const previous = currentContext;
    currentContext = { ...previous, ...context };
    try {
      return fn();
    } finally {
      currentContext = previous;
    }
  },
  getStore: () => currentContext,
};

export async function runWithStartContext<T>(
  context: StartContext,
  fn: () => T | Promise<T>,
): Promise<T> {
  return startStorage.run(context, fn) as Promise<T>;
}

export function getStartContext(_opts?: { throwIfNotFound?: boolean }) {
  return startStorage.getStore() ?? currentContext;
}
