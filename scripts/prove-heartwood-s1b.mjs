// Heartwood S1b (S-21) — le QR public d'entité est RÉELLEMENT scannable ET résout vers l'entité.
//
// Même méthode que S1 : on rend le composant LIVRÉ (`OmniQr`) avec le payload d'entité, on le
// rasterise dans un vrai navigateur, on le DÉCODE (`jsqr`), puis on relit l'id par le parseur
// PARTAGÉ (`parseEntityIdFromQr`) — le rendu vendeur et le scanner acheteur doivent être d'accord.
// Enfin, si une base est fournie, on résout l'entité par le code serveur LIVRÉ (`getPublicEntity`)
// et on montre la remise réelle (Seed S-19).
//
// Contrôle négatif : un payload de FACILITÉ (`?facility=`) ne doit PAS être lu comme une entité.
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { chromium } from 'playwright';
import jsQR from 'jsqr';
import { neon } from '@neondatabase/serverless';
import { OmniQr } from '../src/trunk/OmniQr.tsx';
import { entityQrPayload, parseEntityIdFromQr } from '../src/trunk/entity-qr.ts';
import { entityBenefitLabel } from '../src/trunk/entity-benefits.ts';

const ORIGIN = 'https://omni.sparkafrika.online';
const ENTITY = process.env.S1B_ENTITY_ID ?? 'c5975d63-9c7c-4974-ba50-beb92e6b4924';
const dbUrl = process.env.S1B_DATABASE_URL ?? process.env.ROOT_READ_PATH_DATABASE_URL;

let failures = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? ' :: ' + detail : ''}`);
  if (!ok) failures++;
};

const svgOf = (value) => {
  const markup = renderToStaticMarkup(React.createElement(OmniQr, { value }));
  let svg = markup.slice(markup.indexOf('<svg'), markup.lastIndexOf('</svg>') + 6);
  if (!svg.includes('xmlns')) svg = svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
  return svg;
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 320, height: 320 } });
let currentSvg = '';
await page.route('**/*', (route) => {
  const u = route.request().url();
  if (u.includes('q.svg')) return route.fulfill({ contentType: 'image/svg+xml', body: currentSvg });
  return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body></body></html>' });
});
await page.goto('https://entity-qr.local/');

async function decode(svg) {
  currentSvg = svg;
  const data = await page.evaluate(async () => {
    const img = new Image();
    img.src = '/q.svg?t=' + Math.random();
    await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('img load')); });
    const w = 336, h = 336;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, w, h);
    const px = ctx.getImageData(0, 0, w, h);
    return { data: Array.from(px.data), w, h };
  });
  const res = jsQR(new Uint8ClampedArray(data.data), data.w, data.h);
  return res?.data ?? null;
}

const payload = entityQrPayload(ENTITY, ORIGIN);
const decoded = await decode(svgOf(payload));
check('le QR d’entité rendu se décode', decoded === payload, decoded ? `"${decoded}"` : 'null');

const scannedId = decoded ? parseEntityIdFromQr(decoded) : null;
check('le scanner acheteur en relit le bon id d’entité', scannedId === ENTITY, scannedId ?? 'null');

// Contrôle négatif : un QR de FACILITÉ ne doit pas être lu comme une entité.
const facilityPayload = `https://omni.sparkafrika.online/?facility=${ENTITY}`;
const negDecoded = await decode(svgOf(facilityPayload));
check('négatif : le QR d’une facilité se décode mais n’est PAS une entité', negDecoded === facilityPayload && parseEntityIdFromQr(negDecoded) === null, negDecoded ?? 'null');

await browser.close();

if (dbUrl) {
  const sql = neon(dbUrl);
  const { createTrunkRepository } = await import('../src/server/trunk-repository.ts');
  const repo = createTrunkRepository(sql);
  const entity = await repo.getPublicEntity(ENTITY);
  check('l’entité scannée résout par le code serveur LIVRÉ', Boolean(entity), entity ? entity.name : 'null');
  if (entity) {
    const benefit = entityBenefitLabel(entity.offers);
    console.log(`     entité « ${entity.name} » · ${entity.offers.length} offres · avantage : ${benefit ?? '(aucun — la page se tait)'}`);
    const anyPct = entity.offers.some((o) => o.pourcentageReduction > 0);
    check('l’avantage affiché = la remise réelle (ou silence honnête)', benefit === null ? !anyPct : benefit.includes(String(Math.max(...entity.offers.map((o) => o.pourcentageReduction)))), benefit ?? 'silence');
  }
} else {
  console.log('     (pas de base fournie — la résolution serveur est sautée ; set S1B_DATABASE_URL)');
}

console.log(`\n${failures === 0 ? 'HEARTWOOD-S1B OK' : 'HEARTWOOD-S1B FAIL'} (${failures} échec(s))`);
process.exit(failures === 0 ? 0 : 1);
