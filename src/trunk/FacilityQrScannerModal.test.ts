import { describe, it, expect } from 'vitest';
import { parseFacilityIdFromQr } from './FacilityQrScannerModal';

describe('parseFacilityIdFromQr', () => {
  it('parses full URL with facility parameter', () => {
    expect(parseFacilityIdFromQr('https://omni.sparkafrika.online/?facility=fac_123')).toBe('fac_123');
    expect(parseFacilityIdFromQr('http://localhost:3000/?mode=demo&facility=fac_cafe_456#top')).toBe('fac_cafe_456');
  });

  it('parses query string fragments', () => {
    expect(parseFacilityIdFromQr('?facility=fac_boutique_789')).toBe('fac_boutique_789');
    expect(parseFacilityIdFromQr('facility=fac_pharmacy_01')).toBe('fac_pharmacy_01');
  });

  it('parses direct raw facility IDs', () => {
    expect(parseFacilityIdFromQr('fac_01')).toBe('fac_01');
    expect(parseFacilityIdFromQr('facility-lome-centre')).toBe('facility-lome-centre');
  });

  it('returns null for empty or invalid inputs', () => {
    expect(parseFacilityIdFromQr('')).toBeNull();
    expect(parseFacilityIdFromQr('   ')).toBeNull();
    expect(parseFacilityIdFromQr('not a valid id with spaces and @#$')).toBeNull();
  });
});
