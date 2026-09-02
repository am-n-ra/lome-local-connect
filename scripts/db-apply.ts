import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

/**
 * Applies a .sql file to the Neon database.
 *   bun scripts/db-apply.ts db/schema.sql
 * Statements run one at a time over the HTTP driver.
 */
const file = process.argv[2];
if (!file) {
  console.error("usage: bun scripts/db-apply.ts <file.sql>");
  process.exit(1);
}

const url = process.env["DATABASE_URL"];
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(url);
const raw = readFileSync(file, "utf8");

/** Split on semicolons that are not inside $$ blocks, quotes, or comments. */
function splitStatements(input: string): string[] {
  const out: string[] = [];
  let current = "";
  let inDollar = false;
  let inSingle = false;
  let inLineComment = false;
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i]!;
    const next2 = input.slice(i, i + 2);
    if (inLineComment) {
      current += ch;
      if (ch === "\n") inLineComment = false;
      continue;
    }
    if (!inDollar && !inSingle && next2 === "--") {
      inLineComment = true;
      current += ch;
      continue;
    }
    if (!inSingle && next2 === "$$") {
      inDollar = !inDollar;
      current += next2;
      i += 1;
      continue;
    }
    if (!inDollar && ch === "'") {
      inSingle = !inSingle;
      current += ch;
      continue;
    }
    if (ch === ";" && !inDollar && !inSingle) {
      out.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) out.push(current);
  return out
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !/^(--[^\n]*\n?)+$/.test(s));
}

const statements = splitStatements(raw);
console.log(`applying ${statements.length} statement(s) from ${file}`);

for (const [index, statement] of statements.entries()) {
  const label = statement.replace(/\s+/g, " ").slice(0, 90);
  try {
    await sql.query(statement);
    console.log(`  [${index + 1}/${statements.length}] ok   ${label}`);
  } catch (error) {
    console.error(`  [${index + 1}/${statements.length}] FAIL ${label}`);
    console.error(error);
    process.exit(1);
  }
}

console.log("done");
