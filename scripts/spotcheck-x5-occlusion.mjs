// HO-OMNI-30 — spot-check occlusion desktop (surfaces authentifiées).
// Mesure, jamais impression. Usage: node scripts/spotcheck-x5-occlusion.mjs
// Sortie: JSON stdout + screenshots docs/nature-way/x5-desktop-spotcheck/.
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const PROD = 'https://omni.sparkafrika.online/';
const SHOT = 'docs/nature-way/x5-desktop-spotcheck';
mkdirSync(SHOT, { recursive: true });

const VIEWPORTS = [
  { name: '1040', width: 1040, height: 800, desktop: true },
  { name: '1280', width: 1280, height: 800, desktop: true },
  { name: '1920', width: 1920, height: 1080, desktop: true },
  { name: '390', width: 390, height: 844, desktop: false },
  { name: '768', width: 768, height: 1024, desktop: false },
].filter((vp) => !process.env.SPOT_VP || process.env.SPOT_VP === vp.name);
const SELLER = { email: 'demo@seller.omni', password: 'Omni@2026' };
const BUYER = { email: 'demo@buyer.omni', password: 'Omni@2026' };

const rows = [];
function record(viewport, role, sheet, status, detail) {
  rows.push({ viewport, role, sheet, status, detail });
  console.log(`[${viewport}/${role}/${sheet}] ${status} — ${detail}`);
}

const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || undefined });

