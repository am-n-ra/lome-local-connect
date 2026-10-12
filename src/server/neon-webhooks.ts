import { generateKeyPair } from 'jose';
import type { IncomingHttpHeaders } from 'node:http';

/**
 * Neon Auth webhooks (Managed Better Auth) — réception côté Omni.
 *
 * Faits docs (neon.com/docs/auth/guides/webhooks, 2026-10) :
 * - `send.otp` / `send.magic_link` / `user.before_create` sont BLOQUANTS : Neon
 *   attend notre réponse. Souscrire `send.otp` DÉSACTIVE l'envoi intégré de Neon :
 *   SANS handler qui livvre, l'utilisateur ne reçoit JAMAIS son code (ni email,
 *   ni SMS — Neon ne fait pas le SMS lui-même, le plugin Phone exige le webhook).
 * - Signature EdDSA (Ed25519), JWS détaché (`header..signature`), headers
 *   `X-Neon-Signature` (+Kid, Timestamp, Event-Type, Event-Id, Delivery-Attempt).
 * - `phone_number.verified` / `user.created` sont non-bloquants (informatifs).
 *
 * Règles d'honnêteté de ce module (testées) :
 * - AUCUNE donnée personnelle (code OTP, email, téléphone, token, lien) ne sort
 *   jamais dans une erreur, un log ou un audit. Les erreurs portent des codes.
 * - Échec fermé (fail-closed) : signature invalide / horodatage périmé / événement
 *   bloquant inconnu ou non livrable → erreur explicite, jamais un succès muet.
 * - Sans fournisseur d'envoi configuré, `send.otp`/`send.magic_link` répondent
 *   DELIVERY_NOT_CONFIGURED (HTTP 500 → Neon retente puis échoue visiblement).
 *   Ne JAMAIS répondre 200 en faisant semblant de livrer : l'utilisateur
 *   attendrait un code qui n'arrive pas.
 */

export class NeonWebhookError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'NeonWebhookError';
    this.code = code;
  }
}

export interface NeonWebhookHeaders {
  signature: string | null;
  kid: string | null;
  timestamp: string | null;
  eventType: string | null;
  eventId: string | null;
}

export function readNeonWebhookHeaders(headers: IncomingHttpHeaders): NeonWebhookHeaders {
  const first = (value: string | string[] | undefined): string | null =>
    typeof value === 'string' ? value : Array.isArray(value) && typeof value[0] === 'string' ? value[0] : null;
  return {
    signature: first(headers['x-neon-signature']),
    kid: first(headers['x-neon-signature-kid']),
    timestamp: first(headers['x-neon-timestamp']),
    eventType: first(headers['x-neon-event-type']),
    eventId: first(headers['x-neon-event-id']),
  };
}

const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000;
const DEFAULT_NEON_AUTH_JWKS_URL = 'https://ep-purple-fog-amwsyc3j.neonauth.c-5.us-east-1.aws.neon.tech/neondb/auth/.well-known/jwks.json';

/**
 * Vérifie la signature EXACTEMENT comme le helper officiel Neon
 * (neon.com/guides/neon-auth-webhooks-nextjs, `verifyNeonWebhook`) :
 * signing-input = headerB64 + "." + b64u(timestamp + "." + b64u(corps brut))
 * — double encodage base64url AVEC l'horodatage dedans. Toute approximation
 * (corps re-sérialisé, simple encodage, timestamp omis) échoue : prouvé par
 * falsification (3 constructions rejetées avant celle-ci).
 * Clés lues FRAÎCHES à chaque appel (pas de cache) : rotation-safe, volume
 * webhook faible. Fenêtre unilatérale 5 min comme l'officiel (trop vieux
 * rejeté ; futur accepté — même règle, documentée).
 */
