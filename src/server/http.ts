import type { IncomingMessage, ServerResponse } from 'node:http';
import { getAuthUserId } from './auth-context';
import { AvailabilityPolicyError, createTrunkRepository, PurchaseIntentPolicyError } from './trunk-repository';

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
  if (error instanceof AvailabilityPolicyError || error instanceof PurchaseIntentPolicyError) {
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
    const failure = toApiErrorResponse(correlationId, error);
    json(res, failure.status, failure.body);
    return true;
  }
}
