import { useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, Minus, Plus, Send, ShieldQuestion, Trash2 } from "lucide-react";
import { checkAvailability, submitCart, submitCarts } from "@/lib/omni.functions";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";
import { useCart, type CartLine } from "@/lib/cart";
import { freshnessLabel } from "@/lib/omni";
import { useMarket } from "@/lib/market";

type Availability = { inStock: boolean; label: string };

export function CartPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { formatMoney } = useMarket();
  const cart = useCart();
  const { user } = useAuth();
  const [sending, setSending] = useState<string | null>(null);
  const [sendingAll, setSendingAll] = useState(false);
  const [checking, setChecking] = useState<string | null>(null);
  const [availability, setAvailability] = useState<Record<string, Availability>>({});

  const groups = cart.lines.reduce<Record<string, CartLine[]>>((acc, line) => {
    (acc[line.facilityId] ??= []).push(line);
    return acc;
  }, {});

  async function verify(facilityId: string, lines: CartLine[]) {
    setChecking(facilityId);
    try {
      const rows = await checkAvailability({
        data: { productIds: lines.map((l) => l.productId) },
      });
      const next: Record<string, Availability> = {};
      for (const row of rows) {
        next[row.id] = {
          inStock: row.in_stock,
          label: row.in_stock ? freshnessLabel(row.last_confirmed_at) : "Indisponible actuellement",
        };
      }
      setAvailability((prev) => ({ ...prev, ...next }));
      const missing = rows.filter((r) => !r.in_stock).length;
      if (missing === 0) toast.success("Tous les articles sont disponibles.");
      else toast.warning(`${missing} article(s) indisponible(s) chez ce vendeur.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Vérification impossible.");
    } finally {
      setChecking(null);
    }
  }

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

  const facilityIds = Object.keys(groups);

  async function sendAll() {
    if (!user) {
      toast.info("Connectez-vous pour envoyer vos demandes.");
      return;
    }
    if (facilityIds.length > 5) {
      toast.error("Vous pouvez contacter 5 vendeurs au maximum en une fois.");
      return;
    }
    setSendingAll(true);
    try {
      const res = await submitCarts({
        data: {
          groups: facilityIds.map((facilityId) => ({
            facilityId,
            items: (groups[facilityId] ?? []).map((l) => ({
              productId: l.productId,
              quantity: l.quantity,
            })),
          })),
        },
      });
      for (const id of res.sent) cart.clearFacility(id);
      if (res.sent.length > 0) {
        toast.success(
          `${res.sent.length} demande(s) envoyée(s). Les vendeurs ont 2 h pour répondre.`,
        );
      }
      if (res.failed.length > 0) {
        toast.warning(`${res.failed.length} envoi(s) ont échoué.`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Envoi impossible pour le moment.");
    } finally {
      setSendingAll(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex max-h-[min(88dvh,48rem)] w-[min(calc(100vw-1.5rem),34rem)] flex-col gap-0 overflow-hidden rounded-t-[1.75rem] p-0 sm:rounded-[1.5rem]"
      >
        <SheetHeader>
          <SheetTitle>Mon panier</SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
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
                      <p className="text-muted-foreground">{formatMoney(l.price)}</p>
                      {availability[l.productId] && (
                        <p
                          className={`flex items-center gap-1 text-xs ${
                            availability[l.productId]!.inStock ? "text-primary" : "text-destructive"
                          }`}
                        >
                          {availability[l.productId]!.inStock ? (
                            <BadgeCheck className="h-3 w-3" />
                          ) : (
                            <ShieldQuestion className="h-3 w-3" />
                          )}
                          {availability[l.productId]!.label}
                        </p>
                      )}
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
                  <span>{formatMoney(subtotal)}</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    variant="outline"
                    className="omni-glass w-full"
                    disabled={checking === facilityId}
                    onClick={() => void verify(facilityId, lines)}
                  >
                    {checking === facilityId ? "Vérification…" : "Vérifier la disponibilité"}
                  </Button>
                  <Button
                    className="w-full"
                    disabled={sending === facilityId}
                    onClick={() => void sendRequest(facilityId, lines)}
                  >
                    {sending === facilityId ? "Envoi…" : "Envoyer la demande"}
                  </Button>
                </div>
              </div>
            );
          })}
          {cart.lines.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-base font-bold">
                <span>Total</span>
                <span>{formatMoney(cart.total)}</span>
              </div>
              {facilityIds.length > 1 && (
                <Button
                  className="w-full"
                  disabled={sendingAll || facilityIds.length > 5}
                  onClick={() => void sendAll()}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {sendingAll ? "Envoi…" : `Envoyer aux ${facilityIds.length} vendeurs`}
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                5 vendeurs maximum par envoi. Chaque demande expire automatiquement après 2 h sans
                réponse.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
