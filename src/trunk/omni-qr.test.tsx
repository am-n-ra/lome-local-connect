// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OmniQr } from './OmniQr';

/**
 * Heartwood S1 — le QR de transaction est RÉEL (scannable) et PARTAGÉ.
 *
 * Défaut d'origine : `BuyerFlowV13.qrStyle()` rendait des blocs `█/▓` (décor) et la Room
 * affichait le payload en texte brut — ni l'un ni l'autre n'est un QR, donc la caméra
 * vendeur (`html5-qrcode`) ne pouvait rien décoder : le verrou transactionnel était
 * contourné par un collage manuel. Ce garde échoue si le rendu redevient du décor ou si
 * une surface cesse d'utiliser le composant partagé.
 *
 * Le DÉCODAGE réel (le SVG rendu redonne `transactionId:token`) est prouvé au navigateur
 * (`scripts/prove-heartwood-qr.mjs`) — ici on prouve la forme et la non-divergence.
 */

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('Heartwood S1 — OmniQr rend un vrai QR', () => {
  it('rend un <svg> de QR (pas des blocs █/▓)', () => {
    act(() => root.render(<OmniQr value="11111111-1111-1111-1111-111111111111:abc123def456" />));
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    // Un QR de ce payload (version modérée) porte bien plus de 100 modules/carrés.
    const cells = container.querySelectorAll('svg path, svg rect').length;
    expect(cells).toBeGreaterThan(0); // qrcode.react émet un unique <path> vectoriel
    expect(container.textContent).not.toMatch(/[█▓]/);
  });

  it('porte un rôle image accessible (aria-label "QR Omni")', () => {
    act(() => root.render(<OmniQr value="x:y" />));
    const el = container.querySelector('.omni-qr');
    expect(el?.getAttribute('role')).toBe('img');
    expect(el?.getAttribute('aria-label')).toBe('QR Omni');
  });

  it('vide n’existe pas : les deux surfaces importent OmniQr et n’ont plus qrStyle', () => {
    const buyer = readFileSync('src/trunk/BuyerFlowV13.tsx', 'utf8');
    const room = readFileSync('src/trunk/TransactionRoom.tsx', 'utf8');
    expect(buyer).toContain("from './OmniQr'");
    expect(room).toContain("from './OmniQr'");
    expect(buyer).not.toContain('qrStyle');
    expect(room).not.toContain('qrStyle');
    // l'ancien conteneur inversé (encre de fond) portait l'aria-label ; il ne doit plus exister
    expect(buyer).not.toContain("fontFamily: 'monospace', fontSize: 18");
  });

  it('encode le payload que le scanner décode (`transactionId:token`)', () => {
    // qrPayload définit la forme ; le composant la reçoit telle quelle.
    const buyer = readFileSync('src/trunk/BuyerFlowV13.tsx', 'utf8');
    const room = readFileSync('src/trunk/TransactionRoom.tsx', 'utf8');
    expect(buyer).toContain('qrPayload(txnId!, qrToken)');
    expect(room).toContain('qrPayload(transactionId, qrToken)');
  });

  it('modules sombres sur fond blanc (jamais clair-sur-sombre)', () => {
    const src = readFileSync('src/trunk/OmniQr.tsx', 'utf8');
    expect(src).toContain('bgColor="#ffffff"');
    expect(src).toContain('fgColor="#0f0f0f"');
  });
});
