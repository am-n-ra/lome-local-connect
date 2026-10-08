import { describe, expect, it } from 'vitest';
import { createPushSubscription, pushSupportFor, urlBase64ToUint8Array } from './push-subscribe';

describe('Web Push — consentement navigateur', () => {
  it('sur iOS non installé, on guide d’abord : needs-install (jamais un bouton mort)', () => {
    expect(pushSupportFor({ hasServiceWorker: true, hasPushManager: true, isIos: true, isInstalled: false, permission: 'default', vapidConfigured: true })).toBe('needs-install');
  });

  it('sur iOS installé, le push est disponible', () => {
    expect(pushSupportFor({ hasServiceWorker: true, hasPushManager: true, isIos: true, isInstalled: true, permission: 'default', vapidConfigured: true })).toBe('supported');
  });

  it('sans clé VAPID configurée, on le dit au lieu de montrer un bouton inerte', () => {
    expect(pushSupportFor({ hasServiceWorker: true, hasPushManager: true, isIos: false, isInstalled: false, permission: 'default', vapidConfigured: false })).toBe('not-configured');
  });

  it('permission refusée : on n’insiste pas, on explique', () => {
    expect(pushSupportFor({ hasServiceWorker: true, hasPushManager: true, isIos: false, isInstalled: false, permission: 'denied', vapidConfigured: true })).toBe('permission-denied');
  });

  it('navigateur sans Push → unsupported (Inbox garde tout)', () => {
    expect(pushSupportFor({ hasServiceWorker: false, hasPushManager: false, isIos: false, isInstalled: false, permission: 'default', vapidConfigured: true })).toBe('unsupported');
    expect(pushSupportFor({ hasServiceWorker: true, hasPushManager: true, isIos: false, isInstalled: false, permission: 'unsupported', vapidConfigured: true })).toBe('unsupported');
  });

  it('la clé VAPID base64url devient les octets attendus', () => {
    // "AQAB" en base64url = [1, 0, 1]
    expect(Array.from(urlBase64ToUint8Array('AQAB'))).toEqual([1, 0, 1]);
  });

  it('pas d’abonnement sans permission accordée', async () => {
    let subscribed = false;
    const result = await createPushSubscription('AQAB', {
      permission: async () => 'denied',
      registerServiceWorker: async () => { subscribed = true; return {} as ServiceWorkerRegistration; },
    });
    expect(result).toBeNull();
    expect(subscribed).toBe(false);
  });

  it('avec permission accordée, on enregistre le SW et on s’abonne', async () => {
    const json = { endpoint: 'https://push.example/x', keys: { p256dh: 'p', auth: 'a' } };
    const result = await createPushSubscription('AQAB', {
      permission: async () => 'granted',
      registerServiceWorker: async () => ({
        pushManager: { subscribe: async () => ({ toJSON: () => json }) },
      } as unknown as ServiceWorkerRegistration),
    });
    expect(result).toEqual(json);
  });
});
