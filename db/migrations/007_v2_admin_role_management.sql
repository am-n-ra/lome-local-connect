-- Ring B Admin role governance.
-- Additive and idempotent: preserves existing accounts, role grants and audit history.
-- Apply only after Root review on a temporary Neon branch, then promote intentionally.

alter table v2_account_roles
  drop constraint if exists v2_account_roles_role_check;

alter table v2_account_roles
  add constraint v2_account_roles_role_check
  check (role in ('buyer', 'seller', 'admin', 'operator', 'reviewer'));

create index if not exists v2_account_roles_admin_active_idx
  on v2_account_roles(account_id)
  where role = 'admin' and status = 'active';

comment on table v2_account_roles is 'Explicit Omni application roles. Neon Auth administrative metadata is not an Omni role.';
comment on column v2_account_roles.granted_by_account_id is 'Omni account that granted the role; null only for a documented bootstrap operation.';
