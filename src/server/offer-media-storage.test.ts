import { describe, expect, it, vi } from 'vitest';
import { OfferMediaPolicyError, OfferMediaStorageError, OfferMediaAuthError, OfferMediaRequestError, hasOfferMediaStorage, handleOfferMediaUpload, offerMediaPrefix } from './offer-media-storage';
import { toApiErrorResponse } from './http';

const productId = '33333333-3333-4333-8333-333333333333';

describe('public offer visual boundary (S-20 / E-03)', () => {
  it('binds the upload prefix to the offer', () => {
    expect(offerMediaPrefix(productId)).toBe(`offers/${productId}/`);
    expect(() => offerMediaPrefix('not-a-uuid')).toThrow(OfferMediaPolicyError);
  });

  it('fails closed when the public provider is not configured', async () => {
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', '');
    expect(hasOfferMediaStorage()).toBe(false);
    await expect(handleOfferMediaUpload({
      productId,
      headers: {},
      url: `https://omni.example/api/v2/seller/catalogue/${productId}/media-upload`,
      body: { type: 'blob.generate-client-token', payload: { pathname: `offers/${productId}/a.jpg`, clientPayload: null, multipart: false } },
    })).rejects.toBeInstanceOf(OfferMediaStorageError);
  });

  it('refuses an upload token without an authenticated seller session, as an AUTH error', async () => {
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'test-token');
    await expect(handleOfferMediaUpload({
      productId,
      headers: {},
      url: `https://omni.example/api/v2/seller/catalogue/${productId}/media-upload`,
      body: { type: 'blob.generate-client-token', payload: { pathname: `offers/${productId}/a.jpg`, clientPayload: null, multipart: false } },
    })).rejects.toBeInstanceOf(OfferMediaAuthError);
  });

  it('a malformed Blob envelope is a request error, never an opaque server fault', async () => {
    // Found live: an empty body made the provider throw and surfaced as a 500. A body the
    // protocol cannot parse is the caller's error and must say so.
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'test-token');
    await expect(handleOfferMediaUpload({
      productId, headers: {}, url: `https://omni.example/api/v2/seller/catalogue/${productId}/media-upload`, body: {},
    })).rejects.toBeInstanceOf(OfferMediaRequestError);
  });

  it('maps the three failures to three distinct honest statuses', () => {
    // A missing session is 401, a malformed request is 400, an absent capability is 409.
    // Collapsing them told a signed-out seller to fix a correct request.
    const auth = toApiErrorResponse('c', new OfferMediaAuthError('sign in'));
    const request = toApiErrorResponse('c', new OfferMediaRequestError('bad envelope'));
    const storage = toApiErrorResponse('c', new OfferMediaStorageError('no storage'));
    expect(auth.status).toBe(401);
    expect(auth.body.error?.code).toBe('AUTH_REQUIRED');
    expect(request.status).toBe(400);
    expect(storage.status).toBe(409);
  });
});
