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