export async function verifyNeonWebhookSignature(input: {
  rawBody: string;
  headers: NeonWebhookHeaders;
  jwksUrl?: string;
  now?: number;
}): Promise<void> {
  const { rawBody, headers } = input;
  if (!headers.signature || !headers.kid || !headers.timestamp) {
    throw new NeonWebhookError('SIGNATURE_REQUIRED', 'Neon webhook signature headers are required.');
  }
  const jwksUrl = (input.jwksUrl ?? (process.env.NEON_AUTH_WEBHOOK_JWKS_URL ?? '').trim()) || DEFAULT_NEON_AUTH_JWKS_URL;
  let jwks: { keys?: Array<Record<string, unknown>> };
  try {
    const response = await fetch(jwksUrl, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`jwks ${response.status}`);
    jwks = (await response.json()) as { keys?: Array<Record<string, unknown>> };
  } catch {
    throw new NeonWebhookError('JWKS_UNAVAILABLE', 'Neon webhook signing keys are unavailable.');
  }
  const jwk = Array.isArray(jwks.keys) ? jwks.keys.find((key) => key.kid === headers.kid) : undefined;
  if (!jwk) throw new NeonWebhookError('KEY_UNKNOWN', 'Neon webhook signing key is unknown.');
  const [headerB64, emptyPayload, signatureB64] = headers.signature.split('.');
  if (!headerB64 || emptyPayload !== '' || !signatureB64) {
    throw new NeonWebhookError('SIGNATURE_MALFORMED', 'Neon webhook signature is malformed.');
  }
  const { default: crypto } = await import('node:crypto');
  let publicKey;
  try {
    publicKey = crypto.createPublicKey({ key: jwk as never, format: 'jwk' });
  } catch {
    throw new NeonWebhookError('KEY_INVALID', 'Neon webhook signing key is invalid.');
  }
  const payloadB64 = Buffer.from(rawBody, 'utf8').toString('base64url');
  const signaturePayloadB64 = Buffer.from(`${headers.timestamp}.${payloadB64}`, 'utf8').toString('base64url');
  const signingInput = Buffer.from(`${headerB64}.${signaturePayloadB64}`, 'utf8');
  let signatureBytes: Buffer;
  try {
    signatureBytes = Buffer.from(signatureB64, 'base64url');
  } catch {
    throw new NeonWebhookError('SIGNATURE_MALFORMED', 'Neon webhook signature is malformed.');
  }
  const valid = crypto.verify(null, signingInput, publicKey, signatureBytes);
  if (!valid) {
    // Message volontairement sans détail : ni clé, ni corps, ni horodatage.
    throw new NeonWebhookError('SIGNATURE_INVALID', 'Neon webhook signature is invalid.');
  }
  const ageMs = (input.now ?? Date.now()) - Number.parseInt(headers.timestamp, 10);
  if (!Number.isFinite(ageMs) || ageMs > TIMESTAMP_TOLERANCE_MS) {
    throw new NeonWebhookError('TIMESTAMP_STALE', 'Neon webhook timestamp is too old.');
  }
}

export interface NeonWebhookEvent {
  eventId: string | null;
  eventType: string;
  eventData: Record<string, unknown>;
  user: Record<string, unknown>;
}

export function parseNeonWebhookBody(rawBody: string): NeonWebhookEvent {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody) as unknown;
  } catch {
    throw new NeonWebhookError('BODY_INVALID', 'Neon webhook body must be valid JSON.');
  }
  if (!parsed || typeof parsed !== 'object') throw new NeonWebhookError('BODY_INVALID', 'Neon webhook body must be valid JSON.');
  const record = parsed as Record<string, unknown>;
  const eventType = typeof record.event_type === 'string' ? record.event_type : '';
  if (!eventType) throw new NeonWebhookError('EVENT_REQUIRED', 'Neon webhook event type is required.');
  const eventData = record.event_data && typeof record.event_data === 'object' ? (record.event_data as Record<string, unknown>) : {};
  const user = record.user && typeof record.user === 'object' ? (record.user as Record<string, unknown>) : {};
  return {
    eventId: typeof record.event_id === 'string' ? record.event_id : null,
    eventType,
    eventData,
    user,
  };
}

