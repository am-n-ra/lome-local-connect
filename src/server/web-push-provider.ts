// Binding VAPID + envoi réel, isolé pour que `web-push.ts` reste pur et testable.
// Le paquet `web-push` est la seule dépendance ajoutée ; elle ne coûte rien à l'usage
// (les services de push des navigateurs ne facturent pas l'envoi).
import webpush from 'web-push';
import type { PushSendResult, PushSubscriptionTarget } from './web-push';

export interface VapidConfig {
  publicKey: string;
  privateKey: string;
  subject: string;
}

/**
 * La configuration VAPID, ou `null` si elle n'est pas posée. Aucun secret n'est
 * jamais exposé au client : seule `publicKey` l'est (par une route dédiée).
 */
export function vapidConfig(env: NodeJS.ProcessEnv = process.env): VapidConfig | null {
  const publicKey = env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = env.VAPID_PRIVATE_KEY?.trim();
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject: env.VAPID_SUBJECT?.trim() || 'mailto:hello@omni.tg' };
}

export function isWebPushConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return vapidConfig(env) !== null;
}

/** Envoie un message à un abonnement. Le statut HTTP décide du sort (voir `classifyPushOutcome`). */
export async function sendWebPush(
  config: VapidConfig,
  target: PushSubscriptionTarget,
  payload: string,
): Promise<PushSendResult> {
  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  try {
    const response = await webpush.sendNotification(
      { endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } },
      payload,
      { TTL: 60 * 60 * 24 },
    );
    return { ok: true, statusCode: response.statusCode };
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode;
    return { ok: false, statusCode, errorClass: error instanceof Error ? error.name : 'WebPushError' };
  }
}
