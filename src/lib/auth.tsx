import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

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
  const payload = text ? (JSON.parse(text) as unknown) : null;
  if (!response.ok) {
    const message =
      (payload as { message?: string } | null)?.message ??
      "Une erreur est survenue.";
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
      clearAccessToken();
      return null;
    }
    const data = (await response.json()) as { token?: string };
    cachedToken = data.token ?? null;
    cachedAt = Date.now();
    return cachedToken;
  } catch {
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
      },
      signUp: async (email, password, name) => {
        await authFetch("/sign-up/email", {
          method: "POST",
          body: JSON.stringify({ email, password, name }),
        });
        clearAccessToken();
        await refresh();
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
