import { build } from 'esbuild';

const entries = {
  'api/v2/public/facilities.js': 'src/server/vercel/public-facilities.ts',
  'api/v2/facilities/[id].js': 'src/server/vercel/facility-detail.ts',
  'api/v2/availability.js': 'src/server/vercel/availability.ts',
  'api/v2/purchase-intents.js': 'src/server/vercel/purchase-intents.ts',
  'api/v2/external-payment-confirmations.js': 'src/server/vercel/external-payment-confirmations.ts',
  'api/v2/external-payment-declarations.js': 'src/server/vercel/external-payment-declarations.ts',
  'api/v2/qr-verifications.js': 'src/server/vercel/qr-verifications.ts',
  'api/v2/transaction-transitions.js': 'src/server/vercel/transaction-transitions.ts',
  'api/v2/availability-responses.js': 'src/server/vercel/availability-responses.ts',
  'api/v2/availability-requests.js': 'src/server/vercel/availability-requests.ts',
  'api/v2/seller/availability-requests.js': 'src/server/vercel/seller-availability-requests.ts',
  'api/v2/seller/demo-rebind.js': 'src/server/vercel/seller-demo-rebind.ts',
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

console.log(`Bundled ${Object.keys(entries).length} Vercel V2 functions.`);
