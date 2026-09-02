import { useState } from "react";
import { MapPin, Store } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MapCanvas } from "@/components/omni/MapCanvas";
import { CATEGORIES } from "@/lib/omni";

export type SellerOnboardingDraft = {
  name: string;
  category: string;
  type: "fixe" | "mobile";
  phone: string;
  address: string;
  description: string;
  position: { lat: number; lng: number };
};

export function SellerOnboardingFlow({
  center,
  saving,
  onSubmit,
}: {
  center: { lat: number; lng: number };
  saving: boolean;
  onSubmit: (draft: SellerOnboardingDraft) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]?.value ?? "food");
  const [type, setType] = useState<"fixe" | "mobile">("fixe");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [position, setPosition] = useState(center);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Indiquez le nom de votre commerce.");
      return;
    }
    await onSubmit({
      name,
      category,
      type,
      phone,
      address,
      description,
      position,
    });
  }

  function useLocation() {
    if (!navigator.geolocation) {
      toast.error("Position GPS indisponible sur cet appareil.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (coords) => setPosition({ lat: coords.coords.latitude, lng: coords.coords.longitude }),
      () => toast.error("Position GPS indisponible. Placez le point sur la carte."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background px-4 pb-10 pt-[calc(env(safe-area-inset-top)+5rem)]">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 text-center">
          <Store className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-primary">
            Onboarding vendeur V1
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold">Créez votre fiche commerce</h1>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            Quelques informations suffisent pour être visible sur la carte et recevoir des demandes
            de disponibilité. Vous pourrez compléter votre fiche plus tard.
          </p>
        </div>

        <form className="space-y-4" onSubmit={(event) => void submit(event)}>
          <section className="omni-card space-y-4 p-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                1 · Identité
              </p>
              <h2 className="mt-1 font-display text-xl font-bold">
                Comment les acheteurs vous trouvent-ils ?
              </h2>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="seller-onboarding-name">Nom du commerce</Label>
              <Input
                id="seller-onboarding-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={80}
                placeholder="Ex. Boutique Kégué"
                autoComplete="organization"
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="seller-onboarding-category">Catégorie</Label>
                <select
                  id="seller-onboarding-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {CATEGORIES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="seller-onboarding-phone">Téléphone</Label>
                <Input
                  id="seller-onboarding-phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  maxLength={30}
                  placeholder="+228 …"
                  autoComplete="tel"
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-secondary/30 p-3">
              <div>
                <p className="text-sm font-semibold">Commerce ambulant</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  La position pourra être actualisée lorsque vous êtes en ligne.
                </p>
              </div>
              <Switch
                checked={type === "mobile"}
                onCheckedChange={(value) => setType(value ? "mobile" : "fixe")}
              />
            </div>
          </section>

          <section className="omni-card space-y-4 p-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                2 · Localisation
              </p>
              <h2 className="mt-1 font-display text-xl font-bold">
                Placez votre point sur le globe
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                L’adresse aide les acheteurs à vous retrouver. Vous pouvez corriger le point
                directement sur la carte.
              </p>
            </div>
            <div className="h-64 overflow-hidden rounded-2xl border border-border/70">
              <MapCanvas
                facilities={[
                  {
                    id: "new",
                    owner_id: null,
                    name: name || "Mon commerce",
                    category,
                    description: null,
                    address: null,
                    latitude: position.lat,
                    longitude: position.lng,
                    phone: null,
                    status: "unconfirmed",
                    is_online: true,
                    type,
                    last_position_update: null,
                  },
                ]}
                focus={position}
                onMapClick={setPosition}
                className="h-full w-full"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Point actuel : {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
              </p>
              <Button type="button" variant="outline" size="sm" onClick={useLocation}>
                <MapPin className="mr-1.5 h-4 w-4" aria-hidden="true" /> Utiliser ma position
              </Button>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="seller-onboarding-address">Quartier / adresse</Label>
              <Input
                id="seller-onboarding-address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                maxLength={140}
                placeholder="Ex. Kégué, Lomé"
                autoComplete="street-address"
              />
            </div>
          </section>

          <section className="omni-card space-y-4 p-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                3 · Présentation
              </p>
              <h2 className="mt-1 font-display text-xl font-bold">
                Donnez confiance dès la première visite
              </h2>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="seller-onboarding-description">Description courte</Label>
              <Textarea
                id="seller-onboarding-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={400}
                rows={4}
                placeholder="Ce que vous proposez, vos horaires ou une information utile…"
              />
            </div>
            <Button className="w-full" disabled={saving} type="submit">
              {saving ? "Création…" : "Créer ma fiche et continuer"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Votre commerce apparaîtra d’abord comme non confirmé. Vous pourrez ensuite publier vos
              produits et confirmer votre disponibilité.
            </p>
          </section>
        </form>
      </div>
    </div>
  );
}
