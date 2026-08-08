import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Store } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TopNav } from "@/components/omni/TopNav";
import {
  CATEGORIES,
  formatFCFA,
  isProActive,
  LOME_CENTER,
  type FacilityRow,
  type ProductRow,
  type SubscriptionRow,
} from "@/lib/omni";

export const Route = createFileRoute("/vendeur")({
  head: () => ({
    meta: [
      { title: "Espace vendeur — OmniView" },
      {
        name: "description",
        content:
          "Créez votre fiche commerce, gérez vos produits et vos campagnes de visibilité à Lomé avec 10 000 FCFA offerts.",
      },
      { property: "og:title", content: "Espace vendeur — OmniView" },
      { property: "og:description", content: "Gérez votre commerce et votre visibilité sur OmniView." },
    ],
  }),
  component: VendeurPage,
});

function VendeurPage() {
  const { user, loading } = useAuth();
  const [facility, setFacility] = useState<FacilityRow | null>(null);
  const [sub, setSub] = useState<SubscriptionRow | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [ready, setReady] = useState(false);

  // onboarding form
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]?.value ?? "");
  const [type, setType] = useState<"fixed" | "mobile">("fixed");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  // product form
  const [pName, setPName] = useState("");
  const [pPrice, setPPrice] = useState("");

  useEffect(() => {
    if (!user) {
      setReady(true);
      return;
    }
    void (async () => {
      const { data: f } = await supabase.from("facilities").select("*").eq("owner_id", user.id).maybeSingle();
      const row = (f ?? null) as FacilityRow | null;
      setFacility(row);
      if (row) {
        const [{ data: s }, { data: p }] = await Promise.all([
          supabase.from("subscriptions").select("*").eq("facility_id", row.id).maybeSingle(),
          supabase.from("products").select("*").eq("facility_id", row.id).order("created_at", { ascending: false }),
        ]);
        setSub((s ?? null) as SubscriptionRow | null);
        setProducts((p ?? []) as ProductRow[]);
      }
      setReady(true);
    })();
  }, [user]);

  const pro = useMemo(() => isProActive(sub), [sub]);

  if (loading || !ready) {
    return <p className="p-8 text-sm text-muted-foreground">Chargement…</p>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav activeRole="vendeur" />
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <Store className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 font-display text-2xl font-bold">Connectez-vous pour vendre</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Créez votre compte vendeur et recevez 10 000 FCFA offerts.
          </p>
          <Button asChild className="mt-6">
            <Link to="/auth" search={{ next: "/vendeur" }}>
              Se connecter
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  async function createFacility() {
    if (!user) return;
    if (name.trim().length < 2) {
      toast.error("Indiquez le nom de votre commerce.");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("facilities")
      .insert({
        owner_id: user.id,
        name: name.trim().slice(0, 80),
        category,
        type,
        phone: phone.trim().slice(0, 30),
        latitude: LOME_CENTER.lat,
        longitude: LOME_CENTER.lng,
        is_online: true,
      })
      .select("*")
      .single();
    if (error || !data) {
      setSaving(false);
      toast.error("Création impossible.");
      return;
    }
    const created = data as FacilityRow;
    const expires = new Date();
    expires.setMonth(expires.getMonth() + 2);
    const { data: s } = await supabase
      .from("subscriptions")
      .insert({
        facility_id: created.id,
        tier: "pro",
        wallet_balance: 10000,
        expires_at: expires.toISOString(),
      })
      .select("*")
      .single();
    setFacility(created);
    setSub((s ?? null) as SubscriptionRow | null);
    setSaving(false);
    toast.success("Fiche créée. 10 000 FCFA offerts ajoutés à votre portefeuille.");
  }

  async function addProduct() {
    if (!facility) return;
    const price = Number(pPrice);
    if (pName.trim().length < 2 || !Number.isFinite(price) || price < 0) {
      toast.error("Nom et prix valides requis.");
      return;
    }
    const { data, error } = await supabase
      .from("products")
      .insert({ facility_id: facility.id, name: pName.trim().slice(0, 80), price, in_stock: true })
      .select("*")
      .single();
    if (error || !data) {
      toast.error("Ajout impossible.");
      return;
    }
    setProducts((prev) => [data as ProductRow, ...prev]);
    setPName("");
    setPPrice("");
    toast.success("Produit ajouté.");
  }

  async function toggleStock(product: ProductRow) {
    const { error } = await supabase
      .from("products")
      .update({ in_stock: !product.in_stock })
      .eq("id", product.id);
    if (error) {
      toast.error("Mise à jour impossible.");
      return;
    }
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, in_stock: !p.in_stock } : p)));
  }

  async function toggleOnline(next: boolean) {
    if (!facility) return;
    const { error } = await supabase.from("facilities").update({ is_online: next }).eq("id", facility.id);
    if (error) {
      toast.error("Mise à jour impossible.");
      return;
    }
    setFacility({ ...facility, is_online: next });
  }

  if (!facility) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav activeRole="vendeur" />
        <div className="mx-auto max-w-lg px-4 py-10">
          <h1 className="font-display text-3xl font-bold">Créez votre fiche</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            2 minutes suffisent. 10 000 FCFA offerts à la création.
          </p>
          <div className="omni-card mt-6 space-y-4 p-5">
            <div className="space-y-1.5">
              <Label htmlFor="fname">Nom du commerce</Label>
              <Input id="fname" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fcat">Catégorie</Label>
              <select
                id="fcat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Commerce ambulant</p>
                <p className="text-xs text-muted-foreground">Position mise à jour quand vous êtes en ligne</p>
              </div>
              <Switch checked={type === "mobile"} onCheckedChange={(v) => setType(v ? "mobile" : "fixed")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fphone">Téléphone</Label>
              <Input id="fphone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} />
            </div>
            <Button className="w-full" disabled={saving} onClick={() => void createFacility()}>
              {saving ? "Création…" : "Créer ma fiche et recevoir 10 000 FCFA"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav activeRole="vendeur" />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-bold">{facility.name}</h1>
          {pro && <Badge className="bg-gold text-gold-foreground">Pro actif</Badge>}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">En ligne</span>
            <Switch checked={facility.is_online} onCheckedChange={(v) => void toggleOnline(v)} />
          </div>
        </div>

        <Tabs defaultValue="apercu" className="mt-6">
          <TabsList>
            <TabsTrigger value="apercu">Aperçu</TabsTrigger>
            <TabsTrigger value="produits">Produits</TabsTrigger>
            <TabsTrigger value="pub">Publicité</TabsTrigger>
          </TabsList>

          <TabsContent value="apercu" className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="omni-card p-5">
              <p className="text-sm text-muted-foreground">Portefeuille</p>
              <p className="mt-1 font-display text-2xl font-extrabold text-primary">
                {formatFCFA(sub?.wallet_balance ?? 0)}
              </p>
            </div>
            <div className="omni-card p-5">
              <p className="text-sm text-muted-foreground">Produits</p>
              <p className="mt-1 font-display text-2xl font-extrabold">{products.length}</p>
            </div>
            <div className="omni-card p-5">
              <p className="text-sm text-muted-foreground">Palier</p>
              <p className="mt-1 font-display text-2xl font-extrabold">{pro ? "Pro" : "Gratuit"}</p>
            </div>
          </TabsContent>

          <TabsContent value="produits" className="mt-5">
            <div className="omni-card flex flex-wrap gap-2 p-4">
              <Input placeholder="Nom du produit" value={pName} onChange={(e) => setPName(e.target.value)} className="flex-1" />
              <Input
                placeholder="Prix (FCFA)"
                inputMode="numeric"
                value={pPrice}
                onChange={(e) => setPPrice(e.target.value)}
                className="w-36"
              />
              <Button onClick={() => void addProduct()}>
                <Plus className="mr-1.5 h-4 w-4" /> Ajouter
              </Button>
            </div>
            <ul className="mt-4 space-y-2">
              {products.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-muted-foreground">{formatFCFA(p.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{p.in_stock ? "Disponible" : "En rupture"}</span>
                    <Switch checked={p.in_stock} onCheckedChange={() => void toggleStock(p)} />
                  </div>
                </li>
              ))}
              {products.length === 0 && <p className="text-sm text-muted-foreground">Aucun produit pour l'instant.</p>}
            </ul>
          </TabsContent>

          <TabsContent value="pub" className="mt-5">
            <div className="omni-card p-5">
              <div className="flex items-center gap-2">
                <p className="font-display text-lg font-bold">Campagnes de visibilité</p>
                <Badge variant="secondary">Mode démo</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Votre solde de {formatFCFA(sub?.wallet_balance ?? 0)} peut financer des campagnes ciblées par rayon
                (1 à 10 km ou tout Lomé). Le paiement est simulé pendant la démo.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
