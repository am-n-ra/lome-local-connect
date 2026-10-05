import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * UI-5 — pas de dialogue natif (`alert`/`confirm`).
 *
 * `window.alert` bloque le fil et n'est pas thémé ; `window.confirm` idem et
 * n'est pas annoncé a11y. L'app a `toast` + `cardbox` pour ça. Un dialogue
 * natif qui revient doit casser ce garde.
 */
const TRUNK = resolve(process.cwd(), 'src/trunk');
// `alert(`/`confirm(` nus, ou via window., mais pas `setConfirm`, `.confirm(` d'une lib, etc.
const NATIVE = /(?<![.\w])(alert|confirm)\s*\(|window\.(alert|confirm)\s*\(/g;

function nativeDialogs(source: string): string[] {
  return [...source.matchAll(NATIVE)].map((m) => m[0].trim());
}

describe('UI-5 — pas de dialogue natif dans src/trunk', () => {
  it('aucun alert/confirm natif', () => {
    const offenders = readdirSync(TRUNK)
      .filter((f) => (f.endsWith('.tsx') || f.endsWith('.ts')) && !f.includes('.test.'))
      .flatMap((f) => {
        const hits = nativeDialogs(readFileSync(resolve(TRUNK, f), 'utf8'));
        return hits.map((h) => `${f}: ${h}`);
      });
    expect(offenders).toEqual([]);
  });

  it('le garde sait échouer (auto-falsification)', () => {
    expect(nativeDialogs('window.alert("x")')).toEqual(['window.alert(']);
    expect(nativeDialogs('if (!window.confirm("y")) return;')).toEqual(['window.confirm(']);
    expect(nativeDialogs('alert("bare")')).toEqual(['alert(']);
    expect(nativeDialogs('const [confirm, setConfirm] = useState(null);')).toEqual([]);
    expect(nativeDialogs('setConfirm({ text }); confirm.run();')).toEqual([]);
    expect(nativeDialogs('reconfirm(x)')).toEqual([]);
  });
});
