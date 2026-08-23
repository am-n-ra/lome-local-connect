import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, ChevronRight, Clock3, LogIn, LogOut, MapPin, PackageSearch, Search, ShieldCheck, X } from 'lucide-react';
import { authClient, getAuthToken } from '../auth';
import { getFacilityDetail, listPublicFacilities, requestAvailability } from './api';
import { TrunkMap } from './TrunkMap';
import type { AvailabilityResult, FacilityDetail, PublicFacility, SearchOptions } from './types';

const emptySearchOptions: SearchOptions = { category: '' };

type Panel = 'none' | 'auth' | 'facility' | 'availability';
type AuthMode = 'sign-in' | 'sign-up';
type SessionUser = { id: string; email: string | null; name: string | null };
type AuthReturn = 'none' | 'availability';

function currency(minor: number, code: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: code, maximumFractionDigits: 2 }).format(minor / 100);
}

function trustLabel(trust: PublicFacility['trust']) {
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
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAllResults, setShowAllResults] = useState(false);
  const [draftOptions, setDraftOptions] = useState<SearchOptions>(emptySearchOptions);
  const [appliedOptions, setAppliedOptions] = useState<SearchOptions>(emptySearchOptions);
  const [authReturn, setAuthReturn] = useState<AuthReturn>('none');

  const selectedProduct = useMemo(() => selectedFacility?.products.find((product) => product.id === selectedProductId) ?? null, [selectedFacility, selectedProductId]);
  const categoryOptions = useMemo(() => {
    const categories = new Set(facilities.map((facility) => facility.category).filter(Boolean));
    if (draftOptions.category) categories.add(draftOptions.category);
    return ['', ...Array.from(categories).sort()];
  }, [draftOptions.category, facilities]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (panel !== 'none') {
        if (panel === 'availability') setPanel('facility');
        else setPanel('none');
        return;
      }
      if (optionsOpen) {
        setOptionsOpen(false);
        return;
      }
      if (menuOpen) setMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen, optionsOpen, panel]);

  useEffect(() => {
    if (window.location.pathname === '/auth' || window.location.pathname.startsWith('/auth/')) {
      setPanel('auth');
    }
  }, []);

  useEffect(() => {
    let active = true;
    authClient?.getSession().then((result) => {
      const data = result.data as { user?: { id?: string; email?: string | null; name?: string | null } } | null | undefined;
      if (active && data?.user?.id) setSessionUser({ id: data.user.id, email: data.user.email ?? null, name: data.user.name ?? null });
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setMapState('loading');
    listPublicFacilities(bounds, committedQuery || undefined, appliedOptions).then((result) => {
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
  }, [appliedOptions, bounds, committedQuery]);

  const openAuth = (mode: AuthMode = 'sign-in', returnTo: AuthReturn = 'none') => {
    setAuthMode(mode);
    setAuthError('');
    setAuthReturn(returnTo);
    setMenuOpen(false);
    setOptionsOpen(false);
    setPanel('auth');
  };

  const beginSearch = (event?: FormEvent) => {
    event?.preventDefault();
    if (!sessionUser) {
      openAuth('sign-in');
      return;
    }
    setAppliedOptions(draftOptions);
    setCommittedQuery(query.trim());
    setShowAllResults(true);
    setOptionsOpen(false);
    setMenuOpen(false);
    setError('');
  };

  const applyOptions = () => {
    if (!sessionUser) {
      openAuth('sign-in');
      return;
    }
    setAppliedOptions(draftOptions);
    setCommittedQuery(query.trim());
    setShowAllResults(true);
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
    setDraftOptions(emptySearchOptions);
    setAppliedOptions(emptySearchOptions);
    setQuantity(1);
    setBudgetMode('unlimited');
    setBudget('');
    setBounds(undefined);
    setShowAllResults(false);
    setOptionsOpen(false);
    setMenuOpen(false);
  };

  const selectFacility = async (facility: PublicFacility, verify = false) => {
    setPanel('facility');
    setSelectedFacility(null);
    setSelectedProductId(null);
    setDetailState('loading');
    setError('');
    const result = await getFacilityDetail(facility.id);
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
      setAvailability(null);
      setRequestState('idle');
      if (sessionUser) setPanel('availability');
    }
  };

  const openAvailability = () => {
    if (!selectedFacility?.products.length) return;
    setAvailabilityStep(1);
    setSelectedProductId(selectedProductId ?? selectedFacility.products[0].id);
    setQuantity(Math.max(1, quantity));
    setAvailability(null);
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
      const result = await requestAvailability({
        productId: selectedProduct.id,
        facilityId: selectedFacility.id,
        quantity,
        budgetMode,
        budgetMinor: numericBudget,
        token,
        idempotencyKey: `availability-${selectedFacility.id}-${selectedProduct.id}-${quantity}`,
      });
      if (result.ok && result.data) {
        setAvailability(result.data);
        setRequestState('idle');
        setAvailabilityStep(4);
      } else {
        setRequestState('error');
        setError(result.error?.message ?? 'La demande de disponibilité n’a pas pu être envoyée.');
      }
    } catch (caught) {
      setRequestState('error');
      setError(caught instanceof Error ? caught.message : 'La demande de disponibilité n’a pas pu être envoyée.');
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
      const session = await authClient.getSession();
      const data = session.data as { user?: { id?: string; email?: string | null; name?: string | null } } | null | undefined;
      if (!data?.user?.id) throw new Error('Auth succeeded but no active session was returned.');
      setSessionUser({ id: data.user.id, email: data.user.email ?? null, name: data.user.name ?? null });
      setAppliedOptions(draftOptions);
      setAuthState('idle');
      const resumePanel = authReturn === 'availability' ? 'availability' : 'none';
      setAuthReturn('none');
      setPanel(resumePanel);
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

  return (
    <main className={mainClass} data-auth={authClient ? 'configured' : 'missing'}>
      <TrunkMap facilities={facilities} selectedId={selectedFacility?.id ?? null} onSelect={selectFacility} onBoundsChange={setBounds} />

      <header className="species-topbar">
        <div className="role-switch" aria-label="Omni role context">
          <button className="role-option active" type="button" aria-current="page">Acheter</button>
          <button className="role-option" type="button" onClick={() => openAuth('sign-in')}>Vendre</button>
        </div>
        <button className="account-orb" type="button" aria-label="Ouvrir le compte et le menu Omni" aria-expanded={menuOpen} aria-controls="omni-menu" onClick={() => { setMenuOpen((open) => !open); setOptionsOpen(false); }}>
          {sessionUser ? (sessionUser.name?.slice(0, 2).toUpperCase() || 'OM') : 'J5'}
        </button>
      </header>

      {menuOpen && <aside id="omni-menu" className="account-menu" role="menu" aria-label="Menu Omni">
        <div className="menu-brand"><img src="/omni-logo-transparent.png" alt="" /><div><strong>omni</strong><small>{sessionUser ? 'Votre espace' : 'See before you move'}</small></div><button type="button" onClick={() => setMenuOpen(false)} aria-label="Fermer le menu"><X size={16} /></button></div>
        <p>{sessionUser ? 'Votre compte est prêt pour vérifier les disponibilités.' : 'Explorez les lieux publics. Créez votre compte pour rechercher et vérifier.'}</p>
        {!sessionUser ? <button className="menu-action" type="button" role="menuitem" onClick={() => openAuth('sign-in')}><LogIn size={16} /> Se connecter ou créer un compte</button> : <button className="menu-action" type="button" role="menuitem" onClick={signOut}><LogOut size={16} /> Se déconnecter</button>}
        <button className="menu-action secondary" type="button" role="menuitem" onClick={resetSearch}><MapPin size={16} /> Réinitialiser la carte</button>
      </aside>}

      {mapState === 'error' && <div className="map-error" role="alert"><span>{error}</span><button type="button" onClick={() => setBounds((current) => current ? [...current] as [number, number, number, number] : undefined)}>Réessayer</button></div>}

      {panel === 'none' && <>
        <div className="search-anchor">
          {optionsOpen && <SearchOptionsPopover category={draftOptions.category} categoryOptions={categoryOptions} setCategory={(category) => setDraftOptions({ category })} quantity={quantity} setQuantity={setQuantity} budgetMode={budgetMode} setBudgetMode={setBudgetMode} budget={budget} setBudget={setBudget} onClear={clearOptions} onApply={applyOptions} onClose={() => setOptionsOpen(false)} />}
          <form className="search-pill" aria-label="Recherche Omni" onSubmit={beginSearch}>
            <Search size={17} aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un commerce, un produit…" aria-label="Rechercher un commerce ou un produit" />
            <button className="pill-options" type="button" aria-expanded={optionsOpen} aria-controls="search-options" aria-label={optionsOpen ? 'Fermer les options' : 'Ouvrir les options'} onClick={() => { setOptionsOpen((open) => !open); setMenuOpen(false); }}><ChevronDown size={17} className={optionsOpen ? 'chevron-up' : ''} /></button>
          </form>
        </div>
        <NearbySheet facilities={visibleFacilities} mapState={mapState} committedQuery={committedQuery} onOpenFacility={(facility) => selectFacility(facility)} onVerify={(facility) => selectFacility(facility, true)} onShowAll={() => setShowAllResults(true)} showAll={showAllResults} />
      </>}

      {panel !== 'none' && <div className="sheet-backdrop" onClick={() => panel !== 'auth' && setPanel(panel === 'availability' ? 'facility' : 'none')} />}
      {panel === 'auth' && <AuthSheet mode={authMode} setMode={setAuthMode} email={authEmail} setEmail={setAuthEmail} password={authPassword} setPassword={setAuthPassword} name={authName} setName={setAuthName} state={authState} error={authError} onSubmit={submitAuth} onClose={() => { setAuthReturn('none'); setPanel('none'); }} />}
      {panel === 'facility' && <FacilitySheet facility={selectedFacility} state={detailState} error={error} onClose={() => setPanel('none')} onVerify={openAvailability} />}
      {panel === 'availability' && <AvailabilitySheet facility={selectedFacility} step={availabilityStep} setStep={setAvailabilityStep} productId={selectedProductId} setProductId={setSelectedProductId} quantity={quantity} setQuantity={setQuantity} budgetMode={budgetMode} setBudgetMode={setBudgetMode} budget={budget} setBudget={setBudget} state={requestState} error={error} result={availability} onClose={() => setPanel('facility')} onSubmit={submitAvailability} />}
    </main>
  );
}

function NearbySheet(props: { facilities: PublicFacility[]; mapState: 'loading' | 'ready' | 'empty' | 'error'; committedQuery: string; showAll: boolean; onOpenFacility: (facility: PublicFacility) => void; onVerify: (facility: PublicFacility) => void; onShowAll: () => void }) {
  return <section className="nearby-sheet" aria-label="Facilités proches">
    <div className="sheet-handle" />
    <div className="nearby-heading"><div><span className="section-kicker">Omni</span><h1>{props.committedQuery ? `Résultats pour « ${props.committedQuery} »` : 'Proche de vous'}</h1></div><button type="button" className="see-all" onClick={props.onShowAll} disabled={props.showAll || !props.facilities.length}>Voir tout</button></div>
    {props.mapState === 'loading' && <div className="nearby-empty"><span className="loading-dot" /><span>Recherche des lieux autour de vous…</span></div>}
    {props.mapState === 'error' && <div className="nearby-empty"><strong>La carte continue de fonctionner</strong><span>La découverte publique peut être réessayée depuis les contrôles.</span></div>}
    {props.mapState === 'empty' && <div className="nearby-empty"><strong>Aucun lieu dans cette vue</strong><span>Déplacez la carte ou ajustez votre recherche.</span></div>}
    {props.mapState === 'ready' && <div className="nearby-rail" tabIndex={0} aria-label="Résultats proches">{props.facilities.map((facility) => <article className="nearby-card" key={facility.id}>
      <button className="nearby-card-main" type="button" onClick={() => props.onOpenFacility(facility)}>
        <span className="facility-card-icon"><MapPin size={17} /></span>
        <span className="nearby-card-copy"><span className="status-pill">{publicBadge(facility)}</span><strong>{facility.name}</strong><small>{facility.category} · Lieu local</small></span>
        <ChevronRight size={16} className="card-chevron" aria-hidden="true" />
      </button>
      <button className="card-cta" type="button" disabled={facility.productCount === 0} onClick={() => props.onVerify(facility)}>{facility.productCount ? 'Vérifier la disponibilité' : 'Voir le lieu'}</button>
    </article>)}</div>}
  </section>;
}

function SearchOptionsPopover(props: { category: string; categoryOptions: string[]; setCategory: (value: string) => void; quantity: number; setQuantity: (value: number) => void; budgetMode: 'unlimited' | 'maximum'; setBudgetMode: (value: 'unlimited' | 'maximum') => void; budget: string; setBudget: (value: string) => void; onClear: () => void; onApply: () => void; onClose: () => void }) {
  return <section id="search-options" className="options-popover" role="region" aria-label="Options de recherche"><div className="options-head"><div><span className="section-kicker">Affiner</span><strong>Options de recherche</strong></div><button type="button" onClick={props.onClose} aria-label="Fermer les options"><X size={16} /></button></div><label className="option-field">Catégorie<select value={props.category} onChange={(event) => props.setCategory(event.target.value)}><option value="">Toutes les catégories</option>{props.categoryOptions.filter(Boolean).map((category) => <option key={category} value={category}>{category}</option>)}</select></label><div className="option-grid"><label className="option-field">Quantité<input type="number" min="1" step="1" value={props.quantity} onChange={(event) => props.setQuantity(Math.max(1, Number(event.target.value) || 1))} /></label><div className="option-field"><span>Budget</span><div className="option-toggle"><button type="button" className={props.budgetMode === 'unlimited' ? 'active' : ''} onClick={() => props.setBudgetMode('unlimited')}>Sans plafond</button><button type="button" className={props.budgetMode === 'maximum' ? 'active' : ''} onClick={() => props.setBudgetMode('maximum')}>Maximum</button></div></div></div>{props.budgetMode === 'maximum' && <label className="option-field">Montant maximum<input type="number" min="0" step="0.01" value={props.budget} onChange={(event) => props.setBudget(event.target.value)} placeholder="0,00" /></label>}<div className="options-actions"><button className="text-button" type="button" onClick={props.onClear}>Effacer</button><button className="primary-button" type="button" onClick={props.onApply}>Appliquer</button></div></section>;
}

function AuthSheet(props: { mode: AuthMode; setMode: (mode: AuthMode) => void; email: string; setEmail: (value: string) => void; password: string; setPassword: (value: string) => void; name: string; setName: (value: string) => void; state: 'idle' | 'loading' | 'error'; error: string; onSubmit: (event: FormEvent) => void; onClose: () => void }) {
  return <section className="omni-sheet auth-sheet" role="dialog" aria-modal="true" aria-labelledby="auth-title"><div className="sheet-handle" /><div className="sheet-head"><div><span className="section-kicker">Compte Omni</span><h2 id="auth-title">{props.mode === 'sign-in' ? 'Recherchez avec certitude' : 'Commencez à voir avant de bouger'}</h2></div><button type="button" onClick={props.onClose} aria-label="Fermer"><X size={18} /></button></div><p className="sheet-lede">La carte publique reste ouverte. Votre compte débloque la recherche catalogue et la vérification de disponibilité.</p><form onSubmit={props.onSubmit} className="auth-form">{props.mode === 'sign-up' && <label>Prénom<input value={props.name} onChange={(event) => props.setName(event.target.value)} placeholder="Votre prénom" autoComplete="name" /></label>}<label>Email<input type="email" required value={props.email} onChange={(event) => props.setEmail(event.target.value)} placeholder="vous@exemple.com" autoComplete="email" /></label><label>Mot de passe<input type="password" required minLength={8} value={props.password} onChange={(event) => props.setPassword(event.target.value)} placeholder="8 caractères minimum" autoComplete={props.mode === 'sign-in' ? 'current-password' : 'new-password'} /></label>{props.error && <div className="inline-error" role="alert">{props.error}</div>}<button className="primary-button" type="submit" disabled={props.state === 'loading'}>{props.state === 'loading' ? 'Connexion…' : props.mode === 'sign-in' ? 'Se connecter' : 'Créer mon compte'}</button></form><button className="text-button auth-switch" type="button" onClick={() => props.setMode(props.mode === 'sign-in' ? 'sign-up' : 'sign-in')}>{props.mode === 'sign-in' ? 'Nouveau sur Omni ? Créer un compte' : 'Déjà un compte ? Se connecter'}</button></section>;
}

function FacilitySheet(props: { facility: FacilityDetail | null; state: 'idle' | 'loading' | 'error'; error: string; onClose: () => void; onVerify: () => void }) {
  return <section className="omni-sheet context-sheet facility-sheet" role="dialog" aria-modal="true" aria-labelledby="facility-title"><div className="sheet-handle" /><div className="sheet-head"><button className="back-button" type="button" onClick={props.onClose}><ArrowLeft size={17} /> Carte</button><button type="button" onClick={props.onClose} aria-label="Fermer"><X size={18} /></button></div>{props.state === 'loading' && <div className="sheet-loading"><span className="spinner" /> Ouverture de la facilité…</div>}{props.state === 'error' && <div className="empty-state"><PackageSearch size={26} /><strong>Facilité indisponible</strong><p>{props.error}</p><button type="button" className="secondary-button" onClick={props.onClose}>Retour à la carte</button></div>}{props.facility && props.state === 'idle' && <><div className="facility-identity"><span className="facility-identity-icon"><MapPin size={21} /></span><div><span className="section-kicker">{props.facility.category}</span><h2 id="facility-title">{props.facility.name}</h2><p>{props.facility.address ?? 'Lieu partagé sur la carte publique'}</p></div></div><div className="trust-row"><span className="trust-badge"><ShieldCheck size={14} /> {trustLabel(props.facility.trust)}</span>{props.facility.plan === 'pro_active' && <span className="pro-badge">Pro</span>}</div>{props.facility.trust === 'unclaimed' ? <div className="notice-card"><strong>Lieu public, pas encore certifié</strong><p>Ce pin vient d’une source publique. Une revendication doit passer par la vérification avant toute publication de catalogue.</p></div> : props.facility.products.length ? <><div className="catalogue-heading"><div><span className="section-kicker">Catalogue de la facilité</span><strong>{props.facility.products.length} offre{props.facility.products.length === 1 ? '' : 's'}</strong></div><span>Source facility</span></div><div className="catalogue-list">{props.facility.products.slice(0, 5).map((product) => <div className="catalogue-item" key={product.id}><span className="product-icon"><PackageSearch size={16} /></span><span><strong>{product.name}</strong><small>{product.description ?? product.category ?? 'Offre locale'} · {currency(product.priceMinor, product.currency)} / {product.unit}</small></span></div>)}</div><button className="primary-button" type="button" onClick={props.onVerify}>Vérifier la disponibilité <ArrowRight size={16} /></button></> : <div className="empty-state compact"><Clock3 size={25} /><strong>Catalogue non publié</strong><p>Cette facilité n’a pas encore d’offre publique à vérifier.</p></div>}<p className="privacy-note">Les contacts et l’itinéraire apparaissent seulement après une intention d’achat autorisée.</p></>}</section>;
}

function AvailabilitySheet(props: { facility: FacilityDetail | null; step: number; setStep: (value: number) => void; productId: string | null; setProductId: (value: string) => void; quantity: number; setQuantity: (value: number) => void; budgetMode: 'unlimited' | 'maximum'; setBudgetMode: (value: 'unlimited' | 'maximum') => void; budget: string; setBudget: (value: string) => void; state: 'idle' | 'loading' | 'error'; error: string; result: AvailabilityResult | null; onClose: () => void; onSubmit: () => void }) {
  if (!props.facility) return null;
  const selected = props.facility.products.find((product) => product.id === props.productId) ?? props.facility.products[0];
  return <section className="omni-sheet context-sheet availability-sheet" role="dialog" aria-modal="true" aria-labelledby="availability-title"><div className="sheet-handle" /><div className="sheet-head"><div><span className="section-kicker">Vérifier la disponibilité</span><h2 id="availability-title">{props.facility.name}</h2></div><button type="button" onClick={props.onClose} aria-label="Retour"><ArrowLeft size={18} /></button></div><div className="stepper" aria-label={`Étape ${props.step} sur 4`}><span className={props.step >= 1 ? 'active' : ''}>01<small>Produit</small></span><i /><span className={props.step >= 2 ? 'active' : ''}>02<small>Portée</small></span><i /><span className={props.step >= 3 ? 'active' : ''}>03<small>Contraintes</small></span><i /><span className={props.step >= 4 ? 'active' : ''}>04<small>Réponses</small></span></div>{props.step === 1 && <div className="step-content"><p className="step-intro">Choisissez dans le catalogue de cette facilité. Vous n’avez pas besoin de retaper le produit.</p><div className="select-list">{props.facility.products.map((product) => <button type="button" key={product.id} className={`select-product ${props.productId === product.id ? 'selected' : ''}`} onClick={() => props.setProductId(product.id)}><span className="radio-dot" /><span><strong>{product.name}</strong><small>{currency(product.priceMinor, product.currency)} / {product.unit} · vérification sur demande</small></span><span className="product-price">{product.couponLabel ?? 'Offre'}</span></button>)}</div><button className="primary-button" type="button" disabled={!props.productId} onClick={() => props.setStep(2)}>Continuer <ArrowRight size={16} /></button></div>}{props.step === 2 && <div className="step-content"><p className="step-intro">Cette première demande est ciblée sur la facilité sélectionnée. Omni n’interprète pas encore cette demande comme une réservation.</p><div className="scope-card"><span className="scope-icon"><MapPin size={18} /></span><div><strong>{props.facility.name}</strong><small>{props.facility.category} · une facilité ciblée</small></div><span className="scope-state">Ciblée</span></div><button className="primary-button" type="button" onClick={() => props.setStep(3)}>Définir les contraintes <ArrowRight size={16} /></button></div>}{props.step === 3 && <div className="step-content"><p className="step-intro">Indiquez ce que le vendeur doit vérifier. Une demande de disponibilité ne bloque pas le stock.</p><div className="quantity-control"><div><span className="section-kicker">Quantité</span><strong>{selected?.name}</strong></div><div><button type="button" onClick={() => props.setQuantity(Math.max(1, props.quantity - 1))} aria-label="Diminuer la quantité">−</button><strong>{props.quantity}</strong><button type="button" onClick={() => props.setQuantity(props.quantity + 1)} aria-label="Augmenter la quantité">+</button></div></div><div className="budget-toggle"><button type="button" className={props.budgetMode === 'unlimited' ? 'active' : ''} onClick={() => props.setBudgetMode('unlimited')}>Sans plafond</button><button type="button" className={props.budgetMode === 'maximum' ? 'active' : ''} onClick={() => props.setBudgetMode('maximum')}>Prix maximum</button></div>{props.budgetMode === 'maximum' && <label className="money-input">Budget maximum<input type="number" min="0" step="0.01" value={props.budget} onChange={(event) => props.setBudget(event.target.value)} placeholder="0,00" /></label>}<div className="locked-note"><ShieldCheck size={17} /><span><strong>Les informations privées restent verrouillées</strong><small>Contact et itinéraire ne s’ouvrent qu’après une intention autorisée.</small></span></div>{props.error && <div className="inline-error" role="alert">{props.error}</div>}<button className="primary-button" type="button" disabled={props.state === 'loading'} onClick={props.onSubmit}>{props.state === 'loading' ? 'Envoi de la demande…' : 'Vérifier maintenant'} <ArrowRight size={16} /></button></div>}{props.step === 4 && <div className="step-content"><div className="response-state"><span className="response-mark"><CheckCircle2 size={25} /></span><div><span className="section-kicker">Demande envoyée</span><h3>En attente de la disponibilité</h3><p>{props.result?.message ?? 'Omni attend une réponse de la facilité.'}</p></div></div><div className="response-meta"><span><strong>Produit</strong><small>{selected?.name}</small></span><span><strong>État</strong><small>Réponse vendeur attendue</small></span><span><strong>Expiration</strong><small>{props.result ? new Date(props.result.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '15 min'}</small></span></div><div className="comparison-placeholder"><strong>La comparaison apparaîtra ici</strong><span>Quand une réponse vérifiée sera disponible, vous pourrez comparer les options avant de créer une intention d’achat.</span></div><button className="secondary-button wide" type="button" onClick={props.onClose}>Retour à la facilité</button></div>}</section>;
}
