import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";

const root = process.argv[2] ?? ".vercel/output/static";
const sourceRoot = process.env.OMNI_SOURCE_ROOT ?? "src";
const forbidden = [
  { name: "node:async_hooks", pattern: /node:async_hooks/ },
  { name: "AsyncLocalStorage", pattern: /AsyncLocalStorage/ },
  { name: "node:fs", pattern: /node:fs(?:["'])/ },
  { name: "node:net", pattern: /node:net(?:["'])/ },
  { name: "node:tls", pattern: /node:tls(?:["'])/ },
  { name: "Neon database driver", pattern: /@neondatabase\/(serverless|core)/ },
  { name: "Neon Auth server module", pattern: /neon-auth\.server/ },
];
const sourceImportPattern = /(?:from|import\s*\()\s*["']([^"']+)["']/g;
const directServerImportPattern = /(?:^|\/)(?:[^/]+)\.server(?:\.[cm]?[jt]sx?)?$/;

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walk(path);
    return path;
  });
}

function sourceFiles() {
  return walk(sourceRoot).filter((file) => /\.(?:ts|tsx|js|jsx)$/.test(file));
}

function isUiFile(file) {
  const routesRoot = resolve("src", "routes");
  const apiRoot = resolve(routesRoot, "api");
  return file.endsWith(".tsx") || (file.startsWith(routesRoot) && !file.startsWith(apiRoot));
}

function resolveImport(fromFile, specifier) {
  if (!specifier.startsWith(".") && !specifier.startsWith("@/")) return null;
  const base = specifier.startsWith("@/")
    ? resolve(sourceRoot, specifier.slice(2))
    : resolve(dirname(fromFile), specifier);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    `${base}/index.ts`,
    `${base}/index.tsx`,
  ];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

const findings = [];

for (const file of sourceFiles()) {
  const source = readFileSync(file, "utf8");
  if (isUiFile(file)) {
    for (const match of source.matchAll(sourceImportPattern)) {
      const specifier = match[1];
      if (directServerImportPattern.test(specifier)) {
        findings.push(
          `${file}: direct server-only import ${specifier}; UI must call a typed server function boundary`,
        );
      }
    }
  }
}

const files = walk(root).filter((file) => /\.(?:js|mjs|cjs)$/.test(file));
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

console.log(
  `Client boundary check passed: ${files.length} JavaScript artifacts scanned; ${sourceFiles().length} source files checked for direct server imports.`,
);
