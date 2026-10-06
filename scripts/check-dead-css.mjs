import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

// UI-1 guard — no dead CSS.
//
// A CSS class can only be applied if its name is written somewhere in the app
// source (className, template fragment, classList, el.className) or in the
// public HTML, or is injected at runtime by a library. So a class that is absent
// (as a whole token) from ALL of src/** + index.html + public/** is dead — unless
// it is a library-injected token (maplibregl-/mapboxgl-) or a dynamic-family
// member (`sk-${variant}` builds sk-line/sk-block/... from a prefix).
//
// Falsifiable: reintroduce any removed rule and this fails with the class name.
const ROOT = process.cwd();
const CSS = ['src/styles.css', 'src/trunk/v3.css', 'src/trunk/ui-v13.css'];
const PROTECT = [/^maplibregl-/, /^mapboxgl-/, /^sk-/];

function walk(dir, re, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, re, acc);
    else if (re.test(e.name) && !e.name.includes('.test.')) acc.push(p);
  }
  return acc;
}

const sourceText = [
  ...walk(resolve(ROOT, 'src'), /\.(ts|tsx)$/),
  resolve(ROOT, 'index.html'),
  ...walk(resolve(ROOT, 'public'), /\.(html|js)$/),
]
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n');

const mentioned = (c) => new RegExp(`(?<![\\w-])${c.replace(/[-]/g, '\\-')}(?![\\w-])`).test(sourceText);

// Rule-level detection: a rule is removable only when EVERY class it names is
// dead. This matches the pruner (scripts/prune-dead-css.mjs) exactly, so a green
// guard means the pruner would remove nothing.
function removableRules(text) {
  const out = [];
  const n = text.length;
  let i = 0;
  const skipWs = () => { while (i < n && /\s/.test(text[i])) i++; };
  while (i < n) {
    skipWs();
    if (i >= n) break;
    if (text[i] === '/' && text[i + 1] === '*') { const e = text.indexOf('*/', i + 2); i = e === -1 ? n : e + 2; continue; }
    const start = i;
    while (i < n && text[i] !== '{' && text[i] !== ';') i++;
    if (i >= n) break;
    const prelude = text.slice(start, i);
    if (text[i] === ';') { i++; continue; }
    let depth = 0, j = i;
    for (; j < n; j++) { if (text[j] === '{') depth++; else if (text[j] === '}') { depth--; if (depth === 0) break; } }
    const inner = text.slice(i + 1, j);
    const trimmed = prelude.trim();
    if (trimmed.startsWith('@')) {
      const at = (trimmed.match(/^@([a-z-]+)/i) || [])[1] || '';
      if (!['keyframes', 'font-face', 'property', 'page'].includes(at)) out.push(...removableRules(inner));
    } else {
      const classes = [...prelude.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]);
      if (classes.length > 0 && classes.every((c) => !PROTECT.some((re) => re.test(c)) && !mentioned(c))) {
        out.push(`${trimmed.replace(/\s+/g, ' ').slice(0, 60)}  {${classes.map((c) => '.' + c).join(' ')}}`);
      }
    }
    i = j + 1;
  }
  return out;
}

const dead = [];
for (const css of CSS) dead.push(...removableRules(readFileSync(resolve(ROOT, css), 'utf8')).map((r) => `${css}: ${r}`));

if (dead.length) {
  console.error(`Dead CSS: ${dead.length} class rule(s) reference names used nowhere in the app.\n` +
    dead.slice(0, 40).map((d) => '  ' + d).join('\n') +
    (dead.length > 40 ? `\n  … +${dead.length - 40} more` : '') +
    '\nRemove them, or (if library-injected) extend PROTECT in scripts/check-dead-css.mjs.');
  process.exit(1);
}
console.log(`Dead CSS: clean (${CSS.length} stylesheets, 0 unreferenced classes)`);
