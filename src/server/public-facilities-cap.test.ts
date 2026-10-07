import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// D-MAP-1 (fondateur 2026-10-07) : la découverte est plafonnée PAR FENÊTRE.
// Régression mesurée : `limit 250` absolu ne montrait que 250 lieux au centre
// d'une vue ville (Lomé : 5 992 réels → 4 %). Garde : la requête publique doit
// référencer la constante nommée, jamais un `limit 250` codé en dur.

const SOURCE = readFileSync(resolve(__dirname, 'trunk-repository.ts'), 'utf8');

describe('plafond de découverte publique = constante par fenêtre, pas un 250 en dur', () => {
  it('déclare PUBLIC_FACILITIES_WINDOW_LIMIT à 2000', () => {
    expect(SOURCE).toMatch(/const PUBLIC_FACILITIES_WINDOW_LIMIT = 2000;/);
  });

  it('la requête publique utilise la constante, pas un littéral 250', () => {
    expect(SOURCE).toMatch(/limit \$\{PUBLIC_FACILITIES_WINDOW_LIMIT\}/);
    // aucun `limit 250` exécutable ne doit subsister (le commentaire peut le citer)
    const executable = SOURCE.split('\n').filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*') && !l.includes('ancien')).join('\n');
    expect(executable).not.toMatch(/limit 250/);
  });
});
