/**
 * NR-9 — l'automate répond à la DISPONIBILITÉ, jamais à la NÉGOCIATION.
 *
 * Species §95 promettait depuis le 2026-08-27 un réglage explicite « Répondre automatiquement
 * depuis le stock Omni ». Root §6.3/§7 en fait un ACTEUR (« seller/**automation actor** »,
 * « Authorized seller **or approved automation** »). Le badge de disponibilité (TRUNK-X2) a été
 * construit ; la réponse au nom de l'entité, jamais. L'app présentait l'un pour l'autre — c'est
 * le mensonge `(source : auto)` retiré par NR-7.
 *
 * Ce module est PUR : il décide, à partir de faits fournis, si l'automate peut répondre — et
 * quand il ne peut pas, il le DIT. Le serveur l'applique ; un test le falsifie sans base de données.
 *
 * LA RÈGLE QUI TRANCHÉE LA SEULE QUESTION OUVERTE.
 * Species n'a jamais connu la négociation (`price_kind` est arrivé avec R-H, après lui). La
 * question était : sur une offre `negociable`, l'auto répond-elle au prix affiché, ou s'abstient-elle ?
 * **Elle s'abstient dès qu'un prix est proposé.** Répondre au prix affiché reviendrait à REFUSER
 * mécaniquement toute négociation (R-H n'accepte qu'une proposition ≤ prix affiché, donc un
 * acheteur propose toujours en dessous) — et à signer un prix que `offer-price.ts` réserve
 * explicitement au vendeur. Une demande SANS prix proposé n'est pas une négociation : elle porte
 * sur la disponibilité, et l'auto peut y répondre.
 *
 * Formulation : **l'automate répond à la disponibilité, jamais à la négociation.**
 *
 * C1–C10 (contrat `omni-nr9-auto-response-contract-2026-10-15.md`) — chaque refus NOMME sa condition,
 * pour que le vendeur sache pourquoi sa promesse n'est pas tenue au lieu de deviner.
 */

import { computeOfferFreshness } from './offer-freshness';

/** Les faits dont dépend la décision. Aucun n'est optionnel « par confort » : un fait absent est un refus. */
export interface AutoResponseFacts {
  /** C2 — le vendeur a activé « Répondre automatiquement depuis le stock Omni ». */
  autoEnabled: boolean;
  /** C1 — entitlement Pro VIVANT (lieu OU entité, R-4b/D-04), testé à la date. */
  proAlive: boolean;
  /** C3 — état de disponibilité porteur (`en_stock` / `verifie` attendus). */
  availabilityState: string | null | undefined;
  /** C3 — échéance de fraîcheur (D-03 : 4 h frais / 24 h expiré). */
  availabilityExpiresAt: string | number | Date | null | undefined;
  /** C4 — capacité réelle = `greatest(allocated − reserved, 0)`. */
  availableStock: number;
  /** La quantité demandée par l'acheteur. */
  requestedQuantity: number;
  /** C10 — le prix qui engagerait la transaction (prix affiché, remise appliquée). */
  listedPriceMinor: number;
  /** L'acheteur a-t-il proposé un prix ? `null` = simple demande de disponibilité. */
  proposedPriceMinor: number | null;
  /** Instant de la décision (injecté : la fonction reste pure et testable). */
  now: number;
}

export type AutoResponseRefusal =
  | 'not-enabled'
  | 'not-pro'
  | 'not-fresh'
  | 'insufficient-stock'
  | 'negotiation-open';

export type AutoResponseDecision =
  | {
      kind: 'respond';
      status: 'available';
      quantityAvailable: number;
      priceMinor: number;
      /** C6 — l'âge de l'observation que la surface affichera. */
      freshnessLevel: 'fresh';
    }
  | { kind: 'defer'; reason: AutoResponseRefusal; detail: string };

/**
 * Ce que l'automate peut répondre — ou pourquoi il s'abstient.
 *
 * L'ordre des refus suit la chaîne d'autorité : d'abord le DROIT (réglage, Pro), puis la VÉRITÉ
 * (fraîcheur), puis la CAPACITÉ (stock), puis la NATURE de la demande (négociation). Un refus
 * de droit est plus fondamental qu'un refus de stock : le message doit dire le premier obstacle,
 * pas le dernier.
 */
export function decideAutoResponse(facts: AutoResponseFacts): AutoResponseDecision {
  if (!facts.autoEnabled) {
    return { kind: 'defer', reason: 'not-enabled', detail: 'La réponse automatique n’est pas activée pour cette offre.' };
  }
  if (!facts.proAlive) {
    return { kind: 'defer', reason: 'not-pro', detail: 'La réponse automatique demande un plan Pro vivant.' };
  }

  // C5 — « une réponse automatique ne transforme jamais une donnée périmée en vérité »
  // (Species buyer flow). Une donnée ancienne ⇒ vérification requise ⇒ un HUMAIN.
  const freshness = computeOfferFreshness(facts.availabilityState, facts.availabilityExpiresAt, facts.now);
  if (freshness.level !== 'fresh') {
    return {
      kind: 'defer',
      reason: 'not-fresh',
      detail: freshness.level === 'expired'
        ? 'Le stock Omni n’est plus frais : le vendeur doit re-confirmer.'
        : 'Le stock Omni vieillit : le vendeur doit re-confirmer.',
    };
  }

  // C4 — « une quantité insuffisante est EXCLUE » (Species §113) : jamais de réponse partielle
  // automatique. L'automate ne marchande pas la quantité.
  if (facts.requestedQuantity < 1 || facts.availableStock < facts.requestedQuantity) {
    return {
      kind: 'defer',
      reason: 'insufficient-stock',
      detail: `Le stock Omni (${Math.max(0, facts.availableStock)}) ne couvre pas la quantité demandée (${facts.requestedQuantity}).`,
    };
  }

  // La seule question que Species n'avait pas connue. Voir l'en-tête : l'auto répond à la
  // DISPONIBILITÉ, jamais à la NÉGOCIATION. Un prix proposé ouvre une discussion qui appartient
  // au vendeur — l'automate ne signe pas un prix, il constate une disponibilité.
  if (facts.proposedPriceMinor !== null) {
    return {
      kind: 'defer',
      reason: 'negotiation-open',
      detail: 'L’acheteur propose un prix : la négociation revient au vendeur.',
    };
  }

  return {
    kind: 'respond',
    status: 'available',
    quantityAvailable: facts.requestedQuantity,
    priceMinor: facts.listedPriceMinor,
    freshnessLevel: 'fresh',
  };
}

/**
 * L'automate doit-il s'abstenir dès qu'un prix est proposé, même si tout le reste est vert ?
 * Exposé séparément parce que c'est la DÉCISION produit (et non un détail d'implémentation) :
 * un test la verrouille seule, pour qu'un refactor ne la dissolve pas dans le reste.
 */
export function defersOnNegotiation(proposedPriceMinor: number | null): boolean {
  return proposedPriceMinor !== null;
}
