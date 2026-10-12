// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSheetDrag } from './use-sheet-drag';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.useFakeTimers();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

function Harness({ onDismiss }: { onDismiss: () => void }) {
  const drag = useSheetDrag(onDismiss);
  return (
    <div className="omni-v13-stage" onPointerDown={drag.onPointerDown} onPointerMove={drag.onPointerMove} onPointerUp={drag.onPointerUp}>
      <section className="sheet" data-sheet="menu">
        <div className="handle" />
        <p>contenu de la feuille</p>
      </section>
    </div>
  );
}

// jsdom n'implémente pas PointerEvent : un MouseEvent du bon type suffit à React,
// et `clientY` est lu tel quel. C'est le VRAI chemin d'événement, pas un mock.
function pointer(type: 'pointerdown' | 'pointermove' | 'pointerup', clientY: number) {
  return new MouseEvent(type, { bubbles: true, cancelable: true, clientY });
}

function mount(onDismiss: () => void) {
  act(() => root.render(<Harness onDismiss={onDismiss} />));
  const handle = container.querySelector<HTMLElement>('.handle')!;
  const sheet = container.querySelector<HTMLElement>('.sheet')!;
  return { handle, sheet };
}

describe('BRANCH-1 — le geste câblé retire réellement la feuille (DOM réel)', () => {
  it('tirer la poignée vers le bas fait suivre la feuille (--ty) puis ferme', () => {
    const onDismiss = vi.fn();
    const { handle, sheet } = mount(onDismiss);
    act(() => {
      handle.dispatchEvent(pointer('pointerdown', 100));
      handle.dispatchEvent(pointer('pointermove', 160));
    });
    // La feuille suit le doigt.
    expect(sheet.style.getPropertyValue('--ty')).toBe('60px');
    act(() => { handle.dispatchEvent(pointer('pointerup', 260)); });
    // Elle finit sa course avant de fermer.
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(400); });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('un appui simple (sans mouvement) ne ferme jamais', () => {
    const onDismiss = vi.fn();
    const { handle, sheet } = mount(onDismiss);
    act(() => {
      handle.dispatchEvent(pointer('pointerdown', 100));
      handle.dispatchEvent(pointer('pointerup', 101));
      vi.advanceTimersByTime(500);
    });
    expect(onDismiss).not.toHaveBeenCalled();
    expect(sheet.style.getPropertyValue('--ty')).toBe('');
  });

  it('un geste court et lent repose la feuille (--ty revient à 0), sans fermer', () => {
    const onDismiss = vi.fn();
    const { handle, sheet } = mount(onDismiss);
    act(() => {
      handle.dispatchEvent(pointer('pointerdown', 100));
      handle.dispatchEvent(pointer('pointermove', 140));
      vi.advanceTimersByTime(900); // lent
      handle.dispatchEvent(pointer('pointerup', 140));
      vi.advanceTimersByTime(500);
    });
    expect(onDismiss).not.toHaveBeenCalled();
    expect(sheet.style.getPropertyValue('--ty')).toBe('0px');
  });

  it('un geste vers le haut ne ferme pas', () => {
    const onDismiss = vi.fn();
    const { handle } = mount(onDismiss);
    act(() => {
      handle.dispatchEvent(pointer('pointerdown', 200));
      handle.dispatchEvent(pointer('pointermove', 60));
      handle.dispatchEvent(pointer('pointerup', 60));
      vi.advanceTimersByTime(500);
    });
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
