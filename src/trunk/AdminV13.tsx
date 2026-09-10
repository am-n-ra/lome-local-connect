import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, UserX, RefreshCw, CheckCircle2, Archive } from 'lucide-react';
import { getAuthToken } from '../auth';
import { getAdminConsole, getReviewQueue, getRoleManagementAccounts, listAdminAuditEvents, reconcileRecharges, reviewFacilityClaim, setFacilityOperationalState, setManagedStaffRole } from './api';
import type { AdminConsoleResult, ReviewOutcome, ReviewQueueItem, RoleManagementAccount } from './types';

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

  const load = useCallback(async () => {
    setState('loading');
    setError('');
    try {
      const token = await getAuthToken();
      if (!token) { setState('unauthorized'); return; }
      const [consoleResult, queueResult, auditResult, roleResult] = await Promise.all([
        getAdminConsole({ token }),
        getReviewQueue({ token }),
        listAdminAuditEvents({ token, limit: 12 }),
        getRoleManagementAccounts({ token }),
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