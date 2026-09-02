import { describe, expect, it } from 'vitest';
import {
  authorizePrivateRoute,
  restoreMapContext,
  serializeMapContext,
  toPublicMapMarker,
  type MapContextSnapshot,
} from './map-contracts';

const snapshot: MapContextSnapshot = {
  version: 1,
  mode: 'facility_focus',
  camera: { longitude: 1.234, latitude: 6.37, zoom: 12.4, bearing: 0, pitch: 0 },
  query: 'tomatoes',
  filters: { category: 'produce', quantity: 2, verifiedOnly: false, tags: ['fresh'] },
  selectedFacilityId: 'facility-1',
  selectedProductId: 'product-1',
  availabilityRequestId: 'availability-1',
  returnSurface: 'result',
  capturedAt: '2026-08-22T00:00:00.000Z',
};

describe('Root map context contract', () => {
  it('round-trips the map, search and return context without losing selections', () => {
    const restored = restoreMapContext(serializeMapContext(snapshot));
    expect(restored).toEqual(snapshot);
  });

  it('rejects tampered, malformed or unsafe camera context', () => {
    expect(restoreMapContext('{not-json')).toBeNull();
    expect(restoreMapContext(JSON.stringify({ ...snapshot, version: 99 }))).toBeNull();
    expect(restoreMapContext(JSON.stringify({ ...snapshot, camera: { ...snapshot.camera, latitude: 120 } }))).toBeNull();
    expect(restoreMapContext(JSON.stringify({ ...snapshot, filters: { debug: { secret: true } } }))).toBeNull();
  });
});

describe('Root public map marker contract', () => {
  it('labels facilities as public source presence and never emits stock', () => {
    const marker = toPublicMapMarker({
      id: 'facility-1',
      kind: 'facility',
      label: 'Public facility',
      longitude: 1.2,
      latitude: 6.3,
      trust: 'confirmed',
    });
    expect(marker.semantics).toBe('source_presence');
    expect(marker.stock).toBe('not_disclosed');
    expect(marker.trust).toBeNull();
    expect(Object.prototype.hasOwnProperty.call(marker, 'quantity')).toBe(false);
  });

  it('labels clusters as density and trust markers as trust-only', () => {
    expect(toPublicMapMarker({ id: 'cluster-1', kind: 'cluster', label: '3 places', longitude: 1, latitude: 6, count: 3 })).toMatchObject({ semantics: 'density', count: 3, stock: 'not_disclosed' });
    expect(toPublicMapMarker({ id: 'trust-1', kind: 'trust', label: 'Certified source', longitude: 1, latitude: 6, trust: 'certified' })).toMatchObject({ semantics: 'trust_only', trust: 'certified', stock: 'not_disclosed' });
  });
});

describe('Root protected route contract', () => {
  const base = {
    transactionId: 'transaction-1',
    facilityId: 'facility-1',
    actorAccountId: 'account-buyer',
    buyerAccountId: 'account-buyer',
    confirmedIntent: true,
    transactionMembers: ['account-buyer', 'account-seller'],
    locationPolicy: 'private_after_intent' as const,
  };

  it('denies route access before confirmed intent', () => {
    expect(authorizePrivateRoute({ ...base, confirmedIntent: false })).toEqual({
      allowed: false,
      code: 'ROUTE_NOT_AUTHORIZED',
      reason: 'intent_required',
    });
  });

  it('denies a non-member even when an intent exists', () => {
    expect(authorizePrivateRoute({ ...base, actorAccountId: 'account-outsider' })).toEqual({
      allowed: false,
      code: 'ROUTE_NOT_AUTHORIZED',
      reason: 'membership_required',
    });
  });

  it('allows only a confirmed-intent transaction member and keeps visibility private', () => {
    expect(authorizePrivateRoute(base)).toEqual({
      allowed: true,
      transactionId: 'transaction-1',
      facilityId: 'facility-1',
      actorAccountId: 'account-buyer',
      visibility: 'private',
    });
  });
});
