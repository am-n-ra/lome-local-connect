import { describe, expect, it } from 'vitest';
import { publicationMessage } from './ProductCatalogueV13';

/**
 * RH-02 « on exige » — the refusal must never fall back to a generic message.
 *
 * The server names the missing fact (MEDIA_REQUIRED / ADVANTAGE_REQUIRED / UNIQUENESS_REQUIRED /
 * HANDOVER_REQUIRED / PRICE_KIND_REQUIRED / CONDITION_REQUIRED). A seller who is told only
 * "publication refused" cannot fix anything, so every named reason must reach a distinct,
 * actionable sentence. This locks the mapping; the server side is proven against real Postgres by
 * `scripts/prove-rh02-described-offer.mjs` (the stub suite cannot compile the SQL).
 */
describe('publication refusal reaches the seller, named (RH-02)', () => {
  const named = [
    'MEDIA_REQUIRED',
    'ADVANTAGE_REQUIRED',
    'UNIQUENESS_REQUIRED',
    'HANDOVER_REQUIRED',
    'PRICE_KIND_REQUIRED',
    'CONDITION_REQUIRED',
    'OCCASION_DETAIL_REQUIRED',
    'FORBIDDEN_OR_LIMIT_REACHED',
  ];

  it('gives every named reason its own message, never the generic fallback', () => {
    const generic = publicationMessage('SOMETHING_UNMAPPED');
    for (const code of named) {
      const message = publicationMessage(code);
      expect(message).not.toBe(generic);
      expect(message.length).toBeGreaterThan(10);
    }
  });

  it('does not collapse the four characteristics into one sentence', () => {
    // Four distinct facts need four distinct instructions; one shared sentence would tell the
    // seller to fix the wrong thing.
    const messages = ['UNIQUENESS_REQUIRED', 'HANDOVER_REQUIRED', 'PRICE_KIND_REQUIRED', 'CONDITION_REQUIRED'].map(publicationMessage);
    expect(new Set(messages).size).toBe(4);
  });

  it('still falls back honestly for an unknown reason', () => {
    expect(publicationMessage('SOMETHING_UNMAPPED')).toBe('La publication a été refusée.');
  });
});
