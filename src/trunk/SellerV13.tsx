import { useCallback, useEffect, useState } from 'react';
import { getAuthToken } from '../auth';
import { getSellerCatalogue, getSellerAvailabilityQueue } from './api';
import type { SellerAvailabilityRequest, SellerCatalogueProduct } from './types';

type SellerV13Props = { onClose: () => void; onProducts?: () => void; onOffers?: () => void; onCompany?: () => void };

export function SellerV13({ onClose, onProducts, onOffers, onCompany }: SellerV13Props) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [catalogue, setCatalogue] = useState<{ facilities: Array<{ id: string; name: string }>; products: SellerCatalogueProduct[] } | null>(null);
  const [queue, setQueue] = useState<SellerAvailabilityRequest[]>([]);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    setError('');
    setBusy(true);
    try {
      const token = await getAuthToken();
      if (!token) { setError('Connectez-vous pour gérer votre commerce.'); return; }
      const [catalogueResult, queueResult] = await Promise.all([
        getSellerCatalogue({ token }),
        getSellerAvailabilityQueue({ token }).catch(() => null),
      ]);
      if (!catalogueResult.ok || !catalogueResult.data) { setError(catalogueResult.error?.message ?? 'Espace vendeur non ouvert.'); return; }
      setCatalogue({ facilities: catalogueResult.data.facilities, products: catalogueResult.data.products });
      if (queueResult?.ok && queueResult.data) setQueue(queueResult.data.requests);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Espace vendeur indisponible.');
    } finally { setBusy(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <section className="sheet h-mid" data-sheet="seller" role="region" aria-label="Espace vendeur">
      <div className="handle" />
      <div className="sheet-head">
        <div><div className="eyebrow">Espace Seller</div><h1>Ce qui demande votre attention.</h1></div>
        <span className="status ink">Seller</span>
      </div>
      {error && <p className="sub" role="alert">{error}</p>}
      {toast && <p className="sub" role="status">{toast}</p>}
      {busy && <p className="sub">…</p>}
      {catalogue && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginTop: 9 }}>
          <div style={{ padding: 11, borderRadius: 15, background: 'var(--panel)', border: '1px solid var(--line)' }}>
            <small style={{ display: 'block', color: 'var(--ink-soft)', fontSize: 7 }}>Demandes en attente</small>
            <strong style={{ display: 'block', marginTop: 3, fontSize: 17 }}>{queue.length}</strong>
          </div>
          <div style={{ padding: 11, borderRadius: 15, background: 'var(--accent-soft)', border: '1px solid var(--line)' }}>
            <small style={{ display: 'block', color: 'var(--ink-soft)', fontSize: 7 }}>Commandes à préparer</small>
            <strong style={{ display: 'block', marginTop: 3, fontSize: 17 }}>{catalogue.products.filter((p) => p.publicationState === 'published').length}</strong>
          </div>
        </div>
      )}
      {catalogue && catalogue.facilities.length > 0 && (
        <div className="cardbox" style={{ marginTop: 9 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div><b>{catalogue.facilities[0].name}</b><br /><span className="tiny muted">{catalogue.facilities.length} facilité{catalogue.facilities.length > 1 ? 's' : ''}</span></div>
            <button className="btn ghost sm" style={{ width: 'auto', minHeight: 30 }} type="button" onClick={onCompany}>Ouvrir</button>
          </div>
        </div>
      )}
      <div className="row" style={{ justifyContent: 'space-between', marginTop: 9 }}>
        <span className="tiny muted">Je suis actif en ce moment</span>
        <div style={{ display: 'flex', gap: 0, borderRadius: 999, border: '1px solid var(--line)', overflow: 'hidden', width: 110 }}>
          <button type="button" className="btn sm" style={{ flex: 1, borderRadius: 999, minHeight: 30, fontSize: 9.5 }}>ON</button>
          <button type="button" className="btn ghost sm" style={{ flex: 1, borderRadius: 999, minHeight: 30, fontSize: 9.5 }}>OFF</button>
        </div>
      </div>
      <div className="btnrow">
        <button className="btn ghost" type="button" onClick={onProducts}>Produits</button>
        <button className="btn ghost" type="button" onClick={onOffers}>Offres</button>
      </div>
    </section>
  );
}