import { handleApi } from '../http';

/**
 * Single catch-all Vercel Serverless function for the whole /api/v2/* namespace.
 *
 * Every previous per-route function was a thin wrapper that computed a `pathname`
 * and called `handleApi(req, res, pathname, url)` from http.ts, which dispatches
 * by method + pathname. A single `api/v2/[[...path]].js` entry replays the same
 * routing for every route, so it replaces all 13 per-route functions with ONE,
 * keeping Vercel under the Hobby plan's 12-function-per-deployment limit with no
 * change to client-visible behaviour.
 *
 * The only non-identity mapping is /api/v2/seller/catalogue, which (via the
 * `vercel.json` rewrites this replaces) also served the wallet/fedapay/webhook/
 * transaction-messages/demo-rebind/":id" variants keyed off query params.
 */
function requestUrl(req: any, fallbackPath: string) {
  const protocol = String(req.headers?.['x-forwarded-proto'] ?? 'https');
  const host = String(req.headers?.host ?? 'localhost');
  return new URL(String(req.url ?? fallbackPath), `${protocol}://${host}`);
}

function resolvePathname(pathname: string, url: URL): string {
  if (pathname !== '/api/v2/seller/catalogue') return pathname;
  const action = url.searchParams.get('omni_action');
  const productId = url.searchParams.get('id');
  if (action === 'demo-rebind') return '/api/v2/seller/demo-rebind';
  if (action === 'wallet') return '/api/v2/wallet';
  if (action === 'wallet-recharge') return '/api/v2/wallet/recharges';
  if (action === 'wallet-pro') return '/api/v2/wallet/pro';
  if (action === 'fedapay-webhook') return '/api/v2/fedapay/webhook';
  if (action === 'transaction-messages') return '/api/v2/transaction-messages';
  if (productId) return `/api/v2/seller/catalogue/${productId}`;
  return '/api/v2/seller/catalogue';
}

export default async function handler(req: any, res: any) {
  const url = requestUrl(req, '/api/v2');
  const pathname = resolvePathname(url.pathname, url);
  await handleApi(req, res, pathname, url);
}
