import { FormEvent, forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, ChevronRight, ChevronUp, Clock3, Download, LogIn, LogOut, MapPin, PackageSearch, QrCode, Search, ShieldCheck, X } from 'lucide-react';
import { authClient, getAuthToken } from '../auth';
import { cancelFacilityClaim, confirmExternalPayment, createFacilityClaimDraft, createPurchaseIntent, declareExternalPayment, getAccountCapabilities, getAvailabilityResponses, getTransaction, getTransactionMessages, sendTransactionMessage, getBuyerAvailabilityRequests, getClaimStorageStatus, getFacilityDetail, getNotificationInbox, getOperatorRuns, getReviewQueue, getSellerActivationQueue, getSellerAvailabilityQueue, getSellerCatalogue, getWalletOverview, createWalletRecharge, activateFacilityPro, createSellerProductDraft, createSellerFacility, updateSellerProductDraft, transitionSellerProduct, importPublicFacility, importPublicFacilityBatch, issueBuyerQrToken, listPublicFacilities, markNotificationSeen, getWebPushStatus, rebindDemoSeller, requestAvailability, requestSellerAvailabilityResponse, reviewFacilityClaim, subscribeWebPush, activateSellerAccount, setSellerAccountSuspension, submitFacilityClaim, submitTransactionRating, transitionTransaction, uploadFacilityEvidence, verifyQrToken } from './api';
import { TrunkMap } from './TrunkMap';
import { TransactionQrCard } from './TransactionQrCard';
import { TransactionChat } from './TransactionChat';
import { SellerTransactionPanel } from './SellerTransactionPanel';
import { FieldPilotLocationMap } from './FieldPilotLocationMap';
import { dockBandOffset } from './layout-contract';
import { discoverFromOverpass, type DiscoveryFacility } from '../lib/public-discovery';
import type { AvailabilityResponseStatus, AvailabilityResponsesResult, AvailabilityResult, BuyerAvailabilityRequestList, BuyerAvailabilityRequestSummary, ClaimDraftResult, ClaimEvidenceItem, EvidenceKind, ExternalPaymentMethod, FacilityDetail, NotificationInboxResult, OperatorRunsResult, PublicFacility, PublicFacilityImportResult, PublicTrust, PurchaseIntentResult, ReviewClaimResult, ReviewOutcome, ReviewQueueItem, ReviewQueueResult, SearchOptions, SellerAvailabilityQueue, SellerAvailabilityRequest, SellerCatalogueFacility, SellerCatalogueProduct, SellerCatalogueResult, QrVerificationResult, TransactionMessage, TransactionState, TransactionMessagesResult, WalletOverviewResult, WalletRechargeResult, FacilityProActivationResult } from './types';
import { sessionUserFromAuthResult, type SessionUser } from './auth-session';
import { useScrollLock, useViewportInsets } from '../hooks/use-viewport-insets';

const emptySearchOptions: SearchOptions = { category: '' };

type Panel = 'none' | 'auth' | 'facility' | 'claim' | 'availability' | 'buyer-requests' | 'seller-entry' | 'field-pilot' | 'inbox' | 'reviewer';
type AuthMode = 'sign-in' | 'sign-up';
type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
type AuthReturn = 'none' | 'availability' | 'buyer-requests' | 'seller-entry' | 'field-pilot' | 'claim' | 'inbox' | 'reviewer';
type SellerResponseStatus = Extract<AvailabilityResponseStatus, 'available' | 'partial' | 'unavailable'>;
export type EscapeTarget = 'facility' | 'seller-queue' | 'nearby-results' | 'close' | 'none';

export function resolveEscape(panel: Panel, hasSellerRequest: boolean, nearbyOpen = false): EscapeTarget {
  if (panel === 'availability') return 'facility';
  if (panel === 'seller-entry' && hasSellerRequest) return 'seller-queue';
  if (panel === 'field-pilot' || panel === 'claim' || panel === 'inbox' || panel === 'reviewer') return 'close';
  if (panel !== 'none') return 'close';
  if (nearbyOpen) return 'nearby-results';
  return 'none';
}

export type SellerEntryIntent =
  | { kind: 'open-seller-boundary' }
  | { kind: 'authenticate'; returnTo: 'seller-entry' };

export function resolveSellerEntry(sessionUserId: string | null): SellerEntryIntent {
  return sessionUserId ? { kind: 'open-seller-boundary' } : { kind: 'authenticate', returnTo: 'seller-entry' };
}

function currency(minor: number, code: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: code, maximumFractionDigits: 2 }).format(minor / 100);
}

function walletRechargeCurrency(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount);
}

function osmToPublicFacility(item: { id: string; name: string; category: string; lng: number; lat: number }): PublicFacility {
  return { id: item.id, name: item.name, category: item.category, address: 'Donnée publique OpenStreetMap', latitude: item.lat, longitude: item.lng, trust: 'unclaimed', plan: 'free', productCount: 0, source: 'osm' };
}

function planLabel(plan: FacilityDetail['plan']) {
  if (plan === 'pro_active') return 'Plan Pro · offres illimitées';
  if (plan === 'pro_expired') return 'Pro expiré · publication limitée';
  return 'Plan Free · 5 offres maximum';
}

function trustLabel(trust: PublicTrust) {
  if (trust === 'confirmed') return 'Confirmée par 3 ventes Omni';
  if (trust === 'unconfirmed') return 'Vendeur certifié';
  if (trust === 'certified') return 'Facilité certifiée';
  return 'Lieu public · non revendiqué';
}

function publicBadge(facility: PublicFacility) {
  return facility.productCount > 0 ? 'CATALOGUE' : 'PUBLIC';
}

