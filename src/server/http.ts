import type { IncomingMessage, ServerResponse } from 'node:http';
import { getAuthUserId } from './auth-context';
import { AvailabilityPolicyError, AvailabilityResponsePolicyError, createTrunkRepository, ExternalPaymentMethod, PurchaseIntentPolicyError, SellerAuthorizationPolicyError, TransactionPolicyError } from './trunk-repository';
import { EvidenceStoragePolicyError, FieldPilotPolicyError, hasPrivateBlobConfiguration } from './evidence-contract';
import { ClaimEvidenceNotFoundError, handleClaimEvidenceUpload, readPrivateEvidence } from './evidence-storage';
import type { TransactionState } from '../domain/contracts';
import type { ClaimEvidenceItem } from '../trunk/types';

const json = (res: ServerResponse, status: number, body: unknown) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
};

const errorBody = (correlationId: string, code: string, message: string, retryable = false) => ({
  ok: false,
  correlationId,
  error: { code, message, retryable },
});

export class ApiInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiInputError';
  }
}

export function toApiErrorResponse(correlationId: string, error: unknown) {
  if (error instanceof ApiInputError) {
    return { status: 400, body: errorBody(correlationId, 'INVALID_INPUT', error.message) };
  }
  if (error instanceof EvidenceStoragePolicyError) {
    return { status: 409, body: errorBody(correlationId, 'EVIDENCE_STORAGE_UNAVAILABLE', error.message) };
  }
  if (error instanceof ClaimEvidenceNotFoundError) {
    return { status: 404, body: errorBody(correlationId, 'EVIDENCE_NOT_FOUND', error.message) };
  }
  if (error instanceof AvailabilityPolicyError || error instanceof AvailabilityResponsePolicyError || error instanceof PurchaseIntentPolicyError || error instanceof SellerAuthorizationPolicyError || error instanceof TransactionPolicyError || error instanceof FieldPilotPolicyError) {
    return { status: 409, body: errorBody(correlationId, 'POLICY_REJECTED', error.message) };
  }
  return {
    status: 500,
    body: errorBody(correlationId, 'INTERNAL_RECOVERABLE', 'The service is temporarily unavailable. Please try again.', true),
  };
}

export async function parseRequestBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  if (!chunks.length) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } catch {
    throw new ApiInputError('Request body must be valid JSON.');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new ApiInputError('Request body must be an object.');
  return parsed as Record<string, unknown>;
}

const TRANSACTION_STATES: readonly TransactionState[] = [
  'intent_created',
  'qr_ready',
  'qr_verified',
  'payment_declared',
  'payment_confirmed',
  'fulfilment_pending',
  'fulfilled',
  'received',
  'rated',
  'closed',
];

export const isTransactionState = (value: unknown): value is TransactionState =>
  typeof value === 'string' && TRANSACTION_STATES.includes(value as TransactionState);

function numberParam(url: URL, key: string, fallback: number): number {
  const value = Number(url.searchParams.get(key));
  return Number.isFinite(value) ? value : fallback;
}

