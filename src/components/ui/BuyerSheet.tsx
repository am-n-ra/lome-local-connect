import { useState } from 'react';
import { X, ArrowRight, Send, CheckCircle2, Star, Wallet, Compass, Building2, Home, Check, ShieldCheck } from 'lucide-react';
import type { FacilityDetail, PurchaseIntentResult, TransactionState, TransactionMessage, ExternalPaymentMethod, AvailabilityResult, AvailabilityResponsesResult } from '../../trunk/types';

const currency = (minor: number, ccy: string) => {
  const major = Math.round(minor / 100);
  return `${major.toLocaleString('fr-FR')} ${ccy || 'XOF'}`;
};

const freshnessLabel = (f: string) => f === 'fresh' ? 'Fraîche' : f === 'stale' ? 'À actualiser' : 'Expirée';

const TXN_STAGES: [string, string][] = [
  ['Intention créée', 'enregistrée'],
  ['Transaction créée', 'serveur'],
  ['QR généré', 'à faire scanner'],
  ['Vérifié', 'vendeur a scanné'],
  ['Paiement', 'méthode choisie'],
  ['Préparation', 'en cours'],
  ['Complété', 'notez le vendeur'],
];

function txnStageFromState(state: TransactionState): number {
  if (state === 'rated') return 7;
  if (state === 'received') return 6;
  if (state === 'fulfilled') return 5;
  if (state === 'payment_declared') return 4;
  if (state === 'qr_verified') return 3;
  if (state === 'qr_ready') return 2;
  return 0;
}

