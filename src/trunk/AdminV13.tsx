import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, UserX, RefreshCw, CheckCircle2, Archive } from 'lucide-react';
import { getAuthToken } from '../auth';
import { correctFacilitySalesCounter, getAdminConsole, getReviewQueue, listAdminAuditEvents, reviewFacilityClaim, setFacilityOperationalState } from './api';
import type { AdminConsoleResult, ReviewOutcome, ReviewQueueItem } from './types';

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

  const load = useCallback(async () => {
    setState('loading');
    setError('');
    try {
      const token = await getAuthToken();
      if (!token) { setState('unauthorized'); return; }
      const [consoleResult, queueResult, auditResult] = await Promise.all([
        getAdminConsole({ token }),
        getReviewQueue({ token }),
        listAdminAuditEvents({ token, limit: 12 }),
      ]);
      if (!consoleResult.ok || !consoleResult.data) {
        setState('unauthorized');
        setError(consoleResult.error?.message ?? 'Accès équipe non ouvert.');
        return;
      }
      setConsoleData(consoleResult.data);
      setQueue(queueResult.ok && queueResult.data ? queueResult.data.requests : []);
      setAudits(auditResult.ok && auditResult.data ? auditResult.data.events : []);
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

  return (
    <section className="sheet h-mid" role="region" aria-label="Espace équipe">
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
            <button className="btn ghost sm" onClick={() => void correctFacilitySalesCounter({ token: '', facilityId: '', qualifyingSales: 0, reason: '' })}>Compteur (voir fiche)</button>
          </div>
        </>
      )}
      <button className="btn ghost sm" style={{ width: 'auto', minHeight: 30, marginTop: 8 }} onClick={onClose}><UserX size={14} /> Fermer</button>
    </section>
  );
}