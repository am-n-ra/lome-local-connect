import fs from "node:fs";
import { neon } from "@neondatabase/serverless";
const url = fs.readFileSync(process.env.OMNI_DB_URL_FILE ?? "/home/ubuntu/.omni-staging-database-url", "utf8").trim();
const sql = neon(url);
const rows = await sql`SELECT current_database() AS database_name, now() AS observed_at`;
console.log(JSON.stringify({ connected: rows.length === 1, database: rows[0]?.database_name ?? null }));