export function TrunkApp() {
  const [facilities, setFacilities] = useState<PublicFacility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<FacilityDetail | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [budgetMode, setBudgetMode] = useState<'unlimited' | 'maximum'>('unlimited');
  const [budget, setBudget] = useState('');
  const [panel, setPanel] = useState<Panel>('none');
  const [availabilityStep, setAvailabilityStep] = useState(1);
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
  const [responseData, setResponseData] = useState<AvailabilityResponsesResult | null>(null);
  const [responseState, setResponseState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [responseError, setResponseError] = useState('');
  const [purchaseIntentState, setPurchaseIntentState] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [purchaseIntentError, setPurchaseIntentError] = useState('');
  const [purchaseIntent, setPurchaseIntent] = useState<PurchaseIntentResult | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<ExternalPaymentMethod>('mobile_money');
  const [paymentState, setPaymentState] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [paymentError, setPaymentError] = useState('');
  const [buyerTransactionState, setBuyerTransactionState] = useState<TransactionState>('intent_created');
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingNote, setRatingNote] = useState('');
  const [ratingState, setRatingState] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [ratingError, setRatingError] = useState('');
  const [buyerQrState, setBuyerQrState] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [buyerQrError, setBuyerQrError] = useState('');
  const [buyerQrResult, setBuyerQrResult] = useState<{ transactionId: string; token: string; expiresAt: string } | null>(null);
  const [transactionMessages, setTransactionMessages] = useState<TransactionMessage[]>([]);
  const [transactionMessagesState, setTransactionMessagesState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [transactionMessagesError, setTransactionMessagesError] = useState('');
  const [transactionMessageSending, setTransactionMessageSending] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [buyerRequests, setBuyerRequests] = useState<BuyerAvailabilityRequestList | null>(null);
  const [buyerRequestsState, setBuyerRequestsState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [buyerRequestsError, setBuyerRequestsError] = useState('');
  const [query, setQuery] = useState('');
  const [committedQuery, setCommittedQuery] = useState('');
  const [bounds, setBounds] = useState<[number, number, number, number] | undefined>(undefined);
  const [mapState, setMapState] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');
  const [detailState, setDetailState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [requestState, setRequestState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState('');
  const [authMode, setAuthMode] = useState<AuthMode>('sign-in');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authState, setAuthState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [authError, setAuthError] = useState('');
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [accountCapabilities, setAccountCapabilities] = useState<{ accountId: string; seller: boolean; operator: boolean; reviewer: boolean } | null>(null);
  const [sellerQueue, setSellerQueue] = useState<SellerAvailabilityQueue | null>(null);
  const [sellerCatalogue, setSellerCatalogue] = useState<SellerCatalogueResult | null>(null);
  const [sellerWallet, setSellerWallet] = useState<WalletOverviewResult | null>(null);
  const [sellerProState, setSellerProState] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [sellerProError, setSellerProError] = useState('');
  const [sellerProResult, setSellerProResult] = useState<FacilityProActivationResult | null>(null);
  const [sellerRechargeState, setSellerRechargeState] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [sellerRechargeError, setSellerRechargeError] = useState('');
  const [sellerRechargeResult, setSellerRechargeResult] = useState<WalletRechargeResult | null>(null);
  const [sellerRechargeAmount, setSellerRechargeAmount] = useState('10000');
  const [sellerCatalogueMutationState, setSellerCatalogueMutationState] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [sellerCatalogueMutationError, setSellerCatalogueMutationError] = useState('');
  const [sellerFacilityCreateState, setSellerFacilityCreateState] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [sellerFacilityCreateError, setSellerFacilityCreateError] = useState('');
  const [sellerFacilityCreateResult, setSellerFacilityCreateResult] = useState<{ facilityId: string; slotId: string; trustState: 'verification_draft'; created: boolean } | null>(null);
  const [sellerEditingProductId, setSellerEditingProductId] = useState<string | null>(null);
  const [sellerQueueState, setSellerQueueState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [sellerQueueError, setSellerQueueError] = useState('');
  const [sellerRequest, setSellerRequest] = useState<SellerAvailabilityRequest | null>(null);
  const [sellerResponseStatus, setSellerResponseStatus] = useState<SellerResponseStatus>('available');
  const [sellerQuantity, setSellerQuantity] = useState(1);
  const [sellerPrice, setSellerPrice] = useState('');
  const [sellerMessage, setSellerMessage] = useState('');
  const [sellerResponseState, setSellerResponseState] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [sellerResponseError, setSellerResponseError] = useState('');
  const [sellerResponseResult, setSellerResponseResult] = useState<{ status: AvailabilityResponseStatus; observedAt: string } | null>(null);
  const [sellerTab, setSellerTab] = useState<'requests' | 'catalogue' | 'wallet' | 'transaction'>('requests');
  const [sellerTransactionId, setSellerTransactionId] = useState('');
  const [sellerQrPayload, setSellerQrPayload] = useState('');
  const [sellerVerifyState, setSellerVerifyState] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [sellerVerifyError, setSellerVerifyError] = useState('');
  const [sellerVerification, setSellerVerification] = useState<QrVerificationResult | null>(null);
  const [sellerTransactionState, setSellerTransactionState] = useState<TransactionState>('intent_created');
  const [sellerPaymentState, setSellerPaymentState] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [sellerPaymentError, setSellerPaymentError] = useState('');
  const [sellerTransitionState, setSellerTransitionState] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [sellerTransitionError, setSellerTransitionError] = useState('');
  const [sellerRebindState, setSellerRebindState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [sellerRebindError, setSellerRebindError] = useState('');
  const [fieldPilotState, setFieldPilotState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [fieldPilotError, setFieldPilotError] = useState('');
  const [operatorRuns, setOperatorRuns] = useState<OperatorRunsResult | null>(null);
  const [fieldPilotName, setFieldPilotName] = useState('');
  const [fieldPilotSourceRef, setFieldPilotSourceRef] = useState('');
  const [fieldPilotCategory, setFieldPilotCategory] = useState('');
  const [fieldPilotAddress, setFieldPilotAddress] = useState('');
  const [fieldPilotLatitude, setFieldPilotLatitude] = useState('6.13');
  const [fieldPilotLongitude, setFieldPilotLongitude] = useState('1.22');
  const [fieldPilotResult, setFieldPilotResult] = useState<PublicFacilityImportResult | null>(null);
  const [osmDiscoveryState, setOsmDiscoveryState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [osmDiscoveryError, setOsmDiscoveryError] = useState('');
  const [osmDiscoveryRegion, setOsmDiscoveryRegion] = useState<'lome' | 'aflao' | null>(null);
  const [osmDiscoveryItems, setOsmDiscoveryItems] = useState<DiscoveryFacility[]>([]);
  const [osmSelectedIds, setOsmSelectedIds] = useState<string[]>([]);
  const [osmBatchState, setOsmBatchState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [osmBatchError, setOsmBatchError] = useState('');
  const [osmBatchResult, setOsmBatchResult] = useState<{ imported: number; created: number; existing: number } | null>(null);
  const [claimState, setClaimState] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [claimError, setClaimError] = useState('');
  const [claimResult, setClaimResult] = useState<ClaimDraftResult | null>(null);
  const [claimActionState, setClaimActionState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [claimActionError, setClaimActionError] = useState('');
  const [claimEvidence, setClaimEvidence] = useState<ClaimEvidenceItem[]>([]);
  const [claimUploadState, setClaimUploadState] = useState<'idle' | 'uploading' | 'error'>('idle');
  const [claimUploadProgress, setClaimUploadProgress] = useState(0);
  const [claimUploadError, setClaimUploadError] = useState('');
  const [claimSubmitState, setClaimSubmitState] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [claimSubmitError, setClaimSubmitError] = useState('');
  const [claimStorageAvailable, setClaimStorageAvailable] = useState<boolean | null>(null);
  const [inboxState, setInboxState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [inboxError, setInboxError] = useState('');
  const [inboxData, setInboxData] = useState<NotificationInboxResult | null>(null);
  const [reviewerState, setReviewerState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [reviewerError, setReviewerError] = useState('');
  const [reviewerQueue, setReviewerQueue] = useState<ReviewQueueResult | null>(null);
  const [selectedReview, setSelectedReview] = useState<ReviewQueueItem | null>(null);
  const [reviewOutcome, setReviewOutcome] = useState<ReviewOutcome>('needs_more_evidence');
  const [reviewReason, setReviewReason] = useState('');
  const [reviewActionState, setReviewActionState] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [reviewActionError, setReviewActionError] = useState('');
  const [reviewActionResult, setReviewActionResult] = useState<ReviewClaimResult | null>(null);
  const [activationQueue, setActivationQueue] = useState<Array<{ accountId: string; authUserId: string; onboardingState: string; facilityCount: number; createdAt: string; suspended: boolean }>>([]);
  const [activationQueueState, setActivationQueueState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [activationQueueError, setActivationQueueError] = useState('');
  const [activationActionState, setActivationActionState] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [activationActionError, setActivationActionError] = useState('');
  const [activationResult, setActivationResult] = useState<{ accountId: string; onboardingState: 'seller_ready'; activated: true } | null>(null);
  const [statusActionState, setStatusActionState] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [statusActionError, setStatusActionError] = useState('');
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAllResults, setShowAllResults] = useState(false);
  const [nearbyOpen, setNearbyOpen] = useState(false);
  const [nearbyCollapsed, setNearbyCollapsed] = useState(false);
  const [revealActive, setRevealActive] = useState(false);
  const [draftOptions, setDraftOptions] = useState<SearchOptions>(emptySearchOptions);
  const [appliedOptions, setAppliedOptions] = useState<SearchOptions>(emptySearchOptions);
  const [authReturn, setAuthReturn] = useState<AuthReturn>('none');
  const [searchRevealRevision, setSearchRevealRevision] = useState(0);
  const detailRequestRef = useRef(0);
  const availabilityKeyRef = useRef<{ shape: string; key: string } | null>(null);
  const facilityQueryKeyRef = useRef<string | null>(null);
  const appRef = useRef<HTMLElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const nearbySheetRef = useRef<HTMLElement | null>(null);
  useViewportInsets(appRef);
  useScrollLock(panel !== 'none' || menuOpen || optionsOpen);

  useEffect(() => {
    const blurOutsideDock = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (document.activeElement === searchInputRef.current && !target?.closest('.search-pill')) searchInputRef.current?.blur();
    };
    document.addEventListener('pointerdown', blurOutsideDock, true);
    return () => document.removeEventListener('pointerdown', blurOutsideDock, true);
  }, []);

  const selectedProduct = useMemo(() => selectedFacility?.products.find((product) => product.id === selectedProductId) ?? null, [selectedFacility, selectedProductId]);
  const categoryOptions = useMemo(() => {
    const categories = new Set(facilities.map((facility) => facility.category).filter(Boolean));
    if (draftOptions.category) categories.add(draftOptions.category);
    return ['', ...Array.from(categories).sort()];
  }, [draftOptions.category, facilities]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (panel === 'none' && optionsOpen) {
        setOptionsOpen(false);
        return;
      }
      if (panel === 'none' && menuOpen) {
        setMenuOpen(false);
        return;
      }
      const target = resolveEscape(panel, Boolean(sellerRequest), nearbyOpen);
      if (target === 'facility') setPanel('facility');
      else if (target === 'seller-queue') setSellerRequest(null);
      else if (target === 'nearby-results') {
        setSelectedFacility(null);
        setSelectedProductId(null);
        setNearbyOpen(false);
        setNearbyCollapsed(false);
        setShowAllResults(false);
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      } else if (target === 'close') setPanel('none');
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen, nearbyOpen, optionsOpen, panel, sellerRequest]);

  useEffect(() => {
    if (window.location.pathname === '/auth' || window.location.pathname.startsWith('/auth/')) {
      setPanel('auth');
    }
  }, []);

  useEffect(() => {
    let active = true;
    authClient?.getSession().then((result) => {
      const user = sessionUserFromAuthResult(result);
      if (active && user) setSessionUser(user);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (!sessionUser) {
      setAccountCapabilities(null);
      return () => { active = false; };
    }
    void getAuthToken().then((token) => token ? getAccountCapabilities({ token }) : null).then((result) => {
      if (!active) return;
      setAccountCapabilities(result?.ok ? result.data ?? null : null);
    }).catch(() => { if (active) setAccountCapabilities(null); });
    return () => { active = false; };
  }, [sessionUser]);

  useEffect(() => {
    if (!committedQuery.trim()) return;
    const requestKey = `global-search|${committedQuery}|${JSON.stringify(appliedOptions)}`;
    if (facilityQueryKeyRef.current === requestKey) return;
    facilityQueryKeyRef.current = requestKey;
    let active = true;
    setMapState('loading');
    listPublicFacilities(undefined, committedQuery, appliedOptions).then((result) => {
      if (!active) return;
      if (result.ok) {
        setFacilities(result.data ?? []);
        setMapState(result.data?.length ? 'ready' : 'empty');
        setError('');
      } else {
        setMapState('error');
        setError(result.error?.message ?? 'La découverte publique est temporairement indisponible.');
      }
    }).catch(() => {
      if (active) {
        setMapState('error');
        setError('La découverte publique est temporairement indisponible.');
      }
    });
    return () => { active = false; };
  }, [appliedOptions, committedQuery, searchRevealRevision]);

  useEffect(() => {
    if (committedQuery.trim()) return;
    if (!bounds) {
      setMapState('loading');
      return;
    }
    const requestKey = `${bounds.map((value) => value.toFixed(5)).join(',')}|nearby|${JSON.stringify(appliedOptions)}`;
    if (facilityQueryKeyRef.current === requestKey) return;
    facilityQueryKeyRef.current = requestKey;
    let active = true;
    setMapState('loading');
    listPublicFacilities(bounds, undefined, appliedOptions).then((result) => {
      if (!active) return;
      if (result.ok) {
        const persisted = result.data ?? [];
        if (persisted.length) {
          setFacilities(persisted);
          setMapState('ready');
          setError('');
          return;
        }
        discoverFromOverpass(bounds, undefined).then((items) => {
          if (!active) return;
          const osmFacilities = items.map(osmToPublicFacility);
          setFacilities(osmFacilities);
          setMapState(osmFacilities.length ? 'ready' : 'empty');
          setError('');
        }).catch(() => {
          if (active) { setFacilities([]); setMapState('empty'); setError('Aucun lieu Omni ou OpenStreetMap dans cette vue.'); }
        });
      } else {
        setMapState('error');
        setError(result.error?.message ?? 'La découverte publique est temporairement indisponible.');
      }
    }).catch(() => {
      if (active) {
        setMapState('error');
        setError('La découverte publique est temporairement indisponible.');
      }
    });
    return () => { active = false; };
  }, [appliedOptions, bounds, committedQuery, searchRevealRevision]);

  const openAuth = (mode: AuthMode = 'sign-in', returnTo: AuthReturn = 'none') => {
    setAuthMode(mode);
    setAuthError('');
    setAuthReturn(returnTo);
    setMenuOpen(false);
    setOptionsOpen(false);
    setPanel('auth');
  };

  const loadBuyerRequests = async () => {
    if (!authClient) return;
    setBuyerRequestsState('loading');
    setBuyerRequestsError('');
    try {
      const token = await getAuthToken();
      if (!token) {
        setBuyerRequestsState('error');
        setBuyerRequestsError('Votre session doit être réouverte pour retrouver vos demandes.');
        return;
      }
      const result = await getBuyerAvailabilityRequests({ token });
      if (!result.ok || !result.data) {
        setBuyerRequestsState('error');
        setBuyerRequestsError(result.error?.message ?? 'Vos demandes ne peuvent pas être chargées pour le moment.');
        return;
      }
      setBuyerRequests(result.data);
      setBuyerRequestsState('idle');
    } catch (caught) {
      setBuyerRequestsState('error');
      setBuyerRequestsError(caught instanceof Error ? caught.message : 'Vos demandes ne peuvent pas être chargées pour le moment.');
    }
  };

  const openBuyerRequests = () => {
    setMenuOpen(false);
    setOptionsOpen(false);
    if (!sessionUser) {
      openAuth('sign-in', 'buyer-requests');
      return;
    }
    setPanel('buyer-requests');
    void loadBuyerRequests();
  };

  const resumeBuyerRequest = async (request: BuyerAvailabilityRequestSummary) => {
    setPanel('buyer-requests');
    setBuyerRequestsState('loading');
    setBuyerRequestsError('');
    const detail = await getFacilityDetail(request.facilityId);
    if (!detail.ok || !detail.data) {
      setBuyerRequestsState('error');
      setBuyerRequestsError(detail.error?.message ?? 'La facilité de cette demande ne peut pas être rouverte.');
      return;
    }
    setSelectedFacility(detail.data);
    setSelectedProductId(request.productId);
    setAvailability({ requestId: request.id, productId: request.productId, facilityId: request.facilityId, status: request.requestStatus, expiresAt: request.expiresAt, message: request.responseCount > 0 ? 'Des réponses vérifiées sont disponibles.' : 'Omni attend une réponse de la facilité.' });
    setAvailabilityStep(4);
    setResponseData(null);
    setResponseError('');
    setResponseState('loading');
    setBuyerRequestsState('idle');
    setPanel('availability');
    await refreshResponses(request.id);
  };

  const loadSellerQueue = async () => {
    if (!authClient) return;
    setSellerQueueState('loading');
    setSellerQueueError('');
    try {
      const token = await getAuthToken();
      if (!token) {
        setSellerQueueState('error');
        setSellerQueueError('Votre session doit être réouverte pour vérifier l’accès vendeur.');
        return;
      }
      const [queueResult, catalogueResult, walletResult] = await Promise.all([
        getSellerAvailabilityQueue({ token }),
        getSellerCatalogue({ token }),
        getWalletOverview({ token }),
      ]);
      if (!queueResult.ok || !queueResult.data) {
        setSellerQueueState('error');
        setSellerQueueError(queueResult.error?.message ?? 'La file vendeur est temporairement indisponible.');
        return;
      }
      setSellerQueue(queueResult.data);
      if (catalogueResult.ok && catalogueResult.data) setSellerCatalogue(catalogueResult.data);
      if (walletResult.ok && walletResult.data) setSellerWallet(walletResult.data);
      setSellerQueueState('idle');
    } catch (caught) {
      setSellerQueueState('error');
      setSellerQueueError(caught instanceof Error ? caught.message : 'La file vendeur est temporairement indisponible.');
    }
  };

  const mutateSellerCatalogue = async (action: 'create' | 'update' | 'publish' | 'archive', productId?: string, fields?: { facilityId?: string; name: string; description?: string; unit?: string; priceMinor: number; currency: string; discountKind: 'percentage' | 'fixed'; discountValueMinor: number }) => {
    if (!authClient) return;
    setSellerCatalogueMutationState('loading');
    setSellerCatalogueMutationError('');
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Votre session Seller doit être réouverte.');
      let result;
      if (action === 'create' && fields?.facilityId) result = await createSellerProductDraft({ token, facilityId: fields.facilityId, name: fields.name, description: fields.description, unit: fields.unit, priceMinor: fields.priceMinor, currency: fields.currency, discountKind: fields.discountKind, discountValueMinor: fields.discountValueMinor, idempotencyKey: crypto.randomUUID() });
      else if (action === 'update' && productId && fields) result = await updateSellerProductDraft({ token, productId, name: fields.name, description: fields.description, unit: fields.unit, priceMinor: fields.priceMinor, currency: fields.currency, discountKind: fields.discountKind, discountValueMinor: fields.discountValueMinor });
      else if ((action === 'publish' || action === 'archive') && productId) result = await transitionSellerProduct({ token, productId, to: action === 'publish' ? 'published' : 'archived' });
      else throw new Error('Données de mutation Seller incomplètes.');
      if (!result.ok) throw new Error(result.error?.message ?? 'La mutation de l’offre a échoué.');
      setSellerCatalogueMutationState('success');
      setSellerEditingProductId(null);
      await loadSellerQueue();
    } catch (caught) {
      setSellerCatalogueMutationState('error');
      setSellerCatalogueMutationError(caught instanceof Error ? caught.message : 'La mutation de l’offre a échoué.');
    }
  };

  const createSellerFacilityFromWorkspace = async (input: { name: string; category: string; description: string; address: string; latitude: number; longitude: number }) => {
    if (!authClient) return;
    setSellerFacilityCreateState('loading');
    setSellerFacilityCreateError('');
    setSellerFacilityCreateResult(null);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Votre session Seller doit être réouverte.');
      const result = await createSellerFacility({ token, ...input, idempotencyKey: crypto.randomUUID() });
      if (!result.ok || !result.data) throw new Error(result.error?.message ?? 'La création de la facilité a échoué.');
      setSellerFacilityCreateResult(result.data);
      setSellerFacilityCreateState('success');
      await loadSellerQueue();
    } catch (caught) {
      setSellerFacilityCreateState('error');
      setSellerFacilityCreateError(caught instanceof Error ? caught.message : 'La création de la facilité a échoué.');
    }
  };

  const activateSellerFacilityPro = async (facilityId: string) => {
    if (!authClient || !facilityId) return;
    setSellerProState('loading');
    setSellerProError('');
    setSellerProResult(null);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Votre session Seller doit être réouverte.');
      const month = new Date().toISOString().slice(0, 7);
      const reference = `facility-pro:${facilityId}:${month}`;
      const result = await activateFacilityPro({ token, facilityId, reference });
      if (!result.ok || !result.data) throw new Error(result.error?.message ?? 'L’activation Pro a échoué.');
      setSellerProResult(result.data);
      setSellerProState('success');
      await loadSellerQueue();
    } catch (caught) {
      setSellerProState('error');
      setSellerProError(caught instanceof Error ? caught.message : 'L’activation Pro a échoué.');
    }
  };

  const startSellerWalletRecharge = async () => {
    if (!authClient) return;
    const amountMinor = Number.parseInt(sellerRechargeAmount.trim(), 10);
    if (!Number.isInteger(amountMinor) || amountMinor < 100) {
      setSellerRechargeState('error');
      setSellerRechargeError('Saisissez un montant XOF entier d’au moins 100.');
      return;
    }
    setSellerRechargeState('loading');
    setSellerRechargeError('');
    setSellerRechargeResult(null);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Votre session Seller doit être réouverte.');
      const result = await createWalletRecharge({
        token,
        amountMinor,
        currency: 'XOF',
        callbackUrl: `${window.location.origin}/?wallet=recharge`,
        customer: { email: sessionUser?.email ?? null, firstName: sessionUser?.name ?? null },
        idempotencyKey: `wallet-recharge:${crypto.randomUUID()}`,
      });
      if (!result.ok || !result.data) throw new Error(result.error?.message ?? 'La recharge Wallet n’a pas pu être préparée.');
      setSellerRechargeResult(result.data);
      setSellerRechargeState('success');
    } catch (caught) {
      setSellerRechargeState('error');
      setSellerRechargeError(caught instanceof Error ? caught.message : 'La recharge Wallet n’a pas pu être préparée.');
    }
  };

  const rebindSellerDemo = async () => {
    if (!authClient) return;
    setSellerRebindState('loading');
    setSellerRebindError('');
    try {
      const token = await getAuthToken();
      if (!token) {
        setSellerRebindState('error');
        setSellerRebindError('Votre session doit être réouverte avant l’activation de la démonstration.');
        return;
      }
      const result = await rebindDemoSeller({ token });
      if (!result.ok || !result.data) {
        setSellerRebindState('error');
        setSellerRebindError(result.error?.message ?? 'La démonstration Seller ne peut pas être activée.');
        return;
      }
      setSellerRebindState('idle');
      await loadSellerQueue();
    } catch (caught) {
      setSellerRebindState('error');
      setSellerRebindError(caught instanceof Error ? caught.message : 'La démonstration Seller ne peut pas être activée.');
    }
  };

  const openSellerEntry = () => {
    setMenuOpen(false);
    setOptionsOpen(false);
    const intent = resolveSellerEntry(sessionUser?.id ?? null);
    if (intent.kind === 'authenticate') {
      openAuth('sign-in', intent.returnTo);
      return;
    }
    setPanel('seller-entry');
    setSellerRequest(null);
    setSellerTab('requests');
    setSellerResponseState('idle');
    void loadSellerQueue();
  };

  const loadOperatorRuns = async () => {
    setFieldPilotState('loading');
    setFieldPilotError('');
    try {
      const token = await getAuthToken();
      if (!token) {
        setFieldPilotState('error');
        setFieldPilotError('Votre session doit être réouverte pour accéder aux outils terrain.');
        return;
      }
      const result = await getOperatorRuns({ token });
      if (!result.ok || !result.data) {
        setFieldPilotState('error');
        setFieldPilotError(result.error?.message ?? 'Les outils terrain ne sont pas disponibles pour cette session.');
        return;
      }
      setOperatorRuns(result.data);
      setFieldPilotState('idle');
    } catch (caught) {
      setFieldPilotState('error');
      setFieldPilotError(caught instanceof Error ? caught.message : 'Les outils terrain ne sont pas disponibles.');
    }
  };

  const openFieldPilot = () => {
    setMenuOpen(false);
    setOptionsOpen(false);
    if (!sessionUser) {
      openAuth('sign-in', 'field-pilot');
      return;
    }
    setPanel('field-pilot');
    setFieldPilotResult(null);
    void loadOperatorRuns();
  };

  const loadInbox = async () => {
    setInboxState('loading');
    setInboxError('');
    try {
      const token = await getAuthToken();
      if (!token) {
        setInboxState('error');
        setInboxError('Votre session doit être réouverte pour accéder à votre inbox.');
        return;
      }
      const result = await getNotificationInbox({ token });
      if (!result.ok || !result.data) {
        setInboxState('error');
        setInboxError(result.error?.message ?? 'Votre inbox n’est pas disponible.');
        return;
      }
      setInboxData(result.data);
      setInboxState('idle');
    } catch (caught) {
      setInboxState('error');
      setInboxError(caught instanceof Error ? caught.message : 'Votre inbox n’est pas disponible.');
    }
  };

  const openInbox = () => {
    setMenuOpen(false);
    setOptionsOpen(false);
    if (!sessionUser) {
      openAuth('sign-in', 'inbox');
      return;
    }
    setPanel('inbox');
    void loadInbox();
  };

  const loadReviewerQueue = async () => {
    setReviewerState('loading');
    setReviewerError('');
    try {
      const token = await getAuthToken();
      if (!token) {
        setReviewerState('error');
        setReviewerError('Votre session doit être réouverte pour accéder à la review.');
        return;
      }
      const result = await getReviewQueue({ token });
      if (!result.ok || !result.data) {
        setReviewerState('error');
        setReviewerError(result.error?.message ?? 'La file de review n’est pas disponible.');
        return;
      }
      setReviewerQueue(result.data);
      setReviewerState('idle');
    } catch (caught) {
      setReviewerState('error');
      setReviewerError(caught instanceof Error ? caught.message : 'La file de review n’est pas disponible.');
    }
  };

  const loadSellerActivationQueue = async () => {
    setActivationQueueState('loading');
    setActivationQueueError('');
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Votre session doit être réouverte pour accéder aux activations.');
      const result = await getSellerActivationQueue({ token });
      if (!result.ok || !result.data) throw new Error(result.error?.message ?? 'La file d’activation n’est pas disponible.');
      setActivationQueue(result.data.candidates);
      setActivationQueueState('idle');
    } catch (caught) {
      setActivationQueueState('error');
      setActivationQueueError(caught instanceof Error ? caught.message : 'La file d’activation n’est pas disponible.');
    }
  };
  const activateSeller = async (accountId: string) => {
    setActivationActionState('loading');
    setActivationActionError('');
    setActivationResult(null);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Votre session doit être réouverte avant l’activation.');
      const result = await activateSellerAccount({ accountId, token });
      if (!result.ok || !result.data) throw new Error(result.error?.message ?? 'L’activation n’a pas été enregistrée.');
      setActivationResult(result.data);
      setActivationActionState('success');
      void loadSellerActivationQueue();
    } catch (caught) {
      setActivationActionState('error');
      setActivationActionError(caught instanceof Error ? caught.message : 'L’activation n’a pas été enregistrée.');
    }
  };

  const changeSellerStatus = async (accountId: string, suspended: boolean, reason: string) => {
    setStatusActionState('loading');
    setStatusActionError('');
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Votre session doit être réouverte avant cette action.');
      const result = await setSellerAccountSuspension({ accountId, suspended, reason, token });
      if (!result.ok || !result.data) throw new Error(result.error?.message ?? 'Le statut du compte n’a pas été modifié.');
      setStatusActionState('success');
      void loadSellerActivationQueue();
    } catch (caught) {
      setStatusActionState('error');
      setStatusActionError(caught instanceof Error ? caught.message : 'Le statut du compte n’a pas été modifié.');
    }
  };

  const openReviewer = () => {
    setMenuOpen(false);
    setOptionsOpen(false);
    if (!sessionUser) {
      openAuth('sign-in', 'reviewer');
      return;
    }
    setPanel('reviewer');
    setSelectedReview(null);
    setReviewActionState('idle');
    void loadReviewerQueue();
    void loadSellerActivationQueue();
  };

  const submitReview = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedReview) return;
    setReviewActionState('loading');
    setReviewActionError('');
    setReviewActionResult(null);
    try {
      const token = await getAuthToken();
      if (!token) {
        setReviewActionState('error');
        setReviewActionError('Votre session doit être réouverte avant la review.');
        return;
      }
      const result = await reviewFacilityClaim({ requestId: selectedReview.requestId, outcome: reviewOutcome, reason: reviewReason.trim(), token });
      if (!result.ok || !result.data) {
        setReviewActionState('error');
        setReviewActionError(result.error?.message ?? 'La décision n’a pas été enregistrée.');
        return;
      }
      setReviewActionResult(result.data);
      setReviewActionState('success');
      setReviewReason('');
      setSelectedReview(null);
      void loadReviewerQueue();
    } catch (caught) {
      setReviewActionState('error');
      setReviewActionError(caught instanceof Error ? caught.message : 'La décision n’a pas été enregistrée.');
    }
  };

  const markInboxSeen = async (notificationId: string) => {
    try {
      const token = await getAuthToken();
      if (!token) return;
      const result = await markNotificationSeen({ notificationId, token });
      if (result.ok) void loadInbox();
    } catch {
      // Inbox marking is best-effort; the event remains visible on refresh if it fails.
    }
  };

  const submitPublicFacilityImport = async (event: FormEvent) => {
    event.preventDefault();
    setFieldPilotState('loading');
    setFieldPilotError('');
    setFieldPilotResult(null);
    try {
      const token = await getAuthToken();
      if (!token) {
        setFieldPilotState('error');
        setFieldPilotError('Votre session doit être réouverte avant l’import terrain.');
        return;
      }
      const result = await importPublicFacility({
        provider: 'openstreetmap',
        attribution: '© OpenStreetMap contributors',
        sourceRef: fieldPilotSourceRef.trim(),
        name: fieldPilotName.trim(),
        category: fieldPilotCategory.trim() || null,
        address: fieldPilotAddress.trim() || null,
        latitude: Number(fieldPilotLatitude),
        longitude: Number(fieldPilotLongitude),
        token,
      });
      if (!result.ok || !result.data) {
        setFieldPilotState('error');
        setFieldPilotError(result.error?.message ?? 'La facilité publique n’a pas pu être enregistrée.');
        return;
      }
      setFieldPilotResult(result.data);
      setFieldPilotState('idle');
      setBounds(undefined);
      setCommittedQuery('');
      setQuery('');
      void loadOperatorRuns();
    } catch (caught) {
      setFieldPilotState('error');
      setFieldPilotError(caught instanceof Error ? caught.message : 'La facilité publique n’a pas pu être enregistrée.');
    }
  };

  const discoverOsmRegion = async (region: 'lome' | 'aflao') => {
    setOsmDiscoveryRegion(region);
    setOsmDiscoveryState('loading');
    setOsmDiscoveryError('');
    setOsmDiscoveryItems([]);
    setOsmSelectedIds([]);
    setOsmBatchState('idle');
    setOsmBatchResult(null);
    const bounds = region === 'lome' ? [1.05, 5.95, 1.4, 6.35] as [number, number, number, number] : [1.05, 5.95, 1.35, 6.3] as [number, number, number, number];
    try {
      const items = await discoverFromOverpass(bounds);
      setOsmDiscoveryItems(items.slice(0, 100));
      setOsmSelectedIds(items.slice(0, 100).map((item) => item.id));
      setOsmDiscoveryState('idle');
    } catch (caught) {
      setOsmDiscoveryState('error');
      setOsmDiscoveryError(caught instanceof Error ? caught.message : 'La découverte OpenStreetMap est indisponible.');
    }
  };

  const toggleOsmSelection = (id: string) => {
    setOsmSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  };

  const importSelectedOsm = async () => {
    const selected = osmDiscoveryItems.filter((item) => osmSelectedIds.includes(item.id));
    if (!selected.length) return;
    setOsmBatchState('loading');
    setOsmBatchError('');
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Votre session doit être réouverte avant l’import régional.');
      const result = await importPublicFacilityBatch({
        token,
        attribution: '© OpenStreetMap contributors',
        items: selected.map((item) => ({ sourceRef: item.id, name: item.name, category: item.category, address: null, latitude: item.lat, longitude: item.lng })),
      });
      if (!result.ok || !result.data) throw new Error(result.error?.message ?? 'L’import régional n’a pas pu être exécuté.');
      setOsmBatchResult({ imported: result.data.imported, created: result.data.created, existing: result.data.existing });
      setOsmBatchState('success');
      void loadOperatorRuns();
    } catch (caught) {
      setOsmBatchState('error');
      setOsmBatchError(caught instanceof Error ? caught.message : 'L’import régional n’a pas pu être exécuté.');
    }
  };

  const loadClaimStorageStatus = async (facilityId: string) => {
    setClaimStorageAvailable(null);
    try {
      const token = await getAuthToken();
      if (!token) { setClaimStorageAvailable(false); return; }
      const result = await getClaimStorageStatus({ facilityId, token });
      setClaimStorageAvailable(result.ok && result.data?.available === true);
    } catch {
      setClaimStorageAvailable(false);
    }
  };

  const openClaimDraft = () => {
    if (!claimResult) return;
    setClaimActionState('idle');
    setClaimActionError('');
    setClaimUploadState('idle');
    setClaimUploadError('');
    setClaimSubmitState(claimResult.state === 'submitted' ? 'success' : 'idle');
    setClaimSubmitError('');
    void loadClaimStorageStatus(claimResult.facilityId);
    setPanel('claim');
  };

  const cancelClaimDraft = async () => {
    if (!claimResult) return;
    setClaimActionState('loading');
    setClaimActionError('');
    try {
      const token = await getAuthToken();
      if (!token) {
        setClaimActionState('error');
        setClaimActionError('Votre session doit être réouverte avant d’annuler le brouillon.');
        return;
      }
      const result = await cancelFacilityClaim({ requestId: claimResult.requestId, version: claimResult.version, token });
      if (!result.ok || !result.data) {
        setClaimActionState('error');
        setClaimActionError(result.error?.message ?? 'Le brouillon ne peut pas être annulé depuis cette session.');
        return;
      }
      setSelectedFacility((current) => current ? { ...current, trust: 'unclaimed' } : current);
      setClaimResult(null);
      setClaimEvidence([]);
      setClaimState('idle');
      setClaimActionState('idle');
      setClaimUploadState('idle');
      setClaimSubmitState('idle');
      setClaimStorageAvailable(null);
      setPanel('facility');
    } catch (caught) {
      setClaimActionState('error');
      setClaimActionError(caught instanceof Error ? caught.message : 'Le brouillon ne peut pas être annulé pour le moment.');
    }
  };

  const uploadClaimEvidence = async (evidenceKind: EvidenceKind, file: File) => {
    if (!claimResult || claimResult.state === 'submitted') return;
    if (claimEvidence.length >= 12) {
      setClaimUploadState('error');
      setClaimUploadError('Un claim peut contenir au maximum 12 preuves privées.');
      return;
    }
    setClaimUploadState('uploading');
    setClaimUploadProgress(0);
    setClaimUploadError('');
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Votre session doit être réouverte avant d’ajouter une preuve.');
      const evidence = await uploadFacilityEvidence({ requestId: claimResult.requestId, evidenceKind, file, token, onProgress: setClaimUploadProgress });
      setClaimEvidence((current) => [...current, evidence]);
      setClaimUploadState('idle');
      setClaimUploadProgress(100);
    } catch (caught) {
      setClaimUploadState('error');
      setClaimUploadError(caught instanceof Error ? caught.message : 'La preuve privée n’a pas pu être téléversée.');
    }
  };

  const removeClaimEvidence = (index: number) => {
    if (claimResult?.state === 'submitted') return;
    setClaimEvidence((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const submitClaimEvidence = async () => {
    if (!claimResult || claimEvidence.length === 0 || claimResult.state === 'submitted') return;
    setClaimSubmitState('loading');
    setClaimSubmitError('');
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Votre session doit être réouverte avant la soumission.');
      const result = await submitFacilityClaim({ requestId: claimResult.requestId, version: claimResult.version, evidence: claimEvidence, token });
      if (!result.ok || !result.data) {
        setClaimSubmitState('error');
        setClaimSubmitError(result.error?.message ?? 'La soumission n’a pas été acceptée par le serveur.');
        return;
      }
      setClaimResult(result.data);
      setClaimStorageAvailable(true);
      setClaimSubmitState('success');
    } catch (caught) {
      setClaimSubmitState('error');
      setClaimSubmitError(caught instanceof Error ? caught.message : 'La soumission n’a pas pu être terminée.');
    }
  };

  const startFacilityClaim = async (facility: PublicFacility) => {
    setClaimState('loading');
    setClaimError('');
    setClaimResult(null);
    setClaimEvidence([]);
    setClaimUploadState('idle');
    setClaimUploadError('');
    setClaimSubmitState('idle');
    setClaimSubmitError('');
    if (!sessionUser) {
      setClaimState('idle');
      openAuth('sign-in', 'none');
      return;
    }
    try {
      const token = await getAuthToken();
      if (!token) {
        setClaimState('error');
        setClaimError('Votre session doit être réouverte avant de commencer la revendication.');
        return;
      }
      const result = await createFacilityClaimDraft({ facilityId: facility.id, token });
      if (!result.ok || !result.data) {
        setClaimState('error');
        setClaimError(result.error?.message ?? 'Cette facilité ne peut pas commencer une revendication.');
        return;
      }
      setClaimResult(result.data);
      void loadClaimStorageStatus(result.data.facilityId);
      setClaimActionState('idle');
      setClaimActionError('');
      setClaimState('success');
    } catch (caught) {
      setClaimState('error');
      setClaimError(caught instanceof Error ? caught.message : 'Cette facilité ne peut pas commencer une revendication.');
    }
  };

  const openSellerRequest = (request: SellerAvailabilityRequest) => {
    setSellerRequest(request);
    setSellerResponseStatus(request.responseStatus === 'partial' || request.responseStatus === 'unavailable' ? request.responseStatus : 'available');
    setSellerQuantity(request.responseStatus === 'unavailable' ? 0 : Math.max(1, request.requestedQuantity));
    setSellerPrice(request.budgetMinor !== null ? (request.budgetMinor / 100).toFixed(2) : '');
    setSellerMessage('');
    setSellerResponseState('idle');
    setSellerResponseError('');
    setSellerResponseResult(null);
  };

  const confirmSellerPayment = async () => {
    if (!sellerTransactionId.trim()) return;
    setSellerPaymentState('loading');
    setSellerPaymentError('');
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Votre session doit être réouverte avant de confirmer le paiement.');
      const result = await confirmExternalPayment({ transactionId: sellerTransactionId.trim(), token });
      if (!result.ok || !result.data) {
        setSellerPaymentState('error');
        setSellerPaymentError(result.error?.message ?? 'Le paiement ne peut pas encore être confirmé.');
        return;
      }
      setSellerTransactionState('payment_confirmed');
      setSellerPaymentState('success');
    } catch (caught) {
      setSellerPaymentState('error');
      setSellerPaymentError(caught instanceof Error ? caught.message : 'Le paiement ne peut pas encore être confirmé.');
    }
  };

  const advanceSellerTransaction = async (to: Extract<TransactionState, 'fulfilment_pending' | 'fulfilled'>) => {
    if (!sellerTransactionId.trim()) return;
    setSellerTransitionState('loading');
    setSellerTransitionError('');
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Votre session doit être réouverte avant de faire progresser la transaction.');
      const result = await transitionTransaction({ transactionId: sellerTransactionId.trim(), from: sellerTransactionState, to, actorRole: 'seller', token });
      if (!result.ok || !result.data) {
        setSellerTransitionState('error');
        setSellerTransitionError(result.error?.message ?? 'La transaction a changé d’état. Actualisez le handoff.');
        return;
      }
      setSellerTransactionState(to);
      setSellerTransitionState('success');
    } catch (caught) {
      setSellerTransitionState('error');
      setSellerTransitionError(caught instanceof Error ? caught.message : 'La transaction a changé d’état.');
    }
  };

  const loadTransactionChat = async (transactionId: string) => {
    if (!authClient || !transactionId) return;
    setTransactionMessagesState('loading');
    setTransactionMessagesError('');
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Votre session doit être réouverte pour accéder au chat.');
      const result = await getTransactionMessages({ transactionId, token });
      if (!result.ok || !result.data) throw new Error(result.error?.message ?? 'Le chat transactionnel est indisponible.');
      setTransactionMessages(result.data.messages);
      setTransactionMessagesState('idle');
    } catch (caught) {
      setTransactionMessagesState('error');
      setTransactionMessagesError(caught instanceof Error ? caught.message : 'Le chat transactionnel est indisponible.');
    }
  };

  const sendTransactionChatMessage = async (transactionId: string, body: string) => {
    if (!authClient || !transactionId || !body.trim()) return;
    setTransactionMessageSending(true);
    setTransactionMessagesError('');
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Votre session doit être réouverte pour envoyer un message.');
      const result = await sendTransactionMessage({ transactionId, body, token });
      if (!result.ok || !result.data) throw new Error(result.error?.message ?? 'Le message n’a pas pu être envoyé.');
      setTransactionMessages((current) => [...current, result.data!]);
      setTransactionMessagesState('idle');
    } catch (caught) {
      setTransactionMessagesError(caught instanceof Error ? caught.message : 'Le message n’a pas pu être envoyé.');
      setTransactionMessagesState('error');
    } finally {
      setTransactionMessageSending(false);
    }
  };

  const issueBuyerQr = async () => {
    if (!purchaseIntent?.transactionId) {
      setBuyerQrState('error');
      setBuyerQrError('Créez d’abord une intention d’achat avant de générer le QR transactionnel.');
      return;
    }
    setBuyerQrState('loading');
    setBuyerQrError('');
    try {
      const token = await getAuthToken();
      if (!token) {
        setBuyerQrState('error');
        setBuyerQrError('Votre session doit être réouverte avant de générer le QR.');
        return;
      }
      const result = await issueBuyerQrToken({ transactionId: purchaseIntent.transactionId, token });
      if (!result.ok || !result.data) {
        setBuyerQrState('error');
        setBuyerQrError(result.error?.message ?? 'Le QR transactionnel ne peut pas être généré.');
        return;
      }
      setBuyerQrResult(result.data);
      setBuyerTransactionState('qr_ready');
      setBuyerQrState('success');
    } catch (caught) {
      setBuyerQrState('error');
      setBuyerQrError(caught instanceof Error ? caught.message : 'Le QR transactionnel ne peut pas être généré pour le moment.');
    }
  };

  const verifySellerQr = async () => {
    setSellerVerifyState('loading');
    setSellerVerifyError('');
    setSellerVerification(null);
    try {
      const raw = sellerQrPayload.trim();
      let transactionId = sellerTransactionId.trim();
      let presentedToken = raw;
      try {
        const parsed = JSON.parse(raw) as { transactionId?: unknown; token?: unknown };
        if (typeof parsed.transactionId === 'string') transactionId = parsed.transactionId;
        if (typeof parsed.token === 'string') presentedToken = parsed.token;
      } catch {
        const parts = raw.split('|');
        if (parts.length === 3 && parts[0] === 'OMNI1') {
          transactionId = parts[1];
          presentedToken = parts[2];
        }
      }
      if (!transactionId || presentedToken.length < 16) throw new Error('Collez le payload QR Omni ou indiquez le transaction ID et le token.');
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(presentedToken));
      const tokenHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
      const token = await getAuthToken();
      if (!token) throw new Error('Votre session doit être réouverte avant de vérifier le QR.');
      const result = await verifyQrToken({ transactionId, tokenHash, token });
      if (!result.ok || !result.data?.accepted) {
        setSellerVerifyState('error');
        setSellerVerifyError(result.error?.message ?? 'QR invalide, expiré ou déjà utilisé.');
        return;
      }
      setSellerTransactionId(transactionId);
      setSellerVerification(result.data);
      setSellerTransactionState('qr_verified');
      setSellerVerifyState('success');
    } catch (caught) {
      setSellerVerifyState('error');
      setSellerVerifyError(caught instanceof Error ? caught.message : 'QR invalide, expiré ou déjà utilisé.');
    }
  };

  const submitSellerResponse = async () => {
    if (!sellerRequest || !authClient) {
      openAuth('sign-in', 'seller-entry');
      return;
    }
    setSellerResponseState('loading');
    setSellerResponseError('');
    try {
      const token = await getAuthToken();
      if (!token) {
        setSellerResponseState('error');
        setSellerResponseError('Votre session doit être réouverte avant de répondre.');
        return;
      }
      const quantityAvailable = sellerResponseStatus === 'unavailable' ? 0 : Math.max(1, sellerQuantity);
      const parsedPrice = sellerPrice.trim() === '' ? null : Math.round(Number(sellerPrice) * 100);
      if (sellerResponseStatus !== 'unavailable' && (!Number.isFinite(parsedPrice) || parsedPrice === null || parsedPrice < 0)) {
        setSellerResponseState('error');
        setSellerResponseError('Indiquez un prix valide pour une réponse disponible.');
        return;
      }
      const result = await requestSellerAvailabilityResponse({
        requestId: sellerRequest.id,
        facilityId: sellerRequest.facilityId,
        productId: sellerRequest.productId,
        status: sellerResponseStatus,
        quantityAvailable,
        priceMinor: sellerResponseStatus === 'unavailable' ? null : parsedPrice,
        sellerMessage: sellerMessage.trim() || null,
        token,
        idempotencyKey: `seller-response-${sellerRequest.id}-${sellerResponseStatus}-${quantityAvailable}-${parsedPrice ?? 'none'}`,
      });
      if (!result.ok || !result.data) {
        setSellerResponseState('error');
        setSellerResponseError(result.error?.message ?? 'La réponse vendeur n’a pas pu être enregistrée.');
        return;
      }
      setSellerResponseResult({ status: result.data.status, observedAt: result.data.observedAt });
      setSellerResponseState('success');
      setSellerRequest((current) => current ? { ...current, responseStatus: result.data?.status ?? current.responseStatus, responseObservedAt: result.data?.observedAt ?? current.responseObservedAt } : current);
      setSellerQueue((current) => current ? { ...current, requests: current.requests.map((request) => request.id === sellerRequest.id ? { ...request, responseStatus: result.data?.status ?? request.responseStatus, responseObservedAt: result.data?.observedAt ?? request.responseObservedAt } : request) } : current);
    } catch (caught) {
      setSellerResponseState('error');
      setSellerResponseError(caught instanceof Error ? caught.message : 'La réponse vendeur n’a pas pu être enregistrée.');
    }
  };

  const beginSearch = (event?: FormEvent) => {
    event?.preventDefault();
    if (!sessionUser) {
      openAuth('sign-in');
      return;
    }
    facilityQueryKeyRef.current = null;
    setMapState('loading');
    setSearchRevealRevision((revision) => revision + 1);
    setAppliedOptions(draftOptions);
    setCommittedQuery(query.trim());
    setShowAllResults(true);
    setNearbyOpen(true);
    setNearbyCollapsed(false);
    setOptionsOpen(false);
    setMenuOpen(false);
    setError('');
  };

  const applyOptions = () => {
    if (!sessionUser) {
      openAuth('sign-in');
      return;
    }
    facilityQueryKeyRef.current = null;
    setMapState('loading');
    setSearchRevealRevision((revision) => revision + 1);
    setAppliedOptions(draftOptions);
    setCommittedQuery(query.trim());
    setShowAllResults(true);
    setNearbyOpen(true);
    setNearbyCollapsed(false);
    setOptionsOpen(false);
    setError('');
  };

  const clearOptions = () => {
    setDraftOptions(emptySearchOptions);
    setQuantity(1);
    setBudgetMode('unlimited');
    setBudget('');
  };

  const resetSearch = () => {
    setQuery('');
    setCommittedQuery('');
    setSearchRevealRevision((revision) => revision + 1);
    setDraftOptions(emptySearchOptions);
    setAppliedOptions(emptySearchOptions);
    setQuantity(1);
    setBudgetMode('unlimited');
    setBudget('');
    setBounds(undefined);
    setShowAllResults(false);
    setNearbyOpen(false);
    setNearbyCollapsed(false);
    setOptionsOpen(false);
    setMenuOpen(false);
  };

  const openNewSearch = () => {
    resetSearch();
    window.setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  const clearFacilityFocus = () => {
    setSelectedFacility(null);
    setSelectedProductId(null);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  };

  const collapseNearbyResults = () => {
    clearFacilityFocus();
    setNearbyCollapsed(true);
  };

  const closeNearbyResults = () => {
    clearFacilityFocus();
    setNearbyOpen(false);
    setNearbyCollapsed(false);
    setShowAllResults(false);
  };

  const closeFacilityContext = () => {
    clearFacilityFocus();
    setPanel('none');
  };

  const retryPublicFacilities = () => {
    facilityQueryKeyRef.current = null;
    setSearchRevealRevision((revision) => revision + 1);
    setBounds((current) => current ? [...current] as [number, number, number, number] : undefined);
  };

  const selectFacility = useCallback(async (facility: PublicFacility, verify = false) => {
    setMenuOpen(false);
    if (facility.source === 'osm') {
      setSelectedFacility({ ...facility, products: [] });
      setSelectedProductId(null);
      setDetailState('idle');
      setPanel('facility');
      return;
    }
    setOptionsOpen(false);
    const requestNumber = detailRequestRef.current + 1;
    detailRequestRef.current = requestNumber;
    setPanel('facility');
    setSelectedFacility(null);
    setSelectedProductId(null);
    setDetailState('loading');
    setError('');
    const result = await getFacilityDetail(facility.id);
    if (detailRequestRef.current !== requestNumber) return;
    if (!result.ok || !result.data) {
      setDetailState('error');
      setError(result.error?.message ?? 'Cette facilité ne peut pas être ouverte.');
      return;
    }
    setSelectedFacility(result.data);
    setDetailState('idle');
    if (verify && result.data.products.length > 0) {
      setSelectedProductId(result.data.products[0].id);
      setAvailabilityStep(1);
      availabilityKeyRef.current = null;
      setAvailability(null);
      setResponseData(null);
      setResponseState('idle');
      setResponseError('');
      setPurchaseIntent(null);
      setPurchaseIntentState('idle');
      setPurchaseIntentError('');
      setPaymentMethod('mobile_money');
      setPaymentState('idle');
      setPaymentError('');
      setBuyerTransactionState('intent_created');
      setRequestState('idle');
      if (sessionUser) setPanel('availability');
    }
  }, [sessionUser]);

  const openAvailability = () => {
    if (!selectedFacility?.products.length) return;
    setAvailabilityStep(1);
    availabilityKeyRef.current = null;
    setSelectedProductId(selectedProductId ?? selectedFacility.products[0].id);
    setQuantity(Math.max(1, quantity));
    setAvailability(null);
    setResponseData(null);
    setResponseState('idle');
    setResponseError('');
    setPurchaseIntent(null);
    setPurchaseIntentState('idle');
    setPurchaseIntentError('');
    setRequestState('idle');
    if (!sessionUser) {
      openAuth('sign-in', 'availability');
      return;
    }
    setPanel('availability');
  };

  const submitAvailability = async () => {
    if (!selectedFacility || !selectedProduct || !authClient) {
      openAuth('sign-in', 'availability');
      return;
    }
    setRequestState('loading');
    setError('');
    try {
      const token = await getAuthToken();
      if (!token) {
        openAuth('sign-in', 'availability');
        setRequestState('idle');
        return;
      }
      const numericBudget = budgetMode === 'maximum' && budget && Number.isFinite(Number(budget)) ? Math.round(Number(budget) * 100) : null;
      const requestShape = `${selectedFacility.id}-${selectedProduct.id}-${quantity}-${budgetMode}-${numericBudget ?? 'none'}`;
      if (!availabilityKeyRef.current || availabilityKeyRef.current.shape !== requestShape) {
        availabilityKeyRef.current = { shape: requestShape, key: `availability-${requestShape}-${crypto.randomUUID()}` };
      }
      const result = await requestAvailability({
        productId: selectedProduct.id,
        facilityId: selectedFacility.id,
        quantity,
        budgetMode,
        budgetMinor: numericBudget,
        token,
        idempotencyKey: availabilityKeyRef.current.key,
      });
      if (result.ok && result.data) {
        setAvailability(result.data);
        setRequestState('idle');
        setAvailabilityStep(4);
        void refreshResponses(result.data.requestId);
      } else {
        setRequestState('error');
        setError(result.error?.message ?? 'La demande de disponibilité n’a pas pu être envoyée.');
      }
    } catch (caught) {
      setRequestState('error');
      setError(caught instanceof Error ? caught.message : 'La demande de disponibilité n’a pas pu être envoyée.');
    }
  };

  const createIntentFromResponse = async (responseId: string) => {
    if (!authClient) {
      openAuth('sign-in', 'availability');
      return;
    }
    setPurchaseIntentState('loading');
    setPurchaseIntentError('');
    try {
      const token = await getAuthToken();
      if (!token) {
        setPurchaseIntentState('error');
        setPurchaseIntentError('Votre session doit être réouverte avant de choisir cette offre.');
        return;
      }
      const result = await createPurchaseIntent({ responseId, token, idempotencyKey: `purchase-intent-${responseId}` });
      if (!result.ok || !result.data) {
        setPurchaseIntentState('error');
        setPurchaseIntentError(result.error?.message ?? 'Cette offre ne peut plus être choisie. Actualisez les réponses.');
        return;
      }
      setPurchaseIntent(result.data);
      setPurchaseIntentState('success');
    } catch (caught) {
      setPurchaseIntentState('error');
      setPurchaseIntentError(caught instanceof Error ? caught.message : 'Cette offre ne peut plus être choisie.');
    }
  };

  const declareBuyerPayment = async () => {
    if (!purchaseIntent) return;
    setPaymentState('loading');
    setPaymentError('');
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Votre session doit être réouverte avant de déclarer le paiement.');
      const result = await declareExternalPayment({ transactionId: purchaseIntent.transactionId, method: paymentMethod, token });
      if (!result.ok || !result.data) {
        setPaymentState('error');
        setPaymentError(result.error?.message ?? 'Le paiement sera disponible après la vérification QR du vendeur.');
        return;
      }
      setBuyerTransactionState('payment_declared');
      setPaymentState('success');
    } catch (caught) {
      setPaymentState('error');
      setPaymentError(caught instanceof Error ? caught.message : 'Le paiement ne peut pas encore être déclaré.');
    }
  };

  const markBuyerReceived = async () => {
    if (!purchaseIntent) return;
    setPaymentState('loading');
    setPaymentError('');
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Votre session doit être réouverte avant de confirmer la réception.');
      const result = await transitionTransaction({ transactionId: purchaseIntent.transactionId, from: 'fulfilled', to: 'received', actorRole: 'buyer', token });
      if (!result.ok || !result.data) {
        setPaymentState('error');
        setPaymentError(result.error?.message ?? 'La réception sera disponible après la remise vendeur.');
        return;
      }
      setBuyerTransactionState('received');
      setPaymentState('success');
    } catch (caught) {
      setPaymentState('error');
      setPaymentError(caught instanceof Error ? caught.message : 'La réception ne peut pas encore être confirmée.');
    }
  };

  const submitBuyerRating = async () => {
    if (!purchaseIntent) return;
    setRatingState('loading');
    setRatingError('');
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Votre session doit être réouverte avant de laisser un avis.');
      const result = await submitTransactionRating({ transactionId: purchaseIntent.transactionId, score: ratingScore, note: ratingNote.trim(), token });
      if (!result.ok || !result.data) {
        setRatingState('error');
        setRatingError(result.error?.message ?? 'L’avis n’a pas pu être enregistré.');
        return;
      }
      setBuyerTransactionState('rated');
      setRatingState('success');
    } catch (caught) {
      setRatingState('error');
      setRatingError(caught instanceof Error ? caught.message : 'L’avis n’a pas pu être enregistré.');
    }
  };

  const refreshResponses = async (requestId = availability?.requestId) => {
    if (!requestId || !authClient) return;
    setResponseState('loading');
    setResponseError('');
    try {
      const token = await getAuthToken();
      if (!token) {
        setResponseState('error');
        setResponseError('Votre session doit être réouverte pour voir les réponses.');
        return;
      }
      const result = await getAvailabilityResponses({ requestId, token });
      if (result.ok && result.data) {
        setResponseData(result.data);
        setResponseState('ready');
      } else {
        setResponseState('error');
        setResponseError(result.error?.message ?? 'Les réponses ne peuvent pas être actualisées pour le moment.');
      }
    } catch (caught) {
      setResponseState('error');
      setResponseError(caught instanceof Error ? caught.message : 'Les réponses ne peuvent pas être actualisées pour le moment.');
    }
  };

  const submitAuth = async (event: FormEvent) => {
    event.preventDefault();
    if (!authClient) {
      setAuthError('Neon Auth n’est pas configuré dans cet environnement.');
      return;
    }
    setAuthState('loading');
    setAuthError('');
    try {
      const result = authMode === 'sign-up'
        ? await authClient.signUp.email({ name: authName || authEmail.split('@')[0] || 'Omni user', email: authEmail, password: authPassword })
        : await authClient.signIn.email({ email: authEmail, password: authPassword });
      if (result.error) throw new Error(result.error.message);
      let user = sessionUserFromAuthResult(result);
      if (!user) {
        for (const delay of [0, 180, 420, 800]) {
          if (delay > 0) await new Promise((resolve) => window.setTimeout(resolve, delay));
          const session = await authClient.getSession();
          user = sessionUserFromAuthResult(session);
          if (user) break;
        }
      }
      if (!user) throw new Error('Auth succeeded but no active session was returned. Réessayez une fois si votre navigateur termine encore la synchronisation.');
      setSessionUser(user);
      setAppliedOptions(draftOptions);
      setAuthState('idle');
      const resumePanel = authReturn === 'availability' ? 'availability' : authReturn === 'buyer-requests' ? 'buyer-requests' : authReturn === 'seller-entry' ? 'seller-entry' : authReturn === 'field-pilot' ? 'field-pilot' : authReturn === 'claim' ? 'claim' : authReturn === 'inbox' ? 'inbox' : authReturn === 'reviewer' ? 'reviewer' : 'none';
      setAuthReturn('none');
      setPanel(resumePanel);
      if (resumePanel === 'buyer-requests') {
        setBuyerRequestsState('idle');
        void loadBuyerRequests();
      }
      if (resumePanel === 'seller-entry') {
        setSellerRequest(null);
        setSellerTab('requests');
        setSellerQrPayload('');
        setSellerVerification(null);
        setSellerVerifyState('idle');
        void loadSellerQueue();
      }
      if (resumePanel === 'field-pilot') {
        setFieldPilotResult(null);
        void loadOperatorRuns();
      }
      if (resumePanel === 'inbox') {
        void loadInbox();
      }
      if (resumePanel === 'reviewer') {
        void loadReviewerQueue();
      }
      if (query.trim()) setCommittedQuery(query.trim());
    } catch (caught) {
      setAuthState('error');
      setAuthError(caught instanceof Error ? caught.message : 'Authentication failed.');
    }
  };

  const signOut = async () => {
    await authClient?.signOut();
    setSessionUser(null);
    setCommittedQuery('');
    setQuery('');
    setAppliedOptions(emptySearchOptions);
    setDraftOptions(emptySearchOptions);
    setMenuOpen(false);
    setPanel('none');
  };

  const mainClass = `species-app${optionsOpen ? ' options-is-open' : ''}${menuOpen ? ' menu-is-open' : ''}`;
  const visibleFacilities = facilities.slice(0, showAllResults ? 8 : 3);
  const handleRevealStateChange = useCallback((active: boolean) => setRevealActive(active), []);

  useEffect(() => {
    const media = window.matchMedia('(display-mode: standalone)');
    const handleInstalled = () => setInstalled(media.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    handleInstalled();
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const installOmni = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  useEffect(() => {
    if (!purchaseIntent || panel !== 'availability') return;
    let cancelled = false;
    let timer: number | undefined;
    const poll = async () => {
      try {
        const token = await getAuthToken();
        if (!token) return;
        const result = await getTransaction({ transactionId: purchaseIntent.transactionId, token });
        if (!cancelled && result.ok && result.data) setBuyerTransactionState(result.data.state);
      } finally {
        if (!cancelled && buyerTransactionState !== 'received' && buyerTransactionState !== 'closed') timer = window.setTimeout(() => void poll(), 3500);
      }
    };
    void poll();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [buyerTransactionState, panel, purchaseIntent]);

  useEffect(() => {
    const app = appRef.current;
    const sheet = nearbySheetRef.current;
    if (!app) return;
    if (!sheet) {
      app.style.removeProperty('--nearby-sheet-offset');
    } else {
      const updateDockBand = () => {
        const sheetTop = sheet.getBoundingClientRect().top;
        app.style.setProperty('--nearby-sheet-offset', `${dockBandOffset(window.innerWidth, window.innerHeight, sheetTop)}px`);
      };
      updateDockBand();
      const observer = new ResizeObserver(updateDockBand);
      observer.observe(sheet);
      window.addEventListener('resize', updateDockBand);
      return () => {
        observer.disconnect();
        window.removeEventListener('resize', updateDockBand);
        app.style.removeProperty('--nearby-sheet-offset');
      };
    }
  }, [mapState, nearbyOpen, nearbyCollapsed, revealActive, showAllResults, visibleFacilities.length]);

  const searchRevealKey = committedQuery.trim() && mapState === 'ready'
    ? `${searchRevealRevision}|${committedQuery}|${JSON.stringify(appliedOptions)}|${facilities.map((facility) => facility.id).join(',')}`
    : null;

  return (
    <main ref={appRef} className={`omni-stage-viewport ${mainClass}`} data-auth={authClient ? 'configured' : 'missing'}>
      <TrunkMap facilities={facilities} selectedId={selectedFacility?.id ?? null} onSelect={selectFacility} onBoundsChange={setBounds} onRevealStateChange={handleRevealStateChange} revealKey={searchRevealKey} contextSurfaceOpen={nearbyOpen || optionsOpen || menuOpen || panel !== 'none'} />

      <header className="species-topbar">
        <div className="role-switch" aria-label="Omni role context">
          <button className="role-option active" type="button" aria-current="page">Acheter</button>
          <button className={`role-option${panel === 'seller-entry' ? ' active' : ''}`} type="button" aria-current={panel === 'seller-entry' ? 'page' : undefined} onClick={openSellerEntry}>Vendre</button>
        </div>
        <button className="account-orb" type="button" aria-label="Ouvrir le compte et le menu Omni" aria-expanded={menuOpen} aria-controls="omni-menu" onClick={() => { setMenuOpen((open) => !open); setOptionsOpen(false); }}>
          {sessionUser ? (sessionUser.name?.slice(0, 2).toUpperCase() || 'OM') : 'J5'}
        </button>
      </header>

      {menuOpen && <aside id="omni-menu" className="account-menu" role="menu" aria-label="Menu Omni">
        <div className="menu-brand"><img src="/omni-logo-compact.png" alt="" /><div><strong>omni</strong><small>{sessionUser ? 'Votre espace' : 'See before you move'}</small></div><button type="button" onClick={() => setMenuOpen(false)} aria-label="Fermer le menu"><X size={16} /></button></div>
        <p>{sessionUser ? 'Votre compte est prêt pour vérifier les disponibilités.' : 'Explorez les lieux publics. Créez votre compte pour rechercher et vérifier.'}</p>
        {!sessionUser ? <button className="menu-action" type="button" role="menuitem" onClick={() => openAuth('sign-in')}><LogIn size={16} /> Se connecter ou créer un compte</button> : <><button className="menu-action" type="button" role="menuitem" onClick={openBuyerRequests}><Clock3 size={16} /> Mes demandes</button><button className="menu-action" type="button" role="menuitem" onClick={openInbox}><Clock3 size={16} /> Inbox Omni</button>{accountCapabilities?.operator && <button className="menu-action" type="button" role="menuitem" onClick={openFieldPilot}><MapPin size={16} /> Outils terrain Omni</button>}{accountCapabilities?.reviewer && <button className="menu-action" type="button" role="menuitem" onClick={openReviewer}><ShieldCheck size={16} /> Revue des claims</button>}<button className="menu-action" type="button" role="menuitem" onClick={signOut}><LogOut size={16} /> Se déconnecter</button></>}{installPrompt && !installed && <button className="menu-action" type="button" role="menuitem" onClick={() => void installOmni}><Download size={16} /> Installer Omni</button>}{installed && <div className="menu-install-note" role="status">Omni est installé sur cet appareil.</div>}
        <button className="menu-action secondary" type="button" role="menuitem" onClick={resetSearch}><MapPin size={16} /> Réinitialiser la carte</button>
      </aside>}

      {mapState === 'error' && <div className="map-error" role="alert"><span>{error}</span><button type="button" onClick={retryPublicFacilities}>Réessayer</button></div>}

      {panel === 'none' && <>
        <div className="search-anchor omni-keyboard-aware">
          {optionsOpen && <SearchOptionsPopover category={draftOptions.category} categoryOptions={categoryOptions} setCategory={(category) => setDraftOptions({ category })} quantity={quantity} setQuantity={setQuantity} budgetMode={budgetMode} setBudgetMode={setBudgetMode} budget={budget} setBudget={setBudget} onClear={clearOptions} onApply={applyOptions} onClose={() => setOptionsOpen(false)} />}
          <form className="search-pill" aria-label="Recherche Omni" onSubmit={beginSearch}>
            <Search size={17} aria-hidden="true" />
            <input ref={searchInputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un commerce, un produit…" aria-label="Rechercher un commerce ou un produit" />
            <button className="pill-submit" type="submit" aria-label="Rechercher"><ArrowRight size={17} /></button>
            <button className="pill-options" type="button" aria-expanded={optionsOpen} aria-controls="search-options" aria-label={optionsOpen ? 'Fermer les options' : 'Ouvrir les options'} onClick={() => { setOptionsOpen((open) => !open); setMenuOpen(false); }}><ChevronDown size={17} className={optionsOpen ? 'chevron-up' : ''} /></button>
          </form>
        </div>
        {nearbyOpen && !revealActive && <NearbySheet ref={nearbySheetRef} facilities={visibleFacilities} mapState={mapState} committedQuery={committedQuery} collapsed={nearbyCollapsed} onCollapse={collapseNearbyResults} onExpand={() => setNearbyCollapsed(false)} onClose={closeNearbyResults} onNewSearch={openNewSearch} onRefine={() => { setOptionsOpen(true); setMenuOpen(false); }} onOpenFacility={(facility) => selectFacility(facility)} onVerify={(facility) => selectFacility(facility, true)} onShowAll={() => { setShowAllResults(true); setNearbyOpen(true); setNearbyCollapsed(false); }} showAll={showAllResults} />}
      </>}

      {panel !== 'none' && <div className="sheet-backdrop" onClick={() => { if (panel === 'auth') return; if (panel === 'availability') { setPanel('facility'); return; } if (panel === 'facility' || panel === 'claim') { closeFacilityContext(); return; } setPanel('none'); }} />}
      {panel === 'auth' && <AuthSheet mode={authMode} setMode={setAuthMode} email={authEmail} setEmail={setAuthEmail} password={authPassword} setPassword={setAuthPassword} name={authName} setName={setAuthName} state={authState} error={authError} onSubmit={submitAuth} onClose={() => { setAuthReturn('none'); setPanel('none'); }} />}
      {panel === 'seller-entry' && <SellerWorkspaceSheet user={sessionUser} queue={sellerQueue} catalogue={sellerCatalogue} wallet={sellerWallet} rechargeState={sellerRechargeState} rechargeError={sellerRechargeError} rechargeResult={sellerRechargeResult} rechargeAmount={sellerRechargeAmount} setRechargeAmount={setSellerRechargeAmount} onRecharge={() => void startSellerWalletRecharge()} proState={sellerProState} proError={sellerProError} proResult={sellerProResult} onActivatePro={(facilityId) => void activateSellerFacilityPro(facilityId)} queueState={sellerQueueState} queueError={sellerQueueError} request={sellerRequest} tab={sellerTab} setTab={setSellerTab} transactionId={sellerTransactionId} setTransactionId={setSellerTransactionId} qrPayload={sellerQrPayload} setQrPayload={setSellerQrPayload} verifyState={sellerVerifyState} verifyError={sellerVerifyError}
 onVerifyQr={() => void verifySellerQr()} verification={sellerVerification} transactionState={sellerTransactionState} paymentState={sellerPaymentState} paymentError={sellerPaymentError} transitionState={sellerTransitionState} transitionError={sellerTransitionError} onConfirmPayment={() => void confirmSellerPayment()} onAdvanceFulfilment={() => void advanceSellerTransaction('fulfilment_pending')} onAdvanceFulfilled={() => void advanceSellerTransaction('fulfilled')} chatMessages={transactionMessages} chatState={transactionMessagesState} chatError={transactionMessagesError} chatSending={transactionMessageSending} onRefreshChat={() => void loadTransactionChat(sellerTransactionId)} onSendChat={(body) => void sendTransactionChatMessage(sellerTransactionId, body)} responseStatus={sellerResponseStatus} setResponseStatus={setSellerResponseStatus} quantity={sellerQuantity} setQuantity={setSellerQuantity} price={sellerPrice} setPrice={setSellerPrice} message={sellerMessage} setMessage={setSellerMessage} responseState={sellerResponseState} responseError={sellerResponseError} responseResult={sellerResponseResult} rebindState={sellerRebindState} rebindError={sellerRebindError} onRebindDemo={() => void rebindSellerDemo()} onLoadQueue={() => void loadSellerQueue()} catalogueMutationState={sellerCatalogueMutationState} catalogueMutationError={sellerCatalogueMutationError} onCatalogueMutation={(action, productId, fields) => void mutateSellerCatalogue(action, productId, fields)} facilityCreateState={sellerFacilityCreateState} facilityCreateError={sellerFacilityCreateError} facilityCreateResult={sellerFacilityCreateResult} onCreateFacility={(input) => void createSellerFacilityFromWorkspace(input)} onSelectRequest={openSellerRequest} onSubmitResponse={() => void submitSellerResponse()} onBackToQueue={() => { setSellerRequest(null); setSellerResponseState('idle'); }} onClose={() => { setSellerRequest(null); setPanel('none'); }} onSignOut={signOut} />}
      {panel === 'field-pilot' && <FieldPilotSheet user={sessionUser} state={fieldPilotState} error={fieldPilotError} runs={operatorRuns} name={fieldPilotName} setName={setFieldPilotName} sourceRef={fieldPilotSourceRef} setSourceRef={setFieldPilotSourceRef} category={fieldPilotCategory} setCategory={setFieldPilotCategory} address={fieldPilotAddress} setAddress={setFieldPilotAddress} latitude={fieldPilotLatitude} setLatitude={setFieldPilotLatitude} longitude={fieldPilotLongitude} setLongitude={setFieldPilotLongitude} result={fieldPilotResult} onSubmit={submitPublicFacilityImport} onRefresh={() => void loadOperatorRuns()} onClose={() => setPanel('none')} osmState={osmDiscoveryState} osmError={osmDiscoveryError} osmRegion={osmDiscoveryRegion} osmItems={osmDiscoveryItems} osmSelectedIds={osmSelectedIds} onDiscover={(region) => void discoverOsmRegion(region)} onToggleOsm={toggleOsmSelection} onImportOsm={() => void importSelectedOsm()} osmBatchState={osmBatchState} osmBatchError={osmBatchError} osmBatchResult={osmBatchResult} />}
      {panel === 'inbox' && <InboxSheet state={inboxState} error={inboxError} data={inboxData} onRefresh={() => void loadInbox()} onSeen={(notificationId) => void markInboxSeen(notificationId)} onClose={() => setPanel('none')} />}
      {panel === 'reviewer' && <ReviewerSheet state={reviewerState} error={reviewerError} queue={reviewerQueue} selected={selectedReview} onSelect={setSelectedReview} outcome={reviewOutcome} setOutcome={setReviewOutcome} reason={reviewReason} setReason={setReviewReason} actionState={reviewActionState} actionError={reviewActionError} actionResult={reviewActionResult} onSubmit={submitReview} onRefresh={() => { void loadReviewerQueue(); void loadSellerActivationQueue(); }} onBack={() => { setSelectedReview(null); setReviewActionState('idle'); }} onClose={() => setPanel('none')} activationQueue={activationQueue} activationQueueState={activationQueueState} activationQueueError={activationQueueError} activationActionState={activationActionState} activationActionError={activationActionError} activationResult={activationResult} onActivateSeller={(accountId) => void activateSeller(accountId)} onActivationRefresh={() => void loadSellerActivationQueue()} statusActionState={statusActionState} statusActionError={statusActionError} onStatusChange={(accountId, suspended, reason) => void changeSellerStatus(accountId, suspended, reason)} />}

      {panel === 'buyer-requests' && <BuyerRequestsSheet user={sessionUser} data={buyerRequests} state={buyerRequestsState} error={buyerRequestsError} onRefresh={() => void loadBuyerRequests()} onResume={(request) => void resumeBuyerRequest(request)} onClose={() => setPanel('none')} />}
      {panel === 'facility' && <FacilitySheet facility={selectedFacility} state={detailState} error={error} claimState={claimState} claimError={claimError} claimResult={claimResult} onClaim={startFacilityClaim} onOpenClaim={openClaimDraft} onClose={closeFacilityContext} onVerify={openAvailability} />}
      {panel === 'claim' && <ClaimSheet facility={selectedFacility} draft={claimResult} evidence={claimEvidence} storageAvailable={claimStorageAvailable} uploadState={claimUploadState} uploadProgress={claimUploadProgress} uploadError={claimUploadError} submitState={claimSubmitState} submitError={claimSubmitError} actionState={claimActionState} actionError={claimActionError} onUpload={(kind, file) => void uploadClaimEvidence(kind, file)} onRemoveEvidence={removeClaimEvidence} onSubmit={submitClaimEvidence} onCancel={cancelClaimDraft} onClose={() => setPanel('facility')} />}
      {panel === 'availability' && <AvailabilitySheet facility={selectedFacility} step={availabilityStep} setStep={setAvailabilityStep} productId={selectedProductId} setProductId={setSelectedProductId} quantity={quantity} setQuantity={setQuantity} budgetMode={budgetMode} setBudgetMode={setBudgetMode} budget={budget} setBudget={setBudget} state={requestState} error={error} result={availability} responseData={responseData} responseState={responseState} responseError={responseError} purchaseIntent={purchaseIntent} purchaseIntentState={purchaseIntentState} purchaseIntentError={purchaseIntentError} buyerQrState={buyerQrState} buyerQrError={buyerQrError} buyerQrResult={buyerQrResult} onIssueBuyerQr={() => void issueBuyerQr()} paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} paymentState={paymentState} paymentError={paymentError} transactionState={buyerTransactionState} onDeclarePayment={() => void declareBuyerPayment()} onMarkReceived={() => void markBuyerReceived()} ratingScore={ratingScore} setRatingScore={setRatingScore} ratingNote={ratingNote} setRatingNote={setRatingNote} ratingState={ratingState} ratingError={ratingError} onSubmitRating={() => void submitBuyerRating()} onChooseResponse={(responseId) => void createIntentFromResponse(responseId)} onRefreshResponses={() => void refreshResponses()} chatMessages={transactionMessages} chatState={transactionMessagesState} chatError={transactionMessagesError} chatSending={transactionMessageSending} onRefreshChat={() => void loadTransactionChat(purchaseIntent?.transactionId ?? '')} onSendChat={(body) => void sendTransactionChatMessage(purchaseIntent?.transactionId ?? '', body)} onClose={() => setPanel('facility')} onSubmit={submitAvailability} />}
    </main>
  );
}

const NearbySheet = forwardRef<HTMLElement, { facilities: PublicFacility[]; mapState: 'loading' | 'ready' | 'empty' | 'error'; committedQuery: string; collapsed: boolean; showAll: boolean; onCollapse: () => void; onExpand: () => void; onClose: () => void; onNewSearch: () => void; onRefine: () => void; onOpenFacility: (facility: PublicFacility) => void; onVerify: (facility: PublicFacility) => void; onShowAll: () => void }>(function NearbySheet(props, ref) {
  const resultLabel = props.committedQuery ? `Résultats pour « ${props.committedQuery} »` : 'Résultats proches';
  return <section ref={ref} className={`nearby-sheet omni-sheet-enter nearby-state-${props.mapState}${props.collapsed ? ' is-collapsed' : ''}`} aria-label={props.collapsed ? `${resultLabel}, repliés` : 'Facilités proches'} aria-busy={props.mapState === 'loading'}>
    {props.collapsed ? <div className="nearby-collapsed-bar"><div className="nearby-collapsed-copy"><span className="section-kicker">Omni</span><strong>{resultLabel}</strong><small>{props.facilities.length} résultat{props.facilities.length === 1 ? '' : 's'} disponible{props.facilities.length === 1 ? '' : 's'}</small></div><button className="nearby-expand" type="button" aria-expanded="false" aria-label="Réouvrir les facilités proches" onClick={props.onExpand}><ChevronUp size={16} /></button></div> : <>
    <button className="sheet-handle-button" type="button" aria-expanded="true" aria-label="Replier les facilités proches" onClick={props.onCollapse}><span className="sheet-handle" /></button>
    <div className="nearby-heading"><div><span className="section-kicker">Omni</span><h1>{props.committedQuery ? `Résultats pour « ${props.committedQuery} »` : 'Proche de vous'}</h1></div><div className="nearby-heading-actions"><button type="button" className="see-all" onClick={props.onShowAll} disabled={props.showAll || !props.facilities.length}>Voir tout</button><button type="button" className="nearby-collapse" aria-expanded="true" aria-label="Replier la grille des facilités" onClick={props.onCollapse}><ChevronDown size={15} className="chevron-up" /></button></div></div>
    {props.mapState === 'loading' && <div key={`loading-${props.committedQuery}`} className="nearby-empty nearby-transition" role="status"><OmniSkeleton lines={2} className="nearby-loading-skeleton" /><span>{props.committedQuery ? `Recherche de « ${props.committedQuery} »…` : 'Recherche de la zone…'}</span></div>}
    {props.mapState === 'error' && <div key="error" className="nearby-empty nearby-transition" role="alert"><strong>Résultats non actualisés</strong><span>La carte continue de fonctionner. Réessayez la recherche ou déplacez la carte.</span></div>}
    {props.mapState === 'empty' && <div key="empty" className="nearby-empty nearby-transition"><strong>{props.committedQuery ? 'Aucun résultat ici' : 'Aucun lieu dans cette vue'}</strong><span>{props.committedQuery ? 'Essayez un autre commerce, produit ou filtre.' : 'Déplacez la carte ou ajustez votre recherche.'}</span></div>}
    {props.mapState === 'ready' && <><div className="nearby-result-toolbar" aria-label="Actions des résultats"><button type="button" className="result-toolbar-button" onClick={props.onNewSearch}><Search size={14} /> Nouvelle recherche</button><button type="button" className="result-toolbar-button secondary" onClick={props.onRefine}>Affiner</button><button type="button" className="result-toolbar-button secondary" onClick={props.onClose}>Retour à la carte</button></div><div key={`ready-${props.committedQuery}-${props.facilities.map((facility) => facility.id).join('-')}`} className="nearby-rail nearby-transition omni-stagger" tabIndex={0} aria-label="Résultats proches">{props.facilities.map((facility) => <article className="nearby-card omni-card-enter" key={facility.id}>
      <button className="nearby-card-main" type="button" onClick={() => props.onOpenFacility(facility)}>
        <span className="facility-card-icon"><MapPin size={17} /></span>
        <span className="nearby-card-copy"><span className="status-pill">{publicBadge(facility)}</span><strong>{facility.name}</strong><small>{facility.category} · Lieu local</small></span>
        <ChevronRight size={16} className="card-chevron" aria-hidden="true" />
      </button>
      <button className="card-cta" type="button" disabled={facility.productCount === 0} onClick={() => props.onVerify(facility)}>{facility.productCount ? 'Vérifier la disponibilité' : 'Voir le lieu'}</button>
      </article>)}</div></>}
    </>}
  </section>;
});

function decodeVapidKey(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  const binary = window.atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
function InboxSheet(props: { state: 'idle' | 'loading' | 'error'; error: string; data: NotificationInboxResult | null; onRefresh: () => void; onSeen: (notificationId: string) => void; onClose: () => void }) {
  const notifications = props.data?.notifications ?? [];
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() => typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);
  const [pushState, setPushState] = useState<'idle' | 'subscribing' | 'ready' | 'configuration' | 'error'>('idle');
  useEffect(() => {
    if (permission !== 'granted') return;
    let active = true;
    void getAuthToken().then((token) => token ? getWebPushStatus({ token }) : null).then((result) => {
      if (active && result?.ok && (result.data?.active ?? 0) > 0) setPushState('ready');
    }).catch(() => undefined);
    return () => { active = false; };
  }, [permission]);
  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) { setPermission('unsupported'); return; }
    const nextPermission = await Notification.requestPermission();
    setPermission(nextPermission);
    if (nextPermission !== 'granted') return;
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidKey) { setPushState('configuration'); return; }
    setPushState('subscribing');
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeVapidKey(vapidKey) as unknown as BufferSource });
      const token = await getAuthToken();
      if (!token) { setPushState('error'); return; }
      const result = await subscribeWebPush({ subscription: subscription.toJSON(), token });
      setPushState(result.ok ? 'ready' : 'error');
    } catch {
      setPushState('error');
    }
  };
  return <section className="omni-sheet omni-sheet-enter omni-keyboard-aware context-sheet inbox-sheet" role="dialog" aria-modal="true" aria-labelledby="inbox-title"><div className="sheet-handle" /><div className="sheet-head"><div><span className="section-kicker">Compte J5</span><h2 id="inbox-title">Inbox Omni</h2></div><button type="button" onClick={props.onClose} aria-label="Fermer"><X size={18} /></button></div><p className="sheet-lede">Les changements de claim et les événements liés à votre compte apparaissent ici. Les notifications PWA restent opt-in.</p>{props.state === 'loading' && <div className="sheet-loading" role="status"><span className="spinner" /> Chargement de l’inbox…</div>}{props.state === 'error' && <div className="inline-error" role="alert">{props.error}<button className="text-button" type="button" onClick={props.onRefresh}>Réessayer</button></div>}{props.state === 'idle' && notifications.length === 0 && <div className="empty-state"><Clock3 size={23} /><strong>Inbox vide</strong><p>Les événements importants de votre compte apparaîtront ici.</p><button className="secondary-button" type="button" onClick={props.onRefresh}>Actualiser</button></div>}{props.state === 'idle' && notifications.length > 0 && <div className="notification-list">{notifications.map((notification) => <article className={`notification-card ${notification.seenAt ? 'seen' : 'unseen'}`} key={notification.id}><span className="notification-icon"><ShieldCheck size={17} /></span><div><strong>{notification.eventType === 'claim_reviewed' ? 'Claim examiné' : 'Événement Omni'}</strong><small>{notification.state === 'delivered' ? 'Vu' : 'Nouveau'} · {new Date(notification.createdAt).toLocaleString()}</small><p>La mise à jour de votre parcours est disponible dans Omni.</p></div>{!notification.seenAt && <button className="text-button" type="button" onClick={() => props.onSeen(notification.id)}>Marquer vu</button>}</article>)}</div>}<div className="locked-note"><ShieldCheck size={17} /><span><strong>Inbox d’abord</strong><small>OSM ne reçoit pas ces événements. Le Web Push sera activé uniquement après consentement PWA.</small></span>{pushState === 'ready' ? <span className="notification-permission" role="status">Appareil inscrit pour les alertes Omni</span> : pushState === 'configuration' ? <span className="notification-permission" role="status">Permission accordée · configuration Push en attente</span> : pushState === 'subscribing' ? <span className="notification-permission" role="status">Inscription de l’appareil…</span> : pushState === 'error' ? <><span className="notification-permission" role="alert">Inscription Push indisponible</span><button className="secondary-button" type="button" onClick={() => void requestNotificationPermission()}>Réessayer</button></> : permission === 'granted' ? <span className="notification-permission" role="status">Permission navigateur accordée</span> : <button className="secondary-button" type="button" onClick={() => void requestNotificationPermission()} disabled={permission === 'denied'}>{permission === 'denied' ? 'Alertes bloquées' : permission === 'unsupported' ? 'Notifications indisponibles' : 'Autoriser les alertes'}</button>}</div></section>;
}

