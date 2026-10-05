/**
 * Squelettes de chargement — une forme de contenu, pas un mot.
 *
 * Le Seed V2 (inventaire 2026-09-23) liste « états vides / erreur / chargement »
 * comme absents, et nomme le danger : « afficher du faux ou du vide illisible ».
 * Un « Chargement… » ne dit rien de ce qui arrive ; un squelette épouse le
 * contenu réel (rail de cartes, lignes de clé/valeur, liste) et reste honnête.
 *
 * ADN visuel hérité (docs/design.md) : monochrome (`--panel`), jamais l'accent
 * `#2E8B6F` (réservé à la confiance), et **pas de shimmer sous
 * `prefers-reduced-motion`** (cf. `ui-v13.css`).
 */

type Variant = 'line' | 'block' | 'thumb' | 'hcard' | 'pitem' | 'kv' | 'stat';

type SkeletonProps = {
  variant?: Variant;
  /** Nombre d'éléments répétés (lignes, cartes, tuiles). */
  count?: number;
  /** Largeur d'une ligne (`line`/`kv`) — ex. `'60%'`. */
  width?: string;
  className?: string;
};

export function Skeleton({ variant = 'line', count = 1, width, className }: SkeletonProps) {
  const items = Array.from({ length: Math.max(1, count) });
  const cls = ['skeleton', 'sk-shimmer', `sk-${variant}`, className].filter(Boolean).join(' ');
  const style = width && (variant === 'line' || variant === 'kv') ? { width } : undefined;

  // Un rail horizontal (cartes de résultat) : chaque carte est un bloc.
  if (variant === 'hcard') {
    return (
      <div className="sk-rail" role="status" aria-busy="true" aria-label="Chargement">
        {items.map((_, i) => <div key={i} className={cls} style={style} />)}
      </div>
    );
  }
  if (count > 1) {
    return (
      <div className="sk-stack" role="status" aria-busy="true" aria-label="Chargement">
        {items.map((_, i) => <div key={i} className={cls} style={style} />)}
      </div>
    );
  }
  return <div className={cls} style={style} role="status" aria-busy="true" aria-label="Chargement" />;
}

/** Fiche détaillée : une vignette + quelques lignes de clé/valeur. */
export function SkeletonDetail({ rows = 3 }: { rows?: number }) {
  return (
    <div role="status" aria-busy="true" aria-label="Chargement">
      <Skeleton variant="block" />
      <div className="sk-stack" style={{ marginTop: 8 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} variant="kv" width={i % 2 === 0 ? '70%' : '52%'} />
        ))}
      </div>
    </div>
  );
}
