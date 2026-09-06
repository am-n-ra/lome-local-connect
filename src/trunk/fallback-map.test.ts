// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createFallbackMap, type FallbackFacility, type FallbackMapHandle } from './fallback-map';

describe('createFallbackMap — carte monde animée', () => {
  let container: HTMLElement;

  function has(sel: string): boolean {
    return container.querySelector(sel) !== null;
  }

  function count(sel: string): number {
    return container.querySelectorAll(sel).length;
  }

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('les vraies facilities deviennent des repères', () => {
    const map = createFallbackMap({ container, facilities: FACILITIES });
    const v = has('.vdot');
    const c = has('.cmark');
    const n = count('.vdot,.cmark');
    expect(v).toBe(true);
    expect(c).toBe(true);
    expect(n).toBe(FACILITIES.length);
    map.remove();
  });

  it('expose la surface de méthodes MapLibre', () => {
    const map = createFallbackMap({ container, facilities: FACILITIES });
    const methods: Array<keyof FallbackMapHandle> = [
      'getZoom', 'getCenter', 'easeTo', 'flyTo', 'zoomIn', 'zoomOut', 'jumpTo',
      'cameraForBounds', 'once', 'on', 'off', 'setFacilities', 'setUserLocation',
      'resize', 'remove',
    ];
    for (const name of methods) {
      const t = typeof map[name];
      expect(t).toBe('function');
    }
    const d = typeof map.dragRotate.disable;
    const r = typeof map.touchZoomRotate.disableRotation;
    expect(d).toBe('function');
    expect(r).toBe('function');
    map.remove();
  });

  it('signale le repère utilisateur quand userLL est fourni', () => {
    const map = createFallbackMap({ container, facilities: FACILITIES, userLL: [6.13,1.225] });
    const u = has('.usermarker');
    expect(u).toBe(true);
    map.remove();
  });

  it('émet moveend une fois par mouvement de caméra', () => {
    const map = createFallbackMap({ container, facilities: FACILITIES });
    const onceCb = vi.fn();
    const onCb = vi.fn();
    map.once('moveend', onceCb);
    map.on('moveend', onCb);
    vi.useFakeTimers();
    map.easeTo({ center: [1.23,6.13], zoom: 13 });
    vi.runAllTimers();
    const o1 = onceCb.mock.calls.length;
    const n1 = onCb.mock.calls.length;
    expect(o1).toBe(1);
    expect(n1).toBe(1);
    map.easeTo({ center: [1.23,6.13], zoom: 13 });
    vi.runAllTimers();
    const o2 = onceCb.mock.calls.length;
    const n2 = onCb.mock.calls.length;
    expect(o2).toBe(1);
    expect(n2).toBe(2);
    vi.useRealTimers();
    map.remove();
  });

  it('setFacilities remplace les repères et setUserLocation déplace le pin', () => {
    const map = createFallbackMap({ container, facilities: FACILITIES, userLL: [6.13,1.225] });
    const before = count('.vdot,.cmark');
    expect(before).toBe(3);
    map.setFacilities([FACILITIES[0]]);
    const after = count('.vdot,.cmark');
    expect(after).toBe(1);
    map.setUserLocation([6.14,1.23]);
    const um = container.querySelector('.usermarker') as HTMLElement;
    const left = um.style.left;
    expect(left).toMatch(/[0-9]%$/);
    map.remove();
    const gone = count('.vdot,.cmark');
    expect(gone).toBe(0);
  });

  it('clamp le zoom et calcule un cadrage pour des bounds', () => {
    const map = createFallbackMap({ container, facilities: FACILITIES });
    map.jumpTo({ zoom: 99 });
    const hi = map.getZoom();
    expect(hi).toBe(18);
    map.jumpTo({ zoom: -5 });
    const lo = map.getZoom();
    expect(lo).toBe(0);
    const fit = map.cameraForBounds({ _ne: { lng: 1.236, lat: 6.14 }, _sw: { lng:  ​1.215, lat:  ​6.122 } }, { maxZoom: 13 });
    const fz = fit.zoom;
    expect(fz).toBe(13);
    map.remove();
  });

  it('nettoie le conteneur au remove', () => {
    const map = createFallbackMap({ container, facilities: FACILITIES });
    const before = count('.vdot,.cmark');
    expect(before).toBe(3);
    map.remove();
    const after = count('.vdot,.cmark');
    expect(after).toBe(0);
  });

  it('révèle les repères en pop-in différé', () => {
    vi.useFakeTimers();
    const map = createFallbackMap({ container, facilities: FACILITIES });
    vi.runAllTimers();
    const dots = container.querySelectorAll('.vdot,.cmark');
    let revealed = 0;
    for (const el of dots) {
      if (el.classList.contains('vdot-reveal')) revealed += 1;
    }
    expect(revealed).toBe(FACILITIES.length);
    vi.useRealTimers();
    map.remove();
  });

  const FACILITIES: FallbackFacility[] = [
    { id: 'f1', name: 'Marché de Hanoukopé', latitude:  ​6.1304, longitude:  ​1.2253 },
    { id: 'f2', name: 'Atelier Kegue', latitude:  ​6.127, longitude:  ​1.2195, kind: 'claimed' },
    { id: 'f3', name: 'Cantine mobile', latitude:  ​6.134, longitude:  ​1.23, kind: 'mobile' },
  ];
});