import { head, issueSignedToken, type HeadBlobResult } from '@vercel/blob';
import { handleUpload, handleUploadPresigned, type HandleUploadBody, type HandleUploadPresignedBody } from '@vercel/blob/client';
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
 *
 * A Vercel Blob store is ENTIRELY public or private, and the mode cannot change after creation.
 * The private claim/visit evidence and the public offer visual therefore cannot share one store,
 * so the visual reads its OWN token (`BLOB_PUBLIC_READ_WRITE_TOKEN`) and only falls back to the
 * base token when no separate public store exists (a public-only deployment). Sharing the base
 * token made every offer upload fail with "Cannot use public access on a private store".
 */

const PRODUCT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OFFER_MEDIA_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const OFFER_MEDIA_MAX_BYTES = 5 * 1024 * 1024;
const OFFER_MEDIA_MAX_ITEMS = 4;
/** Vercel serves private-store blobs from a `*.private.blob.vercel-storage.com` host. */
const PRIVATE_BLOB_URL = /^https?:\/\/[^/]*\.private\.blob\.vercel-storage\.com\//i;

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

/**
 * "You are not signed in" is not "your request is invalid" and not "policy refused you". The
 * app separates the three (the pro-status lesson): a missing session is 401 AUTH_REQUIRED, a
 * malformed request is 400, a legitimate refusal is 409. Returning 400 for a missing session
 * told a signed-out seller to fix a request that was already correct.
 */
export class OfferMediaAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OfferMediaAuthError';
  }
}

/** A body the Blob protocol cannot parse is a client error, never a server fault (500). */
export class OfferMediaRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OfferMediaRequestError';
  }
}

/**
 * Public store credentials. Two shapes are supported, matching how a Vercel Blob store can be
 * connected to the project:
 *  - a read-write token (classic) — `BLOB_PUBLIC_READ_WRITE_TOKEN`;
 *  - an OIDC connection — a store id + webhook public key (`VERCEL_OIDC_TOKEN` is injected by the
 *    platform at runtime). The SDK's `handleUpload` only accepts a read-write token, so an OIDC
 *    store uploads through the PRESIGNED path instead.
 *
 * The public store is resolved ONLY from explicitly-public names. A store connected with a
 * dashboard environment prefix exposes the same variables prefixed (`OMNI_`), so both spellings
 * are honored. Bare `BLOB_STORE_ID` / `BLOB_WEBHOOK_PUBLIC_KEY` are deliberately NOT read: the
 * PRIVATE evidence store is connected to the same project and would set those, so reading them
 * here would silently send offer visuals to the private store.
 */
const PUBLIC_BLOB_TOKEN_ENV_VARS = ['BLOB_PUBLIC_READ_WRITE_TOKEN', 'OMNI_READ_WRITE_TOKEN', 'OMNI_WEB_READ_WRITE_TOKEN'] as const;
const PUBLIC_BLOB_STORE_ID_ENV_VARS = ['BLOB_PUBLIC_STORE_ID', 'OMNI_STORE_ID', 'OMNI_WEB_STORE_ID'] as const;
const PUBLIC_BLOB_WEBHOOK_KEY_ENV_VARS = ['BLOB_PUBLIC_WEBHOOK_PUBLIC_KEY', 'OMNI_WEBHOOK_PUBLIC_KEY', 'OMNI_WEB_WEBHOOK_PUBLIC_KEY'] as const;

function firstEnv(names: readonly string[]): string {
  for (const name of names) {
    const value = (process.env[name] ?? '').trim();
    if (value) return value;
  }
  return '';
}

/** The public store read-write token, or the base token for a public-only deployment. */
export function offerMediaBlobToken(): string {
  return firstEnv(PUBLIC_BLOB_TOKEN_ENV_VARS) || (process.env.BLOB_READ_WRITE_TOKEN ?? '').trim();
}

/** The public store id, used with the platform OIDC token for an OIDC-connected store. */
export function offerMediaStoreId(): string {
  return firstEnv(PUBLIC_BLOB_STORE_ID_ENV_VARS);
}

/** The public store webhook public key, required to verify presigned upload callbacks. */
export function offerMediaWebhookKey(): string {
  return firstEnv(PUBLIC_BLOB_WEBHOOK_KEY_ENV_VARS);
}

