import { handleApi } from './http';

function requestUrl(req: any, fallbackPath: string) {
  const protocol = String(req.headers?.['x-forwarded-proto'] ?? 'https');
  const host = String(req.headers?.host ?? 'localhost');
  return new URL(String(req.url ?? fallbackPath), `${protocol}://${host}`);
}

export async function publicFacilitiesHandler(req: any, res: any) {
  const url = requestUrl(req, '/api/v2/public/facilities');
  await handleApi(req, res, '/api/v2/public/facilities', url);
}

export async function facilityDetailHandler(req: any, res: any) {
  const url = requestUrl(req, '/api/v2/facilities/');
  const id = typeof req.query?.id === 'string' ? req.query.id : '';
  await handleApi(req, res, `/api/v2/facilities/${id}`, url);
}

export async function availabilityHandler(req: any, res: any) {
  const url = requestUrl(req, '/api/v2/availability');
  await handleApi(req, res, '/api/v2/availability', url);
}

export async function purchaseIntentHandler(req: any, res: any) {
  const url = requestUrl(req, '/api/v2/purchase-intents');
  await handleApi(req, res, '/api/v2/purchase-intents', url);
}

export async function externalPaymentConfirmationHandler(req: any, res: any) {
  const url = requestUrl(req, '/api/v2/external-payment-confirmations');
  await handleApi(req, res, '/api/v2/external-payment-confirmations', url);
}
