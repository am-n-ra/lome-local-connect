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
  /** `Transport` est V1+ (S-08/S-12) : la chip est visible mais désactivée, avec une raison honnête. */
  soon: boolean;
  /** Raison affichée quand la chip est `soon`. */
  soonReason?: string;
}

export const MAP_FILTERS: readonly MapFilterOption[] = [
  { id: 'tout', label: 'Tout', soon: false },
  { id: 'commerces', label: 'Commerces', soon: false },
  { id: 'particuliers', label: 'Particuliers', soon: false },
  { id: 'transport', label: 'Transport', soon: true, soonReason: 'Transport — bientôt (V1+)' },
];

/** Le seul champ dont ce filtre dépend — un sous-ensemble de `PublicFacility` pour rester testable sans DOM. */
export interface FilterableFacility {
  entityKind?: 'individu' | 'organisation' | null;
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
      // V1+ : aucune offre de transport n'est modélisée (S-12). Filtrer ici viderait
      // la carte sans raison ; le filtre est désactivé en amont, donc ce cas est
      // inatteignable — il renvoie `false` plutôt que de mentir par un « tout ».
      return false;
  }
}

export function filterFacilities<T extends FilterableFacility>(facilities: readonly T[], filter: MapFilter): T[] {
  if (filter === 'tout') return facilities.slice();
  return facilities.filter((facility) => facilityMatchesFilter(facility, filter));
}
