import { get } from '@vercel/blob';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import type { IncomingHttpHeaders } from 'node:http';
import { getAuthUserId } from './auth-context';
import { createTrunkRepository } from './trunk-repository';
import type { ClaimEvidenceItem, EvidenceKind } from '../trunk/types';
import { CLAIM_EVIDENCE_CONTENT_TYPES, CLAIM_EVIDENCE_MAX_BYTES, CLAIM_EVIDENCE_MAX_ITEMS, EvidenceStoragePolicyError, FieldPilotPolicyError, hasPrivateBlobConfiguration, providerPathFromInternalKey } from './evidence-contract';

const REQUEST_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EVIDENCE_KINDS = new Set<EvidenceKind>(['identity', 'company', 'facility', 'product', 'service', 'location']);

export class ClaimEvidenceNotFoundError extends Error {
  constructor(message = 'The requested private evidence was not found.') {
    super(message);
    this.name = 'ClaimEvidenceNotFoundError';
  }
}

function requiredBlobToken(): string {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) throw new EvidenceStoragePolicyError('Private evidence storage is not configured; no upload token was issued.');
  return token;
}

function parseClientPayload(value: string | null): { evidenceKind: EvidenceKind } {
  if (!value) throw new FieldPilotPolicyError('Evidence category is required.');
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    if (typeof parsed.evidenceKind !== 'string' || !EVIDENCE_KINDS.has(parsed.evidenceKind as EvidenceKind)) throw new Error('invalid category');
    return { evidenceKind: parsed.evidenceKind as EvidenceKind };
  } catch {
    throw new FieldPilotPolicyError('Evidence category is invalid.');
  }
}

function requestFromHeaders(url: string, headers: IncomingHttpHeaders, body: unknown): Request {
  const requestHeaders = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === 'string') requestHeaders.set(key, value);
    else if (Array.isArray(value)) requestHeaders.set(key, value.join(', '));
  }
  return new Request(url, { method: 'POST', headers: requestHeaders, body: JSON.stringify(body) });
}

export async function handleClaimEvidenceUpload(input: { body: unknown; headers: IncomingHttpHeaders; url: string; requestId: string }): Promise<unknown> {
  if (!hasPrivateBlobConfiguration()) throw new EvidenceStoragePolicyError('Private evidence storage is not configured; no upload token was issued.');
  if (!REQUEST_ID_PATTERN.test(input.requestId)) throw new FieldPilotPolicyError('The claim request is invalid.');
  const token = requiredBlobToken();
  const repository = createTrunkRepository();
  const webRequest = requestFromHeaders(input.url, input.headers, input.body);
  return handleUpload({
    body: input.body as HandleUploadBody,
    request: webRequest,
    token,
    onBeforeGenerateToken: async (pathname, clientPayload) => {
      const authUserId = await getAuthUserId(input.headers);
      if (!authUserId) throw new FieldPilotPolicyError('An authenticated claimant session is required for evidence upload.');
      const payload = parseClientPayload(clientPayload);
      const expectedPrefix = `claims/${input.requestId}/${payload.evidenceKind}/`;
      const filePart = pathname.startsWith(expectedPrefix) ? pathname.slice(expectedPrefix.length) : '';
      if (!filePart || filePart.includes('/') || filePart.includes('..') || filePart.includes('\\') || /\s/.test(filePart)) throw new FieldPilotPolicyError('The upload path is not bound to this claim.');
      const authorized = await repository.canUploadClaimEvidence({ authUserId, requestId: input.requestId });
      if (!authorized) throw new FieldPilotPolicyError('Only the claimant of an open draft may upload evidence.');
      return {
        allowedContentTypes: [...CLAIM_EVIDENCE_CONTENT_TYPES],
        maximumSizeInBytes: CLAIM_EVIDENCE_MAX_BYTES,
        addRandomSuffix: true,
        tokenPayload: JSON.stringify({ requestId: input.requestId, evidenceKind: payload.evidenceKind }),
      };
    },
    onUploadCompleted: async ({ blob, tokenPayload }) => {
      let payload: { requestId?: string; evidenceKind?: EvidenceKind };
      try { payload = JSON.parse(tokenPayload ?? '{}') as { requestId?: string; evidenceKind?: EvidenceKind }; } catch { throw new FieldPilotPolicyError('The upload completion context is invalid.'); }
      if (!payload.requestId || !payload.evidenceKind || !blob.pathname.startsWith(`claims/${payload.requestId}/${payload.evidenceKind}/`)) throw new FieldPilotPolicyError('The completed object is not bound to the claim.');
    },
  });
}

export async function readPrivateEvidence(objectKey: string): Promise<{ body: Buffer; contentType: string; size: number }> {
  if (!hasPrivateBlobConfiguration()) throw new EvidenceStoragePolicyError('Private evidence storage is not configured.');
  const result = await get(providerPathFromInternalKey(objectKey), { access: 'private', token: requiredBlobToken(), useCache: false });
  if (!result) throw new ClaimEvidenceNotFoundError();
  const body = Buffer.from(await new Response(result.stream).arrayBuffer());
  if (body.length < 1 || body.length > CLAIM_EVIDENCE_MAX_BYTES) throw new FieldPilotPolicyError('The private evidence object exceeds the allowed size.');
  return { body, contentType: result.blob.contentType ?? 'application/octet-stream', size: body.length };
}

export type { ClaimEvidenceItem };
export { CLAIM_EVIDENCE_MAX_ITEMS };
