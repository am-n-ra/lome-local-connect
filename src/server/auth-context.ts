import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { IncomingHttpHeaders } from 'node:http';

let keySet: ReturnType<typeof createRemoteJWKSet> | null = null;

function remoteKeys() {
  const url = process.env.NEON_AUTH_JWKS_URL;
  if (!url) throw new Error('NEON_AUTH_JWKS_URL is not configured for the server runtime.');
  keySet ??= createRemoteJWKSet(new URL(url));
  return keySet;
}

export async function getAuthUserId(headers: IncomingHttpHeaders): Promise<string | null> {
  const authorization = headers.authorization;
  if (!authorization?.startsWith('Bearer ')) return null;
  const token = authorization.slice('Bearer '.length).trim();
  if (!token) return null;
  const { payload } = await jwtVerify(token, remoteKeys());
  return typeof payload.sub === 'string' && payload.sub.length > 0 ? payload.sub : null;
}