// Maquette AVAIL sheet — panier de demande + constraints + send
export function AvailSheet(props: {
  facility: FacilityDetail | null;
  quantity: number;
  setQuantity: (n: number) => void;
  budgetMode: 'unlimited' | 'maximum';
  setBudgetMode: (m: 'unlimited' | 'maximum') => void;
  budget: string;
  setBudget: (s: string) => void;
  state: 'idle' | 'loading' | 'error';
  error: string;
  result: AvailabilityResult | null;
  responseData: AvailabilityResponsesResult | null;
  responseState: 'idle' | 'loading' | 'ready' | 'error';
  responseError: string;
  purchaseIntent: PurchaseIntentResult | null;
  transactionState: TransactionState;
  buyerQrResult: { transactionId: string; token: string; expiresAt: string } | null;
  paymentMethod: ExternalPaymentMethod;
  setPaymentMethod: (m: ExternalPaymentMethod) => void;
  paymentState: 'idle' | 'loading' | 'error' | 'success';
  paymentError: string;
  onIssueBuyerQr: () => void;
  onDeclarePayment: () => void;
  onMarkReceived: () => void;
  chatMessages: TransactionMessage[];
  chatSending: boolean;
  onSendChat: (body: string) => void;
  onRefreshResponses: () => void;
  onChooseResponse: (responseId: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [chatInput, setChatInput] = useState('');
  const [note, setNote] = useState('');
  const [deliveryMode, setDeliveryMode] = useState<'pickup' | 'delivery'>('pickup');
  const selected = props.facility?.products.find(p => true) ?? props.facility?.products[0];

  // Stage 1: no result yet — show panier + send
  if (!props.result) {
    return (
      <section className="omni-sheet omni-sheet-enter context-sheet" role="dialog" aria-modal="true" aria-label="Demande de disponibilité" style={{ height: '52%' }}>
        <div className="sheet-handle" />
        <div className="sheet-head">
          <div>
            <span className="section-kicker">Demande de disponibilité</span>
            <h2>Votre panier de demande</h2>
          </div>
          <button type="button" onClick={props.onClose} aria-label="Fermer"><X size={16} /></button>
        </div>
        <div className="maquette-cardbox">
          {selected && (
            <div className="kv" style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '5px 0', borderTop: '1px solid #e6e6e6', fontSize: 11 }}>
              <span style={{ color: '#6b6b6b' }}>{selected.name}</span>
              <b style={{ fontWeight: 800 }}>×{props.quantity}</b>
            </div>
          )}
        </div>
        <div className="omni-label">Contraintes</div>
        <div className="seg" style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <span
            style={{ flex: 1, textAlign: 'center', padding: '7px 0', borderRadius: 10, fontSize: 11, fontWeight: 800, border: '1px solid #e6e6e6', background: deliveryMode === 'pickup' ? '#0f0f0f' : '#f7f7f7', color: deliveryMode === 'pickup' ? '#fff' : '#6b6b6b', cursor: 'pointer' }}
            onClick={() => setDeliveryMode('pickup')}
          >Retrait</span>
          <span
            style={{ flex: 1, textAlign: 'center', padding: '7px 0', borderRadius: 10, fontSize: 11, fontWeight: 800, border: '1px solid #e6e6e6', background: deliveryMode === 'delivery' ? '#0f0f0f' : '#f7f7f7', color: deliveryMode === 'delivery' ? '#fff' : '#6b6b6b', cursor: 'pointer' }}
            onClick={() => setDeliveryMode('delivery')}
          >Livraison</span>
        </div>
        <div className="omni-label">Note (optionnel)</div>
        <input
          className="field"
          style={{ width: '100%', height: 36, marginTop: 7, border: '1px solid #e6e6e6', borderRadius: 10, padding: '7px 10px', background: '#fff', color: '#0f0f0f', fontSize: 11 }}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ajoutez une précision…"
        />
        {props.error && <div className="inline-error" role="alert" style={{ marginTop: 8, color: '#c00', fontSize: 11 }}>{props.error}</div>}
        <button
          className="btn ok"
          style={{ marginTop: 10 }}
          onClick={props.onSubmit}
          disabled={props.state === 'loading'}
        >
          {props.state === 'loading' ? 'Envoi…' : 'Envoyer la demande'}
        </button>
      </section>
    );
  }

  // Stage 2: result received — show responses + transaction flow
  const stage = txnStageFromState(props.transactionState);
  const responses = props.responseData?.responses ?? [];

  return (
    <section className="omni-sheet omni-sheet-enter context-sheet" role="dialog" aria-modal="true" aria-label="Transaction" style={{ height: '64%' }}>
      <div className="sheet-handle" />
      <div className="sheet-head">
        <div>
          <span className="section-kicker">Transaction</span>
          <h2>#{props.purchaseIntent?.transactionId.slice(0, 8) ?? '—'} · {props.facility?.name}</h2>
        </div>
        <span className={`status ${stage >= 7 ? 'ok' : 'ink'}`}>
          {stage >= 7 ? 'Complétée' : 'En cours'}
        </span>
      </div>

      {/* Transaction tracker timeline */}
      <div className="txntrack" style={{ display: 'grid', gap: 0, marginTop: 8 }}>
        {TXN_STAGES.map((st, i) => {
          const cls = i < stage ? 'ok' : i === stage ? 'now' : '';
          return (
            <div className="txstep" key={i} style={{ display: 'grid', gridTemplateColumns: '14px 1fr', gap: 8, padding: '5px 0' }}>
              <span className={`sdot ${cls}`} style={{
                width: 10, height: 10, borderRadius: '50%',
                background: i < stage ? '#2e8b6f' : i === stage ? '#0f0f0f' : '#e6e6e6',
                marginTop: 2,
              }} />
              <div>
                <b style={{ fontSize: 11, color: '#0f0f0f' }}>{st[0]}</b>
                <small style={{ display: 'block', fontSize: 9, color: '#6b6b6b' }}>{st[1]}</small>
              </div>
              <span style={{ fontSize: 12, color: i < stage ? '#2e8b6f' : i === stage ? '#0f0f0f' : '#e6e6e6' }}>
                {i < stage ? '✓' : i === stage ? '→' : ''}
              </span>
            </div>
          );
        })}
      </div>

      {/* Responses from seller */}
      {responses.length > 0 && (
        <>
          <div className="omni-label">Réponses vérifiées</div>
          <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
            {responses.map((r) => (
              <div className="maquette-cardbox" key={r.id} style={{ fontSize: 11 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <b style={{ fontSize: 11 }}>{r.facilityName}</b>
                    <small style={{ display: 'block', fontSize: 9, color: '#6b6b6b' }}>{r.productName} · {freshnessLabel(r.freshness)}</small>
                  </div>
                  <span className={`status ${r.status === 'available' ? 'ok' : r.status === 'partial' ? 'gray' : 'dash'}`}>
                    {r.status === 'available' ? 'Disponible' : r.status === 'partial' ? 'Partielle' : 'Indisponible'}
                  </span>
                </div>
                {r.status !== 'unavailable' && !props.purchaseIntent && (
                  <button className="btn sm ok" style={{ marginTop: 8 }} onClick={() => props.onChooseResponse(r.id)}>
                    Choisir cette offre
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* QR transactionnel */}
      {props.purchaseIntent && stage < 3 && (
        <>
          <div className="omni-label">QR transactionnel</div>
          <div className="maquette-cardbox" style={{ textAlign: 'center', marginTop: 8 }}>
            {props.buyerQrResult ? (
              <div style={{ display: 'grid', placeItems: 'center', padding: 14 }}>
                <div className="code" style={{
                  width: 120, height: 120,
                  border: '8px solid #fff', outline: '1px solid #e6e6e6',
                  background: 'repeating-conic-gradient(#111 0 8%, #fff 0 16%)',
                  borderRadius: 12,
                }} />
                <p className="tiny muted" style={{ marginTop: 8, fontSize: 9, color: '#6b6b6b' }}>
                  Présentez ce QR au vendeur
                </p>
              </div>
            ) : (
              <button className="btn ok" style={{ marginTop: 10 }} onClick={props.onIssueBuyerQr}>
                Afficher le QR
              </button>
            )}
          </div>
        </>
      )}

      {/* Payment method — D-05: no money transit */}
      {stage >= 3 && stage < 4 && (
        <>
          <div className="omni-label">Paiement</div>
          <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
            <div className="maquette-cardbox" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <b style={{ fontSize: 11 }}>Mobile Money / cash à la remise</b>
                <small style={{ display: 'block', fontSize: 9, color: '#6b6b6b' }}>Déclaré par l'acheteur, confirmé par le vendeur</small>
              </div>
              <span className={`status ${props.paymentMethod === 'mobile_money' ? 'ok' : 'gray'}`}>Recommandé</span>
            </div>
            <div className="maquette-cardbox" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <b style={{ fontSize: 11 }}>Recharge FedaPay</b>
                <small style={{ display: 'block', fontSize: 9, color: '#6b6b6b' }}>Recharge externe — pas de paiement transaction</small>
              </div>
              <span className="status ink">Externe</span>
            </div>
          </div>
          <button
            className="btn ok"
            style={{ marginTop: 10 }}
            onClick={props.onDeclarePayment}
            disabled={props.paymentState === 'loading'}
          >
            {props.paymentState === 'loading' ? 'Déclaration…' : 'Déclarer le paiement'}
          </button>
          <p className="tiny muted" style={{ textAlign: 'center', marginTop: 8, fontSize: 9, color: '#6b6b6b' }}>
            L'argent ne transite pas par Omni en V1 (D-05).
          </p>
          {props.paymentError && <div className="inline-error" role="alert" style={{ marginTop: 8, color: '#c00', fontSize: 11 }}>{props.paymentError}</div>}
        </>
      )}

      {/* Chat */}
      {props.purchaseIntent && (
        <>
          <div className="omni-label">Chat transaction</div>
          <div className="chatlog" style={{ display: 'grid', gap: 6, marginTop: 8 }}>
            {props.chatMessages.map((m, i) => (
              <div key={i} className={`msg ${m.senderRole === 'buyer' ? 'me' : 'them'}`} style={{
                maxWidth: '82%',
                padding: '8px 11px', borderRadius: 13, fontSize: 11, lineHeight: 1.35,
                justifySelf: m.senderRole === 'buyer' ? 'end' : 'start',
                background: m.senderRole === 'buyer' ? '#0f0f0f' : '#f7f7f7',
                color: m.senderRole === 'buyer' ? '#fff' : '#6b6b6b',
                border: m.senderRole === 'buyer' ? 'none' : '1px solid #e6e6e6',
                borderBottomLeftRadius: m.senderRole === 'seller' ? 4 : undefined,
                borderBottomRightRadius: m.senderRole === 'buyer' ? 4 : undefined,
              }}>
                {m.body}
                <small style={{ display: 'block', fontSize: 7, opacity: 0.7, marginTop: 3 }}>
                  {m.senderRole === 'buyer' ? 'Vous' : 'Vendeur'} · {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </small>
              </div>
            ))}
          </div>
          <div className="chatbar" style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <input
              style={{ flex: 1, height: 34, border: '1px solid #e6e6e6', borderRadius: 999, padding: '0 12px', fontSize: 11, outline: 0 }}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Question sur cette transaction…"
              onKeyDown={(e) => { if (e.key === 'Enter' && chatInput.trim()) { props.onSendChat(chatInput.trim()); setChatInput(''); } }}
            />
            <button
              className="btn"
              style={{ width: 38, minHeight: 34, padding: 0 }}
              onClick={() => { if (chatInput.trim()) { props.onSendChat(chatInput.trim()); setChatInput(''); } }}
              disabled={props.chatSending}
            >
              <Send size={14} />
            </button>
          </div>
          <p className="tiny muted" style={{ marginTop: 6, fontSize: 9, color: '#6b6b6b' }}>
            Chat lié à cette transaction uniquement — pas un DM social.
          </p>
        </>
      )}

      {/* Actions */}
      <div className="btnrow" style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        {stage >= 5 && stage < 6 && (
          <button className="btn ok" onClick={props.onMarkReceived}>Confirmer la réception</button>
        )}
        <button className="btn ghost" onClick={props.onClose}>Fermer</button>
      </div>
    </section>
  );
}