function ReviewerSheet(props: { state: 'idle' | 'loading' | 'error'; error: string; queue: ReviewQueueResult | null; selected: ReviewQueueItem | null; onSelect: (item: ReviewQueueItem) => void; outcome: ReviewOutcome; setOutcome: (outcome: ReviewOutcome) => void; reason: string; setReason: (reason: string) => void; actionState: 'idle' | 'loading' | 'error' | 'success'; actionError: string; actionResult: ReviewClaimResult | null; onSubmit: (event: FormEvent) => void; onRefresh: () => void; onBack: () => void; onClose: () => void; activationQueue: Array<{ accountId: string; authUserId: string; onboardingState: string; facilityCount: number; createdAt: string; suspended: boolean }>; activationQueueState: 'idle' | 'loading' | 'error'; activationQueueError: string; activationActionState: 'idle' | 'loading' | 'error' | 'success'; activationActionError: string; activationResult: { accountId: string; onboardingState: 'seller_ready'; activated: true } | null; onActivateSeller: (accountId: string) => void; onActivationRefresh: () => void; statusActionState: 'idle' | 'loading' | 'error' | 'success'; statusActionError: string; onStatusChange: (accountId: string, suspended: boolean, reason: string) => void }) {
  const [statusReason, setStatusReason] = useState('');
  const requests = props.queue?.requests ?? [];
  return <section className="omni-sheet omni-sheet-enter omni-keyboard-aware context-sheet reviewer-sheet" role="dialog" aria-modal="true" aria-labelledby="reviewer-title"><div className="sheet-handle" /><div className="sheet-head"><div>{props.selected && <button className="back-button" type="button" onClick={props.onBack}><ArrowLeft size={17} /> File</button>}<span className="section-kicker">Équipe Omni · Review</span><h2 id="reviewer-title">Revue des claims</h2></div><button type="button" onClick={props.onClose} aria-label="Fermer"><X size={18} /></button></div><p className="sheet-lede">Chaque membre reviewer décide séparément. Un claim ne devient jamais certifié au clic du claimant.</p><div className="reviewer-workspace-summary"><span className="reviewer-entry-mark"><ShieldCheck size={21} /></span><div><strong>Validation humaine, trace par trace</strong><p>La file affiche uniquement les claims autorisés pour cette session et conserve le contexte public de la facilité.</p></div></div>{props.state === 'loading' && <div className="sheet-loading" role="status"><span className="spinner" /> Vérification de votre rôle reviewer…</div>}{props.state === 'error' && <div className="inline-error" role="alert">{props.error}<button className="text-button" type="button" onClick={props.onRefresh}>Réessayer</button></div>}{props.state !== 'loading' && !props.queue?.authorized && <div className="notice-card"><strong>Rôle reviewer non ouvert</strong><p>Cette session peut être connectée sans pouvoir certifier une facilité. Aucun statut ne sera changé depuis cette surface.</p></div>}{props.state !== 'loading' && props.queue?.authorized && !props.selected && <>{requests.length === 0 ? <div className="empty-state"><CheckCircle2 size={23} /><strong>Aucun claim en attente</strong><p>Les claims soumis apparaîtront ici après la collecte de preuves.</p><button className="secondary-button" type="button" onClick={props.onRefresh}>Actualiser</button></div> : <div className="review-list">{requests.map((item) => <button className="seller-request-card omni-card-enter omni-pressable" type="button" key={item.requestId} onClick={() => props.onSelect(item)}><span className="request-card-icon"><ShieldCheck size={18} /></span><span className="seller-request-copy"><strong>{item.facilityName}</strong><small>{item.state} · {item.facilityTrust}</small><small>Soumis {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : 'en brouillon'}</small><small>{item.evidenceCount} preuve{item.evidenceCount === 1 ? '' : 's'} · {item.evidenceKinds.length ? item.evidenceKinds.join(' · ') : 'catégories non disponibles'}</small></span><ChevronRight size={17} /></button>)}</div>}</>}{props.selected && <form className="review-form" onSubmit={props.onSubmit}><div className="review-selected"><span className="section-kicker">Claim sélectionné</span><strong>{props.selected.facilityName}</strong><small>{props.selected.facilityTrust} · version {props.selected.version}</small><small>{props.selected.evidenceCount} preuve{props.selected.evidenceCount === 1 ? '' : 's'} · {props.selected.evidenceKinds.join(' · ') || 'catégories non disponibles'}</small></div><div className="seller-status-options" role="group" aria-label="Décision de review"><button type="button" className={props.outcome === 'certified' ? 'active' : ''} onClick={() => props.setOutcome('certified')}>Certifier</button><button type="button" className={props.outcome === 'needs_more_evidence' ? 'active' : ''} onClick={() => props.setOutcome('needs_more_evidence')}>Demander des preuves</button><button type="button" className={props.outcome === 'rejected' ? 'active' : ''} onClick={() => props.setOutcome('rejected')}>Rejeter</button></div><label className="seller-message-field">Motif obligatoire<textarea required minLength={3} maxLength={1000} rows={4} value={props.reason} onChange={(event) => props.setReason(event.target.value)} placeholder="Note de review auditée…" /></label>{props.actionError && <div className="inline-error" role="alert">{props.actionError}</div>}{props.actionState === 'success' && props.actionResult ? <div className="claim-success" role="status"><CheckCircle2 size={17} /><span>Décision enregistrée. Le compte claimant recevra un événement dans son inbox.</span></div> : <button className="primary-button omni-pressable" type="submit" disabled={props.actionState === 'loading'}>{props.actionState === 'loading' ? 'Enregistrement…' : 'Enregistrer la décision'} <ArrowRight size={16} /></button>}<p className="privacy-note">La certification lie le compte claimant à la facilité ; les autres outcomes ne confèrent aucune propriété.</p></form>}{!props.selected && props.queue?.authorized && <div className="activation-panel"><div className="seller-list-heading"><div><span className="section-kicker">Activation vendeur</span><strong>Après certification du claim</strong></div><button className="text-button" type="button" onClick={props.onActivationRefresh}>Actualiser</button></div><p className="privacy-note">L’activation est séparée de la certification et ouvre uniquement l’état opérationnel vendeur.</p>{props.activationQueueState === 'loading' && <div className="sheet-loading" role="status"><span className="spinner" /> Chargement des comptes éligibles…</div>}{props.activationQueueState === 'error' && <div className="inline-error" role="alert">{props.activationQueueError}<button className="text-button" type="button" onClick={props.onActivationRefresh}>Réessayer</button></div>}{props.activationActionError && <div className="inline-error" role="alert">{props.activationActionError}</div>}{props.activationActionState === 'success' && props.activationResult && <div className="claim-success" role="status"><CheckCircle2 size={17} /><span>Compte vendeur activé séparément. Un événement a été ajouté à son Inbox.</span></div>}{props.activationQueueState === 'idle' && props.activationQueue.length === 0 && <div className="empty-state compact"><CheckCircle2 size={20} /><strong>Aucun compte à activer</strong><p>Un claim certifié ou rattaché est requis avant l’activation.</p></div>}{props.activationQueueState === 'idle' && props.activationQueue.length > 0 && <div className="review-list">{props.activationQueue.map((candidate) => <div className="seller-request-card omni-card-enter omni-pressable" key={candidate.accountId}><span className="request-card-icon"><ShieldCheck size={18} /></span><span className="seller-request-copy"><strong>{candidate.facilityCount} facilité{candidate.facilityCount === 1 ? '' : 's'} éligible{candidate.facilityCount === 1 ? '' : 's'}</strong><small>{candidate.suspended ? 'suspendu' : candidate.onboardingState} · {new Date(candidate.createdAt).toLocaleDateString()}</small></span>{!candidate.suspended && candidate.onboardingState !== 'seller_ready' && <button className="primary-button omni-pressable" type="button" disabled={props.activationActionState === 'loading'} onClick={() => props.onActivateSeller(candidate.accountId)}>{props.activationActionState === 'loading' ? 'Activation…' : 'Activer vendeur'}</button>}{candidate.suspended ? <button className="secondary-button" type="button" disabled={props.statusActionState === 'loading' || statusReason.trim().length < 3} onClick={() => props.onStatusChange(candidate.accountId, false, statusReason.trim())}>Réactiver</button> : <button className="secondary-button" type="button" disabled={props.statusActionState === 'loading' || statusReason.trim().length < 3} onClick={() => props.onStatusChange(candidate.accountId, true, statusReason.trim())}>Suspendre</button>}</div>)}</div>}<label className="seller-message-field">Motif de suspension/réactivation<textarea minLength={3} maxLength={1000} rows={3} value={statusReason} onChange={(event) => setStatusReason(event.target.value)} placeholder="Raison auditée obligatoire…" /></label>{props.statusActionError && <div className="inline-error" role="alert">{props.statusActionError}</div>}{props.statusActionState === 'success' && <div className="claim-success" role="status"><CheckCircle2 size={17} /><span>Le statut du compte a été mis à jour et l’événement a été ajouté à l’Inbox.</span></div>}</div>}<div className="locked-note"><ShieldCheck size={17} /><span><strong>Validation par l’équipe</strong><small>Plusieurs reviewers peuvent utiliser cette file, mais chaque décision reste identifiée et auditée côté serveur.</small></span></div></section>;
}

