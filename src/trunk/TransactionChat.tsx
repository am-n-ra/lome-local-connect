import { useEffect, useState } from 'react';
import type { TransactionMessage } from './types';

type TransactionChatProps = {
  token: string | null;
  transactionId: string;
  actorRole: 'buyer' | 'seller';
  messages: TransactionMessage[];
  state: 'idle' | 'loading' | 'error';
  error: string;
  onRefresh: () => void;
  onSend: (body: string) => void;
  sending: boolean;
};

export function TransactionChat(props: TransactionChatProps) {
  const [body, setBody] = useState('');
  useEffect(() => { if (props.transactionId && props.token) props.onRefresh(); }, [props.transactionId, props.token]);
  if (!props.transactionId || !props.token) return null;
  return <section className="transaction-chat" aria-labelledby="transaction-chat-title">
    <div className="seller-list-heading"><span className="section-kicker">Chat transactionnel</span><button className="text-button" type="button" onClick={props.onRefresh} disabled={props.state === 'loading'}>Actualiser</button></div>
    <p className="privacy-note">Échange privé entre le Buyer et le Seller de cette transaction. Le QR de facilité et le QR transactionnel restent distincts.</p>
    <h3 id="transaction-chat-title" className="sr-only">Chat transactionnel</h3>
    <div className="transaction-chat-messages" aria-live="polite" aria-busy={props.state === 'loading'}>
      {props.state === 'loading' && <span className="privacy-note">Chargement des messages…</span>}
      {props.state === 'error' && <div className="inline-error" role="alert">{props.error}<button className="text-button" type="button" onClick={props.onRefresh}>Réessayer</button></div>}
      {props.state !== 'loading' && props.messages.length === 0 && <span className="privacy-note">Aucun message. Envoyez une précision utile au vendeur.</span>}
      {props.messages.map((message) => <div key={message.id} className={`transaction-chat-message ${message.senderRole === props.actorRole ? 'mine' : 'theirs'}`}><span>{message.body}</span><small>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small></div>)}
    </div>
    <form className="transaction-chat-form" onSubmit={(event) => { event.preventDefault(); const next = body.trim(); if (!next || props.sending) return; props.onSend(next); setBody(''); }}>
      <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={2000} rows={2} placeholder="Écrire au sujet de cette transaction…" aria-label="Message transactionnel" />
      <button className="primary-button omni-pressable" type="submit" disabled={props.sending || !body.trim()}>{props.sending ? 'Envoi…' : 'Envoyer'}</button>
    </form>
  </section>;
}
