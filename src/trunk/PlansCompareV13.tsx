import { planPriceLabel } from '../domain/plan-labels';
import { COMPARE_QUOTA_FREE, COMPARE_QUOTA_PRO, FREE_OFFER_LIMIT } from '../domain/invariants';
import { AUTO_RESPONSE_ABSTENTION } from './auto-response';
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
  /** NR-11 — ce que la ligne veut dire concrètement, en une phrase. */
  explain: string;
}

const BUYER_ROWS: PlanRow[] = [
  { label: 'Recherche, favoris & alertes', free: 'Illimités', pro: 'Illimités', explain: 'Chercher, garder vos favoris et être alerté ne sont jamais payants. Le Pro ne change rien ici.' },
  { label: 'Comparateur', free: `${COMPARE_QUOTA_FREE} établissements`, pro: `${COMPARE_QUOTA_PRO} établissements`, explain: `Vous comparez jusqu’à ${COMPARE_QUOTA_FREE} établissements à la fois. Le Pro porte la limite à ${COMPARE_QUOTA_PRO}.` },
  { label: 'Demandes groupées (bulk) / mois', free: '3', pro: '100', explain: 'Une demande groupée interroge plusieurs établissements pour le même besoin. 1 besoin = 1 crédit.' },
];

const SELLER_ROWS: PlanRow[] = [
  { label: 'Offres publiées', free: `${FREE_OFFER_LIMIT} max`, pro: 'Illimitées', explain: `Vous publiez jusqu’à ${FREE_OFFER_LIMIT} offres par facilité. Le Pro lève ce plafond.` },
  { label: 'Emplacements (facilités)', free: '1 inclus', pro: 'Additionnels (payants)', explain: 'Un emplacement est un lieu. Le premier est inclus ; les suivants s’achètent à l’unité.' },
  { label: 'Disponibilité en direct', free: 'Manuelle', pro: 'Automatique', explain: 'Manuelle : vous confirmez chaque demande. Automatique : Omni répond depuis votre stock (voir les cas d’abstention ci-dessous).' },
  { label: 'Vérifications manuelles', free: 'Gratuites', pro: 'Gratuites', explain: 'Demander une vérification de disponibilité à un vendeur reste gratuit, dans les deux plans.' },
  { label: 'Analytics', free: 'Non', pro: '✓', explain: 'Le Pro montre vos demandes reçues, vos transactions, votre revenu et vos scans QR vérifiés.' },
  { label: 'Campagnes sponsorisées', free: 'Non', pro: '✓', explain: 'Le Pro permet de mettre une facilité en avant dans la recherche, avec le badge « Sponsorisé ».' },
  { label: 'Bonus confiance 20 $', free: '✓', pro: '✓', explain: 'Après 3 ventes à des acheteurs distincts, le bonus est crédité, quel que soit le plan.' },
];

export function PlansCompareV13({ role, currency }: { role: PlanRole; currency: ResolvedCurrency }) {
  const rows = role === 'buyer' ? BUYER_ROWS : SELLER_ROWS;
  const proKey = role === 'buyer' ? 'buyerPro' : 'sellerPro';
  return (
    <div className="cardbox" style={{ marginTop: 10 }}>
      <div className="plans-head" aria-hidden="true"><span /><span>Gratuit</span><span>Pro · {planPriceLabel(proKey, currency)}/mois</span></div>
      {rows.map((row) => (
        <div className="plans-item" key={row.label}>
          <div className="plans-row">
            <span className="plans-label">{row.label}</span>
            <span className="plans-cell">{row.free}</span>
            <span className="plans-cell plans-pro">{row.pro}</span>
          </div>
          <p className="plans-explain">{row.explain}</p>
        </div>
      ))}
      <p className="tiny muted" style={{ marginTop: 8 }}>
        Les deux colonnes disent ce que chaque plan <b>permet</b>. Aucune ligne ne masque une
        offre : le gratuit reste utilisable, le Pro lève les plafonds.
      </p>
      {role === 'seller' && (
        <div className="plans-note" data-testid="pro-abstention">
          <b className="tiny">Quand la réponse automatique s’abstient</b>
          <ul>
            {(Object.keys(AUTO_RESPONSE_ABSTENTION) as Array<keyof typeof AUTO_RESPONSE_ABSTENTION>).map((reason) => (
              <li key={reason} className="tiny muted">{AUTO_RESPONSE_ABSTENTION[reason]}</li>
            ))}
          </ul>
          <p className="tiny muted" style={{ marginTop: 4 }}>
            L’automate répond à la <b>disponibilité</b>, jamais à la <b>négociation</b> : dans ces
            cas, la demande vous revient et rien n’est décidé à votre place.
          </p>
        </div>
      )}
    </div>
  );
}
