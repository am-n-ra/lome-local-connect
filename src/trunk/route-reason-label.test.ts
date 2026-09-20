import { describe, expect, it } from 'vitest';
import { routeReasonLabel } from './route-reason-label';

/** RT-D1: a refusal must be actionable, not merely honest. These cases pin the
 * regression that a real buyer hit — a straight line labelled "itinéraire
 * routier indisponible" while the true, fixable cause was "sign in". */
describe('routeReasonLabel', () => {
  it('tells a signed-out buyer to sign in rather than calling it unavailable', () => {
    // The production refusal: HTTP 401, error.code = AUTH_REQUIRED. It arrives as
    // an error code, never as data.reason, which is why it needs its own case.
    expect(routeReasonLabel('AUTH_REQUIRED', undefined)).toBe('connectez-vous pour obtenir l’itinéraire routier');
    expect(routeReasonLabel('HTTP_401', undefined)).toBe('connectez-vous pour obtenir l’itinéraire routier');
  });

  it('keeps the product-decision reasons distinct from the refusals', () => {
    expect(routeReasonLabel('INTENT_REQUIRED', undefined)).toBe('choisissez cette offre pour en afficher l’itinéraire');
    expect(routeReasonLabel('QUOTA_HOURLY', undefined)).toMatch(/cette heure/);
    expect(routeReasonLabel('QUOTA_DAILY', undefined)).toMatch(/journée/);
  });

  it('names an out-of-zone destination instead of blaming the provider', () => {
    expect(routeReasonLabel('OUT_OF_ZONE', undefined)).toMatch(/hors de notre zone/);
  });

  it('falls back to the server message only for a code it does not know', () => {
    expect(routeReasonLabel('SOMETHING_NEW', 'message du serveur')).toBe('message du serveur');
    expect(routeReasonLabel(undefined, undefined)).toBeNull();
  });

  it('never returns a bare code, which would leak English into the French chip', () => {
    for (const code of ['AUTH_REQUIRED', 'HTTP_401', 'QUOTA_DAILY', 'INTENT_REQUIRED', 'OUT_OF_ZONE']) {
      const label = routeReasonLabel(code, undefined);
      expect(label).not.toBeNull();
      expect(label).not.toBe(code);
    }
  });
});