function FieldPilotSheet(props: { user: SessionUser | null; state: 'idle' | 'loading' | 'error'; error: string; runs: OperatorRunsResult | null; name: string; setName: (value: string) => void; sourceRef: string; setSourceRef: (value: string) => void; category: string; setCategory: (value: string) => void; address: string; setAddress: (value: string) => void; latitude: string; setLatitude: (value: string) => void; longitude: string; setLongitude: (value: string) => void; result: PublicFacilityImportResult | null; onSubmit: (event: FormEvent) => void; onRefresh: () => void; onClose: () => void; osmState: 'idle' | 'loading' | 'error'; osmError: string; osmRegion: 'lome' | 'aflao' | null; osmItems: DiscoveryFacility[]; osmSelectedIds: string[]; onDiscover: (region: 'lome' | 'aflao') => void; onToggleOsm: (id: string) => void; onImportOsm: () => void; osmBatchState: 'idle' | 'loading' | 'success' | 'error'; osmBatchError: string; osmBatchResult: { imported: number; created: number; existing: number } | null }) {
  const authorized = props.runs?.authorized === true;
  return <section className="omni-sheet omni-sheet-enter omni-keyboard-aware context-sheet field-pilot-sheet" role="dialog" aria-modal="true" aria-labelledby="field-pilot-title"><div className="sheet-handle" /><div className="sheet-head"><div><span className="section-kicker">Équipe Omni · Ring A</span><h2 id="field-pilot-title">Inscrire une facilité</h2></div><button type="button" onClick={props.onClose} aria-label="Fermer"><X size={18} /></button></div><p className="sheet-lede">Ajoutez une présence publique OSM sans lui attribuer un propriétaire. Le claim et la revue restent des étapes séparées.</p><div className="osm-discovery-panel"><div className="seller-list-heading"><div><span className="section-kicker">Import régional</span><strong>Découvrir dans OSM</strong></div><span className="privacy-note">Lomé · Aflao</span></div><p className="privacy-note">Les résultats sont prévisualisés avant toute écriture et restent non revendiqués.</p><div className="option-toggle"><button type="button" className={props.osmRegion === 'lome' ? 'active' : ''} disabled={!authorized || props.osmState === 'loading'} onClick={() => props.onDiscover('lome')}>Découvrir Lomé</button><button type="button" className={props.osmRegion === 'aflao' ? 'active' : ''} disabled={!authorized || props.osmState === 'loading'} onClick={() => props.onDiscover('aflao')}>Découvrir Aflao</button></div>{props.osmState === 'loading' && <div className="sheet-loading" role="status"><span className="spinner" /> Recherche OSM en cours…</div>}{props.osmState === 'error' && <div className="inline-error" role="alert">{props.osmError}</div>}{props.osmItems.length > 0 && <><div className="review-list">{props.osmItems.slice(0, 12).map((item) => <label className="seller-request-card omni-card-enter omni-pressable" key={item.id}><input type="checkbox" checked={props.osmSelectedIds.includes(item.id)} onChange={() => props.onToggleOsm(item.id)} /><span className="seller-request-copy"><strong>{item.name}</strong><small>{item.category} · {item.lat.toFixed(4)}, {item.lng.toFixed(4)}</small></span></label>)}</div><p className="privacy-note">{props.osmItems.length} résultat{props.osmItems.length === 1 ? '' : 's'} trouvé{props.osmItems.length === 1 ? '' : 's'} · {props.osmSelectedIds.length} sélectionné{props.osmSelectedIds.length === 1 ? '' : 's'}</p><button className="primary-button omni-pressable" type="button" disabled={props.osmBatchState === 'loading' || props.osmSelectedIds.length === 0} onClick={props.onImportOsm}>{props.osmBatchState === 'loading' ? 'Import en cours…' : 'Importer la sélection vérifiée'} <ArrowRight size={16} /></button></>}{props.osmBatchState === 'error' && <div className="inline-error" role="alert">{props.osmBatchError}</div>}{props.osmBatchState === 'success' && props.osmBatchResult && <div className="claim-success" role="status"><CheckCircle2 size={17} /><span>{props.osmBatchResult.created} créée{props.osmBatchResult.created === 1 ? '' : 's'}, {props.osmBatchResult.existing} déjà présente{props.osmBatchResult.existing === 1 ? '' : 's'}.</span></div>}</div>{props.state === 'loading' && <div className="sheet-loading" role="status"><span className="spinner" /> Vérification de l’accès terrain…</div>}{props.state === 'error' && <div className="inline-error" role="alert">{props.error}<button className="text-button" type="button" onClick={props.onRefresh}>Réessayer</button></div>}{props.state !== 'loading' && !authorized && <div className="notice-card"><strong>Accès opérateur non ouvert</strong><p>Cette session est connectée, mais le rôle opérateur Omni n’est pas encore accordé. Aucun import ne sera exécuté depuis cette surface.</p></div>}{props.state !== 'loading' && authorized && <form className="field-pilot-form" onSubmit={props.onSubmit}><label>Nom de la facilité<input required maxLength={180} value={props.name} onChange={(event) => props.setName(event.target.value)} placeholder="Nom observé sur le terrain" /></label><label>Référence OSM<input required maxLength={180} value={props.sourceRef} onChange={(event) => props.setSourceRef(event.target.value)} placeholder="node/… ou way/…" /></label><FieldPilotLocationMap latitude={props.latitude} longitude={props.longitude} setLatitude={props.setLatitude} setLongitude={props.setLongitude} /><label>Catégorie<input maxLength={120} value={props.category} onChange={(event) => props.setCategory(event.target.value)} placeholder="Marché, magasin, atelier…" /></label><label>Adresse ou repère<input maxLength={240} value={props.address} onChange={(event) => props.setAddress(event.target.value)} placeholder="Repère utile, sans donnée privée" /></label><button className="primary-button omni-pressable" type="submit">Enregistrer la présence publique <ArrowRight size={16} /></button></form>}{props.result && <div className="claim-success" role="status"><CheckCircle2 size={17} /><span>Présence enregistrée comme non revendiquée. Le catalogue et la confiance restent verrouillés jusqu’aux étapes suivantes.</span></div>}<div className="seller-list-heading"><span className="section-kicker">Runs récents</span><button className="text-button" type="button" onClick={props.onRefresh}>Actualiser</button></div>{props.runs?.runs.length ? <div className="seller-request-list">{props.runs.runs.slice(0, 8).map((run) => <div className="catalogue-item" key={run.id}><span className="product-icon"><MapPin size={16} /></span><span><strong>{run.operation === 'public_import' ? 'Import public OSM' : run.operation}</strong><small>{run.outcome} · {run.resultCount} résultat{run.resultCount === 1 ? '' : 's'}</small></span></div>)}</div> : <div className="empty-state compact"><Clock3 size={22} /><strong>Aucun run récent</strong><p>Les imports terrain vérifiés apparaîtront ici.</p></div>}<div className="locked-note"><ShieldCheck size={17} /><span><strong>OSM n’est pas Omni</strong><small>La carte publique fournit une présence et une attribution ; les comptes, claims, catalogues et notifications appartiennent à Omni.</small></span></div></section>;
}

