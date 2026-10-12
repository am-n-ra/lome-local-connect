import { createServer } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  NeonWebhookError,
  hasOtpDeliveryConfiguration,
  parseNeonWebhookBody,
  readNeonWebhookHeaders,
  routeNeonWebhookEvent,
  signNeonWebhookForTest,
  verifyNeonWebhookSignature,
} from './neon-webhooks';

let jwksUrl = '';
const registry = new Map<string, Record<string, unknown>>();
let stopServer: (() => Promise<void>) | null = null;
let kidSeq = 0;

beforeAll(async () => {
  const server = createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ keys: Array.from(registry.values()) }));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const port = typeof address === 'object' && address !== null ? (address as { port: number }).port : 0;
  jwksUrl = `http://127.0.0.1:${port}/jwks.json`;
  stopServer = () => new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

afterAll(async () => {
  if (stopServer) await stopServer();
});

// Chaque signature vient d'une paire FRAÎCHE : la clé publique correspondante
// est enregistrée au JWKS servi. Sans ça, on vérifierait contre une autre clé
// (faux négatif systématique — attrapé en écrivant ce helper).
async function signedInput(rawBody: string, overrides?: { timestamp?: number; kid?: string; register?: boolean }) {
  kidSeq += 1;
  const kid = overrides?.kid ?? `test-key-${kidSeq}`;
  const { publicJwk, signature, timestamp } = await signNeonWebhookForTest(rawBody, { ...overrides, kid });
  if (overrides?.register !== false) registry.set(kid, { ...publicJwk, kid, use: 'sig', alg: 'EdDSA' });
  return {
    rawBody,
    headers: {
      signature,
      kid,
      timestamp: String(overrides?.timestamp ?? Number(timestamp)),
      eventType: 'send.otp',
      eventId: 'evt-test-1',
    },
    jwksUrl,
  };
}

describe('Neon webhook signature boundary (construction officielle)', () => {
  it('accepts a well-formed signature (double base64url + timestamp)', async () => {
    const rawBody = '{"event_type":"send.otp","event_data":{"otp_code":"123456"}}';
    await expect(verifyNeonWebhookSignature(await signedInput(rawBody))).resolves.toBeUndefined();
  });

  it('rejects a tampered body, a foreign key, a stale timestamp and bad headers', async () => {
    const rawBody = '{"event_type":"send.otp","event_data":{"otp_code":"123456"}}';
    const good = await signedInput(rawBody);
    await expect(verifyNeonWebhookSignature({
      ...good,
      rawBody: rawBody.replace('123456', '654321'),
    })).rejects.toBeInstanceOf(NeonWebhookError);
    const foreign = await signedInput(rawBody, { kid: 'foreign-key-never-registered', register: false });
    await expect(verifyNeonWebhookSignature(foreign)).rejects.toBeInstanceOf(NeonWebhookError);
    const stale = await signedInput(rawBody, { timestamp: Date.now() - 11 * 60 * 1000 });
    await expect(verifyNeonWebhookSignature(stale)).rejects.toBeInstanceOf(NeonWebhookError);
    await expect(verifyNeonWebhookSignature({ ...good, headers: { ...good.headers, signature: null } })).rejects.toBeInstanceOf(NeonWebhookError);
    await expect(verifyNeonWebhookSignature({ ...good, headers: { ...good.headers, signature: 'not-a-jws' } })).rejects.toBeInstanceOf(NeonWebhookError);
    await expect(verifyNeonWebhookSignature({ ...good, headers: { ...good.headers, kid: null } })).rejects.toBeInstanceOf(NeonWebhookError);
  });

  it('never leaks PII in verification errors', async () => {
    const rawBody = '{"event_type":"send.otp","event_data":{"otp_code":"123456"},"user":{"email":"someone@example.com"}}';
    const tampered = await signedInput(rawBody.replace('123456', '654321'));
    try {
      await verifyNeonWebhookSignature({ ...tampered, rawBody });
      expect.unreachable('must reject');
    } catch (error) {
      expect(error).toBeInstanceOf(NeonWebhookError);
      expect(String((error as Error).message)).not.toContain('123456');
      expect(String((error as Error).message)).not.toContain('someone@example.com');
    }
  });
});

describe('Neon webhook routing (fail-closed)', () => {
  it('parses a well-formed body and reads headers case-insensitively', () => {
    const event = parseNeonWebhookBody('{"event_id":"evt-1","event_type":"phone_number.verified","event_data":{},"user":{}}');
    expect(event).toEqual({ eventId: 'evt-1', eventType: 'phone_number.verified', eventData: {}, user: {} });
    expect(() => parseNeonWebhookBody('not-json')).toThrow(NeonWebhookError);
    expect(() => parseNeonWebhookBody('{"event_data":{}}')).toThrow(NeonWebhookError);
    const headers = readNeonWebhookHeaders({ 'x-neon-signature': 's', 'x-neon-timestamp': '123' });
    expect(headers.signature).toBe('s');
    expect(headers.timestamp).toBe('123');
    expect(headers.eventId).toBeNull();
  });

  it('refuses blocking delivery without a configured provider (never 200-fakes)', () => {
    expect(hasOtpDeliveryConfiguration()).toBe(false);
    for (const type of ['send.otp', 'send.magic_link']) {
      expect(() => routeNeonWebhookEvent({ eventId: 'evt-1', eventType: type, eventData: {}, user: {} })).toThrowError(
        expect.objectContaining({ code: 'DELIVERY_NOT_CONFIGURED' }),
      );
    }
  });

  it('refuses to gate signups from this endpoint (fail-closed)', () => {
    expect(() => routeNeonWebhookEvent({ eventId: 'evt-1', eventType: 'user.before_create', eventData: {}, user: {} })).toThrowError(
      expect.objectContaining({ code: 'SIGNUP_GATE_REFUSED' }),
    );
  });

  it('ignores non-blocking and unknown events with 200 and PII-free audit', () => {
    for (const type of ['phone_number.verified', 'user.created', 'carrier.pigeon']) {
      const result = routeNeonWebhookEvent({ eventId: 'evt-9', eventType: type, eventData: { phone_number: '+22890000000' }, user: { email: 'x@y.zz' } });
      expect(result.status).toBe(200);
      expect(result.audit).toEqual({ eventId: 'evt-9', eventType: type });
      expect(JSON.stringify(result)).not.toContain('+22890000000');
      expect(JSON.stringify(result)).not.toContain('x@y.zz');
    }
  });
});
