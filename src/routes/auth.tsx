import { useState } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { BrandMark } from "@/components/omni/BrandMark";
import { toast } from "sonner";
import { z } from "zod";
import { readPendingAuthRedirect, useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const searchSchema = z.object({ next: z.string().optional(), redirectTo: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Connexion — OmniView" },
      {
        name: "description",
        content:
          "Connectez-vous à OmniView pour gérer vos favoris, vos demandes et votre commerce.",
      },
      { property: "og:title", content: "Connexion — OmniView" },
      {
        property: "og:description",
        content: "Accédez à votre compte acheteur et vendeur OmniView.",
      },
    ],
  }),
  component: AuthPage,
});

const credentials = z.object({
  email: z.string().trim().email({ message: "Adresse e-mail invalide" }).max(255),
  password: z.string().min(8, { message: "8 caractères minimum" }).max(72),
  name: z.string().trim().max(80).optional(),
});

function AuthPage() {
  const navigate = useNavigate();
  const { next, redirectTo } = useSearch({ from: "/auth" });
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const target = redirectTo?.startsWith("/")
    ? redirectTo
    : next === "/vendeur"
      ? "/vendeur"
      : readPendingAuthRedirect("/carte");

  async function submit(mode: "signin" | "signup") {
    const parsed = credentials.safeParse({ email, password, name });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Champs invalides");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        await signIn(parsed.data.email, parsed.data.password);
      } else {
        await signUp(
          parsed.data.email,
          parsed.data.password,
          parsed.data.name || parsed.data.email.split("@")[0]!,
        );
      }
      if (mode === "signup") {
        navigate({ to: "/onboarding", search: { redirectTo: target } });
      } else {
        navigate({ to: target });
      }
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "Connexion impossible. Vérifiez vos identifiants.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--atlas-paper)] px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-6 flex items-center justify-center gap-1.5 font-display text-xl font-extrabold"
        >
          <BrandMark className="h-8 w-8" /> OmniView
        </Link>
        <div className="omni-atlas-surface omni-atlas-ink rounded-[1.75rem] p-6">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--atlas-orange)]">
            Accès Omni
          </p>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Créer un compte</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-5">
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void submit("signin");
                }}
              >
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Connexion…" : "Se connecter"}
                </Button>
                <p className="rounded-lg bg-secondary p-3 text-xs text-muted-foreground">
                  Compte de démonstration : <strong>demo@omni.tg</strong> /{" "}
                  <strong>Demo1234!</strong>
                </p>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-5">
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void submit("signup");
                }}
              >
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nom</Label>
                  <Input
                    id="name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email2">E-mail</Label>
                  <Input
                    id="email2"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password2">Mot de passe</Label>
                  <Input
                    id="password2"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Création…" : "Créer mon compte"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
