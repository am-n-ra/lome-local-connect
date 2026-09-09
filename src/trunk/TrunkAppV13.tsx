import { FormEvent, type ReactNode, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Banknote, Bell, BellOff, Building2, CheckCircle2, ChevronRight, Clock3,
  Compass, Home, LogOut, MapPin, Menu, PackageSearch, QrCode, RefreshCw, Search, ShieldCheck,
  Trash2, User, Wallet, X,
} from 'lucide-react';
import { authClient, getAuthToken } from '../auth';
import {
  cancelFacilityClaim, createFacilityClaimDraft, createSavedSearch, createWalletRecharge, deleteSavedSearch,
  getAccountCapabilities, getAvailabilityResponses, getBuyerAvailabilityRequests, getClaimStorageStatus, getFacilityDetail,
  getSellerAvailabilityQueue, getSellerCatalogue, getWalletOverview, listPublicFacilities, listSavedSearches, requestAvailability, submitFacilityClaim, uploadFacilityEvidence,
} from './api';
import { parseFacilityIdFromQr, describePendingAction, pendingActionResume, sortProductsStockFirst, type PendingAction } from './ui-helpers';
import type {
  AvailabilityResponseStatus, AvailabilityResponsesResult, BuyerAvailabilityRequestSummary, ClaimDraftResult, ClaimEvidenceItem, EvidenceKind,
  FacilityDetail, PublicFacility, PublicProduct, SavedSearch, SearchOptions, SellerAvailabilityRequest, SellerCatalogueResult, WalletOverviewResult, WalletRechargeResult,
} from './types';
import { sessionUserFromAuthResult, type SessionUser } from './auth-session';
import { useViewportInsets } from '../hooks/use-viewport-insets';
import { TrunkMap } from './TrunkMap';
import { AdminV13 } from './AdminV13';
import { BuyerFlowV13 } from './BuyerFlowV13';
import { PublicQrScannerSheet } from '../components/ui/PublicQrScannerSheet';
import { SellerQrScannerSheet } from './SellerQrScannerSheet';
import { SellerV13 } from './SellerV13';
import { SellerReplyV13 } from './SellerReplyV13';
import { ProductCatalogueV13 } from './ProductCatalogueV13';
import { StockEventLedgerV13 } from './StockEventLedgerV13';
import { OffersV13 } from './OffersV13';
import { CompanyV13 } from './CompanyV13';
import { OnboardV13 } from './OnboardV13';
import { compareFacilities } from './v13-compare';
import './ui-v13.css';

type Sheet = 'none' | 'search' | 'results' | 'facility' | 'bulk' | 'compare' | 'menu' | 'account' | 'auth' | 'admin' | 'flow' | 'seller' | 'seller-reply' | 'seller-qr' | 'home' | 'wallet' | 'plans' | 'saved' | 'claim' | 'qr' | 'products' | 'stockevent' | 'offers' | 'company' | 'onboard';
type Role = 'buyer' | 'seller' | 'admin' | 'operator';
type MapState = 'loading' | 'ready' | 'error' | 'empty';

const CLAIM_KINDS: Array<[EvidenceKind, string]> = [
  ['identity', 'Identité du représentant'],
  ['company', 'Société / activité'],
  ['facility', 'Facilité et localisation'],
  ['product', 'Produit ou service'],
  ['location', 'Repère de localisation'],
  ['service', 'Preuve de service'],
];


function moneyOrQty(stockLoueOmni: number): string {
  return `${stockLoueOmni} dispo`;
}

function bulkLabel(status: string): string {
  if (status === 'available') return 'Disponible';
  if (status === 'partial') return 'Partielle';
  if (status === 'unavailable') return 'Indisponible';
  if (status === 'expired') return 'Expirée';
  if (status === 'error') return 'Erreur';
  return 'En attente';
}

function statusLabel(requestStatus: string): string {

  if (requestStatus === 'available') return 'Disponible';
  if (requestStatus === 'partial') return 'Partielle';
  if (requestStatus === 'corrected') return 'Corrigée';
  if (requestStatus === 'expired') return 'Expirée';
  return 'Indisponible';
}

function money(minor: number, currency: string): string {
  const whole = Number.isInteger(minor / 100);
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: whole ? 0 : 2 }).format(minor / 100);
}

const LOME = [1.22, 6.13] as const;

const SEARCH_CONSTRAINTS: Record<Role, string[]> = {
  buyer: ['Quantité 10', '≤ 15 000 FCFA', '≤ 10 km', 'Ouvert', 'Livraison', 'Transactable'],
  seller: ['Ma compagnie', 'Vérifiée', 'À valider', 'Stock bas'],
  admin: ['Claims', 'Créations', 'À valider', 'Preuves prêtes'],
  operator: ['Tournée du jour', 'À visiter', 'Vérifiés'],
};

const SEARCH_LABEL: Record<Role, [string, string]> = {
  buyer: ['Recherche', 'Que cherchez-vous ?'],
  seller: ['Recherche Seller', 'Trouvez vos compagnies & facilités'],
  admin: ['Recherche équipe', 'Trouvez un objet de revue'],
  operator: ['Recherche équipe', 'Trouvez un point de tournée'],
};

const SEARCH_PLACEHOLDER: Record<Role, string> = {
  buyer: 'Produit, service, propriété…',
  seller: 'Compagnie, facilité…',
  admin: 'Claim, création, facilité…',
  operator: 'Claim, création, facilité…',
};

