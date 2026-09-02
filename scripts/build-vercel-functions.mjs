import { build } from 'esbuild';
// One Serverless function per /api/v2 route, capped at 12 to stay under the
// Vercel Hobby plan's 12-function-per-deployment limit. The former catch-all
// api/v2/[[...path]].js compiled to a single-optional-segment route on this
// (non-Next.js) project, so multi-segment paths returned Vercel's static 404;
// explicit per-route files are the proven pattern that served prod before the
// 13th function pushed the deployment over the Hobby cap.
//
// 12 files for the former 13: `availability` and `availability-responses` are
// merged into a single physical file (src/server/vercel/availability.ts) that
// dispatches by pathname. vercel.json folds the wallet/fedapay/transaction-
// messages/catalogue-:id routes into seller/catalogue and provides a catch-all
// fallback so unpinned /api/v2 routes (seller/facilities, transaction-ratings,
// admin/*, unknown paths) still resolve to the handler.
const entries = {
  'api/v2/public/facilities.js': 'src/server/vercel/public-facilities.ts',
  'api/v2/facilities/[id].js': 'src/server/vercel/facility-detail.ts',
  'api/v2/availability.js': 'src/server/vercel/availability.ts', // availability + availability-responses + fallback
  'api/v2/purchase-intents.js': 'src/server/vercel/purchase-intents.ts',
  'api/v2/account/context.js': 'src/server/vercel/account-context.ts',
  'api/v2/external-payment-confirmations.js': 'src/server/vercel/external-payment-confirmations.ts',
  'api/v2/external-payment-declarations.js': 'src/server/vercel/external-payment-declarations.ts',
  'api/v2/qr-verifications.js': 'src/server/vercel/qr-verifications.ts',
  'api/v2/transaction-transitions.js': 'src/server/vercel/transaction-transitions.ts',
  'api/v2/seller/availability-requests.js': 'src/server/vercel/seller-availability-requests.ts',
  'api/v2/seller/catalogue.js': 'src/server/vercel/seller-catalogue.ts',
  'api/v2/qr-issuances.js': 'src/server/vercel/qr-issuances.ts',
};
for (const [outfile, entrypoint] of Object.entries(entries)) {
  await build({
    entryPoints: [entrypoint],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    packages: 'external',
    sourcemap: false,
    logLevel: 'warning',
  });
}
const count = Object.keys(entries).length;
console.log(`Bundled ${count} Vercel V2 function${count === 1 ? '' : 's'}.`);