/**
 * How the public store accepts a browser upload. `token` is the classic client-token flow; the
 * client and the server must agree, so this is exposed over the media-upload route and read by
 * the seller UI. `none` means the store is not configured at all.
 *
 * Precedence matters: an explicit public token wins; otherwise a public store id + webhook key
 * selects the presigned flow; only then does the base token stand in for a public-only
 * deployment. Falling back to the base token FIRST would send visuals to the private store.
 */
export function offerMediaUploadMode(): 'token' | 'presigned' | 'none' {
  if (firstEnv(PUBLIC_BLOB_TOKEN_ENV_VARS)) return 'token';
  if (offerMediaStoreId() && offerMediaWebhookKey()) return 'presigned';
  if ((process.env.BLOB_READ_WRITE_TOKEN ?? '').trim()) return 'token';
  return 'none';
}

export function hasOfferMediaStorage(): boolean {
  return offerMediaUploadMode() !== 'none';
}

function requiredBlobToken(): string {
  const token = offerMediaBlobToken();
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
  // The Blob protocol sends a typed envelope. Validating it here turns a provider parse failure
  // (which would surface as an opaque 500) into an honest 400 naming the real problem.
  const body = input.body as HandleUploadBody | HandleUploadPresignedBody | null;
  const isGenerate = body?.type === 'blob.generate-client-token' || body?.type === 'blob.generate-presigned-url';
  const isCompleted = body?.type === 'blob.upload-completed';
  if (!body || typeof body !== 'object' || (!isGenerate && !isCompleted)) {
    throw new OfferMediaRequestError('The upload request is not a valid Blob client-token request.');
  }
  const webRequest = requestFromHeaders(input.url, input.headers, input.body);

  // Auth + ownership + path checks are shared by both credential paths; only the token issuance
  // differs. A missing session must surface as AUTH (401), never as a policy refusal.
  const authorize = async (pathname: string): Promise<void> => {
    const authUserId = await getAuthUserId(input.headers);
    if (!authUserId) throw new OfferMediaAuthError('Sign in as an authorized seller before uploading an offer visual.');
    const filePart = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : '';
    if (!filePart || filePart.includes('/') || filePart.includes('..') || filePart.includes('\\') || /\s/.test(filePart)) throw new OfferMediaPolicyError('The upload path is not bound to this offer.');
    // Constructed lazily: the auth/session and path checks must not require a database.
    const repository = createTrunkRepository();
    const authorized = await repository.canManageSellerProduct({ authUserId, productId: input.productId });
    if (!authorized) throw new OfferMediaPolicyError('Only the owner of the offer may attach a visual.');
  };
  const onUploadCompleted = async ({ blob, tokenPayload }: { blob: { pathname: string }; tokenPayload?: string | null }): Promise<void> => {
    let payload: { productId?: string };
    try { payload = JSON.parse(tokenPayload ?? '{}') as { productId?: string }; } catch { throw new OfferMediaPolicyError('The upload completion context is invalid.'); }
    if (!payload.productId || !blob.pathname.startsWith(offerMediaPrefix(payload.productId))) throw new OfferMediaPolicyError('The completed object is not bound to this offer.');
  };

  // An OIDC-connected store has no read-write token; its client uploads are PRESIGNED. A store
  // with a read-write token uses the classic client-token flow. The two are mutually exclusive
  // per store, and the mode is surfaced to the client so both sides agree.
  if (offerMediaUploadMode() === 'presigned') {
    const storeId = offerMediaStoreId();
    const webhookPublicKey = offerMediaWebhookKey();
    if (!storeId || !webhookPublicKey) throw new OfferMediaStorageError('The public store is incomplete; presigned uploads need a store id and a webhook key.');
    return withHonestProviderError('presigned upload', () => handleUploadPresigned({
      body: input.body as HandleUploadPresignedBody,
      request: webRequest,
      webhookPublicKey,
      onUploadCompleted,
      getSignedToken: async (pathname) => {
        await authorize(pathname);
        // The SDK rejects glob characters: sign the CONCRETE path the client asked for, never a
        // `offers/{id}/*` pattern. `authorize` has already bound it to this offer.
        const token = await issueSignedToken({ storeId, pathname, operations: ['put'] });
        return {
          token,
          urlOptions: {
            allowedContentTypes: [...OFFER_MEDIA_CONTENT_TYPES],
            maximumSizeInBytes: OFFER_MEDIA_MAX_BYTES,
            addRandomSuffix: true,
            tokenPayload: JSON.stringify({ productId: input.productId }),
          },
        };
      },
    }));
  }

  const token = requiredBlobToken();
  return withHonestProviderError('upload token', () => handleUpload({
    body: input.body as HandleUploadBody,
    request: webRequest,
    token,
    onBeforeGenerateToken: async (pathname) => {
      await authorize(pathname);
      return {
        allowedContentTypes: [...OFFER_MEDIA_CONTENT_TYPES],
        maximumSizeInBytes: OFFER_MEDIA_MAX_BYTES,
        addRandomSuffix: true,
        tokenPayload: JSON.stringify({ productId: input.productId }),
      };
    },
    onUploadCompleted,
  }));
}

