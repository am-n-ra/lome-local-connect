import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/lib/omni";
import type { CartItemRow, CartRow } from "@/lib/vendor";

type Enriched = CartRow & { items: (CartItemRow & { name: string })[]; total: number };

export function RequestsPanel({ facilityId }: { facilityId: string }) {
  const [carts, setCarts] = useState<Enriched[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data: cartRows } = await supabase
        .from("carts")
        .select("*")
        .eq("facility_id", facilityId)
        .order("created_at", { ascending: false });
      const rows = (cartRows ?? []) as CartRow[];
      if (rows.length === 0) {
        setCarts([]);
        setLoading(false);
        return;
      }
      const [{ data: itemRows }, { data: productRows }] = await Promise.all([
        supabase.from("cart_items").select("*").in("cart_id", rows.map((c) => c.id)),
        supabase.from("products").select("id, name").eq("facility_id", facilityId),
      ]);
      const names = new Map(((productRows ?? []) as { id: string; name: string }[]).map((p) => [p.id, p.name]));
      const items = (itemRows ?? []) as CartItemRow[];
      setCarts(
        rows.map((c) => {
          const own = items
            .filter((i) => i.cart_id === c.id)
            .map((i) => ({ ...i, name: names.get(i.product_id) ?? "Produit" }));
          return {
            ...c,
            items: own,
            total: own.reduce((s, i) => s + i.price_at_time * i.quantity, 0),
          };
        }),
      );
      setLoading(false);
    })();
  }, [facilityId]);

  async function setStatus(cartId: string, status: "accepted" | "declined") {
    const { error } = await supabase.from("carts").update({ status }).eq("id", cartId);
    if (error) {
      toast.error("Mise à jour impossible.");
      return;
    }
    setCarts((prev) => prev.map((c) => (c.id === cartId ? { ...c, status } : c)));
    toast.success(status === "accepted" ? "Demande acceptée." : "Demande refusée.");
  }

  if (loading) return <p className="text-sm text-muted-foreground">Chargement…</p>;

  return (
    <ul className="space-y-3">
      {carts.map((c) => (
        <li key={c.id} className="omni-card p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">Demande d'un acheteur</p>
            <Badge
              variant={
                c.status === "accepted" ? "default" : c.status === "declined" ? "destructive" : "secondary"
              }
            >
              {c.status === "accepted" ? "Acceptée" : c.status === "declined" ? "Refusée" : "En attente"}
            </Badge>
            <span className="ml-auto font-display text-lg font-bold text-primary">{formatFcfa(c.total)}</span>
          </div>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {c.items.map((i) => (
              <li key={i.id}>
                {i.quantity} × {i.name} — {formatFcfa(i.price_at_time * i.quantity)}
              </li>
            ))}
          </ul>
          {c.status === "pending" && (
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => void setStatus(c.id, "accepted")}>
                Accepter
              </Button>
              <Button size="sm" variant="outline" onClick={() => void setStatus(c.id, "declined")}>
                Refuser
              </Button>
            </div>
          )}
        </li>
      ))}
      {carts.length === 0 && <p className="text-sm text-muted-foreground">Aucune demande reçue.</p>}
    </ul>
  );
}
