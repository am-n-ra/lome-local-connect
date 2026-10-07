import { describe, expect, it } from 'vitest';
import { entityQrPayload, parseEntityIdFromQr } from './entity-qr';

/**
 * Heartwood S1b (S-21) — le QR public d'entité a UNE définition, partagée par le rendu vendeur
 * et le scanner acheteur. Si le producteur et le décodeur divergeaient, un QR scannable ne
 * résoudrait plus — c'est exactement le défaut que S1 a appris à mesurer.
 */
const ENTITY = 'c5975d63-9c7c-4974-ba50-beb92e6b4924';

describe('Heartwood S1b — payload du QR public d’entité', () => {
  it('encode `?entity=<uuid>` sur l’origine servie', () => {
    expect(entityQrPayload(ENTITY, 'https://omni.sparkafrika.online')).toBe(
      `https://omni.sparkafrika.online/?entity=${ENTITY}`,
    );
  });

  it('tolère un slash final sans doubler', () => {
    expect(entityQrPayload(ENTITY, 'https://omni.sparkafrika.online/')).toBe(
      `https://omni.sparkafrika.online/?entity=${ENTITY}`,
    );
  });

  it('round-trip : ce que le vendeur encode, l’acheteur le relit', () => {
    const payload = entityQrPayload(ENTITY, 'https://omni.sparkafrika.online');
    expect(parseEntityIdFromQr(payload)).toBe(ENTITY);
  });

  it('relit aussi un uuid brut et un fragment `entity=`', () => {
    expect(parseEntityIdFromQr(ENTITY)).toBe(ENTITY);
    expect(parseEntityIdFromQr(`?entity=${ENTITY}`)).toBe(ENTITY);
    expect(parseEntityIdFromQr(`https://x.test/?entity=${ENTITY}#top`)).toBe(ENTITY);
  });

  it('ne confond PAS une entité avec une facilité (paramètres distincts)', () => {
    // Un QR facility (`?facility=`) ne doit pas être lu comme une entité — sinon un scan de lieu
    // ouvrirait la mauvaise page.
    expect(parseEntityIdFromQr(`https://x.test/?facility=${ENTITY}`)).toBeNull();
    expect(parseEntityIdFromQr('pas un uuid')).toBeNull();
    expect(parseEntityIdFromQr('')).toBeNull();
  });
});
