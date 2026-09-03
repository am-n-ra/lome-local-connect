-- T-07a admin proof probe (founder SQL editor run).
-- Verify + optionally correct the admin account role for proof.
-- Run once after 039, before scripts/prove-v2-admin.mjs.

-- 1. Does the admin auth user exist?
select u.id as auth_user_id, u.email, u.created_at
from neon_auth.user u
where u.email = 'kheirlissi@icloud.com'
limit 1;

-- 2. Does the v2 account exist for this auth user?
select a.id as account_id, a.auth_user_id, a.onboarding_state, a.suspended_at
from v2_accounts a
where a.auth_user_id = (select u.id from neon_auth.user u where u.email = 'kheirlissi@icloud.com' limit 1)
limit 1;

-- 3. What roles exist for this account?
select ar.id, ar.account_id, ar.role, ar.status, ar.granted_by_account_id, ar.created_at
from v2_account_roles ar
where ar.account_id = (select a.id from v2_accounts a where a.auth_user_id = (select u.id from neon_auth.user u where u.email = 'kheirlissi@icloud.com' limit 1) limit 1)
order by ar.created_at desc;

-- 4. UNCOMMENT THE BLOCK BELOW ONLY IF:
--    - step 1 returned a row (auth user exists)
--    - step 2 returned a row (v2 account exists)
--    - step 3 returned NO 'admin' row, or an admin row with status != 'active'
--    - AND the founder has confirmed this is the intended admin account.
--
-- insert into v2_account_roles (account_id, role, status, granted_by_account_id, granted_at)
-- values (
--   (select a.id from v2_accounts a where a.auth_user_id = (select u.id from neon_auth.user u where u.email = 'kheirlissi@icloud.com' limit 1) limit 1),
--   'admin',
--   'active',
--   (select a.id from v2_accounts a where a.auth_user_id = (select u.id from neon_auth.user u where u.email = 'kheirlissi@icloud.com' limit 1) limit 1),
--   now()
-- );
-- on conflict (account_id, role) do update set status = 'active', revoked_at = null;
