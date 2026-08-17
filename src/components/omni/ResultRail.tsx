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
      className="pointer-events-none absolute inset-x-3 z-30 mx-auto max-h-[calc(100dvh-var(--omni-dock-clearance,12rem)-0.75rem)] max-w-6xl"
      style={{ bottom: "max(0.75rem, var(--omni-dock-clearance, 12rem))" }}
      role="region"
      aria-label={`Résultats de recherche : ${facilities.length} facility${facilities.length === 1 ? "" : "s"}`}
      aria-live="polite"
      data-omni-result-rail="true"
    >
      <div
        className="pointer-events-auto flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:justify-center"
        tabIndex={0}
        aria-label="Panneau horizontal des facilities trouvées"
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
