import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, ChevronDown, Clock3, LogIn, LogOut, MapPin, Minus, Plus, PackageSearch, Search, ShieldCheck, Sparkles, Menu, X } from 'lucide-react';
import { authClient, getAuthToken } from '../auth';
import { getFacilityDetail, listPublicFacilities, requestAvailability } from './api';
import { TrunkMap } from './TrunkMap';
import type { AvailabilityResult, FacilityDetail, PublicFacility, SearchOptions } from './types';

const emptySearchOptions: SearchOptions = { category: '' };

type Panel = 'none' | 'auth' | 'facility' | 'availability' | 'submitted';
type AuthMode = 'sign-in' | 'sign-up';
type SessionUser = { id: string; email: string | null; name: string | null };

function currency(minor: number, code: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: code, maximumFractionDigits: 2 }).format(minor / 100);
}

function labelTrust(trust: PublicFacility['trust']) {
  if (trust === 'confirmed') return 'Confirmed by Omni sales';
  if (trust === 'unconfirmed') return 'Certified seller';
  if (trust === 'certified') return 'Certified facility';
  return 'Public place · unclaimed';
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
  const [draftOptions, setDraftOptions] = useState<SearchOptions>(emptySearchOptions);
  const [appliedOptions, setAppliedOptions] = useState<SearchOptions>(emptySearchOptions);

  const selectedProduct = useMemo(() => selectedFacility?.products.find((product) => product.id === selectedProductId) ?? null, [selectedFacility, selectedProductId]);
  const categoryOptions = useMemo(() => {
    const categories = new Set(facilities.map((facility) => facility.category).filter(Boolean));
    if (draftOptions.category) categories.add(draftOptions.category);
    return ['', ...Array.from(categories).sort()];
  }, [draftOptions.category, facilities]);

  useEffect(() => {
    let active = true;
    if (!authClient) return undefined;
    authClient.getSession().then((result) => {
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
      } else {
        setMapState('error');
        setError(result.error?.message ?? 'Public discovery is temporarily unavailable.');
      }
    }).catch(() => { if (active) { setMapState('error'); setError('Public discovery is temporarily unavailable.'); } });
    return () => { active = false; };
  }, [appliedOptions, bounds, committedQuery]);

  const openAuth = (mode: AuthMode = 'sign-in') => { setAuthMode(mode); setAuthError(''); setMenuOpen(false); setOptionsOpen(false); setPanel('auth'); };

  const beginSearch = (event?: FormEvent) => {
    event?.preventDefault();
    if (!sessionUser) { openAuth('sign-in'); return; }
    setAppliedOptions(draftOptions);
    setCommittedQuery(query.trim());
    setOptionsOpen(false);
    setMenuOpen(false);
    setError('');
  };

  const applyOptions = () => {
    if (!sessionUser) { openAuth('sign-in'); return; }
    setAppliedOptions(draftOptions);
    setCommittedQuery(query.trim());
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
    setOptionsOpen(false);
    setMenuOpen(false);
  };

  const selectFacility = async (facility: PublicFacility) => {
    setPanel('facility');
    setSelectedFacility(null);
    setSelectedProductId(null);
    setDetailState('loading');
    setError('');
    const result = await getFacilityDetail(facility.id);
    if (result.ok && result.data) { setSelectedFacility(result.data); setDetailState('idle'); }
    else { setDetailState('error'); setError(result.error?.message ?? 'This facility could not be opened.'); }
  };

  const openAvailability = () => {
    if (!sessionUser) { openAuth('sign-in'); return; }
    if (!selectedFacility?.products.length) return;
    setAvailabilityStep(1);
    setSelectedProductId(selectedFacility.products[0].id);
    setQuantity(Math.max(1, quantity));
    setAvailability(null);
    setRequestState('idle');
    setPanel('availability');
  };

  const submitAvailability = async () => {
    if (!selectedFacility || !selectedProduct || !authClient) { openAuth('sign-in'); return; }
    setRequestState('loading');
    setError('');
    try {
      const token = await getAuthToken();
      if (!token) { openAuth('sign-in'); setRequestState('idle'); return; }
      const result = await requestAvailability({
        productId: selectedProduct.id,
        facilityId: selectedFacility.id,
        quantity,
        budgetMode,
        budgetMinor: budgetMode === 'maximum' && budget ? Math.round(Number(budget) * 100) : null,
        token,
        idempotencyKey: `availability-${selectedFacility.id}-${selectedProduct.id}-${quantity}`,
      });
      if (result.ok && result.data) { setAvailability(result.data); setRequestState('idle'); setPanel('submitted'); }
      else { setRequestState('error'); setError(result.error?.message ?? 'The availability request could not be sent.'); }
    } catch (caught) {
      setRequestState('error');
      setError(caught instanceof Error ? caught.message : 'The availability request could not be sent.');
    }
  };

  const submitAuth = async (event: FormEvent) => {
    event.preventDefault();
    if (!authClient) { setAuthError('Neon Auth is not configured in this environment.'); return; }
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
      setPanel('none');
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
  };

  const openMenu = () => { setMenuOpen((open) => !open); setOptionsOpen(false); };
  const mainClass = `trunk-app${optionsOpen ? ' options-is-open' : ''}${menuOpen ? ' menu-is-open' : ''}`;

  return (
    <main className={mainClass}>
      <TrunkMap facilities={facilities} selectedId={selectedFacility?.id ?? null} onSelect={selectFacility} onBoundsChange={setBounds} />
      <div className="map-vignette" aria-hidden="true" />

      <header className="topbar">
        <a className="brand" href="/" aria-label="Omni home">
          <img src="/omni-logo.png" alt="" />
          <span><strong>omni</strong><small>see before you move</small></span>
        </a>
        <div className="topbar-actions">
          <span className="live-chip"><span /> live discovery</span>
          <button className="menu-button" type="button" aria-label={menuOpen ? 'Close Omni menu' : 'Open Omni menu'} aria-expanded={menuOpen} aria-controls="omni-menu" onClick={openMenu}>
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </header>

      {menuOpen && <aside id="omni-menu" className="menu-popover" role="menu" aria-label="Omni menu">
        <div className="menu-head"><div><span className="eyebrow">Omni navigation</span><strong>{sessionUser ? 'Your search workspace' : 'Explore before you move'}</strong></div><button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={16} /></button></div>
        <p>{sessionUser ? 'Your account is ready for availability checks.' : 'Explore public places freely. Sign in when you want search and availability certainty.'}</p>
        {!sessionUser ? <button className="menu-action" type="button" role="menuitem" onClick={() => openAuth('sign-in')}><LogIn size={16} /> Sign in or create account</button> : <button className="menu-action" type="button" role="menuitem" onClick={signOut}><LogOut size={16} /> Sign out</button>}
        <button className="menu-action secondary" type="button" role="menuitem" onClick={resetSearch}><MapPin size={16} /> Reset map search</button>
      </aside>}

      <div className="map-caption" aria-live="polite">
        <span className="caption-icon"><MapPin size={15} /></span>
        <span><strong>{committedQuery ? `Results for “${committedQuery}”` : 'The world around you'}</strong><small>{mapState === 'loading' ? 'Updating the live map…' : mapState === 'empty' ? 'No facilities in this view yet' : `${facilities.length} public places in view`}</small></span>
      </div>

      {mapState === 'error' && <div className="map-error" role="alert"><span>{error}</span><button type="button" onClick={() => setBounds((current) => current ? [...current] as [number, number, number, number] : undefined)}>Retry</button></div>}

      {panel === 'none' && facilities.length > 0 && <aside className="result-rail" aria-label="Facilities in view">{facilities.slice(0, 3).map((facility) => <button className="facility-teaser" type="button" key={facility.id} onClick={() => selectFacility(facility)}><span className="teaser-pin"><MapPin size={14} /></span><span className="teaser-copy"><strong>{facility.name}</strong><small>{facility.category} · {facility.productCount ? `${facility.productCount} live offer${facility.productCount === 1 ? '' : 's'}` : 'public place'}</small></span><span className={`teaser-trust ${facility.trust}`}>{facility.trust === 'unclaimed' ? 'Public' : facility.trust === 'confirmed' ? 'Confirmed' : 'Certified'}</span></button>)}</aside>}

      <div className="dock-wrap">
        {optionsOpen && <SearchOptionsPopover category={draftOptions.category} categoryOptions={categoryOptions} setCategory={(category) => setDraftOptions({ category })} quantity={quantity} setQuantity={setQuantity} budgetMode={budgetMode} setBudgetMode={setBudgetMode} budget={budget} setBudget={setBudget} onClear={clearOptions} onApply={applyOptions} onClose={() => setOptionsOpen(false)} />}
        <form className="dock search-dock" aria-label="Omni search dock" onSubmit={beginSearch}>
          <div className="dock-search-row">
            <Search size={18} aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="What do you need nearby?" aria-label="Search nearby products and services" />
            <button type="submit">Search</button>
          </div>
          <div className="dock-search-meta">
            <span><Sparkles size={13} /> {sessionUser ? 'Search the visible map' : 'Explore publicly; sign in to search'}</span>
            <button className="dock-more" type="button" aria-expanded={optionsOpen} aria-controls="search-options" aria-label={optionsOpen ? 'Close search options' : 'Open search options'} onClick={() => { setOptionsOpen((open) => !open); setMenuOpen(false); }}><span>Options</span><ChevronDown size={17} className={optionsOpen ? 'chevron-up' : ''} /></button>
          </div>
        </form>
        <div className="dock-status">{sessionUser ? 'Account ready for availability checks' : 'Public exploration · account required to verify'}</div>
      </div>

      {panel !== 'none' && <div className="sheet-backdrop" onClick={() => panel !== 'auth' && setPanel('none')} />}
      {panel === 'auth' && <AuthSheet mode={authMode} setMode={setAuthMode} email={authEmail} setEmail={setAuthEmail} password={authPassword} setPassword={setAuthPassword} name={authName} setName={setAuthName} state={authState} error={authError} onSubmit={submitAuth} onClose={() => setPanel('none')} />}
      {panel === 'facility' && <FacilitySheet facility={selectedFacility} state={detailState} error={error} onClose={() => setPanel('none')} onVerify={openAvailability} />}
      {panel === 'availability' && <AvailabilitySheet facility={selectedFacility} step={availabilityStep} setStep={setAvailabilityStep} productId={selectedProductId} setProductId={setSelectedProductId} quantity={quantity} setQuantity={setQuantity} budgetMode={budgetMode} setBudgetMode={setBudgetMode} budget={budget} setBudget={setBudget} state={requestState} error={error} onClose={() => setPanel('facility')} onSubmit={submitAvailability} />}
      {panel === 'submitted' && availability && <SubmittedSheet facility={selectedFacility} productName={selectedProduct?.name ?? 'Selected product'} result={availability} onClose={() => setPanel('none')} onBack={() => setPanel('facility')} />}
    </main>
  );
}

