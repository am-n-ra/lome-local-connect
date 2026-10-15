/**
 * NR-7 — l'origine d'une réponse de disponibilité, LUE et jamais inventée.
 *
 * L'app affichait `(source : auto)` en **dur** sur une réponse que le vendeur venait de
 * confirmer à la main. C'était un mensonge : `v2_reconcile_auto_availability()` (TRUNK-X2)
 * écrit l'état de l'**offre** (le badge), elle n'écrit **jamais** `v2_availability_responses`.
 * Aucune réponse automatique n'existe aujourd'hui — la seule écriture de réponse est
 * `respondAvailability`, le chemin **vendeur**.
 *
 * Root §6.3 modélise pourtant `availability_responses` comme « request, **seller/automation
 * actor**, … » : l'origine est une **donnée**, pas une décoration. La surface doit donc la
 * **lire** — `responder_account_id` est nullable, son absence EST l'acteur automatique.
 *
 * Ce module est PUR : il nomme le libellé depuis le fait, sans réseau ni DOM. Une valeur
 * inconnue retombe sur « le vendeur » — le seul producteur réel — plutôt que d'affirmer une
 * automatisation qui n'a pas eu lieu.
 */

export type ResponseOrigin = 'seller' | 'automation';

/** Le fait porté par la ligne, ou `null` quand il n'est pas fourni. */
export function responseOrigin(responderKind: string | null | undefined): ResponseOrigin {
  return responderKind === 'automation' ? 'automation' : 'seller';
}

/**
 * Ce que l'acheteur lit. Le libellé **nomme qui a répondu**, jamais un mécanisme.
 * Une automatisation est dite « Automatique · au nom du vendeur » : le vendeur reste
 * responsable (Species §95 « répond au nom de l'entité »), et l'acheteur sait qu'un
 * humain n'a pas répondu.
 */
export function availabilitySourceLabel(responderKind: string | null | undefined): string {
  return responseOrigin(responderKind) === 'automation'
    ? 'Automatique · au nom du vendeur'
    : 'Confirmé par le vendeur';
}
