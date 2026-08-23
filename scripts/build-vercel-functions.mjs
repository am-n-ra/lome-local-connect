import { build } from 'esbuild';

const entries = {
  'api/v2/public/facilities.js': 'src/server/vercel/public-facilities.ts',
  'api/v2/facilities/[id].js': 'src/server/vercel/facility-detail.ts',
  'api/v2/availability.js': 'src/server/vercel/availability.ts',
  'api/v2/purchase-intents.js': 'src/server/vercel/purchase-intents.ts',
  'api/v2/external-payment-confirmations.js': 'src/server/vercel/external-payment-confirmations.ts',
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
