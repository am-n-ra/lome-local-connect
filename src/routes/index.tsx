import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  MapPin,
  Navigation,
  Search,
  Sparkles,
  Store,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OmniView — Voyez qui vend ce que vous cherchez à Lomé" },
      {
        name: "description",
        content:
          "Cherchez un produit, vérifiez la disponibilité en temps réel et suivez l'itinéraire jusqu'au vendeur. Gratuit pour les acheteurs, 10 000 FCFA offerts aux vendeurs.",
      },
      { property: "og:title", content: "OmniView — Voyez qui vend ce que vous cherchez à Lomé" },
      {
        property: "og:description",
        content:
          "La découverte de commerces locaux en temps réel à Lomé : disponibilité, distance et itinéraire.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [mode, setMode] = useState<"acheteur" | "vendeur">("acheteur");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <span className="flex items-center gap-1.5 font-display text-lg font-extrabold">
            <MapPin className="h-5 w-5 text-primary" /> OmniView
          </span>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/carte">Explorer la carte</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/vendeur">Je vends</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="mx-auto max-w-6xl px-4 pb-14 pt-10 md:pt-16">
          <div className="mx-auto mb-8 flex w-fit rounded-full border border-border bg-secondary p-1">
            <button
              type="button"
              onClick={() => setMode("acheteur")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                mode === "acheteur" ? "bg-primary text-primary-foreground" : "text-secondary-foreground"
              }`}
            >
              Je cherche quelque chose
            </button>
            <button
              type="button"
              onClick={() => setMode("vendeur")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                mode === "vendeur" ? "bg-primary text-primary-foreground" : "text-secondary-foreground"
              }`}
            >
              Je vends quelque chose
            </button>
          </div>

          {mode === "acheteur" ? (
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-balance font-display text-4xl font-extrabold leading-tight md:text-6xl">
                Vous cherchez un produit ou un service ? Voyez qui l'a près de vous, avant de vous
                déplacer.
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
                Lomé, en temps réel : disponibilité, prix, distance et itinéraire.
              </p>
              <Button asChild size="lg" className="mt-7">
                <Link to="/carte">
                  Rechercher maintenant <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <p className="mt-3 text-sm text-muted-foreground">
                Gratuit. Aucun compte requis pour chercher.
              </p>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-balance font-display text-4xl font-extrabold leading-tight md:text-6xl">
                Vos clients vous cherchent déjà. Ils ne savent juste pas que vous existez.
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
                Créez votre fiche en 2 minutes et apparaissez dans les recherches de votre quartier.
              </p>
              <Button asChild size="lg" className="mt-7">
                <Link to="/vendeur">
                  Rendre mon commerce visible <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <p className="mt-3 text-sm text-muted-foreground">
                10 000 FCFA offerts. Aucune carte bancaire requise.
              </p>
            </div>
          )}
        </section>

        {/* BUYER */}
        <section className="border-y border-border bg-card">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center">
            <div>
              <Badge variant="secondary" className="mb-3">
                Pour les acheteurs
              </Badge>
              <h2 className="font-display text-3xl font-bold">
                Arrêtez de vous déplacer pour rien.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Vous demandez à vos proches, vous tapez au hasard sur Google, vous vous déplacez sans
                savoir si c'est encore disponible. La plupart du temps, vous finissez par acheter
                ailleurs, alors qu'une meilleure option était à deux rues.
              </p>
              <ol className="mt-6 space-y-3">
                {[
                  { icon: Search, text: "Tapez ce que vous cherchez" },
                  { icon: Clock, text: "Vérifiez la disponibilité en temps réel" },
                  { icon: Navigation, text: "Suivez l'itinéraire jusqu'au vendeur" },
                ].map((s, i) => (
                  <li key={s.text} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {i + 1}
                    </span>
                    <s.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{s.text}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-6 text-sm font-medium text-forest">
                Gratuit. Aucun compte requis pour chercher.
              </p>
            </div>

            <div className="omni-card p-4">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                <Search className="h-4 w-4" /> chargeur usb-c
              </div>
              <div className="mt-3 space-y-2">
                {[
                  { name: "Électro Kossi", dist: "450 m", stock: "Disponible", fresh: true },
                  { name: "Tech Store Lomé 2000", dist: "1,8 km", stock: "Disponible", fresh: true },
                  { name: "Moto-Pièces Express", dist: "2,4 km", stock: "En rupture", fresh: false },
                ].map((r) => (
                  <div key={r.name} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">à {r.dist}</p>
                    </div>
                    <Badge className={r.fresh ? "bg-forest text-forest-foreground" : "bg-muted text-muted-foreground"}>
                      {r.stock}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SELLER */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <Badge variant="secondary" className="mb-3">
            Pour les vendeurs
          </Badge>
          <h2 className="font-display text-3xl font-bold">
            Payer pour être vu par tout le monde, ce n'est pas être vu par les bonnes personnes.
          </h2>
          <p className="mt-4 max-w-3xl text-muted-foreground">
            Vous avez déjà payé pour des flyers ou une pub boostée qui n'a presque rien ramené. Un
            vendeur qu'on a interrogé a eu 4 clients sur 100 grâce aux panneaux qu'il a payés.
            OmniView vous met devant des gens qui cherchent déjà ce que vous vendez, pas devant tout
            le monde.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="omni-card p-5">
              <p className="text-sm font-semibold text-muted-foreground">Avant</p>
              <p className="mt-2 font-display text-xl font-bold">Diffusion large, résultat flou.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Flyers, panneaux, publications boostées : beaucoup de vues, peu de clients.
              </p>
            </div>
            <div className="omni-card border-forest/40 bg-forest/5 p-5">
              <p className="text-sm font-semibold text-forest">Avec OmniView</p>
              <p className="mt-2 font-display text-xl font-bold">
                Visibilité auprès de gens qui cherchent activement votre produit.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Vos produits apparaissent au moment exact de la recherche, avec la distance.
              </p>
            </div>
          </div>

          <div className="omni-card mt-6 flex flex-col gap-4 border-primary/30 bg-accent/25 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="flex items-center gap-2 font-display text-2xl font-extrabold">
                <Sparkles className="h-6 w-6 text-primary" /> 10 000 FCFA offerts à l'inscription.
              </p>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Ça débloque 2 mois du palier Pro et sert de budget publicitaire. Aucune carte
                bancaire requise.
              </p>
            </div>
            <Button asChild size="lg">
              <Link to="/vendeur">
                <Store className="mr-2 h-4 w-4" /> Créer ma fiche
              </Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              "Créez votre fiche",
              "Recevez 10 000 FCFA offerts",
              "Vos produits sont vus par des acheteurs qui les cherchent déjà",
            ].map((step, i) => (
              <div key={step} className="omni-card p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                  {i + 1}
                </span>
                <p className="mt-3 font-medium">{step}</p>
              </div>
            ))}
          </div>
        </section>

        {/* TRUST */}
        <section className="border-y border-border bg-card">
          <div className="mx-auto max-w-6xl px-4 py-14 text-center">
            <p className="flex items-center justify-center gap-2 font-display text-3xl font-extrabold">
              <TrendingUp className="h-7 w-7 text-primary" /> Déjà des vendeurs et des acheteurs sur
              OmniView à Lomé.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-8">
              {[
                { n: "14", l: "commerces référencés" },
                { n: "35", l: "produits suivis en temps réel" },
                { n: "5", l: "quartiers couverts" },
              ].map((c) => (
                <div key={c.l}>
                  <p className="font-display text-4xl font-extrabold text-primary">{c.n}</p>
                  <p className="text-sm text-muted-foreground">{c.l}</p>
                </div>
              ))}
            </div>
            <blockquote className="mx-auto mt-10 max-w-2xl text-balance text-lg italic text-muted-foreground">
              « J'ai payé des panneaux toute une saison. Sur cent personnes, quatre sont venues. Ici,
              les gens arrivent en sachant déjà ce que j'ai en boutique. »
              <footer className="mt-2 text-sm not-italic font-medium text-foreground">
                — Kossi, vendeur d'électronique, Hedzranawoe
              </footer>
            </blockquote>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="font-display text-3xl font-bold">Questions fréquentes</h2>
          <Accordion type="single" collapsible className="mt-6">
            <AccordionItem value="q1">
              <AccordionTrigger>Est-ce que c'est payant pour chercher un produit ?</AccordionTrigger>
              <AccordionContent>
                Non, la recherche est entièrement gratuite et ne demande aucun compte.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2">
              <AccordionTrigger>Comment les fiches sont-elles vérifiées ?</AccordionTrigger>
              <AccordionContent>
                Chaque fiche porte un badge : <strong>Non vérifié</strong> (déclaratif),{" "}
                <strong>Vérifié</strong> (coordonnées et emplacement contrôlés) et{" "}
                <strong>Certifié</strong> (commerce visité et validé sur place).
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3">
              <AccordionTrigger>Qu'est-ce que je peux faire avec les 10 000 FCFA ?</AccordionTrigger>
              <AccordionContent>
                Ce montant crédite votre portefeuille vendeur. Il active immédiatement 2 mois du
                palier Pro (fiche mise en avant avec badge Sponsorisé) et sert de budget
                publicitaire : vous pouvez lancer des campagnes ciblées par rayon (1 à 10 km ou tout
                Lomé) sur les produits de votre choix.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span className="flex items-center gap-1.5 font-display font-bold text-foreground">
            <MapPin className="h-4 w-4 text-primary" /> OmniView · Lomé, Togo
          </span>
          <nav className="flex flex-wrap gap-4">
            <Link to="/carte" className="hover:text-foreground">
              Carte
            </Link>
            <Link to="/vendeur" className="hover:text-foreground">
              Espace vendeur
            </Link>
            <Link to="/auth" className="hover:text-foreground">
              Connexion
            </Link>
          </nav>
          <span className="flex items-center gap-1">
            <BadgeCheck className="h-4 w-4" /> Disponibilité confirmée par les vendeurs
          </span>
        </div>
      </footer>
    </div>
  );
}
