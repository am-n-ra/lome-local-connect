import { createInternalNeonAuth } from '@neondatabase/auth';

const authUrl = import.meta.env.VITE_NEON_AUTH_URL as string | undefined;
const neonAuth = authUrl ? createInternalNeonAuth(authUrl) : null;
export const authClient = neonAuth?.adapter ?? null;
export const getAuthToken = () => neonAuth?.getJWTToken() ?? Promise.resolve(null);

export type OmniSession = {
  session: unknown;
  user: { id?: string; email?: string | null; name?: string | null };
};
