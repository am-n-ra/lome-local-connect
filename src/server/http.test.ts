import type { IncomingMessage } from 'node:http';
import { describe, expect, it } from 'vitest';
import { ApiInputError, parseRequestBody, toApiErrorResponse } from './http';
import { AvailabilityPolicyError } from './trunk-repository';

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

  it('redacts unexpected internal details behind a recoverable 500', () => {
    const response = toApiErrorResponse('corr-internal', new Error('database password leaked'));
    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('INTERNAL_RECOVERABLE');
    expect(response.body.error.retryable).toBe(true);
    expect(response.body.error.message).not.toContain('database password');
  });
});
