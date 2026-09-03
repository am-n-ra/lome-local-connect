import { useState } from 'react';
import { ShieldCheck, Clock3, Plus, ArrowRight, X, ChevronRight, PackageSearch, Tag } from 'lucide-react';
import type { SellerCatalogueResult, SellerAvailabilityQueue, ProductAvailabilityState, ProductStockEvent } from '../../trunk/types';
import type { SessionUser } from '../../trunk/auth-session';

type SellerView = 'home' | 'company' | 'products' | 'stockevent' | 'offers';

interface Props {
  user: SessionUser | null;
  queue: SellerAvailabilityQueue | null;
  catalogue: SellerCatalogueResult | null;
  availabilityState: 'idle' | 'loading' | 'error' | 'success';
  availabilityError: string;
  onSetAvailability: (productId: string, to: ProductAvailabilityState, expiresInHours: number | null) => void;
  stockHistory: { productId: string; state: 'idle' | 'loading' | 'error'; events: ProductStockEvent[] } | null;
  onLoadStockHistory: (productId: string) => void;
  onCloseStockHistory: () => void;
  onClose: () => void;
  onSignOut: () => void;
}

const currency = (minor: number, ccy: string) => {
  const major = Math.round(minor / 100);
  return `${major.toLocaleString('fr-FR')} ${ccy || 'XOF'}`;
};

const AVAILABILITY_LABELS: Record<ProductAvailabilityState, string> = {
  en_stock: 'En stock',
  verifie: 'Vérifié',
  a_valider: 'À valider',
  bientot: 'Bientôt',
};

