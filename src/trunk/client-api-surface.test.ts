import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Classe « gateRequest » (Heartwood) : une capacité construite mais JAMAIS câblée.
// `gateRequest` (mémoriser l'action avant connexion) existait et était correct — mais
// appelé d'un seul endroit, donc 39 autres actions gardées ne reprenaient rien.
// Ce garde détecte la même classe au niveau le plus risqué : une fonction d'API CLIENT
// exportée sans AUCUN appelant produit (UI) → la surface n'existe pas pour l'utilisateur.
// L'appelant peut légitimement être un TEST ; c'est pourquoi on ne regarde que le produit.

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(p) && !/\.test\./.test(p) && !/\.d\.ts$/.test(p)) out.push(p);
  }
  return out;
}

// Endettements ASSUMÉS et documentés, hors périmètre tant qu'une décision fondateur ne
// les ouvre pas. Toute autre entrée fait ÉCHOUER le garde (sinon la classe se re-crée).
// 2026-10-07 (décision fondateur « allons avec les clients UI ») : les 3 dormantes sont TRAITÉES.
// RETIRÉES (doublons dont le jumeau canonique est déjà câblé) : getSellerActivationQueue
// (route legacy `reviewer=seller-activations`) ; getBuyerProRenewalStatus (route legacy
// `buyer/pro/renewal-status`) ; importPublicFacility (singulier — superseded by batch-of-one).
// CÂBLÉES (console d'import admin, `AdminImportConsole`) : importPublicFacilityBatch + getOperatorRuns.
const KNOWN_DORMANT: Record<string, string> = {};

describe('classe gateRequest — surface d’API client réellement câblée', () => {
  const files = walk(join(process.cwd(), 'src')).filter((f) => !f.endsWith(join('trunk', 'api.ts')));
  const apiSrc = readFileSync(join(process.cwd(), 'src/trunk/api.ts'), 'utf8');
  const exported = [...apiSrc.matchAll(/export async function ([a-zA-Z0-9_]+)/g)].map((m) => m[1]);

  it('chaque fonction d’API exportée a un appelant produit, ou est déclarée dormante', () => {
    const dead: string[] = [];
    for (const name of exported) {
      let prod = 0;
      for (const f of files) {
        const s = readFileSync(f, 'utf8');
        const m = s.match(new RegExp(`\\b${name}\\b`, 'g'));
        if (m) prod += m.length;
      }
      if (prod === 0 && !(name in KNOWN_DORMANT)) dead.push(name);
    }
    expect(dead, `surfaces construites mais jamais câblées : ${dead.join(', ')}`).toEqual([]);
  });

  it('l’allow-list ne survit pas à la disparition de sa fonction (pas de dette fantôme)', () => {
    for (const name of Object.keys(KNOWN_DORMANT)) {
      expect(exported, `${name} n’est plus exportée — retirer l’entrée`).toContain(name);
    }
  });
});