function BuyerRequestsSheet(props: { user: SessionUser | null; data: BuyerAvailabilityRequestList | null; state: 'idle' | 'loading' | 'error'; error: string; onRefresh: () => void; onResume: (request: BuyerAvailabilityRequestSummary) => void; onClose: () => void }) {
  const requests = props.data?.requests ?? [];
  return <section className="omni-sheet omni-sheet-enter omni-keyboard-aware context-sheet buyer-requests-sheet" role="dialog" aria-modal="true" aria-labelledby="buyer-requests-title"><div className="sheet-handle" /><div className="sheet-head"><div><span className="section-kicker">Compte J5</span><h2 id="buyer-requests-title">Mes demandes</h2></div><button type="button" onClick={props.onClose} aria-label="Fermer"><X size={18} /></button></div><p className="sheet-lede">Retrouvez vos demandes de disponibilité et reprenez la comparaison sans recréer une demande.</p>{props.state === 'loading' && <div className="sheet-loading" role="status"><OmniSkeleton lines={3} /><span>Chargement de vos demandes…</span></div>}{props.state === 'error' && <div className="comparison-state comparison-error" role="alert"><strong>Vos demandes ne sont pas disponibles</strong><p>{props.error}</p><button className="secondary-button" type="button" onClick={props.onRefresh}>Réessayer</button></div>}{props.state === 'idle' && requests.length === 0 && <div className="empty-state"><Clock3 size={23} /><strong>Aucune demande enregistrée</strong><p>Vos prochaines demandes de disponibilité apparaîtront ici.</p></div>}{props.state === 'idle' && requests.length > 0 && <div className="buyer-request-list"><div className="seller-list-heading"><span className="section-kicker">Historique récent</span><button className="text-button" type="button" onClick={props.onRefresh}>Actualiser</button></div>{requests.map((request) => <button className="buyer-request-card omni-card-enter omni-pressable" type="button" key={request.id} onClick={() => props.onResume(request)}><span className="request-card-icon"><Clock3 size={18} /></span><span className="buyer-request-copy"><span className={`status-pill request-status-${request.requestStatus}`}>{responseStatusLabel(request.requestStatus)}</span><strong>{request.productName}</strong><small>{request.facilityName} · {request.facilityCategory}</small><small>{request.requestedQuantity} unité{request.requestedQuantity === 1 ? '' : 's'} · {request.responseCount} réponse{request.responseCount === 1 ? '' : 's'} · {new Date(request.createdAt).toLocaleDateString()}</small></span><ChevronRight size={17} /></button>)}</div>}<div className="locked-note"><ShieldCheck size={17} /><span><strong>Reprise sûre</strong><small>La demande existante est relue côté serveur. Aucun nouveau stock ou contact ne s’ouvre ici.</small></span></div><button className="secondary-button wide omni-pressable" type="button" onClick={props.onClose}>Retour à la carte</button></section>;
}