async function newPage(vp, errors) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${String(e && e.message || e).slice(0, 120)}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text().slice(0, 120)}`); });
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`http${r.status()}: ${r.url().slice(0, 160)}`); });
  return { context, page };
}

async function settle(page, ms = 8000) {
  // Attend la fin du reveal ou 8 s max.
  try {
    await page.waitForFunction(() => !document.querySelector('.map-legend'), { timeout: ms });
  } catch { /* timeout = on mesure quand même */ }
  await page.waitForTimeout(2000);
}

async function attempt(fn, tries = 2) {
  let last = null;
  for (let i = 0; i < tries; i++) {
    try { await fn(); return true; } catch (e) { last = e; await new Promise((r) => setTimeout(r, 2000)); }
  }
  return false;
}

function hasMapError(errors) {
  return errors.filter((e) => /on2|MapLibre|maplibre|WebGL/i.test(e));
}

async function signIn(page, creds) {
  for (let i = 0; i < 2; i++) {
    try {
      await page.locator('.navpill').getByRole('button', { name: 'Menu', exact: true }).first().click({ timeout: 15000, force: true });
      await page.waitForTimeout(800);
      const authEntry = page.getByRole('button', { name: /Créer un compte/i }).first();
      if ((await authEntry.count()) > 0) {
        await authEntry.click({ timeout: 15000, force: true });
        await page.waitForTimeout(800);
        await page.locator('#v13-email').fill(creds.email, { timeout: 15000 });
        await page.locator('#v13-password').fill(creds.password, { timeout: 15000 });
        await page.getByRole('button', { name: 'Se connecter', exact: true }).click({ timeout: 15000, force: true });
        try {
          await page.getByRole('button', { name: /Se déconnecter/i }).first().waitFor({ timeout: 12000 });
        } catch { /* timeout = on vérifie quand même */ }
      }
      if ((await page.getByRole('button', { name: /Se déconnecter/i }).count()) > 0) return true;
    } catch { await page.waitForTimeout(2000); }
  }
  return (await page.getByRole('button', { name: /Se déconnecter/i }).count()) > 0;
}

async function openMenuItem(page, name) {
  await page.locator('.navpill').getByRole('button', { name: 'Menu', exact: true }).first().click();
  await page.waitForTimeout(800);
  const item = page.getByRole('button', { name: new RegExp(name, 'i') }).first();
  if ((await item.count()) === 0) return false;
  await item.click();
  await page.waitForTimeout(1500);
  return true;
}

// Mesure d'occlusion : centre + 4 points à ±30% sur les axes (pas les coins :
// un bouton rond ne peint pas ses coins — les coins accusent le fond à tort).
// elementFromPoint hors élément ET hors (descendant/ancêtre) = occlusion.
// DOUBLE mesure à 2 s d'intervalle : seules les occlusions STABLES comptent
// (une animation de sheet qui balaie le rail n'est pas une occlusion réelle).
async function measureOcclusions(page) {
  const once = () => page.evaluate(() => {
    const out = [];
    let slivers = 0;
    const dock = document.querySelector('.omni-v13-stage .navpill');
    const dockR = dock ? dock.getBoundingClientRect() : null;
    const els = Array.from(document.querySelectorAll('.omni-v13-stage button, .omni-v13-stage a[href], .omni-v13-stage input, .omni-v13-stage select, .omni-v13-stage textarea, .omni-v13-stage [role="button"]')).slice(0, 220);
    const vw = window.innerWidth, vh = window.innerHeight;
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      // Slivers <8px : non percevables (panneaux repliés gardés en DOM) —
      // hygiène DOM, pas occlusion. Comptés à part.
      if (Math.max(r.width, r.height) < 8) { slivers++; continue; }
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue;
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = r.width * 0.3, dy = r.height * 0.3;
      const pts = [[cx, cy], [cx - dx, cy], [cx + dx, cy], [cx, cy - dy], [cx, cy + dy]];
      for (const [x, y] of pts) {
        if (x < 0 || y < 0 || x >= vw || y >= vh) continue;
        const hit = document.elementFromPoint(x, y);
        if (!hit || hit === el || el.contains(hit) || hit.contains(el)) continue;
        const hitSel = `${hit.tagName}.${typeof hit.className === 'string' ? hit.className.split(' ').slice(0, 2).join('.') : ''}`;
        if (/canvas/i.test(hitSel)) continue;
        const cls = (s) => (s && s.className && typeof s.className === 'string' ? s.className.split(' ').slice(0, 2).join('.') : (s ? s.tagName : '?'));
        const twinHit = hit.closest && el.closest && hit.closest('.navpill') && el.closest('.navpill') && hit.closest('.navpill') !== el.closest('.navpill');
        // Bord de dock : élément dans une sheet scrollable, recouvert par le
        // dock — atteignable au scroll (vérifié : wallet scroll 873>438).
        // INFO, pas FAIL. Le non-scrollable reste un FAIL.
        let dockEdge = false;
        if (hit.closest && hit.closest('.navpill') && !(el.closest && el.closest('.navpill'))) {
          const sheetEl = el.closest ? el.closest('section[data-sheet],form[data-sheet]') : null;
          if (sheetEl && sheetEl.scrollHeight > sheetEl.clientHeight + 2) dockEdge = true;
        }
        out.push({ el: `${el.tagName}.${cls(el)}:${(el.textContent || '').trim().slice(0, 30)}`, hit: `${hit.tagName}.${cls(hit)}`, rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], twin: Boolean(twinHit), dockEdge });
        break;
      }
    }
    return { out, slivers };
  });
  const a = await once();
  await page.waitForTimeout(2000);
  const b = await once();
  const key = (o) => `${o.el}@${o.rect.join(',')}`;
  const setB = new Set(b.out.map(key));
  const stable = a.out.filter((o) => setB.has(key(o)));
  // DOCK-DUP : jumeaux .navpill empilés (handlers identiques) — une seule
  // dette nommée avec le compte de jumeaux, pas N occlusions.
  const pillCount = await page.evaluate(() => document.querySelectorAll('.omni-v13-stage .navpill').length);
  const real = stable.filter((o) => !o.twin && !o.dockEdge);
  const edge = stable.filter((o) => o.dockEdge && !o.twin);
  const dups = stable.filter((o) => o.twin);
  return { out: real, dups: dups.slice(0, 3), edge: edge.length, pillCount, slivers: a.slivers, rpRect: await page.evaluate(() => {
    const rp = document.querySelector('.rolepill');
    if (!rp) return null;
    const r = rp.getBoundingClientRect();
    return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height), Math.round(r.bottom)];
  }) };
}

async function measureTargets(page, desktop) {
  return page.evaluate((isDesktop) => {
    const small = [], tiny = [];
    const sliverCls = {};
    const els = Array.from(document.querySelectorAll('.omni-v13-stage button, .omni-v13-stage a[href], .omni-v13-stage input'));
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1 || r.bottom < 0 || r.top > window.innerHeight) continue;
      if (Math.max(r.width, r.height) < 8) {
        const k = `${el.tagName}.${typeof el.className === 'string' ? el.className.split(' ').slice(0, 2).join('.') : '?'}`;
        sliverCls[k] = (sliverCls[k] || 0) + 1;
        continue;
      }
      const label = (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 30);
      if (!isDesktop && (r.width < 44 || r.height < 44)) small.push(`${label}(${Math.round(r.width)}x${Math.round(r.height)})`);
      if (isDesktop && (r.width < 24 || r.height < 24)) tiny.push(`${label}(${Math.round(r.width)}x${Math.round(r.height)})`);
    }
    return { small: small.slice(0, 12), tiny: tiny.slice(0, 12), sliverCls };
  }, desktop);
}

async function shot(page, vp, sheet, role) {
  await page.screenshot({ path: `${SHOT}/x5-${vp}-${sheet}-${role}.png` }).catch(() => {});
}

async function searchResults(page, q) {
  // Pré-requis : la sheet recherche est déjà ouverte (un seul clic d'ouverture
  // par passe — re-cliquer pendant qu'elle est ouverte fait timeouter).
  const input = page.locator('input[placeholder="Produit, service, propriété…"]').first();
  if ((await input.count()) === 0) return false;
  await input.fill(q);
  await page.waitForTimeout(1200);
  await input.press('Enter');
  try {
    await page.waitForSelector('#hgrid button', { timeout: 15000 });
  } catch { /* timeout = on mesure quand même */ }
  return (await page.locator('#hgrid button').count()) > 0;
}

for (const vp of VIEWPORTS) {
  // ---- Passe acheteur : toutes les sheets buyer + recherche/résultats/fiche.
  {
    const errors = [];
    const { context, page } = await newPage(vp, errors);
    try {
      await page.goto(PROD, { waitUntil: 'load', timeout: 60000 });
      await settle(page);
      const mapErrs = hasMapError(errors);
      record(vp.name, 'anon', 'boot', mapErrs.length ? 'FAIL' : 'PASS', mapErrs.length ? mapErrs.join(' | ') : '0 erreur carte');
      const ok = await signIn(page, BUYER);
      record(vp.name, 'buyer', 'signin', ok ? 'PASS' : 'FAIL', ok ? 'session Mon espace' : 'connexion impossible');
      if (!ok) { await context.close(); continue; }

      // search
      const searchOpened = await attempt(() => page.locator('.navpill').getByRole('button', { name: 'Recherche', exact: true }).first().click({ timeout: 15000, force: true }));
      await page.waitForTimeout(1200);
      await shot(page, vp.name, 'search', 'buyer');
      let m = await measureOcclusions(page);
      let t = await measureTargets(page, vp.desktop);
      const slivInfo = ` slivCls=${JSON.stringify(t.sliverCls).slice(0, 160)}`;
      record(vp.name, 'buyer', 'search', m.out.length ? 'FAIL' : 'PASS', `occl=${m.out.length} edge=${m.edge} sliv=${m.slivers} <44=${t.small.length} <24=${t.tiny.length} err=${errors.length}${m.out.length ? ' :: ' + JSON.stringify(m.out.slice(0, 3)) : ''}${t.small.length ? ' :: small=' + JSON.stringify(t.small.slice(0, 6)) : ''}${slivInfo}`);

      // results (q=jus)
      const hasResults = await searchResults(page, 'jus');
      await shot(page, vp.name, 'results', 'buyer');
      m = await measureOcclusions(page);
      t = await measureTargets(page, vp.desktop);
      record(vp.name, 'buyer', 'results', !hasResults ? 'BLOCKED' : (m.out.length ? 'FAIL' : 'PASS'), !hasResults ? '0 résultat pour jus' : `occl=${m.out.length} edge=${m.edge} sliv=${m.slivers} <44=${t.small.length} err=${errors.length}${m.out.length ? ' :: ' + JSON.stringify(m.out.slice(0, 3)) : ''}`);

      // facility (1er résultat)
      let hasFacility = false;
      if (hasResults) {
        await attempt(() => page.locator('#hgrid button').first().click({ timeout: 15000, force: true }));
        await page.waitForTimeout(2000);
        hasFacility = (await page.locator('[data-sheet="facility"]').count()) > 0;
      }
      await shot(page, vp.name, 'facility', 'buyer');
      m = await measureOcclusions(page);
      t = await measureTargets(page, vp.desktop);
      record(vp.name, 'buyer', 'facility', !hasFacility ? 'BLOCKED' : (m.out.length ? 'FAIL' : 'PASS'), !hasFacility ? 'fiche non ouverte' : `occl=${m.out.length} edge=${m.edge} sliv=${m.slivers} <44=${t.small.length} err=${errors.length}${m.out.length ? ' :: ' + JSON.stringify(m.out.slice(0, 3)) : ''}`);

      // sheets menu : libellés FR réels (cf. capture menu). Fermer toute sheet
      // ouverte d'abord (sur mobile elle couvre le dock).
      await attempt(() => page.locator('.sheet-close').first().click({ timeout: 8000, force: true }));
      await page.waitForTimeout(800);
      for (const item of [['Portefeuille', 'wallet'], ['Plans', 'plans'], ['Mon compte', 'account'], ['Notifications', 'notifs'], ['Favoris', 'favorites'], ['Recherches sauvegardées', 'saved']]) {
        const opened = await openMenuItem(page, item[0]);
        if (opened && (item[1] === 'wallet' || item[1] === 'account')) await shot(page, vp.name, item[1], 'buyer');
        m = await measureOcclusions(page);
        t = await measureTargets(page, vp.desktop);
        record(vp.name, 'buyer', item[1], !opened ? 'BLOCKED' : (m.out.length ? 'FAIL' : 'PASS'), !opened ? `entrée ${item[0]} introuvable` : `occl=${m.out.length} edge=${m.edge} sliv=${m.slivers} <44=${t.small.length} err=${errors.length}${m.out.length ? ' :: ' + JSON.stringify(m.out.slice(0, 3)) : ''}`);
      }
      // menu lui-même
      await page.locator('.navpill').getByRole('button', { name: 'Menu', exact: true }).first().click();
      await page.waitForTimeout(1000);
      m = await measureOcclusions(page);
      record(vp.name, 'buyer', 'menu', m.out.length ? 'FAIL' : 'PASS', `occl=${m.out.length} edge=${m.edge} sliv=${m.slivers} err=${errors.length}${m.out.length ? ' :: ' + JSON.stringify(m.out.slice(0, 3)) : ''}`);
      const remaining = hasMapError(errors);
      if (remaining.length) record(vp.name, 'buyer', 'console', 'FAIL', remaining.join(' | '));
      else if (errors.length) record(vp.name, 'buyer', 'console', 'INFO', `${errors.length} console.error non-carte : ${errors.slice(0, 2).join(' | ')}`);
      const pillCount = await page.evaluate(() => document.querySelectorAll('.omni-v13-stage .navpill').length);
      if (pillCount > 1) record(vp.name, 'all', 'dock-dup', 'INFO', `DOCK-DUP: ${pillCount} jumeaux .navpill empilés même rect (handlers identiques, interception mesurée) — dette nommée, excluir des verdicts sheet`);
    } catch (e) {
      record(vp.name, 'buyer', 'harness', 'FAIL', `exception: ${String(e).slice(0, 140)}`);
    }
    await context.close();
  }

  // ---- Passe vendeur : rolepill Seller → sheet seller.
  {
    const errors = [];
    const { context, page } = await newPage(vp, errors);
    try {
      await page.goto(PROD, { waitUntil: 'load', timeout: 60000 });
      await settle(page);
      const ok = await signIn(page, SELLER);
      record(vp.name, 'seller', 'signin', ok ? 'PASS' : 'FAIL', ok ? 'session vendeur' : 'connexion impossible');
      if (ok) {
        // Tabs localisés (maquette FR) : Vendeur/Seller selon le rendu.
        const tab = page.locator('.rolepill').getByRole('tab', { name: /Vendeur|Seller/i }).first();
        const tabCount = await tab.count();
        let tabClicked = false;
        if (tabCount > 0) tabClicked = await attempt(() => tab.click({ timeout: 15000, force: true }));
        if (tabClicked) await page.waitForTimeout(2500);
        const open = (await page.locator('[data-sheet="seller"]').count()) > 0;
        await shot(page, vp.name, 'seller', 'seller');
        const m = await measureOcclusions(page);
        const t = await measureTargets(page, vp.desktop);
        record(vp.name, 'seller', 'seller', !open ? 'BLOCKED' : (m.out.length ? 'FAIL' : 'PASS'), !open ? (tabCount === 0 ? 'onglet Seller absent du rolepill' : 'sheet seller non ouverte après clic') : `occl=${m.out.length} edge=${m.edge} sliv=${m.slivers} <44=${t.small.length} err=${errors.length}${m.out.length ? ' :: ' + JSON.stringify(m.out.slice(0, 3)) : ''}`);
      }
      const remaining = hasMapError(errors);
      if (remaining.length) record(vp.name, 'seller', 'console', 'FAIL', remaining.join(' | '));
    } catch (e) {
      record(vp.name, 'seller', 'harness', 'FAIL', `exception: ${String(e).slice(0, 140)}`);
    }
    await context.close();
  }

  // ---- Passe déconnectée : action gatée → onboard/auth + safe-areas mobile.
  {
    const errors = [];
    const { context, page } = await newPage(vp, errors);
    try {
      await page.goto(PROD, { waitUntil: 'load', timeout: 60000 });
      await settle(page);
      let gated = 'none';
      const searchOpened = await attempt(() => page.locator('.navpill').getByRole('button', { name: 'Recherche', exact: true }).first().click({ timeout: 15000, force: true }));
      await page.waitForTimeout(1200);
      gated += searchOpened ? '+search-open' : '+search-closed';
      const hasResults = searchOpened && await searchResults(page, 'jus');
      if (hasResults) {
        gated = 'results=1';
        // Essayer jusqu'à 3 résultats puis d'autres requêtes : il faut une
        // facilité AVEC produits (les q=jus sont vides).
        let hgridOk = false, pickedCount = 0;
        for (const q of ['jus', 'box', 'demo']) {
          if (pickedCount > 0) break;
          const input2 = page.locator('input[placeholder="Produit, service, propriété…"]').first();
          if ((await input2.count()) === 0) break;
          await input2.fill(q);
          await page.waitForTimeout(1200);
          await input2.press('Enter');
          try { await page.waitForSelector('#hgrid button', { timeout: 15000 }); } catch { continue; }
          for (let i = 0; i < 3; i++) {
            const hbtn = page.locator('#hgrid button').nth(i);
            if ((await hbtn.count()) === 0) break;
            if (!await attempt(() => hbtn.click({ timeout: 15000, force: true }))) continue;
            hgridOk = true;
            await page.waitForTimeout(2000);
            pickedCount = await page.locator('[data-sheet="facility"] .pitem').count();
            if (pickedCount > 0) break;
          }
        }
        gated += hgridOk ? '+hgrid' : '+hgridFAIL';
        gated += pickedCount ? '+pitem' : '+nopitem';
        if (pickedCount) { await attempt(() => page.locator('[data-sheet="facility"] .pitem').first().click({ timeout: 10000, force: true })); await page.waitForTimeout(800); }
        const btn = page.locator('[data-sheet="facility"] button').filter({ hasText: /Demander la disponibilité/ }).first();
        const btnCount = await btn.count();
        gated += btnCount ? '+btn' : '+nobtn';
        if (btnCount) { await attempt(() => btn.click({ timeout: 10000, force: true })); await page.waitForTimeout(2000); }
        const sheets = await page.evaluate(() => Array.from(document.querySelectorAll('section[data-sheet]')).map((s) => s.getAttribute('data-sheet')));
        gated += ` sheets=${sheets.join(',') || 'none'}`;
      }
      record(vp.name, 'anon', 'onboard-gated', 'INFO', `sheets après action gatée: ${gated}`);
      if (!vp.desktop) {
        // Safe-area : getComputedStyle résout env() (0 en émulation) — on lit
        // la RÈGLE source (même origine, lisible) au lieu du calculé.
        const safeRule = await page.evaluate(() => {
          for (const sheet of document.styleSheets) {
            let rules = [];
            try { rules = Array.from(sheet.cssRules); } catch { continue; }
            for (const r of rules) {
              if (r.selectorText === ':root' && /--safe-bottom/.test(r.cssText)) return r.cssText;
            }
          }
          return '';
        });
        record(vp.name, 'anon', 'safe-area', /env\(safe-area-inset-bottom\)/.test(safeRule) ? 'PASS' : 'FAIL', /env\(safe-area-inset-bottom\)/.test(safeRule) ? 'règle --safe-bottom: max(14px, env()) présente (device Phase D)' : `règle introuvable: ${safeRule.slice(0, 60)}`);
      }
    } catch (e) {
      record(vp.name, 'anon', 'harness', 'FAIL', `exception: ${String(e).slice(0, 140)}`);
    }
    await context.close();
  }

  // ---- Admin : BLOQUÉ — mot de passe non fourni (jamais de secret en chat).
  record(vp.name, 'admin', 'admin', 'BLOCKED', 'session kheirlissi@icloud.com impossible sans mot de passe (non demandé, non stocké)');
}

const fails = rows.filter((r) => r.status === 'FAIL');
const blocked = rows.filter((r) => r.status === 'BLOCKED');
console.log(`\nTOTAL ${rows.length} · PASS ${rows.filter((r) => r.status === 'PASS').length} · FAIL ${fails.length} · BLOCKED ${blocked.length} · INFO ${rows.filter((r) => r.status === 'INFO').length}`);
console.log(JSON.stringify(rows, null, 1));
import { writeFileSync as writeRows } from 'node:fs';
writeRows(`docs/nature-way/x5-desktop-spotcheck/x5-rows-${process.env.SPOT_VP || 'all'}.json`, JSON.stringify(rows, null, 1));
process.exit(0);
