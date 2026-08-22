import { createInternalNeonAuth } from '@neondatabase/auth';

const DEFAULT_NEON_AUTH_URL = 'https://ep-purple-fog-amwsyc3j.neonauth.c-5.us-east-1.aws.neon.tech/neondb/auth';
const authUrl = ((import.meta.env.VITE_NEON_AUTH_URL as string | undefined) ?? DEFAULT_NEON_AUTH_URL).trim();
const neonAuth = createInternalNeonAuth(authUrl);
export const authClient = neonAuth?.adapter ?? null;
export const getAuthToken = () => neonAuth?.getJWTToken() ?? Promise.resolve(null);

export type OmniSession = {
  session: unknown;
  user: { id?: string; email?: string | null; name?: string | null };
};
