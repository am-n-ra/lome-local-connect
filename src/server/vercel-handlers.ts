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

export async function adminSellerActivationsHandler(req: any, res: any) {
  const url = requestUrl(req, '/api/v2/admin/seller-activations');
  await handleApi(req, res, '/api/v2/admin/seller-activations', url);
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

export async function externalPaymentDeclarationHandler(req: any, res: any) {
  const url = requestUrl(req, '/api/v2/external-payment-declarations');
  await handleApi(req, res, '/api/v2/external-payment-declarations', url);
}

export async function qrVerificationHandler(req: any, res: any) {
  const url = requestUrl(req, '/api/v2/qr-verifications');
  await handleApi(req, res, '/api/v2/qr-verifications', url);
}

export async function transactionMessagesHandler(req: any, res: any) {
  const url = requestUrl(req, '/api/v2/transaction-messages');
  await handleApi(req, res, '/api/v2/transaction-messages', url);
}

export async function transactionTransitionHandler(req: any, res: any) {
  const url = requestUrl(req, '/api/v2/transaction-transitions');
  await handleApi(req, res, '/api/v2/transaction-transitions', url);
}

export async function availabilityResponseHandler(req: any, res: any) {
  const url = requestUrl(req, '/api/v2/availability-responses');
  await handleApi(req, res, '/api/v2/availability-responses', url);
}

export async function availabilityRequestsHandler(req: any, res: any) {
  const url = requestUrl(req, '/api/v2/availability-requests');
  await handleApi(req, res, '/api/v2/availability-requests', url);
}

export async function sellerAvailabilityRequestsHandler(req: any, res: any) {
  const url = requestUrl(req, '/api/v2/seller/availability-requests');
  await handleApi(req, res, '/api/v2/seller/availability-requests', url);
}

export async function sellerCatalogueHandler(req: any, res: any) {
  const url = requestUrl(req, '/api/v2/seller/catalogue');
  const action = url.searchParams.get('omni_action');
  const demoRebind = action === 'demo-rebind';
  const walletOverview = action === 'wallet';
  const walletRecharge = action === 'wallet-recharge';
  const walletPro = action === 'wallet-pro';
  const fedapayWebhook = action === 'fedapay-webhook';
  const productId = typeof req.query?.id === 'string' ? req.query.id : url.searchParams.get('id');
  const pathname = demoRebind
    ? '/api/v2/seller/demo-rebind'
    : walletOverview
      ? '/api/v2/wallet'
      : walletRecharge
        ? '/api/v2/wallet/recharges'
        : walletPro
          ? '/api/v2/wallet/pro'
        : fedapayWebhook
          ? '/api/v2/fedapay/webhook'
    : productId
      ? `/api/v2/seller/catalogue/${productId}`
      : '/api/v2/seller/catalogue';
  await handleApi(req, res, pathname, url);
}

export async function qrIssuanceHandler(req: any, res: any) {
  const url = requestUrl(req, '/api/v2/qr-issuances');
  await handleApi(req, res, '/api/v2/qr-issuances', url);
}
