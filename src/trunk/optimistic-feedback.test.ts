// BRANCHES (2026-10-07) — retour visuel immédiat (optimiste).
//
// Le fondateur : « on ne faisait pas de feedback visuel automatique… il y a certaines
// choses où on peut changer l'état visuel avant que le backend ne rattrape ».
//
// Ces bascules attendaient la réponse serveur AVANT de bouger : l'utilisateur tapait
// une étoile / un ON-OFF et rien ne se passait pendant un aller-retour réseau. Le
// contrat est désormais : **l'état visuel change AU TAP**, et **revient** si l'appel
// échoue — jamais d'état optimiste qui persiste un mensonge.
//
// Le test est falsifiable : retirer le « set avant l'await » d'une bascule le fait échouer.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const APP = readFileSync(new URL('./TrunkAppV13.tsx', import.meta.url), 'utf8');
const SELLER = readFileSync(new URL('./SellerV13.tsx', import.meta.url), 'utf8');

/** Extrait le corps d'une fonction fléchée par son nom jusqu'à la prochaine déclaration de même niveau. */
function body(source: string, marker: string): string {
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`marker not found: ${marker}`);
  const rest = source.slice(start);
  const end = rest.search(/\n  const |\n  }\n/);
  return end < 0 ? rest : rest.slice(0, end);
}

/** Vrai si `first` apparaît avant `second` dans le texte. */
const before = (text: string, first: string, second: string): boolean => {
  const a = text.indexOf(first);
  const b = text.indexOf(second);
  return a >= 0 && b >= 0 && a < b;
};

describe('retour visuel immédiat (optimiste)', () => {
  it('étoile favori : bascule au tap, avant l’appel réseau', () => {
    const b = body(APP, 'const toggleFavorite = useCallback');
    expect(before(b, 'setStar(!isStarred)', 'await addFavorite')).toBe(true);
    expect(before(b, 'setStar(!isStarred)', 'await removeFavorite')).toBe(true);
    // et revient si l'appel échoue
    expect(b).toMatch(/setStar\(isStarred\)/);
  });

  it('renouvellement acheteur Pro : bascule au tap, avant l’appel réseau', () => {
    const b = body(APP, 'const toggleBuyerProRenewal = useCallback');
    expect(before(b, 'renewalOptIn: next', 'await setBuyerProRenewalOptIn')).toBe(true);
    expect(b).toMatch(/renewalOptIn: previous/);
  });

  it('état opérationnel vendeur (ON/OFF) : bascule au tap, avant l’appel réseau', () => {
    const b = body(SELLER, 'const toggleOpState = useCallback');
    expect(before(b, 'setOpStateOverride(next)', 'await setSellerFacilityOperationalState')).toBe(true);
    expect(b).toMatch(/setOpStateOverride\(previous\)/);
  });

  it('renouvellement vendeur : bascule au tap, avant l’appel réseau', () => {
    const b = body(SELLER, 'const toggleRenewalOptIn = useCallback');
    expect(before(b, 'renewalOptIn: next', 'await setFacilityRenewalOptIn')).toBe(true);
    expect(b).toMatch(/renewalOptIn: previous/);
  });

  it('disponibilité automatique : badge au tap, avant l’appel réseau', () => {
    const b = body(SELLER, 'const toggleAuto = useCallback');
    expect(before(b, 'setAutoOverride', 'await setProductAutoAvailability')).toBe(true);
    // et le badge affiché lit l'override
    expect(SELLER).toMatch(/const autoOn = autoOverride\[p\.id\] \?\? p\.autoAvailability/);
  });

  it('notification : marquée lue au tap, sans bloquer la navigation', () => {
    const b = body(APP, 'const openNotification = useCallback');
    // le marquage local précède l'appel réseau, qui n'est plus attendu
    expect(before(b, 'setNotifs(', 'markNotificationSeen')).toBe(true);
    expect(b).not.toMatch(/await markNotificationSeen/);
  });
});
