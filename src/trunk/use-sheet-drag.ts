import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { isSheetDrag, sheetDragOffset, shouldDismissSheet } from './sheet-drag';

/**
 * BRANCH-1 — câblage pointer du geste « tirer la feuille vers le bas pour la fermer ».
 *
 * Le geste démarre sur la poignée (`.handle`) de la feuille ACTIVE. On écoute au niveau du
 * stage (délégation) : une seule attache couvre TOUTES les feuilles, sans modifier les 37
 * composants. Le déplacement est écrit dans la variable CSS `--ty` (déjà lue par `.sheet`),
 * donc le mouvement suit le doigt sans re-render React. La décision fermer/ne-pas-fermer est
 * PURE (`sheet-drag.ts`). Desktop = pas de geste (les feuilles sont des tiroirs/rails).
 */
export function useSheetDrag(onDismiss: () => void) {
  const sheetRef = useRef<HTMLElement | null>(null);
  const startY = useRef(0);
  const startAt = useRef(0);
  const active = useRef(false);
  const dragging = useRef(false);
  const dismissing = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => () => { if (timer.current !== null) clearTimeout(timer.current); }, []);

  const reset = useCallback((animate: boolean) => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    if (animate) sheet.classList.remove('dragging');
    sheet.style.setProperty('--ty', '0px');
  }, []);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (dismissing.current) return;
    // Desktop : les feuilles sont des tiroirs/rails, sans affordance de glissement.
    if (typeof window !== 'undefined' && (window.matchMedia?.('(min-width:1040px)').matches ?? false)) return;
    const handle = (event.target as HTMLElement).closest<HTMLElement>('.handle');
    if (!handle) return;
    const sheet = handle.closest<HTMLElement>('.sheet');
    if (!sheet) return;
    sheetRef.current = sheet;
    startY.current = event.clientY;
    startAt.current = typeof performance !== 'undefined' ? performance.now() : Date.now();
    active.current = true;
    dragging.current = false;
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* capture best-effort */ }
  }, []);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (!active.current || dismissing.current) return;
    const dy = event.clientY - startY.current;
    if (!dragging.current && !isSheetDrag(dy)) return; // sous le seuil : c'est encore un tap
    dragging.current = true;
    const sheet = sheetRef.current;
    if (!sheet) return;
    sheet.classList.add('dragging');
    sheet.style.setProperty('--ty', `${sheetDragOffset(dy)}px`);
  }, []);

  const onPointerUp = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (!active.current || dismissing.current) return;
    active.current = false;
    const startedAt = startAt.current;
    if (!dragging.current) return;
    const dy = event.clientY - startY.current;
    const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt;
    const sheet = sheetRef.current;
    dragging.current = false;
    if (shouldDismissSheet(dy, elapsed) && sheet) {
      // Laisse la feuille finir sa course vers le bas, PUIS ferme (l'état React reste la vérité).
      dismissing.current = true;
      sheet.classList.remove('dragging');
      sheet.style.setProperty('--ty', `${sheet.offsetHeight}px`);
      timer.current = setTimeout(() => { dismissing.current = false; onDismissRef.current(); }, 380);
      return;
    }
    reset(true);
  }, [reset]);

  return { onPointerDown, onPointerMove, onPointerUp };
}
