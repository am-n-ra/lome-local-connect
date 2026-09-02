-- Omni V2 Admin bootstrap — manual controlled operation
-- Run only after migration 007 has been applied to the intended Neon branch.
-- Replace the placeholder with the verified Neon Auth user id for kheirlissi@icloud.com.
-- Do not paste passwords or Auth tokens into this file.

begin;

-- Safety preflight: exactly one Omni account must match the supplied Auth id.
select id, auth_user_id, onboarding_state, suspended_at
from v2_accounts
where auth_user_id = '<VERIFIED_NEON_AUTH_USER_ID>';

-- Grant the explicit Omni application role. This does not modify Neon Auth metadata.
insert into v2_account_roles (account_id, role, status, granted_by_account_id, revoked_at)
select a.id, 'admin', 'active', null, null
from v2_accounts a
where a.auth_user_id = '<VERIFIED_NEON_AUTH_USER_ID>'
  and a.suspended_at is null
on conflict (account_id, role) do update
set status = 'active', revoked_at = null;

-- Record the bootstrap as a controlled, attributable operation.
insert into v2_audit_events (actor_account_id, event_type, entity_type, entity_id, correlation_id, reason)
select null, 'admin_role_bootstrap', 'account_role', a.id::text, 'bootstrap-admin-2026-08-27', 'Explicit initial Omni Admin bootstrap for kheirlissi@icloud.com; operator must verify Auth identity before execution.'
from v2_accounts a
where a.auth_user_id = '<VERIFIED_NEON_AUTH_USER_ID>'
  and a.suspended_at is null;

-- Review the resulting row before committing in the SQL client.
select a.auth_user_id, ar.role, ar.status, ar.created_at, ar.granted_by_account_id
from v2_accounts a
join v2_account_roles ar on ar.account_id = a.id
where a.auth_user_id = '<VERIFIED_NEON_AUTH_USER_ID>'
  and ar.role = 'admin';

-- Replace with COMMIT only after reviewing the preflight and resulting row.
rollback;
