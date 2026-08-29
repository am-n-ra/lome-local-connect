import { build } from 'esbuild';

// Single catch-all Serverless function for the whole /api/v2/* namespace.
// Previously this generated one function per route (13 total), which blew past
// the Vercel Hobby plan's 12-function-per-deployment limit. The catch-all
// dispatches every /api/v2 route to the same handlers in src/server/http.ts,
// so Vercel only ever sees ONE function.
const entries = {
  'api/v2/[[...path]].js': 'src/server/vercel/catch-all.ts',
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
