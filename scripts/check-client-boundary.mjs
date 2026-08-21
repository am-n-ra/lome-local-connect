import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const forbidden = [/from\s+["']\.\.\/server\//, /from\s+["'].*\.server["']/, /process\.env/, /node:/];
const roots = [join(process.cwd(), "src/components"), join(process.cwd(), "src/core")];
const violations = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (/\.(ts|tsx|js|jsx)$/.test(entry.name) && !/\.test\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      const text = await readFile(path, "utf8");
      for (const pattern of forbidden) if (pattern.test(text)) violations.push(`${path}:${pattern}`);
    }
  }
}

for (const root of roots) await walk(root);
if (violations.length) {
  console.error("Client boundary violations:\n" + violations.join("\n"));
  process.exit(1);
}
console.log("Client boundary: clean");
