import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { getAuthToken } from '../auth';
import { createPurchaseIntent, getAvailabilityResponses, getBuyerCreditSummary, requestAvailability } from './api';
import type { BuyerCreditSummary } from './types';
import { canProposePrice, isNegotiable } from './offer-price';
import { availabilitySourceLabel } from './availability-source';
import { useFreshnessTimer } from './useFreshnessTimer';
import type { PendingAction } from './ui-helpers';
import { formatMoney } from '../domain/currency';

type FlowProduct = { id: string; name: string; priceKind?: string | null; listedPriceMinor?: number | null };
type FlowFacility = { id: string; name: string; latitude?: number | null; longitude?: number | null };
// POINT 1 (2026-10-16) : le flux s'arrête à l'INTENTION. Tout ce qui suit (suivi, chat,
// QR, paiement, avis) vit dans la ROOM — seule surface transactionnelle. Le flux ne
// gardait qu'une copie tronquée du fil et dupliquait la Room.
type Stage = 'avail' | 'pending' | 'result' | 'intent';

type BuyerFlowV13Props = {
  facility: FlowFacility;
  product: FlowProduct;
  onClose: () => void;
  onGate?: (action: PendingAction) => boolean;
  /** BRANCHES-NOTIF-1 — signalé APRÈS l'action qui va utiliser les notifications
   *  (demande de dispo envoyée, intention d'achat créée). Jamais avant. */
  onEngagement?: (action: 'buyer-request' | 'buyer-intent') => void;
  walletBalanceMinor?: number | null;
  /** BRANCHES — si fourni, on rouvre le suivi d'une demande de disponibilité
   *  (étape « en attente de réponse » ou résultat) au lieu de repartir du formulaire. */
  resumeRequestId?: string | null;
  /** NR-5 / S-27 — à la confirmation de l'intention, on ouvre la ROOM de cette
   *  transaction. C'est la SEULE destination après intention (point 1, 2026-10-16). */
  onRoom?: (transactionId: string) => void;
};

const STEPS: Array<{ id: Stage; label: string }> = [
  { id: 'avail', label: 'Dispo' },
  { id: 'intent', label: 'Intention' },
];

// Payload scannable par le vendeur: transactionId + jeton brut.

