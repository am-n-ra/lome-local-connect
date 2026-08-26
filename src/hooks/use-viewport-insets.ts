import { useEffect } from "react";

/**
 * Publishes the real visual viewport height and the on-screen keyboard height
 * as CSS variables so fixed/absolute UI can stay anchored instead of the whole
 * page being pushed up when the mobile keyboard opens.
 *
 * --omni-vvh       real visible height in px
 * --omni-keyboard  keyboard height in px (0 when closed)
 */
export function useViewportInsets() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    const viewport = window.visualViewport;

    const apply = () => {
      const layoutHeight = window.innerHeight;
      const visibleHeight = viewport?.height ?? layoutHeight;
      const offsetTop = viewport?.offsetTop ?? 0;
      const keyboard = Math.max(0, Math.round(layoutHeight - visibleHeight - offsetTop));
      root.style.setProperty("--omni-vvh", `${Math.round(visibleHeight)}px`);
      root.style.setProperty("--omni-keyboard", `${keyboard}px`);
      root.dataset["omniKeyboard"] = keyboard > 90 ? "open" : "closed";
    };

    apply();
    viewport?.addEventListener("resize", apply);
    viewport?.addEventListener("scroll", apply);
    window.addEventListener("resize", apply);
    window.addEventListener("orientationchange", apply);
    return () => {
      viewport?.removeEventListener("resize", apply);
      viewport?.removeEventListener("scroll", apply);
      window.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", apply);
    };
  }, []);
}

/** Locks body scrolling while an overlay/sheet is open. */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof document === "undefined") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}
