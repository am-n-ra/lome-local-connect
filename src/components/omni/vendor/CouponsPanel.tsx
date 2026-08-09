import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
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
      <div className="omni-card space-y-3 p-5">
        <p className="font-display text-lg font-bold">Créer un coupon</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="ccode">Code</Label>
            <Input id="ccode" value={code} onChange={(e) => setCode(e.target.value)} maxLength={24} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cdesc">Description</Label>
            <Input
              id="cdesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={140}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cpct">Remise (%)</Label>
            <Input
              id="cpct"
              inputMode="numeric"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={() => void submit()}>Créer le coupon</Button>
      </div>

      <ul className="space-y-2">
        {coupons.map((c) => (
          <li
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
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
