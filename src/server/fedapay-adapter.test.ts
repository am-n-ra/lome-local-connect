import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createFedaPayCheckout, isFedaPayConfigured } from './fedapay-adapter';

const managedKeys = [
  'FEDAPAY_ENV',
  'FEDAPAY_SECRET_KEY',
  'FEDAPAY_WEBHOOK_SECRET',
  'FEDAPAY_SANDBOX_SECRET_KEY',
  'FEDAPAY_SANDBOX_WEBHOOK_SECRET',
] as const;

type ManagedKey = (typeof managedKeys)[number];

const originalValues = new Map<ManagedKey, string | undefined>();

function setManaged(values: Partial<Record<ManagedKey, string>>) {
  for (const key of managedKeys) {
    if (values[key] === undefined) delete process.env[key];
    else process.env[key] = values[key];
  }
}

function checkoutInput() {
  return {
    rechargeId: 'recharge-test-1',
    amountMinor: 10_000,
    currency: 'XOF',
    description: 'Omni Wallet test recharge',
    callbackUrl: 'https://omni.example/callback',
    customer: { email: 'demo@seller.omni' },
  };
}

describe('FedaPay environment separation', () => {
  beforeEach(() => {
    for (const key of managedKeys) originalValues.set(key, process.env[key]);
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    setManaged({});
  });

  afterEach(() => {
    for (const key of managedKeys) {
      const value = originalValues.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    originalValues.clear();
  });

  it('fails closed when FEDAPAY_ENV is absent or invalid', () => {
    setManaged({
      FEDAPAY_SECRET_KEY: 'live-secret-test',
      FEDAPAY_WEBHOOK_SECRET: 'live-webhook-test',
    });
    expect(isFedaPayConfigured()).toBe(false);

    setManaged({
      FEDAPAY_ENV: 'staging',
      FEDAPAY_SECRET_KEY: 'live-secret-test',
      FEDAPAY_WEBHOOK_SECRET: 'live-webhook-test',
    });
    expect(isFedaPayConfigured()).toBe(false);
  });

  it('accepts the existing live variable pair only for explicit live mode', () => {
    setManaged({
      FEDAPAY_ENV: 'live',
      FEDAPAY_SECRET_KEY: 'live-secret-test',
      FEDAPAY_WEBHOOK_SECRET: 'live-webhook-test',
    });
    expect(isFedaPayConfigured()).toBe(true);

    setManaged({
      FEDAPAY_ENV: 'sandbox',
      FEDAPAY_SECRET_KEY: 'live-secret-test',
      FEDAPAY_WEBHOOK_SECRET: 'live-webhook-test',
    });
    expect(isFedaPayConfigured()).toBe(false);
  });

  it('requires the separate sandbox variable pair for explicit sandbox mode', () => {
    setManaged({
      FEDAPAY_ENV: 'sandbox',
      FEDAPAY_SANDBOX_SECRET_KEY: 'sandbox-secret-test',
      FEDAPAY_SANDBOX_WEBHOOK_SECRET: 'sandbox-webhook-test',
    });
    expect(isFedaPayConfigured()).toBe(true);

    setManaged({
      FEDAPAY_ENV: 'live',
      FEDAPAY_SANDBOX_SECRET_KEY: 'sandbox-secret-test',
      FEDAPAY_SANDBOX_WEBHOOK_SECRET: 'sandbox-webhook-test',
    });
    expect(isFedaPayConfigured()).toBe(false);
  });

  it('uses the sandbox secret and endpoint only in sandbox mode', async () => {
    setManaged({
      FEDAPAY_ENV: 'sandbox',
      FEDAPAY_SANDBOX_SECRET_KEY: 'sandbox-secret-test',
      FEDAPAY_SANDBOX_WEBHOOK_SECRET: 'sandbox-webhook-test',
    });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 123, status: 'pending' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ url: 'https://process.fedapay.com/test-token' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await createFedaPayCheckout(checkoutInput());

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://sandbox-api.fedapay.com/v1/transactions',
      expect.objectContaining({
        headers: expect.objectContaining({ authorization: 'Bearer sandbox-secret-test' }),
      }),
    );
  });
});
