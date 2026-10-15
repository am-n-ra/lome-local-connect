import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * BRANCHES-NOTIF-DRAIN — un producteur qui met en file sans dépiler ne notifie personne.
 *
 * `drainWebPushBestEffort` est le seul endroit qui envoie réellement le push. Les routes
 * de TRANSACTION l'appelaient (FF-7) ; les routes de DISPONIBILITÉ, de REVENDICATION et
 * d'ACTIVATION l'avaient oublié : la livraison `web_push` restait `queued` jusqu'au cron
 * quotidien — donc jamais, en pratique (le fondateur : « la 2ᵉ demande n'a produit aucune
 * notification »). La file est ordonnée par `created_at`, donc un ancien envoi bloqué
 * bouchait aussi les suivants.
 *
 * Ce garde est GÉNÉRIQUE : il découvre lui-même les méthodes du dépôt qui écrivent dans
 * `v2_notification_events`, puis exige que CHAQUE appel de ces méthodes depuis `http.ts`
 * soit suivi d'un drain avant de répondre. Une nouvelle route productrice est donc couverte
 * sans rien ajouter ici. La moitié SQL réelle vit dans `scripts/prove-branches-notif-drain.mjs`.
 */
const http = readFileSync(new URL('../server/http.ts', import.meta.url), 'utf8');
const repository = readFileSync(new URL('../server/trunk-repository.ts', import.meta.url), 'utf8');

/** Noms des méthodes du dépôt qui écrivent un événement de notification. */
function notificationProducerMethods(): string[] {
  const names = new Set<string>();
  const re = /async\s+([A-Za-z0-9_]+)\s*\(/g;
  let match: RegExpExecArray | null;
  const starts: Array<{ name: string; index: number }> = [];
  while ((match = re.exec(repository)) !== null) starts.push({ name: match[1], index: match.index });
  for (let i = 0; i < starts.length; i += 1) {
    const body = repository.slice(starts[i].index, starts[i + 1]?.index ?? repository.length);
    if (body.includes('insert into v2_notification_events')) names.add(starts[i].name);
  }
  return [...names];
}

describe('BRANCHES-NOTIF-DRAIN — toute route qui notifie dépile la file Web Push', () => {
  const producers = notificationProducerMethods();

  it('le garde trouve bien des producteurs (sinon il ne prouve rien)', () => {
    // Si ce nombre tombe à 0, le parseur est cassé, pas le produit.
    expect(producers.length).toBeGreaterThanOrEqual(5);
    expect(producers).toContain('createAvailabilityRequest');
    expect(producers).toContain('respondAvailability');
  });

  it('chaque appel d’une méthode productrice est suivi d’un drain avant la réponse', () => {
    const violations: string[] = [];
    for (const method of producers) {
      const call = `repository.${method}(`;
      let from = http.indexOf(call);
      while (from !== -1) {
        // Entre l'appel et la prochaine réponse `json(res,` : le drain doit être présent.
        const respondAt = http.indexOf('json(res,', from);
        const window = http.slice(from, respondAt === -1 ? from + 400 : respondAt);
        if (!window.includes('drainWebPushBestEffort(repository)')) {
          violations.push(`${method} @${from}`);
        }
        from = http.indexOf(call, from + 1);
      }
    }
    expect(violations, `routes productrices sans drain : ${violations.join(', ')}`).toEqual([]);
  });
});

