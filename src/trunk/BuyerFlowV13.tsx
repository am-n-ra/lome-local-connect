import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, BadgeCheck, Banknote, CheckCircle2, Copy, QrCode, Smartphone, Star, Wallet, X } from 'lucide-react';
import { getAuthToken } from '../auth';
import { confirmExternalPayment, createPurchaseIntent, declareExternalPayment, getAvailabilityResponses, getTransaction, getTransactionMessages, issueBuyerQrToken, requestAvailability, sendTransactionMessage, submitTransactionRating, transitionTransaction, verifyQrToken } from './api';
import type { ExternalPaymentMethod, TransactionSnapshotResult, TransactionState } from './types';

type FlowProduct = { id: string; name: string };
type FlowFacility = { id: string; name: string };
type Stage = 'avail' | 'pending' | 'result' | 'intent' | 'txn' | 'qr' | 'pay' | 'rate';

type BuyerFlowV13Props = {
  facility: FlowFacility;
  product: FlowProduct;
  onClose: () => void;
};

const STEPS: Array<{ id: Stage; label: string }> = [
  { id: 'avail', label: 'Dispo' },
  { id: 'intent', label: 'Intention' },
  { id: 'txn', label: 'Transaction' },
  { id: 'rate', label: 'Avis' },
];
const TXN_STAGES = [
  { label: 'Intention d\'achat', sub: 'enregistrée côté Omni' },
  { label: 'Transaction créée', sub: 'en attente de vérification' },
  { label: 'QR de transaction généré', sub: 'à faire scanner par le vendeur' },
  { label: 'Vérifiée', sub: 'le vendeur a scanné le QR' },
  { label: 'Paiement', sub: 'méthode choisie & déclarée' },
  { label: 'Exécution', sub: 'retrait / remise / livraison' },
  { label: 'Complétée', sub: 'notez le vendeur' },
];

function qrStyle(token: string): string {
  return token.split('').reduce((acc, ch) => acc + (ch.charCodeAt(0) % 2 ===  ​0 ? '█' : '▓'), '');
}