export function hasOtpDeliveryConfiguration(): boolean {
  const emailReady = ((process.env.OTP_EMAIL_API_KEY ?? '').trim() !== '' && (process.env.OTP_EMAIL_FROM ?? '').trim() !== '');
  const smsReady =
    (process.env.OTP_SMS_ACCOUNT_SID ?? '').trim() !== '' &&
    (process.env.OTP_SMS_AUTH_TOKEN ?? '').trim() !== '' &&
    (process.env.OTP_SMS_FROM_NUMBER ?? '').trim() !== '';
  return emailReady || smsReady;
}

export interface NeonRouteResult {
  status: 200 | 400 | 500;
  code: string;
  /** Résumé d'audit SANS PII : event_id + type uniquement. */
  audit: { eventId: string | null; eventType: string };
}

/**
 * Route un événement vérifié. Décisions :
 * - `send.otp` / `send.magic_link` (bloquants) : livrer si configuré, sinon
 *   DELIVERY_NOT_CONFIGURED (500). Jamais 200 sans livraison.
 * - `user.before_create` (bloquant, NON souscrit) : 500 explicite. Un 200
 *   approuverait silencieusement toutes les inscriptions — interdit.
 * - `phone_number.verified` / `user.created` (non-bloquants) : 200, ignoré.
 *   Aucune écriture : persister un téléphone/email exigerait une décision
 *   fondateur (données personnelles).
 * - Inconnu : 200, ignoré (sûr pour les non-bloquants ; les futurs bloquants
 *   inconnus se verront — voir registre).
 */
export function routeNeonWebhookEvent(event: NeonWebhookEvent): NeonRouteResult {
  const audit = { eventId: event.eventId, eventType: event.eventType };
  switch (event.eventType) {
    case 'send.otp':
    case 'send.magic_link':
      if (!hasOtpDeliveryConfiguration()) {
        throw new NeonWebhookError('DELIVERY_NOT_CONFIGURED', 'OTP delivery is not configured.');
      }
      // Point d'extension : l'envoi réel (Resend/Twilio) s'implémente ici quand
      // le fondateur fournit les clés. Pas d'envoi factice, jamais.
      throw new NeonWebhookError('DELIVERY_NOT_IMPLEMENTED', 'OTP delivery provider is not implemented.');
    case 'user.before_create':
      throw new NeonWebhookError('SIGNUP_GATE_REFUSED', 'Signup gating is not operated by this endpoint.');
    case 'phone_number.verified':
    case 'user.created':
      return { status: 200, code: 'IGNORED', audit };
    default:
      return { status: 200, code: 'IGNORED_UNKNOWN', audit };
  }
}

/** Utilitaire de test : génère une paire Ed25519 + signe un corps brut avec la
 * construction officielle Neon (double base64url + timestamp). */
export async function signNeonWebhookForTest(rawBody: string, options?: { kid?: string; timestamp?: number }): Promise<{ publicJwk: Record<string, unknown>; signature: string; timestamp: string }> {
  const kid = options?.kid ?? 'test-key';
  const timestamp = String(options?.timestamp ?? Date.now());
  const { publicKey, privateKey } = await generateKeyPair('EdDSA', { extractable: true });
  const { exportJWK } = await import('jose');
  const { default: crypto } = await import('node:crypto');
  const publicJwk = (await exportJWK(publicKey)) as Record<string, unknown>;
  const privateJwk = await exportJWK(privateKey);
  const header = Buffer.from(JSON.stringify({ alg: 'EdDSA', kid })).toString('base64url');
  const payloadB64 = Buffer.from(rawBody, 'utf8').toString('base64url');
  const signaturePayloadB64 = Buffer.from(`${timestamp}.${payloadB64}`, 'utf8').toString('base64url');
  const privateKeyObject = crypto.createPrivateKey({ key: privateJwk, format: 'jwk' });
  const signature = crypto.sign(null, Buffer.from(`${header}.${signaturePayloadB64}`, 'utf8'), privateKeyObject);
  return { publicJwk, signature: `${header}..${signature.toString('base64url')}`, timestamp };
}
