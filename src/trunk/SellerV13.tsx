import { useCallback, useEffect, useState } from 'react';
import { LocateFixed, RefreshCw, ScanLine } from 'lucide-react';
import { getAuthToken } from '../auth';
import { createSellerProductDraft, createSellerFacility, createFacilityAdCampaign, getFacilityAnalytics, getFacilityBonusStatus, getFacilityRenewalStatus, getSellerCatalogue, getSellerAvailabilityQueue, listFacilityAdCampaigns, renewFacilityPro, setFacilityRenewalOptIn, setSellerFacilityOperationalState, unlockFacilityBonus, updateSellerFacilityContact } from './api';
import { buildSellerWorkspace, sellerRouteLabels } from './seller-workspace';
import type { AdCampaignListResult, FacilityBonusStatus, FacilityOperationalState, FacilityRenewalStatus, FacilityType, PublicFacility, SellerAdCampaign, SellerAvailabilityRequest, SellerCatalogueResult, SellerFacilityAnalytics, OfferPositionKind, OfferUniquenessKind, OfferHandoverKind, OfferPriceKind, OfferConditionKind } from './types';

function money(minor: number, currency: string): string {
  const whole = Number.isInteger(minor / 100);
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: whole ? 0 : 2 }).format(minor / 100);
}

function planUsdLabel(usdMinor: number): string {
  return Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(usdMinor / 100);
}

type SellerV13Props = {
  onClose: () => void;
  onProducts?: () => void;
  onOffers?: () => void;
  onCompany?: () => void;
  onReply?: () => void;
  onRefresh?: () => void;
  onScan?: () => void;
  onMap?: () => void;
  /** Entrée vendeur : ouvre le brouillon de revendication sur une facilité publique. */
  onClaim?: (facility: PublicFacility) => void;
  /** Entrée directe dans le formulaire de création (ex. depuis « la facilité n'est pas sur la carte »). */
  startInCreate?: boolean;
  /** Signale que l'intention de création a été consommée (le formulaire est ouvert). */
  onConsumeCreateIntent?: () => void;
  catalogue?: SellerCatalogueResult | null;
  queue?: SellerAvailabilityRequest[];
  publicFacilities?: PublicFacility[];
  ownedIds?: string[];
};

