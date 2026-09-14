import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, UserX, RefreshCw, CheckCircle2, Archive } from 'lucide-react';
import { getAuthToken } from '../auth';
import { getAdminConsole, getReviewQueue, getRoleManagementAccounts, listTeams, createTeam, inviteTeamMember, revokeTeamInvite, setTeamMemberStatus, listAdminAuditEvents, reconcileRecharges, reviewFacilityClaim, setFacilityOperationalState, setManagedStaffRole, getAdminSellerActivationQueue, adminActivateSellerAccount } from './api';
import type { AdminConsoleResult, ReviewOutcome, ReviewQueueItem, RoleManagementAccount, Team, TeamInvite, TeamMember } from './types';

type AdminV13Props = {
  onClose: () => void;
  onFocusFacility?: (latitude: number, longitude: number, key: string) => void;
};

type Toast = { kind: 'ok' | 'err'; text: string };

export function AdminV13({ onClose, onFocusFacility }: AdminV13Props) {
  const [consoleData, setConsoleData] = useState<AdminConsoleResult | null>(null);
  const [queue, setQueue] = useState<ReviewQueueItem[]>([]);
  const [audits, setAudits] = useState<Array<{ id: string; eventType: string; entityType: string; entityId: string; createdAt: string; facilityName: string | null }>>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error' | 'unauthorized'>('loading');
  const [error, setError] = useState('');
  const [toast, setToast] = useState<Toast | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [reconciling, setReconciling] = useState(false);
  const [roleAccounts, setRoleAccounts] = useState<RoleManagementAccount[]>([]);
  const [roleBusy, setRoleBusy] = useState<string | null>(null);
  const [roleDraft, setRoleDraft] = useState<{ accountId: string; role: 'operator' | 'reviewer'; desired: 'active' | 'revoked'; label: string } | null>(null);
  const [roleDraftText, setRoleDraftText] = useState('');
  const [sellerCandidates, setSellerCandidates] = useState<Array<{ accountId: string; authUserId: string; onboardingState: string; facilityCount: number; createdAt: string; suspended: boolean }>>([]);
  const [sellerActivationBusy, setSellerActivationBusy] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamInvites, setTeamInvites] = useState<TeamInvite[]>([]);
  const [teamDraft, setTeamDraft] = useState({ name: '', zone: '', description: '' });
  const [inviteDraft, setInviteDraft] = useState<{ teamId: string; email: string; roleInTeam: 'lead' | 'member' } | null>(null);
  const [teamBusy, setTeamBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState('loading');
    setError('');
    try {
      const token = await getAuthToken();
      if (!token) { setState('unauthorized'); return; }
      const [consoleResult, queueResult, auditResult, roleResult, sellerActivationResult, teamResult] = await Promise.all([
        getAdminConsole({ token }),
        getReviewQueue({ token }),
        listAdminAuditEvents({ token, limit: 12 }),
        getRoleManagementAccounts({ token }),
        getAdminSellerActivationQueue({ token }),
        listTeams({ token }),
      ]);
      if (!consoleResult.ok || !consoleResult.data) {
        setState('unauthorized');
        setError(consoleResult.error?.message ?? 'Accès équipe non ouvert.');
        return;
      }
      setConsoleData(consoleResult.data);
      setQueue(queueResult.ok && queueResult.data ? queueResult.data.requests : []);
      setAudits(auditResult.ok && auditResult.data ? auditResult.data.events : []);
      setRoleAccounts(roleResult.ok && roleResult.data ? roleResult.data.accounts : []);
      setSellerCandidates(sellerActivationResult.ok && sellerActivationResult.data ? sellerActivationResult.data.candidates : []);
      if (teamResult.ok && teamResult.data) {
        setTeams(teamResult.data.teams ?? []);
        setTeamMembers(teamResult.data.members ?? []);
        setTeamInvites(teamResult.data.invites ?? []);
      } else {
        setTeams([]);
        setTeamMembers([]);
        setTeamInvites([]);
      }
      setState('ready');
    } catch (caught) {
      setState('error');
      setError(caught instanceof Error ? caught.message : 'Le centre de revue est indisponible.');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const review = useCallback(async (requestId: string, outcome: ReviewOutcome, facilityName: string) => {
    setActingId(requestId);
    setToast(null);
    try {
      const token = await getAuthToken();
      if (!token) { setToast({ kind: 'err', text: 'Session requise.' }); return; }
      const result = await reviewFacilityClaim({ requestId, outcome, reason: 'Revue depuis la console 1:1', token });
      if (result.ok) {
        setToast({ kind: 'ok', text: `${facilityName}: ${outcome === 'certified' ? 'certifiée' : outcome === 'rejected' ? 'rejetée' : 'preuve demandée'}.` });
        void load();
      } else {
        setToast({ kind: 'err', text: result.error?.message ?? 'Décision non enregistrée.' });
      }
    } catch (caught) {
      setToast({ kind: 'err', text: caught instanceof Error ? caught.message : 'Décision non enregistrée.' });
    } finally {
      setActingId(null);
    }
  }, [load]);

  const reconcile = useCallback(async () => {
    setReconciling(true);
    setToast(null);
    try {
      const token = await getAuthToken();
      if (!token) { setToast({ kind: 'err', text: 'Session requise.' }); return; }
      const result = await reconcileRecharges({ token });
      if (result.ok && result.data) {
        const { rechecked, credited, skipped, errors } = result.data;
        const notApproved = skipped.filter((item) => item.reason === 'not_approved').length;
        const noRef = skipped.filter((item) => item.reason === 'missing_reference').length;
        const unchanged = skipped.length;
        const detail = [
          credited ? `${credited} confirmée(s)` : '',
          notApproved ? `${notApproved} pas encore approuvée(s)` : '',
          noRef ? `${noRef} sans référence` : '',
          unchanged -notApproved - noRef ? `${unchanged - notApproved - noRef} autre(s)` : '',
        ].filter(Boolean).join(' · ');
        setToast({ kind: 'ok', text: `Revérifié (${rechecked}): ${detail || 'aucune en attente.'}${errors.length ? ` · ${errors.length} erreurs` : ''}.` });
      } else {
        setToast({ kind: 'err', text: result.error?.message ?? 'Revérification impossible.' });
      }
    } catch (caught) {
      setToast({ kind: 'err', text: caught instanceof Error ? caught.message : 'Revérification impossible.' });
    } finally {
      setReconciling(false);
      void load();
    }
  }, [load]);

  const confirmRoleComposer = useCallback(async () => {
    if (!roleDraft) return;;
    const trimmed = roleDraftText.trim();
    if (!trimmed) { setToast({ kind: "err", text: "Un motif est requis pour cette action." }); return; }
    const { accountId, role, desired, label } = roleDraft;
    setRoleBusy(`${accountId}:${role}:${desired}`);
    setToast(null);
    try {
      const token = await getAuthToken();
      if (!token) { setToast({ kind: "err", text: "Session requise." }); return; }
      const result = await setManagedStaffRole({ token, accountId, role, status: desired, reason: trimmed });
      if (result.ok) {
        setToast({ kind: "ok", text: `${label} ${desired === "active" ? "ajouté" : "révoqué"} — ${role}.` });
        setRoleDraft(null);
        setRoleDraftText("");
        void load();
      } else {
        setToast({ kind: "err", text: result.error?.message ?? "Changement de rôle non enregistré." });
      }
    } catch (caught) {
      setToast({ kind: "err", text: caught instanceof Error ? caught.message : "Changement de rôle non enregistré." });
    } finally {
      setRoleBusy(null);
    }
  }, [load, roleDraft, roleDraftText]);

  const cancelRoleComposer = useCallback(() => {
    setRoleDraft(null);
    setRoleDraftText("");
  }, []);

  const openRoleComposer = useCallback((accountId: string, role: 'operator' | 'reviewer', desired: 'active' | 'revoked') => {
    setRoleDraft({ accountId, role, desired, label: roleLabel(role) });
    setRoleDraftText('');
  }, []);

  const activateSeller = useCallback(async (candidate: { accountId: string }) => {
    setSellerActivationBusy(candidate.accountId);
    setToast(null);
    try {
      const token = await getAuthToken();
      if (!token) { setToast({ kind: 'err', text: 'Session requise.' }); return; }
      const result = await adminActivateSellerAccount({ token, accountId: candidate.accountId });
      if (result.ok) {
        setToast({ kind: 'ok', text: 'Compte vendeur activé — le switch montrera Seller.' });
        void load();
      } else {
        setToast({ kind: 'err', text: result.error?.message ?? 'Activation non enregistrée.' });
      }
    } catch (caught) {
      setToast({ kind: 'err', text: caught instanceof Error ? caught.message : 'Activation non enregistrée.' });
    } finally {
      setSellerActivationBusy(null);
    }
  }, [load]);

  const submitTeamCreate = useCallback(async () => {
    const name = teamDraft.name.trim();
    if (name.length < 1) { setToast({ kind: 'err', text: 'Un nom est requis pour le groupe.' }); return; }
    setTeamBusy('create');
    setToast(null);
    try {
      const token = await getAuthToken();
      if (!token) { setToast({ kind: 'err', text: 'Session requise.' }); return; }
      const result = await createTeam({ token, name, zone: teamDraft.zone.trim() || null, description: teamDraft.description.trim() || null });
      if (result.ok) {
        setToast({ kind: 'ok', text: 'Équipe créée.' });
        setTeamDraft({ name: '', zone: '', description: '' });
        void load();
      } else {
        setToast({ kind: 'err', text: result.error?.message ?? 'Équipe non créée.' });
      }
    } catch (caught) {
      setToast({ kind: 'err', text: caught instanceof Error ? caught.message : 'Équipe non créée.' });
    } finally {
      setTeamBusy(null);
    }
  }, [teamDraft, load]);

  const submitTeamInvite = useCallback(async (teamId: string) => {
    if (!inviteDraft || inviteDraft.teamId !== teamId) return;
    const email = inviteDraft.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setToast({ kind: 'err', text: 'Adresse e-mail invalide.' }); return; }
    setTeamBusy(`invite:${teamId}`);
    setToast(null);
    try {
      const token = await getAuthToken();
      if (!token) { setToast({ kind: 'err', text: 'Session requise.' }); return; }
      const result = await inviteTeamMember({ token, teamId, email, roleInTeam: inviteDraft.roleInTeam });
      if (result.ok) {
        setToast({ kind: 'ok', text: `Invitation envoyée à ${email}.` });
        setInviteDraft(null);
        void load();
      } else {
        setToast({ kind: 'err', text: result.error?.message ?? 'Invitation non envoyée.' });
      }
    } catch (caught) {
      setToast({ kind: 'err', text: caught instanceof Error ? caught.message : 'Invitation non envoyée.' });
    } finally {
      setTeamBusy(null);
    }
  }, [inviteDraft, load]);

  const submitTeamInviteRevoke = useCallback(async (invite: TeamInvite) => {
    if (!window.confirm(`Révoquer l'invitation de ${invite.email} ?`)) return;
    setTeamBusy(`revoke:${invite.id}`);
    setToast(null);
    try {
      const token = await getAuthToken();
      if (!token) { setToast({ kind: 'err', text: 'Session requise.' }); return; }
      const result = await revokeTeamInvite({ token, inviteId: invite.id, reason: `Révocation invitation ${invite.email}` });
      if (result.ok) {
        setToast({ kind: 'ok', text: 'Invitation révoquée.' });
        void load();
      } else {
        setToast({ kind: 'err', text: result.error?.message ?? 'Révocation non enregistrée.' });
      }
    } catch (caught) {
      setToast({ kind: 'err', text: caught instanceof Error ? caught.message : 'Révocation non enregistrée.' });
    } finally {
      setTeamBusy(null);
    }
  }, [load]);

  const submitTeamMemberStatus = useCallback(async (member: TeamMember, status: 'active' | 'revoked') => {
    if (status === 'revoked' && !window.confirm(`Retirer ${member.authUserId || member.accountId} de l'équipe ?`)) return;
    setTeamBusy(`member:${member.id}`);
    setToast(null);
    try {
      const token = await getAuthToken();
      if (!token) { setToast({ kind: 'err', text: 'Session requise.' }); return; }
      const result = await setTeamMemberStatus({ token, teamId: member.teamId, accountId: member.accountId, roleInTeam: member.roleInTeam, status, reason: status === 'revoked' ? `Retrait manuel de ${member.authUserId || member.accountId}` : `Réactivation de ${member.authUserId || member.accountId}` });
      if (result.ok) {
        setToast({ kind: 'ok', text: status === 'revoked' ? 'Membre retiré de l’équipe.' : 'Membre réactivé.' });
        void load();
      } else {
        setToast({ kind: 'err', text: result.error?.message ?? 'Changement non enregistré.' });
      }
    } catch (caught) {
      setToast({ kind: 'err', text: caught instanceof Error ? caught.message : 'Changement non enregistré.' });
    } finally {
      setTeamBusy(null);
    }
  }, [load]);

  const roleLabel = (role: string) => role === 'operator' ? 'Opérateur' : role === 'reviewer' ? 'Réviseur' : role === 'admin' ? 'Admin' : role === 'seller' ? 'Vendeur' : 'Acheteur';
  const roleChip = (account: RoleManagementAccount, role: 'operator' | 'reviewer', desired: 'active' | 'revoked') => {
    const active = account.roles.includes(role);
    return (
      <button
        className="chip"
        type="button"
        disabled={roleBusy !== null || active !== (desired === 'active')}
        onClick={() => openRoleComposer(account.accountId, role, desired)}
      >
        {desired === 'active' ? '+' : '−'} {roleLabel(role)}
      </button>
    );
  };

  return (
    <section className="sheet h-mid" data-sheet="admin" role="region" aria-label="Espace équipe">
      <div className="handle" />
      <div className="sheet-head">
        <div><div className="eyebrow">Espace équipe</div><h1>Revue Omni</h1></div>
        <span className="status ink">Admin</span>
      </div>
      {state === 'loading' && <p className="sub" role="status">Chargement du centre…</p>}
      {state === 'unauthorized' && <p className="sub" role="alert">{error || 'Accès équipe non ouvert pour cette session.'}</p>}
      {state === 'error' && (
        <div role="alert">
          <p className="sub">{error}</p>
          <button className="btn ghost sm" style={{ width: 'auto', minHeight: 30 }} onClick={() => void load()}><RefreshCw size={14} /> Réessayer</button>
        </div>
      )}
      {state === 'ready' && consoleData && (
        <>
          <div className="stat">
            <div className="tile"><small>Créations</small><strong>{consoleData.pendingActivations}</strong></div>
            <div className="tile"><small>Claims</small><strong>{consoleData.pendingClaims}</strong></div>
            <div className="tile"><small>Audit aujourd’hui</small><strong>{consoleData.auditEventsToday}</strong></div>
          </div>
          <div className="cardbox" style={{ marginTop: 8 }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div><b>Recharges Wallet</b><br /><span className="tiny muted">Re-vérifier les paiements FedaPay en attente</span></div>
              <button className="btn sm" type="button" disabled={reconciling} onClick={() => void reconcile()}><RefreshCw size={14} /> {reconciling ? 'Vérification…' : 'Re-vérifier'}</button>
            </div>
          </div>
          {roleAccounts.length > 0 && (
            <div className="cardbox" style={{ marginTop: 8 }}>
              <div className="eyebrow">Équipe · Rôles</div>
              <p className="tiny muted" style={{ marginBottom: 6 }}>Octroyer ou révoquer les rôles Opérateur / Réviseur ( motif obligatoire, audité(.</p>
              {roleAccounts.map((account) => (
                <div className="kv" key={account.accountId} style={{ padding: '6px 0', borderBottom: '1px solid var(--line, #e8e8e6)' }}>
                  <span>
                    <b>{account.onboardingState === 'seller_ready' ? 'Vendeur prêt' : 'Compte'}</b>
                    <br />
                    <span className="tiny muted">{account.suspended ? 'Suspendu' : 'Actif'} · {account.facilityCount} facilité{account.facilityCount === 1 ? '' : 's'}</span>
                  </span>
                  <span className="btnrow" style={{ gap: 4 }}>
                    {!account.roles.includes('operator') && roleChip(account, 'operator', 'active')}
                    {account.roles.includes('operator') && roleChip(account, 'operator', 'revoked')}
                    {!account.roles.includes('reviewer') && roleChip(account, 'reviewer', 'active')}
                    {account.roles.includes('reviewer') && roleChip(account, 'reviewer', 'revoked')}
                  </span>
                  {roleDraft?.accountId === account.accountId && (
                    <div style={{ flexBasis: '100%', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        className="fld"
                        type="text"
                        value={roleDraftText}
                        onChange={(e) => setRoleDraftText(e.target.value)}
                        placeholder={`${roleDraft?.desired === 'active' ? 'Octroi' : 'Révocation'} — motif audité`}
                        disabled={roleBusy !== null}
                        onKeyDown={(e) => { if (e.key === 'Enter') void confirmRoleComposer(); }}
                      />
                      <button className="btn sm" type="button" disabled={roleBusy !== null} onClick={() => void confirmRoleComposer()}>Confirmer</button>
                      <button className="btn ghost sm" type="button" disabled={roleBusy !== null} onClick={cancelRoleComposer}>Annuler</button>
                      {roleBusy !== null && <span className="tiny muted">Enregistrement…</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {sellerCandidates.length > 0 && (
            <div className="cardbox" style={{ marginTop: 8 }}>
              <div className="eyebrow">Activation vendeurs</div>
              <p className="tiny muted" style={{ marginBottom: 6 }}>Comptes avec une facilité prête a être activés comme vendeur. L'activation suit la certification.r</p>
              {sellerCandidates.map((candidate) => (
                <div className="kv" key={candidate.accountId} style={{ padding: '6px 0', borderBottom: '1px solid var(--line, #e8e8e6)' }}>
                  <span>
                    <b>{candidate.suspended ? 'Suspendu' : 'Vendeur candidat'}</b>
                    <br />
                    <span className="tiny muted">{candidate.facilityCount} facilité{candidate.facilityCount === 1 ? '' : 's'} · {new Date(candidate.createdAt).toLocaleDateString('fr-FR')}</span>
                  </span>
                  <button
                    className="btn sm"
                    type="button"
                    disabled={sellerActivationBusy !== null || candidate.suspended}
                    onClick={() => void activateSeller(candidate)}
                  >
                    {sellerActivationBusy === candidate.accountId ? 'Activation…' : 'Rendre vendeur'}
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="cardbox" style={{ marginTop: 8 }}>
            <div className="eyebrow">Équipe · Groupes</div>
            <p className="tiny muted" style={{ marginBottom: 6 }}>Créer des groupes de travail, inviter des comptes et organiser la zone ( motif audité pour tout changement ).</p>
            <div style={{ display: 'grid', gap: 6, marginBottom: 6 }}>
              <input className="fld" type="text" value={teamDraft.name} onChange={(e) => setTeamDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Nom de l’équipe (ex. Lomé Est)" disabled={teamBusy !== null} />
              <input className="fld" type="text" value={teamDraft.zone} onChange={(e) => setTeamDraft((d) => ({ ...d, zone: e.target.value }))} placeholder="Zone (optionnel)" disabled={teamBusy !== null} />
              <input className="fld" type="text" value={teamDraft.description} onChange={(e) => setTeamDraft((d) => ({ ...d, description: e.target.value }))} placeholder="Description (optionnel)" disabled={teamBusy !== null} />
            </div>
            <button className="btn sm" type="button" disabled={teamBusy !== null} onClick={() => void submitTeamCreate()}>{teamBusy === 'create' ? 'Création…' : 'Créer le groupe'}</button>
            {teams.length === 0 && teamBusy !== 'create' && <p className="tiny muted" style={{ marginTop: 6 }}>Aucun groupe créé pour le moment.</p>}
            {teams.map((team) => {
              const members = teamMembers.filter((m) => m.teamId === team.id);
              const invites = teamInvites.filter((i) => i.teamId === team.id && i.status === 'pending');
              return (
                <div key={team.id} style={{ marginTop: 8, borderTop: '1px solid var(--line, #e8e8e6)', paddingTop: 8 }}>
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <b>{team.name}</b>
                      <br />
                      <span className="tiny muted">{team.zone || 'Pas de zone'} · {team.memberCount} membre{team.memberCount === 1 ? '' : 's'} {new Date(team.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                    {team.description && <span className="tiny muted" style={{ maxWidth: 180, textAlign: 'right' }}>{team.description}</span>}
                  </div>
                  {members.length > 0 && (
                    <div style={{ marginTop: 4, display: 'grid', gap: 2 }}>
                      {members.map((member) => (
                        <div className="kv" key={member.id} style={{ padding: '4px 0' }}>
                          <span className="tiny">
                            {member.authUserId || member.accountId} <span className="muted">· {member.roleInTeam === 'lead' ? 'Responsable' : 'Membre'} {member.status === 'revoked' ? '· retiré' : ''}</span>
                          </span>
                          {member.status === 'active' && (
                            <button className="btn ghost sm" type="button" disabled={teamBusy !== null} onClick={() => void submitTeamMemberStatus(member, 'revoked')}>Retirer</button>
                          )}
                          {member.status === 'revoked' && (
                            <button className="btn ghost sm" type="button" disabled={teamBusy !== null} onClick={() => void submitTeamMemberStatus(member, 'active')}>Réactiver</button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {invites.length > 0 && (
                    <div style={{ marginTop: 4, display: 'grid', gap: 2 }}>
                      {invites.map((invite) => (
                        <div className="kv" key={invite.id} style={{ padding: '4px 0' }}>
                          <span className="tiny">Invitation · <b>{invite.email}</b> <span className="muted">· {invite.roleInTeam === 'lead' ? 'Responsable' : 'Membre'}</span></span>
                          <button className="btn ghost sm" type="button" disabled={teamBusy !== null} onClick={() => void submitTeamInviteRevoke(invite)}>Révoquer</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <button className="btn ghost sm" type="button" style={{ width: 'auto', minHeight: 26, marginTop: 4 }} disabled={teamBusy !== null} onClick={() => { setInviteDraft(inviteDraft?.teamId === team.id ? null : { teamId: team.id, email: '', roleInTeam: 'member' }); }}>
                    {inviteDraft?.teamId === team.id ? 'Fermer l’invitation' : '+ Inviter un compte'}
                  </button>
                  {inviteDraft?.teamId === team.id && (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginTop: 4 }}>
                      <input className="fld" type="text" style={{ flex: 1, minWidth: 150 }} value={inviteDraft.email} onChange={(e) => setInviteDraft((d) => (d ? { ...d, email: e.target.value } : d))} placeholder="email@exemple.com" disabled={teamBusy !== null} />
                      <select className="fld" value={inviteDraft.roleInTeam} onChange={(e) => setInviteDraft((d) => (d ? { ...d, roleInTeam: e.target.value === 'lead' ? 'lead' : 'member' } : d))} disabled={teamBusy !== null}>
                        <option value="member">Membre</option>
                        <option value="lead">Responsable</option>
                      </select>
                      <button className="btn sm" type="button" disabled={teamBusy !== null} onClick={() => void submitTeamInvite(team.id)}>Envoyer</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {toast && <p className="sub" role="status">{toast.text}</p>}
          {queue.length === 0 && <p className="sub" style={{ marginTop: 8 }}>Aucune demande en attente.</p>}
          {queue.map((item) => (
            <div className="cardbox" key={item.requestId}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <b>{item.facilityName}</b>
                  <br />
                  <span className="tiny muted">{item.state === 'claim' ? 'Claim' : item.state} · {item.evidenceCount} preuve{item.evidenceCount === 1 ? '' : 's'}</span>
                </div>
                <span className="status ink">À valider</span>
              </div>
              {(onFocusFacility && item.latitude && item.longitude) && (
                <button className="btn ghost sm" style={{ width: 'auto', minHeight: 28, marginTop:  ​6 }} onClick={() => onFocusFacility(item.latitude, item.longitude, `review-${item.requestId}`)}><ShieldCheck size={13} /> Voir sur la carte</button>
              )}
              <div className="btnrow">
                <button className="btn sm" disabled={actingId === item.requestId} onClick={() => void review(item.requestId, 'certified', item.facilityName)}><CheckCircle2 size={14} /> Valider</button>
                <button className="btn ghost sm" disabled={actingId === item.requestId} onClick={() => void review(item.requestId, 'needs_more_evidence', item.facilityName)}><Archive size={14} /> Preuve</button>
              </div>
            </div>
          ))}
          {audits.length > 0 && (
            <div className="cardbox">
              <div className="eyebrow">Audit récent</div>
              {audits.slice(0, 4).map((event) => (
                <div className="kv" key={event.id}>
                  <span>{event.facilityName ?? event.entityType}</span>
                  <b>{event.eventType}</b>
                </div>
              ))}
            </div>
          )}
          <p className="tiny muted" style={{ textAlign: 'center', marginTop: 8 }}>Le compteur de ventes ne se modifie pas ici. Chaque décision est motivée & auditée.</p>
          <div className="btnrow">
            <button className="btn ghost sm" type="button" disabled>Compteur — volet opérateur</button>
          </div>
        </>
      )}
      <button className="btn ghost sm" style={{ width: 'auto', minHeight: 30, marginTop: 8 }} onClick={onClose}><UserX size={14} /> Fermer</button>
    </section>
  );
}