import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// S3-a (S-16, décision S3-0 = A + B) : le numéro est DÉCLARÉ, jamais « vérifié ».
// Le fait central du contrat `omni-heartwood-s3-phone-free-contract-2026-10-07.md` :
// une vérification de numéro GRATUITE ne peut pas prouver le contrôle du numéro. Le
// produit ne doit donc JAMAIS présenter le numéro comme vérifié. Garde de source.

const PHONE = readFileSync(resolve(__dirname, '../domain/phone.ts'), 'utf8');
const APP = readFileSync(resolve(__dirname, 'TrunkAppV13.tsx'), 'utf8');

describe('le numéro déclaré n’est jamais présenté comme vérifié (S-16)', () => {
  it('le libellé public ne dit pas « vérifié »', () => {
    const label = PHONE.slice(PHONE.indexOf('export function phoneDeclarationLabel'), PHONE.indexOf('export function phoneDeclarationLabel') + 120);
    expect(label).toContain('Déclaré');
    expect(label).not.toMatch(/v[ée]rifi/i);
  });

  it('la carte Compte étiquette la déclaration comme non confirmée', () => {
    expect(APP).toContain('phoneDeclarationLabel()');
    expect(APP).toMatch(/Omni ne vérifie pas ce numéro/);
  });

  it('le lien WhatsApp n’est jamais décrit comme une vérification', () => {
    // la libellé du lien dit « Confirmer sur WhatsApp », pas « vérifier ».
    const anchor = APP.slice(APP.indexOf('whatsappDeclareLink('), APP.indexOf('whatsappDeclareLink(') + 200);
    expect(anchor).not.toMatch(/v[ée]rifi/i);
  });

  it('l’API renvoie explicitement declaration: declared_unverified', () => {
    const HTTP = readFileSync(resolve(__dirname, '../server/http.ts'), 'utf8');
    expect(HTTP).toContain('declared_unverified');
  });
});
