/**
 * S-01 / S-02 — « tout est offre ; la différence est une caractéristique ».
 *
 * Une pièce unique (appartement, ordinateur d'occasion, meuble) n'a pas un STOCK : elle a une
 * PRÉSENCE. Elle existe une fois, elle se vend une fois, puis elle disparaît. Le seul cas que la
 * logique connaissait était « N unités fongibles » : une pièce unique portait donc un stock de N,
 * était annoncée « en stock », et le niveau 4 (Transactable de S-06) se déduisait d'un décompte
 * qui n'a aucun sens pour elle. C'est la dette nommée par le Seed V2, déguisée en vocabulaire.
 *
 * Ce module est PUR et partagé : le serveur l'applique au moment d'écrire, l'interface au moment
 * d'afficher. Une seule règle, deux appelants — impossible qu'ils divergent.
 *
 * Le nombre que porte une pièce unique (`stockLoueOmni`) n'est pas son stock : c'est une
 * DÉCLARATION de son unicité. On normalise donc toute pièce unique à 1 exemplaire, et on refuse
 * les valeurs qui affirment une possession multiple (« j'ai 3 pièces uniques identiques »).
 */

export type UniquenessKind = 'renouvelable' | 'piece_unique';

/** Le nombre d'exemplaires que la caractéristique autorise à posséder. */
export const UNIQUENESS_CAPACITIES: Readonly<Record<UniquenessKind, number>> = Object.freeze({
  renouvelable: Number.POSITIVE_INFINITY,
  piece_unique: 1,
});

export function capacityForUniqueness(kind: string | null | undefined): number {
  return kind === 'piece_unique' ? 1 : Number.POSITIVE_INFINITY;
}

/** Vrai si l'offre est une pièce unique — une présence, jamais un décompte. */
export function isSinglePiece(kind: string | null | undefined): boolean {
  return kind === 'piece_unique';
}

/**
 * Normalise un nombre d'exemplaires selon la caractéristique.
 *
 * - `piece_unique` : ramené à 1. Toute autre valeur est une déclaration incohérente — on ne
 *   l'invente pas, on la ramène à ce que la caractéristique dit.
 * - `renouvelable` : inchangé (tout entier ≥ 0).
 *
 * Le cas `null` (caractéristique non encore déclarée) est **inchangé** : une offre héritée garde
 * son nombre, on ne la réécrit pas au passage. Le refus explicite vit dans `assertUniquenessStock`.
 */
export function normalizeStockForUniqueness(stockLoueOmni: number, kind: string | null | undefined): number {
  if (kind === 'piece_unique') return 1;
  return stockLoueOmni;
}

/**
 * Refuse une écriture qui affirme « plusieurs pièces uniques identiques ».
 *
 * `stockLoueOmni` est le nombre d'exemplaires DÉCLARÉ par le vendeur. Pour une pièce unique il ne
 * peut valoir que 0 (vendue / retirée de la vente) ou 1 (présente). 2+ est une contradiction, pas
 * une quantité : la refuser est plus honnête que la corriger en silence.
 *
 * Retourne `null` si l'écriture est cohérente, sinon la raison en français (la surface l'affiche).
 */
export function uniquenessStockRejection(stockLoueOmni: number, kind: string | null | undefined): string | null {
  if (kind !== 'piece_unique') return null;
  if (stockLoueOmni === 0 || stockLoueOmni === 1) return null;
  return 'Une pièce unique ne se déclare pas en plusieurs exemplaires : c’est une présence, pas un stock. Indiquez 1 (présente) ou 0 (retirée).';
}

/**
 * S-06 — la disponibilité d'une offre, lue dans sa caractéristique.
 *
 * Une pièce unique est disponible **par présence** : elle peut être réservée si elle est présente
 * et non déjà engagée. Une offre renouvelable se lit par son décompte. Les deux mènent au même
 * booléen — « puis-je la réserver maintenant ? » — mais pas par le même fait, et c'est la
 * caractéristique qui décide lequel est vrai.
 */
export function isReservable(input: {
  uniquenessKind: string | null | undefined;
  quantityAllocated: number;
  quantityReserved: number;
}): boolean {
  if (isSinglePiece(input.uniquenessKind)) {
    // « présence » : il faut qu'elle SOIT là (allocated >= 1) et qu'elle ne soit pas déjà engagée.
    // Le cas `allocated = 0` est une pièce retirée : elle n'est PAS réservable — la formule
    // « max(1, allocated) » le ratait, et une pièce vendue serait apparue transactable.
    return input.quantityAllocated >= 1 && input.quantityReserved < 1;
  }
  return Math.max(0, input.quantityAllocated - input.quantityReserved) > 0;
}