// Maquette seller sheets — exact reproduction of S1-S9 from accepted Species gate
export function SellerWorkspaceSheet(props: Props) {
  const [view, setView] = useState<SellerView>('home');

  const facilities = props.catalogue?.facilities ?? [];
  const products = props.catalogue?.products ?? [];
  const pendingRequests = props.queue?.authorized ? props.queue.requests.length : 0;

  return (
    <section className="omni-sheet omni-sheet-enter context-sheet" role="dialog" aria-modal="true" aria-label="Espace Seller" style={{ height: '52%' }}>
      <div className="sheet-handle" />
      <div className="sheet-head">
        <div>
          <span className="section-kicker">{view === 'home' ? 'Espace Seller' : view === 'company' ? 'Compagnies' : view === 'products' ? 'Produits' : view === 'stockevent' ? 'Historique stock' : 'Offres Omni'}</span>
          <h2>{view === 'home' ? 'Ce qui demande votre attention.' : view === 'company' ? 'Mes compagnies' : view === 'products' ? 'Catalogue' : view === 'stockevent' ? 'Ledger des changements' : 'Prix & remise'}</h2>
        </div>
        <div className="flex items-center gap-2">
          {view !== 'home' && <button type="button" className="text-button" onClick={() => setView('home')}>Retour</button>}
          <span className="status ink">Seller</span>
          <button type="button" onClick={props.onClose} aria-label="Fermer"><X size={16} /></button>
        </div>
      </div>

      {/* S1 — SELLER home */}
      {view === 'home' && (
        <>
          <div className="stat" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 9 }}>
            <div className="maquette-stat-tile accent">
              <small>Demandes en attente</small>
              <strong>{pendingRequests}</strong>
            </div>
            <div className="maquette-stat-tile">
              <small>Commandes à préparer</small>
              <strong>{products.filter(p => p.publicationState === 'published').length}</strong>
            </div>
          </div>
          {facilities.length > 0 && (
            <div className="maquette-cardbox">
              <div className="row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <b style={{ fontSize: 12 }}>{facilities[0].name}</b>
                  <br />
                  <span className="tiny muted" style={{ fontSize: 9, color: '#6b6b6b' }}>
                    {facilities.length} facilité{facilities.length === 1 ? '' : 's'} · {facilities[0].slotState === 'active' ? 'vérifiée' : 'à valider'}
                  </span>
                </div>
                <button className="btn ghost sm" style={{ width: 'auto', minHeight: 28, fontSize: 9, padding: '0 10px' }} onClick={() => setView('company')}>Ouvrir</button>
              </div>
            </div>
          )}
          <div className="btnrow" style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="btn ghost" style={{ flex: 1 }} onClick={() => setView('products')}>Produits</button>
            <button className="btn ghost" style={{ flex: 1 }} onClick={() => setView('offers')}>Offres</button>
          </div>
        </>
      )}

      {/* S2 — COMPANY */}
      {view === 'company' && (
        <>
          {facilities.map((f) => (
            <div className="maquette-cardbox" key={f.id}>
              <div className="row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <b style={{ fontSize: 12 }}>{f.name}</b>
                  <br />
                  <span className="tiny muted" style={{ fontSize: 9, color: '#6b6b6b' }}>
                    {f.productCount} produit{f.productCount === 1 ? '' : 's'}
                  </span>
                </div>
                <span className={`status ${f.slotState === 'active' ? 'ok' : 'ink'}`}>
                  {f.slotState === 'active' ? 'Vérifiée' : 'À valider'}
                </span>
              </div>
            </div>
          ))}
          <button className="btn" style={{ marginTop: 10 }} onClick={() => props.onClose()}>
            + Créer une compagnie
          </button>
        </>
      )}

      {/* S3 — PRODUCTS catalogue */}
      {view === 'products' && (
        <>
          {props.stockHistory && props.stockHistory.productId && (
            <div className="stock-history-panel" style={{ marginTop: 14, padding: 14, border: '1px solid #e6e6e6', borderRadius: 16, background: '#f7f7f7' }}>
              <div className="row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="section-kicker">Historique StockEvent</span>
                <button className="text-button" type="button" onClick={props.onCloseStockHistory}>Fermer</button>
              </div>
              {props.stockHistory.state === 'loading' && <span className="tiny muted">Chargement…</span>}
              {props.stockHistory.state === 'error' && <span className="tiny muted">Historique indisponible.</span>}
              {props.stockHistory.state === 'idle' && props.stockHistory.events.length === 0 && (
                <span className="tiny muted">Aucun événement.</span>
              )}
              {props.stockHistory.state === 'idle' && props.stockHistory.events.map((event) => (
                <div className="stock-event-row" key={event.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #e6e6e6', fontSize: 11 }}>
                  <span style={{ color: '#6b6b6b', fontSize: 10 }}>
                    {new Date(event.createdAt).toLocaleString()} · {event.source === 'auto' ? 'Auto' : 'Manuel'}
                  </span>
                  <b style={{ fontWeight: 700, color: '#0f0f0f' }}>
                    {event.fromState ? `${AVAILABILITY_LABELS[event.fromState] ?? event.fromState} → ` : ''}{AVAILABILITY_LABELS[event.toState] ?? event.toState}
                  </b>
                </div>
              ))}
            </div>
          )}

          {products.length === 0 ? (
            <p className="tiny muted" style={{ marginTop: 12, textAlign: 'center' }}>
              Les produits de vos facilités apparaîtront ici après création.
            </p>
          ) : (
            <div className="omni-plist" style={{ display: 'grid', gap: 6, marginTop: 8 }}>
              {products.map((item) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 7, border: '1px solid #e6e6e6', borderRadius: 11, background: '#fff', fontSize: 12 }}>
                  <span className="omni-pitem-thumb" style={{ width: 34, height: 28, flex: 'none', borderRadius: 7, background: 'linear-gradient(135deg, #ececec, #d8d8d8)' }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <b style={{ display: 'block', fontSize: 12, color: '#0f0f0f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</b>
                    <small style={{ display: 'block', fontSize: 10, color: '#6b6b6b' }}>
                      {currency(item.prixReduit, item.currency)} · {item.availabilityProEligible ? AVAILABILITY_LABELS[item.availabilityState] : 'Plan Pro requis'}
                    </small>
                  </span>
                  {item.availabilityProEligible && (
                    <select
                      value={item.availabilityState}
                      disabled={props.availabilityState === 'loading'}
                      onChange={(e) => props.onSetAvailability(item.id, e.target.value as ProductAvailabilityState, e.target.value === 'en_stock' ? 4 : null)}
                      style={{ padding: '4px 8px', borderRadius: 8, border: '1px solid #e6e6e6', background: '#fff', fontSize: 11, fontWeight: 700, color: '#2e8b6f', outline: 'none' }}
                    >
                      <option value="en_stock">En stock</option>
                      <option value="verifie">Vérifié</option>
                      <option value="a_valider">À valider</option>
                      <option value="bientot">Bientôt</option>
                    </select>
                  )}
                  <button className="text-button" type="button" style={{ fontSize: 10 }} onClick={() => props.onLoadStockHistory(item.id)}>
                    <Clock3 size={12} className="inline-block" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="btnrow" style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="btn" style={{ flex: 1 }} onClick={() => props.onClose()}>+ Ajouter un produit</button>
            <button className="btn ghost" style={{ flex: 1 }} onClick={() => setView('stockevent')}>Historique stock</button>
          </div>
          {props.availabilityState === 'error' && (
            <div className="inline-error" role="alert" style={{ marginTop: 8 }}>{props.availabilityError}</div>
          )}
        </>
      )}

      {/* S5 — STOCKEVENT ledger */}
      {view === 'stockevent' && (
        <>
          <div className="maquette-cardbox">
            {props.stockHistory && props.stockHistory.events.length > 0 ? (
              props.stockHistory.events.map((event) => (
                <div className="kv" key={event.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '5px 0', borderTop: '1px solid #e6e6e6', fontSize: 11 }}>
                  <span style={{ color: '#6b6b6b', fontSize: 10 }}>
                    {new Date(event.createdAt).toLocaleString()} · {event.source === 'auto' ? 'Auto (fraîcheur)' : 'Manuel'}
                  </span>
                  <b style={{ fontWeight: 800, color: '#0f0f0f', fontSize: 11 }}>
                    {event.fromState ? `${AVAILABILITY_LABELS[event.fromState] ?? event.fromState} → ` : ''}{AVAILABILITY_LABELS[event.toState] ?? event.toState}
                  </b>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: 16 }}>
                <Clock3 size={22} className="mx-auto mb-2" />
                <strong style={{ display: 'block', fontSize: 12 }}>Aucun événement</strong>
                <p className="tiny muted" style={{ fontSize: 9, color: '#6b6b6b', marginTop: 4 }}>
                  Les changements de disponibilité de ce produit apparaîtront ici.
                </p>
              </div>
            )}
          </div>
          <p className="tiny muted" style={{ fontSize: 9, color: '#6b6b6b', marginTop: 6, textAlign: 'center' }}>
            Ledger serveur. Changement auto = déterministe, ou manuel (stock bas signalé).
          </p>
          <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => setView('products')}>Retour au catalogue</button>
        </>
      )}

      {/* S6 — OFFERS */}
      {view === 'offers' && products.length > 0 && (
        <>
          {products.slice(0, 3).map((item) => (
            <div className="maquette-cardbox" key={item.id}>
              <div className="row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <b style={{ fontSize: 12 }}>{item.name}</b>
              </div>
              <div className="kv" style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '5px 0', borderTop: '1px solid #e6e6e6', fontSize: 11 }}>
                <span style={{ color: '#6b6b6b' }}>Prix normal</span>
                <b style={{ fontWeight: 800, color: '#0f0f0f' }}>{currency(item.prixOriginal, item.currency)}</b>
              </div>
              <div className="kv" style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '5px 0', borderTop: '1px solid #e6e6e6', fontSize: 11 }}>
                <span style={{ color: '#6b6b6b' }}>Remise Omni</span>
                <b style={{ fontWeight: 800, color: '#2e8b6f' }}>{item.pourcentageReduction}%</b>
              </div>
              <div className="kv" style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '5px 0', borderTop: '1px solid #e6e6e6', fontSize: 11 }}>
                <span style={{ color: '#6b6b6b' }}>Prix Omni</span>
                <b style={{ fontWeight: 800, color: '#0f0f0f' }}>{currency(item.prixReduit, item.currency)}</b>
              </div>
            </div>
          ))}
          <p className="tiny muted" style={{ fontSize: 9, color: '#6b6b6b', marginTop: 6 }}>
            Sans offre Omni valide : découvrable oui, transaction non.
          </p>
          <button className="btn" style={{ marginTop: 10 }} onClick={() => props.onClose()}>Enregistrer l'offre</button>
        </>
      )}

      {view === 'offers' && products.length === 0 && (
        <p className="tiny muted" style={{ marginTop: 12, textAlign: 'center' }}>
          Aucun produit. Créez un produit pour définir une offre.
        </p>
      )}

      {props.user && (
        <button className="btn ghost sm" style={{ marginTop: 10 }} onClick={props.onSignOut}>Se déconnecter</button>
      )}
    </section>
  );
}
