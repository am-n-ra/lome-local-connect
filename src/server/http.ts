import type { IncomingMessage, ServerResponse } from 'node:http';
import { getAuthUserId } from './auth-context';
import { AvailabilityPolicyError, AvailabilityResponsePolicyError, createTrunkRepository, ExternalPaymentMethod, PurchaseIntentPolicyError, SellerAuthorizationPolicyError, TransactionPolicyError } from './trunk-repository';
import type { TransactionState } from '../domain/contracts';

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
  if (error instanceof AvailabilityPolicyError || error instanceof AvailabilityResponsePolicyError || error instanceof PurchaseIntentPolicyError || error instanceof SellerAuthorizationPolicyError || error instanceof TransactionPolicyError) {
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
    if (req.method === 'POST' && pathname === '/api/v2/qr-verifications') {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Sign in before verifying a transaction QR code.'));
        return true;
      }
      const input = await parseRequestBody(req);
      const transactionId = typeof input.transactionId === 'string' ? input.transactionId : '';
      const tokenHash = typeof input.tokenHash === 'string' ? input.tokenHash : '';
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
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
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
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
    if (req.method === 'POST' && pathname === '/api/v2/external-payment-confirmations') {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Sign in before confirming an external payment.'));
        return true;
      }
      const input = await parseRequestBody(req);
      const transactionId = typeof input.transactionId === 'string' ? input.transactionId : '';
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
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
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
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
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
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
    if (req.method === 'POST' && pathname === '/api/v2/qr-issuances') {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, 'AUTH_REQUIRED', 'Sign in as an authorized seller before showing a transaction QR code.'));
        return true;
      }
      const input = await parseRequestBody(req);
      const transactionId = typeof input.transactionId === 'string' ? input.transactionId : '';
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
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
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
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
