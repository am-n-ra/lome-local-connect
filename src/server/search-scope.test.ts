import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * SEARCH-SCOPE — a typed search is GLOBAL (founder 2026-10-07).
 *
 * The founder searched « pain » among offers → nothing, while the entity level of the
 * SAME search reported 6 places. Cause: `runSearch` passed the map viewport bounds, so
 * the offer search was scoped to the visible box — an offer that exists on the map was
 * unfindable when the map was elsewhere. The entity level's hint searched the whole
 * corpus, hence the contradiction. Distance is expressed by the radius constraint, never
 * by the screen; the viewport still scopes the UNFILTERED browse (map discovery).
 *
 * The repository tests use a stubbed `sql` that never executes, so only real SQL catches
 * a scope error. This guard is the static half; the real-SQL half lives in
 * `scripts/prove-root-read-paths.mjs` ("search is global" / "browse is viewport-scoped").
 */
const source = readFileSync(new URL('./trunk-repository.ts', import.meta.url), 'utf8');

describe('SEARCH-SCOPE — la recherche tapée est globale, le browse reste borné', () => {
  it('la porte de listPublicFacilities n’impose plus le viewport à une recherche', () => {
    const start = source.indexOf('async listPublicFacilities');
    const end = source.indexOf('async getPublicStats', start);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const block = source.slice(start, end);
    // The bounds must be guarded by "no query", so they never scope a typed search.
    expect(block).toContain('(${namePattern}::text is not null');
    // The old shape — an unconditional viewport predicate — must not return.
    expect(block).not.toMatch(/where f\.longitude between \$\{west\} and \$\{east\}\s*\n\s*and f\.latitude/);
  });
});
