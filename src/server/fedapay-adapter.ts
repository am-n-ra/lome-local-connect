import { WebhookSignature } from 'fedapay';

export type FedaPayEnvironment = 'sandbox' | 'live';

export type FedaPayTransactionStatus = 'pending' | 'approved' | 'declined' | 'canceled';

export interface FedaPayCheckoutResult {
  transactionId: string;
  checkoutUrl: string;
  status: FedaPayTransactionStatus;
}

export interface FedaPayTransactionSnapshot {
  transactionId: string;
  status: FedaPayTransactionStatus;
  amountMinor: number;
  currency: string | null;
  omniRechargeId: string | null;
}

export class FedaPayConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FedaPayConfigurationError';
  }
}

export class FedaPayProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FedaPayProviderError';
  }
}

function environment(): FedaPayEnvironment {
  const value = (process.env.FEDAPAY_ENV ?? 'live').trim().toLowerCase();
  if (value !== 'sandbox' && value !== 'live') {
    throw new FedaPayConfigurationError('FEDAPAY_ENV must be sandbox or live.');
  }
  return value;
}

function secretKey(): string {
  const value = process.env.FEDAPAY_SECRET_KEY?.trim();
  if (!value) throw new FedaPayConfigurationError('FedaPay recharge is not configured.');
  return value;
}

function baseUrl(): string {
  return environment() === 'sandbox' ? 'https://sandbox-api.fedapay.com/v1' : 'https://api.fedapay.com/v1';
}

function normalizeStatus(value: unknown): FedaPayTransactionStatus {
  const status = String(value ?? '').toLowerCase();
  if (status === 'approved' || status === 'transferred') return 'approved';
  if (status === 'canceled' || status === 'cancelled' || status === 'expired') return 'canceled';
  if (status === 'declined' || status === 'failed') return 'declined';
  return 'pending';
}

async function requestProvider<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: `Bearer ${secretKey()}`,
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      throw new FedaPayProviderError('FedaPay returned an invalid response.');
    }
  }
  if (!response.ok) {
    throw new FedaPayProviderError('FedaPay rejected the recharge request.');
  }
  return payload as T;
}

function transactionPayload(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {};
  const root = payload as Record<string, unknown>;
  const nested = root['v1/transaction'];
  return nested && typeof nested === 'object' && !Array.isArray(nested)
    ? nested as Record<string, unknown>
    : root;
}

export function isFedaPayConfigured(): boolean {
  return Boolean(process.env.FEDAPAY_SECRET_KEY?.trim() && process.env.FEDAPAY_WEBHOOK_SECRET?.trim());
}

export async function createFedaPayCheckout(input: {
  rechargeId: string;
  amountMinor: number;
  currency: string;
  description: string;
  callbackUrl: string;
  customer: { email: string | null; firstName?: string | null; lastName?: string | null };
}): Promise<FedaPayCheckoutResult> {
  if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) {
    throw new FedaPayConfigurationError('Recharge amount must be a positive integer in minor units.');
  }
  if (input.currency.toUpperCase() !== 'XOF') {
    throw new FedaPayConfigurationError('FedaPay recharge currently supports XOF only.');
  }
  const created = await requestProvider<unknown>('/transactions', {
    method: 'POST',
    body: JSON.stringify({
      description: input.description.slice(0, 180),
      amount: input.amountMinor,
      currency: { iso: input.currency.toUpperCase() },
      callback_url: input.callbackUrl,
      custom_metadata: { omni_recharge_id: input.rechargeId },
      customer: {
        email: input.customer.email ?? undefined,
        firstname: input.customer.firstName ?? 'Omni',
        lastname: input.customer.lastName ?? 'User',
      },
    }),
  });
  const transaction = transactionPayload(created);
  const transactionId = String(transaction.id ?? transaction.reference ?? '');
  if (!transactionId) throw new FedaPayProviderError('FedaPay did not return a transaction identifier.');
  const token = await requestProvider<unknown>(`/transactions/${encodeURIComponent(transactionId)}/token`, {
    method: 'POST',
    body: '{}',
  });
  const tokenPayload = token && typeof token === 'object' && !Array.isArray(token) ? token as Record<string, unknown> : {};
  const checkoutUrl = String(tokenPayload.url ?? '');
  if (!checkoutUrl) throw new FedaPayProviderError('FedaPay did not return a checkout URL.');
  return { transactionId, checkoutUrl, status: normalizeStatus(transaction.status) };
}

export async function fetchFedaPayTransaction(transactionId: string): Promise<FedaPayTransactionSnapshot> {
  const payload = await requestProvider<unknown>(`/transactions/${encodeURIComponent(transactionId)}`, { method: 'GET' });
  const transaction = transactionPayload(payload);
  const currency = transaction.currency;
  const currencyIso = typeof currency === 'string' ? currency : currency && typeof currency === 'object' && !Array.isArray(currency) ? String((currency as Record<string, unknown>).iso ?? '') : null;
  const metadata = transaction.custom_metadata;
  const metadataObject = metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? metadata as Record<string, unknown> : {};
  return {
    transactionId,
    status: normalizeStatus(transaction.status),
    amountMinor: Number(transaction.amount ?? 0),
    currency: currencyIso ? currencyIso.toUpperCase() : null,
    omniRechargeId: metadataObject.omni_recharge_id ? String(metadataObject.omni_recharge_id) : metadataObject.deposit_id ? String(metadataObject.deposit_id) : null,
  };
}

export function verifyFedaPayWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.FEDAPAY_WEBHOOK_SECRET?.trim();
  if (!secret || !signature) return false;
  try {
    return WebhookSignature.verifyHeader(rawBody, signature, secret, 300);
  } catch {
    return false;
  }
}
