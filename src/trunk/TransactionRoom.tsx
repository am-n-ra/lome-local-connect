import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck, Banknote, CheckCircle2, Copy, QrCode, Smartphone, Star, X } from 'lucide-react';
import { confirmExternalPayment, declareExternalPayment, getTransaction, getTransactionMessages, issueBuyerQrToken, qrPayload, revokeQrToken, sendTransactionMessage, submitTransactionRating, transitionTransaction } from './api';
import { deadlineLabel, deadlineState, transactionStateLabel, transactionStateResponsible } from './transaction-time';
import { Skeleton } from './Skeleton';
import { OmniQr } from './OmniQr';
import type { ExternalPaymentMethod, TransactionMessage, TransactionSnapshotResult, TransactionState } from './types';

/** S-27 — la Room réunit suivi + chat (fil complet) + reçu dans une surface, symétrique
 *  acheteur/vendeur. Le backend (messages, snapshots, transitions) existe déjà : la Room
 *  LIT et déclenche les transitions acteur, elle n'introduit aucune règle neuve. */

const STEPS: Array<{ label: string; states: TransactionState[] }> = [
  { label: 'QR', states: ['intent_created', 'qr_ready'] },
  { label: 'Scan', states: ['qr_verified'] },
  { label: 'Paiement', states: ['payment_declared', 'payment_confirmed'] },
  { label: 'Remise', states: ['fulfilment_pending', 'fulfilled'] },
  { label: 'Avis', states: ['received', 'rated', 'closed'] },
];

const TERMINAL: TransactionState[] = ['closed', 'expired', 'rated'];

function stepIndex(state: TransactionState): number {
  const idx = STEPS.findIndex((step) => step.states.includes(state));
  return idx < 0 ? 2 : idx;
}

interface Props {
  transactionId: string;
  token: string;
  actorRole: 'buyer' | 'seller';
  /** Nom affiché de l'autre partie (vendeur pour l'acheteur, acheteur pour le vendeur). */
  counterparty: string | null;
  /** Horodatage du dernier événement (pour l'échéance FF-6), issu de la ligne de liste. */
  lastEventAt?: string | null;
  onClose: () => void;
  onChanged?: () => void;
}

