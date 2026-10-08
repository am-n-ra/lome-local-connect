// Sender Web Push — la moitié manquante de FF-7.
//
// Les `v2_notification_deliveries` de canal `web_push` restaient `queued` : personne ne
// les dépilait, et aucun navigateur ne s'abonnait (`subscribeWebPush` = 0 appelant). Ce
// module dépile la file ET le binding VAPID vit dans `web-push-provider.ts` (pour que la
// logique ci-dessous reste pure et testable sans le paquet `web-push`).
//
// Contrainte de plateforme, à ne pas oublier : sur iOS le push n'existe que si l'app est
// INSTALLÉE (16.4+). La couche A2HS est le préalable (commit `10d0523`).

export interface PushSubscriptionTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PendingPushDelivery {
  deliveryId: string;
  // Un événement vise un compte ; ce compte peut avoir plusieurs appareils abonnés.
  targets: PushSubscriptionTarget[];
  payload: Record<string, unknown>;
  attemptCount: number;
}

export interface PushSendResult {
  ok: boolean;
  statusCode?: number;
  errorClass?: string;
}

/** Ce que le fournisseur a répondu décide du sort honnête de la livraison. */
export type PushOutcome = 'delivered' | 'retry' | 'revoke' | 'exhausted' | 'skipped';

export const MAX_PUSH_ATTEMPTS = 5;

/**
 * - 2xx → livré.
 * - 404/410 → l'abonnement est mort (navigateur réinstallé, permission retirée) : on le
 *   révoque, on ne réessaie pas indéfiniment un endpoint qui n'existe plus.
 * - 429/5xx → transitoire : on réessaie avec un recul exponentiel.
 * - 400/401/403 → notre faute (clé VAPID, payload) : inutile d'insister, on échoue.
 */
export function classifyPushOutcome(statusCode: number | undefined): PushOutcome {
  if (typeof statusCode !== 'number') return 'retry';
  if (statusCode >= 200 && statusCode < 300) return 'delivered';
  if (statusCode === 404 || statusCode === 410) return 'revoke';
  if (statusCode === 429 || statusCode >= 500) return 'retry';
  return 'exhausted';
}

/** Recul exponentiel borné (30 s → 30 min), jamais un martèlement réseau. */
export function nextAttemptDelayMs(attemptCount: number): number {
  return Math.min(30 * 60_000, 2 ** Math.max(0, attemptCount) * 30_000);
}

/** Message affiché par le système. Construit depuis l'événement, jamais inventé. */
export function pushMessageFor(payload: Record<string, unknown>): { title: string; body: string; url: string } {
  const state = typeof payload.state === 'string' ? payload.state : '';
  const from = typeof payload.from === 'string' ? payload.from : '';
  const titles: Record<string, string> = {
    qr_verified: 'Omni · transaction',
    payment_declared: 'Omni · paiement',
    payment_confirmed: 'Omni · paiement confirmé',
    fulfilled: 'Omni · remise',
    received: 'Omni · réception',
    rated: 'Omni · avis',
    closed: 'Omni · transaction terminée',
  };
  const bodies: Record<string, string> = {
    qr_verified: 'Le vendeur a scanné votre QR. À vous de déclarer le paiement.',
    payment_declared: 'L’acheteur a déclaré le paiement. Confirmez-le pour continuer.',
    payment_confirmed: 'Paiement confirmé. La remise peut avoir lieu.',
    fulfilled: 'La remise a été confirmée. Confirmez la réception.',
    received: 'Réception confirmée. Laissez un avis pour clôturer.',
    rated: 'Un avis a été laissé sur cette transaction.',
    closed: 'La transaction est terminée.',
  };
  return {
    title: titles[state] || 'Omni',
    body: bodies[state] || (state ? `Nouvelle étape : ${state}.` : 'Vous avez une nouvelle étape de transaction.'),
    // Cible du tap : l'Inbox, jamais un rechargement nu. Le service worker rouvre ou
    // met au premier plan l'app, puis cette query ouvre le centre de notifications.
    url: '/?notifs=1',
  };
}

