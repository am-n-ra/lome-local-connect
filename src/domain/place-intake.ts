// Intake tiers for world population (POP-1a, DEC-V2-10/11).
//
// The world is populated from default map place data as UNCLAIMED (S-05 intact).
// Every intake point is classified before admission; the tier travels in
// raw_metadata and never grants rights — claim (S-18), trust (S-30/S-31) and
// transactability gates are unchanged. Pure: no DB, no network, no side effects.
export type IntakeTier = 'pilot' | 'world' | 'quarantine';

export interface IntakePoint {
  latitude: number;
  longitude: number;
  name: string;
  address?: string | null;
}

export interface IntakeVerdict {
  tier: IntakeTier;
  /** Machine-readable causes, in evaluation order. Empty = clean admit. */
  reasons: string[];
}

export type PilotZonePredicate = (p: { latitude: number; longitude: number }) => boolean;

const PLACEHOLDER_NAME = /^\s*unnamed\b/i;

export function classifyIntakePoint(point: IntakePoint, isPilotZone: PilotZonePredicate): IntakeVerdict {
  const { latitude, longitude } = point;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return { tier: 'quarantine', reasons: ['insane-coordinates'] };
  }
  if (latitude === 0 && longitude === 0) {
    return { tier: 'quarantine', reasons: ['null-island'] };
  }
  const name = (point.name ?? '').trim();
  const address = (point.address ?? '')?.trim() || null;
  if (!name) {
    return address
      ? { tier: 'world', reasons: ['nameless-with-address'] }
      : { tier: 'quarantine', reasons: ['nameless'] };
  }
  if (PLACEHOLDER_NAME.test(name) && !address) {
    return { tier: 'quarantine', reasons: ['placeholder-no-address'] };
  }
  if (isPilotZone({ latitude, longitude })) {
    return { tier: 'pilot', reasons: [] };
  }
  return { tier: 'world', reasons: ['outside-pilot-zone'] };
}
