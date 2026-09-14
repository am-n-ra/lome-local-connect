-- Omni V2 team governance (P3 NW-14 P2-A, tranche NW-15 P2-A).
-- Founder complaint #4: "les interfaces pour qu'un admin puisse faire d'un user operator / team".
-- Existing v2_account_roles grants GLOBAL roles (operator/reviewer). This migration adds the
-- TEAM referential: a team is a named operating group with an optional zone (field operators),
-- members carry a role within the team, and invites are email-based and accepted by the target.
-- Governance stays audit-friendly: every membership/invite write is attributed to the acting
-- admin via v2_audit_events (repo-level) and FK attribution columns here.
-- Additive + idempotent (guarded by if not exists / unique constraints).

create table if not exists v2_teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  zone text,
  description text,
  created_by_account_id uuid references v2_accounts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint v2_teams_name_check check (btrim(name) <> '' and char_length(btrim(name)) <= 60)
);

create table if not exists v2_team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references v2_teams(id) on delete cascade,
  account_id uuid not null references v2_accounts(id) on delete cascade,
  role_in_team text not null default 'member',
  status text not null default 'active',
  added_by_account_id uuid references v2_accounts(id) on delete set null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint v2_team_members_team_account_key unique (team_id, account_id),
  constraint v2_team_members_role_check check (role_in_team in ('lead', 'member')),
  constraint v2_team_members_status_check check (status in ('active', 'revoked'))
);

create table if not exists v2_team_invites (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references v2_teams(id) on delete cascade,
  email text not null,
  role_in_team text not null default 'member',
  status text not null default 'pending',
  invited_by_account_id uuid references v2_accounts(id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  revoked_at timestamptz,
  constraint v2_team_invites_role_check check (role_in_team in ('lead', 'member')),
  constraint v2_team_invites_status_check check (status in ('pending', 'accepted', 'revoked'))
);

create unique index if not exists v2_team_invites_pending_team_email_key on v2_team_invites (team_id, email) where status = 'pending';

create index if not exists v2_team_members_team_status_idx on v2_team_members (team_id, status);
create index if not exists v2_team_members_account_status_idx on v2_team_members (account_id, status);
create index if not exists v2_team_invites_team_status_idx on v2_team_invites (team_id, status);
comment on table v2_teams is 'Named team (operating group) used for operator/admin governance. Zone is an optional field zone (e.g. Loue or Aflao).';
comment on table v2_team_members is 'Team membership linking an Omni account to a team. role_in_team: lead/member, status active/revoked.';
comment on table v2_team_invites is 'Email invite to join a team. Pending/accepted/revoked; unique per team and email while pending.';