export function BuyerFlowV13({ facility, product, onClose, onGate, onEngagement, walletBalanceMinor, resumeRequestId, onRoom }: BuyerFlowV13Props) {
  const [stage, setStage] = useState<Stage>('avail');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [budgetMode, setBudgetMode] = useState<'unlimited' | 'maximum'>('unlimited');
  const [budget, setBudget] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const negotiable = isNegotiable(product.priceKind);
  // Quantité — champ libre : l'utilisateur doit POUVOIR effacer (`''`) pour retaper.
  // On clampe au moment de l'usage (1 si vide/0/NaN), jamais à la frappe.
  const quantityValue = Math.max(1, Math.floor(Number(quantity) || 1));
  const [deliveryMode, setDeliveryMode] = useState<'retrait' | 'livraison'>('retrait');
  const [availNote, setAvailNote] = useState('');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [liveResponse, setLiveResponse] = useState<{ priceMinor: number; quantityAvailable: number; status: string; observedAt: string | null; responderKind?: 'seller' | 'automation' } | null>(null);
  const [creditSummary, setCreditSummary] = useState<BuyerCreditSummary | null>(null);
  const pollRef = useRef<number | null>(null);
  const freshness = useFreshnessTimer(liveResponse?.observedAt ?? null);

  const refreshCredits = useCallback(async () => {
    const token = await getAuthToken();
    if (!token) return;
    const result = await getBuyerCreditSummary({ token });
    if (result.ok && result.data) setCreditSummary(result.data);
  }, []);

  useEffect(() => { void refreshCredits(); }, [refreshCredits]);

  const clearPoll = useCallback(() => {
    if (pollRef.current !== null) { window.clearTimeout(pollRef.current); pollRef.current = null; }
  }, []);

  useEffect(() => clearPoll, [clearPoll]);

  const needAuth = useCallback(async (): Promise<string | null> => {
    setError('');
    try {
      const token = await getAuthToken();
      if (!token) { setError('Connectez-vous pour continuer.'); return null; }
      return token;
    } catch { setError('Session requise.'); return null; }
  }, []);

  // BRANCHES — reprise d'une demande de disponibilité : on rouvre directement le suivi
  // (« en attente de réponse », ou le résultat si le vendeur a déjà répondu) au lieu de
  // repartir du formulaire. Aucune persistance neuve : même lecture que le poll.
  useEffect(() => {
    if (!resumeRequestId) return;
    setRequestId(resumeRequestId);
    setStage('pending');
    let cancelled = false;
    const poll = async (): Promise<void> => {
      const token = await getAuthToken();
      if (!token || cancelled) return;
      const responses = await getAvailabilityResponses({ requestId: resumeRequestId, token });
      const list = responses.ok ? (responses.data?.responses ?? []) : [];
      if (list.length > 0) {
        const r = list[0];
        setLiveResponse({ priceMinor: r.priceMinor ?? 0, quantityAvailable: r.quantityAvailable ?? 0, status: r.status, observedAt: r.observedAt ?? null, responderKind: r.responderKind });
        setStage('result');
      } else {
        pollRef.current = window.setTimeout(poll, 4000);
      }
    };
    void poll();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeRequestId]);

  const request = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    if (onGate && !onGate({ kind: 'intent', returnTo: 'flow', facilityId: facility.id, facilityName: facility.name, productId: product.id, productName: product.name, quantity: quantityValue })) return;
    const token = await needAuth();
    if (!token) return;
    setBusy(true); setToast('');
    try {
      const result = await requestAvailability({
        productId: product.id,
        facilityId: facility.id,
        quantity: quantityValue,
        budgetMode,
        budgetMinor: budgetMode === 'maximum' ? Math.round(Number(budget) * 100) : null,
        proposedPriceMinor: negotiable && proposedPrice.trim() !== '' ? Math.round(Number(proposedPrice) * 100) : null,
        deliveryMode,
        note: availNote.trim().length > 0 ? availNote.trim() : null,
        token,
        idempotencyKey: 'flow-' + crypto.randomUUID(),
      });
      if (result.ok && result.data) {
        setRequestId(result.data.requestId);
        setToast('');
        setError('');
        // BRANCHES-NOTIF-1 — la demande part : l'acheteur attend une réponse hors écran.
        onEngagement?.('buyer-request');
        setCreditSummary((current) => current ? { ...current, creditsUsed: current.creditsUsed + result.data!.creditCost, creditsRemaining: result.data!.creditsRemaining, monthlyQuota: result.data!.monthlyQuota, plan: result.data!.plan } : { accountId: '', plan: result.data!.plan, monthlyQuota: result.data!.monthlyQuota, creditsUsed: 0, extraCredits: 0, creditsRemaining: result.data!.creditsRemaining, periodMonth: '' });
        void refreshCredits();
        setStage('pending');
        // poll the responses once so the buyer can see alivestatus
        const poll = async (): Promise<void> => {
          const t2 = await getAuthToken();
          if (!t2 || !result.data?.requestId) return;
          const responses = await getAvailabilityResponses({ requestId: result.data.requestId, token: t2 });
          const list = responses.ok ? (responses.data?.responses ?? []) : [];
          if (list.length > 0) {
            const r = list[0];
            setLiveResponse({ priceMinor: r.priceMinor ?? 0, quantityAvailable: r.quantityAvailable ?? 0, status: r.status, observedAt: r.observedAt ?? null, responderKind: r.responderKind });
            setStage('result');
          } else {
            pollRef.current = window.setTimeout(poll, 4000);
          }
        };
        void poll();
      } else {
        setError(result.error?.message ?? 'Demande non prise en compte.');
        setToast('');
      }
    } finally { setBusy(false); }
    }, [busy, needAuth, product.id, facility.id, quantityValue, budgetMode, budget, negotiable, proposedPrice, onEngagement]);

  useEffect(() => () => { if (pollRef.current !== null) window.clearTimeout(pollRef.current); }, []);

  const createIntent = useCallback(async () => {
    const token = await needAuth();
    if (!token || !requestId) return;
    setBusy(true);
    try {
      const responses = await getAvailabilityResponses({ requestId, token });
      const responseId = responses.ok && responses.data && responses.data.responses[0] ? responses.data.responses[0].id : undefined;
      if (!responseId) { setError('Aucune réponse de dispo à confirmer.'); return; }
      const intent = await createPurchaseIntent({ responseId, token, idempotencyKey: 'intent-' + crypto.randomUUID() });
      if (intent.ok && intent.data) {
        setToast('');
        // BRANCHES-NOTIF-1 — l'intention est prise : l'acheteur attend le scan du vendeur.
        onEngagement?.('buyer-intent');
        // NR-5 / S-27 / POINT 1 — l'intention ouvre la ROOM, SEULE surface transactionnelle.
        // Il n'y a plus de repli dans le flux : sans Room branchée, on ne prétend rien.
        if (onRoom) { onRoom(intent.data.transactionId); return; }
        setError('La transaction est ouverte dans votre espace.');
      } else { setError(intent.error?.message ?? 'Intention non créée.'); }
    } finally { setBusy(false); }
  }, [needAuth, requestId, onEngagement, onRoom]);

  return (
    <section className="sheet h-mid" data-sheet="flow" role="dialog" aria-modal="true" aria-label="Demande de dispo">
      <div className="handle" />
      <div className="sheet-head">
        <div><div className="eyebrow">Disponibilité</div><h1>{product.name}</h1></div>
        <button type="button" className="btn ghost sm" style={{ width: 'auto', minHeight: 28 }} onClick={onClose}><X size={15} /> Fermer</button>
      </div>
      <div className="row" style={{ gap: 4, marginBottom:  6 }}>
        {STEPS.map((step) => (
          <span key={step.id} className={stage === step.id ? 'status ok' : 'status gray'}>{step.label}</span>
        ))}
      </div>
      {error && <p className="sub" role="alert">{error}</p>}
      {toast && <p className="sub" role="status">{toast}</p>}
      {stage === 'avail' && (
        <form className="cardbox" onSubmit={request}>
          <label className="label" htmlFor="flow-qty">Quantité</label>
          <input id="flow-qty" className="field" type="number" min="1" value={quantity} inputMode="numeric" onChange={(event) => setQuantity(event.target.value.replace(/[^0-9]/g, ""))} />
          <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 8, marginBottom: 8 }}>
            <button type="button" className={budgetMode === 'unlimited' ? 'btn sm' : 'btn ghost sm'} style={{ width: 'auto', minHeight: 30 }} onClick={() => setBudgetMode('unlimited')}>Sans limite</button>
            <button type="button" className={budgetMode === 'maximum' ? 'btn sm' : 'btn ghost sm'} style={{ width: 'auto', minHeight: 30 }} onClick={() => setBudgetMode('maximum')}>Budget max</button>
          </div>
          {budgetMode === 'maximum' && (
            <input className="field" type="number" min="0" step="0.01" placeholder="Budget max (FCFA)" value={budget} onChange={(event) => setBudget(event.target.value)} />
          )}
          {canProposePrice(product.priceKind) ? (
            <div style={{ marginTop: 8 }}>
              <label className="label" htmlFor="flow-proposed">Prix proposé (négociable)</label>
              <input id="flow-proposed" className="field" type="number" min="0" step="0.01" placeholder={product.listedPriceMinor ? `Au plus ${formatMoney(product.listedPriceMinor, 'XOF')}` : 'Votre proposition (FCFA)'} value={proposedPrice} onChange={(event) => setProposedPrice(event.target.value)} />
              <p className="tiny muted" style={{ marginTop: 5 }}>Le vendeur reste libre : il répond avec SON prix. Négocier, c’est chercher moins cher que le prix affiché.</p>
            </div>
          ) : (
            <p className="tiny muted" style={{ marginTop: 8 }}>{product.priceKind === 'fixe' ? 'Offre à prix fixe : le prix affiché est le prix.' : 'Cette offre n’a pas déclaré de prix négociable.'}</p>
          )}
          <div className="label" style={{ marginTop: 8 }}>Contraintes</div>
          <div className="seg" style={{ display: 'flex', gap: 0, borderRadius: 999, border: '1px solid var(--line)', overflow: 'hidden', marginTop: 4 }}>
            <button type="button" className={deliveryMode === 'retrait' ? 'btn sm' : 'btn ghost sm'} style={{ flex: 1, borderRadius: 999, minHeight: 30 }} onClick={() => setDeliveryMode('retrait')}>Retrait</button>
            <button type="button" className={deliveryMode === 'livraison' ? 'btn sm' : 'btn ghost sm'} style={{ flex: 1, borderRadius: 999, minHeight: 30 }} onClick={() => setDeliveryMode('livraison')}>Livraison</button>
          </div>
          <textarea className="field lg" style={{ marginTop: 8, minHeight: 48, padding: '8px 12px', background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 12, fontSize: 11, color: 'var(--ink)', resize: 'none' }} placeholder="Note (optionnel)…" value={availNote} onChange={(event) => setAvailNote(event.target.value)} />
          {creditSummary && (
            <div className="row" style={{ marginTop: 8, alignItems: 'center', gap: 6 }}>
              <span className="tiny muted">Solde bulk : {creditSummary.creditsRemaining} crédit{creditSummary.creditsRemaining > 1 ? 's' : ''}</span>
              <span className="status ok">Vérification manuelle gratuite</span>
            </div>
          )}
          {error && <p className="sub" role="alert" style={{ marginTop: 8, color: 'var(--ink)' }}>{error}</p>}
          <button className="btn ok" type="submit" disabled={busy} style={{ marginTop: 10 }}>{busy ? 'Envoi de la demande…' : 'Envoyer la demande'}</button>
        </form>
      )}

      {stage === 'pending' && (
        <div className="cardbox">
          <p className="sub">Demande envoyée. Le commerce confirme la disponibilité.</p>
          <div className="cardbox" style={{ marginTop: 8 }}>
            <div className="kv"><span>{product.name} ×{quantityValue}</span><b className="status gray">En attente</b></div>
          </div>
          <p className="tiny muted" style={{ marginTop: 7 }}>Sans réponse, Omni ne transforme jamais le silence en « disponible ». Cette page se met à jour dès que le vendeur répond.</p>
        </div>
      )}
      {stage === 'result' && liveResponse && (
        <div>
          <div className="cardbox">
            <div className="kv"><span>{product.name} ×{quantityValue}</span><b className="status ok">{liveResponse.quantityAvailable} dispo</b></div>
            <div className="kv"><span>Réponse</span><b>{availabilitySourceLabel(liveResponse.responderKind)}</b></div>
          </div>
          <div className={`freshbar${freshness.level === 'stale' ? ' stale' : freshness.level === 'expired' ? ' expired' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '6px 10px', borderRadius: 999, background: 'var(--accent-soft)', fontSize: 9 }}>
            <span className="fdot" />
            Fraîcheur : {freshness.text || 'à l\'instant'} · reflète l'allocation Omni, pas l'inventaire total du vendeur
          </div>
          <div className="btnrow" style={{ marginTop: 10 }}>
            <button className="btn ghost" type="button" onClick={() => setStage('intent')}>Comparer</button>
            <button className="btn ok" type="button" onClick={() => setStage('intent')}>Je veux acheter</button>
          </div>
          <button className="btn ghost" style={{ marginTop: 10 }} type="button" onClick={() => setStage('pending')}>Voir d’autres facilités</button>
        </div>
      )}
            {stage === 'intent' && liveResponse && (
        <div>
          <div className="cardbox">
            <div className="kv"><span>{product.name} ×{quantityValue}</span><b className="status ok">{liveResponse.quantityAvailable} dispo</b></div>
            <div className="kv"><span>Réponse</span><b>{availabilitySourceLabel(liveResponse.responderKind)}</b></div>
            <div className="kv"><span>Prix unitaire</span><b>{formatMoney(liveResponse.priceMinor, 'XOF')}</b></div>
            <div className="kv"><span>Total</span><b>{formatMoney(liveResponse.priceMinor * quantityValue, 'XOF')}</b></div>
          </div>
          <div className={`freshbar${freshness.level === 'stale' ? ' stale' : freshness.level === 'expired' ? ' expired' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '6px 10px', borderRadius: 999, background: 'var(--accent-soft)', fontSize: 9 }}>
            <span className="fdot" />
            Fraîcheur : {freshness.text || 'à l\'instant'} · reflète l'allocation Omni, pas l'inventaire total du vendeur
          </div>
          <p className="sub" style={{ marginTop: 8 }}>Crée la transaction. Une fois dedans, vous suivez jusqu'à la note. Aucun retour en arrière.</p>
          <div className="btnrow" style={{ marginTop: 10 }}>
            <button className="btn ok" type="button" disabled={busy} onClick={() => void createIntent()}>Confirmer l'intention</button>
            <button className="btn ghost" type="button" onClick={() => setStage('avail')}>Retour</button>
          </div>
        </div>
      )}
      <p className="tiny muted" style={{ textAlign: 'center', marginTop: 8 }}>Chaque étape est tracée & auditée.</p>
    </section>
  );
}