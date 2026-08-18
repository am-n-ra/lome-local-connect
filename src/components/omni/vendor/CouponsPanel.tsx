import { useState } from "react";
import { useServerFn } from "@/lib/useServerFn";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateFr } from "@/lib/omni";
import { createCoupon, deleteCoupon, type VendorCoupon } from "@/lib/vendor.functions";

type Props = {
  facilityId: string;
  coupons: VendorCoupon[];
  onRefresh: () => void | Promise<void>;
};

export function CouponsPanel({ facilityId, coupons, onRefresh }: Props) {
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [percent, setPercent] = useState("10");

  const create = useServerFn(createCoupon);
  const remove = useServerFn(deleteCoupon);

  async function submit() {
    const pct = Number(percent);
    if (code.trim().length < 3 || !Number.isFinite(pct) || pct <= 0 || pct > 90) {
      toast.error("Code (3 caractères min.) et remise entre 1 et 90 % requis.");
      return;
    }
    try {
      await create({
        data: {
          facilityId,
          code: code.trim().toUpperCase().slice(0, 24),
          description: description.trim().slice(0, 140) || undefined,
          discountPercent: Math.round(pct),
        },
      });
      await onRefresh();
      setCode("");
      setDescription("");
      toast.success("Coupon créé.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Création impossible.");
    }
  }

  async function drop(couponId: string) {
    try {
      await remove({ data: { facilityId, couponId } });
      await onRefresh();
    } catch {
      toast.error("Suppression impossible.");
    }
  }

  return (
    <div className="space-y-4">
      <form
        className="omni-atlas-surface space-y-5 rounded-[1.5rem] p-4 sm:p-5"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div>
          <h3 className="font-display text-lg font-bold">Créer une offre</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Donnez un code simple à partager. Le client verra immédiatement l’économie appliquée.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ccode">Code du coupon</Label>
            <Input
              id="ccode"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ex. BIENVENUE"
              maxLength={24}
              className="text-base sm:text-sm"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cpct">Remise (%)</Label>
            <Input
              id="cpct"
              type="number"
              inputMode="numeric"
              min="1"
              max="90"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              className="text-base sm:text-sm"
              required
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cdesc">Description (facultative)</Label>
            <Input
              id="cdesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex. Offre de bienvenue sur votre catalogue"
              maxLength={140}
              className="text-base sm:text-sm"
            />
          </div>
        </div>
        {code.trim() && (
          <p className="rounded-lg bg-secondary/60 px-3 py-2 text-sm text-muted-foreground">
            Aperçu client : <strong>{code.trim().toUpperCase()}</strong> · économie de{" "}
            {percent || "0"} %
          </p>
        )}
        <Button type="submit" className="min-h-11 w-full sm:w-auto">Créer le coupon</Button>
      </form>

      <ul className="space-y-2">
        {coupons.map((c) => (
          <li
            key={c.id}
            className="omni-atlas-surface flex flex-wrap items-center justify-between gap-2 rounded-[1.25rem] p-3"
          >
            <div>
              <p className="font-mono font-semibold">{c.code}</p>
              <p className="text-sm text-muted-foreground">
                −{c.discount_percent}% · {c.description ?? "Sans description"} ·{" "}
                {formatDateFr(c.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {c.redemption_count} utilisation(s)
              </span>
              <Button size="sm" variant="ghost" onClick={() => void drop(c.id)}>
                Supprimer
              </Button>
            </div>
          </li>
        ))}
        {coupons.length === 0 && <p className="text-sm text-muted-foreground">Aucun coupon.</p>}
      </ul>
    </div>
  );
}