export function SellerV13({ onClose, onProducts, onOffers, onCompany, onReply, onRefresh, onScan, onMap, onClaim, startInCreate = false, onConsumeCreateIntent, catalogue: propsCatalogue, queue: propsQueue = [], publicFacilities = [], ownedIds = [] }: SellerV13Props) {
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(startInCreate);
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
  const [facilityPhone, setFacilityPhone] = useState('');
  const [facilityWhatsapp, setFacilityWhatsapp] = useState('');
  // S-01 — publier une offre : nom, prix, quantité + les 5 caractéristiques déclarables.
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerBusy, setOfferBusy] = useState(false);
  const [offerError, setOfferError] = useState('');
  const [offerName, setOfferName] = useState('');
  const [offerUnit, setOfferUnit] = useState('unit');
  const [offerPrice, setOfferPrice] = useState('');
  const [offerDiscount, setOfferDiscount] = useState('10');
  const [offerQty, setOfferQty] = useState('1');
  const [offerPosition, setOfferPosition] = useState<OfferPositionKind>('fixe');
  const [offerUniqueness, setOfferUniqueness] = useState<OfferUniquenessKind>('renouvelable');
  const [offerHandover, setOfferHandover] = useState<OfferHandoverKind>('retrait');
  const [offerPriceKind, setOfferPriceKind] = useState<OfferPriceKind>('fixe');
  const [offerCondition, setOfferCondition] = useState<OfferConditionKind>('neuf');

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

  // L'intention de création ne vaut que pour la montée qui l'a reçue : on la
  // consomme aussitôt, sinon le formulaire se rouvrirait à chaque retour sur
  // l'espace vendeur.
  useEffect(() => { if (startInCreate) onConsumeCreateIntent?.(); }, [startInCreate, onConsumeCreateIntent]);

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
      const result = await createSellerFacility({ token, name: facilityName.trim(), facilityType, category: facilityCategory.trim() || null, description: null, address: facilityAddress.trim() || null, latitude, longitude, rayonKm, contactPhone: facilityPhone.trim() || null, contactWhatsapp: facilityWhatsapp.trim() || null, idempotencyKey });
      if (result.ok && result.data) {
        setToast('Facilité créée — complétez le parcours de preuve pour être trouvé.');
        setShowCreateForm(false);
        setFacilityName('');
        setFacilityCategory('');
        setFacilityAddress('');
        setFacilityLat('');
        setFacilityLng('');
        setFacilityRayon('5');
        setFacilityPhone('');
        setFacilityWhatsapp('');
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

  // S-01 — « tout est offre » : publier, c'est déclarer les caractéristiques de l'offre.
  const submitOffer = useCallback(async () => {
    setOfferError('');
    const facilityId = ws.selFacilityId;
    if (!facilityId) { setOfferError('Sélectionnez une facilité.'); return; }
    const price = Math.round(Number(offerPrice) * 100);
    const discount = Math.round(Number(offerDiscount));
    const qty = Math.round(Number(offerQty));
    if (!offerName.trim()) { setOfferError("Le nom de l'offre est requis."); return; }
    if (!Number.isInteger(price) || price <= 0) { setOfferError('Prix invalide.'); return; }
    if (!Number.isInteger(discount) || discount < 1 || discount > 90) { setOfferError("L'avantage Omni doit être entre 1 et 90 %."); return; }
    if (!Number.isInteger(qty) || qty < 0) { setOfferError('Quantité invalide.'); return; }
    const token = await getAuthToken();
    if (!token) { setOfferError('Connectez-vous pour publier une offre.'); return; }
    setOfferBusy(true);
    try {
      const result = await createSellerProductDraft({
        token, facilityId, name: offerName.trim(), description: null, unit: offerUnit.trim() || 'unit',
        prixOriginal: price, currency: 'XOF', pourcentageReduction: discount, stockLoueOmni: qty,
        idempotencyKey: crypto.randomUUID(),
        positionKind: offerPosition, uniquenessKind: offerUniqueness, handoverKind: offerHandover, priceKind: offerPriceKind, conditionKind: offerCondition,
      });
      if (result.ok && result.data) {
        setToast('Offre créée en brouillon — publiez-la depuis le catalogue.');
        setShowOfferForm(false);
        setOfferName('');
        setOfferPrice('');
        if (onRefresh) onRefresh(); else void load();
      } else {
        setOfferError(result.error?.message ?? 'Offre non enregistrée.');
      }
    } catch { setOfferError('Offre non enregistrée.'); }
    finally { setOfferBusy(false); }
  }, [ws.selFacilityId, offerName, offerUnit, offerPrice, offerDiscount, offerQty, offerPosition, offerUniqueness, offerHandover, offerPriceKind, offerCondition, onRefresh, load]);

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

  const [bonusStatus, setBonusStatus] = useState<FacilityBonusStatus | null>(null);
  const [bonusBusy, setBonusBusy] = useState(false);

  const loadBonus = useCallback(async () => {
    const token = await getAuthToken();
    if (!token || !ws.selFacilityId) { setBonusStatus(null); return; }
    try {
      const result = await getFacilityBonusStatus({ token, facilityId: ws.selFacilityId });
      if (result.ok && result.data) setBonusStatus(result.data);
    } catch { /* bonus status is best-effort */ }
  }, [ws.selFacilityId]);

  const [analytics, setAnalytics] = useState<SellerFacilityAnalytics | null>(null);
  const loadAnalytics = useCallback(async () => {
    const token = await getAuthToken();
    if (!token || !ws.selFacilityId) { setAnalytics(null); return; }
    try {
      const result = await getFacilityAnalytics({ token, facilityId: ws.selFacilityId });
      if (result.ok && result.data) setAnalytics(result.data);
    } catch { /* analytics is best-effort */ }
  }, [ws.selFacilityId]);
  useEffect(() => { void loadAnalytics(); }, [loadAnalytics]);

  const [adCampaigns, setAdCampaigns] = useState<SellerAdCampaign[] | null>(null);
  const [adBudgetRemaining, setAdBudgetRemaining] = useState<number | null>(null);
  const [adName, setAdName] = useState('');
  const [adBudget, setAdBudget] = useState('');
  const [adBusy, setAdBusy] = useState(false);
  const loadAdCampaigns = useCallback(async () => {
    const token = await getAuthToken();
    if (!token || !ws.selFacilityId) { setAdCampaigns(null); setAdBudgetRemaining(null); return; }
    try {
      const result = await listFacilityAdCampaigns({ token, facilityId: ws.selFacilityId });
      if (result.ok && result.data) {
        setAdCampaigns(result.data.campaigns);
        setAdBudgetRemaining(result.data.budgetRemainingMinor);
      }
    } catch { /* campaigns are best-effort */ }
  }, [ws.selFacilityId]);
  useEffect(() => { void loadAdCampaigns(); }, [loadAdCampaigns]);

  const createCampaign = useCallback(async () => {
    const token = await getAuthToken();
    if (!token || !ws.selFacilityId || !adName.trim() || adBudget.trim() === '') return;
    setAdBusy(true); setError('');
    const budgetMinor = Math.round(Number(adBudget) * 100);
    const startsAt = new Date().toISOString();
    const endsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const result = await createFacilityAdCampaign({ token, facilityId: ws.selFacilityId, name: adName.trim(), budgetMinor, startsAt, endsAt, idempotencyKey: `ad-campaign:${ws.selFacilityId}:${Date.now()}` });
    setAdBusy(false);
    if (result.ok && result.data) {
      setAdName(''); setAdBudget('');
      await loadAdCampaigns();
    } else {
      setError(result.error?.message ?? 'Impossible de créer la campagne sponsorisée.');
    }
  }, [ws.selFacilityId, adName, adBudget, loadAdCampaigns]);

  useEffect(() => { void loadBonus(); }, [loadBonus]);

  const claimBonus = useCallback(async () => {
    const token = await getAuthToken();
    if (!token || !ws.selFacilityId) return;
    setBonusBusy(true); setError('');
    try {
      const result = await unlockFacilityBonus({ token, facilityId: ws.selFacilityId });
      if (result.ok && result.data) {
        setToast('Bonus confiance 20 USD crédité dans votre portefeuille.');
        setBonusStatus((cur) => cur ? { ...cur, status: 'granted', bonusUnlockedAt: new Date().toISOString() } : cur);
      } else {
        setError(result.error?.message ?? 'Le bonus ne peut pas encore être débloqué.');
      }
    } catch { setError('Le bonus ne peut pas être débloqué.'); }
    finally { setBonusBusy(false); }
  }, [ws.selFacilityId]);

  const [contactPhoneDraft, setContactPhoneDraft] = useState('');
  const [contactWhatsappDraft, setContactWhatsappDraft] = useState('');
  const [contactEditOpen, setContactEditOpen] = useState(false);
  const [contactBusy, setContactBusy] = useState(false);
  useEffect(() => {
    if (!contactEditOpen && activeFacility) {
      setContactPhoneDraft(activeFacility.contactPhone ?? '');
      setContactWhatsappDraft(activeFacility.contactWhatsapp ?? '');
    }
  }, [activeFacility, contactEditOpen]);
  const saveContact = useCallback(async () => {
    const token = await getAuthToken();
    if (!token || !ws.selFacilityId) return;
    setContactBusy(true); setError('');
    try {
      const result = await updateSellerFacilityContact({ token, facilityId: ws.selFacilityId, contactPhone: contactPhoneDraft.trim() || null, contactWhatsapp: contactWhatsappDraft.trim() || null });
      if (result.ok && result.data) {
        setContactEditOpen(false);
        setToast('Contact enregistré — visible par les acheteurs après intention.');
        if (onRefresh) onRefresh(); else void load();
      } else {
        setError(result.error?.message ?? 'Contact non enregistré.');
      }
    } catch { setError('Contact non enregistré.'); }
    finally { setContactBusy(false); }
  }, [ws.selFacilityId, contactPhoneDraft, contactWhatsappDraft, onRefresh, load]);

  const [renewalStatus, setRenewalStatus] = useState<FacilityRenewalStatus | null>(null);
  const [renewalBusy, setRenewalBusy] = useState(false);
  const loadRenewal = useCallback(async () => {
    const token = await getAuthToken();
    if (!token || !ws.selFacilityId) { setRenewalStatus(null); return; }
    try {
      const result = await getFacilityRenewalStatus({ token, facilityId: ws.selFacilityId });
      if (result.ok && result.data) setRenewalStatus(result.data);
    } catch { /* renewal status is best-effort */ }
  }, [ws.selFacilityId]);
  useEffect(() => { void loadRenewal(); }, [loadRenewal]);
  const toggleRenewalOptIn = useCallback(async () => {
    const token = await getAuthToken();
    if (!token || !ws.selFacilityId || !renewalStatus) return;
    setRenewalBusy(true); setError('');
    try {
      const result = await setFacilityRenewalOptIn({ token, facilityId: ws.selFacilityId, optIn: !renewalStatus.renewalOptIn });
      if (result.ok && result.data) {
        setRenewalStatus((cur) => cur ? { ...cur, renewalOptIn: result.data?.renewalOptIn ?? !cur.renewalOptIn } : cur);
        setToast(result.data.renewalOptIn ? 'Renouvellement automatique activé.' : 'Renouvellement automatique désactivé.');
      } else {
        setError(result.error?.message ?? 'Impossible de changer le renouvellement automatique.');
      }
    } catch { setError('Impossible de changer le renouvellement automatique.'); }
    finally { setRenewalBusy(false); }
  }, [ws.selFacilityId, renewalStatus]);
  const runRenewNow = useCallback(async () => {
    const token = await getAuthToken();
    if (!token || !ws.selFacilityId) return;
    setRenewalBusy(true); setError('');
    try {
      const result = await renewFacilityPro({ token, facilityId: ws.selFacilityId });
      if (result.ok && result.data) {
        if (result.data.renewed) setToast('Pro renouvelé pour 30 jours.');
        else setToast(result.data.status === 'insufficient_funds' ? 'Solde insuffisant — rechargez votre portefeuille pour prolonger Pro.' : 'Pas de renouvellement dû pour le moment.');
        void loadRenewal();
      } else {
        setError(result.error?.message ?? 'Impossible de renouveler Pro.');
      }
    } catch { setError('Impossible de renouveler Pro.'); }
    finally { setRenewalBusy(false); }
  }, [ws.selFacilityId, loadRenewal]);

  const stockSignal = ws.stockCount > 0 ? `${ws.stockCount} produit${ws.stockCount > 1 ? 's' : ''} · ${ws.stockTotal} unité${ws.stockTotal > 1 ? 's' : ''} Omni` : 'Aucun produit publié';
  const onMapCount = ws.ownedPublic.length;
  // Le catalogue vendeur est un objet même sans facilité ({facilities:[],products:[]}).
  // `hasData` dit seulement « le serveur a répondu » ; c'est `ws.hasFacility` qui dit
  // « ce compte a quelque chose à gérer ». Sans facilité, on montre l'entrée vendeur.
  const hasData = (propsCatalogue ?? catalogue) !== null;
  const hasFacility = ws.hasFacility;

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
          <div className="eyebrow">Espace vendeur</div>
          <p className="sub">Chargement de votre espace…</p>
        </div>
      )}
      {hasData && !hasFacility && (
        <div className="cardbox" style={{ marginTop: 9 }}>
          <div className="eyebrow">Bienvenue — espace vendeur</div>
          <p className="sub">Tout compte Omni peut vendre: une facilité d'abord, puis un catalogue et des offres.</p>
          <p className="tiny muted">Revendiquez une facilité déjà sur la carte — ou créez la vôtre en 2 minutes.</p>

          {ws.claimable.length > 0 ? (
            <>
              <div className="label" style={{ marginTop: 9 }}>Facilités à revendiquer près de vous</div>
              <div style={{ display: 'grid', gap: 6, marginTop: 6 }}>
                {ws.claimable.slice(0, 6).map((facility) => (
                  <button key={facility.id} type="button" className="cardbox" style={{ textAlign: 'left', width: '100%' }} onClick={() => onClaim?.(facility)}>
                    <b className="tiny" style={{ display: 'block' }}>{facility.name}</b>
                    <span className="tiny muted">{facility.category}{facility.address ? ` · ${facility.address}` : ''} · Non revendiquée</span>
                  </button>
                ))}
              </div>
              <div className="btnrow" style={{ marginTop: 7 }}>
                <button className="btn" type="button" onClick={onMap}>Voir toutes les facilités sur la carte</button>
                <button className="btn ghost" type="button" onClick={() => { setCreateError(''); setShowCreateForm((v) => !v); }}>Créer une facilité</button>
              </div>
            </>
          ) : (
            <div className="btnrow" style={{ marginTop: 7 }}>
              <button className="btn" type="button" onClick={onMap}>Ouvrir la carte pour revendiquer</button>
              <button className="btn ghost" type="button" onClick={() => { setCreateError(''); setShowCreateForm((v) => !v); }}>Créer une facilité</button>
            </div>
          )}
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
              <label className="tiny muted" style={{ display: 'block', marginTop: 9 }}>Téléphone (optionnel)</label>
              <input className="input" type="tel" value={facilityPhone} onChange={(e) => setFacilityPhone(e.target.value)} maxLength={40} placeholder="+228 90 00 00 00" style={{ width: '100%' }} />
              <label className="tiny muted" style={{ display: 'block', marginTop: 9 }}>WhatsApp (optionnel)</label>
              <input className="input" type="tel" value={facilityWhatsapp} onChange={(e) => setFacilityWhatsapp(e.target.value)} maxLength={40} placeholder="+228 90 00 00 00" style={{ width: '100%' }} />
              <p className="tiny muted" style={{ marginTop: 6 }}>Le contact n'est visible par les acheteurs qu'après une intention d'achat (jamais sur la fiche publique).</p>
              <div className="btnrow" style={{ marginTop: 11 }}>
                <button className="btn" type="button" disabled={createBusy} onClick={() => void submitCreate()}>{createBusy ? 'Création…' : 'Créer ma facilité'}</button>
                <button className="btn ghost" type="button" disabled={createBusy} onClick={() => setShowCreateForm(false)}>Annuler</button>
              </div>
            </div>
          )}
        </div>
      )}
      {hasFacility && renderStrip()}
      {hasFacility && ws.selFacilityCatalogue?.name && (
        <div className="cardbox" style={{ marginTop: 9 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div><b>{ws.selFacilityCatalogue?.name}</b><br /><span className="tiny muted">{stockSignal}</span></div>
            <button className="btn ghost sm" style={{ width: 'auto', minHeight: 30 }} type="button" onClick={onCompany}>Ouvrir</button>
          </div>
        </div>
      )}
      {hasFacility && ws.selFacilityCatalogue?.name && (
        <div className="cardbox" style={{ marginTop: 9, borderColor: bonusStatus?.status === 'eligible' ? 'var(--accent)' : undefined }}>
          <div className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
            <div>
              <b className="tiny" style={{ display: 'block' }}>Bonus confiance</b>
              {bonusStatus?.status === 'granted' ? (
                <span className="tiny" style={{ color: 'var(--accent)' }}>✓ 20 USD crédités dans le portefeuille — merci pour votre confiance.</span>
              ) : bonusStatus?.status === 'eligible' ? (
                <span className="tiny" style={{ color: 'var(--accent)' }}>3/3 acheteurs distincts — le bonus 20 USD est débloqué.</span>
              ) : (
                <span className="tiny muted">{bonusStatus?.distinctBuyerCount ?? 0}/3 acheteurs distincts · 20 USD verrouillé (ventes QR)</span>
              )}
            </div>
            {bonusStatus?.status === 'eligible' && (
              <button className="btn sm" type="button" disabled={bonusBusy} onClick={() => void claimBonus()}>{bonusBusy ? '…' : 'Débloquer'}</button>
            )}
          </div>
        </div>
      )}
      {hasFacility && ws.selFacilityCatalogue?.name && (
        <div className="cardbox" style={{ marginTop: 9 }}>
          <div className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
            <div>
              <b className="tiny" style={{ display: 'block' }}>Contact vendeur</b>
              {activeFacility?.contactPhone || activeFacility?.contactWhatsapp ? (
                <span className="tiny muted">
                  {activeFacility?.contactPhone && <b>{activeFacility.contactPhone}</b>}
                  {activeFacility?.contactPhone && activeFacility?.contactWhatsapp && ' · '}
                  {activeFacility?.contactWhatsapp && <b>WhatsApp {activeFacility.contactWhatsapp}</b>}
                </span>
              ) : (
                <span className="tiny muted">Aucun contact renseigné</span>
              )}
              <br />
              <span className="tiny muted">Visible par les acheteurs après intention d'achat.</span>
            </div>
            <button className="btn ghost sm" style={{ width: 'auto', minHeight: 30 }} type="button" onClick={() => setContactEditOpen((v) => !v)}>{contactEditOpen ? 'Fermer' : 'Modifier'}</button>
          </div>
          {contactEditOpen && (
            <div style={{ marginTop: 8 }}>
              <label className="tiny muted" style={{ display: 'block' }}>Téléphone</label>
              <input className="input" type="tel" value={contactPhoneDraft} onChange={(e) => setContactPhoneDraft(e.target.value)} maxLength={40} placeholder="+228 90 00 00 00" style={{ width: '100%' }} />
              <label className="tiny muted" style={{ display: 'block', marginTop: 8 }}>WhatsApp</label>
              <input className="input" type="tel" value={contactWhatsappDraft} onChange={(e) => setContactWhatsappDraft(e.target.value)} maxLength={40} placeholder="+228 90 00 00 00" style={{ width: '100%' }} />
              <button className="btn sm" style={{ marginTop: 8 }} type="button" disabled={contactBusy} onClick={() => void saveContact()}>{contactBusy ? 'Enregistrement…' : 'Enregistrer le contact'}</button>
            </div>
          )}
        </div>
      )}
      {hasFacility && ws.selFacilityCatalogue?.name && (
        <div className="cardbox" style={{ marginTop: 9 }}>
          <div className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
            <div>
              <b className="tiny" style={{ display: 'block' }}>Mes offres</b>
              <span className="tiny muted">Cette offre appartient à {ws.selFacilityCatalogue?.name} · l'entité. L'emplacement reste optionnel.</span>
            </div>
            {!showOfferForm && (
              <button className="btn ghost sm" style={{ width: 'auto', minHeight: 30 }} type="button" onClick={() => setShowOfferForm(true)}>Ajouter une offre</button>
            )}
          </div>
          {showOfferForm && (
            <div style={{ marginTop: 9 }}>
              {offerError && <p className="sub" role="alert">{offerError}</p>}
              <label className="tiny muted" style={{ display: 'block' }}>Nom de l'offre</label>
              <input className="input" type="text" value={offerName} onChange={(e) => setOfferName(e.target.value)} maxLength={180} placeholder="Ex: Spaghetti 500 g" style={{ width: '100%' }} />
              <div className="row" style={{ gap: 6, marginTop: 9 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <label className="tiny muted" style={{ display: 'block' }}>Prix (F)</label>
                  <input className="input" type="number" inputMode="numeric" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} placeholder="1000" style={{ width: '100%' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <label className="tiny muted" style={{ display: 'block' }}>Avantage Omni (%)</label>
                  <input className="input" type="number" inputMode="numeric" min={1} max={90} value={offerDiscount} onChange={(e) => setOfferDiscount(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <label className="tiny muted" style={{ display: 'block' }}>Quantité</label>
                  <input className="input" type="number" inputMode="numeric" min={0} value={offerQty} onChange={(e) => setOfferQty(e.target.value)} style={{ width: '100%' }} />
                </div>
              </div>
              <label className="tiny muted" style={{ display: 'block', marginTop: 9 }}>Unité</label>
              <input className="input" type="text" value={offerUnit} onChange={(e) => setOfferUnit(e.target.value)} maxLength={40} placeholder="unit · sac · kg · heure" style={{ width: '100%' }} />
              <label className="tiny muted" style={{ display: 'block', marginTop: 9 }}>Position</label>
              <div className="btnrow" style={{ gap: 6, marginTop: 4 }}>
                {(['fixe', 'mobile', 'immaterielle'] as OfferPositionKind[]).map((k) => (
                  <button key={k} type="button" className={offerPosition === k ? 'btn sm' : 'btn ghost sm'} style={{ width: 'auto', flex: 1, minHeight: 30 }} onClick={() => setOfferPosition(k)}>{k === 'fixe' ? 'Fixe' : k === 'mobile' ? 'Mobile' : 'Immatérielle'}</button>
                ))}
              </div>
              <label className="tiny muted" style={{ display: 'block', marginTop: 9 }}>Unicité</label>
              <div className="btnrow" style={{ gap: 6, marginTop: 4 }}>
                {(['renouvelable', 'piece_unique'] as OfferUniquenessKind[]).map((k) => (
                  <button key={k} type="button" className={offerUniqueness === k ? 'btn sm' : 'btn ghost sm'} style={{ width: 'auto', flex: 1, minHeight: 30 }} onClick={() => setOfferUniqueness(k)}>{k === 'renouvelable' ? 'Renouvelable' : 'Pièce unique'}</button>
                ))}
              </div>
              <label className="tiny muted" style={{ display: 'block', marginTop: 9 }}>Remise</label>
              <div className="btnrow" style={{ gap: 6, marginTop: 4 }}>
                {(['retrait', 'livraison', 'immateriel'] as OfferHandoverKind[]).map((k) => (
                  <button key={k} type="button" className={offerHandover === k ? 'btn sm' : 'btn ghost sm'} style={{ width: 'auto', flex: 1, minHeight: 30 }} onClick={() => setOfferHandover(k)}>{k === 'retrait' ? 'Retrait' : k === 'livraison' ? 'Livraison' : 'Immatériel'}</button>
                ))}
              </div>
              <div className="row" style={{ gap: 6, marginTop: 9 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <label className="tiny muted" style={{ display: 'block' }}>État</label>
                  <div className="btnrow" style={{ gap: 6, marginTop: 4 }}>
                    {(['neuf', 'occasion'] as OfferConditionKind[]).map((k) => (
                      <button key={k} type="button" className={offerCondition === k ? 'btn sm' : 'btn ghost sm'} style={{ width: 'auto', flex: 1, minHeight: 30 }} onClick={() => setOfferCondition(k)}>{k === 'neuf' ? 'Neuf' : 'Occasion'}</button>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <label className="tiny muted" style={{ display: 'block' }}>Prix</label>
                  <div className="btnrow" style={{ gap: 6, marginTop: 4 }}>
                    {(['fixe', 'negociable'] as OfferPriceKind[]).map((k) => (
                      <button key={k} type="button" className={offerPriceKind === k ? 'btn sm' : 'btn ghost sm'} style={{ width: 'auto', flex: 1, minHeight: 30 }} onClick={() => setOfferPriceKind(k)}>{k === 'fixe' ? 'Fixe' : 'À négocier'}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="btnrow" style={{ marginTop: 11 }}>
                <button className="btn" type="button" disabled={offerBusy} onClick={() => void submitOffer()}>{offerBusy ? 'Publication…' : 'Publier mon offre'}</button>
                <button className="btn ghost" type="button" disabled={offerBusy} onClick={() => setShowOfferForm(false)}>Annuler</button>
              </div>
              <p className="tiny muted" style={{ marginTop: 6 }}>L'offre est créée en brouillon : publiez-la depuis le catalogue. Le badge de confiance reste propre à l'entité — jamais à l'offre.</p>
            </div>
          )}
        </div>
      )}
      {hasFacility && ws.selFacilityCatalogue?.name && renewalStatus && (
        <div className="cardbox" style={{ marginTop: 9 }}>
          <div className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
            <div>
              <b className="tiny" style={{ display: 'block' }}>Pro · renouvellement</b>
              {renewalStatus.plan === 'pro_active' ? (
                <span className="tiny muted">Actif · reste {renewalStatus.daysLeft} j · {planUsdLabel(renewalStatus.baseProPriceUsdMinor)}/mois ≈ {money(renewalStatus.proPriceMinor, renewalStatus.billingCurrency)}</span>
              ) : renewalStatus.plan === 'pro_expired' ? (
                <span className="tiny muted">Expiré — renouvellement via portefeuille</span>
              ) : (
                <span className="tiny muted">Free — le Pro débloque catalogue + dispo auto</span>
              )}
            </div>
            {renewalStatus.plan !== 'free' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="tiny muted">{renewalStatus.renewalOptIn ? 'Auto ON' : 'Auto OFF'}</span>
                <button className={`btn sm ${renewalStatus.renewalOptIn ? '' : 'ghost'}`} type="button" disabled={renewalBusy || !ws.selFacilityId} onClick={() => void toggleRenewalOptIn()}>{renewalBusy ? '…' : renewalStatus.renewalOptIn ? 'Désactiver' : 'Activer'}</button>
              </div>
            )}
          </div>
          {renewalStatus.plan === 'pro_expired' && renewalStatus.renewalOptIn && !renewalStatus.sufficientFunds && (
            <p className="tiny" style={{ marginTop: 6, color: 'var(--warn)' }}>Solde insuffisant pour le renouvellement auto ({money(renewalStatus.walletBalanceMinor, renewalStatus.billingCurrency)} sur {money(renewalStatus.proPriceMinor, renewalStatus.billingCurrency)}). Rechargez votre portefeuille.</p>
          )}
          {renewalStatus.plan === 'pro_expired' && (
            <button className="btn ghost sm" style={{ width: 'auto', minHeight: 28, marginTop: 6 }} type="button" disabled={renewalBusy} onClick={() => void runRenewNow()}>{renewalBusy ? '…' : 'Renouveler Pro maintenant'}</button>
          )}
        </div>
      )}
      {hasFacility && ws.selFacilityCatalogue?.name && (
        <div className="cardbox" style={{ marginTop: 9 }}>
          <div className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
            <div>
              <b className="tiny" style={{ display: 'block' }}>Performance</b>
              <span className="tiny muted">{ws.selFacilityCatalogue.name}</span>
            </div>
            <button className="btn ghost sm" style={{ width: 'auto', minHeight: 28 }} type="button" onClick={() => void loadAnalytics()}>Actualiser</button>
          </div>
          {!analytics ? (
            <p className="tiny muted" style={{ marginTop: 6 }}>Chargement des indicateurs…</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 9 }}>
              <div>
                <small className="fs-7" style={{ display: 'block', color: 'var(--ink-soft)' }}>Demandes reçues</small>
                <strong className="fs-17" style={{ display: 'block', marginTop: 2 }}>{analytics.requests}</strong>
              </div>
              <div>
                <small className="fs-7" style={{ display: 'block', color: 'var(--ink-soft)' }}>Transactions</small>
                <strong className="fs-17" style={{ display: 'block', marginTop: 2 }}>{analytics.transactionsStarted}<small className="fs-7 muted"> · {analytics.transactionsClosed} clôturées</small></strong>
              </div>
              <div>
                <small className="fs-7" style={{ display: 'block', color: 'var(--ink-soft)' }}>Revenu</small>
                <strong className="fs-17" style={{ display: 'block', marginTop: 2 }}>{money(analytics.grossRevenueMinor, analytics.billingCurrency)}</strong>
              </div>
              <div>
                <small className="fs-7" style={{ display: 'block', color: 'var(--ink-soft)' }}>QR vérifiés</small>
                <strong className="fs-17" style={{ display: 'block', marginTop: 2 }}>{analytics.qrScansVerified}</strong>
              </div>
            </div>
          )}
        </div>
      )}
      {hasFacility && ws.selFacilityCatalogue?.name && renewalStatus && (
        <div className="cardbox" style={{ marginTop: 9 }}>
          <div className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
            <div>
              <b className="tiny" style={{ display: 'block' }}>Campagnes sponsorisées</b>
              <span className="tiny muted">
                {renewalStatus.plan === 'pro_active'
                  ? `Budget portefeuille restant ${adBudgetRemaining === null ? '…' : money(adBudgetRemaining, 'XOF')}`
                  : 'Réservé aux facilités Pro actives'}
              </span>
            </div>
            {renewalStatus.plan === 'pro_active' && (
              <button className="btn ghost sm" style={{ width: 'auto', minHeight: 28 }} type="button" onClick={() => void loadAdCampaigns()}>Actualiser</button>
            )}
          </div>
          {renewalStatus.plan !== 'pro_active' ? (
            <p className="tiny muted" style={{ marginTop: 6 }}>Activez Omni Pro pour lancer une campagne sponsorisée — votre facilité apparaît en premier dans la recherche avec le badge « Sponsorisé ».</p>
          ) : (
            <div style={{ marginTop: 9 }}>
              <div className="row" style={{ gap: 6, marginBottom: 6 }}>
                <input className="fld" style={{ flex: 2 }} value={adName} onChange={(e) => setAdName(e.target.value)} placeholder="Nom de la campagne" disabled={adBusy} />
                <input className="fld" style={{ flex: 1 }} type="number" min="0" step="0.01" value={adBudget} onChange={(e) => setAdBudget(e.target.value)} placeholder="Budget (XOF)" disabled={adBusy} />
                <button className="btn sm" type="button" disabled={adBusy || !adName.trim() || adBudget.trim() === ''} onClick={() => void createCampaign()}>{adBusy ? '…' : 'Lancer'}</button>
              </div>
              {(!adCampaigns || adCampaigns.length === 0) ? (
                <p className="tiny muted">Aucune campagne. Budget réservé dans le portefeuille au lancement (30 jours).</p>
              ) : (
                <div style={{ display: 'grid', gap: 6 }}>
                  {adCampaigns.map((c) => (
                    <div key={c.id} className="row" style={{ justifyContent: 'space-between', gap: 8, background: 'var(--panel)', borderRadius: 10, padding: '6px 8px' }}>
                      <div>
                        <b className="tiny" style={{ display: 'block' }}>{c.name}</b>
                        <span className="tiny muted">{money(c.budgetMinor, 'XOF')} · dépensé {money(c.spentMinor, 'XOF')} · du {new Date(c.startsAt).toLocaleDateString('fr-FR')} au {new Date(c.endsAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <span className={`status ${c.status === 'active' ? 'ok' : c.status === 'terminee' ? 'dash' : 'warn'}`}>{c.status === 'active' ? 'Active' : c.status === 'planifiee' ? 'Planifiée' : c.status === 'pausee' ? 'En pause' : 'Terminée'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {hasFacility && (
        <>
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
        </>
      )}
    </section>
  );
}
