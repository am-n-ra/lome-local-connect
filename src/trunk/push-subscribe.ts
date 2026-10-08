// Consentement Web Push côté navigateur — la moitié cliente qui manquait.
//
// Règle fondatrice : la permission ne se demande JAMAIS avant l'installation. Sur iOS,
// le push n'existe que dans l'app installée (16.4+) ; dans un onglet Safari, l'invite
// n'apparaît pas et l'utilisateur croit l'app cassée. L'ordre : expliquer → installer →
// demander ici, depuis l'app installée.

export type PushSupport = 'supported' | 'needs-install' | 'permission-denied' | 'not-configured' | 'unsupported';

/**
 * Les 4 conditions réelles, dans l'ordre où elles bloquent :
 * - l'app n'est pas installée sur iOS → `needs-install` (guide A2HS d'abord) ;
 * - aucune clé VAPID configurée côté serveur → `not-configured` (honnête, pas de bouton mort) ;
 * - la permission a été refusée → `permission-denied` (on n'insiste pas, on explique) ;
 * - le navigateur ne supporte pas le Push → `unsupported`.
 */
export function pushSupportFor(input: {
  hasServiceWorker: boolean;
  hasPushManager: boolean;
  isIos: boolean;
  isInstalled: boolean;
  permission: NotificationPermission | 'unsupported';
  vapidConfigured: boolean;
}): PushSupport {
  if (!input.hasServiceWorker || !input.hasPushManager || input.permission === 'unsupported') return 'unsupported';
  if (input.isIos && !input.isInstalled) return 'needs-install';
  if (!input.vapidConfigured) return 'not-configured';
  if (input.permission === 'denied') return 'permission-denied';
  return 'supported';
}

/** `urlBase64ToUint8Array` : la clé VAPID est en base64url, `subscribe()` veut des octets. */
export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = typeof atob === 'function' ? atob(base64) : Buffer.from(base64, 'base64').toString('binary');
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export interface SubscribeDeps {
  registerServiceWorker(): Promise<ServiceWorkerRegistration>;
  permission(): Promise<NotificationPermission>;
}

/** Crée l'abonnement navigateur à partir de la clé VAPID publique. */
export async function createPushSubscription(
  publicKey: string,
  deps: SubscribeDeps,
): Promise<PushSubscriptionJSON | null> {
  const state = await deps.permission();
  if (state !== 'granted') return null;
  const registration = await deps.registerServiceWorker();
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
  return subscription.toJSON();
}
