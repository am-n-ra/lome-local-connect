import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { IncomingHttpHeaders } from 'node:http';

let keySet: ReturnType<typeof createRemoteJWKSet> | null = null;
const DEFAULT_NEON_AUTH_JWKS_URL = 'https://ep-purple-fog-amwsyc3j.neonauth.c-5.us-east-1.aws.neon.tech/neondb/auth/.well-known/jwks.json';

function remoteKeys() {
  const url = (process.env.NEON_AUTH_JWKS_URL ?? DEFAULT_NEON_AUTH_JWKS_URL).trim();
  keySet ??= createRemoteJWKSet(new URL(url));
  return keySet;
}

export function getBearerToken(headers: IncomingHttpHeaders): string | null {
  const authorization = headers.authorization;
  if (!authorization?.startsWith('Bearer ')) return null;
  const token = authorization.slice('Bearer '.length).trim();
  return token || null;
}

export async function getAuthUserId(headers: IncomingHttpHeaders): Promise<string | null> {
  const token = getBearerToken(headers);
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, remoteKeys());
    return typeof payload.sub === 'string' && payload.sub.length > 0 ? payload.sub : null;
  } catch {
    return null;
  }
}
