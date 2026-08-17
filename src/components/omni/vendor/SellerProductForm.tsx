import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OmniDisclosure } from "@/components/omni/ui/OmniPrimitives";

export type SellerProductDraft = {
  name: string;
  price: string;
  quantity: string;
  photoUrl: string;
  allocation: string;
  status: "draft" | "active" | "paused" | "sold_out";
  couponCode: string;
  couponDescription: string;
  couponPercent: string;
};

const INITIAL_DRAFT: SellerProductDraft = {
  name: "",
  price: "",
  quantity: "1",
  photoUrl: "",
  allocation: "100",
  status: "active",
  couponCode: "",
  couponDescription: "",
  couponPercent: "10",
};

export function SellerProductForm({
  atProductCap,
  onSubmit,
}: {
  atProductCap: boolean;
  onSubmit: (draft: SellerProductDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<SellerProductDraft>(INITIAL_DRAFT);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  function patch(next: Partial<SellerProductDraft>) {
    setDraft((current) => ({ ...current, ...next }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draft.name.trim().length < 2 || draft.price.trim() === "") {
      toast.error("Indiquez un nom et un prix valides.");
      return;
    }
    setBusy(true);
    try {
      await onSubmit(draft);
      setDraft(INITIAL_DRAFT);
      setAdvancedOpen(false);
      toast.success(draft.couponCode.trim() ? "Produit et coupon ajoutés." : "Produit ajouté.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ajout impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="omni-card space-y-5 p-4 sm:p-5" onSubmit={(event) => void submit(event)}>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Catalogue</p>
        <h3 className="mt-1 font-display text-xl font-bold">Publier un produit</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Commencez par ce que les acheteurs doivent voir : nom, prix et quantité disponible.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="vendor-product-name">Nom du produit</Label>
          <Input
            id="vendor-product-name"
            value={draft.name}
            onChange={(event) => patch({ name: event.target.value })}
            placeholder="Ex. Ciment 50 kg"
            autoComplete="off"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="vendor-product-price">Prix unitaire (FCFA)</Label>
          <Input
            id="vendor-product-price"
            inputMode="numeric"
            type="number"
            min="0"
            value={draft.price}
            onChange={(event) => patch({ price: event.target.value })}
            placeholder="12 000"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="vendor-product-quantity">Quantité disponible</Label>
          <Input
            id="vendor-product-quantity"
            inputMode="numeric"
            type="number"
            min="0"
            value={draft.quantity}
            onChange={(event) => patch({ quantity: event.target.value })}
            placeholder="1"
            required
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={atProductCap || busy}>
          <Plus className="mr-1.5 h-4 w-4" />
          {busy ? "Publication…" : "Publier le produit"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setAdvancedOpen((open) => !open)}
          aria-expanded={advancedOpen}
        >
          {advancedOpen ? "Masquer les options" : "Options avancées"}
        </Button>
      </div>

      {atProductCap ? (
        <p className="rounded-xl bg-destructive/8 px-3 py-2 text-sm text-destructive">
          Votre quota de produits publiés est atteint. Le plan doit être requalifié avant d’en
          ajouter.
        </p>
      ) : null}

      {advancedOpen ? (
        <div className="space-y-4">
          <OmniDisclosure title="Visibilité, média et allocation">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="vendor-product-status">Visibilité</Label>
                <select
                  id="vendor-product-status"
                  value={draft.status}
                  onChange={(event) =>
                    patch({ status: event.target.value as SellerProductDraft["status"] })
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="active">Actif — visible dans la recherche</option>
                  <option value="draft">Brouillon — non publié</option>
                  <option value="paused">En pause</option>
                  <option value="sold_out">Épuisé</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vendor-product-allocation">Allocation interne Omni (%)</Label>
                <Input
                  id="vendor-product-allocation"
                  inputMode="numeric"
                  type="number"
                  min="0"
                  max="100"
                  value={draft.allocation}
                  onChange={(event) => patch({ allocation: event.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Allocation interne, jamais un portefeuille séparé.
                </p>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="vendor-product-photo">Photo ou média (URL facultative)</Label>
                <Input
                  id="vendor-product-photo"
                  value={draft.photoUrl}
                  onChange={(event) => patch({ photoUrl: event.target.value })}
                  placeholder="https://…"
                />
              </div>
            </div>
          </OmniDisclosure>

          <OmniDisclosure title="Coupon produit (facultatif)">
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-xl bg-primary/8 p-3 text-sm">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <p className="text-muted-foreground">
                  Le coupon est attaché à ce produit. La personnalisation par utilisateur sera
                  ajoutée par le moteur d’offres sans changer ce formulaire basic.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-product-coupon">Code coupon</Label>
                  <Input
                    id="vendor-product-coupon"
                    value={draft.couponCode}
                    onChange={(event) => patch({ couponCode: event.target.value.toUpperCase() })}
                    placeholder="Ex. BIENVENUE"
                    maxLength={24}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-product-coupon-percent">Remise (%)</Label>
                  <Input
                    id="vendor-product-coupon-percent"
                    inputMode="numeric"
                    type="number"
                    min="1"
                    max="90"
                    value={draft.couponPercent}
                    onChange={(event) =>
                      patch({ couponPercent: event.target.value.replace(/\D/g, "") })
                    }
                    disabled={!draft.couponCode.trim()}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="vendor-product-coupon-description">Description du coupon</Label>
                  <Textarea
                    id="vendor-product-coupon-description"
                    value={draft.couponDescription}
                    onChange={(event) => patch({ couponDescription: event.target.value })}
                    placeholder="Ex. Offre de bienvenue sur ce produit"
                    maxLength={200}
                    disabled={!draft.couponCode.trim()}
                  />
                </div>
              </div>
              {draft.couponCode.trim() ? (
                <p className="rounded-lg bg-background px-3 py-2 text-sm text-muted-foreground">
                  Aperçu client : <strong>{draft.couponCode.trim().toUpperCase()}</strong> ·
                  économie de {draft.couponPercent || "0"} %.
                </p>
              ) : null}
            </div>
          </OmniDisclosure>
        </div>
      ) : null}
    </form>
  );
}
