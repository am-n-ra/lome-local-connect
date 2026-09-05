import { useCallback, useEffect, useState } from 'react';
import { Archive, BadgeCheck, CheckCircle2, PackageOpen, RefreshCw, Send, X } from 'lucide-react';
import { getAuthToken } from '../auth';
import { activateFacilityPro, createSellerFacility, createSellerProductDraft, getProductStockEvents, getSellerCatalogue, getSellerAvailabilityQueue, requestSellerAvailabilityResponse, transitionSellerProduct } from './api';
import type { SellerAvailabilityRequest, SellerCatalogueProduct } from './types';

type SellerV13Props = { onClose: () => void };

type Tab = 'produits' | 'dispo' | 'stock' | 'nouveau';

const STATE_LABEL: Record<string, string> = {
  en_stock: 'En stock',
  verifie: 'Vérifié',
  a_valider: 'À valider',
  bientot: 'Bientôt',
  draft: 'Brouillon',
  pending_validation: 'À valider',
  published: 'Publié',
  sold_out: 'Épuisé',
  archived: 'Archivé',
};

export function SellerV13({ onClose }: SellerV13Props) {
  const [tab, setTab] = useState<Tab>('produits');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [catalogue, setCatalogue] = useState<{ facilities: Array<{ id: string; name: string }>; products: SellerCatalogueProduct[] } | null>(null);
  const [queue, setQueue] = useState<SellerAvailabilityRequest[]>([]);
  const [events, setEvents] = useState<Record<string, Array<{ id: string; toState: string; source: string; createdAt: string }>>>({});
  const [toast, setToast] = useState('');
  // nouveau product form
  const [draftFacility, setDraftFacility] = useState('');
  const [draftName, setDraftName] = useState('');
  const [draftPrix, setDraftPrix] = useState('');
  const [draftStock, setDraftStock] = useState('');

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

  const publish = useCallback(async (product: SellerCatalogueProduct) => {
    setBusy(true);
    try {
      const token = await getAuthToken();
      if (!token) return;
      const to = product.publicationState === 'published' ? 'archived' : 'published';
      const result = await transitionSellerProduct({ token, productId: product.id, to });
      if (result.ok) { setToast(`${product.name}: ${to === 'published' ? 'publié' : 'archivé'}.`); void load(); }
      else setError(result.error?.message ?? 'Transition refusée.');
    } finally { setBusy(false); }
  }, [load]);

  const respond = useCallback(async (request: SellerAvailabilityRequest, status: 'available' | 'partial' | 'unavailable') => {
    setBusy(true);
    try {
      const token = await getAuthToken();
      if (!token) return;
      const result = await requestSellerAvailabilityResponse({
        requestId: request.id,
        facilityId: request.facilityId,
        productId: request.productId,
        status,
        quantityAvailable: status === 'unavailable' ? null : request.requestedQuantity,
        priceMinor: Math.round(request.budgetMinor ?? request.requestedQuantity *  ​100),
        sellerMessage: 'Réponse depuis la console 1:1',
        token,
        idempotencyKey: 'resp-' + crypto.randomUUID(),
      });
      setToast(result.ok ? `${request.productName}: dispo répondue.` : (result.error?.message ?? 'Réponse non envoyée.'));
      if (result.ok) void load();
    } finally { setBusy(false); }
  }, [load]);

  const openStock = useCallback(async (productId: string) => {
    try {
      const token = await getAuthToken();
      if (!token) return;
      const result = await getProductStockEvents({ token, productId });
      if (result.ok && result.data?.events) {
        const fetchedEvents = result.data.events;
        setEvents((previous) => ({ ...previous, [productId]: fetchedEvents }));
      }
    } catch { /* silencieux */ }
  }, []);

  const createFacility = useCallback(async () => {
    setError('');
    if (!draftFacility.trim() || !catalogue) { setError('Nom du commerce requis.'); return; }
    setBusy(true);
    try {
      const token = await getAuthToken();
      if (!token) return;
      const result = await createSellerFacility({ token, name: draftFacility.trim(), latitude: 6.1319, longitude:  ​1.2228, idempotencyKey: 'fac-' + crypto.randomUUID() });
      if (result.ok) { setToast('Commerce créé — slot de revue ouvert.'); setDraftFacility(''); void load(); }
      else setError(result.error?.message ?? 'Commerce non créé.');
    } finally { setBusy(false); }
  }, [draftFacility, catalogue, load]);

  const createProduct = useCallback(async () => {
    setError('');
    if (!draftName.trim() || !draftFacility || !draftPrix || !draftStock) { setError('Remplissez nom, commerce, prix, stock.'); return; }
    setBusy(true);
    try {
      const token = await getAuthToken();
      if (!token) return;
      const prixOriginal = Math.round(Number(draftPrix) * 100);
      const result = await createSellerProductDraft({ token, facilityId: draftFacility, name: draftName.trim(), prixOriginal, currency: 'XOF', pourcentageReduction: 0, stockLoueOmni: Number(draftStock), idempotencyKey: 'prod-' + crypto.randomUUID() });
      if (result.ok) { setToast(`Brouillon « ${draftName.trim()} » créé.`); setDraftName(''); setDraftPrix(''); setDraftStock(''); void load(); }
      else setError(result.error?.message ?? 'Produit non créé.');
    } finally { setBusy(false); }
  }, [draftName, draftFacility, draftPrix, draftStock, load]);

  return (
    <section className="sheet h-full" role="region" aria-label="Espace vendeur">
      <div className="handle" />
      <div className="sheet-head">
        <div><div className="eyebrow">Espace vendeur</div><h1>Mon commerce</h1></div>
        <button type="button" className="btn ghost sm" style={{ width: 'auto', minHeight: 28 }} onClick={onClose}><X size={15} /> Fermer</button>
      </div>
      <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginBottom:  ​8 }}>
        {(['produits', 'dispo', 'stock', 'nouveau'] as Tab[]).map((t) => (
          <button key={t} type="button" className={tab === t ? 'btn sm' : 'btn ghost sm'} style={{ width: 'auto', minHeight: 30 }} onClick={() => setTab(t)}>{t === 'produits' ? 'Produits' : t === 'dispo' ? 'Dispo reçue' : t === 'stock' ? 'Stock' : 'Nouveau'}</button>
        ))}
      </div>
      {error && <p className="sub" role="alert">{error}</p>}
      {toast && <p className="sub" role="status">{toast}</p>}
      {busy && <p className="sub">…</p>}
      {tab === 'produits' && (
        <div className="hgrid" id="hgrid">
          {catalogue?.products.length === 0 && <p className="sub">Aucun produit — créez votre premier brouillon dans « Nouveau ».</p>}
          {catalogue?.products.map((product) => (
            <div className="cardbox" key={product.id}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div><b>{product.name}</b><br /><span className="tiny muted">{product.facilityName} · {product.unit}</span></div>
                <span className="status gray">{STATE_LABEL[product.availabilityState] ?? product.availabilityState}</span>
              </div>
              <p className="tiny muted">{(product.prixReduit /  ​100).toFixed(2)} {product.currency} · stock {product.stockLoueOmni}</p>
              <div className="btnrow">
                <button className="btn ghost sm" style={{ width: 'auto', minHeight:  ​28 }} type="button" disabled={busy} onClick={() => void publish(product)}>{product.publicationState === 'published' ? <><Archive size={13} /> Archiver</> : <><PackageOpen size={13} /> Publier</>}</button>
                <button className="btn ghost sm" style={{ width: 'auto', minHeight:  ​28 }} type="button" onClick={() => void openStock(product.id)}>Journal</button>
              </div>
              {events[product.id] && events[product.id].length > 0 && (
                <div className="kv" key={product.id + '-ev'}>
                  {events[product.id].slice(-2).map((event) => (
                    <span key={event.id}><b>{STATE_LABEL[event.toState] ?? event.toState}</b> · {event.source} · {new Date(event.createdAt).toLocaleString('fr-FR')}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {tab === 'dispo' && (
        <div>
          {queue.length === 0 && <p className="sub">Aucune demande de dispo en attente.</p>}
          {queue.map((request) => (
            <div className="cardbox" key={request.id}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div><b>{request.productName}</b><br /><span className="tiny muted">{request.facilityName} · {request.requestedQuantity} {request.budgetMode === 'maximum' ? '· max ' + ((request.budgetMinor ?? 0) / 100) + ' FCFA' : ''}</span></div>
                <span className="status ink">{request.requestStatus}</span>
              </div>
              <div className="btnrow">
                <button className="btn sm" style={{ width: 'auto', minHeight: 30 }} type="button" disabled={busy} onClick={() => void respond(request, 'available')}><CheckCircle2 size={14} /> Dispo</button>
                <button className="btn ghost sm" style={{ width: 'auto', minHeight: 30 }} type="button" disabled={busy} onClick={() => void respond(request, 'partial')}>Partiel</button>
                <button className="btn ghost sm" style={{ width: 'auto', minHeight: 30 }} type="button" disabled={busy} onClick={() => void respond(request, 'unavailable')}>Indispo</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {tab === 'stock' && (
        <div className="cardbox">
          <p className="sub">Journal de stock — chaque changement d’état est tracé (auto ou manuel).</p>
          {catalogue?.products.slice(0,  ​6).map((product) => (
            <div className="kv" key={product.id}>
              <span><b>{product.name}</b></span>
              <b>{events[product.id]?.length ?? 0} événement(s</b>
            </div>
          ))}
        </div>
      )}
      {tab === 'nouveau' && (
        <div>
          <div className="cardbox">
            <div className="eyebrow">Créer un commerce</div>
            <input className="field" placeholder="Nom du commerce" value={draftFacility} onChange={(event) => setDraftFacility(event.target.value)} />
            <button className="btn" type="button" disabled={busy} style={{ marginTop: 8 }} onClick={() => void createFacility()}>Créer le commerce</button>
          </div>
          <div className="cardbox">
            <div className="eyebrow">Nouveau produit (brouillon)</div>
            <input className="field" placeholder="Nom du produit" value={draftName} onChange={(event) => setDraftName(event.target.value)} />
            <select className="field" value={draftFacility} onChange={(event) => setDraftFacility(event.target.value)}>
              {catalogue?.facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.name}</option>)}
            </select>
            <input className="field" type="number" min="0" placeholder="Prix (FCFA（" value={draftPrix} onChange={(event) => setDraftPrix(event.target.value)} />
            <input className="field" type="number" min="0" placeholder="Stock" value={draftStock} onChange={(event) => setDraftStock(event.target.value)} />
            <button className="btn" type="button" disabled={busy || !catalogue?.facilities.length} style={{ marginTop: 8 }} onClick={() => void createProduct()}><BadgeCheck size={15} /> Créer le brouillon</button>
          </div>
        </div>
      )}
      <p className="tiny muted" style={{ textAlign: 'center', marginTop: 8 }}>Chaque publication passe par la revue. Le compteur de ventes ne se modifie pas ici.</p>
    </section>
  );
}