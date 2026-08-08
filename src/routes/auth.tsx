import { useState } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const searchSchema = z.object({ next: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Connexion — OmniView" },
      { name: "description", content: "Connectez-vous à OmniView pour gérer vos favoris, vos demandes et votre commerce." },
      { property: "og:title", content: "Connexion — OmniView" },
      { property: "og:description", content: "Accédez à votre compte acheteur et vendeur OmniView." },
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
  const { next } = useSearch({ from: "/auth" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const target = next === "/vendeur" ? "/vendeur" : "/carte";

  async function submit(mode: "signin" | "signup") {
    const parsed = credentials.safeParse({ email, password, name });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Champs invalides");
      return;
    }
    setBusy(true);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      setBusy(false);
      if (error) {
        toast.error("Identifiants incorrects.");
        return;
      }
      navigate({ to: target });
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { name: parsed.data.name || parsed.data.email.split("@")[0] },
        },
      });
      setBusy(false);
      if (error) {
        toast.error(error.message.includes("registered") ? "Cet e-mail est déjà utilisé." : "Inscription impossible.");
        return;
      }
      if (!data.session) {
        toast.info("Vérifiez votre e-mail pour confirmer votre compte.");
        return;
      }
      navigate({ to: target });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-1.5 font-display text-xl font-extrabold">
          <MapPin className="h-5 w-5 text-primary" /> OmniView
        </Link>
        <div className="omni-card p-6">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Créer un compte</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-5 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Mot de passe</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button className="w-full" disabled={busy} onClick={() => void submit("signin")}>
                {busy ? "Connexion…" : "Se connecter"}
              </Button>
              <p className="rounded-lg bg-secondary p-3 text-xs text-muted-foreground">
                Compte de démonstration : <strong>demo@omni.tg</strong> / <strong>OmniDemo2026</strong>
              </p>
            </TabsContent>

            <TabsContent value="signup" className="mt-5 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nom</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email2">E-mail</Label>
                <Input id="email2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password2">Mot de passe</Label>
                <Input id="password2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button className="w-full" disabled={busy} onClick={() => void submit("signup")}>
                {busy ? "Création…" : "Créer mon compte"}
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
