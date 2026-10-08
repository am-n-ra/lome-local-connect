import { describe, it, expect } from 'vitest';
import {
  detectInstallPlatform,
  isStandalone,
  installStateFor,
  installStepsFor,
  shouldOfferInstall,
} from './pwa-install';

describe('couche « ajouter à l’écran d’accueil »', () => {
  it('reconnaît iOS (iPhone/iPad) et le distingue d’Android/desktop', () => {
    expect(detectInstallPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe('ios-safari');
    expect(detectInstallPlatform('Mozilla/5.0 (iPad; CPU OS 16_4 like Mac OS X)')).toBe('ios-safari');
    // iPadOS 13+ se fait passer pour un Macintosh tactile — sans « Mobile » ce serait un desktop.
    expect(detectInstallPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) Mobile/15E148')).toBe('ios-safari');
    expect(detectInstallPlatform('Mozilla/5.0 (Linux; Android 14; Pixel 8)')).toBe('android');
    expect(detectInstallPlatform('Mozilla/5.0 (Windows NT 10.0; Win64)')).toBe('desktop');
  });

  it('détecte l’état installé par le mode standalone', () => {
    expect(isStandalone(true, false)).toBe(true);
    expect(isStandalone(false, true)).toBe(true); // navigator.standalone iOS
    expect(isStandalone(false, false)).toBe(false);
  });

  it('iOS Safari → guide manuel (jamais un bouton d’installation)', () => {
    expect(installStateFor('ios-safari', false, false)).toBe('manual-guide');
    // même si un prompt traînait, iOS n’en émet pas — le guide reste la vérité ici
    expect(installStateFor('ios-safari', false, false)).toBe('manual-guide');
  });

  it('Android : bouton quand le prompt est capturé, guide sinon', () => {
    expect(installStateFor('android', false, true)).toBe('installable');
    expect(installStateFor('android', false, false)).toBe('manual-guide');
  });

  it('déjà installé → rien à proposer, quelle que soit la plateforme', () => {
    for (const p of ['ios-safari', 'android', 'desktop', 'other'] as const) {
      expect(installStateFor(p, true, true)).toBe('installed');
      expect(shouldOfferInstall('installed')).toBe(false);
    }
  });

  it('le guide iOS nomme les 4 gestes réels (Partager → Sur l’écran d’accueil → Ajouter)', () => {
    const steps = installStepsFor('ios-safari');
    expect(steps).toHaveLength(4);
    const text = steps.map((s) => `${s.title} ${s.body}`).join(' | ');
    expect(text).toMatch(/Partager/);
    expect(text).toMatch(/écran d’accueil/);
    expect(text).toMatch(/Ajouter/);
  });

  it('le guide Android parle de « Installer l’application »', () => {
    const text = installStepsFor('android').map((s) => `${s.title} ${s.body}`).join(' | ');
    expect(text).toMatch(/Installer l’application|Ajouter à l’écran/);
  });
});
