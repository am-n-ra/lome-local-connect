import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, BadgeCheck, Banknote, CheckCircle2, Copy, QrCode, Smartphone, Star, Wallet, X } from 'lucide-react';
import { getAuthToken } from '../auth';
import { confirmExternalPayment, createPurchaseIntent, declareExternalPayment, getAvailabilityResponses, getTransaction, getTransactionMessages, issueBuyerQrToken, requestAvailability, sendTransactionMessage, submitTransactionRating, transitionTransaction, verifyQrToken } from './api';
import type { ExternalPaymentMethod, TransactionSnapshotResult, TransactionState } from './types';

type FlowProduct = { id: string; name: string };
type FlowFacility = { id: string; name: string };
type Stage = 'avail' | 'intent' | 'txn' | 'qr' | 'pay' | 'rate';

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
        setToast('Demande envoyée — le commerce confirme la dispo.');
        setError('');
        // poll the responses once so the buyer can see alivestatus
        const poll = async (): Promise<void> => {
          const t2 = await getAuthToken();
          if (!t2 || !result.data?.requestId) return;
          const responses = await getAvailabilityResponses({ requestId: result.data.requestId, token: t2 });
          if (responses.ok && responses.data && responses.data.responses.length > 0) {
            const r = responses.data.responses[0];
            setLiveResponse({ priceMinor: r.priceMinor ?? 0, quantityAvailable: r.quantityAvailable ?? 0, status: r.status });
            setStage('intent');
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
    <section className="sheet h-mid" role="dialog" aria-modal="true" aria-label="Demande de dispo">
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
          <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop:  ​8, marginBottom:  ​8 }}>
            <button type="button" className={budgetMode === 'unlimited' ? 'btn sm' : 'btn ghost sm'} style={{ width: 'auto', minHeight: 30 }} onClick={() => setBudgetMode('unlimited')}>Sans limite</button>
            <button type="button" className={budgetMode === 'maximum' ? 'btn sm' : 'btn ghost sm'} style={{ width: 'auto', minHeight: 30 }} onClick={() => setBudgetMode('maximum')}>Budget max</button>
          </div>
          {budgetMode === 'maximum' && (
            <input className="field" type="number" min="0" step="0.01" placeholder="Budget max (FCFA)" value={budget} onChange={(event) => setBudget(event.target.value)} />
          )}
          <button className="btn" type="submit" disabled={busy} style={{ marginTop: 10 }}>Demander la dispo <ArrowRight size={15} /></button>
        </form>
      )}
      {stage === 'intent' && liveResponse && (
        <div className="cardbox">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div><b>{facility.name}</b><br /><span className="tiny muted">{liveResponse.quantityAvailable} unités disponibles</span></div>
            <span className="status ok">En stock</span>
          </div>
          <p className="sub">{(liveResponse.priceMinor /  ​100).toFixed(2)} FCFA / unité</p>
          <div className="btnrow">
            <button className="btn" type="button" disabled={busy} onClick={() => void createIntent()}><BadgeCheck size={15} /> Confirmer mon intention</button>
            <button className="btn ghost" type="button" onClick={() => setStage('avail')}>Retour</button>
          </div>
        </div>
      )}
      {stage === 'txn' && (
        <div className="cardbox">
          <p className="tiny muted">Transaction {txnId ? txnId.slice(0, 8) : '—'} · {txn?.state ?? 'intent_created'}</p>
          {qrToken && <p className="sub">QR émis — présentable en caisse (ou « Scanner un QR » du dock).</p>}
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
          <div className="btnrow">
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
        <div className="cardbox">
          <p className="sub">Net à payer : {(txn?.netAmountMinor ?? 0) / 100} FCFA</p>
          <div className="btnrow">
            <button className="btn" type="button" disabled={busy} onClick={() => void declarePay('cash')}><Banknote size={15} /> Espèces</button>
            <button className="btn ghost" type="button" disabled={busy} onClick={() => void declarePay('mobile_money')}><Smartphone size={15} /> Mobile money</button>
          </div>
          <button className="btn ghost sm" style={{ width: 'auto', minHeight: 30, marginTop:  ​8 }} type="button" onClick={() => setStage('txn')}>Retour</button>
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