export interface PushDeliveryDeps {
  listPending(limit: number): Promise<PendingPushDelivery[]>;
  send(target: PushSubscriptionTarget, payload: string): Promise<PushSendResult>;
  markDelivered(deliveryId: string, providerReference: string): Promise<void>;
  markRetry(deliveryId: string, attemptCount: number, nextAttemptAt: Date, errorClass: string): Promise<void>;
  markExhausted(deliveryId: string, errorClass: string): Promise<void>;
  revokeEndpoints(endpoints: string[]): Promise<void>;
}

export interface PushDeliverySummary {
  delivered: number;
  retried: number;
  revoked: number;
  exhausted: number;
  scanned: number;
}

/**
 * Dépile la file une fois. Chaque livraison est jugée par sa réponse ; un échec
 * transitoire recule, un endpoint mort est révoqué, un échec permanent s'arrête.
 * Idempotent par construction : une livraison déjà `delivered` n'est jamais relue.
 */
export async function deliverPendingPush(
  deps: PushDeliveryDeps,
  options: { limit?: number; now?: Date } = {},
): Promise<PushDeliverySummary> {
  const limit = options.limit ?? 25;
  const now = options.now ?? new Date();
  const pending = await deps.listPending(limit);
  const summary: PushDeliverySummary = { delivered: 0, retried: 0, revoked: 0, exhausted: 0, scanned: pending.length };
  const deadEndpoints: string[] = [];

  for (const delivery of pending) {
    const message = pushMessageFor(delivery.payload);
    const body = JSON.stringify(message);
    // On envoie à TOUS les appareils du compte ; un endpoint mort est révoqué sans
    // empêcher les autres de recevoir. Un seul appareil vivant suffit à « livrer ».
    let anyDelivered = false;
    let sawRetry = false;
    let sawRevoke = false;
    let firstError = '';

    for (const target of delivery.targets) {
      let result: PushSendResult;
      try {
        result = await deps.send(target, body);
      } catch (error) {
        result = { ok: false, statusCode: undefined, errorClass: error instanceof Error ? error.name : 'SendError' };
      }
      const outcome = result.ok ? 'delivered' : classifyPushOutcome(result.statusCode);
      const errorClass = result.errorClass || (result.statusCode ? `HTTP_${result.statusCode}` : 'NO_STATUS');
      if (outcome === 'delivered') anyDelivered = true;
      else if (outcome === 'revoke') { sawRevoke = true; deadEndpoints.push(target.endpoint); }
      else if (outcome === 'retry') sawRetry = true;
      if (outcome !== 'delivered' && !firstError) firstError = errorClass;
    }

    if (anyDelivered) {
      // Au moins un appareil a reçu : la livraison est faite, même si un autre appareil
      // était mort (son endpoint est révoqué plus bas, sans réessai inutile).
      await deps.markDelivered(delivery.deliveryId, `web-push:${delivery.deliveryId}`);
      summary.delivered += 1;
    } else if (sawRetry && delivery.attemptCount + 1 < MAX_PUSH_ATTEMPTS) {
      const nextAttemptAt = new Date(now.getTime() + nextAttemptDelayMs(delivery.attemptCount + 1));
      await deps.markRetry(delivery.deliveryId, delivery.attemptCount + 1, nextAttemptAt, firstError || 'NETWORK');
      summary.retried += 1;
    } else if (sawRevoke) {
      // Tous les appareils sont morts : la livraison quitte la file (sinon elle serait
      // relue indéfiniment) et les endpoints sont révoqués plus bas.
      await deps.markExhausted(delivery.deliveryId, 'ENDPOINT_GONE');
      summary.revoked += 1;
    } else {
      await deps.markExhausted(delivery.deliveryId, firstError || 'EXHAUSTED');
      summary.exhausted += 1;
    }
  }

  if (deadEndpoints.length > 0) await deps.revokeEndpoints(deadEndpoints);
  return summary;
}
