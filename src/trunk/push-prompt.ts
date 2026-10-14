import type { PushSupport } from './push-subscribe';

/**
 * BRANCHES-NOTIF-1 — l'action qui vient d'avoir lieu, et qui VA réellement utiliser
 * les notifications. On demande la permission JUSTE APRÈS, jamais « à froid » au
 * chargement (anti-patron : refus massif) ni depuis un écran de réglages isolé que
 * l'utilisateur n'ouvre pas.
 *
 * Chaque valeur est un moment où l'utilisateur DEVIENT partie prenante et attend
 * l'autre côté : il a donc besoin d'être joignable.
 */
export type PushTriggerAction =
  | 'buyer-request' // l'acheteur vient d'envoyer une demande de dispo → attend la réponse vendeur
  | 'buyer-intent'  // l'acheteur vient de créer une intention d'achat → attend le scan vendeur
  | 'seller-offer'  // le vendeur vient de publier une offre → attend une demande acheteur
  | 'seller-qr';    // le vendeur vient de scanner le QR d'un acheteur → attend la déclaration de paiement

/**
 * Classification exhaustive : `Record<PushTriggerAction, boolean>` force à classer
 * CHAQUE action. Ajouter une valeur à l'union sans la classer ici est une erreur de
 * compilation — un moment non classé ne peut pas devenir un prompt silencieux.
 */
const ENGAGEMENT_MOMENT: Record<PushTriggerAction, boolean> = {
  'buyer-request': true,
  'buyer-intent': true,
  'seller-offer': true,
  'seller-qr': true,
};

/**
 * Décide si l'on peut demander la permission MAINTENANT.
 *
 * - jamais si un abonnement existe déjà (rien à demander) ;
 * - jamais deux fois (une seule demande par appareil : on n'harcèle pas) ;
 * - jamais si la plateforme ne peut pas livrer (`needs-install`, `not-configured`,
 *   `unsupported`, `permission-denied`) — demander là promettrait une alerte qui ne viendra pas ;
 * - sinon, seulement sur un moment d'engagement.
 */
export function shouldAutoPromptPush(input: {
  action: PushTriggerAction;
  support: PushSupport;
  alreadyPrompted: boolean;
  pushActive: number;
}): boolean {
  if (input.pushActive > 0) return false;
  if (input.alreadyPrompted) return false;
  if (input.support !== 'supported') return false;
  return ENGAGEMENT_MOMENT[input.action];
}

/** Exposé pour la garde : la liste des moments qui peuvent déclencher un prompt. */
export const PUSH_TRIGGER_ACTIONS = Object.keys(ENGAGEMENT_MOMENT) as PushTriggerAction[];