function SearchOptionsPopover(props: { category: string; categoryOptions: string[]; setCategory: (value: string) => void; quantity: number; setQuantity: (value: number) => void; budgetMode: 'unlimited' | 'maximum'; setBudgetMode: (value: 'unlimited' | 'maximum') => void; budget: string; setBudget: (value: string) => void; onClear: () => void; onApply: () => void; onClose: () => void }) {
  return <section id="search-options" className="options-popover" role="region" aria-label="Options de recherche"><div className="options-head"><div><span className="section-kicker">Affiner</span><strong>Options de recherche</strong></div><button type="button" onClick={props.onClose} aria-label="Fermer les options"><X size={16} /></button></div><label className="option-field">Catégorie<select value={props.category} onChange={(event) => props.setCategory(event.target.value)}><option value="">Toutes les catégories</option>{props.categoryOptions.filter(Boolean).map((category) => <option key={category} value={category}>{category}</option>)}</select></label><div className="option-grid"><label className="option-field">Quantité<input type="number" min="1" step="1" value={props.quantity} onChange={(event) => props.setQuantity(Math.max(1, Number(event.target.value) || 1))} /></label><div className="option-field"><span>Budget</span><div className="option-toggle"><button type="button" className={props.budgetMode === 'unlimited' ? 'active' : ''} onClick={() => props.setBudgetMode('unlimited')}>Sans plafond</button><button type="button" className={props.budgetMode === 'maximum' ? 'active' : ''} onClick={() => props.setBudgetMode('maximum')}>Maximum</button></div></div></div>{props.budgetMode === 'maximum' && <label className="option-field">Montant maximum<input type="number" min="0" step="0.01" value={props.budget} onChange={(event) => props.setBudget(event.target.value)} placeholder="0,00" /></label>}<div className="options-actions"><button className="text-button" type="button" onClick={props.onClear}>Effacer</button><button className="primary-button omni-pressable" type="button" onClick={props.onApply}>Appliquer</button></div></section>;
}

function AuthSheet(props: { mode: AuthMode; setMode: (mode: AuthMode) => void; email: string; setEmail: (value: string) => void; password: string; setPassword: (value: string) => void; name: string; setName: (value: string) => void; state: 'idle' | 'loading' | 'error'; error: string; onSubmit: (event: FormEvent) => void; onClose: () => void }) {
  return <section className="omni-sheet omni-sheet-enter omni-keyboard-aware auth-sheet" role="dialog" aria-modal="true" aria-labelledby="auth-title"><div className="sheet-handle" /><div className="sheet-head"><div><span className="section-kicker">Compte Omni</span><h2 id="auth-title">{props.mode === 'sign-in' ? 'Recherchez avec certitude' : 'Commencez à voir avant de bouger'}</h2></div><button type="button" onClick={props.onClose} aria-label="Fermer"><X size={18} /></button></div><p className="sheet-lede">La carte publique reste ouverte. Votre compte débloque la recherche catalogue et la vérification de disponibilité.</p><form onSubmit={props.onSubmit} className="auth-form">{props.mode === 'sign-up' && <label>Prénom<input value={props.name} onChange={(event) => props.setName(event.target.value)} placeholder="Votre prénom" autoComplete="name" /></label>}<label>Email<input type="email" required value={props.email} onChange={(event) => props.setEmail(event.target.value)} placeholder="vous@exemple.com" autoComplete="email" /></label><label>Mot de passe<input type="password" required minLength={8} value={props.password} onChange={(event) => props.setPassword(event.target.value)} placeholder="8 caractères minimum" autoComplete={props.mode === 'sign-in' ? 'current-password' : 'new-password'} /></label>{props.error && <div className="inline-error" role="alert">{props.error}</div>}<button className="primary-button omni-pressable" type="submit" aria-busy={props.state === 'loading'} disabled={props.state === 'loading'}>{props.state === 'loading' ? 'Connexion…' : props.mode === 'sign-in' ? 'Se connecter' : 'Créer mon compte'}</button></form><button className="text-button auth-switch" type="button" onClick={() => props.setMode(props.mode === 'sign-in' ? 'sign-up' : 'sign-in')}>{props.mode === 'sign-in' ? 'Nouveau sur Omni ? Créer un compte' : 'Déjà un compte ? Se connecter'}</button></section>;
}

type SellerOfferMutationFields = { facilityId?: string; name: string; description?: string; unit?: string; priceMinor: number; currency: string; discountKind: 'percentage' | 'fixed'; discountValueMinor: number };

function SellerCatalogueEditor(props: { facilities: SellerCatalogueFacility[]; products: SellerCatalogueProduct[]; state: 'idle' | 'loading' | 'error' | 'success'; error: string; onMutation: (action: 'create' | 'update', productId: string | undefined, fields: SellerOfferMutationFields) => void }) {
  const facilities = props.facilities;
  const [editing, setEditing] = useState<SellerCatalogueProduct | null>(null);
  const [facilityId, setFacilityId] = useState(facilities[0]?.id ?? '');
  useEffect(() => {
    if (!facilityId && facilities[0]?.id) setFacilityId(facilities[0].id);
  }, [facilityId, facilities]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('unité');
  const [price, setPrice] = useState('');
  const [currencyCode, setCurrencyCode] = useState('XOF');
  const [discountKind, setDiscountKind] = useState<'percentage' | 'fixed'>('percentage');
  const [discount, setDiscount] = useState('10');
  const reset = () => { setEditing(null); setName(''); setDescription(''); setUnit('unité'); setPrice(''); setCurrencyCode('XOF'); setDiscountKind('percentage'); setDiscount('10'); };
  const startEdit = (product: SellerCatalogueProduct) => { setEditing(product); setFacilityId(product.facilityId); setName(product.name); setDescription(product.description ?? ''); setUnit(product.unit); setPrice(String(product.priceMinor / 100)); setCurrencyCode(product.currency); setDiscountKind(product.discountKind ?? 'percentage'); setDiscount(String(product.discountValueMinor ?? 10)); };
  const submit = (event: FormEvent) => { event.preventDefault(); props.onMutation(editing ? 'update' : 'create', editing?.id, { facilityId, name, description, unit, priceMinor: Math.round(Number(price) * 100), currency: currencyCode, discountKind, discountValueMinor: Math.round(Number(discount)) }); };
  return <div className="seller-catalogue-editor"><div className="seller-list-heading"><span className="section-kicker">{editing ? 'Modifier une offre' : 'Nouvelle offre'}</span>{editing && <button className="text-button" type="button" onClick={reset}>Annuler</button>}</div><form className="auth-form" onSubmit={submit}><label>Facilité<select value={facilityId} onChange={(event) => setFacilityId(event.target.value)} required>{facilities.length ? facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.name}</option>) : <option value="">Aucune facilité disponible</option>}</select></label><label>Produit<input value={name} onChange={(event) => setName(event.target.value)} required maxLength={180} placeholder="Ex. Riz local 5 kg" /></label><label>Prix<input type="number" min="0.01" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} required /></label><label>Devise<select value={currencyCode} onChange={(event) => setCurrencyCode(event.target.value)}><option value="XOF">XOF</option><option value="GHS">GHS</option><option value="EUR">EUR</option></select></label><label>Réduction<select value={discountKind} onChange={(event) => setDiscountKind(event.target.value as 'percentage' | 'fixed')}><option value="percentage">Pourcentage</option><option value="fixed">Montant fixe</option></select><input type="number" min="1" step="1" value={discount} onChange={(event) => setDiscount(event.target.value)} required /></label><label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} rows={2} /></label>{props.error && <div className="inline-error" role="alert">{props.error}</div>}{props.state === 'success' && <div className="seller-response-success" role="status"><CheckCircle2 size={18} /> Offre enregistrée.</div>}<button className="primary-button omni-pressable" type="submit" disabled={props.state === 'loading' || !facilities.length}>{props.state === 'loading' ? 'Enregistrement…' : editing ? 'Enregistrer les changements' : 'Créer le draft'}</button>{!facilities.length && <p className="privacy-note">Aucune facilité détenue n’est encore disponible pour ce compte Seller.</p>}</form>{props.products.filter((product) => product.publicationState === 'draft' || product.publicationState === 'published').map((product) => <button className="text-button" type="button" key={product.id} onClick={() => startEdit(product)}>Modifier « {product.name} »{product.publicationState === 'published' ? ' · republier après modification' : ''}</button>)}</div>;
}

function SellerWalletPanel(props: { wallet: WalletOverviewResult | null; state: 'idle' | 'loading' | 'error'; onRefresh: () => void; rechargeState: 'idle' | 'loading' | 'error' | 'success'; rechargeError: string; rechargeResult: WalletRechargeResult | null; rechargeAmount: string; setRechargeAmount: (value: string) => void; onRecharge: () => void; proState: 'idle' | 'loading' | 'error' | 'success'; proError: string; proResult: FacilityProActivationResult | null; onActivatePro: (facilityId: string) => void }) {
  if (props.state === 'loading') return <div className="sheet-loading"><span className="spinner" /> Vérification du Wallet…</div>;
  if (!props.wallet) return <div className="empty-state"><ShieldCheck size={22} /><strong>Wallet indisponible</strong><p>Le Wallet Omni sera disponible dès que le compte Seller sera entièrement provisionné.</p><button className="secondary-button" type="button" onClick={props.onRefresh}>Réessayer</button></div>;
  return <div className="seller-wallet-panel"><div className="wallet-balance-card"><span className="section-kicker">Solde Omni</span><strong>{currency(props.wallet.balanceMinor, props.wallet.currency)}</strong><small>Crédits confirmés utilisables pour les services Omni. Les paiements de vos transactions restent externes.</small></div><div className="wallet-recharge-card"><div className="seller-list-heading"><span className="section-kicker">Recharger le Wallet</span><span className="wallet-currency-tag">XOF</span></div><p className="privacy-note">Rechargez des crédits Omni pour les services de plateforme. La confirmation finale vient uniquement du webhook FedaPay vérifié.</p><div className="wallet-recharge-presets" role="group" aria-label="Montants de recharge"><span className="section-kicker">Choisir un montant</span><div>{[5000, 10000, 25000].map((amount) => <button className={props.rechargeAmount === String(amount) ? 'active' : ''} type="button" key={amount} onClick={() => props.setRechargeAmount(String(amount))}>{walletRechargeCurrency(amount)}</button>)}</div></div><label className="money-input">Montant en XOF<input type="number" min="100" step="1" inputMode="numeric" value={props.rechargeAmount} onChange={(event) => props.setRechargeAmount(event.target.value)} aria-describedby="wallet-recharge-note" /></label>{props.rechargeError && <div className="inline-error" role="alert">{props.rechargeError}</div>}{props.rechargeState === 'success' && props.rechargeResult ? <div className="seller-response-success" role="status"><CheckCircle2 size={18} /><span>Recharge créée · {walletRechargeCurrency(props.rechargeResult.amountMinor)} en attente de confirmation.</span></div> : <button className="primary-button omni-pressable" type="button" disabled={props.rechargeState === 'loading'} onClick={props.onRecharge}>{props.rechargeState === 'loading' ? 'Préparation…' : 'Préparer la recharge'}</button>}{props.rechargeState === 'success' && props.rechargeResult && <a className="secondary-button wide omni-pressable wallet-checkout-link" href={props.rechargeResult.checkoutUrl} target="_blank" rel="noreferrer">Continuer le paiement FedaPay <ArrowRight size={15} /></a>}<p id="wallet-recharge-note" className="privacy-note">Le solde reste inchangé tant que FedaPay n’a pas confirmé le paiement. Aucun paiement de vente n’est débité de ce Wallet.</p></div><div className="seller-list-heading"><span className="section-kicker">Plans par facilité</span><button className="text-button" type="button" onClick={props.onRefresh}>Actualiser</button></div>{props.wallet.facilities.length ? <div className="wallet-facility-list">{props.wallet.facilities.map((facility) => <div className="wallet-facility-card" key={facility.facilityId}><span><strong>{facility.facilityName}</strong><small>{facility.plan === 'pro_active' ? 'Pro actif · offres illimitées' : facility.plan === 'pro_expired' ? 'Pro expiré · limite Free appliquée' : 'Free · 5 offres maximum'}</small></span><span className="wallet-facility-price">{currency(facility.proPriceMinor, facility.billingCurrency)}<small>/ mois</small></span>{facility.plan === 'pro_active' ? <span className="wallet-plan-badge">Actif</span> : <button className="secondary-button omni-pressable" type="button" disabled={props.proState === 'loading'} onClick={() => props.onActivatePro(facility.facilityId)}>{props.proState === 'loading' ? 'Activation…' : 'Passer en Pro'}</button>}</div>)}</div> : <div className="empty-state compact"><PackageSearch size={22} /><strong>Aucune facility avec slot actif</strong><p>Un Pro est toujours acheté pour une facility précise, jamais pour tout le compte.</p></div>}<div className="notice-card"><strong>Pro par facilité</strong><p>Pro coûte 10 USD par mois pour cette facilité uniquement. Le débit utilise le solde Omni confirmé ; les paiements de vos ventes restent externes.</p>{props.proError && <div className="inline-error" role="alert">{props.proError}</div>}{props.proState === 'success' && props.proResult && <div className="seller-response-success" role="status"><CheckCircle2 size={18} /> Pro actif jusqu’au {new Date(props.proResult.endsAt).toLocaleDateString()}</div>}</div>{props.wallet.entries.length > 0 && <><div className="seller-list-heading"><span className="section-kicker">Dernières écritures</span></div><div className="wallet-entry-list">{props.wallet.entries.slice(0, 5).map((entry) => <div className="wallet-entry" key={entry.id}><span>{entry.kind.replaceAll('_', ' ')}</span><strong>{entry.amountMinor > 0 ? '+' : ''}{currency(entry.amountMinor, props.wallet!.currency)}</strong></div>)}</div></>}</div>;
}

