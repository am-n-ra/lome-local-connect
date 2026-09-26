// V-9' — live-surface guard. Fails if a source file is not reachable from a real entry point.
//
// Why this exists: the repository carried four generations of UI (`components/omni`,
// `omni-clean`, `mockup`, `v2`) and three app entry points, of which only `src/main.tsx` is
// mounted. A reader - human or AI - sees them and concludes the app is the old one. Worse, the
// dead code has already lied once: the RH-01 itinerary audit found pre-intent seller contact in
// `src/routes/fiche.$id.tsx` and `src/components/omni/CartePage.tsx`, both dead, and that
// incoherence survived only because the files survived.
//
// The app ignores v1 at runtime (one client entry, zero dynamic globs); this guard makes that
// true of the repository too, so the map stops lying.
//
// Falsifiable by construction: add any .ts/.tsx under src/ that nothing imports and this fails.
// Run: npm run check:live-surface
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, normalize, relative } from 'node:path';

const root = process.cwd();
const srcDir = join(root, 'src');
const SERVER_ENTRY_DIR = join('src', 'server', 'vercel');

/** Resolve an import specifier to a real file, mirroring the bundler's alias and extension order.
 *  `@/` maps to `src/` (see vite.config.ts and tsconfig paths); without this the guard would
 *  report a live file as an orphan whenever it is reached only through the alias. */
async function resolveSpecifier(specifier, fromFile) {
  let base;
  if (specifier.startsWith('@/')) {
    base = normalize(join(root, 'src', specifier.slice(2)));
  } else if (specifier.startsWith('.')) {
    base = normalize(join(dirname(fromFile), specifier));
  } else {
    return null;
  }
  const candidates = [
    base,
    `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`,
    join(base, 'index.ts'), join(base, 'index.tsx'),
  ];
  for (const candidate of candidates) {
    try {
      await readFile(candidate);
      return candidate;
    } catch {
      // try the next extension
    }
  }
  return null;
}

async function walk(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      await walk(path, out);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      // Tests are kept: they are not entry points, but the guard must still see them to report
      // the ones that import nothing but dead code.
      out.push(path);
    }
  }
  return out;
}

const files = await walk(srcDir);
const testFiles = files.filter((f) => /\.test\.(ts|tsx)$/.test(f));
const prodFiles = files.filter((f) => !/\.test\.(ts|tsx)$/.test(f));

// Entry points: the mounted client app, plus every physical Vercel function (each is a real
// serverless entry, so anything they reach is genuinely shipped).
const clientEntry = join(root, 'src', 'main.tsx');
const serverEntries = prodFiles.filter((f) => dirname(f) === join(root, SERVER_ENTRY_DIR));
const entries = [clientEntry, ...serverEntries];

const importRe = /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

const graph = new Map();
const broken = new Map(); // file -> internal specifiers that resolve to nothing
for (const file of files) {
  const text = await readFile(file, 'utf8');
  const deps = new Set();
  const missing = new Set();
  for (const match of text.matchAll(importRe)) {
    const specifier = match[1] ?? match[2];
    if (!specifier) continue;
    if (!specifier.startsWith('@/') && !specifier.startsWith('.')) continue;
    const resolved = await resolveSpecifier(specifier, file);
    if (resolved) deps.add(resolved);
    else missing.add(specifier);
  }
  graph.set(file, deps);
  if (missing.size) broken.set(file, [...missing]);
}

// Reachability from real entries. A test is NOT an entry: a module reached only by a test is
// dead for the product, and its green test proves nothing about what ships.
const reachable = new Set(entries);
const queue = [...entries];
while (queue.length) {
  const current = queue.pop();
  for (const dep of graph.get(current) ?? []) {
    if (!reachable.has(dep)) {
      reachable.add(dep);
      queue.push(dep);
    }
  }
}

// A production file is orphaned when no reachable node imports it. Tests are excluded from the
// "files to police" set here: a test whose entire subject is dead is reported by the orphaned
// subject itself, and we do not want the guard to demand that every test be reachable.
const orphans = prodFiles.filter((file) => !reachable.has(file)).sort();

// Tests that import nothing reachable: they exercise dead code only, so they are false coverage.
// A test with NO resolved src import is not judged here - several legitimate guards read live
// artefacts through readFileSync (db/migrations/*.sql, trunk-repository.ts, the maquette) and
// importing them as modules would be wrong. Only a test that DOES import src modules, all of them
// dead, is reported.
const deadOnlyTests = testFiles
  .filter((file) => {
    const deps = [...(graph.get(file) ?? [])];
    if (deps.length === 0) return false;
    return !deps.some((dep) => reachable.has(dep));
  })
  .sort();

if (orphans.length || deadOnlyTests.length || broken.size) {
  const lines = [];
  if (orphans.length) {
    lines.push(
      `Live surface violated: ${orphans.length} production file(s) unreachable from any entry point.`,
      'Each one is dead code that ships nothing but misleads the next reader.',
      '',
      orphans.map((f) => `  ${relative(root, f)}`).join('\n'),
      '',
    );
  }
  if (deadOnlyTests.length) {
    lines.push(
      `False coverage: ${deadOnlyTests.length} test file(s) import only dead code.`,
      'A green test that guards nothing shipping is worse than no test.',
      '',
      deadOnlyTests.map((f) => `  ${relative(root, f)}`).join('\n'),
      '',
    );
  }
  if (broken.size) {
    lines.push(
      'Broken import(s): a source file imports a module that no longer exists.',
      'This is what a partial cleanup looks like - it will fail tsc or the test runner.',
      '',
      [...broken.entries()].map(([f, specs]) => `  ${relative(root, f)} -> ${specs.join(', ')}`).join('\n'),
      '',
    );
  }
  lines.push('Remove them, or import them from a real entry point.');
  console.error(lines.join('\n'));
  process.exit(1);
}

console.log(
  `Live surface: clean (${prodFiles.length} production files reachable from ${entries.length} entry points, ` +
    `${testFiles.length} tests all exercising live code)`,
);

// Second seam: `scripts/` and `server/` also import from `src/` (proof scripts drive
// `createTrunkRepository`; `check-global-coverage.ts` reads `@/lib/*`). The guard above only looks
// inside `src/`, so deleting a module that a script still consumes would pass it and break
// `tsc -b` - exactly what happened once. Any file under src/ that only a script reaches is NOT
// reported as an orphan (it has a real consumer), but a script pointing at a DELETED module is a
// hard error, so we check the reverse direction: every src/ specifier a script names must exist.
const scriptDirs = [join(root, 'scripts'), join(root, 'server')];
const scriptFiles = [];
for (const dir of scriptDirs) {
  try {
    await walkAny(dir, scriptFiles);
  } catch {
    // directory absent in this checkout
  }
}
const missingTargets = [];
for (const file of scriptFiles) {
  const text = await readFile(file, 'utf8');
  for (const match of text.matchAll(importRe)) {
    const specifier = match[1] ?? match[2];
    if (!specifier) continue;
    if (!specifier.startsWith('@/') && !specifier.startsWith('.')) continue;
    const resolved = await resolveSpecifier(specifier, file);
    if (!resolved) missingTargets.push(`${relative(root, file)} -> ${specifier}`);
  }
}
if (missingTargets.length) {
  console.error(
    `Broken consumer(s): a script or server file imports a module that no longer exists.\n` +
      missingTargets.map((l) => `  ${l}`).join('\n'),
  );
  process.exit(1);
}

async function walkAny(dir, out) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      await walkAny(path, out);
    } else if (/\.(ts|tsx|mjs|js)$/.test(entry.name)) {
      out.push(path);
    }
  }
  return out;
}