export async function handleApi(req: IncomingMessage, res: ServerResponse, pathname: string, url: URL) {
  const correlationId = crypto.randomUUID();
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Idempotency-Key');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.end();
    return true;
  }
  if (!pathname.startsWith('/api/v2/')) return false;
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN ?? '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Idempotency-Key');

  try {
    const repository = createTrunkRepository();
    if (req.method === 'POST' && pathname === '/api/v2/public/facilities' && url.searchParams.get('action') === 'operator-import-batch') {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Sign in as an authorized Omni operator before importing public facilities.'));
        return true;
      }
      const input = await parseRequestBody(req);
      const provider = input.provider === 'openstreetmap' ? 'openstreetmap' : '';
      const attribution = typeof input.attribution === 'string' ? input.attribution.trim() : '';
      const items = Array.isArray(input.items) ? input.items : [];
      if (provider !== 'openstreetmap' || !attribution || items.length === 0 || items.length > 100) {
        json(res, 400, errorBody(correlationId, 'INVALID_INPUT', 'Provide OpenStreetMap attribution and between 1 and 100 bounded facilities.'));
        return true;
      }
      const normalized = items.map((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) throw new ApiInputError('Each batch facility must be an object.');
        const value = item as Record<string, unknown>;
        const sourceRef = typeof value.sourceRef === 'string' ? value.sourceRef.trim() : '';
        const name = typeof value.name === 'string' ? value.name.trim() : '';
        const category = value.category === null || value.category === undefined ? null : String(value.category).trim() || null;
        const address = value.address === null || value.address === undefined ? null : String(value.address).trim() || null;
        const latitude = Number(value.latitude);
        const longitude = Number(value.longitude);
        if (!sourceRef || !name || !Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180 || sourceRef.length > 180 || name.length > 180) {
          throw new ApiInputError('Each batch facility needs a bounded source reference, name and valid coordinates.');
        }
        return { sourceRef, name, category, address, latitude, longitude };
      });
      const results = [];
      for (const item of normalized) {
        results.push(await repository.createPublicFacilityImport({ authUserId, provider, attribution, ...item, correlationId }));
      }
      json(res, 200, { ok: true, correlationId, data: { imported: results.length, created: results.filter((result) => result.created).length, existing: results.filter((result) => !result.created).length, results } });
      return true;
    }
    if (req.method === 'POST' && pathname === '/api/v2/public/facilities' && url.searchParams.get('action') === 'operator-import') {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Sign in as an authorized Omni operator before importing a public facility.'));
        return true;
      }
      const input = await parseRequestBody(req);
      const provider = input.provider === 'openstreetmap' ? 'openstreetmap' : '';
      const sourceRef = typeof input.sourceRef === 'string' ? input.sourceRef.trim() : '';
      const name = typeof input.name === 'string' ? input.name.trim() : '';
      const category = input.category === null || input.category === undefined ? null : String(input.category).trim() || null;
      const address = input.address === null || input.address === undefined ? null : String(input.address).trim() || null;
      const latitude = Number(input.latitude);
      const longitude = Number(input.longitude);
      const attribution = typeof input.attribution === 'string' ? input.attribution.trim() : '';
      if (provider !== 'openstreetmap' || !sourceRef || !name || !attribution || !Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180 || sourceRef.length > 180 || name.length > 180) {
        json(res, 400, errorBody(correlationId, 'INVALID_INPUT', 'Provide a bounded OpenStreetMap source, facility name, attribution and valid coordinates.'));
        return true;
      }
      const result = await repository.createPublicFacilityImport({ authUserId, provider, attribution, sourceRef, name, category, latitude, longitude, address, correlationId });
      json(res, result.created ? 201 : 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === 'POST' && pathname === '/api/v2/notifications/push' && url.searchParams.get('action') === 'subscribe') {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Sign in before enabling device notifications.'));
        return true;
      }
      const input = await parseRequestBody(req);
      const endpoint = typeof input.endpoint === 'string' ? input.endpoint.trim() : '';
      const keys = input.keys && typeof input.keys === 'object' && !Array.isArray(input.keys) ? input.keys as Record<string, unknown> : {};
      const p256dh = typeof keys.p256dh === 'string' ? keys.p256dh.trim() : '';
      const auth = typeof keys.auth === 'string' ? keys.auth.trim() : '';
      const userAgent = typeof input.userAgent === 'string' ? input.userAgent.trim() || null : null;
      if (!endpoint || !p256dh || !auth || endpoint.length > 2048 || userAgent && userAgent.length > 512) {
        json(res, 400, errorBody(correlationId, 'INVALID_INPUT', 'Provide a valid browser Push subscription.'));
        return true;
      }
      const result = await repository.upsertWebPushSubscription({ authUserId, endpoint, p256dh, auth, userAgent });
      json(res, result.created ? 201 : 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === 'POST' && pathname === '/api/v2/notifications/push' && url.searchParams.get('action') === 'revoke') {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Sign in before changing device notifications.'));
        return true;
      }
      const input = await parseRequestBody(req);
      const endpoint = typeof input.endpoint === 'string' ? input.endpoint.trim() : '';
      if (!endpoint) {
        json(res, 400, errorBody(correlationId, 'INVALID_INPUT', 'Provide the subscription endpoint to revoke.'));
        return true;
      }
      const result = await repository.revokeWebPushSubscription({ authUserId, endpoint });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === 'GET' && pathname === '/api/v2/notifications/push' && url.searchParams.get('status') === '1') {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Sign in before reading device notification status.'));
        return true;
      }
      const result = await repository.listWebPushSubscriptionStatus({ authUserId });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === 'GET' && pathname === '/api/v2/public/facilities' && url.searchParams.get('operator') === 'runs') {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Sign in as an authorized Omni operator to view field runs.'));
        return true;
      }
      const result = await repository.listOperatorRuns({ authUserId });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === 'GET' && pathname === '/api/v2/public/facilities' && url.searchParams.get('reviewer') === 'queue') {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Sign in as an authorized Omni reviewer to view the review queue.'));
        return true;
      }
      const result = await repository.listReviewQueue({ authUserId });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === 'GET' && pathname === '/api/v2/public/facilities' && url.searchParams.get('inbox') === '1') {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Sign in to view your Omni inbox.'));
        return true;
      }
      const result = await repository.listNotificationInbox({ authUserId });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === 'POST' && pathname.startsWith('/api/v2/facilities/') && url.searchParams.get('action') === 'claim') {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Create or open your Omni account before starting a facility claim.'));
        return true;
      }
      const facilityId = pathname.slice('/api/v2/facilities/'.length);
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(facilityId)) {
        json(res, 400, errorBody(correlationId, 'INVALID_INPUT', 'Choose a valid facility.'));
        return true;
      }
      const result = await repository.createClaimDraft({ authUserId, facilityId });
      json(res, result.created ? 201 : 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === 'GET' && pathname.startsWith('/api/v2/facilities/') && url.searchParams.get('action') === 'claim-storage-status') {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Sign in before checking private claim storage.'));
        return true;
      }
      const facilityId = pathname.slice('/api/v2/facilities/'.length);
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(facilityId)) {
        json(res, 400, errorBody(correlationId, 'INVALID_INPUT', 'Choose a valid facility.'));
        return true;
      }
      json(res, 200, { ok: true, correlationId, data: { available: hasPrivateBlobConfiguration() } });
      return true;
    }
    if (req.method === 'POST' && pathname.startsWith('/api/v2/facilities/') && url.searchParams.get('action') === 'claim-upload') {
      const requestId = pathname.slice('/api/v2/facilities/'.length);
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(requestId)) {
        json(res, 400, errorBody(correlationId, 'INVALID_INPUT', 'Choose a valid claim request.'));
        return true;
      }
      const body = await parseRequestBody(req);
      const result = await handleClaimEvidenceUpload({ body, headers: req.headers, url: url.toString(), requestId });
      // Vercel Blob client protocol requires `clientToken` at the top level. This provider callback is the deliberate exception to Omni's generic API envelope; errors still leave through the shared redacted boundary.
      json(res, 200, result);
      return true;
    }
    if (req.method === 'GET' && pathname.startsWith('/api/v2/facilities/') && url.searchParams.get('action') === 'claim-evidence') {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Sign in before reading private claim evidence.'));
        return true;
      }
      const facilityId = pathname.slice('/api/v2/facilities/'.length);
      const requestId = url.searchParams.get('requestId') ?? '';
      const index = Number(url.searchParams.get('index') ?? '0');
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(facilityId) || !uuidPattern.test(requestId) || !Number.isInteger(index) || index < 0 || index >= 12) {
        json(res, 400, errorBody(correlationId, 'INVALID_INPUT', 'Choose a valid claim evidence reference.'));
        return true;
      }
      const evidence = await repository.getClaimEvidenceForViewer({ authUserId, facilityId, requestId, index });
      if (!evidence) {
        json(res, 404, errorBody(correlationId, 'EVIDENCE_NOT_FOUND', 'The private evidence is unavailable to this account.'));
        return true;
      }
      const result = await readPrivateEvidence(evidence.objectKey);
      res.statusCode = 200;
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Length', String(result.size));
      res.setHeader('Cache-Control', 'private, no-store');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.end(result.body);
      return true;
    }
    if (req.method === 'POST' && pathname.startsWith('/api/v2/facilities/') && url.searchParams.get('action') === 'claim-submit') {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Sign in before submitting private claim evidence.'));
        return true;
      }
      const requestId = pathname.slice('/api/v2/facilities/'.length);
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const input = await parseRequestBody(req);
      const version = Number(input.version);
      const rawEvidence = Array.isArray(input.evidence) ? input.evidence : [];
      const allowedKinds = new Set(['identity', 'company', 'facility', 'product', 'service', 'location']);
      const evidence = rawEvidence.map((item) => {
        const value = item && typeof item === 'object' ? item as Record<string, unknown> : {};
        return { evidenceKind: (typeof value.evidenceKind === 'string' ? value.evidenceKind : '') as ClaimEvidenceItem['evidenceKind'], objectKey: typeof value.objectKey === 'string' ? value.objectKey : '', checksum: value.checksum === null || value.checksum === undefined ? null : String(value.checksum) };
      });
      if (!uuidPattern.test(requestId) || !Number.isInteger(version) || version < 1 || evidence.length < 1 || evidence.length > 12 || evidence.some((item) => !allowedKinds.has(item.evidenceKind) || !/^private:\/\/omni\//.test(item.objectKey) || item.objectKey.length > 512 || /(?:https?:|data:|\s)/i.test(item.objectKey) || (item.checksum !== null && item.checksum.length > 128))) {
        json(res, 400, errorBody(correlationId, 'INVALID_INPUT', 'Provide a valid claim version and typed private evidence references.'));
        return true;
      }
      const result = await repository.submitClaimEvidence({ authUserId, requestId, version, evidence, correlationId });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === 'POST' && pathname.startsWith('/api/v2/facilities/') && url.searchParams.get('action') === 'claim-cancel') {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Sign in before cancelling your claim draft.'));
        return true;
      }
      const requestId = pathname.slice('/api/v2/facilities/'.length);
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const input = await parseRequestBody(req);
      const version = Number(input.version);
      if (!uuidPattern.test(requestId) || !Number.isInteger(version) || version < 1) {
        json(res, 400, errorBody(correlationId, 'INVALID_INPUT', 'Provide a valid claim and version.'));
        return true;
      }
      const result = await repository.cancelClaim({ authUserId, requestId, version, correlationId });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === 'POST' && pathname.startsWith('/api/v2/facilities/') && url.searchParams.get('action') === 'review') {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Sign in as an authorized Omni reviewer before reviewing a claim.'));
        return true;
      }
      const requestId = pathname.slice('/api/v2/facilities/'.length);
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const input = await parseRequestBody(req);
      const outcome = input.outcome === 'certified' || input.outcome === 'rejected' || input.outcome === 'needs_more_evidence' ? input.outcome : '';
      const reason = typeof input.reason === 'string' ? input.reason.trim() : '';
      if (!uuidPattern.test(requestId) || !outcome || reason.length < 3 || reason.length > 1000) {
        json(res, 400, errorBody(correlationId, 'INVALID_INPUT', 'Provide a valid claim, review outcome and bounded reason.'));
        return true;
      }
      const result = await repository.reviewFacilityClaim({ authUserId, requestId, outcome, reason, correlationId });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === 'GET' && pathname === '/api/v2/public/facilities' && url.searchParams.get('reviewer') === 'seller-activations') {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Sign in as an authorized reviewer to view seller activation candidates.'));
        return true;
      }
      const result = await repository.listSellerActivationQueue({ authUserId });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === 'POST' && pathname.startsWith('/api/v2/facilities/') && url.searchParams.get('action') === 'reviewer-seller-suspension') {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Sign in as an authorized reviewer to change seller account status.'));
        return true;
      }
      const accountId = pathname.slice('/api/v2/facilities/'.length);
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const input = await parseRequestBody(req);
      const suspended = input.suspended === true || input.suspended === false ? input.suspended : null;
      const reason = typeof input.reason === 'string' ? input.reason.trim() : '';
      if (!uuidPattern.test(accountId) || suspended === null || reason.length < 3 || reason.length > 1000) {
        json(res, 400, errorBody(correlationId, 'INVALID_INPUT', 'Provide a valid account status and bounded reason.'));
        return true;
      }
      const result = await repository.setSellerAccountSuspension({ authUserId, accountId, suspended, reason, correlationId });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === 'POST' && pathname.startsWith('/api/v2/facilities/') && url.searchParams.get('action') === 'reviewer-seller-activation') {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Sign in as an authorized reviewer to activate a seller account.'));
        return true;
      }
      const accountId = pathname.slice('/api/v2/facilities/'.length);
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(accountId)) {
        json(res, 400, errorBody(correlationId, 'INVALID_INPUT', 'Provide a valid account identifier.'));
        return true;
      }
      const result = await repository.activateSellerAccount({ authUserId, accountId, correlationId });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === 'GET' && pathname === '/api/v2/admin/seller-activations') {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Sign in as an authorized reviewer to view seller activation candidates.'));
        return true;
      }
      const result = await repository.listSellerActivationQueue({ authUserId });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === 'POST' && pathname.startsWith('/api/v2/admin/seller-accounts/')) {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Sign in as an authorized reviewer to change seller account status.'));
        return true;
      }
      const accountId = pathname.slice('/api/v2/admin/seller-accounts/'.length);
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const input = await parseRequestBody(req);
      const suspended = input.suspended === true || input.suspended === false ? input.suspended : null;
      const reason = typeof input.reason === 'string' ? input.reason.trim() : '';
      if (!uuidPattern.test(accountId) || suspended === null || reason.length < 3 || reason.length > 1000) {
        json(res, 400, errorBody(correlationId, 'INVALID_INPUT', 'Provide a valid account status and bounded reason.'));
        return true;
      }
      const result = await repository.setSellerAccountSuspension({ authUserId, accountId, suspended, reason, correlationId });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === 'POST' && pathname.startsWith('/api/v2/admin/seller-activations/')) {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Sign in as an authorized reviewer to activate a seller account.'));
        return true;
      }
      const accountId = pathname.slice('/api/v2/admin/seller-activations/'.length);
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(accountId)) {
        json(res, 400, errorBody(correlationId, 'INVALID_INPUT', 'Provide a valid account identifier.'));
        return true;
      }
      const result = await repository.activateSellerAccount({ authUserId, accountId, correlationId });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === 'POST' && pathname.startsWith('/api/v2/facilities/') && url.searchParams.get('action') === 'notification-seen') {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Sign in to update your Omni inbox.'));
        return true;
      }
      const notificationId = pathname.slice('/api/v2/facilities/'.length);
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(notificationId)) {
        json(res, 400, errorBody(correlationId, 'INVALID_INPUT', 'Choose a valid notification.'));
        return true;
      }
      const result = await repository.markNotificationSeen({ authUserId, notificationId });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === 'GET' && pathname === '/api/v2/public/facilities') {
      const hasBounds = ['west', 'south', 'east', 'north'].every((key) => url.searchParams.has(key));
      const bounds = hasBounds
        ? [numberParam(url, 'west', -180), numberParam(url, 'south', -90), numberParam(url, 'east', 180), numberParam(url, 'north', 90)] as [number, number, number, number]
        : undefined;
      const category = url.searchParams.get('category')?.trim() || undefined;
      const facilities = await repository.listPublicFacilities(bounds, url.searchParams.get('q') ?? undefined, category);
      json(res, 200, { ok: true, correlationId, data: facilities });
      return true;
    }
    if (req.method === 'GET' && pathname.startsWith('/api/v2/facilities/')) {
      const id = pathname.slice('/api/v2/facilities/'.length);
      const facility = await repository.getFacilityDetail(id);
      if (!facility) json(res, 404, errorBody(correlationId, 'NOT_FOUND', 'Facility was not found.'));
      else json(res, 200, { ok: true, correlationId, data: facility });
      return true;
    }
    if (req.method === 'GET' && pathname === '/api/v2/transaction-transitions' && url.searchParams.get('action') === 'snapshot') {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Sign in to view this transaction.'));
        return true;
      }
      const transactionId = url.searchParams.get('transactionId')?.trim() ?? '';
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(transactionId)) {
        json(res, 400, errorBody(correlationId, 'INVALID_INPUT', 'Choose a valid transaction.'));
        return true;
      }
      const result = await repository.getTransaction({ authUserId, transactionId });
      if (!result) {
        json(res, 404, errorBody(correlationId, 'NOT_FOUND', 'The transaction was not found for this account.'));
        return true;
      }
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === 'GET' && pathname.startsWith('/api/v2/transactions/')) {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Sign in to view this transaction.'));
        return true;
      }
      const transactionId = pathname.slice('/api/v2/transactions/'.length);
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(transactionId)) {
        json(res, 400, errorBody(correlationId, 'INVALID_INPUT', 'Choose a valid transaction.'));
        return true;
      }
      const result = await repository.getTransaction({ authUserId, transactionId });
      if (!result) {
        json(res, 404, errorBody(correlationId, 'NOT_FOUND', 'The transaction was not found for this account.'));
        return true;
      }
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === 'POST' && pathname === '/api/v2/qr-verifications') {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Sign in before verifying a transaction QR code.'));
        return true;
      }
      const input = await parseRequestBody(req);
      const transactionId = typeof input.transactionId === 'string' ? input.transactionId : '';
      const tokenHash = typeof input.tokenHash === 'string' ? input.tokenHash : '';
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(transactionId) || tokenHash.length < 16 || tokenHash.length > 512) {
        json(res, 400, errorBody(correlationId, 'INVALID_INPUT', 'Choose a valid transaction and QR token.'));
        return true;
      }
      const result = await repository.verifyQrToken({
        authUserId,
        transactionId,
        tokenHash,
        now: new Date().toISOString(),
      });
      if (!result.accepted) {
        json(res, 409, errorBody(correlationId, 'CONFLICT', 'The QR code is invalid, expired or already verified.'));
        return true;
      }
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === 'POST' && pathname === '/api/v2/transaction-transitions') {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Sign in before changing a transaction state.'));
        return true;
      }
      const input = await parseRequestBody(req);
      const transactionId = typeof input.transactionId === 'string' ? input.transactionId : '';
      const from = input.from;
      const to = input.to;
      const actorRole = input.actorRole;
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(transactionId) || !isTransactionState(from) || !isTransactionState(to) || (actorRole !== 'buyer' && actorRole !== 'seller')) {
        json(res, 400, errorBody(correlationId, 'INVALID_INPUT', 'Choose a valid transaction, state transition and actor role.'));
        return true;
      }
      const result = await repository.transitionTransaction({
        authUserId,
        transactionId,
        from,
        to,
        actorRole,
        correlationId,
        now: new Date().toISOString(),
      });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === 'POST' && pathname === '/api/v2/transaction-ratings') {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Sign in before rating a transaction.'));
        return true;
      }
      const input = await parseRequestBody(req);
      const transactionId = typeof input.transactionId === 'string' ? input.transactionId : '';
      const score = typeof input.score === 'number' ? input.score : Number.NaN;
      const note = typeof input.note === 'string' ? input.note : '';
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(transactionId) || !Number.isInteger(score) || score < 1 || score > 5 || note.length > 500) {
        json(res, 400, errorBody(correlationId, 'INVALID_INPUT', 'Choose a valid transaction, a score from 1 to 5 and a note of 500 characters or fewer.'));
        return true;
      }
      const result = await repository.submitTransactionRating({
        authUserId,
        transactionId,
        score,
        note,
        correlationId,
        now: new Date().toISOString(),
      });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === 'POST' && pathname === '/api/v2/external-payment-confirmations') {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Sign in before confirming an external payment.'));
        return true;
      }
      const input = await parseRequestBody(req);
      const transactionId = typeof input.transactionId === 'string' ? input.transactionId : '';
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(transactionId)) {
        json(res, 400, errorBody(correlationId, 'INVALID_INPUT', 'Choose a valid transaction.'));
        return true;
      }
      const result = await repository.confirmExternalPayment({
        authUserId,
        transactionId,
        correlationId,
        now: new Date().toISOString(),
      });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === 'POST' && pathname === '/api/v2/external-payment-declarations') {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Sign in before declaring an external payment.'));
        return true;
      }
      const input = await parseRequestBody(req);
      const transactionId = typeof input.transactionId === 'string' ? input.transactionId : '';
      const method = input.method;
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(transactionId) || !['cash', 'mobile_money', 'pay_on_delivery'].includes(method as string)) {
        json(res, 400, errorBody(correlationId, 'INVALID_INPUT', 'Choose a valid transaction and supported external payment method.'));
        return true;
      }
      const result = await repository.declareExternalPayment({
        authUserId,
        transactionId,
        method: method as ExternalPaymentMethod,
        correlationId,
        now: new Date().toISOString(),
      });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === 'POST' && pathname === '/api/v2/seller/demo-rebind') {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Sign in before activating the bounded Seller demonstration.'));
        return true;
      }
      const result = await repository.rebindDemoSeller({ authUserId });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === 'GET' && pathname === '/api/v2/seller/availability-requests') {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Sign in as an authorized seller to view incoming requests.'));
        return true;
      }
      const result = await repository.getSellerAvailabilityQueue({ authUserId });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === 'GET' && pathname === '/api/v2/availability-responses') {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Sign in to view availability responses.'));
        return true;
      }
      const requestId = url.searchParams.get('requestId')?.trim() ?? '';
      if (!requestId) {
        const result = await repository.getBuyerAvailabilityRequests({ authUserId });
        json(res, 200, { ok: true, correlationId, data: result });
        return true;
      }
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(requestId)) {
        json(res, 400, errorBody(correlationId, 'INVALID_INPUT', 'Choose a valid availability request.'));
        return true;
      }
      const result = await repository.getAvailabilityResponses({ authUserId, requestId });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === 'POST' && pathname === '/api/v2/availability-responses') {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Sign in as an authorized seller before responding to availability.'));
        return true;
      }
      const input = await parseRequestBody(req);
      const requestId = typeof input.requestId === 'string' ? input.requestId : '';
      const facilityId = typeof input.facilityId === 'string' ? input.facilityId : '';
      const productId = typeof input.productId === 'string' ? input.productId : '';
      const status = input.status;
      const rawQuantity = input.quantityAvailable;
      const quantityAvailable = rawQuantity === null || rawQuantity === undefined ? null : Number(rawQuantity);
      const rawPrice = input.priceMinor;
      const priceMinor = rawPrice === null || rawPrice === undefined ? null : Number(rawPrice);
      const sellerMessage = input.sellerMessage === null || input.sellerMessage === undefined ? null : input.sellerMessage;
      const idempotencyKey = req.headers['idempotency-key'] ?? input.idempotencyKey;
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(requestId) || !uuidPattern.test(facilityId) || !uuidPattern.test(productId) || (status !== 'available' && status !== 'partial' && status !== 'unavailable')) {
        json(res, 400, errorBody(correlationId, 'INVALID_INPUT', 'Choose a valid request, facility, product and response status.'));
        return true;
      }
      if ((quantityAvailable !== null && !Number.isInteger(quantityAvailable)) || (priceMinor !== null && !Number.isInteger(priceMinor))) {
        json(res, 400, errorBody(correlationId, 'INVALID_INPUT', 'Quantity and price must be whole numbers when provided.'));
        return true;
      }
      if (sellerMessage !== null && typeof sellerMessage !== 'string') {
        json(res, 400, errorBody(correlationId, 'INVALID_INPUT', 'Seller message must be text.'));
        return true;
      }
      if (typeof idempotencyKey !== 'string' || idempotencyKey.length < 8) {
        json(res, 400, errorBody(correlationId, 'INVALID_INPUT', 'A stable idempotency key is required.'));
        return true;
      }
      const result = await repository.respondAvailability({
        authUserId,
        requestId,
        facilityId,
        productId,
        status,
        quantityAvailable,
        priceMinor,
        sellerMessage,
        idempotencyKey,
        correlationId,
      });
      json(res, 201, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === 'POST' && (pathname === '/api/v2/buyer-qr-issuances' || (pathname === '/api/v2/qr-issuances' && url.searchParams.get('actor') === 'buyer'))) {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Sign in as the Buyer before showing a transaction QR code.'));
        return true;
      }
      const input = await parseRequestBody(req);
      const transactionId = typeof input.transactionId === 'string' ? input.transactionId : '';
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(transactionId)) {
        json(res, 400, errorBody(correlationId, 'INVALID_INPUT', 'Choose a valid transaction.'));
        return true;
      }
      const result = await repository.issueBuyerQrToken({ authUserId, transactionId, correlationId });
      json(res, 201, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === 'POST' && pathname === '/api/v2/qr-issuances') {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Sign in as an authorized seller before showing a transaction QR code.'));
        return true;
      }
      const input = await parseRequestBody(req);
      const transactionId = typeof input.transactionId === 'string' ? input.transactionId : '';
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(transactionId)) {
        json(res, 400, errorBody(correlationId, 'INVALID_INPUT', 'Choose a valid transaction.'));
        return true;
      }
      const result = await repository.issueQrToken({ authUserId, transactionId, correlationId });
      json(res, 201, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === 'POST' && pathname === '/api/v2/purchase-intents') {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Sign in before choosing an offer.'));
        return true;
      }
      const input = await parseRequestBody(req);
      const responseId = typeof input.responseId === 'string' ? input.responseId : '';
      const idempotencyKey = req.headers['idempotency-key'] ?? input.idempotencyKey;
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(responseId)) {
        json(res, 400, errorBody(correlationId, 'INVALID_INPUT', 'Choose a valid availability response.'));
        return true;
      }
      if (typeof idempotencyKey !== 'string' || idempotencyKey.length < 8) {
        json(res, 400, errorBody(correlationId, 'INVALID_INPUT', 'A stable idempotency key is required.'));
        return true;
      }
      const result = await repository.createPurchaseIntent({ authUserId, responseId, idempotencyKey });
      json(res, 201, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === 'POST' && pathname === '/api/v2/availability') {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Create your account or sign in to verify availability.'));
        return true;
      }
      const input = await parseRequestBody(req);
      const productId = typeof input.productId === 'string' ? input.productId : '';
      const facilityId = typeof input.facilityId === 'string' ? input.facilityId : '';
      const quantity = Number(input.quantity);
      const budgetMode = input.budgetMode === 'maximum' ? 'maximum' : 'unlimited';
      const budgetMinor = input.budgetMinor === null || input.budgetMinor === undefined ? null : Number(input.budgetMinor);
      const idempotencyKey = req.headers['idempotency-key'] ?? input.idempotencyKey;
      if (!productId || !facilityId || !Number.isInteger(quantity) || quantity < 1 || (budgetMinor !== null && (!Number.isInteger(budgetMinor) || budgetMinor < 0))) {
        json(res, 400, errorBody(correlationId, 'INVALID_INPUT', 'Choose a product and a positive quantity.'));
        return true;
      }
      if (typeof idempotencyKey !== 'string' || idempotencyKey.length < 8) {
        json(res, 400, errorBody(correlationId, 'INVALID_INPUT', 'A stable idempotency key is required.'));
        return true;
      }
      const result = await repository.createAvailabilityRequest({ authUserId, productId, facilityId, quantity, budgetMode, budgetMinor, idempotencyKey });
      json(res, 201, { ok: true, correlationId, data: result });
      return true;
    }
    json(res, 404, errorBody(correlationId, 'NOT_FOUND', 'V2 API route was not found.'));
    return true;
  } catch (error) {
    const errorName = error instanceof Error ? error.name : typeof error;
    const errorRecord = typeof error === 'object' && error !== null ? error as Record<string, unknown> : null;
    const errorCode = String(errorRecord?.code ?? '').slice(0, 32) || undefined;
    const errorMessage = String(errorRecord?.message ?? '').replace(/[0-9a-f]{8,}/gi, '[redacted]').replace(/Bearer\s+\S+/gi, '[redacted]').slice(0, 180) || undefined;
    const errorFields = {
      detail: String(errorRecord?.detail ?? '').slice(0, 120) || undefined,
      hint: String(errorRecord?.hint ?? '').slice(0, 120) || undefined,
      position: String(errorRecord?.position ?? '').slice(0, 32) || undefined,
      table: String(errorRecord?.table ?? '').slice(0, 80) || undefined,
      column: String(errorRecord?.column ?? '').slice(0, 80) || undefined,
      constraint: String(errorRecord?.constraint ?? '').slice(0, 80) || undefined,
    };
    console.error('v2_api_error', { pathname, errorName, errorCode, errorMessage, ...errorFields });
    const failure = toApiErrorResponse(correlationId, error);
    json(res, failure.status, failure.body);
    return true;
  }
}