function SearchOptionsPopover(props: { category: string; categoryOptions: string[]; setCategory: (value: string) => void; quantity: number; setQuantity: (value: number) => void; budgetMode: 'unlimited' | 'maximum'; setBudgetMode: (value: 'unlimited' | 'maximum') => void; budget: string; setBudget: (value: string) => void; onClear: () => void; onApply: () => void; onClose: () => void }) {
  return <section id="search-options" className="options-popover" role="region" aria-label="Search options"><div className="options-head"><div><span className="eyebrow">Refine your view</span><strong>Search options</strong></div><button type="button" onClick={props.onClose} aria-label="Close search options"><X size={16} /></button></div><p className="options-lede">Filters apply to the visible map. Quantity and budget are carried into the availability request.</p><label className="option-field">Category<select value={props.category} onChange={(event) => props.setCategory(event.target.value)}><option value="">All categories</option>{props.categoryOptions.filter(Boolean).map((category) => <option key={category} value={category}>{category}</option>)}</select></label><div className="option-grid"><label className="option-field">Request quantity<input type="number" min="1" step="1" value={props.quantity} onChange={(event) => props.setQuantity(Math.max(1, Number(event.target.value) || 1))} /></label><div className="option-field"><span>Budget</span><div className="option-toggle"><button type="button" className={props.budgetMode === 'unlimited' ? 'active' : ''} onClick={() => props.setBudgetMode('unlimited')}>Unlimited</button><button type="button" className={props.budgetMode === 'maximum' ? 'active' : ''} onClick={() => props.setBudgetMode('maximum')}>Maximum</button></div></div></div>{props.budgetMode === 'maximum' && <label className="option-field">Maximum amount<input type="number" min="0" step="0.01" value={props.budget} onChange={(event) => props.setBudget(event.target.value)} placeholder="0.00" /></label>}<div className="options-actions"><button className="text-button" type="button" onClick={props.onClear}>Clear</button><button className="primary-button" type="button" onClick={props.onApply}>Apply options</button></div></section>;
}

