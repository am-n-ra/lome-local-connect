// BRANCHES (2026-10-07) — founder report #2.
//
// Three defects reached production and none had a guard:
//
//   1. A selected bulk facility drew a WHITE checkmark on a light box:
//      `.pitem .chk` set `color:#fff` while the row never applied `.sel`/`.on`,
//      so `.chk` stayed on its default (light) background and the tick vanished.
//   2. `.textbtn` ("Tout cocher", "Aucune", "Rechargez en packs") declared no
//      font-size, so it rendered at the 16px browser default inside 8.5px rows.
//   3. `.lead` (used across many sheets) and `.iconbtn` (Welcome sheet close) had
//      NO rule at all — paragraphs and the close button fell back to browser defaults.
//
// The CSS half is measured directly with a real browser elsewhere; these checks are
// the cheap CI oracle for the same contract. They are falsifiable in both directions:
// restore any defect and the matching assertion fails.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const CSS = readFileSync(new URL('./ui-v13.css', import.meta.url), 'utf8');
const APP = readFileSync(new URL('./TrunkAppV13.tsx', import.meta.url), 'utf8');
const FLOW = readFileSync(new URL('./BuyerFlowV13.tsx', import.meta.url), 'utf8');

const rule = (selector: string): string => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = CSS.match(new RegExp(`(^|[},])\\s*${escaped}\\s*\\{([^}]*)\\}`, 'm'));
  return match ? match[2] : '';
};

describe('BRANCHES CSS contract', () => {
  it('keeps a selected facility tick visible (ink on light, white on ink)', () => {
    const base = rule('.pitem .chk');
    expect(base, '.pitem .chk rule must exist').not.toBe('');
    expect(base, '.pitem .chk must not paint the tick white on a light box').not.toMatch(/color\s*:\s*#fff/i);
    const sel = rule('.pitem.sel .chk');
    expect(sel, '.pitem.sel .chk must restore white on the filled box').toMatch(/color\s*:\s*#fff/i);
  });

  it('sizes text buttons inside the sheet type scale', () => {
    expect(rule('.textbtn'), '.textbtn must declare its own font-size').toMatch(/font-size\s*:/i);
  });

  it('defines .lead and .iconbtn instead of falling back to browser defaults', () => {
    expect(rule('.lead'), '.lead rule must exist').not.toBe('');
    expect(rule('.iconbtn'), '.iconbtn rule must exist').not.toBe('');
  });
});

describe('BRANCHES behaviour contract', () => {
  it('reflects bulk selection on the row, not only inside the checkbox', () => {
    expect(APP).toMatch(/className=\{`pitem\$\{selected \? ' sel' : ''\}`\}/);
    expect(APP).toMatch(/className=\{`chk\$\{selected \? ' on' : ''\}`\}/);
  });

  it('reopens a buyer availability request instead of the vendor sheet', () => {
    expect(APP).toContain('resumeAvailabilityRequest(');
    // The request row must drive the resume, not handlePinSelect directly.
    expect(APP).toMatch(/onClick=\{\(\) => resumeAvailabilityRequest\(/);
  });

  it('sends “Historique des transactions” to the finished section', () => {
    expect(APP).toContain("openHome('historique')");
  });

  it('lets the buyer flow resume a pending availability request', () => {
    expect(FLOW).toContain('resumeRequestId');
    expect(FLOW).toMatch(/if \(!resumeRequestId\) return;/);
  });
});

describe('BRANCHES-QUANTITY (founder report #3) — le champ quantité est effaçable', () => {
  it('keeps the quantity field a free string, clamped only at use', () => {
    // Le state est une chaîne : l'utilisateur peut vider le champ pour retaper.
    expect(FLOW).toContain("const [quantity, setQuantity] = useState('1')");
    // La valeur utilisée est clampée (jamais 0/NaN qui partirait au serveur).
    expect(FLOW).toMatch(/const quantityValue = Math\.max\(1, Math\.floor\(Number\(quantity\) \|\| 1\)\)/);
    // Le champ n'impose plus `Math.max(1, …)` à la frappe (bug : champ non effaçable).
    expect(FLOW).not.toMatch(/onChange=\{\(event\) => setQuantity\(Math\.max\(1, Number\(event\.target\.value \|\| 1\)\)\)\}/);
  });
});

describe('BRANCHES-NAV-MEMORY (founder report #3) — la mémoire survit à la fermeture', () => {
  it('persists the surface in localStorage (survives closing the tab/PWA)', () => {
    // Le cas visé est « fermer Omni puis le rouvrir » : sessionStorage serait vidé.
    expect(APP).toMatch(/window\.localStorage\.setItem\(NAV_STATE_STORAGE_KEY/);
    expect(APP).toMatch(/window\.localStorage\.getItem\(NAV_STATE_STORAGE_KEY\)/);
    expect(APP).not.toMatch(/window\.sessionStorage\.(get|set)Item\(NAV_STATE_STORAGE_KEY/);
  });
});

describe('BRANCHES-FEDAPAY (founder report #4) — pas de boucle retour vers le paiement', () => {
  it('records the history length before leaving Omni, and skips back on return', () => {
    // Le départ vers le paiement note la longueur d'historique (clé de session, survit au retour).
    expect(APP).toContain("const EXT_REDIRECT_KEY = 'omni-ext-redirect-len'");
    expect(APP).toMatch(/window\.sessionStorage\.setItem\(EXT_REDIRECT_KEY, String\(window\.history\.length\)\)/);
    // Au retour (callback `?wallet=recharge`), on saute les entrées externes.
    expect(APP).toMatch(/window\.history\.go\(-skip\)/);
    expect(APP).toMatch(/shouldSkipExternalRedirect\(skip\)/);
    // Le départ passe par `goToCheckout` (plus de `location.assign` direct qui perdrait la mesure).
    expect(APP).toMatch(/const goToCheckout = useCallback/);
    expect(APP).not.toMatch(/window\.location\.assign\(result\.data\.checkoutUrl\)/);
    expect(APP).not.toMatch(/window\.location\.assign\(rechargeResult\.checkoutUrl\)/);
  });
});
