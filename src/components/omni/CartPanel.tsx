import { useState } from "react";
import { toast } from "sonner";
import { Minus, Plus, Trash2 } from "lucide-react";
import { submitCart } from "@/lib/omni.functions";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";
import { useCart, type CartLine } from "@/lib/cart";
import { formatFcfa } from "@/lib/omni";

export function CartPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const cart = useCart();
  const { user } = useAuth();
  const [sending, setSending] = useState<string | null>(null);

  const groups = cart.lines.reduce<Record<string, CartLine[]>>((acc, line) => {
    (acc[line.facilityId] ??= []).push(line);
    return acc;
  }, {});

  async function sendRequest(facilityId: string, lines: CartLine[]) {
    if (!user) {
      toast.info("Connectez-vous pour envoyer votre demande.");
      return;
    }
    setSending(facilityId);
    try {
      await submitCart({
        data: {
          facilityId,
          items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        },
      });
      cart.clearFacility(facilityId);
      toast.success("Demande envoyée au vendeur.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Envoi impossible pour le moment.");
    } finally {
      setSending(null);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Mon panier</SheetTitle>
        </SheetHeader>
        <div className="space-y-5 p-4">
          {cart.lines.length === 0 && (
            <p className="text-sm text-muted-foreground">Votre panier est vide.</p>
          )}
          {Object.entries(groups).map(([facilityId, lines]) => {
            const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
            return (
              <div key={facilityId} className="omni-card space-y-3 p-3">
                <p className="font-display font-bold">{lines[0]?.facilityName}</p>
                {lines.map((l) => (
                  <div key={l.productId} className="flex items-center gap-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{l.name}</p>
                      <p className="text-muted-foreground">{formatFcfa(l.price)}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      aria-label="Diminuer"
                      onClick={() => cart.setQuantity(l.productId, l.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-5 text-center font-semibold">{l.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      aria-label="Augmenter"
                      onClick={() => cart.setQuantity(l.productId, l.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      aria-label="Retirer"
                      onClick={() => cart.remove(l.productId)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-semibold">
                  <span>Sous-total</span>
                  <span>{formatFcfa(subtotal)}</span>
                </div>
                <Button
                  className="w-full"
                  disabled={sending === facilityId}
                  onClick={() => void sendRequest(facilityId, lines)}
                >
                  {sending === facilityId ? "Envoi…" : "Envoyer la demande"}
                </Button>
              </div>
            );
          })}
          {cart.lines.length > 0 && (
            <div className="flex items-center justify-between text-base font-bold">
              <span>Total</span>
              <span>{formatFcfa(cart.total)}</span>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
