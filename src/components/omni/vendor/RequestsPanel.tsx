import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateFr } from "@/lib/omni";
import { useMarket } from "@/lib/market";
import { respondToRequest, type VendorRequest } from "@/lib/vendor.functions";

type Props = {
  facilityId: string;
  requests: VendorRequest[];
  onRefresh: () => void | Promise<void>;
};

export function RequestsPanel({ facilityId, requests, onRefresh }: Props) {
  const { formatMoney } = useMarket();
  const respond = useServerFn(respondToRequest);

  async function setStatus(cartId: string, accept: boolean) {
    try {
      await respond({ data: { facilityId, cartId, accept } });
      await onRefresh();
      toast.success(accept ? "Demande acceptée." : "Demande refusée.");
    } catch {
      toast.error("Mise à jour impossible.");
    }
  }

  return (
    <ul className="space-y-3">
      {requests.map((c) => (
        <li key={c.id} className="omni-card p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{c.buyer_name ?? "Un acheteur"}</p>
            <span className="text-xs text-muted-foreground">{formatDateFr(c.created_at)}</span>
            <Badge
              variant={
                c.status === "confirmed"
                  ? "default"
                  : c.status === "declined" || c.status === "expired"
                    ? "destructive"
                    : "secondary"
              }
            >
              {c.status === "confirmed"
                ? "Acceptée"
                : c.status === "declined"
                  ? "Refusée"
                  : c.status === "expired"
                    ? "Expirée"
                    : c.status === "completed"
                      ? "Terminée"
                      : "En attente"}
            </Badge>
            <span className="ml-auto font-display text-lg font-bold text-primary">
              {formatMoney(c.total)}
            </span>
          </div>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {c.items.map((i, index) => (
              <li key={`${c.id}-${index}`}>
                {i.quantity} × {i.name} — {formatMoney(i.price_at_time * i.quantity)}
              </li>
            ))}
          </ul>
          {c.status === "pending" && (
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => void setStatus(c.id, true)}>
                Accepter
              </Button>
              <Button size="sm" variant="outline" onClick={() => void setStatus(c.id, false)}>
                Refuser
              </Button>
            </div>
          )}
        </li>
      ))}
      {requests.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucune demande reçue.</p>
      )}
    </ul>
  );
}
