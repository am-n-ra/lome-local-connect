import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Compass, LocateFixed, LoaderCircle, Minus, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { CATEGORIES } from "@/lib/omni";
import { cn } from "@/lib/utils";
import { DEFAULT_FILTERS, type MapFilters } from "@/lib/search-dock-contract";
import { deriveSearchDockActionMode, isSubmitWithinGuard, shouldShowStructuredRow } from "@/lib/search-dock-state";

type LocationStatus = "pending" | "granted" | "fallback" | "unavailable";
type BrowserPermissionStatus = "unknown" | "prompt" | "granted" | "denied" | "unsupported";
type CoverageStatus = "idle" | "loading" | "ready" | "error";

type Props = {
  query: string;
  category: string | null;
  filters: MapFilters;
  quantity: number;
  hasActiveSearch: boolean;
  resultCount: number;
  submittedQuery: string;
  locationStatus: LocationStatus;
  browserPermission: BrowserPermissionStatus;
  coverageStatus: CoverageStatus;
  userPosition: { lat: number; lng: number; accuracy?: number | null } | null;
  approximatePosition: { lat: number; lng: number; accuracy?: number | null } | null;
  isAuthenticated: boolean;
  onQueryChange: (value: string) => void;
  onCategoryChange: (value: string | null) => void;
  onFiltersChange: (value: MapFilters) => void;
  onQuantityChange: (value: number) => void;
  onSearchSubmit: () => void;
  onOpenBulkAvailability: () => void;
  onRequestLocation: () => void;
  onUseMarketFallback: () => void;
  onRetryCoverage: () => void;
};

const CATEGORY_CHIPS = [{ value: null, label: "Tout" }, ...CATEGORIES];

