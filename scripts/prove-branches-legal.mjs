import { chromium } from 'playwright';

// BRANCHES — preuve navigateur : (1) la création de compte exige le Prénom et le
// consentement, (2) les liens Confidentialité / Conditions ouvrent une vraie feuille
// légale, (3) la feuille légale est atteignable depuis le menu.
// Le compte n'est PAS créé : on n'écrit rien en base, on ne consomme aucune donnée.
const BASE = process.env.APP_URL || 'http://localhost:3000';
const WIDTHS = [390, 1280];

const b = await chromium.launch({ headless: true });
let failures = 0;

for (const width of WIDTHS) {
  const p = await b.newPage({ viewport: { width, height: 860 } });
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e.message).split('\n')[0]));
  await p.goto(BASE, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1600);

  // Ouvrir la feuille auth en mode création via le bouton du menu.
  await p.locator('.navpill button', { hasText: 'Menu' }).first().click().catch(() => {});
  await p.waitForTimeout(400);
  await p.getByRole('button', { name: /Créer un compte/i }).first().click().catch(() => {});
  await p.waitForTimeout(500);

  const authVisible = await p.locator('section[data-sheet="auth"]').count();
  const firstName = p.locator('#v13-auth-firstname');
  const hasFirstName = await firstName.count();
  const consent = p.locator('section[data-sheet="auth"] input[type="checkbox"]');
  const hasConsent = await consent.count();

  // Remplir sans prénom : le bouton doit rester désactivé.
  await p.locator('#v13-auth-email').fill('proof@example.com');
  await p.locator('#v13-auth-password').fill('secret6');
  await consent.first().check().catch(() => {});
  const disabledWithoutName = await p.locator('section[data-sheet="auth"] button[type="submit"]').isDisabled();

  // Ajouter le prénom : le bouton doit s'activer.
  await firstName.fill('Ama');
  const enabledWithName = !(await p.locator('section[data-sheet="auth"] button[type="submit"]').isDisabled());

  // Dé-cocher le consentement : le bouton doit redevenir désactivé.
  await consent.first().uncheck().catch(() => {});
  const disabledWithoutConsent = await p.locator('section[data-sheet="auth"] button[type="submit"]').isDisabled();

  // Ouvrir la feuille légale via le lien Confidentialité.
  await p.locator('section[data-sheet="auth"] button.linkbtn', { hasText: /confidentialit/i }).first().click().catch(() => {});
  await p.waitForTimeout(400);
  const legalVisible = await p.locator('section[data-sheet="legal"]').count();
  const legalText = (await p.locator('section[data-sheet="legal"]').innerText().catch(() => '')) || '';
  const legalHasRights = /suppression|supprimer/i.test(legalText) && /openstreetmap/i.test(legalText);

  // Depuis le menu : l'entrée « Informations légales » existe.
  await p.locator('section[data-sheet="legal"] button.sheet-close').click().catch(() => {});
  await p.waitForTimeout(300);
  const menuLegal = await p.locator('.menuitem', { hasText: /Informations légales/i }).count();

  const ok = authVisible === 1 && hasFirstName === 1 && hasConsent === 1 && disabledWithoutName && enabledWithName && disabledWithoutConsent && legalVisible === 1 && legalHasRights && menuLegal >= 1 && errors.length === 0;
  if (!ok) failures++;
  console.log(`width ${width}  ${ok ? 'OK' : 'FAIL'}  auth=${authVisible} prénom=${hasFirstName} consent=${hasConsent} sansPrénom=${disabledWithoutName ? 'bloqué' : 'ACTIF'} avecPrénom=${enabledWithName ? 'actif' : 'BLOQUÉ'} sansConsent=${disabledWithoutConsent ? 'bloqué' : 'ACTIF'} légal=${legalVisible} droits=${legalHasRights} menu=${menuLegal} erreurs=${errors.length}`);
  for (const e of errors) console.log(`    pageerror: ${e}`);
  await p.close();
}

await b.close();
console.log(failures === 0 ? 'ALL OK — Prénom requis, consentement requis, feuille légale atteignable' : `FAILURES: ${failures}`);
process.exitCode = failures === 0 ? 0 : 1;
