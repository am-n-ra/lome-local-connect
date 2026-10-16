import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { entityQrPayload, parseEntityIdFromQr } from './entity-qr';

/**
 * S-21 — le QR public d'entité encode une URL (`<origin>/?entity=<uuid>`). Cette URL est
 * faite pour être scannée par l'APPAREIL PHOTO NATIF (« affichez-le en boutique »), pas
 * seulement par le scanner in-app. Sans handler de `?entity=`, un client qui scanne le QR
 * affiché atterrit sur la carte vide : le QR encode un lien que personne ne lit.
 *
 * Ce garde verrouille le MAILLON produit (l'app gère le paramètre) ET la FORME du lien
 * (ce que le vendeur encode), pour qu'ils ne puissent pas diverger.
 */
describe('S-21 — le deep-link du QR public d’entité est branché ET résolu par l’app', () => {
  const app = readFileSync(new URL('./TrunkAppV13.tsx', import.meta.url), 'utf8');

  it('l’app lit le paramètre `entity` de l’URL et ouvre la page entité', () => {
    expect(app).toContain("params.get('entity')");
    expect(app).toContain('parseEntityIdFromQr');
    expect(app).toContain('openEntity(');
  });

  it('le paramètre est validé (jamais ouvert sur une valeur non-uuid)', () => {
    // Le garde est `if (!entityId || !parseEntityIdFromQr(entityId)) return;`
    const block = app.slice(app.indexOf("params.get('entity')"));
    expect(block.slice(0, 220)).toContain('parseEntityIdFromQr');
  });

  it('le lien que le vendeur encode est bien celui que l’app sait résoudre', () => {
    const payload = entityQrPayload('c5975d63-9c7c-4974-ba50-beb92e6b4924', 'https://omni.sparkafrika.online');
    const url = new URL(payload);
    expect(url.searchParams.get('entity')).not.toBeNull();
    expect(parseEntityIdFromQr(payload)).toBe('c5975d63-9c7c-4974-ba50-beb92e6b4924');
    // L'app doit lire ce MÊME paramètre.
    expect(app).toContain("params.get('entity')");
  });
});
