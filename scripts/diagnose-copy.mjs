// Diagnostic de copie โ€” repรจre le texte VISIBLE PAR L'UTILISATEUR qui parle
// d'implรฉmentation technique (noms de fournisseurs, protocoles, notions d'รฉquipe)
// plutรดt que de la valeur pour l'utilisateur. Mesure, pas jugement : il liste.
//
// Usage : npx tsx scripts/diagnose-copy.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import ts from 'typescript';

const SRC = resolve(process.cwd(), 'src');
// Surfaces vues par l'utilisateur uniquement (le serveur n'affiche rien).
const CLIENT_DIRS = ['src/trunk', 'src/components', 'src/domain'];

// Familles de jargon qui n'ont pas leur place dans une copie utilisateur.
const FAMILIES = [
  { id: 'provider', label: 'Fournisseur / marque technique', re: /\b(Neon|FedaPay|Mapbox|Supabase|Vercel|OpenStreetMap|OSM|VAPID|Stripe|Google|Apple)\b/i },
  { id: 'protocol', label: 'Protocole / API', re: /\b(API|endpoint|webhook|token|JSON|payload|REST|SDK|OAuth|JWT|CORS)\b/i },
  { id: 'infra', label: 'Infrastructure', re: /\b(serveur|deploiement|localhost|bundle|cache|service worker|manifest|PWA|SQL|migration|schema|base de donnees)\b/i },
  { id: 'env', label: 'Environnement / config', re: /\b(environnement|configure|configuration|variable|build|instance|npm)\b/i },
  { id: 'teamvoice', label: "Voix d'equipe / interne", re: /\b(ne verifie pas|n'est pas verifie|non verifie|dette|TODO|WIP)\b/i },
  { id: 'internal', label: 'Vocabulaire interne produit', re: /\b(ledger|transactable|entitlement|slice|gate|Seed|Species|Root|Trunk|Canopy|Heartwood|maquette|contrat)\b/i },
  { id: 'english', label: "Terme anglais reste dans l'UI", re: /\b(Read-only|Loading|Error|Status|Draft|Snapshot|Hold|Payload)\b/ },
  { id: 'frinternal', label: 'Nouveau vocabulaire interne FR', re: /\b(intention d'achat|flux|jeton|correction manuelle|derive|cote serveur|sur ce serveur|filtre serveur|colonne|socle|brouillon|decouvrable|vivante|re-confirmee|inverifiee|re-confirmee)\b/i },
];

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = resolve(dir, e.name);
    if (e.isDirectory()) return walk(p);
    return /\.(ts|tsx)$/.test(e.name) && !/\.test\./.test(e.name) ? [p] : [];
  });
}

// Un nล“ud est ยซ visible ยป s'il est du texte JSX, une chaรฎne passรฉe en prop JSX
// (title/label/placeholder/aria-*), ou une chaรฎne de copie (pas un identifiant).
function isJsxPropValue(node) {
  const parent = node.parent;
  if (!parent) return false;
  if (ts.isJsxAttribute(parent)) return true;
  if (ts.isPropertyAssignment(parent)) {
    const name = parent.name?.getText?.() ?? '';
    return /^(label|title|sub|body|text|hint|description|placeholder|ariaLabel|message|toast|note|reason|detail|empty|cta)$/i.test(name);
  }
  if (ts.isReturnStatement(parent) || ts.isConditionalExpression(parent) || ts.isBinaryExpression(parent)) return true;
  return false;
}

function scanFile(file) {
  const hits = [];
  const text = readFileSync(file, 'utf8');
  const rel = relative(process.cwd(), file);
  const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind);

  const consider = (node, value) => {
    const v = value.replace(/\s+/g, ' ').trim();
    if (v.length < 6) return;
    // Ignore le code pur : expressions de requรชte, classes CSS, mime types.
    if (/^(application\/|text\/|image\/|https?:)/.test(v)) return;
    if (/^[a-z0-9-_]+$/i.test(v)) return;
    for (const fam of FAMILIES) {
      const m = v.match(fam.re);
      if (m) {
        const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
        hits.push({ file: rel, line: line + 1, family: fam.id, label: fam.label, match: m[0], text: v.slice(0, 160) });
        break;
      }
    }
  };

  const visit = (node) => {
    if (ts.isJsxText(node)) {
      consider(node, node.text);
    } else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      // Texte JSX ou prop JSX uniquement (รฉvite les valeurs de code).
      const inJsx = node.parent && (ts.isJsxElement(node.parent) || ts.isJsxSelfClosingElement(node.parent) || ts.isJsxAttribute(node.parent));
      if (inJsx || isJsxPropValue(node)) consider(node, node.text);
    } else if (ts.isTemplateExpression(node)) {
      consider(node, node.head.text);
      for (const span of node.templateSpans) consider(node, span.literal.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return hits;
}

const hits = CLIENT_DIRS.flatMap((d) => walk(resolve(process.cwd(), d))).flatMap(scanFile);
hits.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);

const byFamily = {};
for (const h of hits) (byFamily[h.family] ??= []).push(h);

console.log(`\nCOPIE โ€” ${hits.length} chaรฎnes visibles ร  examiner (${new Set(hits.map((h) => h.file)).size} fichiers)\n`);
for (const fam of FAMILIES) {
  const list = byFamily[fam.id] ?? [];
  if (!list.length) continue;
  console.log(`\n## ${fam.label} (${list.length})`);
  for (const h of list) console.log(`  ${h.file}:${h.line}  [${h.match}]  ยซ ${h.text} ยป`);
}
console.log('');