function SellerFacilityCreator(props: { state: 'idle' | 'loading' | 'error' | 'success'; error: string; result: { facilityId: string; slotId: string; trustState: 'verification_draft'; created: boolean } | null; onCreate: (input: { name: string; category: string; description: string; address: string; latitude: number; longitude: number }) => void }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('6.1319');
  const [longitude, setLongitude] = useState('1.2228');
  const [locationState, setLocationState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [locationError, setLocationError] = useState('');
  const useCurrentLocation = () => {
    if (!navigator.geolocation) { setLocationState('error'); setLocationError('La géolocalisation n’est pas disponible sur cet appareil.'); return; }
    setLocationState('loading'); setLocationError('');
    navigator.geolocation.getCurrentPosition((position) => { setLatitude(position.coords.latitude.toFixed(6)); setLongitude(position.coords.longitude.toFixed(6)); setLocationState('idle'); }, () => { setLocationState('error'); setLocationError('Position indisponible. Vous pouvez ajuster le pin manuellement.'); }, { enableHighAccuracy: true, timeout: 10000 });
  };
  const submit = (event: FormEvent) => { event.preventDefault(); props.onCreate({ name, category, description, address, latitude: Number(latitude), longitude: Number(longitude) }); };
  return <div className="seller-facility-creator"><div className="seller-list-heading"><div><span className="section-kicker">Nouvelle facilité</span><strong>Créer depuis le terrain</strong></div></div><p className="privacy-note">La position actuelle est proposée par défaut. Vous pouvez déplacer le pin en modifiant les coordonnées avant l’envoi. La revue humaine reste obligatoire.</p><form className="auth-form" onSubmit={submit}><label>Nom de la facilité<input required maxLength={180} value={name} onChange={(event) => setName(event.target.value)} placeholder="Nom de la boutique ou du service" /></label><label>Catégorie<input maxLength={120} value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Marché, magasin, atelier…" /></label><label>Adresse ou repère<input maxLength={240} value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Repère public utile" /></label><div className="seller-input-grid"><label>Latitude<input required type="number" step="0.000001" min="-90" max="90" value={latitude} onChange={(event) => setLatitude(event.target.value)} /></label><label>Longitude<input required type="number" step="0.000001" min="-180" max="180" value={longitude} onChange={(event) => setLongitude(event.target.value)} /></label></div><button className="secondary-button" type="button" onClick={useCurrentLocation} disabled={locationState === 'loading'}>{locationState === 'loading' ? 'Localisation…' : 'Utiliser ma position actuelle'}</button><label>Description<textarea maxLength={500} rows={2} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Décrivez brièvement l’activité" /></label>{locationError && <div className="inline-error" role="alert">{locationError}</div>}{props.error && <div className="inline-error" role="alert">{props.error}</div>}{props.state === 'success' && props.result && <div className="claim-success" role="status"><CheckCircle2 size={18} /> Facilité créée. La certification manuelle reste à effectuer.</div>}<button className="primary-button omni-pressable" type="submit" disabled={props.state === 'loading'}>{props.state === 'loading' ? 'Création…' : 'Créer la facilité'} <ArrowRight size={16} /></button></form></div>;
}

function SellerWorkspaceSheet(props: { user: SessionUser | null; queue: SellerAvailabilityQueue | null; catalogue: SellerCatalogueResult | null; wallet: WalletOverviewResult | null; rechargeState: 'idle' | 'loading' | 'error' | 'success'; rechargeError: string; rechargeResult: WalletRechargeResult | null; rechargeAmount: string; setRechargeAmount: (value: string) => void; onRecharge: () => void; proState: 'idle' | 'loading' | 'error' | 'success'; proError: string; proResult: FacilityProActivationResult | null; onActivatePro: (facilityId: string) => void; queueState: 'idle' | 'loading' | 'error'; queueError: string; request: SellerAvailabilityRequest | null; tab: 'requests' | 'catalogue' | 'wallet' | 'transaction'; transactionId: string; setTransactionId: (value: string) => void; qrPayload: string; setQrPayload: (value: string) => void; verifyState: 'idle' | 'loading' | 'error' | 'success'; verifyError: string; onVerifyQr: () => void; verification: QrVerificationResult | null; transactionState: TransactionState; paymentState: 'idle' | 'loading' | 'error' | 'success'; paymentError: string; transitionState: 'idle' | 'loading' | 'error' | 'success'; transitionError: string; onConfirmPayment: () => void; onAdvanceFulfilment: () => void; onAdvanceFulfilled: () => void; chatMessages: TransactionMessage[]; chatState: 'idle' | 'loading' | 'error'; chatError: string; chatSending: boolean; onRefreshChat: () => void; onSendChat: (body: string) => void; rebindState: 'idle' | 'loading' | 'error'; rebindError: string; onRebindDemo: () => void; setTab: (value: 'requests' | 'catalogue' | 'wallet' | 'transaction') => void; responseStatus: SellerResponseStatus; setResponseStatus: (value: SellerResponseStatus) => void; quantity: number; setQuantity: (value: number) => void; price: string; setPrice: (value: string) => void; message: string; setMessage: (value: string) => void; responseState: 'idle' | 'loading' | 'error' | 'success'; responseError: string; responseResult: { status: AvailabilityResponseStatus; observedAt: string } | null; onLoadQueue: () => void; catalogueMutationState: 'idle' | 'loading' | 'error' | 'success'; catalogueMutationError: string; onCatalogueMutation: (action: 'create' | 'update' | 'publish' | 'archive', productId?: string, fields?: { facilityId?: string; name: string; description?: string; unit?: string; priceMinor: number; currency: string; discountKind: 'percentage' | 'fixed'; discountValueMinor: number }) => void; facilityCreateState: 'idle' | 'loading' | 'error' | 'success'; facilityCreateError: string; facilityCreateResult: { facilityId: string; slotId: string; trustState: 'verification_draft'; created: boolean } | null; onCreateFacility: (input: { name: string; category: string; description: string; address: string; latitude: number; longitude: number }) => void; onSelectRequest: (request: SellerAvailabilityRequest) => void; onSubmitResponse: () => void; onBackToQueue: () => void; onClose: () => void; onSignOut: () => void }) {
  const request = props.request;
  const statusLabel = props.responseStatus === 'available' ? 'Disponible' : props.responseStatus === 'partial' ? 'Partielle' : 'Indisponible';
  const responseStatusLabel = props.responseResult?.status === 'available' ? 'Disponible' : props.responseResult?.status === 'partial' ? 'Partielle' : 'Indisponible';
  const existingStatusLabel = request?.responseStatus === 'available' ? 'Disponible' : request?.responseStatus === 'partial' ? 'Partielle' : request?.responseStatus === 'corrected' ? 'Corrigée' : 'Indisponible';
  const catalogueItems = props.catalogue?.products ?? [];
  return <section className="omni-sheet omni-sheet-enter omni-keyboard-aware context-sheet seller-workspace-sheet" role="dialog" aria-modal="true" aria-labelledby="seller-workspace-title"><div className="sheet-handle" /><div className="sheet-head"><div>{request && <button className="back-button" type="button" onClick={props.onBackToQueue}><ArrowLeft size={17} /> Demandes</button>}<span className="section-kicker">Vendre</span><h2 id="seller-workspace-title">{request ? 'Répondre à la demande' : 'Espace vendeur'}</h2></div><button type="button" onClick={props.onClose} aria-label="Fermer"><X size={18} /></button></div>{!request && <><div className="seller-workspace-summary"><span className="seller-entry-mark"><ShieldCheck size={21} /></span><div><strong>{props.queue?.authorized ? 'Contexte vendeur autorisé' : 'Accès vendeur à vérifier'}</strong><p>{props.queue?.authorized ? 'Répondez aux demandes de vos facilités sans modifier le catalogue public.' : props.user ? 'Votre compte est connecté, mais aucun profil vendeur autorisé n’est lié à cette session.' : 'Connectez-vous pour vérifier votre accès vendeur.'}</p></div></div><div className="seller-tabs" role="tablist" aria-label="Espace vendeur"><button type="button" role="tab" aria-selected={props.tab === 'requests'} className={props.tab === 'requests' ? 'active' : ''} onClick={() => props.setTab('requests')}>Demandes{props.queue?.authorized && props.queue.requests.length > 0 ? ` · ${props.queue.requests.length}` : ''}</button><button type="button" role="tab" aria-selected={props.tab === 'catalogue'} className={props.tab === 'catalogue' ? 'active' : ''} onClick={() => props.setTab('catalogue')}>Catalogue</button><button type="button" role="tab" aria-selected={props.tab === 'wallet'} className={props.tab === 'wallet' ? 'active' : ''} onClick={() => props.setTab('wallet')}>Wallet</button><button type="button" role="tab" aria-selected={props.tab === 'transaction'} className={props.tab === 'transaction' ? 'active' : ''} onClick={() => props.setTab('transaction')}><QrCode size={14} /> QR transaction</button></div>{props.queueState === 'loading' && <div className="sheet-loading"><span className="spinner" /> Vérification de vos demandes…</div>}{props.queueState === 'error' && <div className="inline-error" role="alert">{props.queueError}<button className="text-button" type="button" onClick={props.onLoadQueue}>Réessayer</button></div>}{props.queueState !== 'loading' && props.queueState !== 'error' && !props.queue?.authorized && <><div className="notice-card"><strong>Aucune opération vendeur ouverte</strong><p>La connexion ne certifie pas une facilité et ne crée aucune demande. Revenez à Acheter ou complétez plus tard la vérification manuelle.</p></div>{props.user && <><button className="primary-button omni-pressable" type="button" disabled={props.rebindState === 'loading'} onClick={props.onRebindDemo}>{props.rebindState === 'loading' ? 'Activation de la démo…' : 'Activer l’espace Seller de démo'} <ArrowRight size={16} /></button><p className="privacy-note">Action réservée à cet environnement de démonstration borné. Elle lie uniquement la session actuelle à la facilité Seller de démo existante.</p>{props.rebindError && <div className="inline-error" role="alert">{props.rebindError}</div>}</>}</>}{props.tab === 'requests' && props.queue?.authorized && props.queue.requests.length === 0 && props.queueState !== 'loading' && <div className="empty-state"><PackageSearch size={22} /><strong>Aucune demande en attente</strong><p>Les nouvelles demandes ciblées sur vos produits publiés apparaîtront ici.</p><button className="secondary-button" type="button" onClick={props.onLoadQueue}>Actualiser</button></div>}{props.tab === 'requests' && props.queue?.authorized && props.queue.requests.length > 0 && <div className="seller-request-list"><div className="seller-list-heading"><span className="section-kicker">Demandes ciblées</span><button className="text-button" type="button" onClick={props.onLoadQueue}>Actualiser</button></div>{props.queue.requests.map((item) => <button className="seller-request-card omni-card-enter omni-pressable" type="button" key={item.id} onClick={() => props.onSelectRequest(item)}><span className="request-card-icon"><PackageSearch size={18} /></span><span className="seller-request-copy"><strong>{item.productName}</strong><small>{item.facilityName} · {item.facilityCategory}</small><small>Quantité demandée : {item.requestedQuantity} · {item.freshness === 'stale' ? 'Réponse à actualiser' : item.responseStatus ? `Réponse ${item.responseStatus === 'available' ? 'disponible' : item.responseStatus === 'partial' ? 'partielle' : 'indisponible'}` : 'Sans réponse'}</small></span><ChevronRight size={17} /></button>)}</div>}{props.tab === 'catalogue' && <div className="seller-catalogue-preview"><SellerFacilityCreator state={props.facilityCreateState} error={props.facilityCreateError} result={props.facilityCreateResult} onCreate={props.onCreateFacility} /><SellerCatalogueEditor facilities={props.catalogue?.facilities ?? []} products={catalogueItems} state={props.catalogueMutationState} error={props.catalogueMutationError} onMutation={props.onCatalogueMutation} /><div className="seller-list-heading"><span className="section-kicker">Catalogue de vos facilités</span><span className="catalogue-count">{catalogueItems.length} produit{catalogueItems.length === 1 ? '' : 's'}</span></div>{catalogueItems.length ? <div className="catalogue-list">{catalogueItems.map((item) => <div className="catalogue-item" key={item.id}><span className="product-icon"><PackageSearch size={16} /></span><span><strong>{item.name}</strong><small>{item.facilityName} · {item.publicationState === 'published' ? 'publié' : item.publicationState}</small><small>{currency(item.priceMinor, item.currency)}{item.discountValueMinor ? ` · réduction ${item.discountKind === 'percentage' ? `${item.discountValueMinor}%` : currency(item.discountValueMinor, item.currency)}` : ' · offre à compléter'}</small></span><span className="catalogue-item-actions">{item.publicationState === 'draft' && <button className="secondary-button omni-pressable" type="button" disabled={props.catalogueMutationState === 'loading'} onClick={() => props.onCatalogueMutation('publish', item.id)}>{props.catalogueMutationState === 'loading' ? '…' : 'Publier'}</button>}{item.publicationState === 'published' && <button className="text-button omni-pressable" type="button" disabled={props.catalogueMutationState === 'loading'} onClick={() => props.onCatalogueMutation('archive', item.id)}>Archiver</button>}</span></div>)}</div> : <div className="empty-state compact"><PackageSearch size={22} /><strong>Aucun produit enregistré</strong><p>Les produits de vos facilités apparaîtront ici après création. Chaque nouveau draft devra contenir une réduction Seller.</p></div>}</div>}{props.tab === 'wallet' && <SellerWalletPanel wallet={props.wallet} state={props.queueState} onRefresh={props.onLoadQueue} rechargeState={props.rechargeState} rechargeError={props.rechargeError} rechargeResult={props.rechargeResult} rechargeAmount={props.rechargeAmount} setRechargeAmount={props.setRechargeAmount} onRecharge={props.onRecharge} proState={props.proState} proError={props.proError} proResult={props.proResult} onActivatePro={props.onActivatePro} />}{props.tab === 'transaction' && <SellerTransactionPanel
        transactionId={props.transactionId}
        setTransactionId={props.setTransactionId}
        qrPayload={props.qrPayload}
        setQrPayload={props.setQrPayload}
        verifyState={props.verifyState}
        verifyError={props.verifyError}
        onVerifyQr={props.onVerifyQr}
        verification={props.verification}
        transactionState={props.transactionState}
        paymentState={props.paymentState}
        paymentError={props.paymentError}
        onConfirmPayment={props.onConfirmPayment}
        transitionState={props.transitionState}
        transitionError={props.transitionError}
        onAdvanceFulfilment={props.onAdvanceFulfilment}
        onAdvanceFulfilled={props.onAdvanceFulfilled}
        chatMessages={props.chatMessages} chatState={props.chatState} chatError={props.chatError} chatSending={props.chatSending} onRefreshChat={props.onRefreshChat} onSendChat={props.onSendChat}
      />}<div className="locked-note"><ShieldCheck size={17} /><span><strong>Handoff encore verrouillé</strong><small>Répondre ne réserve pas le stock et n’ouvre ni contact, ni itinéraire, ni QR.</small></span></div><button className="secondary-button wide omni-pressable" type="button" onClick={props.onClose}>Retour à acheter</button>{props.user && <button className="text-button" type="button" onClick={props.onSignOut}>Se déconnecter</button>}</>}{request && <><div className="seller-request-detail"><span className="section-kicker">Demande entrante</span><strong>{request.productName}</strong><small>{request.facilityName} · {request.facilityCategory} · {trustLabel(request.facilityTrust)}</small><div className="seller-request-facts"><span><b>Quantité</b>{request.requestedQuantity}</span><span><b>Budget</b>{request.budgetMinor === null ? 'Sans plafond' : currency(request.budgetMinor, 'USD')}</span><span><b>Échéance</b>{new Date(request.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div></div>{request.responseStatus && request.responseObservedAt ? <div className="seller-response-success" role="status"><CheckCircle2 size={24} /><div><strong>Réponse déjà enregistrée</strong><p>{existingStatusLabel} · reçue à {new Date(request.responseObservedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Aucun doublon ne sera créé.</p><button className="secondary-button" type="button" onClick={props.onBackToQueue}>Retour aux demandes</button></div></div> : props.responseState === 'success' && props.responseResult ? <div className="seller-response-success" role="status"><CheckCircle2 size={24} /><div><strong>Réponse enregistrée</strong><p>{responseStatusLabel} · reçue à {new Date(props.responseResult.observedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. La demande n’est pas une réservation.</p><button className="secondary-button" type="button" onClick={props.onBackToQueue}>Retour aux demandes</button></div></div> : <><div className="seller-response-form"><span className="section-kicker">Votre réponse</span><div className="seller-status-options" role="group" aria-label="Statut de disponibilité">{(['available', 'partial', 'unavailable'] as SellerResponseStatus[]).map((status) => <button type="button" key={status} className={props.responseStatus === status ? 'active' : ''} onClick={() => props.setResponseStatus(status)}>{status === 'available' ? 'Disponible' : status === 'partial' ? 'Partielle' : 'Indisponible'}</button>)}</div>{props.responseStatus !== 'unavailable' && <div className="seller-input-grid"><label>Quantité proposée<input type="number" min="1" step="1" value={props.quantity} onChange={(event) => props.setQuantity(Math.max(1, Number(event.target.value) || 1))} /></label><label>Prix unitaire<input type="number" min="0" step="0.01" value={props.price} onChange={(event) => props.setPrice(event.target.value)} placeholder="0,00" /></label></div>}{props.responseStatus === 'unavailable' && <div className="notice-card"><strong>{statusLabel}</strong><p>Le serveur enregistrera une quantité nulle et aucun prix.</p></div>}<label className="seller-message-field">Message facultatif<textarea value={props.message} onChange={(event) => props.setMessage(event.target.value)} maxLength={1000} rows={3} placeholder="Ajoutez une précision utile au besoin exprimé…" /></label>{props.responseError && <div className="inline-error" role="alert">{props.responseError}</div>}<button className="primary-button omni-pressable" type="button" aria-busy={props.responseState === 'loading'} disabled={props.responseState === 'loading'} onClick={props.onSubmitResponse}>{props.responseState === 'loading' ? 'Enregistrement…' : 'Envoyer la réponse'} <ArrowRight size={16} /></button></div><div className="locked-note"><ShieldCheck size={17} /><span><strong>Pas de réservation</strong><small>Cette réponse reste une information de disponibilité vérifiée. Les étapes privées viennent plus tard.</small></span></div></>}</>}</section>;
}

function ClaimSheet(props: { facility: FacilityDetail | null; draft: ClaimDraftResult | null; evidence: ClaimEvidenceItem[]; storageAvailable: boolean | null; uploadState: 'idle' | 'uploading' | 'error'; uploadProgress: number; uploadError: string; submitState: 'idle' | 'loading' | 'error' | 'success'; submitError: string; actionState: 'idle' | 'loading' | 'error'; actionError: string; onUpload: (kind: EvidenceKind, file: File) => void; onRemoveEvidence: (index: number) => void; onSubmit: () => void; onCancel: () => void; onClose: () => void }) {
  if (!props.draft) return <section className="omni-sheet omni-sheet-enter omni-keyboard-aware context-sheet claim-sheet" role="dialog" aria-modal="true" aria-labelledby="claim-title"><div className="sheet-handle" /><div className="sheet-head"><div><span className="section-kicker">Compte J5 · Claim</span><h2 id="claim-title">Aucun draft ouvert</h2></div><button type="button" onClick={props.onClose} aria-label="Fermer"><X size={18} /></button></div><div className="empty-state"><Clock3 size={23} /><strong>Reprenez depuis une facilité</strong><p>Un claim commence toujours sur un lieu public non revendiqué.</p></div></section>;
  return <section className="omni-sheet omni-sheet-enter omni-keyboard-aware context-sheet claim-sheet" role="dialog" aria-modal="true" aria-labelledby="claim-title"><div className="sheet-handle" /><div className="sheet-head"><div><button className="back-button" type="button" onClick={props.onClose}><ArrowLeft size={17} /> Facilité</button><span className="section-kicker">Compte J5 · Claim</span><h2 id="claim-title">Vérifier une facilité</h2></div><button type="button" onClick={props.onClose} aria-label="Fermer"><X size={18} /></button></div><div className="claim-context"><span className="facility-identity-icon"><MapPin size={19} /></span><div><strong>{props.facility?.name ?? 'Facilité sélectionnée'}</strong><small>{props.facility?.category ?? 'Lieu public'} · draft v{props.draft.version}</small></div></div><p className="sheet-lede">Ce parcours prépare une vérification représentant, société, lieu et activité. Il ne certifie jamais une personne au moment du clic.</p><div className="claim-checklist evidence-checklist">{([['identity', 'Identité du représentant'], ['company', 'Société / activité'], ['facility', 'Facilité et localisation'], ['product', 'Produit ou service'], ['location', 'Repère de localisation'], ['service', 'Preuve de service']] as Array<[EvidenceKind, string]>).map(([kind, label]) => { const count = props.evidence.filter((item) => item.evidenceKind === kind).length; return <div className="evidence-row" key={kind}><span className="evidence-row-mark">{count ? <CheckCircle2 size={17} /> : <span className="evidence-empty-mark" />}</span><span><strong>{label}</strong><small>{count ? `${count} fichier privé ajouté${count === 1 ? '' : 's'}` : 'JPEG, PNG, WebP ou PDF · 10 Mo maximum'}</small></span><label className="evidence-upload-button"><span>{props.uploadState === 'uploading' ? `${props.uploadProgress}%` : props.storageAvailable === true ? 'Ajouter' : 'Bloqué'}</span><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={props.storageAvailable !== true || props.uploadState === 'uploading' || props.draft?.state === 'submitted'} onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; if (file) props.onUpload(kind, file); }} /></label></div>; })}</div><div className="notice-card"><strong>{props.storageAvailable === null ? 'Vérification du stockage privé' : props.storageAvailable ? 'Preuves privées, statut séparé' : 'Stockage privé non connecté'}</strong><p>{props.storageAvailable === null ? 'Omni vérifie si le stockage privé est disponible pour ce runtime.' : props.storageAvailable ? 'Le serveur autorise l’upload uniquement pour le claimant du draft et vérifiera chaque objet privé avant la soumission.' : 'Le store privé Vercel Blob n’est pas encore connecté à ce runtime. Aucun fichier ne sera accepté et votre draft reste récupérable.'} Une preuve ne certifie jamais une personne, une propriété, un stock ou un catalogue.</p></div>{props.evidence.length > 0 && <div className="evidence-file-list" aria-label="Preuves ajoutées">{props.evidence.map((item, index) => <div className="evidence-file-row" key={`${item.objectKey}-${index}`}><span><strong>{item.evidenceKind}</strong><small>Référence privée vérifiable par Omni</small></span>{props.draft?.state !== 'submitted' && <button className="text-button danger-text" type="button" onClick={() => props.onRemoveEvidence(index)}>Retirer</button>}</div>)}</div>}{props.uploadState === 'uploading' && <div className="sheet-loading" role="status"><span className="spinner" /> Upload privé en cours · {props.uploadProgress}%</div>}{props.uploadError && <div className="inline-error" role="alert">{props.uploadError}</div>}{props.submitError && <div className="inline-error" role="alert">{props.submitError}</div>}{props.actionError && <div className="inline-error" role="alert">{props.actionError}</div>}{props.submitState === 'success' && props.draft?.state === 'submitted' ? <div className="claim-success" role="status"><CheckCircle2 size={17} /><span>Claim soumis. La file reviewer Omni vérifiera les preuves avant toute évolution du statut.</span></div> : <button className="primary-button omni-pressable" type="button" disabled={props.storageAvailable !== true || props.evidence.length === 0 || props.uploadState === 'uploading' || props.submitState === 'loading'} onClick={props.onSubmit}>{props.submitState === 'loading' ? 'Vérification et soumission…' : props.evidence.length === 0 ? 'Ajoutez une preuve pour continuer' : 'Soumettre à la revue Omni'} <ArrowRight size={16} /></button>}<button className="secondary-button wide omni-pressable" type="button" onClick={props.onClose}>Continuer plus tard</button><button className="text-button danger-text" type="button" disabled={props.actionState === 'loading' || props.draft?.state === 'submitted'} onClick={props.onCancel}>{props.actionState === 'loading' ? 'Annulation…' : 'Annuler ce brouillon'}</button><div className="locked-note"><ShieldCheck size={17} /><span><strong>Statut séparé</strong><small>Un claim ne devient certifié qu’après preuves privées, revue de l’équipe et historique auditable.</small></span></div></section>;
}

function FacilitySheet(props: { facility: FacilityDetail | null; state: 'idle' | 'loading' | 'error'; error: string; claimState: 'idle' | 'loading' | 'error' | 'success'; claimError: string; claimResult: ClaimDraftResult | null; onClaim: (facility: PublicFacility) => void; onOpenClaim: () => void; onClose: () => void; onVerify: () => void }) {
  return <section className="omni-sheet omni-sheet-enter omni-keyboard-aware context-sheet facility-sheet" role="dialog" aria-modal="true" aria-labelledby="facility-title"><div className="sheet-handle" /><div className="sheet-head"><button className="back-button" type="button" onClick={props.onClose}><ArrowLeft size={17} /> Carte</button><button type="button" onClick={props.onClose} aria-label="Fermer"><X size={18} /></button></div>{props.state === 'loading' && <div className="sheet-loading"><span className="spinner" /> Ouverture de la facilité…</div>}{props.state === 'error' && <div className="empty-state"><PackageSearch size={26} /><strong>Facilité indisponible</strong><p>{props.error}</p><button type="button" className="secondary-button" onClick={props.onClose}>Retour à la carte</button></div>}{props.facility && props.state === 'idle' && <><div className="facility-identity"><span className="facility-identity-icon"><MapPin size={21} /></span><div><span className="section-kicker">{props.facility.category}</span><h2 id="facility-title">{props.facility.name}</h2><p>{props.facility.address ?? 'Lieu partagé sur la carte publique'}</p></div></div><div className="trust-row"><span className="trust-badge"><ShieldCheck size={14} /> {trustLabel(props.facility.trust)}</span><span className={`plan-badge plan-${props.facility.plan}`}>{planLabel(props.facility.plan)}</span></div>{props.facility.source === 'osm' ? <div className="notice-card"><strong>Lieu public OpenStreetMap</strong><p>Cette présence est une découverte cartographique externe. Elle doit être inscrite et vérifiée par l’équipe Omni avant de proposer une offre ou une transaction.</p></div> : props.facility.trust === 'unclaimed' ? <div className="notice-card"><strong>Lieu public, pas encore certifié</strong><p>Ce pin vient d’une source publique. Une revendication ouvre seulement un brouillon de vérification ; elle ne certifie ni la personne ni le catalogue.</p>{props.claimState === 'success' && props.claimResult ? <div className="claim-success" role="status"><CheckCircle2 size={17} /><span>Brouillon ouvert. Référence de suivi créée ; la preuve et la revue Omni restent nécessaires.</span><button className="secondary-button wide omni-pressable" type="button" onClick={props.onOpenClaim}>Ouvrir le parcours de preuve</button></div> : <button className="primary-button omni-pressable" type="button" disabled={props.claimState === 'loading'} onClick={() => { if (props.facility) props.onClaim(props.facility); }}>{props.claimState === 'loading' ? 'Ouverture du brouillon…' : 'Commencer la revendication'} <ArrowRight size={16} /></button>}{props.claimState === 'error' && <div className="inline-error" role="alert">{props.claimError}</div>}</div> : props.facility.products.length ? <><div className="catalogue-heading"><div><span className="section-kicker">Catalogue de la facilité</span><strong>{props.facility.products.length} offre{props.facility.products.length === 1 ? '' : 's'}</strong></div><span>Source facility</span></div><div className="catalogue-list">{props.facility.products.slice(0, 5).map((product) => <div className="catalogue-item" key={product.id}><span className="product-icon"><PackageSearch size={16} /></span><span><strong>{product.name}</strong><small>{product.description ?? product.category ?? 'Offre locale'} · {currency(product.priceMinor, product.currency)} / {product.unit}</small></span></div>)}</div><button className="primary-button omni-pressable" type="button" onClick={props.onVerify}>Vérifier la disponibilité <ArrowRight size={16} /></button></> : <div className="empty-state compact"><Clock3 size={25} /><strong>Catalogue non publié</strong><p>Cette facilité n’a pas encore d’offre publique à vérifier.</p></div>}<p className="privacy-note">Les contacts et l’itinéraire apparaissent seulement après une intention d’achat autorisée.</p></>}</section>;
}

function responseStatusLabel(status: string) {
  if (status === 'available') return 'Disponible';
  if (status === 'partial') return 'Partielle';
  if (status === 'corrected') return 'Corrigée';
  return 'Indisponible';
}

function freshnessLabel(freshness: string) {
  if (freshness === 'fresh') return 'Actualisée';
  if (freshness === 'stale') return 'À confirmer';
  return 'Expirée';
}

function OmniSkeleton({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return <div className={`omni-skeleton-stack ${className}`} aria-hidden="true">{Array.from({ length: lines }, (_, index) => <span key={index} className={`omni-skeleton${index === lines - 1 ? ' short' : ''}`} />)}</div>;
}

function ResponseComparison(props: { data: AvailabilityResponsesResult | null; state: 'idle' | 'loading' | 'ready' | 'error'; error: string; onRefresh: () => void; onChoose: (responseId: string) => void; intent: PurchaseIntentResult | null; intentState: 'idle' | 'loading' | 'error' | 'success'; intentError: string }) {
  if (props.state === 'loading' && !props.data) return <div className="comparison-state" role="status"><OmniSkeleton lines={3} /><strong>Recherche des réponses…</strong><p>Omni vérifie les retours liés à votre demande.</p></div>;
  if (props.state === 'error') return <div className="comparison-state comparison-error" role="alert"><strong>Les réponses ne sont pas disponibles</strong><p>{props.error}</p><button className="secondary-button" type="button" onClick={props.onRefresh}>Réessayer</button></div>;
  if (!props.data || props.data.responses.length === 0) return <div className="comparison-state" role="status"><span className="response-mark"><Clock3 size={21} /></span><strong>{props.data?.requestStatus === 'expired' ? 'La demande a expiré' : 'En attente des vendeurs'}</strong><p>{props.data?.requestStatus === 'expired' ? 'Une nouvelle demande peut être envoyée depuis la facilité.' : 'Aucune réponse vérifiée pour le moment. Vous pouvez revenir plus tard sans perdre votre demande.'}</p><div className="comparison-actions"><button className="secondary-button" type="button" onClick={props.onRefresh}>Actualiser</button><span className="freshness-note">Expiration {props.data ? new Date(props.data.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'bientôt'}</span></div></div>;
  return <div className="comparison-content"><div className="comparison-summary"><div><span className="section-kicker">Réponses vérifiées</span><strong>{props.data.responses.length} option{props.data.responses.length === 1 ? '' : 's'} à comparer</strong></div><button className="text-button" type="button" onClick={props.onRefresh} aria-busy={props.state === 'loading'} disabled={props.state === 'loading'}>{props.state === 'loading' ? 'Actualisation…' : 'Actualiser'}</button></div>{props.intent && <div className="intent-success" role="status"><CheckCircle2 size={21} /><div><strong>Intention créée</strong><p>Transaction préparée. Gardez cette référence pour le prochain handoff.</p><code>{props.intent.transactionId}</code></div></div>}{props.intentError && <div className="inline-error" role="alert">{props.intentError}</div>}<div className="response-list">{props.data.responses.map((response) => <article className="response-card omni-card-enter" key={response.id}><div className="response-card-head"><span className={`response-status status-${response.status}`}>{responseStatusLabel(response.status)}</span><span className={`response-freshness freshness-${response.freshness}`}>{freshnessLabel(response.freshness)}</span></div><div className="response-card-title"><strong>{response.facilityName}</strong><small>{response.facilityCategory} · {response.productName}</small></div><div className="response-card-meta"><span><b>Quantité</b>{response.quantityAvailable === null ? 'Non indiquée' : response.quantityAvailable}</span><span><b>Prix</b>{response.priceMinor === null ? 'Non indiqué' : currency(response.priceMinor, response.currency)}</span><span><b>Reçu</b>{new Date(response.observedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>{response.sellerMessage && <p className="response-message">{response.sellerMessage}</p>}<div className="locked-note compact"><ShieldCheck size={16} /><span><strong>{props.intent ? 'Intention déjà préparée' : 'Intention encore verrouillée'}</strong><small>{props.intent ? 'Le vendeur doit maintenant préparer le handoff QR.' : 'Choisissez une réponse disponible pour préparer le handoff.'}</small></span></div>{response.status !== 'unavailable' && !props.intent && <button className="primary-button compact" type="button" aria-busy={props.intentState === 'loading'} disabled={props.intentState === 'loading'} onClick={() => props.onChoose(response.id)}>{props.intentState === 'loading' ? 'Préparation…' : 'Choisir cette offre'} <ArrowRight size={15} /></button>}</article>)}</div></div>;
}

function AvailabilitySheet(props: { facility: FacilityDetail | null; step: number; setStep: (value: number) => void; productId: string | null; setProductId: (value: string) => void; quantity: number; setQuantity: (value: number) => void; budgetMode: 'unlimited' | 'maximum'; setBudgetMode: (value: 'unlimited' | 'maximum') => void; budget: string; setBudget: (value: string) => void; state: 'idle' | 'loading' | 'error'; error: string; result: AvailabilityResult | null; responseData: AvailabilityResponsesResult | null; responseState: 'idle' | 'loading' | 'ready' | 'error'; responseError: string; purchaseIntent: PurchaseIntentResult | null; purchaseIntentState: 'idle' | 'loading' | 'error' | 'success'; purchaseIntentError: string; buyerQrState: 'idle' | 'loading' | 'error' | 'success'; buyerQrError: string; buyerQrResult: { transactionId: string; token: string; expiresAt: string } | null; onIssueBuyerQr: () => void; paymentMethod: ExternalPaymentMethod; setPaymentMethod: (value: ExternalPaymentMethod) => void; paymentState: 'idle' | 'loading' | 'error' | 'success'; paymentError: string; transactionState: TransactionState; onDeclarePayment: () => void; onMarkReceived: () => void; ratingScore: number; setRatingScore: (value: number) => void; ratingNote: string; setRatingNote: (value: string) => void; ratingState: 'idle' | 'loading' | 'error' | 'success'; ratingError: string; onSubmitRating: () => void; onChooseResponse: (responseId: string) => void; onRefreshResponses: () => void; chatMessages: TransactionMessage[]; chatState: 'idle' | 'loading' | 'error'; chatError: string; chatSending: boolean; onRefreshChat: () => void; onSendChat: (body: string) => void; onClose: () => void; onSubmit: () => void }) {
  if (!props.facility) return null;
  const selected = props.facility.products.find((product) => product.id === props.productId) ?? props.facility.products[0];
  const goBack = () => props.step > 1 && props.step < 4 ? props.setStep(props.step - 1) : props.onClose();
  return <section className="omni-sheet omni-sheet-enter omni-keyboard-aware context-sheet availability-sheet" role="dialog" aria-modal="true" aria-labelledby="availability-title"><div className="sheet-handle" /><div className="sheet-head"><div><span className="section-kicker">Vérifier la disponibilité</span><h2 id="availability-title">{props.facility.name}</h2></div><button type="button" onClick={goBack} aria-label={props.step > 1 && props.step < 4 ? 'Étape précédente' : 'Retour à la facilité'}><ArrowLeft size={18} /></button></div><div className="stepper omni-stagger" aria-label={`Étape ${props.step} sur 4`}><span className={props.step >= 1 ? 'active' : ''}>01<small>Produit</small></span><i /><span className={props.step >= 2 ? 'active' : ''}>02<small>Portée</small></span><i /><span className={props.step >= 3 ? 'active' : ''}>03<small>Contraintes</small></span><i /><span className={props.step >= 4 ? 'active' : ''}>04<small>Réponses</small></span></div>{props.step === 1 && <div className="step-content omni-step-enter"><p className="step-intro">Choisissez dans le catalogue de cette facilité. Vous n’avez pas besoin de retaper le produit.</p><div className="availability-bundle-note" role="note"><PackageSearch size={17} /><span><strong>Besoin de plusieurs produits ?</strong><small>La comparaison groupée arrive dans un contrat dédié. Pour l’instant, chaque vérification reste ciblée et traçable sur un seul produit.</small></span></div><div className="select-list">{props.facility.products.map((product) => <button type="button" key={product.id} className={`select-product ${props.productId === product.id ? 'selected' : ''}`} onClick={() => props.setProductId(product.id)}><span className="radio-dot" /><span><strong>{product.name}</strong><small>{currency(product.priceMinor, product.currency)} / {product.unit} · vérification sur demande</small></span><span className="product-price">{product.couponLabel ?? 'Offre'}</span></button>)}</div><button className="primary-button omni-pressable" type="button" disabled={!props.productId} onClick={() => props.setStep(2)}>Continuer <ArrowRight size={16} /></button></div>}{props.step === 2 && <div className="step-content omni-step-enter"><p className="step-intro">Cette première demande est ciblée sur la facilité sélectionnée. Omni n’interprète pas encore cette demande comme une réservation.</p><div className="scope-card"><span className="scope-icon"><MapPin size={18} /></span><div><strong>{props.facility.name}</strong><small>{props.facility.category} · une facilité ciblée</small></div><span className="scope-state">Ciblée</span></div><button className="primary-button omni-pressable" type="button" onClick={() => props.setStep(3)}>Définir les contraintes <ArrowRight size={16} /></button></div>}{props.step === 3 && <div className="step-content omni-step-enter"><p className="step-intro">Indiquez ce que le vendeur doit vérifier. Une demande de disponibilité ne bloque pas le stock.</p><div className="quantity-control"><div><span className="section-kicker">Quantité</span><strong>{selected?.name}</strong></div><div><button type="button" onClick={() => props.setQuantity(Math.max(1, props.quantity - 1))} aria-label="Diminuer la quantité">−</button><strong>{props.quantity}</strong><button type="button" onClick={() => props.setQuantity(props.quantity + 1)} aria-label="Augmenter la quantité">+</button></div></div><div className="budget-toggle"><button type="button" className={props.budgetMode === 'unlimited' ? 'active' : ''} onClick={() => props.setBudgetMode('unlimited')}>Sans plafond</button><button type="button" className={props.budgetMode === 'maximum' ? 'active' : ''} onClick={() => props.setBudgetMode('maximum')}>Prix maximum</button></div>{props.budgetMode === 'maximum' && <label className="money-input">Budget maximum<input type="number" min="0" step="0.01" value={props.budget} onChange={(event) => props.setBudget(event.target.value)} placeholder="0,00" /></label>}<div className="locked-note"><ShieldCheck size={17} /><span><strong>Les informations privées restent verrouillées</strong><small>Contact et itinéraire ne s’ouvrent qu’après une intention autorisée.</small></span></div>{props.error && <div className="inline-error" role="alert">{props.error}</div>}<button className="primary-button omni-pressable" type="button" aria-busy={props.state === 'loading'} disabled={props.state === 'loading'} onClick={props.onSubmit}>{props.state === 'loading' ? 'Envoi de la demande…' : 'Vérifier maintenant'} <ArrowRight size={16} /></button></div>}{props.step === 4 && <div className="step-content omni-step-enter"><div className="response-state"><span className="response-mark"><CheckCircle2 size={25} /></span><div><span className="section-kicker">Demande envoyée</span><h3>En attente de la disponibilité</h3><p>{props.result?.message ?? 'Omni attend une réponse de la facilité.'}</p></div></div><div className="response-meta"><span><strong>Produit</strong><small>{selected?.name}</small></span><span><strong>État</strong><small>Réponse vendeur attendue</small></span><span><strong>Expiration</strong><small>{props.result ? new Date(props.result.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '15 min'}</small></span></div><ResponseComparison data={props.responseData} state={props.responseState} error={props.responseError} onRefresh={props.onRefreshResponses} onChoose={props.onChooseResponse} intent={props.purchaseIntent} intentState={props.purchaseIntentState} intentError={props.purchaseIntentError} />{props.purchaseIntent && <div className="transaction-handoff"><div className="notice-card"><strong>QR transactionnel Buyer</strong><p>Générez votre QR ici. Il relie votre compte, l’offre appliquée et le snapshot de la transaction ; le vendeur le scannera à la caisse.</p>{props.buyerQrState === 'error' && <div className="inline-error" role="alert">{props.buyerQrError}</div>}{props.buyerQrState === 'success' && props.buyerQrResult ? <><TransactionQrCard transactionId={props.buyerQrResult.transactionId} token={props.buyerQrResult.token} expiresAt={props.buyerQrResult.expiresAt} /><small>Présentez ce QR transactionnel dans Omni au vendeur. Le QR public de la facilité sert uniquement à la découverte.</small></> : <button className="secondary-button wide omni-pressable" type="button" aria-busy={props.buyerQrState === 'loading'} disabled={props.buyerQrState === 'loading'} onClick={props.onIssueBuyerQr}>{props.buyerQrState === 'loading' ? 'Génération du QR…' : 'Générer mon QR transactionnel'}</button>}<code>{props.purchaseIntent.transactionId}</code></div><TransactionChat token="session" transactionId={props.purchaseIntent.transactionId} actorRole="buyer" messages={props.chatMessages} state={props.chatState} error={props.chatError} onRefresh={props.onRefreshChat} onSend={props.onSendChat} sending={props.chatSending} /><a className="secondary-button wide omni-pressable" href={`https://www.google.com/maps/dir/?api=1&destination=${props.facility.latitude},${props.facility.longitude}`} target="_blank" rel="noreferrer">Ouvrir l’itinéraire vers la facilité <ArrowRight size={15} /></a><label className="seller-message-field">Mode de paiement<select value={props.paymentMethod} onChange={(event) => props.setPaymentMethod(event.target.value as ExternalPaymentMethod)}><option value="mobile_money">Mobile money</option><option value="cash">Espèces</option><option value="pay_on_delivery">Paiement à la livraison</option></select></label>{props.paymentError && <div className="inline-error" role="alert">{props.paymentError}</div>}{props.paymentState === 'success' && props.transactionState === 'payment_declared' ? <div className="seller-response-success" role="status"><CheckCircle2 size={21} /><div><strong>Paiement déclaré</strong><p>Le vendeur doit confirmer puis effectuer la remise.</p></div></div> : <button className="primary-button omni-pressable" type="button" disabled={props.paymentState === 'loading' || props.transactionState !== 'qr_verified'} onClick={props.onDeclarePayment}>{props.paymentState === 'loading' ? 'Déclaration…' : props.transactionState === 'qr_verified' ? 'Déclarer le paiement' : 'En attente de vérification QR'} <ArrowRight size={16} /></button>}{props.transactionState === 'fulfilled' && <button className="secondary-button wide omni-pressable" type="button" aria-busy={props.paymentState === 'loading'} disabled={props.paymentState === 'loading'} onClick={props.onMarkReceived}>Confirmer la réception</button>}{props.transactionState === 'received' && <div className="transaction-rating" aria-labelledby="transaction-rating-title"><div className="seller-response-success" role="status"><CheckCircle2 size={21} /><div><strong id="transaction-rating-title">Réception confirmée</strong><p>Votre avis est requis pour clôturer la transaction et renforcer la crédibilité du vendeur.</p></div></div><div className="rating-score" role="group" aria-label="Score du vendeur">{[1, 2, 3, 4, 5].map((score) => <button key={score} type="button" className={props.ratingScore === score ? 'active' : ''} aria-pressed={props.ratingScore === score} onClick={() => props.setRatingScore(score)}>{score}</button>)}</div><label className="seller-message-field">Votre avis <textarea value={props.ratingNote} onChange={(event) => props.setRatingNote(event.target.value)} maxLength={500} rows={3} placeholder="Partagez brièvement votre expérience" /></label>{props.ratingError && <div className="inline-error" role="alert">{props.ratingError}</div>}<button className="primary-button wide omni-pressable" type="button" aria-busy={props.ratingState === 'loading'} disabled={props.ratingState === 'loading'} onClick={props.onSubmitRating}>{props.ratingState === 'loading' ? 'Enregistrement…' : 'Publier mon avis'} <ArrowRight size={16} /></button></div>}{props.transactionState === 'rated' && <div className="seller-response-success" role="status"><CheckCircle2 size={21} /><div><strong>Avis enregistré</strong><p>Merci. Cette transaction est maintenant clôturée côté Buyer.</p></div></div>}</div>}<button className="secondary-button wide omni-pressable" type="button" onClick={props.onClose}>Retour à la facilité</button></div>}</section>;
}
