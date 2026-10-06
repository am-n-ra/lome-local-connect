import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
import { getAuthToken } from '../auth';
import { getSellerCatalogue, setProductAvailability } from './api';
import { computeOfferFreshness, freshnessLabel, worstFreshness } from './offer-freshness';
import type { SellerCatalogueProduct } from './types';

/**
 * MENU-01 « Fraîcheur de la dispo » — the SELLER half of SEARCH-02/D-03.
 *
 * The buyer already SEES freshness (derived, never stored). This screen is the
 * write side: the seller re-confirms that an offer is still available, which is
 * what moves it from `a_valider` to a live availability (`en_stock`). Without
 * this, no offer can ever become transactable — measured 0/16 in the pilot.
 *
 * No new schema: `setProductAvailability` (D-04, Pro-gated) already exists and
 * writes the expiry window; the server auto-expires at the deadline
 * (`v2_expire_stale_availability`). The window is the seller's choice, defaulting
 * to the maquette's « 4 h frais ».
 */

const DEFAULT_WINDOW_HOURS = 4;
const WINDOW_OPTIONS: ReadonlyArray<readonly [number, string]> = [[4, '4 h'], [12, '12 h'], [24, '24 h']];

/** Short public badge (maquette: « Badge affiché : À confirmer »). */
export function badgeFor(product: SellerCatalogueProduct, now: number): { label: string; tone: string } {
  if (product.publicationState !== 'published') return { label: 'Hors ligne', tone: 'gray' };
  const fresh = computeOfferFreshness(product.availabilityState, product.availabilityExpiresAt, now);
  if (fresh.level === 'fresh') return { label: 'En stock', tone: 'ok' };
  if (fresh.level === 'stale') return { label: 'À confirmer', tone: 'warn' };
  return { label: 'Non confirmée', tone: 'warn' };
}

type Props = { onClose: () => void };

export function SellerFreshnessV13({ onClose }: Props) {
  const [products, setProducts] = useState<SellerCatalogueProduct[]>([]);
  const [windowHours, setWindowHours] = useState(DEFAULT_WINDOW_HOURS);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    const token = await getAuthToken();
    if (!token) return;
    const result = await getSellerCatalogue({ token });
    if (result.ok && result.data) setProducts(result.data.products);
  }, []);

  useEffect(() => { void load(); }, [load]);
  // The countdown is derived from the expiry window, not from a stored timer.
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(t); }, []);

  const reconfirm = useCallback(async (product: SellerCatalogueProduct) => {
    setBusyId(product.id);
    setError('');
    try {
      const token = await getAuthToken();
      if (!token) return;
      const result = await setProductAvailability({ token, productId: product.id, to: 'en_stock', expiresInHours: windowHours });
      if (result.ok) {
        setNotice(`${product.name} : disponibilité re-confirmée (${windowHours} h).`);
        void load();
      } else if (result.error?.code === 'FORBIDDEN_OR_PRO_REQUIRED') {
        setError('Le Pro de l’entité est requis pour déclarer une disponibilité vivante (D-04).');
      } else {
        setError(`Refusé — ${result.error?.message ?? 'réessayez.'}`);
      }
    } catch {
      setError('Confirmation interrompue. Réessayez.');
    } finally { setBusyId(null); }
  }, [load, windowHours]);

  const published = products.filter((p) => p.publicationState === 'published');
  const worst = published.length > 0
    ? worstFreshness(published.map((p) => ({ availabilityState: p.availabilityState, availabilityExpiresAt: p.availabilityExpiresAt })), now)
    : null;
  const needing = published.filter((p) => computeOfferFreshness(p.availabilityState, p.availabilityExpiresAt, now).level !== 'fresh');
  // The summary badge is the worst offer's badge: a screen that names a set must
  // show its weakest link, never its best case.
  const worstBadge = worst ? badgeFor(needing[0] ?? published[0]!, now) : null;

  const reconfirmAll = useCallback(async () => {
    for (const product of needing) {
      // eslint-disable-next-line no-await-in-loop
      await reconfirm(product);
    }
  }, [needing, reconfirm]);

  return (
    <section className="sheet h-mid" data-sheet="freshness" role="region" aria-label="Fraîcheur de la disponibilité">
      <div className="handle" />
      <div className="sheet-head">
        <div><div className="eyebrow">Entité · fraîcheur de la dispo</div><h1>{worst && worst.level !== 'fresh' ? 'Votre disponibilité est ancienne' : 'Votre disponibilité'}</h1></div>
        <button type="button" className="btn ghost sm" style={{ width: 'auto', minHeight: 28 }} onClick={onClose} aria-label="Fermer"><ArrowLeft size={15} /></button>
      </div>

      {notice && <p className="sub" role="status">{notice}</p>}
      {error && <p className="sub" role="alert">{error}</p>}

      <div className="cardbox">
        <div className="kv"><span>Dernière confirmation</span><b>{worst ? freshnessLabel(worst, now) : 'Aucune offre publiée'}</b></div>
        <div className="kv"><span>Seuil frais / expiré</span><b>4 h frais · 24 h expiré</b></div>
        <div className="kv"><span>Badge affiché</span><b className={`status ${worstBadge?.tone ?? 'gray'}`}>{worstBadge?.label ?? '—'}</b></div>
      </div>

      <div className="section-kicker">Fenêtre de confirmation</div>
      <div className="chips" style={{ marginTop: 4 }}>
        {WINDOW_OPTIONS.map(([hours, label]) => (
          <span key={hours} className={`chip${windowHours === hours ? ' active' : ''}`} role="button" tabIndex={0} onClick={() => setWindowHours(hours)}><span className="dot" />{label}</span>
        ))}
      </div>

      <div className="btnrow" style={{ marginTop: 9 }}>
        <button className="btn" type="button" disabled={busyId !== null || published.length === 0} onClick={() => void reconfirmAll()}>
          <Clock size={14} /> {needing.length > 1 ? `Reconfirmer tout (${needing.length})` : 'Reconfirmer maintenant'}
        </button>
      </div>

      <div className="section-kicker" style={{ marginTop: 12 }}>Vos offres publiées</div>
      <div className="plist">
        {published.length === 0 && <p className="tiny muted">Aucune offre publiée — publiez une offre pour déclarer sa disponibilité.</p>}
        {published.map((product) => {
          const fresh = computeOfferFreshness(product.availabilityState, product.availabilityExpiresAt, now);
          const badge = badgeFor(product, now);
          return (
            <div className="pitem" key={product.id}>
              <span>
                <b>{product.name}</b>
                <small>{freshnessLabel(fresh, now)}</small>
              </span>
              <b className={`status ${badge.tone}`}>{badge.label}</b>
              <span className="btnrow" style={{ gap: 6, marginTop: 6 }}>
                <button className="btn ghost sm" type="button" style={{ width: 'auto', minHeight: 28 }} disabled={busyId === product.id} onClick={() => void reconfirm(product)}>
                  {busyId === product.id ? '…' : fresh.level === 'fresh' ? 'Re-confirmer' : 'Reconfirmer maintenant'}
                </button>
              </span>
            </div>
          );
        })}
      </div>
      <p className="lead">Le badge de disponibilité <b>vieillit</b> : il est mis à jour par le vendeur (ou automatiquement, entité Pro). Une disponibilité non re-confirmée repasse « À confirmer » et cesse d’être transactable.</p>
    </section>
  );
}
