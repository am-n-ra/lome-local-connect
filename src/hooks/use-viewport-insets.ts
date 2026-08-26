import { useEffect, type RefObject } from 'react';

const KEYBOARD_THRESHOLD = 120;

type ViewportRoot = RefObject<HTMLElement | null>;

/**
 * Keeps the app surface anchored to the visual viewport instead of the layout
 * viewport when a mobile keyboard opens. The keyboard inset is intentionally
 * exposed as a CSS variable so sheets and the search dock can opt in without
 * moving the entire application.
 */
export function useViewportInsets(rootRef: ViewportRoot) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const viewport = window.visualViewport;

    const update = () => {
      const visualHeight = viewport?.height ?? window.innerHeight;
      const offsetTop = viewport?.offsetTop ?? 0;
      const keyboard = Math.max(0, Math.round(window.innerHeight - visualHeight - offsetTop));
      root.style.setProperty('--omni-vvh', `${Math.round(visualHeight)}px`);
      root.style.setProperty('--omni-keyboard', `${keyboard}px`);
      root.style.setProperty('--keyboard-inset', `${keyboard}px`);
      root.toggleAttribute('data-keyboard-visible', keyboard > KEYBOARD_THRESHOLD);
      root.toggleAttribute('data-keyboard-open', keyboard > KEYBOARD_THRESHOLD);
    };

    update();
    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      root.style.removeProperty('--omni-vvh');
      root.style.removeProperty('--omni-keyboard');
      root.style.removeProperty('--keyboard-inset');
      root.removeAttribute('data-keyboard-visible');
      root.removeAttribute('data-keyboard-open');
    };
  }, [rootRef]);
}

/** Prevents document scrolling while an Omni sheet, menu or popover owns focus. */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
    };
  }, [active]);
}
