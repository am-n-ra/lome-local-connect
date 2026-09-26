import { describe, expect, it, vi } from 'vitest';
import { OfferMediaPolicyError, OfferMediaStorageError, hasOfferMediaStorage, handleOfferMediaUpload, offerMediaPrefix } from './offer-media-storage';

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

  it('refuses an upload token without an authenticated seller session', async () => {
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'test-token');
    await expect(handleOfferMediaUpload({
      productId,
      headers: {},
      url: `https://omni.example/api/v2/seller/catalogue/${productId}/media-upload`,
      body: { type: 'blob.generate-client-token', payload: { pathname: `offers/${productId}/a.jpg`, clientPayload: null, multipart: false } },
    })).rejects.toBeInstanceOf(OfferMediaPolicyError);
  });
});