/**
 * A failure from the Blob provider (network, credential, protocol) is a storage-capability
 * problem, not an unknown server fault. Surfacing it as `OfferMediaStorageError` (409) keeps the
 * provider's own message and stops a signed-in seller seeing a generic 500 they cannot act on.
 * Our own typed refusals (auth/policy/request) pass through untouched.
 */
async function withHonestProviderError<T>(stage: string, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof OfferMediaAuthError || error instanceof OfferMediaPolicyError || error instanceof OfferMediaRequestError || error instanceof OfferMediaStorageError) throw error;
    const detail = error instanceof Error ? error.message : String(error);
    throw new OfferMediaStorageError(`The public store refused the ${stage} (${detail}).`);
  }
}

/**
 * Re-verifies every URL the client wants recorded, so `/media` can never store a foreign link.
 * `head` is the same primitive the private-evidence path uses; a missing object or a pathname
 * outside `offers/{productId}/` is refused rather than silently kept.
 *
 * A PRIVATE object is also refused: it exists and `head` succeeds, but its URL is not readable
 * by a buyer (403), so recording it would let the integrity check "visuel" pass on an image the
 * public fiche can never load. The visual must live in the public store.
 */
export async function verifyOfferMediaObjects(productId: string, raw: unknown): Promise<ProductMediaItem[]> {
  const media = normalizeProductMedia(raw);
  if (media.length < 1 || media.length > OFFER_MEDIA_MAX_ITEMS) throw new OfferMediaPolicyError('Provide one to four offer visuals.');
  if (!hasOfferMediaStorage()) throw new OfferMediaStorageError('Offer visual storage is not configured.');
  const prefix = offerMediaPrefix(productId);
  // OIDC store: `head` authenticates through the store id + the platform OIDC token; a
  // read-write token is used when present (and is required by `head` otherwise).
  const token = offerMediaBlobToken();
  const storeId = offerMediaStoreId();
  const headOptions = token ? { token } : storeId ? { storeId } : undefined;
  const verified: ProductMediaItem[] = [];
  for (const item of media) {
    let metadata: HeadBlobResult | null = null;
    try { metadata = await head(item.url, headOptions); } catch { metadata = null; }
    if (!metadata || !metadata.pathname.startsWith(prefix) || metadata.pathname.slice(prefix.length).length < 1) {
      throw new OfferMediaPolicyError('One or more offer visuals do not belong to this offer.');
    }
    if (PRIVATE_BLOB_URL.test(metadata.url)) {
      throw new OfferMediaPolicyError('Offer visuals must be stored in the public store, not a private one.');
    }
    if (!OFFER_MEDIA_CONTENT_TYPES.includes(metadata.contentType as (typeof OFFER_MEDIA_CONTENT_TYPES)[number])) {
      throw new OfferMediaPolicyError('Offer visuals must be a JPEG, PNG or WebP image.');
    }
    if (metadata.size < 1 || metadata.size > OFFER_MEDIA_MAX_BYTES) throw new OfferMediaPolicyError('One or more offer visuals exceed the allowed size.');
    verified.push({ url: metadata.url, kind: 'image' });
  }
  return verified;
}