function AuthSheet(props: { mode: AuthMode; setMode: (mode: AuthMode) => void; email: string; setEmail: (value: string) => void; password: string; setPassword: (value: string) => void; name: string; setName: (value: string) => void; state: 'idle' | 'loading' | 'error'; error: string; onSubmit: (event: FormEvent) => void; onClose: () => void }) {
  return <section className="omni-sheet auth-sheet" role="dialog" aria-modal="true" aria-labelledby="auth-title"><div className="sheet-handle" /><div className="sheet-head"><div><span className="eyebrow">Omni account</span><h2 id="auth-title">{props.mode === 'sign-in' ? 'Search with certainty' : 'Start seeing before you move'}</h2></div><button type="button" onClick={props.onClose} aria-label="Close"><X size={18} /></button></div><p className="sheet-lede">Your account unlocks database-backed search and availability checks. Public map exploration stays open to everyone.</p><form onSubmit={props.onSubmit} className="auth-form">{props.mode === 'sign-up' && <label>First name<input value={props.name} onChange={(event) => props.setName(event.target.value)} placeholder="Your name" autoComplete="name" /></label>}<label>Email<input type="email" required value={props.email} onChange={(event) => props.setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" /></label><label>Password<input type="password" required minLength={8} value={props.password} onChange={(event) => props.setPassword(event.target.value)} placeholder="At least 8 characters" autoComplete={props.mode === 'sign-in' ? 'current-password' : 'new-password'} /></label>{props.error && <div className="inline-error" role="alert">{props.error}</div>}<button className="primary-button" type="submit" disabled={props.state === 'loading'}>{props.state === 'loading' ? 'Connecting…' : props.mode === 'sign-in' ? 'Sign in to search' : 'Create my account'}</button></form><button className="text-button" type="button" onClick={() => props.setMode(props.mode === 'sign-in' ? 'sign-up' : 'sign-in')}>{props.mode === 'sign-in' ? 'New to Omni? Create an account' : 'Already have an account? Sign in'}</button></section>;
}

function FacilitySheet(props: { facility: FacilityDetail | null; state: 'idle' | 'loading' | 'error'; error: string; onClose: () => void; onVerify: () => void }) {
  return <section className="omni-sheet facility-sheet" role="dialog" aria-modal="true" aria-labelledby="facility-title"><div className="sheet-handle" /><div className="sheet-head"><button className="back-button" type="button" onClick={props.onClose}><ArrowLeft size={17} /> map</button><button type="button" onClick={props.onClose} aria-label="Close"><X size={18} /></button></div>{props.state === 'loading' && <div className="sheet-loading"><span className="spinner" /> Opening facility…</div>}{props.state === 'error' && <div className="empty-state"><PackageSearch size={26} /><strong>Facility unavailable</strong><p>{props.error}</p><button type="button" className="secondary-button" onClick={props.onClose}>Back to map</button></div>}{props.facility && props.state === 'idle' && <><div className="facility-hero"><span className="facility-mark"><MapPin size={20} /></span><div><span className="eyebrow">{props.facility.category}</span><h2 id="facility-title">{props.facility.name}</h2><p>{props.facility.address ?? 'Location shared on the public map'}</p></div></div><div className="trust-row"><span className="trust-badge"><ShieldCheck size={14} /> {labelTrust(props.facility.trust)}</span>{props.facility.plan === 'pro_active' && <span className="pro-badge">Pro facility</span>}</div>{props.facility.trust === 'unclaimed' ? <div className="notice-card"><strong>Public place, not yet certified</strong><p>This pin comes from public data. A seller must complete identity, company/facility and product verification before Omni can show a catalogue.</p></div> : props.facility.products.length ? <><div className="catalogue-head"><div><span className="eyebrow">Facility catalogue</span><strong>{props.facility.products.length} offer{props.facility.products.length === 1 ? '' : 's'}</strong></div><span className="catalogue-note">Live offers are facility-scoped</span></div><div className="product-preview">{props.facility.products.slice(0, 3).map((product) => <div className="product-row" key={product.id}><span className="product-icon"><PackageSearch size={16} /></span><span><strong>{product.name}</strong><small>{product.description ?? product.category ?? 'Local offer'} · {currency(product.priceMinor, product.currency)} / {product.unit}</small></span></div>)}</div><button className="primary-button" type="button" onClick={props.onVerify}>Verify availability <ArrowLeft size={16} className="rotate-180" /></button></> : <div className="empty-state"><Clock3 size={25} /><strong>Catalogue not published yet</strong><p>This facility is certified, but there are no published offers to check right now.</p></div>}<p className="privacy-note">Contact details and itinerary unlock only after an authorized purchase intent.</p></>}</section>;
}

function AvailabilitySheet(props: { facility: FacilityDetail | null; step: number; setStep: (value: number) => void; productId: string | null; setProductId: (value: string) => void; quantity: number; setQuantity: (value: number) => void; budgetMode: 'unlimited' | 'maximum'; setBudgetMode: (value: 'unlimited' | 'maximum') => void; budget: string; setBudget: (value: string) => void; state: 'idle' | 'loading' | 'error'; error: string; onClose: () => void; onSubmit: () => void }) {
  if (!props.facility) return null;
  const selected = props.facility.products.find((product) => product.id === props.productId) ?? props.facility.products[0];
  return <section className="omni-sheet availability-sheet" role="dialog" aria-modal="true" aria-labelledby="availability-title"><div className="sheet-handle" /><div className="sheet-head"><div><span className="eyebrow">Availability request</span><h2 id="availability-title">{props.facility.name}</h2></div><button type="button" onClick={props.onClose} aria-label="Back"><ArrowLeft size={18} /></button></div><div className="stepper" aria-label={`Step ${props.step} of 3`}><span className={props.step >= 1 ? 'active' : ''}>1 <small>Choose</small></span><i /><span className={props.step >= 2 ? 'active' : ''}>2 <small>Details</small></span><i /><span className={props.step >= 3 ? 'active' : ''}>3 <small>Send</small></span></div>{props.step === 1 && <div className="step-content"><p className="step-intro">Select from this facility’s catalogue. You never need to retype the product name.</p><div className="select-list">{props.facility.products.map((product) => <button type="button" key={product.id} className={`select-product ${props.productId === product.id ? 'selected' : ''}`} onClick={() => props.setProductId(product.id)}><span className="radio-dot" /><span><strong>{product.name}</strong><small>{currency(product.priceMinor, product.currency)} / {product.unit} · {product.availableQuantity === null ? 'availability on request' : `${product.availableQuantity} allocated to Omni`}</small></span><span className="product-price">{product.couponLabel ?? 'Offer'}</span></button>)}</div><button className="primary-button" type="button" disabled={!props.productId} onClick={() => props.setStep(2)}>Continue <ArrowLeft size={16} className="rotate-180" /></button></div>}{props.step === 2 && <div className="step-content"><p className="step-intro">Tell the seller what to check. Your request expires if it is not confirmed in time.</p><div className="quantity-control"><div><span className="eyebrow">Quantity</span><strong>{selected?.name}</strong></div><div><button type="button" onClick={() => props.setQuantity(Math.max(1, props.quantity - 1))} aria-label="Decrease quantity"><Minus size={17} /></button><strong>{props.quantity}</strong><button type="button" onClick={() => props.setQuantity(props.quantity + 1)} aria-label="Increase quantity"><Plus size={17} /></button></div></div><div className="budget-toggle"><button type="button" className={props.budgetMode === 'unlimited' ? 'active' : ''} onClick={() => props.setBudgetMode('unlimited')}>No budget cap</button><button type="button" className={props.budgetMode === 'maximum' ? 'active' : ''} onClick={() => props.setBudgetMode('maximum')}>Set maximum</button></div>{props.budgetMode === 'maximum' && <label className="money-input">Maximum budget<input type="number" min="0" step="0.01" value={props.budget} onChange={(event) => props.setBudget(event.target.value)} placeholder="0.00" /></label>}<div className="locked-note"><ShieldCheck size={17} /><span><strong>Private details stay locked</strong><small>Contact and itinerary appear only after you authorize an intent to buy.</small></span></div><button className="primary-button" type="button" onClick={() => props.setStep(3)}>Review request <ArrowLeft size={16} className="rotate-180" /></button></div>}{props.step === 3 && <div className="step-content"><p className="step-intro">One clear request to {props.facility.name}. Nothing is purchased in this step.</p><div className="review-card"><span className="review-icon"><PackageSearch size={19} /></span><div><strong>{props.quantity} × {selected?.name}</strong><small>Facility-scoped availability check</small></div><button type="button" onClick={() => props.setStep(1)}>Edit</button></div>{props.budgetMode === 'maximum' && <div className="review-line"><span>Maximum budget</span><strong>{props.budget ? `$${Number(props.budget).toFixed(2)}` : 'No amount set'}</strong></div>}{props.error && <div className="inline-error" role="alert">{props.error}</div>}<button className="primary-button" type="button" disabled={props.state === 'loading'} onClick={props.onSubmit}>{props.state === 'loading' ? 'Sending request…' : 'Send availability request'}</button><p className="microcopy">You can leave this flow and return from your activity history once transaction surfaces are enabled.</p></div>}</section>;
}

function SubmittedSheet(props: { facility: FacilityDetail | null; productName: string; result: AvailabilityResult; onClose: () => void; onBack: () => void }) {
  return <section className="omni-sheet submitted-sheet" role="dialog" aria-modal="true" aria-labelledby="submitted-title"><div className="sheet-handle" /><div className="sheet-head"><div><span className="eyebrow">Request sent</span><h2 id="submitted-title">Waiting on live availability</h2></div><button type="button" onClick={props.onClose} aria-label="Close"><X size={18} /></button></div><div className="success-mark"><CheckCircle2 size={28} /></div><p className="success-copy">Omni sent your request for <strong>{props.productName}</strong> to <strong>{props.facility?.name}</strong>.</p><div className="request-state"><span className="state-pulse" /><div><strong>Seller confirmation pending</strong><small>Request expires in 15 minutes · ID {props.result.requestId.slice(0, 8)}</small></div></div><p className="sheet-lede">When the facility responds, you can compare the answer before deciding whether to create an authorized purchase intent.</p><div className="button-row"><button className="secondary-button" type="button" onClick={props.onClose}>Return to map</button><button className="text-button" type="button" onClick={props.onBack}>View facility</button></div></section>;
}
