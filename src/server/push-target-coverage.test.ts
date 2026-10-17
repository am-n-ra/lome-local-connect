import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { pushMessageFor } from './web-push';

/**
 * Un push dont la cible n'est pas profonde atterrit sur l'Inbox générique — le tap
 * n'ouvre pas la surface qui a alerté. Aujourd'hui c'est correct (seuls `transaction`
 * et `availability_request` sont poussés, tous deux ciblés). Le risque est LATENT :
 * ajouter un `web_push` sur un `entity_type` non ciblable dégraderait le tap en silence.
 *
 * Ce garde verrouille l'invariant : pour chaque méthode du dépôt qui crée une livraison
 * `web_push`, l'événement qui l'alimente doit avoir une cible profonde.
 */
const source = readFileSync(new URL('./trunk-repository.ts', import.meta.url), 'utf8');

/** Un PRODUCTEUR écrit une livraison `web_push` ; un lecteur la relit. On ne garde que
 *  les inserts, sinon `listPendingPushDeliveries` (qui lit la file) serait compté à tort. */
function isWebPushProducer(body: string): boolean {
  return /insert into v2_notification_deliveries[\s\S]{0,200}'web_push'/.test(body);
}

function methodBodies(): Array<{ name: string; body: string }> {
  const names = [...source.matchAll(/\n\s+async (\w+)\(/g)].map((m) => ({ name: m[1]!, at: m.index! }));
  return names.map((n, i) => ({
    name: n.name,
    body: source.slice(n.at, i + 1 < names.length ? names[i + 1]!.at : source.length),
  }));
}

describe('la cible du push est profonde pour CHAQUE producteur de web_push', () => {
  it('au moins un producteur web_push existe (sinon le garde ne mesure rien)', () => {
    const withPush = methodBodies().filter((m) => isWebPushProducer(m.body));
    expect(withPush.length).toBeGreaterThan(0);
  });

  it('chaque événement poussé produit un deep-link (jamais `/?notifs=1` nu)', () => {
    const failures: string[] = [];
    for (const { name, body } of methodBodies()) {
      if (!isWebPushProducer(body)) continue;
      // Les paires (event_type, entity_type) écrites dans v2_notification_events.
      const pairs = [...body.matchAll(/'([a-z_]+)',\s*'(transaction|availability_request|saved_search)'/g)];
      expect(pairs.length, `${name} pousse sans événement identifiable`).toBeGreaterThan(0);
      for (const [, eventType, entityType] of pairs) {
        const url = pushMessageFor({ kind: eventType }, { entityType, entityId: 'x' }).url;
        if (url === '/?notifs=1') failures.push(`${name}: ${eventType}/${entityType} → Inbox`);
      }
    }
    expect(failures, `push non ciblé : ${failures.join(' ; ')}`).toEqual([]);
  });
});
