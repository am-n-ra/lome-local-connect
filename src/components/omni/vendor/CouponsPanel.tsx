import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateFr } from "@/lib/omni";
import type { CouponRow } from "@/lib/vendor";

export function CouponsPanel({ facilityId }: { facilityId: string }) {
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [percent, setPercent] = useState("10");

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("coupons")
        .select("*")
        .eq("facility_id", facilityId)
        .order("created_at", { ascending: false });
      const rows = (data ?? []) as CouponRow[];
      setCoupons(rows);
      const { data: reds } = await supabase
        .from("redemptions")
        .select("coupon_id")
        .eq("facility_id", facilityId);
      const map: Record<string, number> = {};
      ((reds ?? []) as { coupon_id: string }[]).forEach((r) => {
        map[r.coupon_id] = (map[r.coupon_id] ?? 0) + 1;
      });
      setCounts(map);
    })();
  }, [facilityId]);

  async function create() {
    const pct = Number(percent);
    if (code.trim().length < 3 || !Number.isFinite(pct) || pct <= 0 || pct > 100) {
      toast.error("Code et pourcentage valides requis.");
      return;
    }
    const { data, error } = await supabase
      .from("coupons")
      .insert({
        facility_id: facilityId,
        code: code.trim().toUpperCase().slice(0, 24),
        description: description.trim().slice(0, 140) || null,
        discount_percent: Math.round(pct),
      })
      .select("*")
      .single();
    if (error || !data) {
      toast.error("Création impossible.");
      return;
    }
    setCoupons((prev) => [data as CouponRow, ...prev]);
    setCode("");
    setDescription("");
    toast.success("Coupon créé.");
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
          <div className="space-y-1.5 sm:col-span-1">
            <Label htmlFor="cdesc">Description</Label>
            <Input id="cdesc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={140} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cpct">Remise (%)</Label>
            <Input id="cpct" inputMode="numeric" value={percent} onChange={(e) => setPercent(e.target.value)} />
          </div>
        </div>
        <Button onClick={() => void create()}>Créer le coupon</Button>
      </div>

      <ul className="space-y-2">
        {coupons.map((c) => (
          <li key={c.id} className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="font-mono font-semibold">{c.code}</p>
              <p className="text-sm text-muted-foreground">
                −{c.discount_percent}% · {c.description ?? "Sans description"} · {formatDateFr(c.created_at)}
              </p>
            </div>
            <span className="text-sm text-muted-foreground">{counts[c.id] ?? 0} utilisation(s)</span>
          </li>
        ))}
        {coupons.length === 0 && <p className="text-sm text-muted-foreground">Aucun coupon.</p>}
      </ul>
    </div>
  );
}
