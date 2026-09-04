import { describe, expect, it } from 'vitest';
import { extractFacilityId } from './PublicQrScannerSheet';

const ID = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';

describe('extractFacilityId (public QR scan → facility card)', () => {
  it('accepts a raw uuid', () => {
    expect(extractFacilityId(ID)).toBe(ID);
  });

  it('extracts from a ?facility= url', () => {
    expect(extractFacilityId(`https://omni.sparkafrika.online/?facility=${ID}`)).toBe(ID);
  });

  it('extracts from a trailing path segment', () => {
    expect(extractFacilityId(`https://omni.sparkafrika.online/facility/${ID}`)).toBe(ID);
  });

  it('rejects non-qr payloads', () => {
    expect(extractFacilityId('hello world')).toBeNull();
    expect(extractFacilityId('')).toBeNull();
    expect(extractFacilityId('https://example.com/about')).toBeNull();
  });
});
