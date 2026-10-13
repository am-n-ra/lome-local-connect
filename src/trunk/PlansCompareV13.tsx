import { planPriceLabel } from '../domain/plan-labels';
import { COMPARE_QUOTA_FREE, COMPARE_QUOTA_PRO, FREE_OFFER_LIMIT } from '../domain/invariants';
import type { ResolvedCurrency } from '../domain/currency';

/**
 * Comparatif Free vs Pro, acheteur ET vendeur.
 *
 * Deux exigences fondateur (2026-10-07) :
 *  1. « que le tableau comparatif soit clair … qu'il comprenne dans quoi il s'engage et ce
 *     que ça peut lui apporter » — donc **deux colonnes distinctes** (Gratuit | Pro), pas
 *     une seule ligne `free · pro` où l'on ne sait plus quel chiffre appartient à quel plan.
 *  2. **S'adapter au réel** : chaque ligne est adossée au comportement appliqué, jamais une
 *     promesse. Les valeurs chiffrées viennent des constantes du domaine (`invariants.ts`)
 *     pour que le tableau et le code ne puissent plus diverger (le comparateur affichait
 *     1/5 alors que le Seed porte 3/10).
 *
 * Ce composant est une TABLE (présentation) : les états (actif/expiré/boutons) restent aux
 * cartes existantes de la sheet Plans. Pas de mur : informer, jamais gater.
 */

type PlanRole = 'buyer' | 'seller';

interface PlanRow {
  label: string;
  free: string;
  pro: string;
}

const BUYER_ROWS: PlanRow[] = [
  { label: 'Recherche, favoris & alertes', free: 'Illimités', pro: 'Illimités' },
  { label: 'Comparateur', free: `${COMPARE_QUOTA_FREE} établissements`, pro: `${COMPARE_QUOTA_PRO} établissements` },
  { label: 'Demandes groupées (bulk) / mois', free: '3', pro: '100' },
];

const SELLER_ROWS: PlanRow[] = [
  { label: 'Offres publiées', free: `${FREE_OFFER_LIMIT} max`, pro: 'Illimitées' },
  { label: 'Emplacements (facilités)', free: '1 inclus', pro: 'Additionnels (payants)' },
  { label: 'Disponibilité en direct', free: 'Manuelle', pro: 'Automatique' },
  { label: 'Vérifications manuelles', free: 'Gratuites', pro: 'Gratuites' },
  { label: 'Analytics', free: 'Non', pro: '✓' },
  { label: 'Campagnes sponsorisées', free: 'Non', pro: '✓' },
  { label: 'Bonus confiance 20 $', free: '✓', pro: '✓' },
];

export function PlansCompareV13({ role, currency }: { role: PlanRole; currency: ResolvedCurrency }) {
  const rows = role === 'buyer' ? BUYER_ROWS : SELLER_ROWS;
  const proKey = role === 'buyer' ? 'buyerPro' : 'sellerPro';
  return (
    <div className="cardbox" style={{ marginTop: 10 }}>
      <div className="plans-head" aria-hidden="true"><span /><span>Gratuit</span><span>Pro · {planPriceLabel(proKey, currency)}/mois</span></div>
      {rows.map((row) => (
        <div className="plans-row" key={row.label}>
          <span className="plans-label">{row.label}</span>
          <span className="plans-cell">{row.free}</span>
          <span className="plans-cell plans-pro">{row.pro}</span>
        </div>
      ))}
      <p className="tiny muted" style={{ marginTop: 8 }}>
        Les deux colonnes disent ce que chaque plan <b>permet</b>. Aucune ligne ne masque une
        offre : le gratuit reste utilisable, le Pro lève les plafonds.
      </p>
    </div>
  );
}
