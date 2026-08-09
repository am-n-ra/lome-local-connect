import { neon } from "@neondatabase/serverless";

/**
 * Grants a staff role to a user by email.
 *   DATABASE_URL=... bun scripts/grant-role.ts someone@omni.tg admin
 */
const url = process.env["DATABASE_URL"];
const email = process.argv[2];
const role = process.argv[3] ?? "admin";
if (!url || !email) {
  console.error("usage: DATABASE_URL=... bun scripts/grant-role.ts <email> [admin|moderator|acquisition]");
  process.exit(1);
}
const sql = neon(url);
const rows = await sql.query("SELECT id FROM public.profiles WHERE email = $1", [email]);
const profile = (rows as unknown as { id: string }[])[0];
if (!profile) {
  console.error(`No profile for ${email}. Sign in once with that account first.`);
  process.exit(1);
}
await sql.query(
  "INSERT INTO public.user_roles (user_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING",
  [profile.id, role],
);
console.log(`granted ${role} to ${email}`);
