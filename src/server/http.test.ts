import type { IncomingMessage } from 'node:http';
import { describe, expect, it } from 'vitest';
import { ApiInputError, extractFedaPayTransaction, isTransactionState, parseRequestBody, toApiErrorResponse } from './http';
import { AvailabilityPolicyError, EvidenceStoragePolicyError, PurchaseIntentPolicyError, TransactionPolicyError } from './trunk-repository';
import { ClaimEvidenceNotFoundError } from './evidence-storage';

const requestWithBody = (value: string) => ({
  async *[Symbol.asyncIterator]() {
    yield Buffer.from(value);
  },
}) as unknown as IncomingMessage;

describe('Root HTTP error boundary', () => {
  it('rejects malformed JSON as a typed invalid-input error', async () => {
    await expect(parseRequestBody(requestWithBody('{"productId":'))).rejects.toMatchObject({
      name: 'ApiInputError',
      message: 'Request body must be valid JSON.',
    });
  });

  it('rejects array bodies as typed invalid-input errors', async () => {
    await expect(parseRequestBody(requestWithBody('[]'))).rejects.toBeInstanceOf(ApiInputError);
  });

  it('maps malformed input to a retry-free 400 envelope', () => {
    const response = toApiErrorResponse('corr-input', new ApiInputError('Request body must be valid JSON.'));
    expect(response).toEqual({
      status: 400,
      body: {
        ok: false,
        correlationId: 'corr-input',
        error: {
          code: 'INVALID_INPUT',
          message: 'Request body must be valid JSON.',
          retryable: false,
        },
      },
    });
  });

  it('maps availability policy rejection to a non-retryable 409', () => {
    const response = toApiErrorResponse('corr-policy', new AvailabilityPolicyError('The selected product is not published at the requested facility.'));
    expect(response).toEqual({
      status: 409,
      body: {
        ok: false,
        correlationId: 'corr-policy',
        error: {
          code: 'POLICY_REJECTED',
          message: 'The selected product is not published at the requested facility.',
          retryable: false,
        },
      },
    });
  });

  it('maps purchase-intent policy rejection to a non-retryable 409', () => {
    const response = toApiErrorResponse('corr-intent', new PurchaseIntentPolicyError('No eligible availability response belongs to the authenticated buyer.'));
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('POLICY_REJECTED');
    expect(response.body.error.retryable).toBe(false);
  });

  it('maps external-payment policy rejection to a non-retryable 409', () => {
    const response = toApiErrorResponse('corr-payment', new TransactionPolicyError('Payment declaration requires a buyer member after QR verification.'));
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('POLICY_REJECTED');
    expect(response.body.error.retryable).toBe(false);
  });

  it('accepts only the locked transaction states at the HTTP boundary', () => {
    expect(isTransactionState('qr_verified')).toBe(true);
    expect(isTransactionState('closed')).toBe(true);
    expect(isTransactionState('rejected')).toBe(false);
    expect(isTransactionState('disputed')).toBe(false);
    expect(isTransactionState(null)).toBe(false);
  });

  it('maps unavailable private evidence storage to a retryable provider boundary', () => {
    const response = toApiErrorResponse('corr-evidence', new EvidenceStoragePolicyError('Private evidence storage is not configured.'));
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('EVIDENCE_STORAGE_UNAVAILABLE');
    expect(response.body.error.retryable).toBe(false);
  });

  it('does not expose private evidence when the object is unavailable', () => {
    const response = toApiErrorResponse('corr-evidence-not-found', new ClaimEvidenceNotFoundError());
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('EVIDENCE_NOT_FOUND');
    expect(response.body.error.message).not.toContain('object key');
  });

  it('redacts unexpected internal details behind a recoverable 500', () => {
    const response = toApiErrorResponse('corr-internal', new Error('database password leaked'));
    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('INTERNAL_RECOVERABLE');
    expect(response.body.error.retryable).toBe(true);
    expect(response.body.error.message).not.toContain('database password');
  });

  it('extracts the transaction from the live FedaPay entity payload shape', () => {
    const payload = {
      name: 'transaction.approved',
      object: 'transaction',
      entity: {
        klass: 'v1/transaction',
        id: 113034942,
        reference: 'trx_9L0_1788932131726',
        amount: 100,
        description: 'Recharge Omni Wallet',
        status: 'approved',
        currency: { klass: 'v1/currency', id: 1, iso: 'XOF', div: 1 },
        custom_metadata: { omni_recharge_id: 'f8406146-2938-4811-910b-c6229c77399a' },
        customer_id: 7872480,
      },
    };
    const { transaction, metadata } = extractFedaPayTransaction(payload);
    expect(transaction.id).toBe(113034942);
    expect((transaction.currency as Record<string, unknown>).iso).toBe('XOF');
    expect(metadata.omni_recharge_id).toBe('f8406146-2938-4811-910b-c6229c77399a');
  });

  it('extracts the transaction from the documented nested object shape', () => {
    const payload = {
      id: 'evt_1',
      type: 'transaction.approved',
      object: { transaction: { id: 'trx_1', amount: 100, currency: { iso: 'XOF' }, custom_metadata: { omni_recharge_id: 'recharge-1' } } },
    };
    const { transaction, metadata } = extractFedaPayTransaction(payload);
    expect(transaction.id).toBe('trx_1');
    expect(metadata.omni_recharge_id).toBe('recharge-1');
  });
});
