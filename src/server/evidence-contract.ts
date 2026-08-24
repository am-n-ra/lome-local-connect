import { head, type HeadBlobResult } from '@vercel/blob';
import type { ClaimEvidenceItem, EvidenceKind } from '../trunk/types';

export const CLAIM_EVIDENCE_MAX_BYTES = 10 * 1024 * 1024;
export const CLAIM_EVIDENCE_MAX_ITEMS = 12;
export const CLAIM_EVIDENCE_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;

const REQUEST_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EVIDENCE_KINDS = new Set<EvidenceKind>(['identity', 'company', 'facility', 'product', 'service', 'location']);

export class FieldPilotPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FieldPilotPolicyError';
  }
}

export class EvidenceStoragePolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EvidenceStoragePolicyError';
  }
}

export function evidencePath(requestId: string, evidenceKind: EvidenceKind, fileName: string): string {
  if (!REQUEST_ID_PATTERN.test(requestId) || !EVIDENCE_KINDS.has(evidenceKind)) throw new FieldPilotPolicyError('The evidence request or category is invalid.');
  const normalized = fileName.normalize('NFKC').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
  if (!normalized || normalized === '.' || normalized === '..') throw new FieldPilotPolicyError('The evidence file name is invalid.');
  return `claims/${requestId}/${evidenceKind}/${normalized}`;
}

export function providerPathFromInternalKey(objectKey: string): string {
  if (!objectKey.startsWith('private://omni/')) throw new FieldPilotPolicyError('Private evidence reference is invalid.');
  const providerPath = objectKey.slice('private://omni/'.length);
  if (!providerPath || providerPath.includes('..') || providerPath.includes('\\') || /\s/.test(providerPath)) throw new FieldPilotPolicyError('Private evidence reference is invalid.');
  return providerPath;
}

function assertBoundObjectPath(requestId: string, evidence: ClaimEvidenceItem): string {
  if (!REQUEST_ID_PATTERN.test(requestId) || !EVIDENCE_KINDS.has(evidence.evidenceKind)) throw new FieldPilotPolicyError('The claim or evidence category is invalid.');
  const providerPath = providerPathFromInternalKey(evidence.objectKey);
  const prefix = `claims/${requestId}/${evidence.evidenceKind}/`;
  if (!providerPath.startsWith(prefix) || providerPath.slice(prefix.length).length < 1 || providerPath.slice(prefix.length).includes('/')) throw new FieldPilotPolicyError('Evidence belongs to a different claim or category.');
  return providerPath;
}

export function hasPrivateBlobConfiguration(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export async function verifyPrivateEvidenceObjects(requestId: string, evidence: ClaimEvidenceItem[]): Promise<ClaimEvidenceItem[]> {
  if (!hasPrivateBlobConfiguration()) throw new EvidenceStoragePolicyError('Private evidence storage is not configured; the claim remains a resumable draft.');
  if (evidence.length < 1 || evidence.length > CLAIM_EVIDENCE_MAX_ITEMS) throw new FieldPilotPolicyError('Provide one to twelve private evidence objects.');
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) throw new EvidenceStoragePolicyError('Private evidence storage is not configured; no verification token is available.');
  const verified = await Promise.all(evidence.map(async (item) => {
    const providerPath = assertBoundObjectPath(requestId, item);
    let metadata: HeadBlobResult;
    try {
      metadata = await head(providerPath, { token });
    } catch {
      throw new FieldPilotPolicyError('One or more private evidence objects are missing or inaccessible.');
    }
    if (!CLAIM_EVIDENCE_CONTENT_TYPES.includes(metadata.contentType as (typeof CLAIM_EVIDENCE_CONTENT_TYPES)[number]) || metadata.size < 1 || metadata.size > CLAIM_EVIDENCE_MAX_BYTES || metadata.pathname !== providerPath) throw new FieldPilotPolicyError('One or more evidence objects have an unsupported type, size or path.');
    return { ...item, objectKey: `private://omni/${metadata.pathname}` };
  }));
  return verified;
}