export function TransactionRoom({ transactionId, token, actorRole, counterparty, lastEventAt = null, onClose, onChanged }: Props) {
  const [txn, setTxn] = useState<TransactionSnapshotResult | null>(null);
  const [messages, setMessages] = useState<TransactionMessage[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [score, setScore] = useState(5);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const [result, messagesResult] = await Promise.all([
      getTransaction({ transactionId, token }),
      getTransactionMessages({ transactionId, token }).catch(() => null),
    ]);
    if (result.ok && result.data) { setTxn(result.data); setState('ready'); }
    else { setState('error'); setError(result.error?.message ?? 'Transaction indisponible.'); }
    if (messagesResult?.ok && messagesResult.data) setMessages(messagesResult.data.messages);
  }, [transactionId, token]);

  useEffect(() => { void load(); }, [load]);

  const send = useCallback(async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const result = await sendTransactionMessage({ transactionId, body, token });
      if (result.ok && result.data) {
        setMessages((current) => [...current, result.data!]);
        setDraft('');
        onChanged?.();
      } else setError(result.error?.message ?? 'Message non envoyé.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Message non envoyé.');
    } finally { setSending(false); }
  }, [draft, sending, transactionId, token, onChanged]);

  const transition = useCallback(async (from: TransactionState, to: TransactionState) => {
    setBusy(true);
    try {
      const result = await transitionTransaction({ transactionId, from, to, actorRole, token });
      if (result.ok) { await load(); onChanged?.(); }
      else setError(result.error?.message ?? 'Transition refusée.');
    } finally { setBusy(false); }
  }, [transactionId, actorRole, token, load, onChanged]);

  const confirmPayment = useCallback(async () => {
    setBusy(true);
    try {
      await confirmExternalPayment({ transactionId, token }).catch(() => null);
      await transition('payment_declared', 'payment_confirmed');
    } finally { setBusy(false); }
  }, [transactionId, token, transition]);

  const declarePayment = useCallback(async (method: ExternalPaymentMethod) => {
    setBusy(true);
    try {
      await declareExternalPayment({ transactionId, method, token }).catch(() => null);
      await transition('qr_verified', 'payment_declared');
    } finally { setBusy(false); }
  }, [transactionId, token, transition]);

  const rate = useCallback(async () => {
    setBusy(true);
    try {
      const result = await submitTransactionRating({ transactionId, score, note: '', token });
      if (result.ok) { await transition('received', 'rated'); }
      else setError(result.error?.message ?? 'Avis non enregistré.');
    } finally { setBusy(false); }
  }, [transactionId, token, score, transition]);

  const issueQr = useCallback(async () => {
    setBusy(true);
    try {
      const result = await issueBuyerQrToken({ transactionId, token });
      if (result.ok && result.data) setQrToken(result.data.token);
      else setError(result.error?.message ?? 'QR non émis.');
    } finally { setBusy(false); }
  }, [transactionId, token]);

  const revokeQr = useCallback(async () => {
    setBusy(true);
    try {
      const result = await revokeQrToken({ transactionId, token });
      if (result.ok) setQrToken(null);
      else setError(result.error?.message ?? 'QR non révoqué.');
    } finally { setBusy(false); }
  }, [transactionId, token]);

  const copyQr = useCallback(async () => {
    if (!qrToken) return;
    try { await navigator.clipboard.writeText(qrPayload(transactionId, qrToken)); setCopied(true); window.setTimeout(() => setCopied(false), 1500); } catch { /* clipboard indisponible */ }
  }, [qrToken, transactionId]);

  const currentState = txn?.state ?? 'intent_created';
  const idx = stepIndex(currentState);
  const terminal = TERMINAL.includes(currentState);
  const responsible = transactionStateResponsible(currentState);
  const myTurn = responsible === actorRole;
  const deadline = deadlineState(currentState, lastEventAt);

  return (
    <section className="sheet h-mid" data-sheet="room" role="dialog" aria-modal="true" aria-label="Room de transaction">
      <div className="handle" />
      <div className="sheet-head">
        <div>
          <div className="eyebrow">Transaction · {counterparty ?? '—'}</div>
          <h1>{txn ? `Transaction` : 'Chargement…'}</h1>
        </div>
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <span className={`status ${terminal ? 'gray' : 'ink'}`}>{transactionStateLabel(currentState)}</span>
          <button type="button" className="btn ghost sm" style={{ width: 'auto', minHeight: 28 }} onClick={onClose}><X size={15} /> Fermer</button>
        </div>
      </div>

      {state === 'loading' && <div style={{ marginTop: 10 }}><Skeleton variant="kv" count={2} /></div>}
      {state === 'error' && <div role="alert"><p className="tiny muted" style={{ marginTop: 10 }}>{error || 'Transaction indisponible.'}</p></div>}

      {state === 'ready' && txn && (
        <>
          <div className="stepline" style={{ marginTop: 8 }} aria-hidden="true">
            {STEPS.map((step, i) => <i key={step.label} className={i <= idx ? 'on' : ''} />)}
          </div>
          <div className="steplabels">
            {STEPS.map((step) => <span key={step.label}>{step.label}</span>)}
          </div>

          <div className="cardbox" style={{ marginTop: 10 }}>
            <div className="kv"><span>Objet</span><b>{txn.quantity} unité{txn.quantity === 1 ? '' : 's'}</b></div>
            <div className="kv"><span>Total</span><b>{txn.netAmountMinor.toLocaleString('fr-FR')} {txn.couponCode ? `· ${txn.couponCode}` : ''}</b></div>
            <div className="kv"><span>Vendeur</span><b>{txn.sellerFacilityName ?? counterparty ?? '—'}</b></div>
            {(txn.sellerContactPhone || txn.sellerContactWhatsapp) && actorRole === 'buyer' && (
              <div className="kv"><span>Contact</span><b>{txn.sellerContactPhone ?? txn.sellerContactWhatsapp}</b></div>
            )}
          </div>

          <div className="cardbox">
            <div className="kv"><span>Étape</span><b>{transactionStateLabel(currentState)}<small className="tiny muted" style={{ display: 'block' }}>{responsible === 'system' ? 'système' : responsible === 'buyer' ? 'à l\'acheteur' : 'au vendeur'}</small></b></div>
          </div>
          {deadline && (
            <p className="tiny muted" style={{ marginTop: 6 }}>⏱ {deadlineLabel(deadline.minutesLeft)} — le temps relance, il n'annule jamais</p>
          )}

          {actorRole === 'buyer' && (currentState === 'qr_ready' || currentState === 'intent_created') && (
            <div className="cardbox" style={{ marginTop: 10 }}>
              <div className="eyebrow">Votre QR de transaction</div>
              {qrToken ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
                    <OmniQr value={qrPayload(transactionId, qrToken)} size={156} />
                  </div>
                  <p className="tiny muted" style={{ wordBreak: 'break-all', marginTop: 6 }}>{qrPayload(transactionId, qrToken)}</p>
                  <div className="btnrow" style={{ marginTop: 8 }}>
                    <button className="btn ghost sm" type="button" onClick={() => void copyQr()}><Copy size={14} /> {copied ? 'Copié' : 'Copier'}</button>
                    <button className="btn ghost sm" type="button" disabled={busy} onClick={() => void revokeQr()}>Révoquer</button>
                  </div>
                </>
              ) : (
                <button className="btn" style={{ marginTop: 8 }} type="button" disabled={busy} onClick={() => void issueQr()}><QrCode size={15} /> Émettre mon QR</button>
              )}
              <p className="tiny muted" style={{ marginTop: 6 }}>À faire scanner par le vendeur côté caisse. Le temps relance, il n'annule jamais.</p>
            </div>
          )}

          <div className="eyebrow" style={{ marginTop: 12 }}>Conversation de cette transaction</div>
          {messages.length > 0 ? (
            <div className="chatlog" aria-label="Conversation transaction">
              {messages.map((message) => (
                <div className={`msg ${message.senderRole === actorRole ? 'me' : 'them'}`} key={message.id}>
                  {message.body}
                  <small>{new Date(message.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</small>
                </div>
              ))}
            </div>
          ) : (
            <p className="sub" style={{ marginTop: 6 }}>Aucun message pour l'instant.</p>
          )}
          <form className="chatbar" onSubmit={(event) => { event.preventDefault(); void send(); }}>
            <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Écrire…" aria-label="Message de la transaction" maxLength={1000} />
            <button type="submit" aria-label="Envoyer" disabled={sending || !draft.trim()}><ArrowRight size={15} /></button>
          </form>

          {error && <div role="alert"><p className="tiny muted" style={{ marginTop: 8 }}>{error}</p></div>}

          {!terminal && myTurn && (
            <div className="btnrow" style={{ marginTop: 10 }}>
              {actorRole === 'buyer' && currentState === 'qr_verified' && (
                <>
                  <button className="btn" type="button" disabled={busy} onClick={() => void declarePayment('mobile_money')}><Smartphone size={15} /> Payer (Mobile Money)</button>
                  <button className="btn ghost" type="button" disabled={busy} onClick={() => void declarePayment('cash')}><Banknote size={15} /> Payer (cash)</button>
                </>
              )}
              {actorRole === 'buyer' && currentState === 'fulfilled' && (
                <button className="btn ok" type="button" disabled={busy} onClick={() => void transition('fulfilled', 'received')}><CheckCircle2 size={15} /> Confirmer la réception</button>
              )}
              {actorRole === 'buyer' && currentState === 'received' && (
                <>
                  <div className="row" style={{ gap: 4, alignItems: 'center' }} aria-label="Note">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" className="btn ghost sm" style={{ width: 'auto', minHeight: 26, opacity: n <= score ? 1 : 0.4 }} onClick={() => setScore(n)} aria-label={`Note ${n} sur 5`}><Star size={12} /></button>
                    ))}
                  </div>
                  <button className="btn ok" type="button" disabled={busy} onClick={() => void rate()}><Star size={15} /> Laisser un avis</button>
                </>
              )}
              {actorRole === 'seller' && currentState === 'payment_declared' && (
                <button className="btn ok" type="button" disabled={busy} onClick={() => void confirmPayment()}><BadgeCheck size={15} /> Confirmer le paiement</button>
              )}
              {actorRole === 'seller' && currentState === 'payment_confirmed' && (
                <button className="btn" type="button" disabled={busy} onClick={() => void transition('payment_confirmed', 'fulfilment_pending')}>Enregistrer l'exécution</button>
              )}
              {actorRole === 'seller' && currentState === 'fulfilment_pending' && (
                <button className="btn ok" type="button" disabled={busy} onClick={() => void transition('fulfilment_pending', 'fulfilled')}><CheckCircle2 size={15} /> Marquer la remise</button>
              )}
            </div>
          )}

          {terminal && (
            <div className="btnrow" style={{ marginTop: 10 }}>
              <button className="btn ghost sm" type="button" disabled aria-disabled="true" style={{ opacity: 0.55 }}>Signaler un problème — bientôt</button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
