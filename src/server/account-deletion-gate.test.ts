import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// BRANCHES-DELETE — le refus « transaction ouverte » doit être un GATE, pas seulement un
// filtre sur le CTE final. En SQL, un data-modifying CTE s'exécute même s'il n'est pas lu :
// si le gate disparaissait, la base serait détachée/dépubliée alors que la suppression est
// censée être refusée. Ce garde tient la propriété au niveau de la source.
const source = readFileSync(resolve(__dirname, 'trunk-repository.ts'), 'utf8');

describe('account deletion — le refus est un gate SQL', () => {
  it('déclare un CTE `gate` conditionné à zéro transaction ouverte', () => {
    expect(source).toContain('gate as (');
    expect(source).toMatch(/gate as \(\s*select 1 as ok where \(select n from open_txn\) = 0\s*\)/);
  });

  it('chaque CTE destructif est conditionné par `exists (select 1 from gate)`', () => {
    for (const cte of ['archived', 'detached', 'freed_slots', 'cleared_roles', 'purged', 'purged_saved', 'purged_push', 'marked']) {
      const start = source.indexOf(`\n        ${cte} as (`);
      expect(start, `CTE ${cte} introuvable`).toBeGreaterThan(-1);
      // Borne à la fermeture du CTE (parenthèse en fin de ligne, même indentation) — une
      // fenêtre trop large laisserait fuir le gate du CTE suivant et passerait à tort.
      const end = source.indexOf('\n        ),', start);
      expect(end, `fermeture du CTE ${cte} introuvable`).toBeGreaterThan(start);
      const body = source.slice(start, end);
      expect(body, `CTE ${cte} non gardé par le gate`).toContain('exists (select 1 from gate)');
    }
  });
});
