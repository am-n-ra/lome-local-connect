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
const KNOWN_DORMANT: Record<string, string> = {
  subscribeWebPush: 'Web Push — docs/push-operations.md : partial / configuration-gated (VAPID + provider non configurés)',
  getWebPushStatus: 'Web Push — même dette déclarée',
  revokeWebPush: 'Web Push — même dette déclarée',
  getOperatorRuns: 'surface opérateur sans UI (le terrain arrive en dernier)',
  importPublicFacility: 'outil d’import admin sans UI (l’import se fait par script serveur)',
  importPublicFacilityBatch: 'outil d’import admin sans UI (l’import se fait par script serveur)',
  getSellerActivationQueue: 'doublon : AdminV13 utilise getAdminSellerActivationQueue',
  getBuyerProRenewalStatus: 'doublon : BuyerFlowV13 utilise getBuyerProStatus',
};

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
