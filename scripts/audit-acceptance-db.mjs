import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const tableRows = await sql`
  select table_name
  from information_schema.tables
  where table_schema = 'public'
    and table_name in ('facilities','products','demand_requests','demand_responses','profiles','carts')
  order by table_name
`;

const counts = {};
for (const row of tableRows) {
  const tableName = row.table_name;
  const countRows = await sql.query(`select count(*)::int as count from public."${tableName}"`);
  counts[tableName] = countRows[0]?.count ?? 0;
}

const states = await sql`
  select status, count(*)::int as count
  from public.facilities
  group by status
  order by status
`;
const sources = await sql`
  select coalesce(source, '(null)') as source, count(*)::int as count
  from public.facilities
  group by source
  order by source
`;
const sampleFacilities = await sql`
  select id, name, status, source, is_online, category
  from public.facilities
  order by created_at desc
  limit 8
`;

console.log(JSON.stringify({
  tables: tableRows.map((row) => row.table_name),
  counts,
  states,
  sources,
  sampleFacilities,
}, null, 2));
