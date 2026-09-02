import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@/lib/useServerFn";
import { ArrowRight, CheckCircle2, Globe2, MapPin, Search, ShieldCheck, Store } from "lucide-react";
import { z } from "zod";
import { BrandMark } from "@/components/omni/BrandMark";
import { OmniSkeleton } from "@/components/omni/ui/OmniPrimitives";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { recordProductEvent, saveAnalyticsConsent } from "@/lib/analytics.functions";
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
    accent: "bg-[var(--atlas-orange)]/12 text-[var(--atlas-orange)]",
  },
  {
    title: "Comprenez chaque facility",
    description:
      "Voyez les médias, la confiance, le stock, le prix, la distance et les offres actives.",
    icon: Globe2,
    accent: "bg-[var(--atlas-green)]/12 text-[var(--atlas-green)]",
  },
  {
    title: "Passez de l’intention à l’action",
    description:
      "Demandez la disponibilité, échangez dans le chat, utilisez le QR et suivez la transaction.",
    icon: ShieldCheck,
    accent: "bg-[var(--atlas-amber)]/18 text-[var(--atlas-ink)]",
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
  const [analyticsConsent, setAnalyticsConsent] = useState(false);
  const recordEvent = useServerFn(recordProductEvent);
  const saveConsent = useServerFn(saveAnalyticsConsent);

  const target = useMemo(() => (redirectTo?.startsWith("/") ? redirectTo : "/carte"), [redirectTo]);

  useEffect(() => {
    if (!loading && user) {
      const sessionId =
        typeof window !== "undefined"
          ? window.sessionStorage.getItem("omni.analytics.session")
          : null;
      if (sessionId)
        void recordEvent({
          data: {
            eventName: "onboarding_started",
            sessionId,
            role: "unknown",
            source: "onboarding",
          },
        }).catch(() => undefined);
    }
  }, [loading, recordEvent, target, user]);

  function finish() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "omni.onboarding.v1",
        JSON.stringify({
          completedAt: new Date().toISOString(),
          role,
          language,
          locationState,
          analyticsConsent,
        }),
      );
      const sessionId = window.sessionStorage.getItem("omni.analytics.session");
      if (analyticsConsent && sessionId) {
        void saveConsent({
          data: { consentType: "product_analytics", granted: true, policyVersion: "2026-08-17" },
        }).catch(() => undefined);
        void recordEvent({
          data: { eventName: "onboarding_completed", sessionId, role, source: "onboarding" },
        }).catch(() => undefined);
      }
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

  if (loading) {
    return (
      <main className="grid min-h-[100dvh] place-items-center overflow-x-hidden bg-background px-4">
        <div className="w-full max-w-md space-y-3">
          <OmniSkeleton className="mx-auto h-12 w-12 rounded-2xl" />
          <OmniSkeleton className="h-8 w-3/4" />
          <OmniSkeleton className="h-20 w-full" />
          <OmniSkeleton className="h-12 w-full" />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="grid min-h-[100dvh] place-items-center overflow-x-hidden bg-[var(--atlas-paper)] px-4 py-8">
        <section className="omni-atlas-surface w-full max-w-lg space-y-5 rounded-[1.75rem] p-6 text-center sm:p-8">
          <BrandMark className="mx-auto h-12 w-12" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Bienvenue dans Omni
            </p>
            <h1 className="mt-2 font-display text-3xl font-extrabold">
              Créez votre compte pour accéder à Omni
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Commencez par créer votre compte, puis faites votre recherche. Nous restaurerons
              automatiquement votre recherche initiale et vous montrerons comment comparer, vérifier
              la disponibilité et acheter.
            </p>
          </div>
          <Button
            className="w-full bg-[var(--atlas-orange)] text-white hover:bg-[#e85c0a]"
            onClick={() => void navigate({ to: "/auth", search: { redirectTo: target } })}
          >
            Créer mon compte et faire ma recherche <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <p className="text-xs text-muted-foreground">
            Votre recherche reste attachée à cette session jusqu’à la fin de l’inscription.
          </p>
        </section>
      </main>
    );
  }

  const current = steps[step]!;
  const Icon = current.icon;

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[var(--atlas-paper)] px-4 py-[calc(env(safe-area-inset-top)+1.25rem)] pb-[calc(env(safe-area-inset-bottom)+1.25rem)] sm:px-6">
      <div className="mx-auto flex min-h-[calc(100dvh-2.5rem)] w-full max-w-5xl flex-col justify-center">
        <header className="mb-6 flex min-w-0 items-center justify-between gap-3 sm:mb-8">
          <div className="flex items-center gap-2 font-display text-xl font-extrabold">
            <BrandMark className="h-8 w-8" />
            <span className="truncate">OmniView</span>
          </div>
          <span className="rounded-full border border-[var(--atlas-glass-border)] bg-[var(--atlas-glass)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Bienvenue dans la recherche
          </span>
        </header>

        <section className="grid min-w-0 gap-5 xl:grid-cols-[1.05fr_0.95fr] xl:items-stretch">
          <div className="omni-atlas-surface min-w-0 flex flex-col justify-between rounded-[1.75rem] p-5 sm:p-8">
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
                    className={`rounded-2xl border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 ${index === step ? "border-[var(--atlas-orange)] bg-[var(--atlas-orange)]/8 shadow-[var(--atlas-shadow)]" : "border-[var(--atlas-glass-border)] bg-[var(--atlas-paper)]/55"}`}
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

          <div className="omni-atlas-surface min-w-0 flex flex-col rounded-[1.75rem] p-5 sm:p-8">
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
                  className={`rounded-2xl border p-3 text-left ${role === "buyer" ? "border-[var(--atlas-orange)] bg-[var(--atlas-orange)]/8" : "border-[var(--atlas-glass-border)] bg-[var(--atlas-paper)]/55"}`}
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
                  className={`rounded-2xl border p-3 text-left ${role === "seller" ? "border-[var(--atlas-orange)] bg-[var(--atlas-orange)]/8" : "border-[var(--atlas-glass-border)] bg-[var(--atlas-paper)]/55"}`}
                >
                  <Store className="h-4 w-4 text-primary" />
                  <span className="mt-2 block text-sm font-bold">Vendeur</span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    Je publie et je réponds.
                  </span>
                </button>
              </div>
            </div>

            <label className="mt-5 flex items-start gap-3 rounded-[1.15rem] border border-[var(--atlas-glass-border)] bg-[var(--atlas-paper)]/55 p-3 text-xs leading-5 text-muted-foreground">
              <input
                type="checkbox"
                checked={analyticsConsent}
                onChange={(event) => setAnalyticsConsent(event.target.checked)}
                className="mt-1 accent-primary"
              />
              <span>
                J’accepte les mesures anonymisées qui aident Omni à améliorer la recherche et les
                parcours. Je peux retirer ce consentement plus tard.
              </span>
            </label>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="rounded-[1.15rem] border border-[var(--atlas-glass-border)] bg-[var(--atlas-paper)]/55 p-3">
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
                className="rounded-[1.15rem] border border-[var(--atlas-glass-border)] bg-[var(--atlas-paper)]/55 p-3 text-left transition-colors hover:bg-secondary"
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
              <Button className="min-h-11 w-full sm:w-auto" variant="outline" onClick={() => (step > 0 ? setStep(step - 1) : finish())}>
                {step > 0 ? "Retour" : "Passer pour l’instant"}
              </Button>
              <Button className="min-h-11 w-full bg-[var(--atlas-orange)] text-white hover:bg-[#e85c0a] sm:w-auto" onClick={() => (step < steps.length - 1 ? setStep(step + 1) : finish())}>
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
