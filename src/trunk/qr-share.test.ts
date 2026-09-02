import { describe, expect, it } from 'vitest';
import { canNativeShare, facilityPublicUrl } from './qr-share';

describe('facilityPublicUrl', () => {
  it('builds the exact public vitrine URL encoded in the QR', () => {
    expect(facilityPublicUrl('https://omni.sparkafrika.online', 'fac_123')).toBe('https://omni.sparkafrika.online/?facility=fac_123');
  });

  it('encodes facility ids so the QR and the shared link stay identical', () => {
    expect(facilityPublicUrl('https://omni.sparkafrika.online', 'a b&c=d')).toBe('https://omni.sparkafrika.online/?facility=a%20b%26c%3Dd');
  });

  it('matches the QR payload construction for the same inputs', () => {
    const origin = 'https://omni.sparkafrika.online';
    const id = 'fac-42';
    expect(facilityPublicUrl(origin, id)).toBe(`${origin}/?facility=${encodeURIComponent(id)}`);
  });
});

describe('canNativeShare', () => {
  it('reports false without navigator.share so Partager falls back to copy', () => {
    // In the test runtime navigator.share does not exist; the QR card must
    // treat that exactly like the Copier le lien path.
    expect(canNativeShare()).toBe(false);
  });
});
