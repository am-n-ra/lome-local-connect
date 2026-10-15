import { describe, it, expect } from 'vitest';
import { placeSpotlightCard } from './spotlight-placement';

/**
 * GUIDE-1b — garde de placement du spotlight (fondateur 2026-10-15).
 *
 * Le bug : à l'étape « dock » (collée au bas), la bulle était placée SOUS l'anneau et
 * tombait hors de l'écran (`top=840` sur `vh=844`) → boutons inaccessibles.
 * Ce garde verrouille : la bulle est TOUJOURS entièrement dans la fenêtre.
 */
describe('placeSpotlightCard', () => {
  const vh = 844;
  const viewport = { width: 390, height: vh };

  it('place sous l’anneau quand ça tient (étape haute)', () => {
    const r = placeSpotlightCard({ ring: { top: 6, left: 12, width: 180, height: 44 }, cardHeight: 128, viewport });
    expect(r.placement).toBe('below');
    expect(r.top).toBe(60); // 6 + 44 + 10
  });

  it('REGRESSION : l’étape dock garde la bulle entièrement visible (passe au-dessus)', () => {
    // ring du dock : 766..836 ; sous l'anneau = 846 (> maxTop 704) → doit passer au-dessus
    const r = placeSpotlightCard({ ring: { top: 766, left: 12, width: 240, height: 70 }, cardHeight: 128, viewport });
    expect(r.placement).toBe('above');
    expect(r.top).toBe(628); // 766 - 10 - 128
    expect(r.top + 128).toBeLessThanOrEqual(vh); // entièrement visible
    expect(r.top).toBeGreaterThanOrEqual(0);
  });

  it('ancre en bas si l’élément occupe tout l’écran (ni dessous ni dessus)', () => {
    const r = placeSpotlightCard({ ring: { top: 0, left: 0, width: 390, height: vh }, cardHeight: 128, viewport });
    expect(r.placement).toBe('anchor-bottom');
    expect(r.top + 128).toBeLessThanOrEqual(vh);
    expect(r.top).toBeGreaterThanOrEqual(0);
  });

  it('borne toujours dans la fenêtre, quelle que soit l’entrée', () => {
    const inputs = [
      { ring: { top: -50, left: -30, width: 100, height: 40 }, cardHeight: 128, viewport },
      { ring: { top: 800, left: 380, width: 200, height: 60 }, cardHeight: 160, viewport },
      { ring: { top: 400, left: 12, width: 180, height: 40 }, cardHeight: 100, viewport },
    ];
    for (const input of inputs) {
      const r = placeSpotlightCard(input);
      expect(r.top).toBeGreaterThanOrEqual(0);
      expect(r.top + input.cardHeight).toBeLessThanOrEqual(vh);
      expect(r.left).toBeGreaterThanOrEqual(0);
      expect(r.left).toBeLessThanOrEqual(viewport.width);
    }
  });

  it('petit écran (667) : la bulle reste visible à l’étape dock', () => {
    const small = { width: 390, height: 667 };
    const r = placeSpotlightCard({ ring: { top: 589, left: 12, width: 240, height: 70 }, cardHeight: 128, viewport: small });
    expect(r.top + 128).toBeLessThanOrEqual(667);
    expect(r.top).toBeGreaterThanOrEqual(0);
  });
});
