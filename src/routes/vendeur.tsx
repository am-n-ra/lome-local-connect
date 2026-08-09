import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { MapPin, Plus, Store } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TopNav } from "@/components/omni/TopNav";
import { MapCanvas } from "@/components/omni/MapCanvas";
import { AdsPanel } from "@/components/omni/vendor/AdsPanel";
import { CouponsPanel } from "@/components/omni/vendor/CouponsPanel";
import { RequestsPanel } from "@/components/omni/vendor/RequestsPanel";
import { DemandPanel } from "@/components/omni/vendor/DemandPanel";
import {
  CATEGORIES,
  daysLeft,
  formatFcfa,
  freshnessLabel,
  LOME_CENTER,
  STATUS_LABEL,
} from "@/lib/omni";
import { FREE_PRODUCT_CAP } from "@/lib/vendor";
import {
  confirmStock,
  createFacility as createFacilityFn,
  deleteProduct,
  getVendorDashboard,
  updateFacility,
  updateMobilePosition,
  upsertProduct,
  type VendorCampaign,
  type VendorCoupon,
  type VendorFacility,
  type VendorProduct,
  type VendorRequest,
  type VendorSubscription,
  type DemandSignal,
} from "@/lib/vendor.functions";

export const Route = createFileRoute("/vendeur")({
  head: () => ({
    meta: [
      { title: "Espace vendeur — OmniView" },
      {
        name: "description",
        content:
          "Créez votre fiche commerce, gérez vos produits, vos demandes et vos campagnes de visibilité à Lomé avec 10 000 FCFA offerts.",
      },
      { property: "og:title", content: "Espace vendeur — OmniView" },
      {
        property: "og:description",
        content: "Gérez votre commerce, vos produits et votre visibilité sur OmniView.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VendeurPage,
});

type Dashboard = {
  facilities: VendorFacility[];
  subscription: VendorSubscription | null;
  products: VendorProduct[];
  campaigns: VendorCampaign[];
  coupons: VendorCoupon[];
  requests: VendorRequest[];
  demand: DemandSignal[];
  walletBalance: number;
};

function VendeurPage() {
  const { user, loading } = useAuth();
  const [data, setData] = useState<Dashboard | null>(null);
  const [ready, setReady] = useState(false);
  const [bonusOpen, setBonusOpen] = useState(false);

  // onboarding form
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]?.value ?? "food");
  const [type, setType] = useState<"fixe" | "mobile">("fixe");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [pos, setPos] = useState(LOME_CENTER);
  const [saving, setSaving] = useState(false);

  // product form
  const [pName, setPName] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pPhoto, setPPhoto] = useState("");

  const loadDashboard = useServerFn(getVendorDashboard);
  const createFacility = useServerFn(createFacilityFn);
  const saveProduct = useServerFn(upsertProduct);
  const removeProductFn = useServerFn(deleteProduct);
  const confirmAll = useServerFn(confirmStock);
  const patchFacility = useServerFn(updateFacility);
  const moveMobile = useServerFn(updateMobilePosition);

  const refresh = useCallback(async () => {
    try {
      setData((await loadDashboard()) as Dashboard);
    } catch {
      setData(null);
    } finally {
      setReady(true);
    }
  }, [loadDashboard]);

  useEffect(() => {
    if (!user) {
      setReady(true);
      return;
    }
    void refresh();
  }, [user, refresh]);

  const facility = data?.facilities[0] ?? null;
  const subscription = data?.subscription ?? null;
  const products = useMemo(() => data?.products ?? [], [data]);
  const pro = useMemo(
    () =>
      !!subscription &&
      subscription.tier === "pro" &&
      !!subscription.pro_active_until &&
      new Date(subscription.pro_active_until).getTime() >= Date.now(),
    [subscription],
  );
  const atProductCap = !pro && products.length >= FREE_PRODUCT_CAP;

  async function submitOnboarding() {
    if (name.trim().length < 2) {
      toast.error("Indiquez le nom de votre commerce.");
      return;
    }
    setSaving(true);
    try {
      await createFacility({
        data: {
          name: name.trim().slice(0, 80),
          category,
          type,
          phone: phone.trim().slice(0, 30) || undefined,
          address: address.trim().slice(0, 140) || undefined,
          description: description.trim().slice(0, 400) || undefined,
          latitude: pos.lat,
          longitude: pos.lng,
        },
      });
      await refresh();
      setBonusOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Création impossible.");
    } finally {
      setSaving(false);
    }
  }

  async function addProduct() {
    if (!facility) return;
    const price = Number(pPrice);
    if (pName.trim().length < 2 || !Number.isFinite(price) || price < 0) {
      toast.error("Nom et prix valides requis.");
      return;
    }
    try {
      await saveProduct({
        data: {
          facilityId: facility.id,
          name: pName.trim().slice(0, 80),
          price: Math.round(price),
          inStock: true,
          photoUrl: pPhoto.trim() || null,
        },
      });
      await refresh();
      setPName("");
      setPPrice("");
      setPPhoto("");
      toast.success("Produit ajouté.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ajout impossible.");
    }
  }

  async function toggleStock(product: VendorProduct) {
    if (!facility) return;
    try {
      await saveProduct({
        data: {
          facilityId: facility.id,
          productId: product.id,
          name: product.name,
          price: product.price,
          inStock: !product.in_stock,
          discountPercent: product.discount_percent,
          photoUrl: product.photo_url,
        },
      });
      await refresh();
    } catch {
      toast.error("Mise à jour impossible.");
    }
  }

  async function confirmProduct(product: VendorProduct) {
    if (!facility) return;
    try {
      await saveProduct({
        data: {
          facilityId: facility.id,
          productId: product.id,
          name: product.name,
          price: product.price,
          inStock: product.in_stock,
          discountPercent: product.discount_percent,
          photoUrl: product.photo_url,
        },
      });
      await refresh();
      toast.success("Disponibilité confirmée.");
    } catch {
      toast.error("Confirmation impossible.");
    }
  }

  async function removeProduct(product: VendorProduct) {
    if (!facility) return;
    try {
      await removeProductFn({ data: { facilityId: facility.id, productId: product.id } });
      await refresh();
    } catch {
      toast.error("Suppression impossible.");
    }
  }

  async function confirmEverything() {
    if (!facility) return;
    try {
      await confirmAll({ data: { facilityId: facility.id } });
      await refresh();
      toast.success("Tout le catalogue a été confirmé.");
    } catch {
      toast.error("Confirmation impossible.");
    }
  }

  async function toggleOnline(next: boolean) {
    if (!facility) return;
    try {
      await patchFacility({ data: { facilityId: facility.id, isOnline: next } });
      await refresh();
    } catch {
      toast.error("Mise à jour impossible.");
    }
  }

  async function updatePosition(coords: { lat: number; lng: number }) {
    if (!facility) return;
    try {
      if (facility.type === "mobile") {
        await moveMobile({
          data: {
            facilityId: facility.id,
            latitude: coords.lat,
            longitude: coords.lng,
            active: facility.is_online,
          },
        });
      } else {
        await patchFacility({
          data: { facilityId: facility.id, latitude: coords.lat, longitude: coords.lng },
        });
      }
      await refresh();
      toast.success("Position mise à jour.");
    } catch {
      toast.error("Position non enregistrée.");
    }
  }

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
              <Input
                id="fname"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
              />
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
            <div className="space-y-1.5">
              <Label htmlFor="fdesc">Description</Label>
              <Textarea
                id="fdesc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={400}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Commerce ambulant</p>
                <p className="text-xs text-muted-foreground">
                  Position mise à jour quand vous êtes en ligne
                </p>
              </div>
              <Switch
                checked={type === "mobile"}
                onCheckedChange={(v) => setType(v ? "mobile" : "fixe")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="faddr">Quartier / adresse</Label>
              <Input
                id="faddr"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                maxLength={140}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fphone">Téléphone</Label>
              <Input
                id="fphone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={30}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Position sur la carte</Label>
              <p className="text-xs text-muted-foreground">
                Touchez la carte pour placer votre commerce, ou utilisez votre position GPS.
              </p>
              <div className="h-56 overflow-hidden rounded-lg border border-border">
                <MapCanvas
                  facilities={[
                    {
                      id: "new",
                      owner_id: null,
                      name: name || "Mon commerce",
                      category,
                      description: null,
                      address: null,
                      latitude: pos.lat,
                      longitude: pos.lng,
                      phone: null,
                      status: "non_confirme",
                      is_online: true,
                      type,
                      last_position_update: null,
                    },
                  ]}
                  focus={pos}
                  onMapClick={setPos}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  navigator.geolocation?.getCurrentPosition(
                    (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
                    () => toast.error("Position GPS indisponible."),
                  )
                }
              >
                <MapPin className="mr-1.5 h-4 w-4" /> Utiliser ma position
              </Button>
            </div>
            <Button className="w-full" disabled={saving} onClick={() => void submitOnboarding()}>
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
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-bold">{facility.name}</h1>
          <Badge variant="secondary">{STATUS_LABEL[facility.status] ?? facility.status}</Badge>
          {pro && <Badge className="bg-gold text-gold-foreground">Pro actif</Badge>}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">En ligne</span>
            <Switch checked={facility.is_online} onCheckedChange={(v) => void toggleOnline(v)} />
          </div>
        </div>

        <Tabs defaultValue="apercu" className="mt-6">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="apercu">Aperçu</TabsTrigger>
            <TabsTrigger value="produits">Produits</TabsTrigger>
            <TabsTrigger value="demandes">Demandes reçues</TabsTrigger>
            <TabsTrigger value="pub">Publicité</TabsTrigger>
            <TabsTrigger value="coupons">Coupons</TabsTrigger>
            <TabsTrigger value="demande-locale">Demande locale</TabsTrigger>
          </TabsList>

          <TabsContent value="apercu" className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="omni-card p-5">
                <p className="text-sm text-muted-foreground">Portefeuille</p>
                <p className="mt-1 font-display text-2xl font-extrabold text-primary">
                  {formatFcfa(data?.walletBalance ?? 0)}
                </p>
              </div>
              <div className="omni-card p-5">
                <p className="text-sm text-muted-foreground">Produits</p>
                <p className="mt-1 font-display text-2xl font-extrabold">{products.length}</p>
              </div>
              <div className="omni-card p-5">
                <p className="text-sm text-muted-foreground">Palier</p>
                <p className="mt-1 font-display text-2xl font-extrabold">
                  {pro ? "Pro" : "Gratuit"}
                </p>
                {pro && (
                  <p className="text-xs text-muted-foreground">
                    {daysLeft(subscription?.pro_active_until ?? null)} jour(s) restants
                  </p>
                )}
              </div>
              <div className="omni-card p-5">
                <p className="text-sm text-muted-foreground">Campagnes</p>
                <p className="mt-1 font-display text-2xl font-extrabold">
                  {data?.campaigns.length ?? 0}
                </p>
              </div>
            </div>

            <div className="omni-card p-5">
              <p className="font-display text-lg font-bold">Ma position</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Touchez la carte pour corriger l'emplacement affiché aux acheteurs.
              </p>
              <div className="mt-3 h-64 overflow-hidden rounded-lg border border-border">
                <MapCanvas
                  facilities={[{ ...facility, owner_id: user.id }]}
                  focus={{ lat: facility.latitude, lng: facility.longitude }}
                  onMapClick={(c) => void updatePosition(c)}
                />
              </div>
              {facility.type === "mobile" && (
                <Button
                  className="mt-3"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigator.geolocation?.getCurrentPosition(
                      (p) =>
                        void updatePosition({ lat: p.coords.latitude, lng: p.coords.longitude }),
                      () => toast.error("Position GPS indisponible."),
                    )
                  }
                >
                  <MapPin className="mr-1.5 h-4 w-4" /> Mettre à jour ma position GPS
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="produits" className="mt-5">
            <div className="omni-card flex flex-wrap gap-2 p-4">
              <Input
                placeholder="Nom du produit"
                value={pName}
                onChange={(e) => setPName(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Prix (FCFA)"
                inputMode="numeric"
                value={pPrice}
                onChange={(e) => setPPrice(e.target.value)}
                className="w-36"
              />
              <Input
                placeholder="URL photo (optionnel)"
                value={pPhoto}
                onChange={(e) => setPPhoto(e.target.value)}
                className="w-56"
              />
              <Button disabled={atProductCap} onClick={() => void addProduct()}>
                <Plus className="mr-1.5 h-4 w-4" /> Ajouter
              </Button>
              <Button variant="outline" onClick={() => void confirmEverything()}>
                Tout confirmer
              </Button>
            </div>
            {atProductCap && (
              <p className="mt-2 text-sm text-destructive">
                Palier gratuit limité à {FREE_PRODUCT_CAP} produits. Alimentez votre portefeuille
                pour repasser Pro.
              </p>
            )}
            <ul className="mt-4 space-y-2">
              {products.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFcfa(p.price)} · {freshnessLabel(p.last_confirmed_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => void confirmProduct(p)}>
                      Confirmer
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {p.in_stock ? "Disponible" : "En rupture"}
                    </span>
                    <Switch checked={p.in_stock} onCheckedChange={() => void toggleStock(p)} />
                    <Button size="sm" variant="ghost" onClick={() => void removeProduct(p)}>
                      Supprimer
                    </Button>
                  </div>
                </li>
              ))}
              {products.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucun produit pour l'instant.</p>
              )}
            </ul>
          </TabsContent>

          <TabsContent value="demandes" className="mt-5">
            <RequestsPanel
              facilityId={facility.id}
              requests={data?.requests ?? []}
              onRefresh={refresh}
            />
          </TabsContent>

          <TabsContent value="pub" className="mt-5">
            <AdsPanel
              facility={facility}
              products={products}
              subscription={subscription}
              campaigns={data?.campaigns ?? []}
              onRefresh={refresh}
            />
          </TabsContent>

          <TabsContent value="coupons" className="mt-5">
            <CouponsPanel
              facilityId={facility.id}
              coupons={data?.coupons ?? []}
              onRefresh={refresh}
            />
          </TabsContent>

          <TabsContent value="demande-locale" className="mt-5">
            <DemandPanel demand={data?.demand ?? []} />
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={bonusOpen} onOpenChange={setBonusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>10 000 FCFA offerts 🎉</DialogTitle>
            <DialogDescription>
              Votre fiche est créée. Ce crédit finance vos campagnes de visibilité et vous garde en
              palier Pro pendant 2 mois.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setBonusOpen(false)}>Commencer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
