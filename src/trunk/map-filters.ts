/**
 * S-07 — le rail de filtres de la carte : `Tout / Commerces / Particuliers / Transport`.
 *
 * La maquette acceptée porte ce rail (`filterrail`) ; l'app ne l'avait pas, alors que
 * S-07 le décrit comme la façon dont « la carte ne sature pas ». Le filtre porte sur
 * l'ENTITÉ (S-13 : un particulier EST une entité, même objet qu'un commerce), jamais
 * sur un attribut de produit — c'est ce qui rend découvrable le cas fondateur
 * « un particulier vend son ordinateur d'occasion » sans exiger un filtre neuf/occasion.
 *
 * Règle d'honnêteté : un lieu SANS entité (fond de carte `public_import`, `unclaimed`,
 * S-05 « Lieu connu — pas encore géré ») n'est ni un commerce ni un particulier. Il est
 * donc masqué par ces deux filtres et visible uniquement sous `Tout`. Le masquer est le
 * comportement exact : prétendre qu'un lieu connu est un commerce serait le mensonge que
 * S-05 interdit.
 */

export type MapFilter = 'tout' | 'commerces' | 'particuliers' | 'transport';

export interface MapFilterOption {
  id: MapFilter;
  label: string;
  /** Toutes les chips sont actives (S4) : `Transport (mobile)` filtre la FORME du lieu. */
  soon: boolean;
  /** Raison affichée quand la chip est `soon` (aucune aujourd'hui). */
  soonReason?: string;
}

export const MAP_FILTERS: readonly MapFilterOption[] = [
  { id: 'tout', label: 'Tout', soon: false },
  { id: 'commerces', label: 'Commerces', soon: false },
  { id: 'particuliers', label: 'Particuliers', soon: false },
  // S4 (Heartwood) — la chip existait mais était désactivée. Elle filtre la FORME du lieu
  // (`mobile` = ambulant), pas une catégorie d'offre. Le libellé est explicité (« mobile »)
  // pour ne pas laisser croire à des services de livraison (S-08/S-12, hors Heartwood).
  { id: 'transport', label: 'Transport (mobile)', soon: false },
];

/** Le sous-ensemble de `PublicFacility` dont ce filtre dépend — testable sans DOM. */
export interface FilterableFacility {
  entityKind?: 'individu' | 'organisation' | null;
  facilityType?: 'fixe' | 'mobile' | 'digital' | null;
}

export function facilityMatchesFilter(facility: FilterableFacility, filter: MapFilter): boolean {
  switch (filter) {
    case 'tout':
      return true;
    case 'commerces':
      return facility.entityKind === 'organisation';
    case 'particuliers':
      return facility.entityKind === 'individu';
    case 'transport':
      // S4 — « Transport (mobile) » = le lieu SE DÉPLACE (forme `mobile`). Un lieu digital ou
      // fixe, ou de forme non déclarée (`null`), ne matche pas. On n'invente pas une forme.
      return facility.facilityType === 'mobile';
  }
}

export function filterFacilities<T extends FilterableFacility>(facilities: readonly T[], filter: MapFilter): T[] {
  if (filter === 'tout') return facilities.slice();
  return facilities.filter((facility) => facilityMatchesFilter(facility, filter));
}
