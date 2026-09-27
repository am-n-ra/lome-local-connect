/**
 * S-09 / S-02 — « tout est offre ; la différence est une caractéristique ».
 *
 * `price_kind` valait `'fixe'` ou `'negociable'` et ne décidait RIEN : l'acheteur ne pouvait
 * exprimer qu'un PLAFOND (`budget_minor`), jamais un prix proposé, et le libellé « À négocier »
 * était purement décoratif. Une offre négociable se comportait exactement comme une offre à prix
 * fixe — c'est la dette que le Seed V2 nomme (caractéristique n°7 « Prix fixe / à négocier »,
 * confirmée **modèle jour 1 ET comportement pilote**).
 *
 * Ce module est PUR et partagé : le serveur l'applique au moment d'écrire et de verrouiller le
 * prix, l'interface au moment d'afficher. Une seule règle, deux appelants.
 *
 * La règle tient en une phrase : **négocier, c'est chercher un prix PLUS BAS.** Sur une offre
 * négociable, l'acheteur peut proposer un prix inférieur ou égal au prix affiché ; proposer
 * davantage n'est pas une négociation, c'est une incohérence — on la refuse au lieu de l'absorber
 * en silence. Sur une offre à prix fixe, il n'y a rien à proposer : le prix affiché est le prix.
 */

export type PriceKind = 'fixe' | 'negociable';

/** Vrai si le prix de l'offre est discutable. C'est `price_kind` qui répond, pas l'appelant. */
export function isNegotiable(priceKind: string | null | undefined): boolean {
  return priceKind === 'negociable';
}

/**
 * L'acheteur peut-il PROPOSER un prix sur cette offre ?
 *
 * Seule une offre négociable ouvre la discussion. Une offre à prix fixe garde son prix : rien
 * n'est proposé, donc rien ne doit être accepté côté serveur non plus. Une caractéristique non
 * déclarée (`null`, offre héritée) n'ouvre **pas** la négociation — on ne présume pas un droit que
 * le vendeur n'a jamais accordé.
 */
export function canProposePrice(priceKind: string | null | undefined): boolean {
  return isNegotiable(priceKind);
}

/**
 * Refuse une proposition de prix incohérente. Retourne `null` si elle est acceptable, sinon la
 * raison en français (la surface l'affiche).
 *
 * - Caractéristique non négociable → la proposition est refusée : le prix est ferme.
 * - Proposition **supérieure** au prix affiché → refusée : négocier, c'est chercher moins cher.
 *   (Proposer plus, c'est une erreur de saisie ou une tentative d'achat au-dessus du prix — dans
 *   les deux cas, ce n'est pas une négociation.)
 * - Proposition absente (`null`) → acceptable : l'acheteur demande simplement la disponibilité au
 *   prix affiché, comme aujourd'hui.
 */
export function proposedPriceRejection(input: {
  priceKind: string | null | undefined;
  listedMinor: number;
  proposedMinor: number | null;
}): string | null {
  if (input.proposedMinor === null) return null;
  if (!Number.isInteger(input.proposedMinor) || input.proposedMinor < 0) {
    return 'Le prix proposé doit être un montant positif.';
  }
  if (!canProposePrice(input.priceKind)) {
    return 'Cette offre est à prix fixe : le prix affiché est le prix.';
  }
  if (input.proposedMinor > input.listedMinor) {
    return 'Négocier, c’est chercher un prix plus bas : votre proposition dépasse le prix affiché.';
  }
  return null;
}

/**
 * Le prix qui engage la transaction.
 *
 * Le vendeur reste l'autorité : c'est SON prix cité (`quotedMinor`, la réponse à la demande) qui
 * verrouille la transaction — c'est ce que `v2_availability_responses.price_minor` devenait déjà.
 * Le prix PROPOSÉ par l'acheteur n'est pas un engagement ; il est l'ouverture de la discussion.
 * Ce module ne remplace donc pas le prix du vendeur : il nomme la relation entre les deux, pour
 * que la surface puisse dire honnêtement ce qui s'est passé.
 */
export function negotiationReading(input: {
  priceKind: string | null | undefined;
  listedMinor: number;
  proposedMinor: number | null;
  quotedMinor: number;
}): { negotiated: boolean; discountMinor: number; summary: string | null } {
  const negotiated = isNegotiable(input.priceKind) && input.proposedMinor !== null;
  if (!negotiated) return { negotiated: false, discountMinor: 0, summary: null };
  const discountMinor = Math.max(0, input.listedMinor - input.quotedMinor);
  return {
    negotiated: true,
    discountMinor,
    summary: discountMinor > 0
      ? `Négocié : ${discountMinor} sous le prix affiché.`
      : 'Le vendeur a maintenu son prix affiché.',
  };
}
