import { describe, expect, it } from 'vitest';
import { neon } from '@neondatabase/serverless';
import { createTrunkRepository, FieldPilotPolicyError } from './trunk-repository';
import type { TeamMemberResult } from '../trunk/types';

type SqlStub = ReturnType<typeof neon>;

function stubSql(rows: Record<string, unknown>[]): { sql: SqlStub; queries: string[] } {
  const queries: string[] = [];
  const sql = ((strings: TemplateStringsArray, ...values: unknown[]) => {
    queries.push(strings.raw.join('¦'));
    void values;
    return Promise.resolve(rows);
  }) as SqlStub;
  return { sql, queries };
}

function stubSqlSequence(sequence: Record<string, unknown>[][]): { sql: SqlStub; queries: string[] } {
  const queries: string[] = [];
  let index = 0;
  const sql = ((strings: TemplateStringsArray, ...values: unknown[]) => {
    queries.push(strings.raw.join('¦'));
    void values;
    const rows = sequence[Math.min(index, sequence.length - 1)];
    index += 1;
    return Promise.resolve(rows);
  }) as SqlStub;
  return { sql, queries };
}

describe('team governance Root seam (NW-15 P2-A)', () => {
  it('lists an empty team set for an authorized admin with zero teams', async () => {
    const call = stubSql([{ authorized: true, teams: [], members: [], invites: [] }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.listTeams({ authUserId: 'auth-admin' });
    expect(result.authorized).toBe(true);
    expect(result.data).toEqual({ teams: [], members: [], invites: [] });
    expect(call.queries[0]).toContain("ar.role = 'admin'");
    expect(call.queries[0]).toContain('v2_teams');
  });

  it('returns authorized=false when the session has no active admin role', async () => {
    const call = stubSql([{ authorized: false, teams: [], members: [], invites: [] }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.listTeams({ authUserId: 'auth-user' });
    expect(result.authorized).toBe(false);
    expect(result.data.teams).toEqual([]);
  });

  it('maps teams, members, invites from aggregated json', async () => {
    const call = stubSql([{
      authorized: true,
      teams: [
        { id: 'team-1', name: 'Équipe Lomé Est', zone: 'Lomé Est', description: 'Field operators', created_by_account_id: 'admin-1', created_at: '2026-09-14T09:00:00.000Z', member_count: 1 },
      ],
      members: [
        { id: 'tm-1', team_id: 'team-1', account_id: 'account-1', auth_user_id: 'auth-1', role_in_team: 'lead', status: 'active', added_by_account_id: 'admin-1', created_at: '2026-09-14T09:00:00.000Z', revoked_at: null },
      ],
      invites: [
        { id: 'inv-1', team_id: 'team-1', email: 'op2@omni.test', role_in_team: 'member', status: 'pending', invited_by_account_id: 'admin-1', created_at: '2026-09-14T09:00:00.000Z', accepted_at: null, revoked_at: null },
      ],
    }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.listTeams({ authUserId: 'auth-admin' });
    expect(result.data.teams[0]).toMatchObject({ id: 'team-1', name: 'Équipe Lomé Est', zone: 'Lomé Est', memberCount: 1 });
    expect(result.data.members[0]).toMatchObject({ teamId: 'team-1', accountId: 'account-1', roleInTeam: 'lead', status: 'active' });
    expect(result.data.invites[0]).toMatchObject({ email: 'op2@omni.test', roleInTeam: 'member', status: 'pending' });
  });

  it('creates a team with an audit trail and a bounded reason', async () => {
    const call = stubSqlSequence([
      [{ id: 'team-1', name: 'Équipe Lomé Est', zone: 'Lomé Est' }],
    ]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.createTeam({
      authUserId: 'auth-admin', name: 'Équipe Lomé Est', zone: 'Lomé Est', description: 'Field operators zone Est', correlationId: 'corr-team',
    });
    expect(result).toMatchObject({ id: 'team-1', name: 'Équipe Lomé Est', zone: 'Lomé Est' });
    expect(call.queries[0]).toContain("ar.role = 'admin'");
    expect(call.queries[0]).toContain('insert into v2_teams');
    expect(call.queries[0]).toContain("'team_created'");
  });

  it('rejects a too-long or empty team name before any query', async () => {
    const repository = createTrunkRepository(stubSql([]).sql);
    await expect(repository.createTeam({ authUserId: 'auth-admin', name: '   ', correlationId: 'corr-team' })).rejects.toThrow(FieldPilotPolicyError);
    await expect(repository.createTeam({ authUserId: 'auth-admin', name: 'x'.repeat(61), correlationId: 'corr-team' })).rejects.toThrow(FieldPilotPolicyError);
  });

  it('invites a team member by email with an audit trail', async () => {
    const call = stubSqlSequence([
      [{ id: 'inv-1', team_id: 'team-1', email: 'op2@omni.test', role_in_team: 'member', status: 'pending' }],
    ]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.inviteTeamMember({
      authUserId: 'auth-admin', teamId: 'team-1', email: 'Op2@Omni.test', roleInTeam: 'member', correlationId: 'corr-inv',
    });
    expect(result).toMatchObject({ id: 'inv-1', teamId: 'team-1', email: 'op2@omni.test', roleInTeam: 'member', status: 'pending' });
    expect(result.email).toBe('op2@omni.test');
    expect(call.queries[0]).toContain('insert into v2_team_invites');
    expect(call.queries[0]).toContain("'team_invite_created'");
  });

  it('rejects an invalid invite email before any query', async () => {
    const repository = createTrunkRepository(stubSql([]).sql);
    await expect(repository.inviteTeamMember({ authUserId: 'auth-admin', teamId: 'team-1', email: 'not-an-email', roleInTeam: 'member', correlationId: 'corr-inv' })).rejects.toThrow(FieldPilotPolicyError);
  });

  it('revokes a pending invite with an audit trail', async () => {
    const call = stubSqlSequence([
      [{ id: 'inv-1', status: 'revoked' }],
    ]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.revokeTeamInvite({ authUserId: 'auth-admin', invokeId: 'inv-1', correlationId: 'corr-rev', reason: 'Changement de périmètre' });
    expect(result).toMatchObject({ id: 'inv-1', status: 'revoked' });
    expect(call.queries[0]).toContain("set status = 'revoked'");
    expect(call.queries[0]).toContain("'team_invite_revoked'");
  });

  it('updates a team member role/status with an audit trail', async () => {
    const call = stubSqlSequence([
      [{ team_id: 'team-1', account_id: 'account-1', role_in_team: 'lead', status: 'revoked' }],
    ]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.setTeamMemberStatus({
      authUserId: 'auth-admin', teamId: 'team-1', accountId: 'account-1', roleInTeam: 'lead', status: 'revoked', correlationId: 'corr-stat', reason: 'Mutation au sein de l équipe',
    });
    expect(result).toMatchObject({ teamId: 'team-1', accountId: 'account-1', roleInTeam: 'lead', status: 'revoked' });
    expect(call.queries[0]).toContain('update v2_team_members');
    expect(call.queries[0]).toContain("'team_member_revoked'");
  });

  it('rejects invalid member status/role before any query', async () => {
    const repository = createTrunkRepository(stubSql([]).sql);
    await expect(repository.setTeamMemberStatus({ authUserId: 'auth-admin', teamId: 'team-1', accountId: 'account-1', roleInTeam: 'boss' as TeamMemberResult['roleInTeam'], status: 'active' as TeamMemberResult['status'], correlationId: 'c', reason: 'Motif' })).rejects.toThrow(FieldPilotPolicyError);
    await expect(repository.setTeamMemberStatus({ authUserId: 'auth-admin', teamId: 'team-1', accountId: 'account-1', roleInTeam: 'member' as TeamMemberResult['roleInTeam'], status: 'bogus' as TeamMemberResult['status'], correlationId: 'c', reason: 'Motif' })).rejects.toThrow(FieldPilotPolicyError);
  });

  it('lists my pending team invites by resolving the account email from neon_auth', async () => {
    const call = stubSqlSequence([
      [{ id: 'account-1' }],
      [
        { id: 'inv-1', team_id: 'team-1', team_name: 'Équipe Lomé Est', team_zone: 'Lomé Est', role_in_team: 'member', status: 'pending', invited_by_account_id: 'admin-1', created_at: '2026-09-14T09:00:00.000Z', accepted_at: null },
      ],
    ]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.listMyTeamInvites({ authUserId: 'auth-invitee' });
    expect(result.authorized).toBe(true);
    expect(result.invites).toEqual([
      { id: 'inv-1', teamId: 'team-1', teamName: 'Équipe Lomé Est', teamZone: 'Lomé Est', roleInTeam: 'member', status: 'pending', invitedByAccountId: 'admin-1', createdAt: '2026-09-14T09:00:00.000Z', acceptedAt: null },
    ]);
    expect(call.queries[1]).toContain('join neon_auth."user" u on u.id::text = a.auth_user_id');
    expect(call.queries[1]).toContain("ti.status = 'pending'");
  });

  it('locks my team invites list for a session with no active account', async () => {
    const call = stubSqlSequence([[]]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.listMyTeamInvites({ authUserId: 'auth-ghost' });
    expect(result.authorized).toBe(false);
    expect(result.invites).toEqual([]);
  });

  it('accepts a pending invite and creates the membership with an audit trail', async () => {
    const call = stubSqlSequence([
      [{ id: 'inv-1', team_id: 'team-1', member_id: 'tm-1', role_in_team: 'member' }],
    ]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.acceptTeamInvite({ authUserId: 'auth-invitee', inviteId: 'inv-1', correlationId: 'corr-accept' });
    expect(result).toMatchObject({ id: 'inv-1', teamId: 'team-1', roleInTeam: 'member', status: 'accepted', memberId: 'tm-1' });
    expect(call.queries[0]).toContain('insert into v2_team_members');
    expect(call.queries[0]).toContain("on conflict (team_id, account_id) do update set status = 'active'");
    expect(call.queries[0]).toContain("'team_invite_accepted'");
  });

  it('rejects accepting an invite that is not pending or not addressed to the caller', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.acceptTeamInvite({ authUserId: 'auth-invitee', inviteId: 'inv-9', correlationId: 'corr-accept' })).rejects.toThrow(FieldPilotPolicyError);
    expect(call.queries[0]).toContain("ti.status = 'pending'");
  });

  it('assigns a facility zone as admin with an audit trail', async () => {
    const call = stubSqlSequence([
      [{ facility_id: 'facility-1', zone: 'Lomé Est' }],
    ]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.assignFacilityZone({ authUserId: 'auth-admin', facilityId: 'facility-1', zone: '  Lomé Est  ', correlationId: 'corr-zone' });
    expect(result).toMatchObject({ facilityId: 'facility-1', zone: 'Lomé Est' });
    expect(call.queries[0]).toContain('update v2_facilities f');
    expect(call.queries[0]).toContain("set zone =");
    expect(call.queries[0]).toContain("'facility_zone_assigned'");
  });

  it('clears a facility zone with a null assignment', async () => {
    const call = stubSqlSequence([
      [{ facility_id: 'facility-1', zone: null }],
    ]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.assignFacilityZone({ authUserId: 'auth-admin', facilityId: 'facility-1', zone: null, correlationId: 'corr-zone-clear' });
    expect(result).toEqual({ facilityId: 'facility-1', zone: null });
  });

  it('scopes the reviewer queue to the facilities of their zoned team', async () => {
    const call = stubSqlSequence([
      [{ id: 'account-reviewer' }],
      [
        { request_id: 'request-1', facility_id: 'facility-1', facility_name: 'Boutique Est', trust_state: 'verification_submitted', latitude: 6.13, longitude: 1.22, state: 'submitted', version: 1, created_at: '2026-09-14T09:00:00.000Z', submitted_at: '2026-09-14T09:00:00.000Z', evidence_count: 1, evidence_kinds: ['photo'] },
      ],
    ]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.listReviewQueue({ authUserId: 'auth-reviewer' });
    expect(result.authorized).toBe(true);
    expect(result.requests).toHaveLength(1);
    expect(result.requests[0]).toMatchObject({ requestId: 'request-1', facilityId: 'facility-1', facilityName: 'Boutique Est', state: 'submitted', evidenceCount: 1 });
    const query = call.queries[1];
    expect(query).toContain('v2_team_members');
    expect(query).toContain('t.zone = f.zone');
    expect(query).toContain('not exists');
  });
});