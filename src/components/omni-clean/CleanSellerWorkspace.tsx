import type { ReactNode } from "react";
import { Activity, BadgeCheck, Box, ChevronRight, CircleDollarSign, CreditCard, MapPin, QrCode, Store, WalletCards } from "lucide-react";
import { BrandMark } from "@/components/omni/BrandMark";
import type { VendorFacility } from "@/lib/vendor.functions";
import { cn } from "@/lib/utils";

type Tab = "apercu" | "produits" | "demandes" | "encaisser" | "compte" | "coupons" | "solde";

type Props = {
  facility: VendorFacility;
  activeTab: string;
  productsCount: number;
  requestsCount: number;
  couponCount: number;
  pro: boolean;
  bonusProgress: number;
  bonusState: string;
  map: ReactNode;
  panel: ReactNode;
  onTabChange: (tab: Tab) => void;
  onToggleOnline: (next: boolean) => void;
};

const navItems: Array<{ value: Tab; label: string; icon: typeof Store }> = [
  { value: "apercu", label: "Facilité", icon: Store },
  { value: "produits", label: "Catalogue", icon: Box },
  { value: "demandes", label: "Demandes", icon: Activity },
  { value: "encaisser", label: "Scanner QR", icon: QrCode },
  { value: "compte", label: "Compte", icon: WalletCards },
];

function facilityState(facility: VendorFacility) {
  if (facility.status === "confirmed") return "Confirmée";
  if (facility.status === "unconfirmed") return "Unconfirmed";
  if (facility.status === "certified") return "Certifiée";
  if (facility.status === "unclaimed") return "Unclaimed";
  return facility.status;
}

export function CleanSellerWorkspace({
  facility,
  activeTab,
  productsCount,
  requestsCount,
  couponCount,
  pro,
  bonusProgress,
  bonusState,
  map,
  panel,
  onTabChange,
  onToggleOnline,
}: Props) {
  const progress = Math.max(0, Math.min(3, bonusProgress));
  const selectedTab = navItems.some((item) => item.value === activeTab) ? (activeTab as Tab) : "apercu";

  return (
    <main className="omni-clean-seller relative isolate min-h-[100dvh] overflow-hidden bg-[var(--omni-paper)] text-[var(--omni-ink)]">
      <div className="absolute inset-0 z-0">{map}</div>
      <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(244,238,231,.88),rgba(244,238,231,.14)_20%,transparent_44%,rgba(244,238,231,.18))]" />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between">
          <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/75 bg-[color-mix(in_oklab,var(--omni-paper-bright)_86%,transparent)] px-2.5 py-2 shadow-[var(--omni-shadow-float)] backdrop-blur-xl">
            <BrandMark className="h-8 w-8 rounded-[24%]" />
            <div className="hidden sm:block">
              <p className="font-display text-sm font-extrabold tracking-[-0.03em]">Omni seller</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--omni-ink-muted)]">Votre offre, visible.</p>
            </div>
          </div>
          <div className="pointer-events-auto rounded-full border border-white/75 bg-[color-mix(in_oklab,var(--omni-paper-bright)_86%,transparent)] px-3 py-2 text-xs font-extrabold shadow-[var(--omni-shadow-float)] backdrop-blur-xl">
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[var(--omni-orange)]" aria-hidden="true" />
            {pro ? "Pro actif" : "Omni seller"}
          </div>
        </div>
      </header>

      <section className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="pointer-events-auto omni-clean-seller-panel w-full max-w-2xl self-center lg:self-end">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--omni-orange-wash)] text-[var(--omni-orange-deep)]"><MapPin className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--omni-ink-muted)]">Facilité active</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h1 className="truncate font-display text-xl font-extrabold tracking-[-0.03em]">{facility.name}</h1>
                  <span className="omni-clean-state-badge">{facilityState(facility)}</span>
                </div>
                <p className="mt-1 text-xs font-semibold text-[var(--omni-ink-muted)]">{facility.company_name ?? "Compagnie en certification"} · {facility.address ?? facility.neighbourhood ?? "Position active sur la carte"}</p>
              </div>
              <label className="flex shrink-0 items-center gap-2 text-xs font-extrabold">
                <span className={facility.is_online ? "text-[var(--omni-success)]" : "text-[var(--omni-ink-muted)]"}>{facility.is_online ? "Ouverte" : "Pause"}</span>
                <button type="button" aria-label={facility.is_online ? "Mettre la facilité en pause" : "Ouvrir la facilité"} onClick={() => onToggleOnline(!facility.is_online)} className={cn("omni-clean-toggle", facility.is_online && "omni-clean-toggle-on")}><span /></button>
              </label>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-[1.2fr_.8fr]">
              <div className="rounded-2xl bg-[var(--omni-paper)] p-3">
                <div className="flex items-center justify-between gap-2"><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--omni-ink-muted)]">Bonus Omni · 20 $</p><CircleDollarSign className="h-4 w-4 text-[var(--omni-orange)]" /></div>
                <p className="mt-1 text-sm font-extrabold">{bonusState}</p>
                <div className="mt-2 flex gap-1.5" aria-label={`${progress} ventes sur 3`}>
                  {[0, 1, 2].map((step) => <span key={step} className={cn("h-1.5 flex-1 rounded-full", step < progress ? "bg-[var(--omni-orange)]" : "bg-black/10")} />)}
                </div>
                <p className="mt-2 text-[11px] font-semibold text-[var(--omni-ink-muted)]">{progress}/3 ventes Omni · le bonus reste verrouillé jusqu’à la troisième.</p>
              </div>
              <div className="rounded-2xl bg-[var(--omni-paper)] p-3">
                <div className="flex items-center gap-2 text-[var(--omni-ink-muted)]"><BadgeCheck className="h-4 w-4" /><p className="text-[10px] font-extrabold uppercase tracking-[0.14em]">État de confiance</p></div>
                <p className="mt-1 text-sm font-extrabold">{facility.status === "confirmed" ? "Confirmed · Pro éligible" : "Unconfirmed · listing limité"}</p>
                <p className="mt-1 text-[11px] font-semibold text-[var(--omni-ink-muted)]">{productsCount} produits · {requestsCount} demandes · {couponCount} coupons</p>
              </div>
            </div>

            {selectedTab !== "apercu" ? <div className="mt-4 max-h-[min(42dvh,26rem)] overflow-y-auto rounded-2xl bg-[var(--omni-paper)] p-3 sm:p-4">{panel}</div> : null}
            {selectedTab === "apercu" ? <div className="mt-4">{panel}</div> : null}
          </div>

          <nav className="pointer-events-auto omni-clean-seller-nav self-center" aria-label="Navigation seller V1">
            {navItems.map(({ value, label, icon: Icon }) => (
              <button key={value} type="button" onClick={() => onTabChange(value)} className={cn("omni-clean-seller-nav-item", selectedTab === value && "omni-clean-seller-nav-item-active")}>
                <Icon className="h-4 w-4" />
                <span>{label}</span>
                {value === "demandes" && requestsCount > 0 ? <b>{requestsCount}</b> : null}
              </button>
            ))}
          </nav>
        </div>
      </section>
    </main>
  );
}
