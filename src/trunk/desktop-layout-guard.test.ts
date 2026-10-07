import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * X4 — sur desktop, la légende de carte ne doit pas partager la ligne du rail de
 * filtres. Mesuré en navigateur le 2026-10-07 : les deux étaient à `top:52`/`top:50`
 * avec `z-index:6` → la légende (« La découverte publique est temporairement
 * indisponible ») PEIGNAIT sur les chips de filtre et avalait leurs clics. Mobile
 * était correct (légende y0, chips y50) ; seul l'override desktop collisionnait.
 *
 * Ce garde verrouille le contrat : dans le bloc desktop (≥1040px), le `top` de la
 * légende est STRICTEMENT au-dessus du `top` du rail de filtres — donc les deux ne
 * peuvent plus se recouvrir, quelle que soit la valeur choisie.
 */
const css = readFileSync(new URL('./ui-v13.css', import.meta.url), 'utf8');

const px = (re: RegExp, text: string): number | null => {
  const m = re.exec(text);
  return m ? Number(m[1]) : null;
};

describe('X4 — disposition desktop : la légende ne recouvre pas le rail de filtres', () => {
  const desktopStart = css.indexOf('@media (min-width:1040px){');
  const desktopBlock = css.slice(desktopStart, css.indexOf('/* V1.3 countmark', desktopStart));

  it('le rail de filtres a un top connu (base)', () => {
    const railTop = px(/\.filterrail\{[^}]*\btop:(\d+)px/, css);
    expect(railTop).not.toBeNull();
  });

  it('la légende desktop est au-dessus du rail de filtres (jamais la même ligne)', () => {
    const railTop = px(/\.filterrail\{[^}]*\btop:(\d+)px/, css);
    // dans le bloc desktop, la règle `.map-legend{top:Npx;...}` (dernière déclarée gagne)
    const legendTop = px(/\.map-legend\{top:(\d+)px;left:80px\}/, desktopBlock);
    expect(legendTop, 'la légende desktop doit déclarer un top explicite').not.toBeNull();
    if (railTop === null || legendTop === null) throw new Error('top introuvable');
    expect(legendTop, `légende top=${legendTop} doit être < rail top=${railTop}`).toBeLessThan(railTop);
  });
});
