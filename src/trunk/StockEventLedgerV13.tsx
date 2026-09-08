import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { getAuthToken } from '../auth';
import { getProductStockEvents } from './api';
import type { ProductStockEvent } from './types';

type StockEventLedgerV13Props = { productId: string; onClose: () => void };

const STATE_LABEL: Record<string, string> = {
  en_stock: 'En stock', verifie: 'Vérifié', a_valider: 'À valider', bientot: 'Bientôt',
  draft: 'Brouillon', published: 'Publié', sold_out: 'Épuisé', archived: 'Archivé',
};

export function StockEventLedgerV13({ productId, onClose }: StockEventLedgerV13Props) {
  const [events, setEvents] = useState<ProductStockEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) return;
      const result = await getProductStockEvents({ token, productId });
      if (result.ok && result.data?.events) setEvents(result.data.events);
    } finally { setLoading(false); }
  }, [productId]);

  useEffect(() => { void load(); }, [load]);

  return (
    <section className="sheet h-mid" data-sheet="stockevent" role="region" aria-label="Historique stock">
      <div className="handle" />
      <div className="sheet-head">
        <div><div className="eyebrow">Historique stock</div><h1>Ledger des changements</h1></div>
        <span className="status gray">Read-only</span>
      </div>
      <button type="button" className="btn ghost sm" style={{ width: 'auto', minHeight: 28, marginBottom: 8 }} onClick={onClose}><ArrowLeft size={15} /> Retour</button>
      {loading && <p className="sub">Chargement…</p>}
      {!loading && events.length === 0 && <p className="sub">Aucun événement de stock pour ce produit.</p>}
      <div className="cardbox">
        {events.map((event) => (
          <div className="kv" key={event.id}>
            <span>{new Date(event.createdAt).toLocaleString('fr-FR')} · {STATE_LABEL[event.toState] ?? event.toState}</span>
            <b>{event.source}</b>
          </div>
        ))}
      </div>
      <p className="tiny muted" style={{ marginTop: 7 }}>Ledger serveur. Chaque événement est soit dérivé d'une transaction, soit une correction manuelle du vendeur.</p>
    </section>
  );
}
