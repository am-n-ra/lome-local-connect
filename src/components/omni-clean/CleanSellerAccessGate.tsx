import { Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Map } from "lucide-react";
import { BrandMark } from "@/components/omni/BrandMark";

export function CleanSellerAccessGate() {
  return (
    <main className="min-h-[100dvh] bg-[var(--omni-paper)] px-4 py-6 text-[var(--omni-ink)] sm:px-8 sm:py-10">
      <div className="mx-auto grid min-h-[calc(100dvh-3rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1.05fr_.95fr]">
        <section className="rounded-[2.25rem] bg-[var(--omni-orange)] p-7 text-white shadow-[var(--omni-shadow-float)] sm:p-10"><div className="flex items-center gap-3"><BrandMark className="h-11 w-11 rounded-[24%]" /><span className="font-display text-xl font-extrabold">Omni seller</span></div><h1 className="mt-14 max-w-xl font-display text-5xl font-extrabold tracking-[-0.07em] sm:text-6xl">Une seule carte pour gérer ce que vous rendez disponible.</h1><p className="mt-5 max-w-lg text-base leading-7 text-white/80">Connectez-vous pour revendiquer une facilité, lancer votre certification et ouvrir vos opérations seller.</p></section>
        <section className="rounded-[2.25rem] border border-white/80 bg-white/80 p-6 shadow-[var(--omni-shadow-float)] backdrop-blur-xl sm:p-8"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--omni-orange-wash)] text-[var(--omni-orange-deep)]"><Map className="h-6 w-6" /></div><h2 className="mt-6 font-display text-3xl font-extrabold tracking-[-0.05em]">Accéder à votre espace vendeur</h2><p className="mt-3 text-sm leading-6 text-[var(--omni-ink-muted)]">La création, le claim, la certification, les produits, le QR et le Wallet restent dans un seul workspace map-first.</p><div className="mt-6 space-y-3 rounded-2xl bg-[var(--omni-paper)] p-4 text-sm font-bold"><div className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-[var(--omni-orange)]" />Certification avant tout listing</div><div className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-[var(--omni-orange)]" />Bonus 20 $ annoncé, verrouillé jusqu’à 3 ventes</div></div><Link to="/auth" search={{ next: "/vendeur" }} className="omni-clean-primary-button mt-7 min-h-12 w-full">Créer ou ouvrir mon compte <ArrowRight className="h-4 w-4" /></Link><Link to="/" className="omni-clean-secondary-button mt-2 min-h-11 w-full">Retour à la recherche buyer</Link></section>
      </div>
    </main>
  );
}
