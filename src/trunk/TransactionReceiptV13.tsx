import { useState } from 'react';
import { X } from 'lucide-react';
import { formatMoney } from '../domain/currency';
import type { ClosedTransactionSummary } from './types';

/** S-26 / B18 + maquette `recu` : une transaction clôturée est une version gelée —
 * le reçu la lit, jamais il ne la recalcule. La ref est une troncature d'affichage
 * stable du uuid (déterministe, pas un identifiant secondaire).
 */
export function receiptRefFor(transactionId: string): string {
  return `OMNI-${transactionId.slice(0, 4).toUpperCase()}`;
}

export function receiptWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const today = new Date();
  const sameDay = date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate();
  return sameDay
    ? `Aujourd’hui · ${time}`
    : `${date.toLocaleDateString('fr-FR')} · ${time}`;
}

export function TransactionReceiptV13({ summary, onClose }: {
  summary: ClosedTransactionSummary;
  onClose: () => void;
}) {
  const [shared, setShared] = useState<'idle' | 'done' | 'error'>('idle');
  const ref = receiptRefFor(summary.transactionId);
  const amount = formatMoney(summary.netAmountMinor, 'XOF');
  const when = receiptWhen(summary.lastEventAt);
  const shareText = `${ref} — ${summary.productName ?? 'Transaction'} × ${summary.quantity} — ${amount} — ${summary.sellerName ?? summary.facilityName ?? ''} — ${when}`;

  const share = async () => {
    try {
      const nav = navigator as Navigator & { share?: (data: { title?: string; text?: string }) => Promise<void> };
      if (typeof nav.share === 'function') {
        await nav.share({ title: `Reçu ${ref}`, text: shareText });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
      } else {
        throw new Error('no-share-channel');
      }
      setShared('done');
    } catch {
      setShared('error');
    }
  };

  return (
    <section className="sheet h-mid" data-sheet="receipt" role="region" aria-label="Reçu de transaction">
      <div className="handle" />
      <div className="sheet-head">
        <div><div className="eyebrow">Transaction terminée</div><h1>Remise effectuée — merci</h1></div>
        <button type="button" className="sheet-close" onClick={onClose} aria-label="Fermer"><X size={15} /></button>
      </div>
      <div className="cardbox">
        <div className="kv"><span>Reçu</span><b>{ref}</b></div>
        <div className="kv"><span>Objet</span><b>{summary.productName ?? 'Transaction'} × {summary.quantity}</b></div>
        <div className="kv"><span>Total</span><b>{amount}</b></div>
        <div className="kv"><span>Vendeur</span><b>{summary.sellerName ?? summary.facilityName ?? '—'}</b></div>
        <div className="kv"><span>Quand</span><b>{when}</b></div>
      </div>
      <div className="btnrow" style={{ marginTop: 8 }}>
        <button className="btn ghost sm" type="button" onClick={() => void share()}>Partager</button>
      </div>
      {shared === 'done' && <p className="sub" role="status">Reçu partagé.</p>}
      {shared === 'error' && <p className="sub" role="alert">Partage indisponible sur cet appareil.</p>}
    </section>
  );
}
