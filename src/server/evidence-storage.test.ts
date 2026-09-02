import { describe, expect, it, vi } from 'vitest';
import { EvidenceStoragePolicyError, CLAIM_EVIDENCE_CONTENT_TYPES, CLAIM_EVIDENCE_MAX_BYTES, evidencePath, hasPrivateBlobConfiguration } from './evidence-contract';
import { ClaimEvidenceNotFoundError, handleClaimEvidenceUpload } from './evidence-storage';

const requestId = '11111111-1111-4111-8111-111111111111';

describe('private claim evidence boundary', () => {
  it('binds paths to the claim and typed evidence category', () => {
    expect(evidencePath(requestId, 'identity', 'identity card.pdf')).toBe(`claims/${requestId}/identity/identity-card.pdf`);
    expect(evidencePath(requestId, 'location', 'shop/photo.png')).toBe(`claims/${requestId}/location/shop-photo.png`);
  });

  it('rejects invalid claim or evidence categories before provider access', () => {
    expect(() => evidencePath('not-a-uuid', 'identity', 'id.pdf')).toThrow('evidence request or category is invalid');
    expect(() => evidencePath(requestId, 'unknown' as never, 'id.pdf')).toThrow('evidence request or category is invalid');
  });

  it('keeps the provider boundary explicit and bounded', () => {
    expect(CLAIM_EVIDENCE_MAX_BYTES).toBe(10 * 1024 * 1024);
    expect(CLAIM_EVIDENCE_CONTENT_TYPES).toEqual(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', '');
    expect(hasPrivateBlobConfiguration()).toBe(false);
  });

  it('fails closed when the private provider is not configured', async () => {
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', '');
    await expect(handleClaimEvidenceUpload({
      requestId,
      headers: {},
      url: 'https://omni.example/api/v2/facilities/' + requestId + '?action=claim-upload',
      body: { type: 'blob.generate-client-token', payload: { pathname: `claims/${requestId}/identity/id.pdf`, clientPayload: JSON.stringify({ evidenceKind: 'identity' }), multipart: false } },
    })).rejects.toBeInstanceOf(EvidenceStoragePolicyError);
  });

  it('uses a non-public not-found error for inaccessible evidence', () => {
    expect(new ClaimEvidenceNotFoundError().name).toBe('ClaimEvidenceNotFoundError');
    expect(new ClaimEvidenceNotFoundError().message).not.toContain('object key');
  });
});
