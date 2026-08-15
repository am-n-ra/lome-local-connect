import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const PENDING_SEARCH_STORAGE_KEY = "omni.pendingAvailabilitySearch";

export type PendingAvailabilitySearch = {
  term: string;
  category: string | null;
  filters: unknown;
  targetFacilityIds: string[];
  location: { lat: number; lng: number } | null;
  locationSource?: "browser" | "market_fallback" | "unknown";
  demandOpen: boolean;
  mode?: "search" | "availability";
  demandMode?: "bulk" | "manual";
  demandFacilityName?: string | null;
  quantity?: number;
};

export function savePendingAvailabilitySearch(payload: PendingAvailabilitySearch) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(PENDING_SEARCH_STORAGE_KEY, JSON.stringify(payload));
}

export function restorePendingAvailabilitySearch(): PendingAvailabilitySearch | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(PENDING_SEARCH_STORAGE_KEY);
  if (!raw) return null;
  window.sessionStorage.removeItem(PENDING_SEARCH_STORAGE_KEY);
  try {
    const parsed = JSON.parse(raw) as PendingAvailabilitySearch;
    return parsed;
  } catch {
    return null;
  }
}

export function readPendingAuthRedirect(defaultPath = "/carte") {
  if (typeof window === "undefined") return defaultPath;
  const params = new URLSearchParams(window.location.search);
  const redirectTo = params.get("redirectTo");
  if (redirectTo?.startsWith("/")) return redirectTo;
  return defaultPath;
}

function notifyPendingSearchReady() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("omni:pending-availability-ready"));
}

/** Neon Auth is reached through the same-origin proxy at /api/auth. */
const AUTH_BASE = "/api/auth";

export type SessionUser = {
  id: string;
  email: string | null;
  name: string | null;
};

type AuthState = {
  user: SessionUser | null;
  loading: boolean;
  roles: string[];
  isStaff: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  roles: [],
  isStaff: false,
  isAdmin: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  refresh: async () => {},
});

async function authFetch(path: string, init?: RequestInit) {
  const response = await fetch(`${AUTH_BASE}${path}`, {
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    ...init,
  });
  const text = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  let payload: unknown = null;
  if (text) {
    try {
      payload = contentType.includes("json") ? JSON.parse(text) : { message: text.trim() };
    } catch {
      payload = { message: text.trim() };
    }
  }
  if (!response.ok) {
    const message =
      (payload as { message?: string } | null)?.message?.trim() || "Une erreur est survenue.";
    throw new Error(message);
  }
  return payload;
}

// --- bearer token cache used by the server-function middleware -------------
let cachedToken: string | null = null;
let cachedAt = 0;
const TOKEN_TTL_MS = 4 * 60 * 1000;

export function clearAccessToken() {
  cachedToken = null;
  cachedAt = 0;
}

export async function getAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (cachedToken && Date.now() - cachedAt < TOKEN_TTL_MS) return cachedToken;
  try {
    const response = await fetch(`${AUTH_BASE}/token`, {
      credentials: "same-origin",
    });
    if (!response.ok) {
      cachedToken = null;
      cachedAt = Date.now();
      return null;
    }
    const data = (await response.json()) as { token?: string };
    cachedToken = data.token ?? null;
    cachedAt = Date.now();
    return cachedToken;
  } catch {
    cachedToken = null;
    cachedAt = Date.now();
    return null;
  }
}

function readUser(payload: unknown): SessionUser | null {
  const session = payload as { user?: { id?: string; email?: string; name?: string } } | null;
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? null,
    name: session.user.name ?? null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<string[]>([]);

  const loadRoles = useCallback(async (signedIn: boolean) => {
    if (!signedIn) {
      setRoles([]);
      return;
    }
    try {
      const { getMyIdentity } = await import("./identity.functions");
      const identity = await getMyIdentity();
      setRoles(identity.roles);
    } catch {
      setRoles([]);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const payload = await authFetch("/get-session");
      const next = readUser(payload);
      setUser(next);
      await loadRoles(Boolean(next));
    } catch {
      setUser(null);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, [loadRoles]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const originalFetch = window.fetch.bind(window);
    const withAuth = async (input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl =
        typeof input === "string" ? input : input instanceof Request ? input.url : input.toString();
      if (!requestUrl.includes("/_serverFn/")) return originalFetch(input, init);
      const headers = new Headers(
        init?.headers ?? (input instanceof Request ? input.headers : undefined),
      );
      if (!headers.has("authorization")) {
        const token = await getAccessToken();
        if (token) {
          headers.set("authorization", `Bearer ${token}`);
          headers.set("x-omni-auth-token", token);
        }
      }
      return originalFetch(input, { ...init, headers });
    };
    window.fetch = withAuth as typeof window.fetch;
    return () => {
      if (window.fetch === (withAuth as typeof window.fetch)) window.fetch = originalFetch;
    };
  }, [user?.id]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      roles,
      isStaff: roles.some((r) => ["admin", "moderator", "acquisition"].includes(r)),
      isAdmin: roles.includes("admin"),
      refresh,

      signIn: async (email, password) => {
        await authFetch("/sign-in/email", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        clearAccessToken();
        await refresh();
        notifyPendingSearchReady();
      },
      signUp: async (email, password, name) => {
        await authFetch("/sign-up/email", {
          method: "POST",
          body: JSON.stringify({ email, password, name }),
        });
        clearAccessToken();
        await refresh();
        notifyPendingSearchReady();
      },
      signOut: async () => {
        try {
          await authFetch("/sign-out", { method: "POST", body: "{}" });
        } catch {
          /* the session is dropped locally regardless */
        }
        clearAccessToken();
        setUser(null);
        setRoles([]);
      },
    }),
    [user, loading, roles, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
