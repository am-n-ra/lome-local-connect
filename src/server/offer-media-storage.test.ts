import { describe, expect, it, vi, beforeEach } from 'vitest';
import { OfferMediaPolicyError, OfferMediaStorageError, OfferMediaAuthError, OfferMediaRequestError, hasOfferMediaStorage, handleOfferMediaUpload, offerMediaPrefix, offerMediaBlobToken, verifyOfferMediaObjects } from './offer-media-storage';
import { toApiErrorResponse } from './http';

const productId = '33333333-3333-4333-8333-333333333333';

const headMock = vi.fn();
vi.mock('@vercel/blob', () => ({ head: (...args: unknown[]) => headMock(...args) }));

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

  describe('storage contract — the public visual never shares the private store (S-20 / D-2 B1)', () => {
    beforeEach(() => {
      headMock.mockReset();
      vi.unstubAllEnvs();
    });

    it('prefers the dedicated public store token, falling back to the base token', () => {
      // A private store refuses `access:'public'`, so the visual needs its OWN public token.
      vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'base-private');
      vi.stubEnv('BLOB_PUBLIC_READ_WRITE_TOKEN', 'public-store');
      expect(offerMediaBlobToken()).toBe('public-store');
      vi.stubEnv('BLOB_PUBLIC_READ_WRITE_TOKEN', '');
      vi.stubEnv('OMNI_READ_WRITE_TOKEN', 'omni-public-store');
      expect(offerMediaBlobToken()).toBe('omni-public-store');
      vi.stubEnv('OMNI_READ_WRITE_TOKEN', '');
      expect(offerMediaBlobToken()).toBe('base-private');
      vi.stubEnv('BLOB_READ_WRITE_TOKEN', '');
      expect(hasOfferMediaStorage()).toBe(false);
    });

    it('records a public visual and returns the public URL', async () => {
      vi.stubEnv('BLOB_PUBLIC_READ_WRITE_TOKEN', 'public-store');
      headMock.mockResolvedValue({
        url: `https://abc.public.blob.vercel-storage.com/offers/${productId}/v.png`,
        pathname: `offers/${productId}/v.png`,
        contentType: 'image/png',
        size: 1234,
      });
      const media = await verifyOfferMediaObjects(productId, [{ url: `https://abc.public.blob.vercel-storage.com/offers/${productId}/v.png`, kind: 'image' }]);
      expect(media).toEqual([{ url: `https://abc.public.blob.vercel-storage.com/offers/${productId}/v.png`, kind: 'image' }]);
    });

    it('refuses a PRIVATE object — it would pass "visuel" but never load for a buyer', async () => {
      // The exact hole found live: a private object was accepted, so integrity passed on an
      // image the public fiche can only 403 on.
      vi.stubEnv('BLOB_PUBLIC_READ_WRITE_TOKEN', 'public-store');
      headMock.mockResolvedValue({
        url: `https://abc.private.blob.vercel-storage.com/offers/${productId}/v.png`,
        pathname: `offers/${productId}/v.png`,
        contentType: 'image/png',
        size: 1234,
      });
      await expect(verifyOfferMediaObjects(productId, [{ url: `https://abc.private.blob.vercel-storage.com/offers/${productId}/v.png`, kind: 'image' }]))
        .rejects.toBeInstanceOf(OfferMediaPolicyError);
    });

    it('still refuses a foreign path and a non-image', async () => {
      vi.stubEnv('BLOB_PUBLIC_READ_WRITE_TOKEN', 'public-store');
      headMock.mockResolvedValue({
        url: 'https://abc.public.blob.vercel-storage.com/offers/other/x.png',
        pathname: 'offers/other/x.png',
        contentType: 'image/png',
        size: 10,
      });
      await expect(verifyOfferMediaObjects(productId, [{ url: 'https://abc.public.blob.vercel-storage.com/offers/other/x.png', kind: 'image' }]))
        .rejects.toBeInstanceOf(OfferMediaPolicyError);
    });
  });
});
