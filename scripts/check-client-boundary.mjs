import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.argv[2] ?? ".vercel/output/static";
const forbidden = [
  { name: "node:async_hooks", pattern: /node:async_hooks/ },
  { name: "AsyncLocalStorage", pattern: /AsyncLocalStorage/ },
  { name: "node:fs", pattern: /node:fs(?:["'])/ },
  { name: "node:net", pattern: /node:net(?:["'])/ },
  { name: "node:tls", pattern: /node:tls(?:["'])/ },
  { name: "Neon database driver", pattern: /@neondatabase\/(serverless|core)/ },
  { name: "Neon Auth server module", pattern: /neon-auth\.server/ },
];

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walk(path);
    return /\.(?:js|mjs|cjs)$/.test(entry.name) ? [path] : [];
  });
}

const files = walk(root);
const findings = [];
for (const file of files) {
  const source = readFileSync(file, "utf8");
  for (const rule of forbidden) {
    const match = rule.pattern.exec(source);
    if (match) findings.push(`${file}: ${rule.name} at offset ${match.index}`);
  }
}

if (findings.length) {
  console.error("Client boundary check failed:");
  console.error(findings.join("\n"));
  process.exit(1);
}

console.log(`Client boundary check passed: ${files.length} JavaScript artifacts scanned.`);