export function TrunkAppV13() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  useViewportInsets(stageRef);
  const [facilities, setFacilities] = useState<PublicFacility[]>([]);
  const [mapState, setMapState] = useState<MapState>('loading');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [constraintsOpen, setConstraintsOpen] = useState(false);
  const [activeConstraints, setActiveConstraints] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<PublicFacility[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<FacilityDetail | null>(null);
  const [facProductSel, setFacProductSel] = useState<string[]>([]);
  const [facilityLoading, setFacilityLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrScanKey, setQrScanKey] = useState(0);
  const [sheet, setSheet] = useState<Sheet>('none');
  const [role, setRole] = useState<Role>('buyer');
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [accountRoles, setAccountRoles] = useState<string[]>([]);const [ownedFacilityIds, setOwnedFacilityIds] = useState<string[]>([]);const [sellerCatalogue, setSellerCatalogue] = useState<SellerCatalogueResult | null>(null);const [sellerQueue, setSellerQueue] = useState<SellerAvailabilityRequest[]>([]);const [sellerWorkspaceState, setSellerWorkspaceState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');const [adminTools, setAdminTools] = useState(false);const [focusTarget, setFocusTarget] = useState<{ latitude: number; longitude: number; key: string } | null>(null);const [flowFacility, setFlowFacility] = useState<{ id: string; name: string } | null>(null);const [flowProduct, setFlowProduct] = useState<{ id: string; name: string } | null>(null);
  const [followTarget, setFollowTarget] = useState<{ latitude: number; longitude: number; key: string } | null>(null);
  const [resultsFollowId, setResultsFollowId] = useState<string | null>(null);
  const resultsScrollFrame = useRef<number | null>(null);
  const resultsFollowKeyCounter = useRef(0);
const [bulkFacilities, setBulkFacilities] = useState<PublicFacility[] | null>(null);
const [bulkDetails, setBulkDetails] = useState<Record<string, FacilityDetail | null>>({});
const [bulkSelection, setBulkSelection] = useState<Record<string, string>>({});
const [stockEventProductId, setStockEventProductId] = useState<string | null>(null);
const [pendingSearch, setPendingSearch] = useState('');
const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
const [bulkLoading, setBulkLoading] = useState(false);
const [bulkSending, setBulkSending] = useState(false);
const [bulkResults, setBulkResults] = useState<Array<{ facilityId: string; facilityName: string; productName: string; status: 'submitted' | 'available' | 'partial' | 'unavailable' | 'expired' | 'error'; quantityAvailable: number | null; observedAt: string | null }> | null>(null);
const [bulkErrors, setBulkErrors] = useState<string | null>(null);
const [compareResults, setCompareResults] = useState<PublicFacility[]>([]);
const [compareSort, setCompareSort] = useState<'match' | 'distance' | 'price' | 'remise'>('match');
  const [revealKey, setRevealKey] = useState<string | null>(null);
  const [revealActive, setRevealActive] = useState(false);
  const [revealPending, setRevealPending] = useState(false);
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(null);
  const [simMode, setSimMode] = useState<'normal' | 'vide' | 'lent' | 'erreur'>('normal');

  // Espace Buyer — demandes
  const [buyerRequests, setBuyerRequests] = useState<BuyerAvailabilityRequestSummary[]>([]);
  const [buyerRequestsState, setBuyerRequestsState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [buyerRequestsError, setBuyerRequestsError] = useState('');
  // Wallet
  const [wallet, setWallet] = useState<WalletOverviewResult | null>(null);
  const [walletState, setWalletState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [walletError, setWalletError] = useState('');
  const [rechargeAmount, setRechargeAmount] = useState('100');
  const [rechargeState, setRechargeState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [rechargeError, setRechargeError] = useState('');
  const [rechargeResult, setRechargeResult] = useState<WalletRechargeResult | null>(null);
// Recherches enregistrées
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [savedState, setSavedState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [savedError, setSavedError] = useState('');
  const [savedDeletingId, setSavedDeletingId] = useState<string | null>(null);
// Claim
  const [claimResult, setClaimResult] = useState<ClaimDraftResult | null>(null);
  const [claimEvidence, setClaimEvidence] = useState<ClaimEvidenceItem[]>([]);
  const [claimStorage, setClaimStorage] = useState<boolean | null>(null);
  const [claimState, setClaimState] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [claimError, setClaimError] = useState('');
  const [claimUploadProgress, setClaimUploadProgress] = useState(0);
  const [claimUploadState, setClaimUploadState] = useState<'idle' | 'uploading' | 'error'>('idle');
  const [claimUploadError, setClaimUploadError] = useState('');
  const [claimSubmitState, setClaimSubmitState] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [claimSubmitError, setClaimSubmitError] = useState('');
  const [claimActionState, setClaimActionState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [claimActionError, setClaimActionError] = useState('');
  const [desktop, setDesktop] = useState(() => (typeof window !== 'undefined' && (window.matchMedia?.('(min-width:1040px)').matches ?? false)));
  // Le rail gauche n'apparaît que pendant une session « parcours » (results/facility/bulk/compare/flow/claim/seller —
  // exactement la règle du tiroir gauche de la maquette : destination ≠ étape du parcours actuel.

  const journeySheets = useMemo<Set<Sheet>>(() => new Set(['results', 'facility', 'bulk', 'compare', 'flow', 'claim', 'seller', 'seller-reply', 'menu', 'account', 'home', 'wallet', 'plans', 'saved', 'auth']), []);
  const isJourney = journeySheets.has(sheet);
  useEffect(() => {
    const mq = window.matchMedia?.('(min-width:1040px)');
    if (!mq) return;
    const apply = () => { setDesktop(mq.matches); document.body.classList.toggle('desktop', mq.matches); };
    apply();
    if (mq.addEventListener) mq.addEventListener('change', apply); else mq.addListener(apply);
    return () => { if (mq.removeEventListener) mq.removeEventListener('change', apply); else mq.removeListener(apply); };
  }, []);
  useEffect(() => { document.body.classList.toggle('desktop', desktop); }, [desktop]);

  const loadPublic = useCallback(async (bbox?: [number, number, number, number]) => {
    if (simMode === 'vide') {
      await new Promise((r) => setTimeout(r, 300));
      setFacilities([]);
      setMapState('empty');
      setError('');
      return;
    }
    if (simMode === 'lent') {
      await new Promise((r) => setTimeout(r, 8000));
    }
    if (simMode === 'erreur') {
      await new Promise((r) => setTimeout(r, 500));
      setMapState('error');
      setError('Simulated network error');
      return;
    }
    const result = await listPublicFacilities(bbox ?? undefined);
    if (result.ok && result.data) {
      setFacilities(result.data);
      setMapState(result.data.length ? 'ready' : 'empty');
      setError('');
    } else {
      setMapState('error');
      setError(result.error?.message ?? 'La découverte publique est temporairement indisponible.');
    }
  }, [simMode]);

  useEffect(() => {
    let active = true;
    void loadPublic().catch(() => { if (active) { setMapState('error'); setError('La découverte publique est temporairement indisponible.'); } });
    return () => { active = false; };
  }, [loadPublic]);

  // Espace Seller map-first (V-7a(: la donnée vendeur est levée une fois au niveau
  // de l'app — les pins détenus (owner) portent l'anneau Evergreen sur la carte
  // toujours visible,et les strips du workspace reflètent le découpage dédié.

  const loadSellerWorkspace = useCallback(async () => {
    if (sellerWorkspaceState === 'loading') return;
    setSellerWorkspaceState('loading');
    try {
      const token = await getAuthToken();
      if (!token) return;
      const [catalogueResult, queueResult] = await Promise.all([
        getSellerCatalogue({ token }),
        getSellerAvailabilityQueue({ token }).catch(() => null),
      ]);
      if (catalogueResult.ok && catalogueResult.data) setSellerCatalogue(catalogueResult.data);
      if (queueResult?.ok && queueResult.data) setSellerQueue(queueResult.data.requests);
      setSellerWorkspaceState('ready');
    } catch { setSellerWorkspaceState('error'); }
  }, [sellerWorkspaceState]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const result = await authClient?.getSession?.();
      const user = sessionUserFromAuthResult(result);
      if (active && user) {
        setSessionUser(user);
        const token = await getAuthToken();
        if (token) {
          const caps = await getAccountCapabilities({ token });
          if (caps.ok && caps.data) {
            setAccountRoles(caps.data.roles ?? []);
            setOwnedFacilityIds(caps.data.ownedFacilityIds ?? []);
            setAdminTools(Boolean(caps.data.capabilities?.adminTools));
            if (caps.data.capabilities?.sellerWorkspace) void loadSellerWorkspace();
          }
        }
      }
      } catch { /* session restore */ }
    })();
    return () => { active = false; };
  }, []);

  // Retour d’une recharge FedaPay (callback): on rouvre le Wallet et on ré-affiche le solde à jour.

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('wallet') !== 'recharge') return;
    const approved = params.get('status') === 'approved';
    const txnId = params.get('id');
    if (approved && txnId) {
      setRechargeState('success');
      setRechargeResult({ checkoutUrl: '', amountMinor: Number(params.get('amount') ?? '0'), currency: 'XOF' } as WalletRechargeResult);
    }
    setSheet('wallet');
    void (async () => {
      const token = await getAuthToken();
      if (!token) return;
      const result = await getWalletOverview({ token });
      if (result.ok && result.data) { setWallet(result.data); setWalletState('idle'); }
    })();
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  const runSearch = useCallback(async (raw: string, opts?: SearchOptions) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    setResultsLoading(true);
    setSheet('none');
    try {
      if (simMode === 'vide') {
        await new Promise((r) => setTimeout(r, 300));
        setResults([]);
        setResultsLoading(false);
        setRevealKey(`v13-${Date.now()}`);
        setRevealPending(true);
        return;
      }
      if (simMode === 'lent') {
        await new Promise((r) => setTimeout(r, 8000));
      }
      if (simMode === 'erreur') {
        await new Promise((r) => setTimeout(r, 500));
        throw new Error('Simulated network error');
      }
      const result = await listPublicFacilities(bounds ?? undefined, trimmed, opts);
      if (result.ok && result.data) {
        setResults(result.data);
        setResultsLoading(false);
        setRevealKey(`v13-${Date.now()}`);
        setRevealPending(true);
      } else {
        setResultsLoading(false);
        setError(result.error?.message ?? 'Recherche indisponible.');
        setSheet('results');
      }
    } catch (caught) {
      setResultsLoading(false);
      setError(caught instanceof Error ? caught.message : 'Recherche indisponible.');
      setSheet('results');
    }
  }, [bounds, simMode]);

  const handleRevealStateChange = useCallback((active: boolean) => {
    setRevealActive(active);
    if (!active) setRevealPending(false);
    if (!active && (sheet === 'none' || sheet === 'results')) setSheet('results');
  }, [sheet]);

  const handleResultsScroll = useCallback(() => {
    if (resultsScrollFrame.current !== null) return;
    resultsScrollFrame.current = window.requestAnimationFrame(() => {
      resultsScrollFrame.current = null;
      const grid = document.getElementById('hgrid');
      if (!grid || revealActive) return;
      const cards = Array.from(grid.querySelectorAll<HTMLElement>('[data-fid]'));
      if (!cards.length) return;
      const sheet = grid.closest('.sheet') ?? grid;
      const rect = sheet.getBoundingClientRect();
      const center = rect.top + rect.height * 0.42;
      let best: HTMLElement | null = null;
      let bestGap = Infinity;
      for (const card of cards) {
        const cardRect = card.getBoundingClientRect();
        const gap = Math.abs(cardRect.top + cardRect.height * 0.5 - center);
        if (gap < bestGap) { bestGap = gap; best = card; }
      }
      if (!best) return;
      const fid = best.dataset.fid ?? null;
      if (fid && resultsFollowId !== fid) {
        setResultsFollowId(fid);
        const facility = results.find((f) => f.id === fid);
        if (facility) {
          resultsFollowKeyCounter.current = resultsFollowKeyCounter.current + 1;
          setFollowTarget({ latitude: facility.latitude, longitude: facility.longitude, key: `follow-${fid}-${resultsFollowKeyCounter.current}` });
        }
      }
    });
  }, [revealActive, results, resultsFollowId]);

  useEffect(() => () => {
    if (resultsScrollFrame.current !== null) window.cancelAnimationFrame(resultsScrollFrame.current);
  }, []);

  // Garantie d'affichage : les résultats s'ouvrent au plus tard 5,5 s après la recherche,
  // même si le style de carte n'est jamais prêt (la cinématique est un bonus, jamais un blocage).
  useEffect(() => {
    if (!revealPending) return;
    const t = window.setTimeout(() => {
      setRevealPending(false);
      setRevealActive(false);
      setSheet(sheet === 'none' ? 'results' : sheet);
    }, 5500);
    return () => window.clearTimeout(t);
  }, [revealPending, sheet]);

  const handlePinSelect = useCallback(async (facility: PublicFacility) => {
    setSelectedId(facility.id);
    setSelectedFacility(null);
    setFacProductSel([]);
    // Défilement contextuel bidirectionnel (v1.3 §4.4): un tap marker pendant
    // une session résultats fait aussi défiler la grille vers la carte correspondante.

    const grid = document.getElementById('hgrid');
    grid?.querySelector<HTMLElement>(`[data-fid="${facility.id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth', inline: 'nearest' });
    setFacilityLoading(true);
    setSheet('facility');
    try {
      const detail = await getFacilityDetail(facility.id);
      setSelectedFacility(detail.ok && detail.data ? detail.data : null);
    } catch {
      setSelectedFacility(null);
    } finally {
      setFacilityLoading(false);
    }
  }, []);

  const handleQrDetected = useCallback(async (facilityId: string) => {
    if (!parseFacilityIdFromQr(facilityId)) { setQrError('QR non reconnu — visez le QR public d’une facilité.'); return; }
    const found = facilities.find((item) => item.id === facilityId) ?? null;
    if (found) { setSheet('qr'); await handlePinSelect(found); return; }
    const result = await listPublicFacilities(undefined, undefined, { category: '' });
    const detail = (result.ok ? (result.data ?? []) : []).find((item) => item.id === facilityId) ?? null;
    if (!detail) { setQrError('Facilité introuvable dans cette zone — QR inconnu.'); setSheet('qr'); return; }
    setSheet('qr'); await handlePinSelect(detail);
  }, [facilities, handlePinSelect]);

  const requireAuth = useCallback(async (): Promise<string | null> => {
    try {
      const token = await getAuthToken();
      if (!token) { setSheet('auth'); return null; }
      return token;
    } catch { setSheet('auth'); return null; }
  }, []);

  const gateRequest = useCallback((action: PendingAction): boolean => {
    if (sessionUser) return true;
    setPendingAction(action);
    setSheet('auth');
    return false;
  }, [sessionUser]);

  const openBulk = useCallback(async () => {
    setSheet('bulk');
    setBulkSending(false);
    setBulkResults(null);
    setBulkErrors(null);
    setBulkFacilities(results.length > 0 ? results : null);
    if (results.length === 0) { setBulkErrors('Aucune facilité en résultat. Lancez d\'abord une recherche.'); return; }
    setBulkLoading(true);
    const token = await requireAuth();
    if (!token) { setBulkLoading(false); return; }
    try {
      await Promise.all(results.map(async (facility) => {
        const detail = bulkDetails[facility.id] ?? (await getFacilityDetail(facility.id)).data ?? null;
        setBulkDetails((current) => ({ ...current, [facility.id]: detail }));
        const productId = detail?.products?.find((p) => p.stockLoueOmni > 0)?.id ?? detail?.products?.[0]?.id;
        if (productId) setBulkSelection((current) => ({ ...current, [facility.id]: productId }));
      }));
    } catch { /* per-facility detail errors handled per row */ }
    setBulkLoading(false);
  }, [results, bulkDetails]);

  const sendBulk = useCallback(async () => {
    const token = await requireAuth();
    if (!token || bulkSending) return;
    const entries = Object.entries(bulkSelection).filter(([, productId]) => Boolean(productId));
    if (entries.length === 0) { setBulkErrors('Sélectionnez au moins une facilité.'); return; }
    setBulkSending(true); setBulkErrors(null);
    const submitted = await Promise.all(entries.map(async ([facilityId, productId]) => {
      const facilityName = (bulkFacilities ?? []).find((f) => f.id === facilityId)?.name ?? facilityId;
      const productName = bulkDetails[facilityId]?.products?.find((p) => p.id === productId)?.name ?? 'Produit';
      try {
        if (simMode === 'erreur') {
          await new Promise((r) => setTimeout(r, 500));
          return { facilityId, facilityName, productName, status: 'error' as const, quantityAvailable: null, observedAt: null };
        }
        if (simMode === 'lent') {
          await new Promise((r) => setTimeout(r, 8000));
        }
        if (simMode === 'vide') {
          await new Promise((r) => setTimeout(r, 300));
          return { facilityId, facilityName, productName, status: 'unavailable' as const, quantityAvailable: 0, observedAt: new Date().toISOString() };
        }
        const result = await requestAvailability({
          productId, facilityId, quantity: 1, budgetMode: 'unlimited', budgetMinor: null, token,
          deliveryMode: 'retrait',
          note: null,
          idempotencyKey: 'bulk-' + facilityId + '-' + crypto.randomUUID(),
        });
        if (!result.ok || !result.data) return { facilityId, facilityName, productName, status: 'error' as const, quantityAvailable: null, observedAt: null };
        const requestId = result.data.requestId;
        const poll = async (): Promise<{ facilityId: string; facilityName: string; productName: string; status: 'submitted' | 'available' | 'partial' | 'unavailable' | 'expired'; quantityAvailable: number | null; observedAt: string | null }> => {
          for (let attempt = 0; attempt < 4; attempt++) {
            await new Promise((resolve) => window.setTimeout(resolve, 3000));
            const res = await getAvailabilityResponses({ requestId, token });
            if (res.ok && res.data && res.data.responses.length > 0) {
              const r = res.data.responses[0];
              return { facilityId, facilityName, productName, status: r.status === 'available' ? 'available' : r.status === 'partial' ? 'partial' : r.status === 'unavailable' ? 'unavailable' : 'expired', quantityAvailable: r.quantityAvailable ?? null, observedAt: r.observedAt ?? null };
            }
          }
          return { facilityId, facilityName, productName, status: 'submitted' as const, quantityAvailable: null, observedAt: null };
        };
        return await poll();
      } catch {
        return { facilityId, facilityName, productName, status: 'error' as const, quantityAvailable: null, observedAt: null };
      }
    }));
    setBulkResults(submitted);
    setBulkSending(false);
  }, [bulkSelection, bulkFacilities, bulkDetails, bulkSending]);

  const openCompare = useCallback(async () => {
    setSheet('compare');
    const facilities = compareResults.length > 0 ? compareResults : results;
    setCompareResults(facilities);
    if (facilities.length === 0) return;
    const token = await requireAuth();
    if (!token) return;
    await Promise.all(facilities.map(async (facility) => {
      const detail = bulkDetails[facility.id] ?? (await getFacilityDetail(facility.id)).data ?? null;
      setBulkDetails((current) => ({ ...current, [facility.id]: detail }));
    }));
  }, [compareResults, results, bulkDetails]);

  const openHome = useCallback(async () => {
    const token = await requireAuth();
    if (!token) return;
    setSheet('home'); setBuyerRequestsState('loading'); setBuyerRequestsError('');
    try {
      const result = await getBuyerAvailabilityRequests({ token });
      if (result.ok && result.data) {
        setBuyerRequests(result.data.requests ?? []);
        setBuyerRequestsState('idle');
      } else {
        setBuyerRequestsState('error');
        setBuyerRequestsError(result.error?.message ?? 'Vos demandes ne peuvent pas être chargées pour le moment.');
      }
    } catch (caught) {
      setBuyerRequestsState('error');
      setBuyerRequestsError(caught instanceof Error ? caught.message : 'Vos demandes ne peuvent pas être chargées pour le moment.');
    }
  }, [requireAuth]);

  const openWallet = useCallback(async () => {
    const token = await requireAuth();
    if (!token) return;
    setSheet('wallet'); setWalletState('loading'); setWalletError(''); setRechargeState('idle'); setRechargeResult(null);
    try {
      const result = await getWalletOverview({ token });
      if (result.ok && result.data) {
        setWallet(result.data);
        setWalletState('idle');
      } else {
        setWalletState('error');
        setWalletError(result.error?.message ?? 'Le Wallet ne peut pas être chargé pour le moment.');
      }
    } catch (caught) {
      setWalletState('error');
      setWalletError(caught instanceof Error ? caught.message : 'Le Wallet ne peut pas être chargé pour le moment.');
    }
  }, [requireAuth]);

  const openSaved = useCallback(async () => {
    const token = await requireAuth();
    if (!token) return;
    setSheet('saved'); setSavedState('loading'); setSavedError('');
    try {
      const result = await listSavedSearches({ token });
      if (result.ok && result.data) {
        setSavedSearches(result.data.searches ?? []);
        setSavedState('idle');
      } else {
        setSavedState('error');
        setSavedError(result.error?.message ?? 'Vos recherches ne peuvent pas être chargées pour le moment.');
      }
    } catch (caught) {
      setSavedState('error');
      setSavedError(caught instanceof Error ? caught.message : 'Vos recherches ne peuvent pas être chargées pour le moment.');
    }
  }, [requireAuth]);

  const saveCurrentSearch = useCallback(async () => {
    const q = query.trim() || (results.length ? 'résultats courants' : '');
    if (!q) { setError('Lancez d’abord une recherche à enregistrer.'); return; }
    const token = await requireAuth();
    if (!token) return;
    const constraints: Record<string, unknown> = {};
    if (bounds) constraints.rayonKm = Math.round((bounds[3] - bounds[1]) / 2);
    try {
      const result = await createSavedSearch({ token, query: q, constraints });
      if (result.ok) { setSavedState('idle'); void openSaved(); }
      else setSavedError(result.error?.message ?? 'Cette recherche n’a pas pu être enregistrée.');
    } catch (caught) {
      setSavedError(caught instanceof Error ? caught.message : 'Cette recherche n’a pas pu être enregistrée.');
    }
  }, [query, results.length, bounds, requireAuth, openSaved]);

  const removeSavedSearch = useCallback(async (search: SavedSearch) => {
    const token = await requireAuth();
    if (!token) return;
    setSavedDeletingId(search.id);
    setSavedError('');
    try {
      const result = await deleteSavedSearch({ token, searchId: search.id });
      if (result.ok) {
        setSavedSearches((current) => current.filter((item) => item.id !== search.id));
        setSavedDeletingId(null);
      } else {
        setSavedError(result.error?.message ?? 'Cette recherche n’a pas pu être supprimée.');
        setSavedDeletingId(null);
      }
    } catch (caught) {
      setSavedError(caught instanceof Error ? caught.message : 'Cette recherche n’a pas pu être supprimée.');
      setSavedDeletingId(null);
    }
  }, [requireAuth]);

  const startRecharge = useCallback(async () => {
    const amountFrancs = Number.parseInt(rechargeAmount.trim(), 10);
    if (!Number.isInteger(amountFrancs) || amountFrancs < 1) {
      setRechargeState('error');
      setRechargeError('Saisissez un montant entier d’au moins 1 FCFA.');
      return;
    }
    const amountMinor = amountFrancs * 100;
    const token = await requireAuth();
    if (!token) return;
    setRechargeState('loading'); setRechargeError(''); setRechargeResult(null);
    try {
      const result = await createWalletRecharge({
        token, amountMinor, currency: 'XOF',
        callbackUrl: `${window.location.origin}/?wallet=recharge`,
        customer: { email: sessionUser?.email ?? null, firstName: sessionUser?.name ?? null },
        idempotencyKey: `wallet-recharge:${crypto.randomUUID()}`,
      });
      if (result.ok && result.data) { setRechargeResult(result.data); setRechargeState('success'); }
      else { setRechargeState('error'); setRechargeError(result.error?.message ?? 'La recharge Wallet n’a pas pu être préparée.'); }
    } catch (caught) {
      setRechargeState('error');
      setRechargeError(caught instanceof Error ? caught.message : 'La recharge Wallet n’a pas pu être préparée.');
    }
  }, [requireAuth, rechargeAmount, sessionUser]);

  const startClaim = useCallback(async (facility: PublicFacility) => {
    const token = await requireAuth();
    if (!token) return;
    setClaimState('loading'); setClaimError(''); setClaimResult(null); setClaimEvidence([]); setClaimUploadState('idle'); setClaimSubmitState('idle'); setClaimActionState('idle');
    try {
      const [draft, storage] = await Promise.all([
        createFacilityClaimDraft({ facilityId: facility.id, token }),
        getClaimStorageStatus({ facilityId: facility.id, token }).catch(() => null),
      ]);
      if (!draft.ok || !draft.data) { setClaimState('error'); setClaimError(draft.error?.message ?? 'Cette facilité ne peut pas commencer une revendication.'); return; }
      setClaimResult(draft.data);
      setClaimStorage(storage?.ok === true ? Boolean(storage.data?.available) : null);
      setClaimState('success');
      setSheet('claim');
    } catch (caught) {
      setClaimState('error');
      setClaimError(caught instanceof Error ? caught.message : 'Cette facilité ne peut pas commencer une revendication.');
    }
  }, [requireAuth]);

  const uploadClaimEvidence = useCallback(async (kind: EvidenceKind, file: File) => {
    if (!claimResult || claimResult.state === 'submitted') return;
    setClaimUploadState('uploading'); setClaimUploadProgress(0); setClaimUploadError('');
    try {
      const token = await requireAuth();
      if (!token) return;
      const evidence = await uploadFacilityEvidence({ requestId: claimResult.requestId, evidenceKind: kind, file, token, onProgress: setClaimUploadProgress });
      setClaimEvidence((current) => [...current, evidence]);
      setClaimUploadState('idle');
    } catch (caught) {
      setClaimUploadState('error');
      setClaimUploadError(caught instanceof Error ? caught.message : 'L’upload n’a pas pu être préparé.');
    }
  }, [claimResult, requireAuth]);

  const submitClaimEvidence = useCallback(async () => {
    if (!claimResult || claimEvidence.length === 0 || claimResult.state === 'submitted') return;
    const token = await requireAuth();
    if (!token) return;
    setClaimSubmitState('loading'); setClaimSubmitError('');
    try {
      const result = await submitFacilityClaim({ requestId: claimResult.requestId, version: claimResult.version, evidence: claimEvidence, token });
      if (result.ok && result.data) { setClaimResult(result.data); setClaimSubmitState('success'); }
      else { setClaimSubmitState('error'); setClaimSubmitError(result.error?.message ?? 'La soumission n’a pas pu être enregistrée.'); }
    } catch (caught) {
      setClaimSubmitState('error');
      setClaimSubmitError(caught instanceof Error ? caught.message : 'La soumission n’a pas pu être enregistrée.');
    }
  }, [claimResult, claimEvidence, requireAuth]);

  const cancelClaimDraft = useCallback(async () => {
    if (!claimResult) return;
    const token = await requireAuth();
    if (!token) return;
    setClaimActionState('loading'); setClaimActionError('');
    try {
      const result = await cancelFacilityClaim({ requestId: claimResult.requestId, version: claimResult.version, token });
      if (result.ok) {
        setSelectedFacility((current) => current ? { ...current, trust: 'unclaimed' } : current);
        setClaimResult(null); setClaimEvidence([]); setClaimState('idle'); setClaimStorage(null);
        setClaimActionState('idle'); setClaimUploadState('idle'); setClaimSubmitState('idle');
        setSheet('facility');
      } else {
        setClaimActionState('error');
        setClaimActionError(result.error?.message ?? 'Ce brouillon ne peut pas être annulé depuis cette session.');
      }
    } catch (caught) {
      setClaimActionState('error');
      setClaimActionError(caught instanceof Error ? caught.message : 'Ce brouillon ne peut pas être annulé depuis cette session.');
    }
  }, [claimResult, requireAuth]);

  const rolesRef = useRef<HTMLDivElement | null>(null);
  const rolesIndRef = useRef<HTMLSpanElement | null>(null);

  const eligibleRoles = useMemo<Role[]>(() => {
    const base: Role[] = ['buyer'];
    if (sessionUser) base.push('seller');
    if (adminTools) base.push('admin');
    if (adminTools) base.push('operator');
    return base;
  }, [sessionUser, adminTools]);

  // Espace de rôle — la maquette garde un tableau par rôle pour le rolepill
  // glissant (.roleswitch avec .ind indicateur inset), pas la liste « on/off » seule.
  // Source de vérité = eligibleRoles (rôles serveur réels, ex. adminTools); l'ordre
  // suit la maquette: buyer → seller → admin → operator. Le rôle courant est toujours inclus.
  const switchRoles = useMemo<Role[]>(() => {
    const ordered: Role[] = ['buyer', 'seller', 'admin', 'operator'];
    const roles = ordered.filter((r) => eligibleRoles.includes(r));
    if (!roles.includes(role)) return [role, ...roles.filter((r) => r !== role)];
    return roles;
  }, [role, eligibleRoles]);

  // L'indicateur glissant (.ind) suit le rôle actif — la maquette le mesure
  // après render (`positionIndicator(0)`), à chaque bascule.
  useEffect(() => {
    const wrap = rolesRef.current;
    const ind = rolesIndRef.current;
    if (!wrap || !ind) return;
    const on = wrap.querySelector('button.on');
    if (!on) { ind.style.opacity = '0'; return; }
    const wrapRect = wrap.getBoundingClientRect();
    const onRect = on.getBoundingClientRect();
    ind.style.opacity = '1';
    ind.style.width = `${onRect.width}px`;
    ind.style.transform = `translateX(${onRect.left - wrapRect.left}px)`;
  }, [role, switchRoles]);

  const dockGo = useCallback((target: Sheet, homeLike: boolean) => {
    if (target === 'none') { setSheet('none'); return; }
    if (target === 'search') { setSheet(sheet === 'search' ? 'none' : 'search'); return; }
    if (target === 'results') { setRevealKey(`v13-${Date.now()}`); return; }
    if (target === 'qr' && sheet === 'menu' && !desktop) { setSheet('qr'); return; }
    if (!homeLike) setSelectedId(null);
    setSheet(target);
  }, [sheet]);

  type DockItem = { icon: string; label: string; target: Sheet | 'back' | 'cancel'; center: boolean; active: boolean };

  // Dock contextuel — miroir réact de la fonction `dockFor()` de la maquette V1.3:
  // jamais d'icônes fixes; 5 cas (transaction, destination, menu, équipe, seller, défaut.
  const dockItems = useMemo<DockItem[]>(() => {
    const team = role === 'admin' || role === 'operator';
    const currentSheet: Sheet = sheet;
    const homeLike = sheet === 'none' || sheet === 'search' || sheet === 'qr' || sheet === 'menu' || (desktop && sheet === 'results');
    if (sheet === 'flow' || sheet === 'claim') return [
      { icon: 'cancel', label: 'Annuler', target: 'none', center: false, active: false },
      { icon: 'qr', label: 'QR', target: 'qr', center: true, active: false },
      { icon: 'menu', label: 'Menu', target: 'menu', center: false, active: false },
    ];
    const destination = sheet !== 'none' && sheet !== 'search' && sheet !== 'qr' && sheet !== 'menu' && sheet !== 'account' && sheet !== 'wallet' && sheet !== 'plans' && sheet !== 'saved' && sheet !== 'home' && sheet !== 'auth' && sheet !== 'onboard' && !homeLike;
    if (destination) return [
      { icon: 'back', label: 'Retour', target: 'back', center: false, active: false },
      { icon: team ? 'check' : (role === 'seller' ? 'box' : 'search'), label: team ? 'À valider' : (role === 'seller' ? 'Stock' : 'Recherche'), target: team ? 'admin' : (role === 'seller' ? 'seller' : 'search'), center: true, active: role !== 'buyer' },
      { icon: 'menu', label: 'Menu', target: 'menu', center: false, active: false },
    ];
    if (sheet === 'menu') return [
      { icon: 'search', label: 'Recherche', target: 'search', center: false, active: false },
      { icon: 'home', label: 'Carte', target: 'none', center: true, active: false },
    ];
    if (team) return [
      { icon: 'search', label: 'Recherche', target: 'search', center: false, active: false },
      { icon: 'check', label: 'À valider', target: 'admin', center: true, active: currentSheet === 'admin' },
      { icon: 'menu', label: 'Menu', target: 'menu', center: false, active: false },
    ];
    if (role === 'seller') return [
      { icon: 'search', label: 'Recherche', target: 'search', center: false, active: sheet === 'search' },
      { icon: 'box', label: 'Stock', target: 'seller', center: true, active: currentSheet === 'seller' },
      { icon: 'menu', label: 'Menu', target: 'menu', center: false, active: false },
    ];
    return [
      { icon: 'search', label: 'Recherche', target: 'search', center: false, active: sheet === 'search' },
      { icon: 'qr', label: 'QR', target: 'qr', center: true, active: sheet === 'qr' },
      { icon: 'menu', label: 'Menu', target: 'menu', center: false, active: false },
    ];
  }, [role, sheet, desktop]);

  const dockIcon = (icon: string, size = 18): ReactNode => {
    switch (icon) {
      case 'back': return <ArrowLeft size={size} />;
      case 'qr': return <QrCode size={size} />;
      case 'menu': return <Menu size={size} />;
      case 'home': return <Home size={size} />;
      case 'check': return <CheckCircle2 size={size} />;
      case 'box': return <PackageSearch size={size} />;
      default: return <Search size={size} />;
    }
  };

  const handleDock = useCallback((target: Sheet | 'back' | 'cancel') => {
    if (target === 'cancel') {
      if (sheet === 'flow' || sheet === 'claim') setSheet(sheet === 'flow' ? 'facility' : 'facility');
      return;
    }
    if (target === 'back') {
      if (sheet === 'bulk' || sheet === 'compare') { setSheet('results'); return; }
      if (sheet === 'facility') { setSheet(results.length ? 'results' : 'none'); return; }
      if (sheet === 'flow' || sheet === 'claim') { setSheet('facility'); return; }
      if (sheet === 'account' || sheet === 'wallet' || sheet === 'plans' || sheet === 'saved' || sheet === 'auth' || sheet === 'onboard') { setSheet('menu'); return; }
      if (sheet === 'products' || sheet === 'stockevent' || sheet === 'offers' || sheet === 'company' || sheet === 'seller-reply') { setSheet('seller'); return; }
      setSheet('none');
      return;
    }
    if (target === 'none') { setSelectedId(null); setSheet('none'); return; }
    dockGo(target, sheet === 'none' || sheet === 'search' || sheet === 'qr' || sheet === 'menu' || (desktop && sheet === 'results'));
  }, [sheet, dockGo, results]);

  const handleDockMorph = useCallback((btn: HTMLButtonElement | null) => {
    if (!btn) return;
    btn.style.transition = 'none';
    btn.style.transform = 'scale(.8)';
    requestAnimationFrame(() => { btn.style.transition = ''; btn.style.transform = ''; });
  }, []);

  const handleSearchInput = (value: string) => {
    setQuery(value);
    setConstraintsOpen(value.trim().length > 0);
    if (!value.trim()) setActiveConstraints(new Set());
  };

  const toggleConstraint = useCallback((label: string) => {
    setActiveConstraints((current) => {
      const next = new Set(current);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }, []);

  const handleSubmitSearch = (event: FormEvent) => {
    event.preventDefault();
    void runSearch(query);
  };

  // Pins contextuels: les pins hors-contexte s'estompent quand un sheet
  // parcours (résultats, sélection, itinéraire) est ouvert — la maquette dim mode.
  const dimMode = useMemo(() => {
    if (sheet === 'results') return { mode: { kind: 'results' as const, ids: results.map((f) => f.id) }, active: true };
    if (sheet === 'facility' && selectedId) return { mode: { kind: 'selection' as const, selectedId }, active: true };
    return null;
  }, [sheet, results, selectedId]);

  return (
    <div className="omni-v13-stage" data-role={role} data-map-state={mapState} data-sheet={sheet} ref={stageRef}>
      <section className="mapbase" aria-label="Carte Omni">
        <Suspense fallback={<div role="status">Chargement de la carte…</div>}>
          <TrunkMap
            facilities={facilities}
            selectedId={selectedId}
            onSelect={handlePinSelect}
            onBoundsChange={setBounds}
            onRevealStateChange={handleRevealStateChange}
            revealKey={revealKey}
            focusTarget={focusTarget}
            followTarget={followTarget}
            ownedFacilityIds={ownedFacilityIds.length ? ownedFacilityIds : null}
            dimMode={dimMode}
          />
        </Suspense>
      </section>
      {mapState === 'error' && <div className="map-legend" role="alert"><span>{error}</span></div>}
      {mapState === 'empty' && <div className="map-legend" role="status"><span>Aucun lieu dans cette vue.</span></div>}
      <div className="rolepill" role="tablist" aria-label="Changer de rôle">
        <div className="roleswitch" ref={rolesRef}>
          <span className="ind" ref={rolesIndRef} />
          {(switchRoles.length ? switchRoles : ['buyer'] as Role[]).map((r: Role) => (
            <button key={r} type="button" role="tab" aria-selected={role === r} className={role === r ? 'on' : ''} onClick={() => { setRole(r); setSheet(r === 'buyer' ? 'none' : 'menu'); if (r === 'seller' && sessionUser) void loadSellerWorkspace(); }}>{r === 'buyer' ? 'Buyer' : r === 'seller' ? 'Seller' : r === 'admin' ? 'Admin' : 'Opé.'}</button>
          ))}
        </div>
      </div>
      <div className="navpill" key={role} role="navigation" aria-label="Actions principales">
        {dockItems.map((item) => (
          <button
            key={item.icon}
            type="button"
            ref={(btn: HTMLButtonElement | null) => { handleDockMorph(btn); }}
            className={`
              ${item.center ? 'center' : ''}${item.active ? ' active' : ''}
            `}
            onClick={() => handleDock(item.target as Sheet | 'back' | 'cancel')}
          >
            <span className="icon-in">{dockIcon(item.icon)}</span>
            <span className="sr-only">{item.label}</span>
          </button>
        ))}
      </div>
      <div className="dockmask" aria-hidden="true" />
      {(sheet === 'search' || (desktop && (isJourney || sheet === 'qr'))) && (

        <form className="sheet h-low" data-sheet="search" onSubmit={handleSubmitSearch}>
          <div className="handle" />
          <div className="sheet-head">
            <div><div className="eyebrow">{SEARCH_LABEL[role][0]}</div><h1>{SEARCH_LABEL[role][1]}</h1></div>
          </div>
          <div className="searchdock">
            {activeConstraints.size > 0 && (
              <p className="tiny muted" role="status" style={{ marginBottom: 4 }}>{activeConstraints.size} contrainte{activeConstraints.size > 1 ? 's' : ''} active{activeConstraints.size > 1 ? 's' : ''}</p>
            )}
            <div className={`fld${resultsLoading ? ' busy' : ''}`}>
              <svg width="16" height="16" aria-hidden="true"><use href="#iSearch" /></svg>
              <input value={query} onChange={(event) => handleSearchInput(event.target.value)} placeholder={SEARCH_PLACEHOLDER[role]} aria-label="Recherche" />
              <button className="btn ghost sm" style={{ width: 'auto', minHeight: 28, padding: '0 10px' }} type="submit"><ArrowRight size={15} /></button>
            </div>
          {constraintsOpen && (
            <div className="constraint-zone">
              <div className="label">{role === 'buyer' ? 'Contraintes (requête, pas engagement vendeur)' : 'Filtres actifs'}</div>
              <div className="chips">
                {(SEARCH_CONSTRAINTS[role] ?? SEARCH_CONSTRAINTS.buyer).map((c: string) => (
                  <span key={c} className={`chip${activeConstraints.has(c) ? ' active' : ''}`} onClick={() => toggleConstraint(c)} role="button" tabIndex={0}><span className="dot" />{c}</span>
                ))}
              </div>
            </div>
          )}
          <div className="sim-chips" style={{ display: 'none', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
            <span className={`chip${simMode === 'normal' ? ' active' : ''}`} onClick={() => setSimMode('normal')} role="button" tabIndex={0}><span className="dot" />normal</span>
            <span className={`chip${simMode === 'vide' ? ' active' : ''}`} onClick={() => setSimMode('vide')} role="button" tabIndex={0}><span className="dot" />vide</span>
            <span className={`chip${simMode === 'lent' ? ' active' : ''}`} onClick={() => setSimMode('lent')} role="button" tabIndex={0}><span className="dot" />lent</span>
            <span className={`chip${simMode === 'erreur' ? ' active' : ''}`} onClick={() => setSimMode('erreur')} role="button" tabIndex={0}><span className="dot" />erreur</span>
          </div>
          </div>
        </form>
      )}
      {(sheet === 'results') && (
        <section className="sheet h-auto" data-sheet="results" role="region" aria-label="Résultats">
          <div className="handle" />
          <div className="sheet-head">
            <div><div className="eyebrow">Résultats · correspondant à vos contraintes</div><h1>Facilités proches</h1></div>
            <span className="status gray">{results.length}</span>
          </div>
          {resultsLoading && <p className="sub" role="status">Recherche en cours dans votre zone…</p>}
          {error && !resultsLoading && <p className="sub" role="alert">{error}</p>}
          {!resultsLoading && !error && results.length === 0 && (
            <div className="cardbox">
              <p className="sub">Aucune fourniture ne correspond à ces contraintes ici. Essayez d'élargir la distance ou le budget.</p>
              <button className="btn ghost sm" style={{ marginTop: 9 }} onClick={() => setSheet('search')}>Élargir les contraintes</button>
            </div>
          )}
          <div className="hgrid" id="hgrid" onScroll={handleResultsScroll}>
            {results.map((facility) => (
              <button key={facility.id} data-fid={facility.id} type="button" className={`hcard${resultsFollowId === facility.id ? ' focused' : ''}`} onClick={() => void handlePinSelect(facility)}>
                <div className={`thumb${facility.trust === 'unconfirmed' ? ' unclaimed' : ''}`}>
                  {facility.trust === 'confirmed' && <span className="vmark">✓</span>}
                </div>
                <div className="body">
                  <b>{facility.name}</b>
                  <small>{facility.category} · {facility.productCount} produits</small>
                </div>
              </button>
            ))}
          </div>
          <div className="btnrow" style={{ marginTop: 10 }}>
            <button className="btn ghost sm" type="button" disabled={results.length < 2} title={results.length < 2 ? 'Sélectionnez au moins 2 résultats' : undefined} onClick={() => void openCompare()}>Comparer</button>
            <button className="btn sm" type="button" disabled={results.length === 0} title={results.length === 0 ? 'Aucun résultat à comparer' : undefined} onClick={() => void openBulk()}>Dispo groupée</button>
          </div>
        </section>
      )}
      {sheet === 'bulk' && (
        <section className="sheet h-mid" data-sheet="bulk" role="region" aria-label="Disponibilité groupée">
          <div className="handle" />
          <div className="sheet-head">
            <div><div className="eyebrow">Disponibilité groupée</div><h1>Interroger plusieurs facilités</h1></div>
            <button type="button" className="btn ghost sm" style={{ width: 'auto', minHeight: 28 }} onClick={() => setSheet('results')}><X size={15} /> Fermer</button>
          </div>
          <p className="tiny muted">Interroger plusieurs facilités en une fois — chaque facilité reçoit sa propre demande reel.faible 1 requête groupée restante ce mois (plan gratuit).</p>
          {bulkLoading && <p className="sub" role="status">Chargement des facilités…</p>}
          {bulkErrors && !bulkLoading && !bulkSending && !bulkResults && <p className="sub" role="alert">{bulkErrors}</p>}
          {!bulkLoading && !bulkResults && (
            <div className="plist" id="bulkList">
              {(bulkFacilities ?? []).map((facility) => {
                const detail = bulkDetails[facility.id];
                const products = detail?.products ?? [];
                const selected = bulkSelection[facility.id];
                return (
                  <div key={facility.id} className="pitem" style={{ alignItems: 'center', cursor: 'default' }}>
                    <span className="chk" aria-hidden="true">{selected ? '✓' : ''}</span>
                    <span style={{ flex: 1 }}>
                      <b>{facility.name}</b><br /><span className="tiny muted">{facility.category} · {facility.plan} · {facility.productCount} produits</span>
                      {products.length > 0 ? (
                        <select className="field fs-9" style={{ marginTop: 4, height: 26 }} value={selected ?? ''} onChange={(event) => setBulkSelection((current) => ({ ...current, [facility.id]: event.target.value }))}>
                          {products.filter((p) => p.stockLoueOmni > 0).map((product) => (<option key={product.id} value={product.id}>{product.name} · {moneyOrQty(product.stockLoueOmni)} dispo</option>))}
                          {products.length === 0 && <option value="">Aucun produit</option>}
                        </select>
                      ) : (
                        <span className="status gray" style={{ marginTop: 4 }}>Aucun produit référencé</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          {!bulkLoading && !bulkResults && (
            <button className="btn ok" type="button" disabled={bulkSending || Object.keys(bulkSelection).length === 0} onClick={() => void sendBulk()} style={{ marginTop: 10 }}>
              {bulkSending ? 'Envoi en cours…' : 'Envoyer aux facilités sélectionnées'}
            </button>
          )}
          {!bulkLoading && bulkResults && (
            <>
              {bulkResults.map((row) => (
                <div key={row.facilityId} className="cardbox" style={{ marginTop: 8 }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <div><b>{row.facilityName}</b><br /><span className="tiny muted">{row.productName}</span></div>
                    <span className={`status ${row.status === 'available' ? 'ok' : row.status === 'partial' ? 'ink' : row.status === 'unavailable' || row.status === 'expired' ? 'dash' : 'gray'}`}>{bulkLabel(row.status)}</span>
                  </div>
                  {row.quantityAvailable !== null && <p className="tiny muted" style={{ marginTop: 4 }}>{row.quantityAvailable} dispo</p>}
                  {row.observedAt && <p className="tiny muted" style={{ marginTop: 2 }}>Réponse : {new Date(row.observedAt).toLocaleTimeString('fr-FR')}</p>}
                </div>
              ))}
              <div className="freshbar" style={{ marginTop: 8 }}><span className="fdot" />Fraîcheur : reflète l'allocation Omni, pas l'inventaire total du vendeur</div>
              <div className="btnrow">
                <button className="btn ghost sm" type="button" onClick={() => { setBulkResults(null);}}>Voir d'autres facilités</button>
                <button className="btn ok sm" type="button" disabled={bulkSending || bulkResults.every((r) => r.status !== 'available' && r.status !== 'partial')} onClick={() => { const pick = bulkResults.find((r) => r.status === 'available' || r.status === 'partial'); if (pick) { setFlowFacility({ id: pick.facilityId, name: pick.facilityName }); setFlowProduct({ id: '', name: pick.productName }); setSheet('flow'); } }}>Je veux acheter</button>
              </div>
            </>
          )}
        </section>
      )}
      {sheet === 'compare' && (
        <section className="sheet h-mid" data-sheet="compare" role="region" aria-label="Comparer">
          <div className="handle" />
          <div className="sheet-head">
            <div><div className="eyebrow">Comparer</div><h1>Facilités candidates</h1></div>
            <button type="button" className="btn ghost sm" style={{ width: 'auto', minHeight: 28 }} onClick={() => setSheet('results')}><X size={15} /> Fermer</button>
          </div>
          <div className="sortbar">
            {([['match', 'Meilleur match'], ['distance', 'Plus proche'], ['price', 'Prix le plus bas'], ['remise', 'Remise Omni']] as const).map(([key, label]) => (
              <button key={key} type="button" className={`sortchip${compareSort === key ? ' active' : ''}`} onClick={() => setCompareSort(key)}>{label}</button>
            ))}
          </div>
          <div className="cardbox" style={{ marginTop: 8 }}>
            {[...compareResults].sort((a2,b2) => compareFacilities(a2,b2,compareSort, bulkDetails)).map((facility) => {
              const detail = bulkDetails[facility.id];
              const product = detail?.products?.find((p) => p.stockLoueOmni > 0) ?? detail?.products?.[0];
              return (
                <button key={facility.id} type="button" className="cardbox" style={{ textAlign: 'left', width: '100%' }} onClick={() => { if (facility.trust !== 'unclaimed' && product) { setFlowFacility({ id: facility.id,name: facility.name }); setFlowProduct({ id: product.id,name: product.name }); setSheet('flow'); } else { setSheet('facility'); void handlePinSelect(facility); } }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <div><b>{facility.name}</b><br /><span className="tiny muted">{facility.category} · {facility.plan}</span></div>
                    {detail?.products?.length ? <span className="status ok">dès {Math.min(...detail.products.map((p) => p.prixReduit)) / 100} F</span> : <span className="status gray">Non transactable</span>}
                  </div>
                  {product && <p className="tiny muted" style={{ marginTop: 4 }}>{product.name} · {moneyOrQty(product.stockLoueOmni)}</p>}
                </button>
              );
            })}
          </div>
          <button className="btn ok" type="button" style={{ marginTop: 10 }} onClick={() => { const pick = [...compareResults].find((f) => f.trust && f.trust !== 'unclaimed'); if (pick) { const product = bulkDetails[pick.id]?.products?.find((p) => p.stockLoueOmni > 0) ?? bulkDetails[pick.id]?.products?.[0]; if (product) { setFlowFacility({ id: pick.id,name: pick.name }); setFlowProduct({ id: product.id,name: product.name }); setSheet('flow'); } } }}>Choisir & acheter</button>
        </section>
      )}
      {sheet === 'qr' && (
        <section className="sheet h-mid" data-sheet="qr" role="dialog" aria-modal="true" aria-label="Scanner un QR">
          <div className="handle" />
          <div className="sheet-head">
            <div><div className="eyebrow">Scanner un QR</div><h1>Facilité publique</h1></div>
            <button type="button" className="btn ghost sm" style={{ width: 'auto', minHeight: 28 }} onClick={() => setSheet('menu')} aria-label="Fermer"><X size={15} /></button>
          </div>
          {qrError && <p className="sub" role="alert" style={{ marginTop: 8 }}>{qrError}</p>}
          <PublicQrScannerSheet key={qrScanKey} onDetected={(facilityId: string) => void handleQrDetected(facilityId)} onClose={() => setSheet('menu')} />
        </section>
      )}
      {sheet === 'facility' && (
        <section className="sheet h-full" data-sheet="facility" role="region" aria-label="Facilité">
          <div className="handle" />
          <div className="sheet-head">
            <div><div className="eyebrow">Facilité</div><h1>{selectedFacility?.name ?? '—'}</h1></div>
            <button type="button" className="btn ghost sm" style={{ width: 'auto', minHeight: 28 }} onClick={() => setSheet(sheet === 'facility' ? (role === 'buyer' ? 'results' : 'menu') : 'none')}><X size={15} /> Fermer</button>
          </div>
          {facilityLoading && <p className="sub">Chargement…</p>}
          {!facilityLoading && selectedFacility && (
            <div>
              <div className={`fhero${selectedFacility.trust === 'unclaimed' ? ' unclaimed' : ''}`}><span className="tag">{selectedFacility.category}</span></div>
              <div className="stategroup" style={{ marginTop: 7 }}>
                {(['unclaimed', 'unconfirmed', 'confirmed'] as const).map((state) => {
                  const labels: Record<string, string> = { unclaimed: 'Non revendiquée', unconfirmed: 'À confirmer', confirmed: 'Confirmée' };
                  const isActive = selectedFacility.trust === state || (state === 'unclaimed');
                  return <span key={state} className={`status ${isActive ? 'ok' : 'gray'}`}>{labels[state]}</span>;
                })}
              </div>
              <div className="row tiny muted" style={{ marginTop: 7 }}>
                <span className="status ok">Ouvert</span>
              </div>
              {selectedFacility.trust === 'unclaimed' && (
                <div className="cardbox" style={{ marginTop: 8 }}>
                  <p className="sub">Cette facilité est découvrable, elle contribue à la représentation de la fourniture, mais n'a pas de gestionnaire — elle ne peut pas encore recevoir de transaction Omni.</p>
                  <button className="btn" type="button" disabled={claimState === 'loading'} style={{ marginTop: 10 }} onClick={() => void startClaim(selectedFacility!)}>{claimState === 'loading' ? 'Ouverture du brouillon…' : 'Revendiquer cette facilité'}</button>
                  <button className="btn ghost" style={{ marginTop: 7 }} onClick={() => alert('Créer une nouvelle facilité (si absente)')}>La facilité n'est pas sur la carte? Créer</button>
                </div>
              )}
              {claimState === 'success' && claimResult && (
                <div className="cardbox" role="status" style={{ marginTop: 8 }}>
                  <p className="sub"><CheckCircle2 size={15} /> Brouillon ouvert. La preuve et la revue Omni restent nécessaires.</p>
                  <button className="btn" type="button" style={{ marginTop: 8 }} onClick={() => setSheet('claim')}>Ouvrir le parcours de preuve</button>
                </div>
              )}
              {selectedFacility.trust !== 'unclaimed' && (
                <div className="cardbox" style={{ marginTop: 8 }}>
                  <div className="kv"><span>Adresse</span><b>{selectedFacility.address ?? 'Non renseignée'}</b></div>
                </div>
              )}
              {claimState === 'error' && <p className="sub" role="alert">{claimError}</p>}
              {selectedFacility.products.length === 0 && selectedFacility.trust !== 'unclaimed' && <p className="tiny muted" style={{ marginTop: 8 }}>Cette facilité n’a pas encore de produits référencés.</p>}
              {selectedFacility.trust !== 'unclaimed' && selectedFacility.products.length > 0 && <div className="label" style={{ marginTop: 8 }}>Produits — sélectionnez (panier de demande propre à cette facilité)</div>}
              {sortProductsStockFirst(selectedFacility.products).map((product) => {
                const on = facProductSel.includes(product.id);
                return (
                  <div className="pitem" key={product.id} role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => setFacProductSel((current) => on ? current.filter((id) => id !== product.id) : [...current, product.id])}>
                    <span className={`chk${on ? ' on' : ''}`} aria-hidden="true">{on ? '✓' : ''}</span>
                    <span className="pthumb" />
                    <span><b>{product.name}</b><small>{product.stockLoueOmni > 0 ? 'En stock' : 'À valider'}</small></span>
                    <span className="pr">{(product.prixReduit / 100).toFixed(2)} {product.currency}</span>
                  </div>
                );
              })}
              {selectedFacility.products.length > 0 && selectedFacility.trust !== 'unclaimed' && (
                <div className="selbar" style={{ marginTop: 10 }}>
                  <button className="btn ok" type="button" disabled={facProductSel.length === 0} onClick={() => {
                    const picked = selectedFacility.products.filter((p) => facProductSel.includes(p.id));
                    if (picked.length === 0) return;
                    if (picked.length === 1) {
                      setFlowFacility({ id: selectedFacility.id, name: selectedFacility.name }); setFlowProduct({ id: picked[0].id, name: picked[0].name }); setSheet('flow');
                    } else {
                      setBulkFacilities([{ ...selectedFacility, productCount: picked.length }]);
                      setBulkSelection({ [selectedFacility.id]: picked[0].id });
                      setSheet('bulk');
                    }
                  }}>Demander la disponibilité (<span id="selCount">{facProductSel.length}</span>)</button>
                  <p className="tiny muted" style={{ textAlign: 'center', marginTop: 8 }}>Contact vendeur & chat débloqués après intention d’achat.</p>
                </div>
              )}
            </div>
          )}
        </section>
      )}
      {sheet === 'seller' && (
        <SellerV13 onClose={() => setSheet('menu')} onProducts={() => setSheet('products')} onOffers={() => setSheet('offers')} onCompany={() => setSheet('company')} onReply={() => setSheet('seller-reply')} onScan={() => setSheet('seller-qr')} catalogue={sellerCatalogue} queue={sellerQueue} publicFacilities={facilities} ownedIds={ownedFacilityIds} onRefresh={loadSellerWorkspace} />
      )}
      {sheet === 'seller-reply' && (
        <SellerReplyV13 onClose={() => setSheet('seller')} />
      )}
      {sheet === 'seller-qr' && (
        <SellerQrScannerSheet onClose={() => setSheet('seller')} onVerified={() => undefined} />
      )}
      {sheet === 'products' && (
        <ProductCatalogueV13 onClose={() => setSheet('seller')} onStockEvent={(id) => { setStockEventProductId(id); setSheet('stockevent'); }} />
      )}
      {sheet === 'stockevent' && stockEventProductId && (
        <StockEventLedgerV13 productId={stockEventProductId} onClose={() => setSheet('products')} />
      )}
      {sheet === 'offers' && (
        <OffersV13 onClose={() => setSheet('seller')} />
      )}
      {sheet === 'company' && (
        <CompanyV13 onClose={() => setSheet('seller')} />
      )}
      {sheet === 'onboard' && (
        <OnboardV13 pendingSearch={pendingSearch} onClose={() => { setPendingAction(null); setSheet('menu'); }} onComplete={() => {
          const act = pendingAction;
          const resume = pendingActionResume(act);
          setPendingAction(null);
          if (resume.sheet === 'flow') {
            setFlowFacility({ id: resume.facilityId,name: resume.facilityName }); setFlowProduct({ id: resume.productId,name: resume.productName }); setSheet('flow');
          } else if (resume.sheet === 'facility') {
            setSelectedId(resume.facilityId)
            setSheet('facility'); void handlePinSelect({ id: resume.facilityId,name: 'Ma facilité',category: 'commerce',address: null,latitude: 0,longitude: 0,trust: 'unclaimed',plan: 'free',productCount: 0 } as PublicFacility);
          } else {
            setSheet(resume.sheet);
          }
        }} />
      )}
      {sheet === 'flow' && flowFacility && flowProduct && (
        <BuyerFlowV13 facility={flowFacility} product={flowProduct} onClose={() => setSheet('facility')} onGate={gateRequest} />
      )}
      {sheet === 'admin' && adminTools && (
        <AdminV13 onClose={() => setSheet('menu')} onFocusFacility={(latitude: number, longitude: number, key: string) => { setFocusTarget({ latitude, longitude, key }); setSheet('none'); }} />
      )}
      {sheet === 'menu' && (
        <section className="sheet h-mid" data-sheet="menu" key={role} role="region" aria-label="Espace">
          <div className="handle" />
          <div className="sheet-head">
            <div><div className="eyebrow">Espace</div><h1>{role === 'admin' || role === 'operator' ? 'Espace équipe Omni' : 'Espace ' + role}</h1></div>
            <span className="status ink">{role}{role === 'admin' || role === 'operator' ? ' · équipe' : ''}</span>
          </div>
          <div className="menugrid" style={{ display: 'grid', gap: 8, marginTop: 10 }}>
            {!sessionUser && (
              <button className="btn" type="button" onClick={() => setSheet('auth')}><User size={16} /> Créer un compte / se connecter</button>
            )}
            {sessionUser && (
              <>
                {role === 'buyer' && (
                  <>
                    <button className="menuitem" type="button" onClick={() => void openHome()}><span className="mi"><Home size={15} /></span><span><b>Mon espace</b><small>demandes & transactions</small></span></button>
                    <button className="menuitem" type="button" onClick={() => void openSaved()}><span className="mi"><Compass size={15} /></span><span><b>Recherches enregistrées</b><small>vos alertes</small></span></button>
                    <button className="menuitem" type="button" onClick={() => void openWallet()}><span className="mi"><Wallet size={15} /></span><span><b>Wallet</b><small>solde & recharges</small></span></button>
                    <button className="menuitem" type="button" onClick={() => setSheet('plans')}><span className="mi"><Building2 size={15} /></span><span><b>Plans</b><small>niveau de recherche</small></span></button>
                  </>
                )}
                {role === 'seller' && (
                  <>
                    <button className="menuitem" type="button" onClick={() => void openHome()}><span className="mi"><Home size={15} /></span><span><b>Mon espace</b><small>demandes & transactions</small></span></button>
                    <button className="menuitem" type="button" onClick={() => setSheet('seller')}><span className="mi"><PackageSearch size={15} /></span><span><b>Produits & stock</b><small>catalogue vendeur</small></span></button>
                    <button className="menuitem" type="button" onClick={() => setSheet('offers')}><span className="mi"><PackageSearch size={15} /></span><span><b>Offres</b><small>prix & remise Omni</small></span></button>
                    <button className="menuitem" type="button" onClick={() => setSheet('company')}><span className="mi"><Building2 size={15} /></span><span><b>Compagnies</b><small>mes facilités</small></span></button>
                    <button className="menuitem" type="button" onClick={() => void openWallet()}><span className="mi"><Wallet size={15} /></span><span><b>Wallet</b><small>solde, Pro & recharges</small></span></button>
                    <button className="menuitem" type="button" onClick={() => setSheet('plans')}><span className="mi"><Building2 size={15} /></span><span><b>Plans</b><small>Free vs Pro</small></span></button>
                  </>
                )}
                {(role === 'admin' || role === 'operator') && (
                  <>
                    <button className="menuitem" type="button" onClick={() => setSheet('admin')}><span className="mi"><ShieldCheck size={15} /></span><span><b>Console</b><small>revue & audit</small></span></button>
                    <button className="menuitem" type="button" onClick={() => void openWallet()}><span className="mi"><Wallet size={15} /></span><span><b>Wallet</b><small>solde & recharges</small></span></button>
                  </>
                )}
                <button className="menuitem" type="button" onClick={() => setSheet('account')}><span className="mi"><User size={15} /></span><span><b>Compte</b><small>profil & rôles</small></span></button>
                <button className="menuitem" type="button" onClick={async () => { await authClient?.signOut?.().catch(() => undefined); setSessionUser(null); setAdminTools(false); setAccountRoles([]); setRole('buyer'); setSheet('none'); }}><span className="mi"><LogOut size={15} /></span><span><b>Se déconnecter</b></span></button>
              </>
            )}
          </div>
        </section>
      )}
      {sheet === 'account' && sessionUser && (
        <section className="sheet h-mid" data-sheet="account" role="region" aria-label="Compte">
          <div className="handle" />
          <div className="sheet-head">
            <div><div className="eyebrow">Compte</div><h1>Votre profil Omni</h1></div>
            <button type="button" className="btn ghost sm" style={{ width: 'auto', minHeight: 28 }} onClick={() => setSheet('menu')}><X size={15} /></button>
          </div>
          <div className="cardbox">
            <div className="kv"><span>Identité</span><b>{sessionUser.name ?? sessionUser.email}</b></div>
            <div className="kv"><span>Rôles</span><b>{eligibleRoles.join(' · ')}</b></div>
            <div className="kv"><span>Facilité affiliée</span><b>{(accountRoles.some((r) => r.includes('seller')) ? 'Accès vendeur' : 'Aucune')}</b></div>
            <div className="kv"><span>Compte</span><b>{sessionUser.email}</b></div>
          </div>
          <div className="cardbox" style={{ marginTop: 8 }}>
            <div className="kv"><span>Wallet</span><b>{walletState === 'idle' && wallet ? `${((wallet.balanceMinor ?? 0) / 100).toFixed(2)} ${wallet.currency ?? 'XOF'}` : '—'}</b></div>
            <button className="btn ghost sm" style={{ width: 'auto', minHeight: 28, marginTop: 6 }} type="button" onClick={() => setSheet('wallet')}>Recharger le wallet</button>
          </div>
          <div className="cardbox" style={{ marginTop: 8 }}>
            <div className="kv"><span>Plan</span><b>{eligibleRoles.includes('seller') ? 'Vendeur Free' : 'Acheteur Free'}</b></div>
            <button className="btn ghost sm" style={{ width: 'auto', minHeight: 28, marginTop: 6 }} type="button" onClick={() => setSheet('plans')}>Voir les plans</button>
          </div>
          <button className="btn ghost" style={{ marginTop: 10, width: '100%' }} type="button" onClick={() => { void authClient.signOut(); setSessionUser(null); setSheet('search'); }}><LogOut size={15} /> Déconnexion</button>
        </section>
      )}
      {sheet === 'home' && (
        <section className="sheet h-mid" data-sheet="home" role="region" aria-label="Mon espace">
          <div className="handle" />
          <div className="sheet-head">
            <div><div className="eyebrow">Espace Buyer</div><h1>Vos demandes & transactions.</h1></div>
            <button type="button" className="btn ghost sm" style={{ width: 'auto', minHeight: 28 }} onClick={() => setSheet('menu')}><X size={15} /></button>
          </div>
          {buyerRequestsState === 'loading' && <p className="sub" role="status">Chargement de vos demandes…</p>}
          {buyerRequestsState === 'error' && (
            <div role="alert">
              <p className="sub">{buyerRequestsError}</p>
              <button className="btn ghost sm" style={{ width: 'auto', minHeight: 28 }} onClick={() => void openHome()}><RefreshCw size={14} /> Réessayer</button>
            </div>
          )}
          {buyerRequestsState === 'idle' && (
            <div className="stat">
              <div className="tile"><small>Demandes</small><strong>{buyerRequests.length}</strong></div>
              <div className="tile ok"><small>En attente</small><strong>{buyerRequests.filter((r) => r.requestStatus === 'submitted' || r.requestStatus === 'responding').length}</strong></div>
            </div>
          )}
          {buyerRequestsState === 'idle' && buyerRequests.length === 0 && (
            <p className="sub" style={{ marginTop: 8 }}>Aucune demande enregistrée. Lancez une recherche, puis demandez la dispo d’un produit.</p>
          )}
          {buyerRequests.map((request) => (
            <button key={request.id} type="button" className="cardbox" style={{ textAlign: 'left', width: '100%', marginTop: 6 }} onClick={() => { setSelectedId(request.facilityId); setSheet('facility'); void handlePinSelect({ id: request.facilityId, name: request.facilityName, category: request.facilityCategory, address: null, latitude: 0, longitude: 0, trust: 'unclaimed', plan: 'free', productCount: 0 } as PublicFacility); }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div><b>{request.productName}</b><br /><span className="tiny muted">{request.facilityName} · {request.requestedQuantity} unité{request.requestedQuantity === 1 ? '' : 's'}</span></div>
                <span className="status gray">{statusLabel(request.requestStatus)}</span>
              </div>
              <div className="row" style={{ gap: 4, marginTop: 4 }}>
                <span className="chip" style={{ margin: 0 }}>{request.deliveryMode === 'livraison' ? 'Livraison' : 'Retrait'}</span>
                {request.budgetMinor !== null && <span className="chip" style={{ margin: 0 }}>≤ {money(request.budgetMinor, 'XOF')}</span>}
              </div>
              {request.note && <p className="tiny muted" style={{ marginTop: 4 }}>{request.note}</p>}
              <span className="tiny muted">{request.responseCount} réponse{request.responseCount === 1 ? '' : 's'} · {new Date(request.createdAt).toLocaleDateString('fr-FR')}</span>
            </button>
          ))}
          <div className="btnrow" style={{ marginTop: 10 }}>
            <button className="btn ghost" type="button" onClick={() => void openWallet()}><Wallet size={15} /> Wallet</button>
            <button className="btn ghost" type="button" onClick={() => setSheet('plans')}>Plans</button>
          </div>
        </section>
      )}
      {sheet === 'wallet' && (
        <section className="sheet h-mid" data-sheet="wallet" role="region" aria-label="Omni Wallet">
          <div className="handle" />
          <div className="sheet-head">
            <div><div className="eyebrow">Omni Wallet</div><h1>Votre pouvoir de recherche.</h1></div>
            <button type="button" className="btn ghost sm" style={{ width: 'auto', minHeight: 28 }} onClick={() => setSheet('menu')}><X size={15} /></button>
          </div>
          {walletState === 'loading' && <p className="sub" role="status">Vérification du Wallet…</p>}
          {walletState === 'error' && (
            <div role="alert">
              <p className="sub">{walletError}</p>
              <button className="btn ghost sm" style={{ width: 'auto', minHeight: 28 }} onClick={() => void openWallet()}><RefreshCw size={14} /> Réessayer</button>
            </div>
          )}
          {walletState === 'idle' && wallet && (
            <>
              <div className="cardbox" style={{ background: 'var(--ink)', color: '#fff' }}>
                <p className="tiny" style={{ color: '#bbb' }}>Solde disponible</p>
                <div className="row" style={{ marginTop: 8, justifyContent: 'space-between' }}>
                  <strong className="fs-26">{money(wallet.balanceMinor, wallet.currency)}</strong>
                  <span className="status gray">{wallet.currency}</span>
                </div>
              </div>
              <div className="stat">
                <div className="tile"><small>Recherches enregistrées</small><strong>{savedSearches.length}</strong></div>
                <div className="tile ok"><small>Bonus vendeur</small><strong>20 $</strong></div>
              </div>
              <div className="cardbox">
                <div className="eyebrow">Recharger le Wallet</div>
                <p className="tiny muted">Rechargez des crédits Omni pour les services de plateforme. La confirmation finale vient du webhook FedaPay vérifié.</p>
                <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop:   8 }}>
                  {[50,100,250].map((amount) => (
                    <button key={amount} type="button" disabled={rechargeState === 'success'} className={rechargeAmount === String(amount) ? 'btn sm' : 'btn ghost sm'} style={{ width: 'auto', minHeight: 28 }} onClick={() => setRechargeAmount(String(amount))}>{amount} F</button>
                  ))}
                </div>
                <label className="label" htmlFor="v13-recharge">Montant en FCFA</label>
                <input id="v13-recharge" className="field" type="number" min="1" step="1" inputMode="numeric" disabled={rechargeState === 'success'} value={rechargeAmount} onChange={(event) => setRechargeAmount(event.target.value)} />
                {rechargeError && <p className="sub" role="alert">{rechargeError}</p>}
                {rechargeState === 'success' && rechargeResult ? (
                  <div className="cardbox" style={{ marginTop: 8 }}>
                    <p className="sub" role="status">Recharge créée · {money(rechargeResult.amountMinor, rechargeResult.currency)} en attente de confirmation.</p>
                    <button className="btn" type="button" style={{ marginTop: 8 }} onClick={() => { window.location.assign(rechargeResult.checkoutUrl); }}>Continuer le paiement FedaPay <ArrowRight size={15} /></button>
                    <button className="btn ghost sm" type="button" style={{ marginTop: 8 }} onClick={() => { setRechargeState('idle'); setRechargeResult(null); setRechargeAmount('100'); }}>Nouvelle recharge</button>
                  </div>
                ) : (
                  <button className="btn" type="button" disabled={rechargeState === 'loading'} style={{ marginTop: 10 }} onClick={() => void startRecharge()}>{rechargeState === 'loading' ? 'Préparation…' : 'Préparer la recharge'}</button>
                )}
              </div>
              {wallet.facilities.length > 0 && (
                <div className="cardbox">
                  <div className="eyebrow">Plans par facilité</div>
                  {wallet.facilities.map((facility) => (
                    <div className="kv" key={facility.facilityId}>
                      <span>{facility.facilityName}</span>
                      <b>{facility.plan === 'pro_active' ? 'Pro actif' : facility.plan === 'pro_expired' ? 'Pro expiré' : 'Free · 5 offres max'}</b>
                    </div>
                  ))}
                </div>
              )}
              {wallet.entries.length > 0 && (
                <div className="cardbox">
                  <div className="eyebrow">Dernières écritures</div>
                  {wallet.entries.slice(0, 5).map((entry) => (
                    <div className="kv" key={entry.id}>
                      <span>{entry.kind.replaceAll('_', ' ')}</span>
                      <b>{entry.amountMinor > 0 ? '+' : ''}{money(entry.amountMinor, wallet.currency)}</b>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      )}
      {sheet === 'plans' && (
        <section className="sheet h-mid" data-sheet="plans" role="region" aria-label="Plans">
          <div className="handle" />
          <div className="sheet-head">
            <div><div className="eyebrow">Plans</div><h1>{role === 'seller' ? 'Plans Seller' : role === 'admin' || role === 'operator' ? 'Accès équipe' : 'Plans Buyer'}</h1></div>
            <button type="button" className="btn ghost sm" style={{ width: 'auto', minHeight: 28 }} onClick={() => setSheet('menu')}><X size={15} /></button>
          </div>
          {(role === 'buyer' || role === 'seller') ? (
            <>
              <div className="cardbox">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <div><b>Free</b><br /><span className="tiny muted">{role === 'buyer' ? 'Découverte + recherches' : 'Découverte + 5 produits'}</span></div>
                  <span className="status gray">Actuel</span>
                </div>
              </div>
              <div className="cardbox">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <div><b>Pro</b><br /><span className="tiny muted">{role === 'buyer' ? 'Recherches illimitées + alertes' : 'Stock Omni + dispo auto'}</span></div>
                  <span className="status ink">{role === 'buyer' ? '5 $/mois' : '10 $/mois'}</span>
                </div>
                <button className="btn" type="button" style={{ marginTop: 8 }} onClick={() => void openWallet()}>Passer au niveau supérieur</button>
              </div>
            </>
          ) : (
            <div className="cardbox">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div><b>Équipe</b><br /><span className="tiny muted">Accès revue complet</span></div>
                <span className="status gray">Interne</span>
              </div>
            </div>
          )}
        </section>
      )}
      {sheet === 'saved' && (
        <section className="sheet h-mid" data-sheet="saved" role="region" aria-label="Recherches enregistrées">
          <div className="handle" />
          <div className="sheet-head">
            <div><div className="eyebrow">Recherches enregistrées</div><h1>Vos alertes</h1></div>
            <span className="status gray">{savedSearches.length}</span>
          </div>
          {savedState === 'loading' && <p className="sub" role="status">Chargement de vos recherches…</p>}
          {savedState === 'error' && (
            <div role="alert">
              <p className="sub">{savedError}</p>
              <button className="btn ghost sm" style={{ width: 'auto', minHeight: 28 }} onClick={() => void openSaved()}><RefreshCw size={14} /> Réessayer</button>
            </div>
          )}
          {savedState === 'idle' && savedSearches.length === 0 && (
            <div className="cardbox">
              <p className="tiny muted">Aucune recherche enregistrée. Lancez une recherche puis enregistrez-la pour être alerté.</p>
            </div>
          )}
          {savedSearches.map((search) => (
            <div className="cardbox" key={search.id}>
              <div className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b className="fs-13" style={{ display: 'block' }}>{search.query}</b>
                  <span className="tiny muted">{search.active ? 'Active' : 'Inactive'}</span>
                </div>
                <span className={`status ${search.active ? 'ok' : 'gray'}`}>{search.active ? <Bell size={11} /> : <BellOff size={11} />} {search.active ? ' Active' : ' Inactive'}</span>
              </div>
              <div className="btnrow" style={{ marginTop: 8 }}>
                <button className="btn ok sm" type="button" onClick={() => { setQuery(search.query); void runSearch(search.query); }}>Relancer</button>
                <button className="btn ghost sm" type="button" aria-busy={savedDeletingId === search.id} disabled={savedDeletingId === search.id} onClick={() => void removeSavedSearch(search)}><Trash2 size={13} /> {savedDeletingId === search.id ? 'Suppression…' : 'Supprimer'}</button>
              </div>
            </div>
          ))}
          <button className="btn ghost sm" type="button" style={{ width: 'auto', minHeight: 28, marginTop: 10 }} onClick={() => void saveCurrentSearch()}>+ Enregistrer la recherche courante</button>
        </section>
      )}
      {sheet === 'claim' && claimResult && (
        <section className="sheet h-mid" data-sheet="claim" role="region" aria-label="Revendiquer">
          <div className="handle" />
          <div className="sheet-head">
            <div><div className="eyebrow">Revendiquer</div><h1>Vérifier une facilité</h1></div>
            <button type="button" className="btn ghost sm" style={{ width: 'auto', minHeight: 28 }} onClick={() => setSheet('facility')}><X size={15} /></button>
          </div>
          <p className="tiny muted">{selectedFacility?.name ?? 'Facilité sélectionnée'} · draft v{claimResult.version}</p>
          <p className="sub">Ce parcours prépare une vérification représentant, société, lieu et activité. Il ne certifie jamais une personne au moment du clic.</p>
          <div className="plist">
            {CLAIM_KINDS.map(([kind, label]) => {
              const count = claimEvidence.filter((item) => item.evidenceKind === kind).length;
              return (
                <div className="pitem" key={kind}>
                  <span className="chk">{count ? <CheckCircle2 size={12} /> : ''}</span>
                  <span><b>{label}</b><small>{count ? `${count} fichier privé ajouté${count === 1 ? '' : 's'}` : 'JPEG, PNG, WebP ou PDF · 10 Mo maximum'}</small></span>
                  <label className="btn ghost sm" style={{ width: 'auto', minHeight: 26 }}>
                    <span>{claimUploadState === 'uploading' ? `${claimUploadProgress}%` : claimStorage === true ? 'Ajouter' : 'Bloqué'}</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" disabled={claimStorage !== true || claimUploadState === 'uploading' || claimResult.state === 'submitted'} onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; if (file) void uploadClaimEvidence(kind, file); }} />
                  </label>
                </div>
              );
            })}
          </div>
          <div className="cardbox">
            <div className="kv"><span>Statut</span><b>{claimResult.state}</b></div>
            <div className="kv"><span>Preuves</span><b>{claimEvidence.length}</b></div>
          </div>
          {claimUploadError && <p className="sub" role="alert">{claimUploadError}</p>}
          {claimSubmitError && <p className="sub" role="alert">{claimSubmitError}</p>}
          {claimActionError && <p className="sub" role="alert">{claimActionError}</p>}
          {claimSubmitState === 'success' && claimResult.state === 'submitted' ? (
            <div className="cardbox" role="status">
              <p className="sub"><CheckCircle2 size={15} /> Claim soumis. La file reviewer Omni vérifiera les preuves avant toute évolution du statut.</p>
            </div>
          ) : (
            <button className="btn" type="button" disabled={claimStorage !== true || claimEvidence.length === 0 || claimUploadState === 'uploading' || claimSubmitState === 'loading'} style={{ marginTop: 10 }} onClick={() => void submitClaimEvidence()}>{claimSubmitState === 'loading' ? 'Vérification et soumission…' : claimEvidence.length === 0 ? 'Ajoutez une preuve pour continuer' : 'Soumettre à la revue Omni'} <ArrowRight size={15} /></button>
          )}
          <div className="btnrow" style={{ marginTop: 8 }}>
            <button className="btn ghost" type="button" disabled={claimActionState === 'loading' || claimResult.state === 'submitted'} onClick={() => void cancelClaimDraft()}>{claimActionState === 'loading' ? 'Annulation…' : 'Annuler ce brouillon'}</button>
            <button className="btn ghost" type="button" onClick={() => setSheet('facility')}>Continuer plus tard</button>
          </div>
          <p className="tiny muted" style={{ textAlign: 'center', marginTop: 8 }}><ShieldCheck size={12} /> Un claim ne devient certifié qu’après preuves privées, revue de l’équipe et historique auditable.</p>
        </section>
      )}
      {sheet === 'auth' && (
        <section className="sheet h-mid" data-sheet="auth" role="dialog" aria-modal="true" aria-label="Connexion">
          <div className="handle" />
          <div className="sheet-head">
            <div><div className="eyebrow">Bienvenue</div><h1>Connectez-vous pour continuer.</h1></div>
            <button type="button" className="btn ghost sm" style={{ width: 'auto', minHeight: 28 }} onClick={() => setSheet('none')}><X size={15} /></button>
          </div>
          <p className="sub">
            {authClient ? 'La connexion Omni (Neon Auth) est active.' : 'L’authentification n’est pas configurée dans cet environnement.'}
          </p>
          <form className="cardbox" onSubmit={async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const email = String(data.get("email") ?? "");
            const password = String(data.get("password") ?? "");
            if (!email || !password) return;
            try {
              await authClient.signIn.email({ email, password });
              const session = await authClient.getSession();
              const user = sessionUserFromAuthResult(session);
              if (user) setSessionUser(user);
              if (pendingAction) { setSheet('onboard'); } else { setSheet("menu"); }
            } catch {
              setError("Connexion impossible - vérifiez vos identifiants.");
            }
          }}>
            <label className="label" htmlFor="v13-email">Email</label>
            <input id="v13-email" name="email" type="email" required className="field" placeholder="vous@exemple.fr" />
            <label className="label" htmlFor="v13-password">Mot de passe</label>
            <input id="v13-password" name="password" type="password" required className="field" />
            <button className="btn" type="submit" style={{ marginTop: 10 }}>Se connecter</button>
          </form>
        </section>
      )}

      {mapState === 'loading' && <div className="map-legend" role="status"><span>Chargement…</span></div>}
    </div>
  );
}
