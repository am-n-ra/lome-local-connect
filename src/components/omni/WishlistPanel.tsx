import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useServerFn } from "@/lib/useServerFn";
import { deleteWishlist, listWishlists } from "@/lib/omni.functions";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";
import { formatDateFr } from "@/lib/omni";

type Entry = { id: string; search_term: string; created_at: string };

export function WishlistPanel({
  open,
  onOpenChange,
  onRerun,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onRerun?: (term: string) => void;
}) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);

  const load = useServerFn(listWishlists);
  const removeRemote = useServerFn(deleteWishlist);

  useEffect(() => {
    if (!open || !user) return;
    void (async () => {
      try {
        setEntries(await load());
      } catch {
        setEntries([]);
      }
    })();
  }, [open, user, load]);

  async function remove(id: string) {
    await removeRemote({ data: { id } });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex max-h-[min(88dvh,48rem)] w-[min(calc(100vw-1.5rem),34rem)] flex-col overflow-hidden rounded-t-[1.75rem] p-0 sm:rounded-[1.5rem]"
      >
        <SheetHeader>
          <SheetTitle>Produits recherchés</SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {!user && (
            <p className="text-sm text-muted-foreground">
              Connectez-vous pour retrouver vos recherches.
            </p>
          )}
          {user && entries.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Aucune recherche enregistrée. Utilisez « Je cherche ce produit » sur une fiche.
            </p>
          )}
          {entries.map((e) => (
            <div key={e.id} className="omni-card flex items-center gap-2 p-3">
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => {
                  onRerun?.(e.search_term);
                  onOpenChange(false);
                }}
              >
                <p className="truncate font-medium">{e.search_term}</p>
                <p className="text-xs text-muted-foreground">{formatDateFr(e.created_at)}</p>
              </button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Retirer"
                onClick={() => void remove(e.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
