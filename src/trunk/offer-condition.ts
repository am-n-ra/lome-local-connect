/**
 * S-02 — `condition_kind` valait `'neuf'` ou `'occasion'` et ne decidait RIEN : une offre
 * d'occasion sans un mot sur son etat se publiait comme du neuf. C'est le mensonge exact
 * que cette regle tue.
 *
 * Ce module est PUR et partage : le serveur l'applique a la publication, l'interface au
 * moment d'afficher le refus. Une seule regle, deux appelants.
 *
 * La regle tient en une phrase : **on ne vend pas de l'occasion sans dire son etat.**
 * Une offre d'occasion publie seulement si sa description dit l'etat en au moins
 * OCCASION_DETAIL_MIN_CHARS caracteres. Le seuil est celui de l'integrite S-32, reutilise,
 * pas invente. Une caracteristique non declaree (`null`, offre heritee) ne declenche rien :
 * c'est CONDITION_REQUIRED qui parle dans ce cas, pas cette regle.
 */

export type ConditionKind = 'neuf' | 'occasion';

export const OCCASION_DETAIL_MIN_CHARS = 10;

export function isOccasion(conditionKind: string | null | undefined): boolean {
  return conditionKind === 'occasion';
}

export function occasionDetailMissing(
  conditionKind: string | null | undefined,
  description: string | null | undefined,
): boolean {
  return isOccasion(conditionKind) && (description ?? '').trim().length < OCCASION_DETAIL_MIN_CHARS;
}
