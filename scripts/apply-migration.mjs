import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const file = process.argv[2];
if (!file) throw new Error("Usage: node scripts/apply-migration.mjs <migration.sql>");
const databaseUrl = process.env["DATABASE_URL"] ?? process.env["NEON_DATABASE_URL"];
if (!databaseUrl) throw new Error("DATABASE_URL or NEON_DATABASE_URL is not configured");
const sql = neon(databaseUrl);
const migration = await fs.readFile(file, "utf8");
const checksum = createHash("sha256").update(migration).digest("hex");
const statements = [];
let start = 0;
let dollarTag = null;
let singleQuote = false;
let doubleQuote = false;
let lineComment = false;
let blockComment = false;

for (let index = 0; index < migration.length; index += 1) {
  const current = migration[index];
  const next = migration[index + 1];
  if (lineComment) {
    if (current === "\n") lineComment = false;
    continue;
  }
  if (blockComment) {
    if (current === "*" && next === "/") {
      blockComment = false;
      index += 1;
    }
    continue;
  }
  if (!singleQuote && !doubleQuote && !dollarTag && current === "-" && next === "-") {
    lineComment = true;
    index += 1;
    continue;
  }
  if (!singleQuote && !doubleQuote && !dollarTag && current === "/" && next === "*") {
    blockComment = true;
    index += 1;
    continue;
  }
  if (current === "'" && !doubleQuote && !dollarTag) {
    if (singleQuote && next === "'") {
      index += 1;
      continue;
    }
    singleQuote = !singleQuote;
    continue;
  }
  if (current === '"' && !singleQuote && !dollarTag) {
    if (doubleQuote && next === '"') {
      index += 1;
      continue;
    }
    doubleQuote = !doubleQuote;
    continue;
  }
  if (!singleQuote && !doubleQuote && current === "$" && next === "$") {
    dollarTag = dollarTag ? null : "$$";
    index += 1;
    continue;
  }
  if (!singleQuote && !doubleQuote && !dollarTag && current === ";") {
    const statement = migration.slice(start, index).trim();
    if (statement) statements.push(statement);
    start = index + 1;
  }
}
const tail = migration.slice(start).trim();
if (tail) statements.push(tail);
if (singleQuote || doubleQuote || dollarTag || blockComment) {
  throw new Error("Migration contains an unterminated SQL quote, dollar block, or comment");
}

await sql.query(`CREATE TABLE IF NOT EXISTS public.omni_schema_migrations (
  filename text PRIMARY KEY,
  checksum text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now()
)`);
const existing = await sql.query(
  `SELECT checksum FROM public.omni_schema_migrations WHERE filename = $1`,
  [file],
);
if (existing[0]?.checksum === checksum) {
  console.log(JSON.stringify({ file, statements: statements.length, status: "already_applied" }));
  process.exit(0);
}
for (const statement of statements) await sql.query(statement);
await sql.query(
  `INSERT INTO public.omni_schema_migrations (filename, checksum)
   VALUES ($1, $2)
   ON CONFLICT (filename) DO UPDATE SET checksum = EXCLUDED.checksum, applied_at = now()`,
  [file, checksum],
);
console.log(JSON.stringify({ file, statements: statements.length, status: "applied", checksum }));
