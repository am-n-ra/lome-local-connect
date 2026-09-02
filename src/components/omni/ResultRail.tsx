import { FacilityResultCard, type ResultFacility } from "@/components/omni/FacilityResultCard";

export function ResultRail({
  facilities,
  queryLabel,
  onSelect,
}: {
  facilities: ResultFacility[];
  queryLabel: string;
  onSelect: (facility: ResultFacility) => void;
}) {
  if (facilities.length === 0) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-3 z-30 mx-auto max-h-[calc(100dvh-var(--omni-dock-clearance,12rem)-0.75rem)] max-w-6xl pb-[env(safe-area-inset-bottom)] md:inset-x-6"
      style={{ bottom: "max(0.75rem, var(--omni-dock-clearance, 12rem))" }}
      role="region"
      aria-label={`Résultats de recherche : ${facilities.length} facility${facilities.length === 1 ? "" : "s"}`}
      aria-live="polite"
      data-omni-result-rail="true"
    >
      <div
        className="pointer-events-auto mb-2 flex items-center justify-between gap-3 px-1"
        data-omni-result-rail-summary="true"
      >
        <div className="min-w-0">
          <p className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
            Résultats Omni
          </p>
          <p className="truncate text-xs font-semibold text-[var(--atlas-ink)]">{queryLabel}</p>
        </div>
        <span className="shrink-0 rounded-full border border-[var(--atlas-glass-border)] bg-[var(--atlas-glass)] px-3 py-1.5 text-[10px] font-bold text-muted-foreground backdrop-blur-md">
          {facilities.length} résultat{facilities.length > 1 ? "s" : ""}
        </span>
      </div>
      <div
        className="pointer-events-auto flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-px-2 rounded-[1.75rem] border border-[var(--atlas-glass-border)] bg-[var(--atlas-glass)] p-2 pb-3 shadow-[var(--atlas-shadow)] backdrop-blur-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:justify-start xl:justify-center"
        tabIndex={0}
        aria-label="Panneau horizontal des facilities trouvées"
        aria-roledescription="carrousel"
      >
        {facilities.slice(0, 6).map((facility, index) => (
          <FacilityResultCard
            key={facility.id}
            facility={facility}
            index={index}
            queryLabel={queryLabel}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
