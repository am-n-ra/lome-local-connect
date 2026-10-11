import { describe, expect, it } from 'vitest';
import { normalizeTogoPhone, phoneDeclarationLabel, whatsappDeclareLink } from './phone';

describe('normalizeTogoPhone', () => {
  it('accepte un numéro Togo complet +228 et le canonise', () => {
    expect(normalizeTogoPhone('+228 90 12 34 56')).toBe('+22890123456');
    expect(normalizeTogoPhone('22890123456')).toBe('+22890123456');
  });

  it('accepte une saisie locale à 8 chiffres et préfixe +228', () => {
    expect(normalizeTogoPhone('90 12 34 56')).toBe('+22890123456');
  });

  it('rejette ce qui n’est pas un numéro Togo plausible', () => {
    expect(normalizeTogoPhone('')).toBeNull();
    expect(normalizeTogoPhone('abc')).toBeNull();
    expect(normalizeTogoPhone('12345')).toBeNull();
    expect(normalizeTogoPhone('+33612345678')).toBeNull();
  });
});

describe('honnêteté du libellé et du lien', () => {
  it('le libellé nie la vérification, il ne la revendique jamais', () => {
    const label = phoneDeclarationLabel();
    // « Non vérifié » : la seule forme honnête. Ce qui est interdit, c'est de
    // PRÉTENDRE une vérification (« Vérifié », « Déclaré · vérifié »).
    expect(label).toMatch(/^non v[ée]rifi[ée]/i);
    expect(label).not.toMatch(/^(v[ée]rifi[ée]|d[ée]clar[ée]\s*\u00b7\s*v[ée]rifi)/i);
  });

  it('le lien wa.me ne prétend pas vérifier et encode le message', () => {
    const link = whatsappDeclareLink('+22890123456', 'OMNI-123');
    expect(link.startsWith('https://wa.me/')).toBe(true);
    expect(decodeURIComponent(link)).toContain('OMNI-123');
    expect(link).not.toMatch(/verif/i);
  });

  it('adresse le message au numéro Omni quand il est fourni', () => {
    const link = whatsappDeclareLink('+22890123456', 'OMNI-123', '+22899999999');
    expect(link.startsWith('https://wa.me/22899999999')).toBe(true);
  });
});
