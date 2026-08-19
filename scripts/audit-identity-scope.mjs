import { neon } from "@neondatabase/serverless";
import { createHash } from "node:crypto";

const databaseUrl = process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL or NEON_DATABASE_URL is not configured");

const sql = neon(databaseUrl);
const digest = (value) =>
  createHash("sha256")
    .update(String(value ?? ""))
    .digest("hex")
    .slice(0, 12);
const redactId = (value) =>
  value ? `${String(value).slice(0, 8)}…${String(value).slice(-4)}` : null;

const [db, profiles, authUsers, profileCounts, facilities, usersByTable] = await Promise.all([
  sql`SELECT current_database() AS database_name, current_user AS database_user`,
  sql`SELECT id, email, onboarding_done FROM public.profiles ORDER BY id`,
  sql`SELECT id, email FROM neon_auth.user ORDER BY id`,
  sql`
    SELECT
      count(*)::int AS profile_count,
      count(DISTINCT lower(coalesce(email, '')))::int AS distinct_email_count,
      count(*) FILTER (WHERE onboarding_done = true)::int AS onboarded_count,
      count(*) FILTER (WHERE onboarding_done IS DISTINCT FROM true)::int AS not_onboarded_count
    FROM public.profiles
  `,
  sql`
    SELECT owner_id, count(*)::int AS facility_count,
           count(*) FILTER (WHERE status = 'certified')::int AS certified_count,
           count(*) FILTER (WHERE status <> 'certified' OR status IS NULL)::int AS other_count
    FROM public.facilities
    WHERE owner_id IS NOT NULL
    GROUP BY owner_id
    ORDER BY owner_id
  `,
  sql`
    SELECT table_name, row_count::int
    FROM (
      SELECT 'demand_requests' AS table_name, count(*) AS row_count FROM public.demand_requests
      UNION ALL SELECT 'transactions', count(*) FROM public.transactions
      UNION ALL SELECT 'messages', count(*) FROM public.messages
      UNION ALL SELECT 'reviews', count(*) FROM public.reviews
      UNION ALL SELECT 'coupons', count(*) FROM public.coupons
      UNION ALL SELECT 'wallet_accounts', count(*) FROM public.wallet_accounts
      UNION ALL SELECT 'wallet_ledger_entries', count(*) FROM public.wallet_ledger_entries
      UNION ALL SELECT 'user_roles', count(*) FROM public.user_roles
      UNION ALL SELECT 'notifications', count(*) FROM public.notifications
    ) counts
    ORDER BY table_name
  `,
]);

const profileEmailGroups = new Map();
for (const row of profiles) {
  const emailHash = digest(
    String(row.email ?? "")
      .trim()
      .toLowerCase(),
  );
  const group = profileEmailGroups.get(emailHash) ?? {
    email_hash: emailHash,
    profile_ids: [],
    profile_count: 0,
  };
  group.profile_ids.push(redactId(row.id));
  group.profile_count += 1;
  profileEmailGroups.set(emailHash, group);
}

console.log(
  JSON.stringify(
    {
      database: {
        name_hash: digest(db[0]?.database_name),
        user_hash: digest(db[0]?.database_user),
      },
      profiles: {
        ...profileCounts[0],
        email_groups: [...profileEmailGroups.values()],
        rows: profiles.map((row) => ({
          profile_id: redactId(row.id),
          email_hash: digest(
            String(row.email ?? "")
              .trim()
              .toLowerCase(),
          ),
          onboarding_done: row.onboarding_done,
        })),
      },
      auth_users: authUsers.map((row) => ({
        auth_id: redactId(row.id),
        email_hash: digest(
          String(row.email ?? "")
            .trim()
            .toLowerCase(),
        ),
      })),
      facilities_by_owner: facilities.map((row) => ({
        owner_id: redactId(row.owner_id),
        facility_count: row.facility_count,
        certified_count: row.certified_count,
        other_count: row.other_count,
      })),
      application_counts: usersByTable,
      safety: {
        read_only: true,
        neon_auth_users_not_modified: true,
        raw_emails_not_emitted: true,
        raw_ids_not_emitted: true,
      },
    },
    null,
    2,
  ),
);
