import { handleApi } from '../http';
/**
 * Merger of the former `availability` and `availability-responses` Vercel
 * functions (one physical file for two routes) AND the catch-all fallback for
 * any /api/v2 route that has no physical function file.
 *
 * Why we forward the pathname: Vercel routes a physical api/ function by its
 * file path, but the platform may or may not preserve the original request URL
 * in req.url when a request reaches a function via a vercel.json rewrite. Every
 * rewrite that folds a route into this file therefore passes the ORIGINAL path
 * as the `__path` query param, so no matter which mechanism delivered the
 * request we always dispatch on the true pathname. `handleApi` is a complete
 * pathname router, so this single file correctly serves /api/v2/availability,
 * /api/v2/availability-responses, and every unpinned /api/v2 route (unknown
 * paths fall through to its JSON 404 instead of a silent Vercel 404).
 */
function requestUrl(req: any, fallbackPath: string) {
  const protocol = String(req.headers?.['x-forwarded-proto'] ?? 'https');
  const host = String(req.headers?.host ?? 'localhost');
  return new URL(String(req.url ?? fallbackPath), `${protocol}://${host}`);
}
export default async function handler(req: any, res: any) {
  const url = requestUrl(req, '/api/v2/availability');
  const forwarded = url.searchParams.get('__path');
  const pathname = forwarded || url.pathname;
  await handleApi(req, res, pathname, url);
}
