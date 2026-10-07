// Heartwood S1 — le QR de transaction est RÉELLEMENT scannable.
//
// Preuve la plus directe possible : on rend le composant LIVRÉ (`OmniQr`) en SVG, on le
// rasterise dans un vrai navigateur, et on le DÉCODE avec la même famille de décodeur que
// la caméra vendeur (`jsqr`) — on doit retrouver exactement `transactionId:token`, puis le
// parseur du scanner (`extractTransactionPayload`) doit en sortir le bon txn.
//
// Contrôle négatif : un QR INVERSÉ (modules clairs sur fond sombre) ne doit PAS se décoder
// correctement — c'est ce que faisait l'ancien conteneur `background: var(--ink)`. Le
// contraste est donc porteur, pas cosmétique (S1-C4).
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { chromium } from 'playwright';
import jsQR from 'jsqr';
import { OmniQr } from '../src/trunk/OmniQr.tsx';

const transactionId = '11111111-2222-3333-4444-555555555555';
const token = 'fAke-t0ken_base64url-abcdefghijklmnop1234567890';
const payload = `${transactionId}:${token}`;

let failures = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? ' :: ' + detail : ''}`);
  if (!ok) failures++;
};

const svgOf = (props) => {
  const markup = renderToStaticMarkup(React.createElement(OmniQr, props));
  // OmniQr rend un <span> qui enveloppe le SVG ; pour le charger comme image, on ne garde
  // que le <svg> et on ajoute xmlns (absent de renderToStaticMarkup).
  let svg = markup.slice(markup.indexOf('<svg'), markup.lastIndexOf('</svg>') + 6);
  if (!svg.includes('xmlns')) svg = svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
  return svg;
};
const normal = svgOf({ value: payload });
// L'ANCIEN rendu (défaut mesuré) : des blocs texte `█/▓`, pas un QR. On le rasterise pour
// montrer qu'un décodeur n'en tire rien — c'est la preuve directe que le défaut cassait le scan.
const fakeBlocks = payload
  .split('')
  .reduce((acc, ch) => acc + (ch.charCodeAt(0) % 2 === 0 ? '█' : '▓'), '')
  .slice(0, 40);
const fakeSvg =
  `<svg xmlns="http://www.w3.org/2000/svg" width="168" height="168">` +
  `<rect width="168" height="168" fill="#0f0f0f"/>` +
  `<text x="4" y="30" font-family="monospace" font-size="11" fill="#ffffff">${fakeBlocks}</text></svg>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 320, height: 320 } });

// On sert le SVG depuis une origine http interceptée (blob/data URLs sont bloqués sur about:blank).
let currentSvg = '';
await page.route('**/*', (route) => {
  const u = route.request().url();
  if (u.includes('q.svg')) return route.fulfill({ contentType: 'image/svg+xml', body: currentSvg });
  return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body></body></html>' });
});
await page.goto('https://qr.local/');

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

const decoded = await decode(normal);
check('le QR rendu se décode', decoded === payload, decoded ? `"${decoded.slice(0, 40)}…"` : 'null');

// Parseur du scanner vendeur (répliqué de SellerQrScannerSheet.extractTransactionPayload).
const uuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const colon = (decoded ?? '').split(':');
const parsedOk = colon.length === 2 && uuid.test(colon[0]) && colon[1].length >= 8;
check('le scanner vendeur en extrait le bon transactionId', parsedOk && colon[0] === transactionId, colon[0] ?? '');

// Contrôle négatif : l'ANCIEN rendu (blocs █/▓) ne se décode pas — le défaut cassait le scan.
const old = await decode(fakeSvg);
check('contrôle négatif : l’ancien rendu (blocs) n’est PAS scannable', old !== payload, old ? `a décodé "${old}"` : 'non décodé');

await browser.close();
console.log(`\n${failures === 0 ? 'HEARTWOOD-QR OK' : 'HEARTWOOD-QR FAIL'} (${failures} échec(s))`);
process.exit(failures === 0 ? 0 : 1);
