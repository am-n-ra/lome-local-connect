import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Phase C (HO-OMNI-29) — le shell PWA reste installable et honnête :
 *   1. Le SW précache la page offline et la sert aux navigations sans réseau
 *      (jamais de page blanche) ; les versions précédentes sont purgées.
 *   2. `/api/*` passe en réseau seul : une API hors-ligne échoue honnêtement,
 *      jamais du HTML 200 déguisé (prouvé PWA-3-api-offline).
 *   3. Le manifest ne déclare que des icônes qui existent, aux tailles
 *      annoncées (mesuré : les `sizes` mentait — 192/512 pour du 512/1254).
 *   4. Le dock tactile tient le minimum iOS (44px) sur mobile ET desktop
 *      (même règle `.navpill button`).
 *
 * La preuve comportementale vit dans `scripts/probe-pwa-rsp.mjs` (5/5 PASS
 * prod le 2026-10-04) ; ce garde verrouille le source contre la régression.
 */
const sw = readFileSync(new URL('../../public/sw.js', import.meta.url), 'utf8');
const manifest = JSON.parse(readFileSync(new URL('../../public/manifest.webmanifest', import.meta.url), 'utf8'));
const css = readFileSync(new URL('./ui-v13.css', import.meta.url), 'utf8');

describe('Phase C — shell PWA installable et dégradé honnête', () => {
  it('précache la page offline et la sert aux navigations sans réseau', () => {
    const shellStart = sw.indexOf('APP_SHELL = [');
    const shellEnd = sw.indexOf("'];", shellStart);
    expect(shellStart).toBeGreaterThan(-1);
    expect(shellEnd).toBeGreaterThan(shellStart);
    const shellLine = sw.slice(shellStart, shellEnd);
    expect(shellLine).toContain("'/offline.html'");
    expect(sw).toContain("caches.match('/offline.html')");
    expect(sw).toContain('omni-shell-v3');
  });

  it('laisse /api/* en réseau seul, sans repli cache', () => {
    expect(sw).toContain("startsWith('/api/')");
    const apiBlock = sw.slice(sw.indexOf("startsWith('/api/')"), sw.indexOf("startsWith('/api/')") + 120);
    expect(apiBlock).not.toContain('caches.match');
  });

  it('ne déclare que des icônes existantes (tailles annoncées présentes au nom)', () => {
    for (const icon of manifest.icons as Array<{ src: string; sizes: string }>) {
      const file = icon.src.replace(/^\//, '../../public/');
      expect(existsSync(new URL(file, import.meta.url)), icon.src).toBe(true);
      const size = Number(icon.sizes.split('x')[0]);
      expect(icon.src).toContain(String(size));
    }
  });

  it('le dock tactile tient 44px', () => {
    expect(css).toContain('.navpill button{width:44px;height:44px;');
  });

  // Heartwood — le préalable du Web Push sur iOS est l'installation à l'écran
  // d'accueil ; la couche doit rester câblée (menu + feuille), pas redevenir un
  // fichier orphelin comme `gateRequest` l'a été.
  it('la couche « ajouter à l’écran d’accueil » reste câblée dans l’app', () => {
    const app = readFileSync(new URL('./TrunkAppV13.tsx', import.meta.url), 'utf8');
    expect(app).toContain("beforeinstallprompt");
    expect(app).toContain("appinstalled");
    expect(app).toContain("openInstall");
    expect(app).toContain("shouldOfferInstall(installState)");
    expect(app).toContain("data-sheet=\"install\"");
    expect(app).toContain("Installer Omni");
  });
});
