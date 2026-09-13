import { useCallback, useEffect, useState } from 'react';
import { LocateFixed, RefreshCw, ScanLine } from 'lucide-react';
import { getAuthToken } from '../auth';
import { createSellerFacility, getSellerCatalogue, getSellerAvailabilityQueue, setSellerFacilityOperationalState } from './api';
import { buildSellerWorkspace, sellerRouteLabels } from './seller-workspace';
import type { FacilityOperationalState, FacilityType, PublicFacility, SellerAvailabilityRequest, SellerCatalogueResult } from './types';

type SellerV13Props = {
  onClose: () => void;
  onProducts?: () => void;
  onOffers?: () => void;
  onCompany?: () => void;
  onReply?: () => void;
  onRefresh?: () => void;
  onScan?: () => void;
  onMap?: () => void;
  catalogue?: SellerCatalogueResult | null;
  queue?: SellerAvailabilityRequest[];
  publicFacilities?: PublicFacility[];
  ownedIds?: string[];
};

export function SellerV13({ onClose, onProducts, onOffers, onCompany, onReply, onRefresh, onScan, onMap, catalogue: propsCatalogue, queue: propsQueue = [], publicFacilities = [], ownedIds = [] }: SellerV13Props) {
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [catalogue, setCatalogue] = useState<SellerCatalogueResult | null>(null);
  const [queue, setQueue] = useState<SellerAvailabilityRequest[]>([]);
  const [toast, setToast] = useState('');
  const [toogleBusy, setToogleBusy] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState('');
  const [facilityType, setFacilityType] = useState<FacilityType>('fixe');
  const [facilityName, setFacilityName] = useState('');
  const [facilityCategory, setFacilityCategory] = useState('');
  const [facilityAddress, setFacilityAddress] = useState('');
  const [facilityLat, setFacilityLat] = useState('');
  const [facilityLng, setFacilityLng] = useState('');
  const [facilityRayon, setFacilityRayon] = useState('5');

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

  const locateMe = useCallback(() => {
    if (!('geolocation' in navigator)) { setCreateError('Géolocalisation indisponible — saisissez les coordonnées manuellement.'); return; }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFacilityLat(position.coords.latitude.toFixed(6));
        setFacilityLng(position.coords.longitude.toFixed(6));
        setCreateError('');
      },
      () => setCreateError('Géolocalisation refusée — saisissez les coordonnées manuellement.'),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }, []);

  const submitCreate = useCallback(async () => {
    setCreateError('');
    if (!facilityName.trim()) { setCreateError('Le nom de la facilité est requis.'); return; }
    if (facilityType !== 'digital' && (!facilityLat.trim() || !facilityLng.trim())) { setCreateError('Saisissez vos coordonnées (ou « Me localiser »).'); return; }
    const latitude = facilityLat.trim() ? Number(facilityLat) : null;
    const longitude = facilityLng.trim() ? Number(facilityLng) : null;
    if (latitude !== null && (Number.isNaN(latitude) || latitude < -90 || latitude > 90)) { setCreateError('Latitude invalide (entre -90 et 90).'); return; }
    if (longitude !== null && (Number.isNaN(longitude) || longitude < -180 || longitude > 180)) { setCreateError('Longitude invalide (entre -180 et 180).'); return; }
    const rayonKm = facilityType === 'mobile' ? Number(facilityRayon) : null;
    if (rayonKm !== null && (Number.isNaN(rayonKm) || rayonKm <= 0 || rayonKm > 500)) { setCreateError('Rayon invalide (entre 1 et 500 km).'); return; }
    const token = await getAuthToken();
    if (!token) { setCreateError('Connectez-vous pour créer une facilité.'); return; }
    setCreateBusy(true);
    try {
      const idempotencyKey = crypto.randomUUID();
      const result = await createSellerFacility({ token, name: facilityName.trim(), facilityType, category: facilityCategory.trim() || null, description: null, address: facilityAddress.trim() || null, latitude, longitude, rayonKm, idempotencyKey });
      if (result.ok && result.data) {
        setToast('Facilité créée — complétez le parcours de preuve pour être trouvé.');
        setShowCreateForm(false);
        setFacilityName('');
        setFacilityCategory('');
        setFacilityAddress('');
        setFacilityLat('');
        setFacilityLng('');
        setFacilityRayon('5');
        if (onRefresh) onRefresh(); else void load();
      } else {
        setCreateError(result.error?.message ?? 'Création non enregistrée.');
      }
    } catch { setCreateError('Création non enregistrée.'); }
    finally { setCreateBusy(false); }
  }, [facilityName, facilityType, facilityCategory, facilityAddress, facilityLat, facilityLng, facilityRayon, onRefresh, load]);

  const lang = sellerRouteLabels();
  const ws = buildSellerWorkspace({
    facilities: propsCatalogue?.facilities ?? catalogue?.facilities ?? [],
    products: propsCatalogue?.products ?? catalogue?.products ?? [],
    ownedIds,
    publicFacilities,
    selFacilityId: null,
  });

  const activeFacility = (propsCatalogue ?? catalogue)?.facilities?.find((f) => f.id === ws.selFacilityId) ?? null;
  const opState: FacilityOperationalState = activeFacility?.operationalState ?? 'ouvert';

  const toggleOpState = useCallback(async (next: FacilityOperationalState) => {
    const token = await getAuthToken();
    if (!token || !ws.selFacilityId) return;
    setToogleBusy(true); setError('');
    try {
      const result = await setSellerFacilityOperationalState({ token, facilityId: ws.selFacilityId, state: next });
      if (result.ok && result.data) {
        setToast(next === 'ouvert' ? 'Votre commerce est ouvert.' : 'Votre commerce est fermé — indisponible dans la recherche.');
        if (onRefresh) onRefresh(); else void load();
      } else {
        setError(result.error?.message ?? 'Changement d’état non enregistré.');
      }
    } catch { setError('Changement d’état non enregistré.'); }
    finally { setToogleBusy(false); }
  }, [ws.selFacilityId, onRefresh, load]);

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
      {!hasData && !busy && (
        <div className="cardbox" style={{ marginTop: 9 }}>
          <div className="eyebrow">Bienvenue — espace vendeur</div>
          <p className="sub">Tout compte Omni peut vendre: une facilité d'abord, puis un catalogue et des offres.</p>
          <p className="tiny muted">Commencez par revendiquer une facilité déjà sur la carte, ou créez la vôtre en 2 minutes.</p>
          <div className="btnrow" style={{ marginTop: 7 }}>
            <button className="btn" type="button" onClick={onMap}>Ouvrir la carte pour revendiquer</button>
            <button className="btn ghost" type="button" onClick={() => { setCreateError(''); setShowCreateForm((v) => !v); }}>Créer une facilité</button>
          </div>
          {showCreateForm && (
            <div className="cardbox" style={{ marginTop: 9, padding: 11 }}>
              {createError && <p className="sub" role="alert">{createError}</p>}
              <label className="tiny muted" style={{ display: 'block' }}>Type d'établissement</label>
              <div className="btnrow" style={{ gap: 6, marginTop: 4 }}>
                {(['fixe', 'mobile', 'digital'] as FacilityType[]).map((t) => (
                  <button key={t} type="button" className={facilityType === t ? 'btn sm' : 'btn ghost sm'} style={{ width: 'auto', flex: 1, minHeight: 30 }} onClick={() => setFacilityType(t)}>{t === 'fixe' ? 'Fixe' : t === 'mobile' ? 'Mobile / ambulant' : 'Digital / en ligne'}</button>
                ))}
              </div>
              <label className="tiny muted" style={{ display: 'block', marginTop: 9 }}>Nom</label>
              <input className="input" type="text" value={facilityName} onChange={(e) => setFacilityName(e.target.value)} maxLength={180} placeholder="Ex: Le Fournil d'Or" style={{ width: '100%' }} />
              <label className="tiny muted" style={{ display: 'block', marginTop: 9 }}>Catégorie (optionnel)</label>
              <input className="input" type="text" value={facilityCategory} onChange={(e) => setFacilityCategory(e.target.value)} maxLength={120} placeholder="Ex: Boulangerie & Pâtisserie" style={{ width: '100%' }} />
              <label className="tiny muted" style={{ display: 'block', marginTop: 9 }}>Adresse (optionnel)</label>
              <input className="input" type="text" value={facilityAddress} onChange={(e) => setFacilityAddress(e.target.value)} maxLength={200} placeholder="Quartier, rue…" style={{ width: '100%' }} />
              {facilityType !== 'digital' ? (
                <>
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 9 }}>
                    <label className="tiny muted">Position</label>
                    <button className="btn ghost sm" style={{ width: 'auto', minHeight: 28 }} type="button" onClick={locateMe}><LocateFixed size={13} /> Me localiser</button>
                  </div>
                  <div className="row" style={{ gap: 6, marginTop: 4 }}>
                    <input className="input" type="number" inputMode="decimal" value={facilityLat} onChange={(e) => setFacilityLat(e.target.value)} placeholder="Latitude" style={{ flex: 1, minWidth: 0 }} />
                    <input className="input" type="number" inputMode="decimal" value={facilityLng} onChange={(e) => setFacilityLng(e.target.value)} placeholder="Longitude" style={{ flex: 1, minWidth: 0 }} />
                  </div>
                </>
              ) : (
                <p className="tiny muted" style={{ marginTop: 9 }}>Un établissement digital n'a pas de point physique — il sera découvert par nom/catégorie.</p>
              )}
              {facilityType === 'mobile' && (
                <>
                  <label className="tiny muted" style={{ display: 'block', marginTop: 9 }}>Rayon de découverte (km)</label>
                  <input className="input" type="number" inputMode="decimal" min={1} max={500} value={facilityRayon} onChange={(e) => setFacilityRayon(e.target.value)} style={{ width: '100%' }} />
                </>
              )}
              <div className="btnrow" style={{ marginTop: 11 }}>
                <button className="btn" type="button" disabled={createBusy} onClick={() => void submitCreate()}>{createBusy ? 'Création…' : 'Créer ma facilité'}</button>
                <button className="btn ghost" type="button" disabled={createBusy} onClick={() => setShowCreateForm(false)}>Annuler</button>
              </div>
            </div>
          )}
        </div>
      )}
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
          <button type="button" className={opState === 'ouvert' ? 'btn sm' : 'btn ghost sm'} style={{ flex: 1, borderRadius: 999, minHeight: 30 }} disabled={toogleBusy || !ws.selFacilityId} onClick={() => void toggleOpState('ouvert')}>ON</button>
          <button type="button" className={opState !== 'ouvert' ? 'btn sm' : 'btn ghost sm'} style={{ flex: 1, borderRadius: 999, minHeight: 30 }} disabled={toogleBusy || !ws.selFacilityId} onClick={() => void toggleOpState('ferme')}>OFF</button>
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
