import { describe, expect, it } from 'vitest';
import {
  MAX_PUSH_ATTEMPTS,
  classifyPushOutcome,
  deliverPendingPush,
  nextAttemptDelayMs,
  pushMessageFor,
  type PendingPushDelivery,
  type PushDeliveryDeps,
} from './web-push';

const target = (endpoint: string) => ({ endpoint, p256dh: 'p', auth: 'a' });

function makeDelivery(overrides: Partial<PendingPushDelivery> = {}): PendingPushDelivery {
  return {
    deliveryId: 'd1',
    targets: [target('https://push.example/1')],
    payload: { state: 'qr_verified', from: 'intent_created' },
    attemptCount: 0,
    ...overrides,
  };
}

function harness(pending: PendingPushDelivery[], send: PushDeliveryDeps['send']) {
  const calls = { delivered: [] as string[], retried: [] as Array<{ id: string; attempt: number }>, exhausted: [] as Array<{ id: string; err: string }>, revoked: [] as string[] };
  const deps: PushDeliveryDeps = {
    listPending: async () => pending,
    send,
    markDelivered: async (id) => { calls.delivered.push(id); },
    markRetry: async (id, attempt) => { calls.retried.push({ id, attempt }); },
    markExhausted: async (id, err) => { calls.exhausted.push({ id, err }); },
    revokeEndpoints: async (endpoints) => { calls.revoked.push(...endpoints); },
  };
  return { deps, calls };
}

describe('Web Push — sort d’une livraison', () => {
  it('classe 2xx / 410 / 429 / 400 honnêtement', () => {
    expect(classifyPushOutcome(201)).toBe('delivered');
    expect(classifyPushOutcome(404)).toBe('revoke');
    expect(classifyPushOutcome(410)).toBe('revoke');
    expect(classifyPushOutcome(429)).toBe('retry');
    expect(classifyPushOutcome(503)).toBe('retry');
    expect(classifyPushOutcome(401)).toBe('exhausted');
    expect(classifyPushOutcome(undefined)).toBe('retry'); // réseau : on réessaie
  });

  it('le recul est exponentiel et borné', () => {
    expect(nextAttemptDelayMs(1)).toBe(60_000);
    expect(nextAttemptDelayMs(2)).toBe(120_000);
    expect(nextAttemptDelayMs(20)).toBe(30 * 60_000);
  });

  it('le message nomme l’étape réelle, jamais un texte inventé', () => {
    const m = pushMessageFor({ state: 'payment_declared' });
    expect(m.body).toMatch(/paiement/i);
    expect(pushMessageFor({ state: 'inconnu' }).body).toMatch(/étape/i);
    expect(pushMessageFor({}).title).toBe('Omni');
  });

  it('le tap ouvre l’Inbox, jamais un rechargement nu', () => {
    expect(pushMessageFor({ state: 'fulfilled' }).url).toBe('/?notifs=1');
  });
});

describe('Web Push — dépilage de la file', () => {
  it('livre sur 2xx et sort la livraison de la file', async () => {
    const { deps, calls } = harness([makeDelivery()], async () => ({ ok: true, statusCode: 201 }));
    const summary = await deliverPendingPush(deps);
    expect(summary.delivered).toBe(1);
    expect(calls.delivered).toEqual(['d1']);
  });

  it('révoque un endpoint mort et retire la livraison de la file', async () => {
    const { deps, calls } = harness([makeDelivery()], async () => ({ ok: false, statusCode: 410 }));
    const summary = await deliverPendingPush(deps);
    expect(summary.revoked).toBe(1);
    expect(calls.revoked).toEqual(['https://push.example/1']);
    expect(calls.exhausted.map((e) => e.id)).toEqual(['d1']); // ne reste pas à réessayer
    expect(calls.retried).toEqual([]);
  });

  it('réessaie un 5xx avec un recul, sans livrer', async () => {
    const { deps, calls } = harness([makeDelivery({ attemptCount: 0 })], async () => ({ ok: false, statusCode: 503 }));
    const summary = await deliverPendingPush(deps);
    expect(summary.retried).toBe(1);
    expect(calls.retried).toEqual([{ id: 'd1', attempt: 1 }]);
    expect(calls.delivered).toEqual([]);
  });

  it('abandonne après le nombre maximal de tentatives', async () => {
    const { deps, calls } = harness([makeDelivery({ attemptCount: MAX_PUSH_ATTEMPTS - 1 })], async () => ({ ok: false, statusCode: 500 }));
    const summary = await deliverPendingPush(deps);
    expect(summary.exhausted).toBe(1);
    expect(calls.retried).toEqual([]);
  });

  it('un échec permanent (401) n’insiste pas', async () => {
    const { deps, calls } = harness([makeDelivery()], async () => ({ ok: false, statusCode: 401 }));
    const summary = await deliverPendingPush(deps);
    expect(summary.exhausted).toBe(1);
    expect(calls.retried).toEqual([]);
  });

  it('un compte à plusieurs appareils : un seul vivant suffit, le mort est révoqué', async () => {
    const delivery = makeDelivery({ targets: [target('https://push.example/dead'), target('https://push.example/live')] });
    const { deps, calls } = harness([delivery], async (t) => t.endpoint.endsWith('live') ? { ok: true, statusCode: 200 } : { ok: false, statusCode: 410 });
    const summary = await deliverPendingPush(deps);
    expect(summary.delivered).toBe(1);
    expect(calls.revoked).toEqual(['https://push.example/dead']);
  });

  it('un envoi qui jette une exception est traité comme un échec réseau (réessai)', async () => {
    const { deps, calls } = harness([makeDelivery()], async () => { throw new Error('socket'); });
    const summary = await deliverPendingPush(deps);
    expect(summary.retried).toBe(1);
    expect(calls.retried[0].id).toBe('d1');
  });
});