export function BuyerFlowV13({ facility, product, onClose }: BuyerFlowV13Props) {
  const [stage, setStage] = useState<Stage>('avail');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [budgetMode, setBudgetMode] = useState<'unlimited' | 'maximum'>('unlimited');
  const [budget, setBudget] = useState('');
  const [deliveryMode, setDeliveryMode] = useState<'retrait' | 'livraison'>('retrait');
  const [availNote, setAvailNote] = useState('');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [liveResponse, setLiveResponse] = useState<{ priceMinor: number; quantityAvailable: number; status: string } | null>(null);
  const [txn, setTxn] = useState<TransactionSnapshotResult | null>(null);
  const [txnId, setTxnId] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrExpires, setQrExpires] = useState('');
  const [messages, setMessages] = useState<Array<{ body: string; senderRole: string; createdAt: string }>>([]);
  const [score, setScore] = useState(5);
  const [note, setNote] = useState('');
  const [chatDraft, setChatDraft] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<number | null>(null);

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

  const loadTxn = useCallback(async (id: string) => {
    const token = await getAuthToken();
    if (!token) return;
    const [result, messagesResult] = await Promise.all([
      getTransaction({ transactionId: id, token }),
      getTransactionMessages({ transactionId: id, token }).catch(() => null),
    ]);
    if (result.ok && result.data) { setTxn(result.data); setTxnId(id); setStage('txn'); }
    if (messagesResult?.ok && messagesResult.data) setMessages(messagesResult.data.messages.slice(-4));
  }, []);

  const sendChat = useCallback(async () => {
    const body = chatDraft.trim();
    if (!body || !txnId || chatSending) return;
    const token = await getAuthToken();
    if (!token) { setError('Session requise.'); return; }
    setChatSending(true);
    try {
      const result = await sendTransactionMessage({ transactionId: txnId, body, token });
      if (result.ok && result.data) {
        setMessages((current) => [...current, { body: result.data!.body, senderRole: result.data!.senderRole, createdAt: result.data!.createdAt }].slice(-4));
        setChatDraft('');
      } else { setError(result.error?.message ?? 'Message non envoyé.'); }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Message non envoyé.');
    } finally { setChatSending(false); }
  }, [chatDraft, txnId, chatSending]);

  const request = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const token = await needAuth();
    if (!token) return;
    setBusy(true); setToast('');
    try {
      const result = await requestAvailability({
        productId: product.id,
        facilityId: facility.id,
        quantity,
        budgetMode,
        budgetMinor: budgetMode === 'maximum' ? Math.round(Number(budget) * 100) : null,
        token,
        idempotencyKey: 'flow-' + crypto.randomUUID(),
      });
      if (result.ok && result.data) {
        setRequestId(result.data.requestId);
        setToast('');
        setError('');
        setStage('pending');
        // poll the responses once so the buyer can see alivestatus
        const poll = async (): Promise<void> => {
          const t2 = await getAuthToken();
          if (!t2 || !result.data?.requestId) return;
          const responses = await getAvailabilityResponses({ requestId: result.data.requestId, token: t2 });
          if (responses.ok && responses.data && responses.data.responses.length > 0) {
            const r = responses.data.responses[0];
            setLiveResponse({ priceMinor: r.priceMinor ?? 0, quantityAvailable: r.quantityAvailable ?? 0, status: r.status });
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
  }, [busy, needAuth, product.id, facility.id, quantity, budgetMode, budget]);

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
        await loadTxn(intent.data.transactionId);
      } else { setError(intent.error?.message ?? 'Intention non créée.'); }
    } finally { setBusy(false); }
  }, [needAuth, requestId, loadTxn]);

  const issueQr = useCallback(async () => {
    const token = await needAuth();
    if (!token || !txnId) return;
    setBusy(true);
    try {
      const result = await issueBuyerQrToken({ transactionId: txnId, token });
      if (result.ok && result.data) {
        setQrToken(result.data.token);
        setQrExpires(result.data.expiresAt);
        setStage('qr');
      } else { setError(result.error?.message ?? 'QR non émis.'); }
    } finally { setBusy(false); }
  }, [needAuth, txnId]);

  const verifyQr = useCallback(async () => {
    const token = await needAuth();
    if (!token || !txnId || !qrToken) return;
    setBusy(true);
    try {
      const result = await verifyQrToken({ transactionId: txnId, tokenHash: qrToken, token });
      setToast(result.ok && result.data?.accepted ? 'QR vérifié par le vendeur côté caisse.' : (result.data?.reason ?? 'QR non vérifié.'));
      void loadTxn(txnId);
    } finally { setBusy(false); }
  }, [needAuth, txnId, qrToken, loadTxn]);

  const transition = useCallback(async (from: TransactionState, to: TransactionState) => {
    const token = await needAuth();
    if (!token || !txnId) return;
    setBusy(true);
    try {
      const result = await transitionTransaction({ transactionId: txnId, from, to, actorRole: 'buyer', token });
      if (result.ok) { void loadTxn(txnId); } else { setError(result.error?.message ?? 'Transition refusée.'); }
    } finally { setBusy(false); }
  }, [needAuth, txnId, loadTxn]);

  const declarePay = useCallback(async (method: ExternalPaymentMethod) => {
    const token = await needAuth();
    if (!token || !txnId) return;
    setBusy(true);
    try {
      const [declared, moved] = await Promise.all([
        declareExternalPayment({ transactionId: txnId, method, token }).catch(() => null),
        transitionTransaction({ transactionId: txnId, from: 'intent_created', to: 'payment_declared', actorRole: 'buyer', token }).catch(() => null),
      ]);
      if (declared?.ok || moved?.ok) { setStage('txn'); setToast('Paiement déclaré — le vendeur confirme.'); void loadTxn(txnId); }
      else setError('Déclaration de paiement non reçue.');
    } finally { setBusy(false); }
  }, [needAuth, txnId, loadTxn]);

  const rate = useCallback(async () => {
    const token = await needAuth();
    if (!token || !txnId) return;
    setBusy(true);
    try {
      const result = await submitTransactionRating({ transactionId: txnId, score, note: note, token });
      if (result.ok) {
        await transitionTransaction({ transactionId: txnId, from: 'received', to: 'rated', actorRole: 'buyer', token }).catch(() => null);
        setStage('rate'); setToast('Merci — votre avis est enregistré.');
      } else { setError(result.error?.message ?? 'Avis non enregistré.'); }
    } finally { setBusy(false); }
  }, [needAuth, txnId, score, note]);

  const copyQr = useCallback(async () => {
    if (!qrToken) return;
    try { await navigator.clipboard.writeText(qrToken); setCopied(true); window.setTimeout(() => setCopied(false), 1500); } catch { /* fallback */ }
  }, [qrToken]);

  return (
    <section className="sheet h-mid" role="dialog" aria-modal="false" aria-label="Demande de dispo">
      <div className="handle" />
      <div className="sheet-head">
        <div><div className="eyebrow">Disponibilité</div><h1>{product.name}</h1></div>
        <button type="button" className="btn ghost sm" style={{ width: 'auto', minHeight: 28 }} onClick={onClose}><X size={15} /> Fermer</button>
      </div>
      <div className="row" style={{ gap: 4, marginBottom:  ​6 }}>
        {STEPS.map((step) => (
          <span key={step.id} className={stage === step.id ? 'status ok' : 'status gray'}>{step.label}</span>
        ))}
      </div>
      {error && <p className="sub" role="alert">{error}</p>}
      {toast && <p className="sub" role="status">{toast}</p>}
      {stage === 'avail' && (
        <form className="cardbox" onSubmit={request}>
          <label className="label" htmlFor="flow-qty">Quantité</label>
          <input id="flow-qty" className="field" type="number" min="1" value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value || 1)))} />
          <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 8, marginBottom: 8 }}>
            <button type="button" className={budgetMode === 'unlimited' ? 'btn sm' : 'btn ghost sm'} style={{ width: 'auto', minHeight: 30 }} onClick={() => setBudgetMode('unlimited')}>Sans limite</button>
            <button type="button" className={budgetMode === 'maximum' ? 'btn sm' : 'btn ghost sm'} style={{ width: 'auto', minHeight: 30 }} onClick={() => setBudgetMode('maximum')}>Budget max</button>
          </div>
          {budgetMode === 'maximum' && (
            <input className="field" type="number" min="0" step="0.01" placeholder="Budget max (FCFA)" value={budget} onChange={(event) => setBudget(event.target.value)} />
          )}
          <div className="label" style={{ marginTop: 8 }}>Contraintes</div>
          <div className="seg" style={{ display: 'flex', gap: 0, borderRadius: 999, border: '1px solid var(--line)', overflow: 'hidden', marginTop: 4 }}>
            <button type="button" className={deliveryMode === 'retrait' ? 'btn sm' : 'btn ghost sm'} style={{ flex: 1, borderRadius: 999, minHeight: 30 }} onClick={() => setDeliveryMode('retrait')}>Retrait</button>
            <button type="button" className={deliveryMode === 'livraison' ? 'btn sm' : 'btn ghost sm'} style={{ flex: 1, borderRadius: 999, minHeight: 30 }} onClick={() => setDeliveryMode('livraison')}>Livraison</button>
          </div>
          <div className="field lg" style={{ marginTop: 8, minHeight: 48, padding: '8px 12px', background: '#fff', border: '1px solid var(--line)', borderRadius: 12, fontSize: 11, color: 'var(--ink)', resize: 'none' }} placeholder="Note (optionnel)…" value={availNote} onChange={(event) => setAvailNote(event.target.value)} />
          <button className="btn ok" type="submit" disabled={busy} style={{ marginTop: 10 }}>Envoyer la demande</button>
        </form>
      )}

      {stage === 'pending' && (
        <div className="cardbox">
          <p className="sub">Demande envoyée — le commerce confirme la dispo.</p>
          <div className="cardbox" style={{ marginTop: 8 }}>
            <div className="kv"><span>{product.name} ×{quantity}</span><b className="status gray">En attente</b></div>
          </div>
          <p className="tiny muted" style={{ marginTop: 7 }}>Sans réponse, Omni ne transforme jamais le silence en « disponible ».</p>
          <button className="btn sm" style={{ marginTop: 10 }} type="button" onClick={() => { if (requestId) { void (async () => { const t = await getAuthToken(); if (t) { const r = await getAvailabilityResponses({ requestId, token: t }); if (r.ok && r.data && r.data.responses.length > 0) { const resp = r.data.responses[0]; setLiveResponse({ priceMinor: resp.priceMinor ?? 0, quantityAvailable: resp.quantityAvailable ?? 0, status: resp.status }); setStage('result'); } } })(); } }}>Simuler la réponse</button>
        </div>
      )}
      {stage === 'result' && liveResponse && (
        <div>
          <div className="cardbox">
            <div className="kv"><span>{product.name} ×{quantity} (source : auto)</span><b className="status ok">{liveResponse.quantityAvailable} dispo</b></div>
          </div>
          <div className="freshbar" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '6px 10px', borderRadius: 999, background: 'var(--accent-soft)', fontSize: 9, color: 'var(--ink-soft)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
            Fraîcheur : il y a 2 min · reflète l’allocation Omni, pas l’inventaire total du vendeur
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
            <div className="kv"><span>{product.name} ×{quantity} (source : auto)</span><b className="status ok">{liveResponse.quantityAvailable} dispo</b></div>
            <div className="kv"><span>Prix unitaire</span><b>{(liveResponse.priceMinor / 100).toFixed(2)} FCFA</b></div>
            <div className="kv"><span>Total</span><b>{((liveResponse.priceMinor * quantity) / 100).toFixed(2)} FCFA</b></div>
          </div>
          <div className="freshbar" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '6px 10px', borderRadius: 999, background: 'var(--accent-soft)', fontSize: 9, color: 'var(--ink-soft)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
            Fraîcheur : il y a 2 min · reflète l'allocation Omni, pas l'inventaire total du vendeur
          </div>
          <p className="sub" style={{ marginTop: 8 }}>Crée la transaction. Une fois dedans, vous suivez jusqu'à la note — pas de retour.</p>
          <div className="btnrow" style={{ marginTop: 10 }}>
            <button className="btn ok" type="button" disabled={busy} onClick={() => void createIntent()}>Confirmer l'intention</button>
            <button className="btn ghost" type="button" onClick={() => setStage('avail')}>Retour</button>
          </div>
        </div>
      )}
      {stage === 'txn' && (
        <div>
          <div className="txntrack" style={{ marginTop: 8 }}>
            {[
              { id: 'intent', label: 'Intention d\'achat', sub: 'enregistrée côté Omni' },
              { id: 'created', label: 'Transaction créée', sub: 'en attente de vérification' },
              { id: 'qr', label: 'QR de transaction généré', sub: 'à faire scanner par le vendeur' },
              { id: 'verified', label: 'Vérifiée', sub: 'le vendeur a scanné le QR' },
              { id: 'payment', label: 'Paiement', sub: 'méthode choisie & déclarée' },
              { id: 'fulfilled', label: 'Exécution', sub: 'retrait / remise / livraison' },
              { id: 'completed', label: 'Complétée', sub: 'notez le vendeur' },
            ].map((step, i) => {
              const txnState = txn?.state ?? 'intent_created';
              const stateMap: Record<string, number> = { intent_created: 0, qr_issued: 2, verified: 3, payment_declared: 4, fulfilled: 5, received: 5, rated: 6, closed: 6 };
              const currentIdx = stateMap[txnState] ?? 0;
              const cls = i < currentIdx ? 'ok' : (i === currentIdx ? 'now' : '');
              return (
                <div className="txstep" key={step.id}>
                  <span className={`sdot ${cls}`} />
                  <div><b>{step.label}</b><small>{step.sub}</small></div>
                  <span className="go" style={{ fontSize: 10, color: cls === 'ok' ? 'var(--accent)' : cls === 'now' ? 'var(--ink)' : 'var(--ink-soft)' }}>{i < currentIdx ? '✓' : (i === currentIdx ? '→' : '')}</span>
                </div>
              );
            })}
          </div>
          {messages.length > 0 && (
            <div className="chatlog" aria-label="Conversation transaction" style={{ marginTop: 8 }}>
              {messages.map((message) => (
                <div className={`msg ${message.senderRole === 'buyer' ? 'me' : 'them'}`} key={message.createdAt + message.body}>
                  {message.body}
                  <small>{new Date(message.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</small>
                </div>
              ))}
            </div>
          )}
          <form className="chatbar" onSubmit={(event) => { event.preventDefault(); void sendChat(); }}>
            <input value={chatDraft} onChange={(event) => setChatDraft(event.target.value)} placeholder="Écrivez au commerce…" aria-label="Message au commerce" maxLength={1000} />
            <button type="submit" aria-label="Envoyer" disabled={chatSending || !chatDraft.trim()}><ArrowRight size={15} /></button>
          </form>
          <div className="btnrow" style={{ marginTop: 8 }}>
            <button className="btn" type="button" disabled={busy} onClick={() => void issueQr()}><QrCode size={15} /> Mon QR</button>
            <button className="btn ghost" type="button" disabled={busy || !qrToken} onClick={() => void verifyQr()}>Vérifier</button>
          </div>
          <div className="btnrow">
            <button className="btn ghost" type="button" disabled={busy} onClick={() => setStage('pay')}><Wallet size={15} /> Déclarer le paiement</button>
            {(txn?.state === 'received' || txn?.state === 'fulfilled') && (
              <button className="btn ghost" type="button" disabled={busy} onClick={async () => { await transition('received', 'rated').catch(() => undefined); void loadTxn(txnId!); setStage('rate'); }}>Donner mon avis</button>
            )}
          </div>
        </div>
      )}
      {stage === 'qr' && qrToken && (
        <div className="cardbox" style={{ textAlign: 'center' }}>
          <div aria-label="QR Omni" style={{ fontFamily: 'monospace', fontSize: 18, letterSpacing: '0.1em', wordBreak: 'break-all', lineHeight: 1.2, background: '#0f0f0f', color: '#fff', borderRadius: 12, padding: 14, marginBottom:  ​8 }}>{qrStyle(qrToken.slice(0, 48))}</div>
          <p className="tiny muted" style={{ wordBreak: 'break-all' }}>{qrToken}</p>
          <p className="tiny muted">Expire {new Date(qrExpires).toLocaleString('fr-FR')}</p>
          <div className="btnrow">
            <button className="btn" type="button" onClick={() => void copyQr()}><Copy size={15} /> {copied ? 'Copié' : 'Copier'}</button>
            <button className="btn ghost" type="button" onClick={() => setStage('txn')}>Retour</button>
          </div>
        </div>
      )}
      {stage === 'pay' && (
        <div>
          <div className="cardbox">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div><b>Omni Wallet</b><br /><span className="tiny muted">0,00 $ disponible</span></div>
              <span className="status gray">Indisponible</span>
            </div>
          </div>
          <div className="cardbox" style={{ marginTop: 6 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div><b>Mobile Money / cash à la remise</b><br /><span className="tiny muted">Déclaré par l'acheteur, confirmé par le vendeur</span></div>
              <span className="status ok">Recommandé</span>
            </div>
          </div>
          <div className="cardbox" style={{ marginTop: 6 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div><b>Recharge FedaPay</b><br /><span className="tiny muted">Recharge externe — pas de paiement transaction</span></div>
              <span className="status ink">Externe</span>
            </div>
          </div>
          <button className="btn ok" style={{ marginTop: 10 }} type="button" disabled={busy} onClick={() => void declarePay('cash')}>Déclarer le paiement</button>
          <p className="tiny muted" style={{ textAlign: 'center', marginTop: 9 }}>L'argent ne transite pas par Omni en V1 (D-05).</p>
          <button className="btn ghost sm" style={{ width: 'auto', minHeight: 30, marginTop: 8 }} type="button" onClick={() => setStage('txn')}>Retour</button>
        </div>
      )}
      {stage === 'rate' && (
        <div className="cardbox">
          <div className="row" style={{ gap: 6, marginBottom:  ​6 }}>
            {[1, 2,  ​3,  ​4,  ​5].map((value) => (
              <button type="button" key={value} className={score === value ? 'status ok' : 'status gray'} aria-label={`${value} étoiles`} onClick={() => setScore(value)}><Star size={14} /> {value}</button>
            ))}
          </div>
          <input className="field" placeholder="Note courte (optionnelle)" value={note} onChange={(event) => setNote(event.target.value)} />
          <div className="btnrow">
            <button className="btn" type="button" disabled={busy} onClick={() => void rate()}><CheckCircle2 size={15} /> Envoyer mon avis</button>
          </div>
        </div>
      )}
      <p className="tiny muted" style={{ textAlign: 'center', marginTop: 8 }}>Chaque étape est tracée & auditée.</p>
    </section>
  );
}