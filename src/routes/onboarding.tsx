import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Globe2, MapPin, Search, ShieldCheck, Store } from "lucide-react";
import { z } from "zod";
import { BrandMark } from "@/components/omni/BrandMark";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

const searchSchema = z.object({ redirectTo: z.string().optional() });

export const Route = createFileRoute("/onboarding")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Bienvenue sur Omni — Le monde est recherchable" },
      {
        name: "description",
        content: "Découvrez comment rechercher, comprendre et agir avec Omni.",
      },
    ],
  }),
  component: OnboardingPage,
});

type Language = "fr" | "en";
type Role = "buyer" | "seller";

const steps = [
  {
    title: "Recherchez ce dont vous avez besoin",
    description:
      "Écrivez un produit, un service ou un besoin. Omni regarde autour de vous et au-delà.",
    icon: Search,
    accent: "bg-primary/12 text-primary",
  },
  {
    title: "Comprenez chaque facility",
    description:
      "Voyez les médias, la confiance, le stock, le prix, la distance et les offres actives.",
    icon: Globe2,
    accent: "bg-forest/12 text-forest",
  },
  {
    title: "Passez de l’intention à l’action",
    description:
      "Demandez la disponibilité, échangez dans le chat, utilisez le QR et suivez la transaction.",
    icon: ShieldCheck,
    accent: "bg-gold/20 text-amber-900",
  },
];

function detectLanguage(): Language {
  if (typeof navigator === "undefined") return "fr";
  return navigator.language.toLowerCase().startsWith("en") ? "en" : "fr";
}

function OnboardingPage() {
  const navigate = useNavigate();
  const { redirectTo } = useSearch({ from: "/onboarding" });
  const { user, loading } = useAuth();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role>("buyer");
  const [language, setLanguage] = useState<Language>(detectLanguage);
  const [locationState, setLocationState] = useState<"idle" | "pending" | "granted" | "denied">(
    "idle",
  );

  const target = useMemo(() => (redirectTo?.startsWith("/") ? redirectTo : "/carte"), [redirectTo]);

  useEffect(() => {
    if (!loading && !user) {
      void navigate({ to: "/auth", search: { redirectTo: target } });
    }
  }, [loading, navigate, target, user]);

  function finish() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "omni.onboarding.v1",
        JSON.stringify({ completedAt: new Date().toISOString(), role, language, locationState }),
      );
    }
    toast.success(
      role === "seller" ? "Votre espace vendeur est prêt." : "Votre recherche est prête.",
    );
    void navigate({ to: target });
  }

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationState("denied");
      return;
    }
    setLocationState("pending");
    navigator.geolocation.getCurrentPosition(
      () => setLocationState("granted"),
      () => setLocationState("denied"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  }

  if (loading || !user) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background text-sm text-muted-foreground">
        Préparation de votre espace…
      </div>
    );
  }

  const current = steps[step]!;
  const Icon = current.icon;

  return (
    <main className="min-h-[100dvh] bg-[radial-gradient(circle_at_top_right,hsl(var(--accent)/0.25),transparent_35%),var(--color-background)] px-4 py-[calc(env(safe-area-inset-top)+1.25rem)] pb-[calc(env(safe-area-inset-bottom)+1.25rem)] sm:px-6">
      <div className="mx-auto flex min-h-[calc(100dvh-2.5rem)] w-full max-w-5xl flex-col justify-center">
        <header className="mb-6 flex items-center justify-between gap-3 sm:mb-8">
          <div className="flex items-center gap-2 font-display text-xl font-extrabold">
            <BrandMark className="h-8 w-8" />
            <span>OmniView</span>
          </div>
          <span className="rounded-full bg-card/75 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Bienvenue dans la recherche
          </span>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
          <div className="omni-glass flex flex-col justify-between p-5 sm:p-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Comment fonctionne Omni
              </p>
              <h1 className="mt-3 max-w-xl font-display text-3xl font-extrabold leading-tight sm:text-5xl">
                Le monde est recherchable.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                Omni relie votre besoin aux produits, services et facilities qui peuvent réellement
                vous aider. Commencez par explorer ; nous vous demanderons les informations utiles
                au bon moment.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {steps.map((item, index) => {
                const StepIcon = item.icon;
                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => setStep(index)}
                    className={`rounded-2xl border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 ${index === step ? "border-primary bg-primary/8 shadow-[var(--shadow-soft)]" : "border-border/70 bg-background/45"}`}
                  >
                    <span className={`grid h-9 w-9 place-items-center rounded-xl ${item.accent}`}>
                      <StepIcon className="h-4 w-4" />
                    </span>
                    <span className="mt-3 block text-xs font-bold">
                      {index + 1}. {item.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="omni-card flex flex-col p-5 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <span className={`grid h-12 w-12 place-items-center rounded-2xl ${current.accent}`}>
                <Icon className="h-6 w-6" />
              </span>
              <span className="text-xs font-bold text-muted-foreground">
                Étape {step + 1} / {steps.length}
              </span>
            </div>
            <h2 className="mt-6 font-display text-2xl font-extrabold">{current.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{current.description}</p>

            <div className="mt-6 space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                Votre espace de départ
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("buyer")}
                  className={`rounded-2xl border p-3 text-left ${role === "buyer" ? "border-primary bg-primary/8" : "border-border bg-background/50"}`}
                >
                  <Search className="h-4 w-4 text-primary" />
                  <span className="mt-2 block text-sm font-bold">Acheteur</span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    Je cherche et je compare.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("seller")}
                  className={`rounded-2xl border p-3 text-left ${role === "seller" ? "border-primary bg-primary/8" : "border-border bg-background/50"}`}
                >
                  <Store className="h-4 w-4 text-primary" />
                  <span className="mt-2 block text-sm font-bold">Vendeur</span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    Je publie et je réponds.
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="rounded-2xl border border-border bg-background/50 p-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Langue
                </span>
                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value as Language)}
                  className="mt-2 w-full bg-transparent text-sm font-bold outline-none"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </label>
              <button
                type="button"
                onClick={requestLocation}
                className="rounded-2xl border border-border bg-background/50 p-3 text-left transition-colors hover:bg-secondary"
              >
                <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> Localisation
                </span>
                <span className="mt-2 block text-sm font-bold">
                  {locationState === "pending"
                    ? "Détection…"
                    : locationState === "granted"
                      ? "Position autorisée"
                      : locationState === "denied"
                        ? "Explorer sans GPS"
                        : "Autoriser si utile"}
                </span>
              </button>
            </div>

            <div className="mt-auto flex flex-col gap-2 pt-8 sm:flex-row sm:justify-between">
              <Button variant="outline" onClick={() => (step > 0 ? setStep(step - 1) : finish())}>
                {step > 0 ? "Retour" : "Passer pour l’instant"}
              </Button>
              <Button onClick={() => (step < steps.length - 1 ? setStep(step + 1) : finish())}>
                {step < steps.length - 1
                  ? "Continuer"
                  : role === "seller"
                    ? "Ouvrir mon espace vendeur"
                    : "Commencer à rechercher"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
