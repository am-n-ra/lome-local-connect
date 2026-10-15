import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { placeSpotlightCard } from './spotlight-placement';

/**
 * GUIDE-1b — spotlight de première fois sur la CARTE (surface B).
 *
 * Le fondateur (2026-10-14) veut, à la première fois, « montrer les éléments core ».
 * Ici on met en évidence les vrais éléments de la carte — le changement de rôle, la
 * recherche, le dock — un par un, avec une phrase courte.
 *
 * Non négociable (S-31) : ce n'est JAMAIS un mur. « Passer » est toujours visible, et
 * fermer = ne plus jamais montrer (mémorisé). Aucune position figée : la bulle suit
 * l'élément RÉEL (`getBoundingClientRect`), donc elle survit au responsive.
 */

export interface SpotlightStep {
  /** `data-spot` de l'élément réel à mettre en évidence. */
  spot: string;
  title: string;
  text: string;
}

export const MAP_SPOTLIGHT_STORAGE_KEY = 'omni-map-guide-seen';

/** Les éléments core de la carte, dans l'ordre de lecture (tous présents au repos). */
export const MAP_SPOTLIGHT_STEPS: readonly SpotlightStep[] = [
  { spot: 'rolepill', title: 'Vous êtes ici', text: 'Basculez entre Acheteur et Vendeur : Omni sert les deux, avec la même identité.' },
  { spot: 'filterrail', title: 'Filtrez la carte', text: 'Commerces, particuliers, transport… la carte ne montre que ce que vous choisissez.' },
  { spot: 'dock', title: 'Toujours à portée', text: 'Recherche, scan QR et menu restent au même endroit, quel que soit l’écran.' },
];

interface Rect { top: number; left: number; width: number; height: number }

/**
 * Un spotlight honnête : il EXPLIQUE, il ne BLOQUE pas. Il n'empêche aucun geste
 * (pas de capture du pointeur), il se ferme sur « Passer » ou Échap, et il ne
 * réapparaît plus une fois vu (ou dès que l'utilisateur navigue ailleurs).
 */
export function MapSpotlightV13({ stage, onDone }: { stage: HTMLElement | null; onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardHeight, setCardHeight] = useState(0);
  const raf = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const measure = useCallback(() => {
    if (!stage) return;
    const step = MAP_SPOTLIGHT_STEPS[index];
    const el = stage.querySelector<HTMLElement>(`[data-spot="${step.spot}"]`);
    if (!el) { setRect(null); return; }
    const stageBox = stage.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    setRect({ top: box.top - stageBox.top, left: box.left - stageBox.left, width: box.width, height: box.height });
  }, [stage, index]);

  // La bulle a une hauteur réelle variable (titre + texte + boutons). On la mesure pour
  // pouvoir la garder DANS la fenêtre — sinon elle tombe sous le dock (bug 2026-10-15).
  useLayoutEffect(() => {
    if (cardRef.current) setCardHeight(cardRef.current.getBoundingClientRect().height);
  }, [index, rect]);

  useLayoutEffect(() => {
    measure();
    const onResize = () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(measure);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, [measure]);

  const finish = useCallback(() => {
    try { localStorage.setItem(MAP_SPOTLIGHT_STORAGE_KEY, '1'); } catch { /* stockage indisponible */ }
    onDone();
  }, [onDone]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') finish(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [finish]);

  const step = MAP_SPOTLIGHT_STEPS[index];
  const last = index === MAP_SPOTLIGHT_STEPS.length - 1;

  // La bulle reste TOUJOURS dans la fenêtre : sous l'anneau si ça tient, sinon au-dessus,
  // sinon ancrée en bas. Le dock est collé au bas → sans ce calcul la bulle disparaît
  // (bug mesuré 2026-10-15 : 4 px visibles sur 128, boutons inaccessibles).
  const placement = rect
    ? placeSpotlightCard({
        ring: rect,
        cardHeight: cardHeight || 128,
        viewport: { width: window.innerWidth, height: window.innerHeight },
      })
    : null;

  return (
    <div className="spotlight" role="dialog" aria-modal="false" aria-label="Guide de la carte" data-spot-step={step.spot}>
      {rect && (
        <span
          className="spotlight-ring"
          aria-hidden="true"
          style={{ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 }}
        />
      )}
      <div
        ref={cardRef}
        className="spotlight-card"
        data-placement={placement?.placement ?? 'below'}
        style={{ top: placement ? placement.top : 120, left: placement ? placement.left : 12 }}
      >
        <div className="eyebrow">Comment ça marche · {index + 1} / {MAP_SPOTLIGHT_STEPS.length}</div>
        <b>{step.title}</b>
        <p className="tiny muted" style={{ marginTop: 4 }}>{step.text}</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn ok sm" type="button" onClick={() => (last ? finish() : setIndex((i) => i + 1))}>{last ? 'Terminer' : 'Suivant'}</button>
          <button className="btn ghost sm" type="button" onClick={finish}>Passer</button>
        </div>
      </div>
    </div>
  );
}
