/**
 * S-02 — `handover_kind` (`'retrait' | 'livraison' | 'immateriel`) croisait `position_kind`
 * (`'fixe' | 'mobile' | 'immaterielle`) sans que RIEN ne les confronte : une offre IMMATERIELLE
 * promettant un RETRAIT physique se publiait. C'est le meme mensonge que « Itineraire vers
 * une offre en ligne » (SP-5) : promettre un geste physique sur du non-physique.
 *
 * Ce module est PUR et partage : le serveur l'applique a la publication, l'interface au
 * moment d'afficher le refus. Une seule regle, deux appelants.
 *
 * La regle tient en une phrase : **on ne retire pas sur place ce qui n'a pas de lieu.**
 * Seule la combinaison position immaterielle + retrait est refusee. Le reste est delibere :
 * - immaterielle + livraison : un fichier s'envoie (email, WhatsApp, telechargement) ;
 * - fixe/mobile + immateriel : un code se remet au comptoir (recharge, billet, bon) ;
 * - tout le reste (retrait au comptoir, livraison a domicile) va de soi.
 * Une caracteristique non declaree (`null`, offre heritee) ne declenche rien : c'est
 * HANDOVER_REQUIRED qui parle dans ce cas, pas cette regle.
 */

export type HandoverKind = 'retrait' | 'livraison' | 'immateriel';

export type HandoverPositionKind = 'fixe' | 'mobile' | 'immaterielle';

export function handoverIncoherent(
  positionKind: string | null | undefined,
  handoverKind: string | null | undefined,
): boolean {
  return positionKind === 'immaterielle' && handoverKind === 'retrait';
}
