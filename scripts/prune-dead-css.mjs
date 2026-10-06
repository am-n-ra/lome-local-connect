import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

// UI-1 — pruner. Removes CSS rules whose selectors reference ONLY classes that
// are provably unused. Sound by construction: a class is removable only when its
// name is absent (as a whole token) from ALL of src/** and from public/index HTML,
// and is not a library-injected (maplibregl-/mapboxgl-) or dynamic-family (sk-*)
// token. The pruner is brace-depth aware so it handles @media/@supports blocks.
const ROOT = process.cwd();
const CSS = ['src/styles.css', 'src/trunk/v3.css', 'src/trunk/ui-v13.css'];
const DRY = !process.argv.includes('--write');

function walk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(ts|tsx)$/.test(e.name) && !e.name.includes('.test.')) acc.push(p);
  }
  return acc;
}
function readPublic(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) readPublic(p, acc);
    else if (/\.(html|js)$/.test(e.name)) acc.push(p);
  }
  return acc;
}
const sourceText =
  walk(resolve(ROOT, 'src')).map((f) => readFileSync(f, 'utf8')).join('\n') +
  '\n' +
  [resolve(ROOT, 'index.html'), ...readPublic(resolve(ROOT, 'public'))].map((f) => readFileSync(f, 'utf8')).join('\n');

const PROTECT = [/^maplibregl-/, /^mapboxgl-/, /^sk-/];
const mentioned = (c) => new RegExp(`(?<![\\w-])${c.replace(/[-]/g, '\\-')}(?![\\w-])`).test(sourceText);

// Hard safety: a class observed applied at runtime must NEVER be removable.
const runtime = new Set(JSON.parse(readFileSync('/tmp/ui-classes.json', 'utf8')).all);
const unsafe = [...runtime].filter((c) => !PROTECT.some((re) => re.test(c)) && !mentioned(c));
if (unsafe.length) {
  console.error('ABORT — runtime-applied classes absent from source:', unsafe.join(', '));
  process.exit(1);
}

// Split a CSS file into top-level chunks with brace-depth awareness.
function prune(text, log) {
  let out = '';
  let i = 0;
  const n = text.length;
  while (i < n) {
    // Copy leading whitespace.
    const wsStart = i;
    while (i < n && /\s/.test(text[i])) i++;
    out += text.slice(wsStart, i);
    if (i >= n) break;

    // Comment.
    if (text[i] === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2);
      const stop = end === -1 ? n : end + 2;
      out += text.slice(i, stop);
      i = stop;
      continue;
    }

    // Read prelude up to '{' or ';' at this level.
    const pStart = i;
    while (i < n && text[i] !== '{' && text[i] !== ';') i++;
    if (i >= n) { out += text.slice(pStart); break; }
    const prelude = text.slice(pStart, i);

    if (text[i] === ';') { out += prelude + ';'; i++; continue; }

    // Block: find matching close brace.
    let depth = 0;
    let j = i;
    for (; j < n; j++) {
      if (text[j] === '{') depth++;
      else if (text[j] === '}') { depth--; if (depth === 0) break; }
    }
    const block = text.slice(i, j + 1); // includes { ... }
    const inner = block.slice(1, -1);

    const trimmed = prelude.trim();
    if (trimmed.startsWith('@')) {
      // At-rule with block (@media/@supports/@keyframes/@font-face...).
      const atName = (trimmed.match(/^@([a-z-]+)/i) || [])[1] || '';
      if (atName === 'keyframes' || atName === 'font-face' || atName === 'property' || atName === 'page') {
        out += prelude + block; // never prune inside these
      } else {
        const prunedInner = prune(inner, log);
        if (prunedInner.replace(/\/\*[\s\S]*?\*\//g, '').trim() === '') {
          log.removedBlocks++;
        } else {
          out += prelude + '{' + prunedInner + '}';
        }
      }
    } else {
      // Simple rule: selector = prelude. Removable if every class it names is removable.
      const classes = [...prelude.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]);
      const allRemovable = classes.length > 0 && classes.every(
        (c) => !PROTECT.some((re) => re.test(c)) && !mentioned(c),
      );
      if (allRemovable) {
        log.removedRules++;
        log.removedClasses.push(...classes);
      } else {
        out += prelude + block;
      }
    }
    i = j + 1;
  }
  return out;
}

let grand = { removedRules: 0, removedBlocks: 0 };
for (const css of CSS) {
  const text = readFileSync(resolve(ROOT, css), 'utf8');
  const log = { removedRules: 0, removedBlocks: 0, removedClasses: [] };
  const pruned = prune(text, log);
  const lines = (s) => s.split('\n').length;
  grand.removedRules += log.removedRules;
  grand.removedBlocks += log.removedBlocks;
  console.log(`${css}: -${log.removedRules} rules, -${log.removedBlocks} empty @blocks, ${lines(text)} -> ${lines(pruned)} lines`);
  if (!DRY && log.removedRules > 0) {
    writeFileSync(resolve(ROOT, css), pruned);
  }
}
console.log(`TOTAL: -${grand.removedRules} rules, -${grand.removedBlocks} @blocks  ${DRY ? '(DRY RUN)' : '(WRITTEN)'}`);
