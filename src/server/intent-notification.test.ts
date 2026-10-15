import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * NR-4 — l'intention d'achat NOTIFIE le vendeur.
 *
 * Défaut mesuré : `createPurchaseIntent` n'écrivait AUCUNE notification
 * (`grep v2_notification_events` sur la fonction → 0). Entre l'intention et le scan,
 * le vendeur ne savait rien, alors que S-27 dit que « la demande de dispo est maintenant
 * une intention d'achat » et qu'il doit pouvoir l'ouvrir depuis son dashboard.
 *
 * Ce garde est STATIQUE (lecture de source) : il vérifie le contrat là où il vit, sans
 * base. Le comportement réel est prouvé séparément contre Postgres (branche jetable).
 */
const repo = readFileSync(resolve(__dirname, 'trunk-repository.ts'), 'utf8');

function functionBody(name: string): string {
  const start = repo.indexOf(`async ${name}(`);
  expect(start, `${name} introuvable`).toBeGreaterThan(-1);
  // La fonction se termine au prochain `\n    async ` de même profondeur.
  const rest = repo.slice(start + 10);
  const end = rest.search(/\n    async /);
  return end === -1 ? rest : rest.slice(0, end);
}

describe('NR-4 — createPurchaseIntent notifie le vendeur', () => {
  const body = functionBody('createPurchaseIntent');

  it('écrit un événement de notification destiné au VENDEUR', () => {
    expect(body).toContain('v2_notification_events');
    // L'événement doit être écrit dans la COLONNE event_type (position 2 du select),
    // pas simplement mentionné quelque part — sinon neutraliser le type passerait.
    expect(body).toMatch(/'transaction_intent_created', 'transaction',/);
    // La cible est le compte vendeur issu de la réponse (f.account_id).
    expect(body).toMatch(/seller_account_id/);
  });

  it('crée la livraison in_app ET la livraison web_push conditionnelle', () => {
    expect(body).toContain('v2_notification_deliveries');
    expect(body).toContain("'in_app'");
    expect(body).toContain("'web_push'");
    expect(body).toContain('v2_web_push_subscriptions');
  });

  it('est idempotent : la clé de déduplication porte l’id de transaction', () => {
    expect(body).toContain('dedupe_key');
    expect(body).toMatch(/on conflict \(recipient_account_id, dedupe_key\) do nothing/);
  });

  it('ne notifie QUE sur une intention réellement créée (pas un rejeu)', () => {
    // Le producteur doit consommer `fresh_intent`, jamais `intent_upsert` (qui
    // contient aussi la ligne retrouvée d'un replay idempotent). On scoping la
    // vérification au CTE `seller_targets` : `product_reserve` utilise AUSSI
    // `fresh_intent`, donc un test sur toute la fonction passerait à tort.
    const targets = body.slice(body.indexOf('seller_targets as ('), body.indexOf('intent_notified as ('));
    expect(targets).toMatch(/from fresh_intent fi/);
    expect(targets).not.toMatch(/from intent_upsert/);
  });
});
