import { head, type HeadBlobResult } from '@vercel/blob';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import type { IncomingHttpHeaders } from 'node:http';
import { getAuthUserId } from './auth-context';
import { createTrunkRepository } from './trunk-repository';
import { normalizeProductMedia } from '../trunk/offer-existence';
import type { ProductMediaItem } from '../trunk/types';

/**
 * S-20 / E-03 — the offer's PUBLIC visual, the twin of the private claim evidence.
 *
 * Claim evidence is `access: 'private'` and read back through an authorized route; an offer
 * visual is the opposite by nature — it is what the buyer SEES on the public fiche, so it must
 * be a plain public object with a public URL. The security property is preserved on the WRITE
 * side: only the owning seller gets a token, the token is scoped to `offers/{productId}/`, and
 * every recorded URL is re-verified against the store before it is written to the row. Without
 * that re-verification a client could POST any URL to `/media` and have it rendered.
 */

const PRODUCT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OFFER_MEDIA_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const OFFER_MEDIA_MAX_BYTES = 5 * 1024 * 1024;
const OFFER_MEDIA_MAX_ITEMS = 4;

export class OfferMediaPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OfferMediaPolicyError';
  }
}

/** Storage absent is not a policy refusal: it is an unavailable capability (resumable). */
export class OfferMediaStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OfferMediaStorageError';
  }
}

export function hasOfferMediaStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

function requiredBlobToken(): string {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) throw new OfferMediaStorageError('Offer visual storage is not configured; no upload token was issued.');
  return token;
}

export function offerMediaPrefix(productId: string): string {
  if (!PRODUCT_ID_PATTERN.test(productId)) throw new OfferMediaPolicyError('The offer is invalid.');
  return `offers/${productId}/`;
}

function requestFromHeaders(url: string, headers: IncomingHttpHeaders, body: unknown): Request {
  const requestHeaders = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === 'string') requestHeaders.set(key, value);
    else if (Array.isArray(value)) requestHeaders.set(key, value.join(', '));
  }
  return new Request(url, { method: 'POST', headers: requestHeaders, body: JSON.stringify(body) });
}

export async function handleOfferMediaUpload(input: { body: unknown; headers: IncomingHttpHeaders; url: string; productId: string }): Promise<unknown> {
  if (!hasOfferMediaStorage()) throw new OfferMediaStorageError('Offer visual storage is not configured; no upload token was issued.');
  const prefix = offerMediaPrefix(input.productId);
  const token = requiredBlobToken();
  const webRequest = requestFromHeaders(input.url, input.headers, input.body);
  return handleUpload({
    body: input.body as HandleUploadBody,
    request: webRequest,
    token,
    onBeforeGenerateToken: async (pathname) => {
      const authUserId = await getAuthUserId(input.headers);
      if (!authUserId) throw new OfferMediaPolicyError('An authenticated seller session is required to upload an offer visual.');
      const filePart = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : '';
      if (!filePart || filePart.includes('/') || filePart.includes('..') || filePart.includes('\\') || /\s/.test(filePart)) throw new OfferMediaPolicyError('The upload path is not bound to this offer.');
      // Constructed lazily: the auth/session and path checks must not require a database.
      const repository = createTrunkRepository();
      const authorized = await repository.canManageSellerProduct({ authUserId, productId: input.productId });
      if (!authorized) throw new OfferMediaPolicyError('Only the owner of the offer may attach a visual.');
      return {
        allowedContentTypes: [...OFFER_MEDIA_CONTENT_TYPES],
        maximumSizeInBytes: OFFER_MEDIA_MAX_BYTES,
        addRandomSuffix: true,
        tokenPayload: JSON.stringify({ productId: input.productId }),
      };
    },
    onUploadCompleted: async ({ blob, tokenPayload }) => {
      let payload: { productId?: string };
      try { payload = JSON.parse(tokenPayload ?? '{}') as { productId?: string }; } catch { throw new OfferMediaPolicyError('The upload completion context is invalid.'); }
      if (!payload.productId || !blob.pathname.startsWith(offerMediaPrefix(payload.productId))) throw new OfferMediaPolicyError('The completed object is not bound to this offer.');
    },
  });
}

/**
 * Re-verifies every URL the client wants recorded, so `/media` can never store a foreign link.
 * `head` is the same primitive the private-evidence path uses; a missing object or a pathname
 * outside `offers/{productId}/` is refused rather than silently kept.
 */
export async function verifyOfferMediaObjects(productId: string, raw: unknown): Promise<ProductMediaItem[]> {
  const media = normalizeProductMedia(raw);
  if (media.length < 1 || media.length > OFFER_MEDIA_MAX_ITEMS) throw new OfferMediaPolicyError('Provide one to four offer visuals.');
  if (!hasOfferMediaStorage()) throw new OfferMediaStorageError('Offer visual storage is not configured.');
  const prefix = offerMediaPrefix(productId);
  const token = requiredBlobToken();
  const verified: ProductMediaItem[] = [];
  for (const item of media) {
    let metadata: HeadBlobResult | null = null;
    try { metadata = await head(item.url, { token }); } catch { metadata = null; }
    if (!metadata || !metadata.pathname.startsWith(prefix) || metadata.pathname.slice(prefix.length).length < 1) {
      throw new OfferMediaPolicyError('One or more offer visuals do not belong to this offer.');
    }
    if (!OFFER_MEDIA_CONTENT_TYPES.includes(metadata.contentType as (typeof OFFER_MEDIA_CONTENT_TYPES)[number])) {
      throw new OfferMediaPolicyError('Offer visuals must be a JPEG, PNG or WebP image.');
    }
    if (metadata.size < 1 || metadata.size > OFFER_MEDIA_MAX_BYTES) throw new OfferMediaPolicyError('One or more offer visuals exceed the allowed size.');
    verified.push({ url: metadata.url, kind: 'image' });
  }
  return verified;
}
