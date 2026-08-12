import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, ShoppingBag, Store } from "lucide-react";

import { GlassCard, GlassPanel, LiveStatus, OmniButton } from "@/components/omni/visual";
import { TopNav } from "@/components/omni/TopNav";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OmniView Lomé — Disponibilité locale en direct" },
      {
        name: "description",
        content:
          "Trouvez les commerces ouverts, les produits disponibles et les vendeurs mobiles autour de vous à Lomé.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen omni-surface">
      <TopNav />
      <main className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 px-4 py-12 md:grid-cols-[1.1fr_0.9fr]">
        <section>
          <LiveStatus online label="Carte live de Lomé" detail="stocks, promos, mobiles" />
          <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight md:text-6xl">
            La ville devient une vitrine locale, claire et en direct.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            OmniView harmonise recherche, carte et fiches commerce dans une expérience glass douce :
            trouvez, vérifiez et rejoignez le bon vendeur sans friction.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <OmniButton asChild size="lg">
              <Link to="/carte">
                <MapPin /> Explorer la carte
              </Link>
            </OmniButton>
            <OmniButton asChild variant="glass" size="lg">
              <Link to="/vendeur">
                <Store /> Espace vendeur
              </Link>
            </OmniButton>
          </div>
        </section>
        <GlassPanel className="space-y-4 p-5">
          <GlassCard className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <ShoppingBag />
            </div>
            <div>
              <p className="font-semibold">Disponibilité visible</p>
              <p className="text-sm text-muted-foreground">
                Markers actifs, confirmés, sponsorisés et produits disponibles.
              </p>
            </div>
          </GlassCard>
          <div className="grid grid-cols-2 gap-3">
            <GlassCard>
              <p className="text-3xl font-display font-bold">Live</p>
              <p className="text-sm text-muted-foreground">statuts vendeurs</p>
            </GlassCard>
            <GlassCard>
              <p className="text-3xl font-display font-bold">Glass</p>
              <p className="text-sm text-muted-foreground">panels adaptatifs</p>
            </GlassCard>
          </div>
        </GlassPanel>
      </main>
    </div>
  );
}
