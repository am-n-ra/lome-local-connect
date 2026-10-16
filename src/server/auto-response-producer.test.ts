import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * NR-9 — gardes de SOURCE sur le producteur automatique.
 *
 * Le module pur (`auto-response.test.ts`) prouve la DÉCISION. Ici on verrouille le BRANCHEMENT :
 * une décision correcte qui n'est jamais appelée ne produit rien (classe `rewriteGlyphUrl` :
 * un helper présent mais orphelin ressemble à un correctif en place). Ces gardes échouent si le
 * producteur disparaît, si l'acteur n'est plus déclaré, ou si la garde SQL est retirée.
 */
const REPO = readFileSync(join(process.cwd(), 'src/server/trunk-repository.ts'), 'utf8');
const HTTP = readFileSync(join(process.cwd(), 'src/server/http.ts'), 'utf8');
const MIGRATION = readFileSync(join(process.cwd(), 'db/migrations/072_v2_automation_actor.sql'), 'utf8');

describe('NR-9 · le producteur automatique est branché et honnête', () => {
  it('le producteur existe et déclare son acteur (jamais déduit d’une absence)', () => {
    expect(REPO).toContain('async respondAvailabilityAutomatically');
    // L'écriture porte l'acteur EXPLICITEMENT. Un `null, 'automation'` dans l'INSERT : le compte
    // répondant est nul PARCE QUE c'est la machine, et la colonne le dit.
    expect(REPO).toMatch(/responder_account_id, actor_kind, status[\s\S]{0,400}?null, 'automation'/);
  });

  it('la demande RÉELLE déclenche l’automate (sinon la décision serait orpheline)', () => {
    // L'appel vit au niveau de la ROUTE, à côté du drain — pas dans le dépôt, qui garde ses
    // statements séquencés et testables sans base (le stub verrouille leur nombre exact).
    const call = HTTP.indexOf('await repository.respondAvailabilityAutomatically(');
    expect(call).toBeGreaterThan(0);
    const route = HTTP.indexOf("pathname === '/api/v2/availability'");
    const drain = HTTP.indexOf('await drainWebPushBestEffort(repository)', call);
    // Appelé dans la route de création, AVANT le drain (qui doit voir la file complète).
    expect(call).toBeGreaterThan(route);
    expect(drain).toBeGreaterThan(call);
  });

  it('l’automate ne fait JAMAIS échouer la demande', () => {
    // Encadré par un try/catch : une panne de commodité ne doit pas empêcher un acheteur de
    // demander une disponibilité.
    expect(HTTP).toMatch(/try \{\s*await repository\.respondAvailabilityAutomatically\([\s\S]{0,200}?\} catch \{/);
  });

  it('la garde SQL rejoue les conditions (un appel direct ne peut pas mentir)', () => {
    // La négociation est exclue au niveau de l'ÉCRITURE, pas seulement dans le module pur.
    expect(REPO).toMatch(/r\.proposed_price_minor is null/);
    // Fraîcheur : au-delà de la fenêtre de 4 h, la machine se tait.
    expect(REPO).toMatch(/availability_expires_at > now\(\) \+ interval '4 hours'/);
    // Pro vivant (D-04 / R-4b) : lieu OU entité.
    expect(REPO).toMatch(/entitlement_kind = 'facility_pro'[\s\S]{0,300}?fe\.entity_id = coalesce\(p\.entity_id, f\.entity_id\)/);
  });

  it('la migration déclare l’acteur, l’interdit sur un compte et borne la quantité', () => {
    expect(MIGRATION).toMatch(/add column if not exists actor_kind text not null default 'seller'/);
    // C9 — l'automate n'est pas un compte.
    expect(MIGRATION).toMatch(/actor_kind <> 'automation' or responder_account_id is null/);
    // C4 — « quantité insuffisante ⇒ EXCLUE » : jamais un « disponible » sans nombre.
    expect(MIGRATION).toMatch(/actor_kind <> 'automation' or quantity_available is not null/);
    // Une seule réponse automatique par demande (l'index vendeur ne peut pas couvrir un NULL).
    expect(MIGRATION).toMatch(/create unique index if not exists v2_availability_responses_one_automation_idx[\s\S]{0,120}?where actor_kind = 'automation'/);
  });

  it('la lecture de l’origine lit l’acteur DÉCLARÉ avant de retomber sur la nullité', () => {
    // Un compte vendeur supprimé (`on delete set null`) reste `seller` : il ne devient pas une
    // machine. Le repli sur NULL ne concerne que les lignes antérieures à la migration.
    const read = REPO.indexOf("when ar.actor_kind = 'automation' then 'automation'");
    const fallback = REPO.indexOf("when ar.responder_account_id is null then 'automation'");
    expect(read).toBeGreaterThan(0);
    expect(fallback).toBeGreaterThan(read);
  });

  it('la nature de l’offre lue avant le refus porte le PRIX (sinon toute proposition est refusée)', () => {
    // Bug R-H réel, trouvé par la preuve Postgres le 2026-10-15 : la requête de nature ne
    // sélectionnait pas `price_minor`, donc `listedPriceMinor` lisait `undefined → 0` et
    // TOUTE proposition de prix était refusée (« dépasse le prix affiché »). Invisible aux tests
    // stubbés — ils ne compilent jamais le SQL (classe NW-13j / RH-02).
    expect(REPO).toMatch(/select p\.price_kind, p\.discount_kind, p\.discount_value, p\.price_minor\s+from v2_products/);
  });
});
