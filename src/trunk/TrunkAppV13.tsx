import { FormEvent, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Search, QrCode, Menu, LogOut, User, X, ArrowRight, PackageSearch } from 'lucide-react';
import { authClient, getAuthToken } from '../auth';
import { getAccountCapabilities, listPublicFacilities, getFacilityDetail } from './api';
import type { FacilityDetail, PublicFacility, SearchOptions } from './types';
import { sessionUserFromAuthResult, type SessionUser } from './auth-session';
import { TrunkMap } from './TrunkMap';import { AdminV13 } from './AdminV13';import { BuyerFlowV13 } from './BuyerFlowV13';import { SellerV13 } from './SellerV13';
import './ui-v13.css';

type Sheet = 'none' | 'search' | 'results' | 'facility' | 'menu' | 'account' | 'auth' | 'admin' | 'flow' | 'seller';
type Role = 'buyer' | 'seller' | 'admin' | 'operator';
type MapState = 'loading' | 'ready' | 'error' | 'empty';

const LOME = [1.22, 6.13] as const;

export function TrunkAppV13() {
  const [facilities, setFacilities] = useState<PublicFacility[]>([]);
  const [mapState, setMapState] = useState<MapState>('loading');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PublicFacility[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<FacilityDetail | null>(null);
  const [facilityLoading, setFacilityLoading] = useState(false);
  const [sheet, setSheet] = useState<Sheet>('none');
  const [role, setRole] = useState<Role>('buyer');
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [accountRoles, setAccountRoles] = useState<string[]>([]);const [adminTools, setAdminTools] = useState(false);const [focusTarget, setFocusTarget] = useState<{ latitude: number; longitude: number; key: string } | null>(null);const [flowFacility, setFlowFacility] = useState<{ id: string; name: string } | null>(null);const [flowProduct, setFlowProduct] = useState<{ id: string; name: string } | null>(null);
  const [revealKey, setRevealKey] = useState<string | null>(null);
  const [revealActive, setRevealActive] = useState(false);
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(null);

  const loadPublic = useCallback(async (bbox?: [number, number, number, number]) => {
    const result = await listPublicFacilities(bbox ?? undefined);
    if (result.ok && result.data) {
      setFacilities(result.data);
      setMapState(result.data.length ? 'ready' : 'empty');
      setError('');
    } else {
      setMapState('error');
      setError(result.error?.message ?? 'La découverte publique est temporairement indisponible.');
    }
  }, []);

  useEffect(() => {
    let active = true;
    void loadPublic().catch(() => { if (active) { setMapState('error'); setError('La découverte publique est temporairement indisponible.'); } });
    return () => { active = false; };
  }, [loadPublic]);

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
            setAdminTools(Boolean(caps.data.capabilities?.adminTools));
          }
        }
      }
      } catch { /* session restore */ }
    })();
    return () => { active = false; };
  }, []);

  const runSearch = useCallback(async (raw: string, opts?: SearchOptions) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    setResultsLoading(true);
    setSheet('none');
    try {
      const result = await listPublicFacilities(bounds ?? undefined, trimmed, opts);
      if (result.ok && result.data) {
        setResults(result.data);
        setResultsLoading(false);
        setRevealKey(`v13-${Date.now()}`);
        setSheet('results');
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
  }, [bounds]);

  const handleRevealStateChange = useCallback((active: boolean) => {
    setRevealActive(active);
    if (!active && sheet === 'results') setSheet('results');
  }, [sheet]);

  const handlePinSelect = useCallback(async (facility: PublicFacility) => {
    setSelectedId(facility.id);
    setSelectedFacility(null);
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

  const eligibleRoles = useMemo<Role[]>(() => {
    const base: Role[] = ['buyer'];
    if (sessionUser) base.push('seller');
    if (adminTools) base.push('admin');
    return base;
  }, [sessionUser, adminTools]);

  const handleSubmitSearch = (event: FormEvent) => {
    event.preventDefault();
    void runSearch(query);
  };

  return (
    <div className="omni-v13-stage" data-role={role} data-map-state={mapState} data-sheet={sheet}>
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
          />
        </Suspense>
      </section>
      {mapState === 'error' && <div className="map-legend" role="alert"><span>{error}</span></div>}
      {mapState === 'empty' && <div className="map-legend" role="status"><span>Aucun lieu dans cette vue.</span></div>}
      <div className="countmark" aria-hidden="true">{facilities.length}</div>
      <div className="rolepill" role="tablist" aria-label="Changer de rôle">
        {(eligibleRoles.length ? eligibleRoles : ['buyer'] as Role[]).map((r: Role) => (
          <button key={r} type="button" role="tab" aria-selected={role === r} className={role === r ? 'on' : ''} onClick={() => { setRole(r); if (r === 'admin') setSheet('admin'); if (r === 'seller') setSheet('seller'); if (r === 'buyer') setSheet('none'); }}>{r === 'buyer' ? 'Buyer' : r === 'seller' ? 'Seller' : r === 'admin' ? 'Admin' : 'Opé.'}</button>
        ))}
      </div>
      <div className="navpill" role="navigation" aria-label="Actions principales">
        <button type="button" aria-label="Rechercher" onClick={() => setSheet(sheet === 'search' ? 'none' : 'search')}><Search size={20} /></button>
        <button type="button" aria-label="Scanner un QR" onClick={() => setSheet('menu')}><QrCode size={20} /></button>
        <button type="button" aria-label="Menu" onClick={() => setSheet('menu')}><Menu size={20} /></button>
      </div>
      {sheet === 'search' && (

        <form className="sheet h-low" onSubmit={handleSubmitSearch}>
          <div className="handle" />
          <div className="sheet-head">
            <div><div className="eyebrow">Recherche</div><h1>Que cherchez-vous ?</h1></div>
          </div>
          <div className="searchdock">
            <div className="fld">
              <svg width="16" height="16" aria-hidden="true"><use href="#iSearch" /></svg>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Produit, service, commerce…" aria-label="Recherche" />
              <button className="btn ghost sm" style={{ width: 'auto', minHeight: 28, padding: '0 10px' }} type="submit"><ArrowRight size={15} /></button>
            </div>
          </div>
        </form>
      )}
      {sheet === 'results' && (
        <section className="sheet h-auto" role="region" aria-label="Résultats">
          <div className="handle" />
          <div className="sheet-head">
            <div><div className="eyebrow">Résultats</div><h1>Facilités proches</h1></div>
            <span className="status gray">{results.length}</span>
          </div>
          {resultsLoading && <p className="sub">Recherche…</p>}
          {error && !resultsLoading && <p className="sub" role="alert">{error}</p>}
          <div className="hgrid" id="hgrid">
            {results.map((facility) => (
              <button key={facility.id} type="button" className="cardbox" style={{ textAlign: 'left' }} onClick={() => void handlePinSelect(facility)}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <b>{facility.name}</b>
                  <span className="status ok">{facility.category}</span>
                </div>
                <p className="tiny muted">{facility.latitude.toFixed(4)}, {facility.longitude.toFixed(4)}</p>
                <p className="tiny muted">{facility.plan} · {facility.productCount} produits</p>
              </button>
            ))}
          </div>
        </section>
      )}
      {sheet === 'facility' && (
        <section className="sheet h-full" role="region" aria-label="Facilité">
          <div className="handle" />
          <div className="sheet-head">
            <div><div className="eyebrow">Facilité</div><h1>{selectedFacility?.name ?? '—'}</h1></div>
            <button type="button" className="btn ghost sm" style={{ width: 'auto', minHeight: 28 }} onClick={() => setSheet('results')}><X size={15} /> Fermer</button>
          </div>
          {facilityLoading && <p className="sub">Chargement…</p>}
          {!facilityLoading && selectedFacility && (
            <div>
              <div className="fhero" style={{ padding: 12, border: '1px solid var(--line)', borderRadius: 14 }}><span className="tag">{selectedFacility.category}</span></div>
              <div className="row tiny muted" style={{ marginTop: 6 }}><span>{selectedFacility.trust} · {selectedFacility.plan}</span></div>
              {selectedFacility.products.length === 0 && <p className="tiny muted" style={{ marginTop: 8 }}>Aucun produit publié pour cette facilité.</p>}
              {selectedFacility.products.map((product) => (
                <div className="pitem" key={product.id}>
                  <span className="pthumb" />
                  <span><b>{product.name}</b><small>{product.stockLoueOmni > 0 ? 'En stock' : 'À valider'}</small></span>
                  <span className="pr">{(product.prixReduit / 100).toFixed(2)} {product.currency}</span>
                  <button className="btn ghost sm" style={{ width: 'auto', minHeight: 26 }} type="button" onClick={() => { setFlowFacility({ id: selectedFacility.id, name: selectedFacility.name }); setFlowProduct({ id: product.id, name: product.name }); setSheet('flow'); }}>Demander</button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
      {sheet === 'seller' && (
        <SellerV13 onClose={() => setSheet('menu')} />
      )}
      {sheet === 'flow' && flowFacility && flowProduct && (
        <BuyerFlowV13 facility={flowFacility} product={flowProduct} onClose={() => setSheet('facility')} />
      )}
      {sheet === 'admin' && adminTools && (
        <AdminV13 onClose={() => setSheet('menu')} onFocusFacility={(latitude: number, longitude: number, key: string) => { setFocusTarget({ latitude, longitude, key }); setSheet('none'); }} />
      )}
      {sheet === 'menu' && (
        <section className="sheet h-mid" role="region" aria-label="Espace">
          <div className="handle" />
          <div className="sheet-head">
            <div><div className="eyebrow">Espace</div><h1>{sessionUser ? ('Bonjour ' + (sessionUser.name || sessionUser.email)) : 'Espace Omni'}</h1></div>
            <span className="status ink">{role}</span>
          </div>
          <div className="menugrid" style={{ display: 'grid', gap: 8, marginTop: 10 }}>
            {!sessionUser && <button className="btn" type="button" onClick={() => setSheet('auth')}>Se connecter</button>}
            {sessionUser && <button className="btn ghost" type="button" onClick={() => setSheet('account')}>Mon compte <User size={16} /></button>}
            {sessionUser && <button className="btn ghost" type="button" onClick={async () => { await authClient?.signOut?.().catch(() => undefined); setSessionUser(null); setAdminTools(false);setAccountRoles([]); }}><LogOut size={16} /> Se déconnecter</button>}
          </div>
        </section>
      )}
      {sheet === 'account' && sessionUser && (
        <section className="sheet h-mid" role="region" aria-label="Compte">
          <div className="handle" />
          <div className="sheet-head">
            <div><div className="eyebrow">Compte</div><h1>Votre profil Omni</h1></div>
            <button type="button" className="btn ghost sm" style={{ width: 'auto', minHeight: 28 }} onClick={() => setSheet('menu')}><X size={15} /></button>
          </div>
          <div className="cardbox">
            <div className="kv"><span>Identité</span><b>{sessionUser.name ?? sessionUser.email}</b></div>
            <div className="kv"><span>Rôles</span><b>{eligibleRoles.join(' · ')}</b></div>
          </div>
        </section>
      )}
      {sheet === 'auth' && (
        <section className="sheet h-mid" role="dialog" aria-modal="true" aria-label="Connexion">
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
              setSheet("menu");
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
