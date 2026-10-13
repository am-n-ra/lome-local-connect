import { planPriceLabel } from '../domain/plan-labels';
import type { ResolvedCurrency } from '../domain/currency';

/**
 * Comparatif Free vs Pro, acheteur ET vendeur (fondateur 2026-10-07 : aucun
 * endroit ne détaillait tous les plans).
 *
 * Chaque ligne est adossée au comportement appliqué Non jamais une promesse :
 *  - comparateur 1/5 : `TrunkAppV13.openCompare` (`quota = pro_active ? 5 : 1`) ;
 *  - bulk 3/100 par mois : `v2_buyer_credit_accounts.monthly_quota` (free 3, pro 100) ;
 *  - offres 20 max / illimitées : `FREE_OFFER_LIMIT` + bypass `is_pro`
 *    (`trunk-repository.ts`, publication draft → published) ;
 *  - dispo en direct Pro : entitlement `facility_pro` vivant exigé (D-04) ;
 *  - vérifications manuelles gratuites des deux côtés (coût bulk 0) ;
 *  - campagnes sponsorisées Pro : garde `commercial_plan = 'pro_active'` ;
 *  - bonus confiance 20 $ : D-H, pas gaté par le plan (3 ventes distinctes) ;
 *  - recherche/favoris/alertes : sans gate Pro (authentifié suffit).
 * Prix : source unique `pricing.ts` via `planPriceLabel` (sticker USD + local).
 * Ce composant est une TABLE (présentation) : les états (actif/expiré/boutons)
 * restent aux cartes existantes de la sheet Plans. Pas de mur : informer,
 * jamais gater.
 */

type PlanRole = 'buyer' | 'seller';

interface PlanRow {
  label: string;
  free: string;
  pro: string;
}

const BUYER_ROWS: PlanRow[] = [
  { label: 'Recherche & favoris', free: '✓', pro: '✓' },
  { label: 'Comparateur', free: '1 établissement', pro: '5 établissements' },
  { label: 'Demandes bulk / mois', free: '3', pro: '100' },
  { label: 'Alertes de recherche', free: '✓', pro: '✓' },
];

const SELLER_ROWS: PlanRow[] = [
  { label: 'Offres publiées', free: '20 max', pro: 'Illimitées' },
  { label: 'Disponibilité en direct', free: 'Non', pro: '✓' },
  { label: 'Vérifications manuelles', free: 'Gratuites', pro: 'Gratuites' },
  { label: 'Campagnes sponsorisées', free: 'Non', pro: '✓' },
  { label: 'Bonus confiance 20 $', free: '✓', pro: '✓' },
];

export function PlansCompareV13({ role, currency }: { role: PlanRole; currency: ResolvedCurrency }) {
  const rows = role === 'buyer' ? BUYER_ROWS : SELLER_ROWS;
  const proKey = role === 'buyer' ? 'buyerPro' : 'sellerPro';
  return (
    <div className="cardbox" style={{ marginTop: 10 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="tiny muted">Gratuit</span>
        <b className="tiny">Pro · {planPriceLabel(proKey, currency)}/mois</b>
      </div>
      {rows.map((row) => (
        <div className="kv" key={row.label}>
          <span>{row.label}</span>
          <b>{row.free} · {row.pro}</b>
        </div>
      ))}
    </div>
  );
}
