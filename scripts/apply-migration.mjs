import fs from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

const file = process.argv[2];
if (!file) throw new Error("Usage: node scripts/apply-migration.mjs <migration.sql>");
const databaseUrl = process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL or NEON_DATABASE_URL is not configured");
const sql = neon(databaseUrl);
const migration = await fs.readFile(file, "utf8");
const statements = [];
let start = 0;
let dollarTag = null;
for (let index = 0; index < migration.length; index += 1) {
  if (migration[index] === "$" && migration[index + 1] === "$" && !dollarTag) {
    dollarTag = "$$";
    index += 1;
    continue;
  }
  if (dollarTag === "$$" && migration[index] === "$" && migration[index + 1] === "$") {
    dollarTag = null;
    index += 1;
    continue;
  }
  if (!dollarTag && migration[index] === ";") {
    const statement = migration.slice(start, index).trim();
    if (statement) statements.push(statement);
    start = index + 1;
  }
}
const tail = migration.slice(start).trim();
if (tail) statements.push(tail);
for (const statement of statements) {
  await sql.query(statement);
}
console.log(JSON.stringify({ file, statements: statements.length, status: "applied" }));
