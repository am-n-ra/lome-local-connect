import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, ScanLine } from 'lucide-react';
import { getAuthToken } from '../auth';
import { getSellerCatalogue, getSellerAvailabilityQueue } from './api';
import { buildSellerWorkspace, sellerRouteLabels } from './seller-workspace';
import type { PublicFacility, SellerAvailabilityRequest, SellerCatalogueResult } from './types';

type SellerV13Props = {
  onClose: () => void;
  onProducts?: () => void;
  onOffers?: () => void;
  onCompany?: () => void;
  onReply?: () => void;
  onRefresh?: () => void;
  onScan?: () => void;
  catalogue?: SellerCatalogueResult | null;
  queue?: SellerAvailabilityRequest[];
  publicFacilities?: PublicFacility[];
  ownedIds?: string[];
};

export function SellerV13({ onClose, onProducts, onOffers, onCompany, onReply, onRefresh, onScan, catalogue: propsCatalogue, queue: propsQueue = [], publicFacilities = [], ownedIds = [] }: SellerV13Props) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [catalogue, setCatalogue] = useState<SellerCatalogueResult | null>(null);
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
      setCatalogue(catalogueResult.data);
      if (queueResult?.ok && queueResult.data) setQueue(queueResult.data.requests);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Espace vendeur indisponible.');
    } finally { setBusy(false); }
  }, []);

  useEffect(() => { if (!propsCatalogue && !catalogue) void load(); }, [load, propsCatalogue, catalogue]);

  const lang = sellerRouteLabels();
  const ws = buildSellerWorkspace({
    facilities: propsCatalogue?.facilities ?? catalogue?.facilities ?? [],
    products: propsCatalogue?.products ?? catalogue?.products ?? [],
    ownedIds,
    publicFacilities,
    selFacilityId: null,
  });
  const stockSignal = ws.stockCount > 0 ? `${ws.stockCount} produit${ws.stockCount > 1 ? 's' : ''} · ${ws.stockTotal} unité${ws.stockTotal > 1 ? 's' : ''} Omni` : 'Aucun produit publié';
  const onMapCount = ws.ownedPublic.length;
  const hasData = (propsCatalogue ?? catalogue) !== null;

  const renderStrip = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginTop: 9 }}>
      <button type="button" onClick={onReply} style={{ textAlign: 'left', padding: 11, borderRadius: 15, background: 'var(--panel)', border: '1px solid var(--line)' }}>
        <small className="fs-7" style={{ display: 'block', color: 'var(--ink-soft)' }}>{lang.requests}</small>
        <strong className="fs-17" style={{ display: 'block', marginTop: 3 }}>{ws.pendingCount || queue.length}</strong>
      </button>
      <div style={{ padding: 11, borderRadius: 15, background: 'var(--accent-soft)', border: '1px solid var(--line)' }}>
        <small className="fs-7" style={{ display: 'block', color: 'var(--ink-soft)' }}>{lang.facility}</small>
        <strong className="fs-17" style={{ display: 'block', marginTop: 3 }}>{onMapCount ? `${onMapCount} sur la carte` : ws.selFacilityCatalogue?.name ?? '—'}</strong>
      </div>
    </div>
  );

  return (
    <section className="sheet h-mid" data-sheet="seller" role="region" aria-label="Espace vendeur">
      <div className="handle" />
      <div className="sheet-head">
        <div><div className="eyebrow">Espace Seller</div><h1>Ce qui demande votre attention.</h1></div>
        <button type="button" className="btn ghost sm" style={{ width: 'auto', minHeight: 28 }} onClick={() => { if (onRefresh) onRefresh(); else void load(); }}><RefreshCw size={14} /> Actualiser</button>
      </div>
      {error && <p className="sub" role="alert">{error}</p>}
      {toast && <p className="sub" role="status">{toast}</p>}
      {busy && !hasData && <p className="sub">…</p>}
      {hasData && renderStrip()}
      {hasData && ws.selFacilityCatalogue?.name && (
        <div className="cardbox" style={{ marginTop: 9 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div><b>{ws.selFacilityCatalogue?.name}</b><br /><span className="tiny muted">{stockSignal}</span></div>
            <button className="btn ghost sm" style={{ width: 'auto', minHeight: 30 }} type="button" onClick={onCompany}>Ouvrir</button>
          </div>
        </div>
      )}
      <div className="row" style={{ justifyContent: 'space-between', marginTop: 9 }}>
        <span className="tiny muted">Je suis actif en ce moment</span>
        <div style={{ display: 'flex', gap: 0, borderRadius: 999, border: '1px solid var(--line)', overflow: 'hidden', width: 110 }}>
          <button type="button" className="btn sm" style={{ flex: 1, borderRadius: 999, minHeight: 30 }}>ON</button>
          <button type="button" className="btn ghost sm" style={{ flex: 1, borderRadius: 999, minHeight: 30 }}>OFF</button>
        </div>
      </div>
      <div className="btnrow" style={{ marginTop: 5 }}>
        <button className="btn" type="button" onClick={onProducts}>{lang.catalogue}</button>
        <button className="btn ghost" type="button" onClick={onOffers}>Offres</button>
      </div>
      {((propsCatalogue ?? catalogue)?.products?.length ?? 0) > 0 && (
        <p className="tiny" style={{ marginTop: 3, color: (propsCatalogue ?? catalogue)?.catalogReady ? 'var(--accent)' : 'var(--warn)' }}>
          {(propsCatalogue ?? catalogue)?.catalogReady ? 'Catalogue prêt — produits visibles' : 'Catalogue incomplet pour la vente'}
        </p>
      )}
      <div className="btnrow" style={{ marginTop: 7 }}>
        <button className="btn ghost" type="button" onClick={onScan}><ScanLine size={14} /> {lang.scanner}</button>
      </div>
      <p className="tiny muted" style={{ marginTop: 6 }}>{lang.wallet} — depuis votre menu.</p>
    </section>
  );
}
