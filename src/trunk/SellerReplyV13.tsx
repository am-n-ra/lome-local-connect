import { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getAuthToken } from '../auth';
import { getSellerAvailabilityQueue, requestSellerAvailabilityResponse } from './api';
import type { SellerAvailabilityRequest } from './types';

type SellerReplyV13Props = { onClose: () => void };

type ReplyDraft = { status: 'available' | 'partial' | 'unavailable'; quantity: string; price: string; message: string };

function money(minor: number): string {
  const whole = Number.isInteger(minor / 100);
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: whole ? 0 : 2 }).format(minor / 100);
}

export function SellerReplyV13({ onClose }: SellerReplyV13Props) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [queue, setQueue] = useState<SellerAvailabilityRequest[]>([]);
  const [reply, setReply] = useState<Record<string, ReplyDraft>>({});

  const patch = useCallback((id: string, p: Partial<ReplyDraft>) => {
    setReply((current) => ({ ...current, [id]: { ...(current[id] ?? { status: 'available' as const, quantity: '', price: '', message: '' }), ...p } }));
  }, []);

  const load = useCallback(async () => {
    setError('');
    try {
      const token = await getAuthToken();
      if (!token) { setError('Connectez-vous pour gérer votre commerce.'); return; }
      const result = await getSellerAvailabilityQueue({ token });
      if (result.ok && result.data) setQueue(result.data.requests);
      else setError(result.error?.message ?? 'File de demandes indisponible.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'File de demandes indisponible.');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const submit = useCallback(async (request: SellerAvailabilityRequest) => {
    const draft = reply[request.id];
    if (!draft || busy) return;
    if (draft.status !== 'unavailable' && (!draft.quantity || Number(draft.quantity) < 0)) {
      setError('Indiquez une quantité disponible.');
      return;
    }
    const token = await getAuthToken();
    if (!token) { setError('Connectez-vous pour répondre.'); return; }
    setBusy(true);
    setError('');
    try {
      const result = await requestSellerAvailabilityResponse({
        requestId: request.id,
        facilityId: request.facilityId,
        productId: request.productId,
        status: draft.status,
        quantityAvailable: draft.status === 'unavailable' ? null : Math.round(Number(draft.quantity) || 0),
        priceMinor: draft.price && Number(draft.price) > 0 ? Math.round(Number(draft.price) * 100) : null,
        sellerMessage: draft.message.trim() ? draft.message.trim() : null,
        token,
        idempotencyKey: 'seller-reply-' + request.id + '-' + crypto.randomUUID(),
      });
      if (result.ok) {
        setReply((current) => { const next = { ...current }; delete next[request.id]; return next; });
        await load();
        setToast('Réponse envoyée au client.');
      } else {
        setError(result.error?.message ?? 'Réponse non envoyée.');
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Réponse non envoyée.');
    } finally { setBusy(false); }
  }, [reply, busy, load]);

  return (
    <section className="sheet h-mid" data-sheet="seller-reply" role="region" aria-label="Répondre aux demandes">
      <div className="handle" />
      <div className="sheet-head">
        <div><div className="eyebrow">Espace Seller</div><h1>Répondre aux demandes</h1></div>
        <button type="button" className="btn ghost sm" style={{ width: 'auto', minHeight: 28 }} onClick={onClose}><X size={15} /> Fermer</button>
      </div>
      {error && <p className="sub" role="alert">{error}</p>}
      {toast && <p className="sub" role="status">{toast}</p>}
      {busy && <p className="sub">…</p>}
      {queue.length === 0 && !busy && <p className="sub">Aucune demande en attente. Les demandes arrivent ici quand un client demande la dispo d’un produit de votre facilité.</p>}
      {queue.map((request) => {
        const draft = reply[request.id] ?? { status: 'available' as const, quantity: '', price: '', message: '' };
        return (
          <div key={request.id} className="cardbox" style={{ marginTop: 8 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div><b>{request.productName} ×{request.requestedQuantity}</b><br /><span className="tiny muted">{request.facilityName}</span></div>
              <span className="status gray">{request.freshness}</span>
            </div>
            <div className="row" style={{ gap: 4, marginTop: 4 }}>
              <span className="chip" style={{ margin: 0 }}>{request.deliveryMode === 'livraison' ? 'Livraison' : 'Retrait'}</span>
              {request.budgetMinor !== null && <span className="chip" style={{ margin: 0 }}>≤ {money(request.budgetMinor)}</span>}
            </div>
            {request.requestNote && <p className="tiny muted" style={{ marginTop: 4 }}>« {request.requestNote} »</p>}
            <div className="seg" style={{ display: 'flex', gap: 0, borderRadius: 999, border: '1px solid var(--line)', overflow: 'hidden', marginTop: 8 }}>
              {(['available', 'partial', 'unavailable'] as const).map((s) => (
<button key={s} type="button" className={(draft.status === s ? 'btn' : 'btn ghost') + ' sm'} style={{ flex: 1, borderRadius: 999, minHeight: 30 }} onClick={() => patch(request.id, { status: s })}>
                  {s === 'available' ? 'Dispo' : s === 'partial' ? 'Partiel' : 'Indispo'}
                </button>
              ))}
            </div>
            {draft.status !== 'unavailable' && (
              <div className="row" style={{ gap: 6, marginTop: 6 }}>
<input className="field" type="number" min="0" placeholder="Qté dispo" value={draft.quantity} onChange={(e) => patch(request.id, { quantity: e.target.value })} />
<input className="field" type="number" min="0" step="0.01" placeholder="Prix (FCFA)" value={draft.price} onChange={(e) => patch(request.id, { price: e.target.value })} />
              </div>
            )}
<textarea className="field lg" style={{ marginTop: 6, minHeight: 40, padding: '8px 12px', background: '#fff', border: '1px solid var(--line)', borderRadius: 12, fontSize: 11, color: 'var(--ink)', resize: 'none' }} placeholder="Message au client (optionnel)…" value={draft.message} onChange={(e) => patch(request.id, { message: e.target.value })} />
            <button className="btn ok" type="button" disabled={busy} style={{ marginTop: 8 }} onClick={() => void submit(request)}>Envoyer la réponse</button>
          </div>
        );
      })}
    </section>
  );
}