function formatMoney(value: number | null) {
  if (value == null || !Number.isFinite(value)) return "sans limite";
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value)} FCFA`;
}

function categoryText(category: string | null) {
  if (!category) return "votre recherche";
  return CATEGORY_CHIPS.find((chip) => chip.value === category)?.label ?? category;
}

export function CleanBuyerSearchDock({
  query,
  category,
  filters,
  quantity,
  hasActiveSearch,
  resultCount,
  submittedQuery,
  locationStatus,
  browserPermission,
  coverageStatus,
  userPosition,
  approximatePosition,
  isAuthenticated,
  onQueryChange,
  onCategoryChange,
  onFiltersChange,
  onQuantityChange,
  onSearchSubmit,
  onOpenBulkAvailability,
  onRequestLocation,
  onUseMarketFallback,
  onRetryCoverage,
}: Props) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const submitAtRef = useRef(0);
  const [refinementOpen, setRefinementOpen] = useState(false);
  const [structuredOpen, setStructuredOpen] = useState(false);
  const [quantityDraft, setQuantityDraft] = useState(String(quantity));
  const [budgetDraft, setBudgetDraft] = useState(filters.maxPrice == null ? "" : String(filters.maxPrice));
  const explicitStructuredValues = quantity !== 1 || filters.maxPrice !== null;
  const structuredRowOpen = shouldShowStructuredRow(structuredOpen, quantity, filters.maxPrice);
  const actionMode = deriveSearchDockActionMode({ activeSearch: hasActiveSearch, resultCount, coverageStatus });
  const activeFilterCount = [
    filters.radiusKm !== DEFAULT_FILTERS.radiusKm,
    filters.openOnly,
    filters.discountOnly,
    filters.sort !== DEFAULT_FILTERS.sort,
  ].filter(Boolean).length;

  useEffect(() => {
    setQuantityDraft(String(quantity));
  }, [quantity]);

  useEffect(() => {
    setBudgetDraft(filters.maxPrice == null ? "" : String(filters.maxPrice));
  }, [filters.maxPrice]);

  function submit() {
    const now = Date.now();
    if (isSubmitWithinGuard(now, submitAtRef.current)) return;
    submitAtRef.current = now;
    onSearchSubmit();
  }

  function commitQuantity() {
    const next = Math.max(1, Number.parseInt(quantityDraft, 10) || 1);
    setQuantityDraft(String(next));
    setStructuredOpen(true);
    onQuantityChange(next);
  }

  function commitBudget() {
    const parsed = Number.parseInt(budgetDraft, 10);
    const next = Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
    setBudgetDraft(next == null ? "" : String(next));
    setStructuredOpen(true);
    onFiltersChange({ ...filters, maxPrice: next });
  }

  function slide(direction: 1 | -1) {
    railRef.current?.scrollBy({ left: direction * Math.max(180, railRef.current.clientWidth * 0.75), behavior: "smooth" });
  }

  const locationLabel =
    locationStatus === "pending"
      ? "Localisation en cours…"
      : userPosition
        ? "Position GPS active"
        : approximatePosition
          ? "Zone approximative"
          : browserPermission === "prompt"
            ? "Autorisez votre position"
            : browserPermission === "denied"
              ? "Localisation bloquée"
              : locationStatus === "unavailable" || browserPermission === "unsupported"
                ? "Localisation indisponible"
                : "Marché approximatif";
  const locationTone = userPosition ? "text-[var(--omni-orange-deep)]" : approximatePosition ? "text-amber-800" : "text-[var(--omni-ink-muted)]";

  return (
    <div
      data-omni-dock="true"
      data-omni-dock-mode={actionMode}
      data-omni-stage="buyer-clean"
      className="pointer-events-none w-full"
    >
      <div className="pointer-events-auto mx-auto w-full max-w-3xl space-y-2.5">
        {structuredRowOpen ? (
          <div data-omni-dock-row="structured" className="grid grid-cols-1 gap-2 rounded-[1.35rem] border border-white/80 bg-[color-mix(in_oklab,var(--omni-paper-bright)_92%,transparent)] p-2 shadow-[var(--omni-shadow-float)] backdrop-blur-2xl sm:grid-cols-2">
            <div className="rounded-2xl bg-[var(--omni-paper)]/70 px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="clean-quantity" className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--omni-ink-muted)]">Quantité</Label>
                <span className="text-[10px] text-[var(--omni-ink-muted)]">unités</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <button type="button" aria-label="Diminuer la quantité" onClick={() => { setStructuredOpen(true); onQuantityChange(Math.max(1, quantity - 1)); }} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/75 text-[var(--omni-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--omni-orange)]"><Minus className="h-3.5 w-3.5" /></button>
                <Input id="clean-quantity" inputMode="numeric" min={1} value={quantityDraft} onChange={(event) => { setStructuredOpen(true); setQuantityDraft(event.target.value.replace(/\D/g, "")); }} onBlur={commitQuantity} onKeyDown={(event) => { if (event.key === "Enter") commitQuantity(); }} className="h-10 min-w-0 flex-1 border-0 bg-white/70 text-center text-base font-bold shadow-none focus-visible:ring-2 focus-visible:ring-[var(--omni-orange)]" aria-label="Quantité souhaitée" />
                <button type="button" aria-label="Augmenter la quantité" onClick={() => { setStructuredOpen(true); onQuantityChange(quantity + 1); }} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/75 text-[var(--omni-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--omni-orange)]"><Plus className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            <div className="rounded-2xl bg-[var(--omni-paper)]/70 px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="clean-budget" className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--omni-ink-muted)]">Budget maximum</Label>
                <button type="button" aria-pressed={filters.maxPrice === null} onClick={() => { setStructuredOpen(true); setBudgetDraft(""); onFiltersChange({ ...filters, maxPrice: null }); }} className={cn("rounded-full px-2 py-1 text-[10px] font-extrabold", filters.maxPrice === null ? "bg-[var(--omni-ink)] text-white" : "bg-white/80 text-[var(--omni-ink)]")}>Illimité</button>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <Input id="clean-budget" inputMode="numeric" min={0} value={budgetDraft} placeholder="Montant" onChange={(event) => { setStructuredOpen(true); setBudgetDraft(event.target.value.replace(/\D/g, "")); }} onBlur={commitBudget} onKeyDown={(event) => { if (event.key === "Enter") commitBudget(); }} className="h-10 min-w-0 flex-1 border-0 bg-white/70 text-base font-bold shadow-none focus-visible:ring-2 focus-visible:ring-[var(--omni-orange)]" aria-label="Budget maximum" />
                <span className="shrink-0 text-xs text-[var(--omni-ink-muted)]">{formatMoney(filters.maxPrice)}</span>
              </div>
            </div>
          </div>
        ) : null}

        <div data-omni-dock-row="discovery" className="flex min-w-0 flex-wrap items-center gap-2" aria-label="Découverte et affinage">
          <button type="button" aria-expanded={refinementOpen} aria-label={refinementOpen ? "Fermer les options d’affinage" : "Ouvrir les options d’affinage"} onClick={() => setRefinementOpen((open) => !open)} className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/80 bg-[color-mix(in_oklab,var(--omni-paper-bright)_88%,transparent)] px-3 text-[11px] font-extrabold text-[var(--omni-ink)] shadow-[var(--omni-shadow-float)] backdrop-blur-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--omni-orange)]">
            {refinementOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            Affiner
            {activeFilterCount > 0 ? <span className="rounded-full bg-[var(--omni-orange)] px-1.5 py-0.5 text-[10px] text-white">{activeFilterCount}</span> : null}
          </button>
          {!explicitStructuredValues ? (
            <button type="button" aria-expanded={structuredOpen} aria-label={structuredOpen ? "Masquer les paramètres" : "Afficher les paramètres"} onClick={() => setStructuredOpen((open) => !open)} className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/80 bg-[color-mix(in_oklab,var(--omni-paper-bright)_88%,transparent)] px-3 text-[11px] font-extrabold text-[var(--omni-ink)] shadow-[var(--omni-shadow-float)] backdrop-blur-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--omni-orange)]">
              {structuredOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />} Paramètres
            </button>
          ) : <span className="inline-flex min-h-11 items-center rounded-full border border-[var(--omni-orange)]/30 bg-[var(--omni-orange-wash)] px-3 text-[11px] font-extrabold text-[var(--omni-orange-deep)]">Paramètres actifs</span>}
          {refinementOpen ? (
            <div data-omni-refinement="true" className="min-w-full max-h-[min(42dvh,22rem)] space-y-3 overflow-y-auto rounded-[1.35rem] border border-white/80 bg-[color-mix(in_oklab,var(--omni-paper-bright)_94%,transparent)] p-3 shadow-[var(--omni-shadow-float)] backdrop-blur-2xl sm:min-w-[22rem]">
              <div className="flex min-w-0 items-center gap-1 rounded-full bg-[var(--omni-paper)]/70 p-1">
                <button type="button" aria-label="Catégories précédentes" onClick={() => slide(-1)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--omni-orange)]"><ChevronLeft className="h-4 w-4" /></button>
                <div ref={railRef} className="flex min-w-0 gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {CATEGORY_CHIPS.map((chip) => <button key={chip.label} type="button" onClick={() => onCategoryChange(chip.value)} className={cn("min-h-11 shrink-0 rounded-full px-3 py-2 text-[11px] font-extrabold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--omni-orange)]", category === chip.value ? "bg-[var(--omni-ink)] text-white" : "bg-white/75 text-[var(--omni-ink)]")}>{chip.label}</button>)}
                </div>
                <button type="button" aria-label="Catégories suivantes" onClick={() => slide(1)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--omni-orange)]"><ChevronRight className="h-4 w-4" /></button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between"><Label className="text-xs font-bold">Rayon</Label><span className="text-xs text-[var(--omni-ink-muted)]">{filters.radiusKm >= 50 ? "Monde" : `${filters.radiusKm} km`}</span></div>
                <Slider min={1} max={50} step={1} value={[filters.radiusKm]} onValueChange={([value]) => onFiltersChange({ ...filters, radiusKm: value ?? 10 })} />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-xl bg-[var(--omni-paper)]/75 px-3 py-2"><Label htmlFor="clean-open-only" className="text-xs">Ouverts maintenant</Label><Switch id="clean-open-only" checked={filters.openOnly} onCheckedChange={(value) => onFiltersChange({ ...filters, openOnly: value })} /></div>
                <div className="flex items-center justify-between rounded-xl bg-[var(--omni-paper)]/75 px-3 py-2"><Label htmlFor="clean-discount-only" className="text-xs">Avec réduction</Label><Switch id="clean-discount-only" checked={filters.discountOnly} onCheckedChange={(value) => onFiltersChange({ ...filters, discountOnly: value })} /></div>
              </div>
              <div className="space-y-2"><Label className="text-xs font-bold">Trier par</Label><div className="grid grid-cols-3 gap-1">{([["rank", "Pertinence"], ["distance", "Proximité"], ["price", "Prix"]] as const).map(([value, label]) => <button key={value} type="button" onClick={() => onFiltersChange({ ...filters, sort: value })} className={cn("min-h-11 rounded-full px-2 py-2 text-[11px] font-extrabold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--omni-orange)]", filters.sort === value ? "bg-[var(--omni-ink)] text-white" : "bg-white/75 text-[var(--omni-ink)]")}>{label}</button>)}</div></div>
              <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => onFiltersChange(DEFAULT_FILTERS)}>Réinitialiser</Button>
            </div>
          ) : null}
        </div>

        <div data-omni-dock-row="context" className="flex min-w-0 items-center gap-2 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Contexte de localisation">
          <button type="button" onClick={locationStatus === "granted" && userPosition ? undefined : onRequestLocation} disabled={locationStatus === "pending" || Boolean(userPosition)} className={cn("inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-white/80 bg-[color-mix(in_oklab,var(--omni-paper-bright)_88%,transparent)] px-3 text-[11px] font-extrabold shadow-[var(--omni-shadow-float)] backdrop-blur-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--omni-orange)]", locationTone)}>
            {locationStatus === "pending" ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />}{locationLabel}
          </button>
          {!userPosition ? <button type="button" onClick={onUseMarketFallback} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-white/80 bg-[color-mix(in_oklab,var(--omni-paper-bright)_75%,transparent)] px-3 text-[11px] font-bold text-[var(--omni-ink-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--omni-orange)]"><Compass className="h-3.5 w-3.5" />Explorer le monde</button> : null}
          {!isAuthenticated && query.trim() ? <span className="min-w-max text-[11px] font-semibold text-[var(--omni-ink-muted)]">Créez votre compte pour afficher les offres.</span> : null}
          {coverageStatus === "error" ? <button type="button" onClick={onRetryCoverage} className="inline-flex min-h-11 shrink-0 items-center rounded-full px-3 text-[11px] font-extrabold text-[var(--omni-danger)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--omni-orange)]">Réessayer</button> : null}
        </div>

        {actionMode === "loading" ? <div data-omni-dock-row="action" className="flex justify-center"><span className="inline-flex min-h-11 items-center rounded-full border border-white/80 bg-[color-mix(in_oklab,var(--omni-paper-bright)_88%,transparent)] px-3 text-[11px] font-bold text-[var(--omni-ink-muted)] shadow-[var(--omni-shadow-float)] backdrop-blur-xl"><LoaderCircle className="mr-1.5 h-3.5 w-3.5 animate-spin" />Recherche en cours…</span></div> : null}
        {actionMode === "error" ? <div data-omni-dock-row="action" className="flex justify-center"><span className="inline-flex min-h-11 items-center rounded-full border border-[var(--omni-danger)]/30 bg-white/90 px-3 text-[11px] font-bold text-[var(--omni-danger)]">Résultats non actualisés</span></div> : null}
        {actionMode === "results" ? <div data-omni-dock-row="action" className="flex items-center justify-between gap-3 rounded-2xl border border-white/80 bg-[color-mix(in_oklab,var(--omni-paper-bright)_92%,transparent)] p-3 shadow-[var(--omni-shadow-float)] backdrop-blur-2xl"><span className="min-w-0 text-xs font-extrabold">{resultCount} résultat{resultCount > 1 ? "s" : ""} pour « {submittedQuery || query} »</span><button type="button" onClick={onOpenBulkAvailability} className="omni-clean-primary-button min-h-11 shrink-0 whitespace-nowrap">Vérifier la disponibilité</button></div> : null}
        {actionMode === "request" ? <div data-omni-dock-row="action" className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--omni-orange)]/25 bg-[color-mix(in_oklab,var(--omni-paper-bright)_94%,transparent)] p-3 shadow-[var(--omni-shadow-float)] backdrop-blur-2xl"><div className="min-w-0"><p className="text-xs font-extrabold">Dites-nous ce que vous cherchez</p><p className="truncate text-[11px] text-[var(--omni-ink-muted)]">{submittedQuery || query || categoryText(category)}</p></div><button type="button" onClick={onOpenBulkAvailability} className="omni-clean-primary-button min-h-11 shrink-0">Créer une demande</button></div> : null}

        <div data-omni-dock-row="primary" className="rounded-[1.75rem] border border-white/80 bg-[color-mix(in_oklab,var(--omni-paper-bright)_92%,transparent)] p-2 shadow-[var(--omni-shadow-float)] backdrop-blur-2xl sm:p-3">
          <form onSubmit={(event) => { event.preventDefault(); submit(); }} className="flex items-center gap-2">
            <Search className="ml-2 h-5 w-5 shrink-0 text-[var(--omni-ink-muted)]" aria-hidden="true" />
            <Input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Que recherchez-vous ?" aria-label="Rechercher une offre, un produit ou un service" className="h-12 min-w-0 flex-1 border-0 bg-transparent px-1 text-[16px] font-semibold text-[var(--omni-ink)] shadow-none outline-none placeholder:text-[var(--omni-ink-muted)] focus-visible:ring-0" />
            <button type="submit" aria-label="Lancer la recherche" className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--omni-orange)] text-white shadow-[0_10px_22px_-12px_var(--omni-orange-deep)] hover:bg-[var(--omni-orange-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--omni-ink)]"><Search className="h-5 w-5" /></button>
          </form>
        </div>
      </div>
    </div>
  );
}
