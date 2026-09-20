import { describe, expect, it } from 'vitest';
import { routingGate } from './routing-gate';

/** RT-D1: the gate exists to bound a bill, not to ration a free feature. These
 * cases pin that distinction so a future refactor cannot quietly start requiring
 * sign-in for a self-hosted router that costs nothing. */
describe('routingGate', () => {
  it('closes nothing when no provider is configured', () => {
    expect(routingGate({ provider: null, env: {} })).toBe('none');
  });

  it('requires an identity only for the billed provider', () => {
    expect(routingGate({ provider: 'mapbox', env: {} })).toBe('identity');
    expect(routingGate({ provider: 'osrm', env: {} })).toBe('none');
  });

  it('never requires an intent unless the founder opts in', () => {
    expect(routingGate({ provider: 'mapbox', env: { ROUTING_REQUIRE_INTENT: '1' } })).toBe('intent');
  });

  it('honours an explicit override to open access during an incident', () => {
    expect(routingGate({ provider: 'mapbox', env: { ROUTING_ACCESS_MODE: 'never' } })).toBe('none');
  });

  it('honours an explicit override to close access regardless of provider', () => {
    expect(routingGate({ provider: 'osrm', env: { ROUTING_ACCESS_MODE: 'always' } })).toBe('identity');
  });

  it('treats "billed" as the default policy, spelled out', () => {
    expect(routingGate({ provider: 'mapbox', env: { ROUTING_ACCESS_MODE: 'billed' } })).toBe('identity');
    expect(routingGate({ provider: 'osrm', env: { ROUTING_ACCESS_MODE: 'billed' } })).toBe('none');
  });

  it('combines the intent lock with the billed policy', () => {
    expect(routingGate({ provider: 'mapbox', env: { ROUTING_ACCESS_MODE: 'billed', ROUTING_REQUIRE_INTENT: '1' } })).toBe('intent');
    // A free provider stays open even with the intent flag on: there is no cost
    // to defend, and closing it would only remove a working feature.
    expect(routingGate({ provider: 'osrm', env: { ROUTING_ACCESS_MODE: 'billed', ROUTING_REQUIRE_INTENT: '1' } })).toBe('none');
  });
});