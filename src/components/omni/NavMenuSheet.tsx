import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Heart,
  ListChecks,
  LogIn,
  LogOut,
  SearchCheck,
  Shield,
  ShoppingCart,
  MessageCircle,
  Megaphone,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { BrandMark } from "@/components/omni/BrandMark";
import { listNotifications, type NotificationRow } from "@/lib/omni.functions";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenCart?: (() => void) | undefined;
  onOpenWishlist?: (() => void) | undefined;
  onOpenOrders?: (() => void) | undefined;
  onOpenChat?: (() => void) | undefined;
  onOpenDemand?: (() => void) | undefined;
  activeRole?: "acheteur" | "vendeur";
};

/** Single glass navigation panel holding every secondary action. */
export function NavMenuSheet({
  open,
  onOpenChange,
  onOpenCart,
  onOpenWishlist,
  onOpenOrders,
  onOpenChat,
  onOpenDemand,
  activeRole = "acheteur",
}: Props) {
  const navigate = useNavigate();
  const { user, isStaff, signOut } = useAuth();
  const cart = useCart();

  function go(action?: () => void) {
    onOpenChange(false);
    action?.();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="omni-glass w-full max-w-sm overflow-y-auto border-l border-border/60 p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-[var(--shadow-soft)]"
      >
        <SheetHeader className="p-0 text-left">
          <SheetTitle className="flex items-center gap-2">
            <BrandMark className="h-6 w-6" /> OmniView
          </SheetTitle>
          <SheetDescription className="text-xs">
            {user?.email ?? "Vous n'êtes pas connecté."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 rounded-2xl border border-border/70 bg-background/35 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Navigation
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Retrouvez vos recherches, demandes et achats depuis ce panneau.
          </p>
        </div>

        <section className="mt-5 rounded-2xl border border-border/70 bg-background/35 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Espace actif
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => go(() => navigate({ to: "/carte" }))}
              className={`rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                activeRole === "acheteur"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background/70 text-muted-foreground hover:bg-background"
              }`}
              aria-pressed={activeRole === "acheteur"}
            >
              Acheteur
            </button>
            <button
              type="button"
              onClick={() => go(() => navigate({ to: "/vendeur" }))}
              className={`rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                activeRole === "vendeur"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background/70 text-muted-foreground hover:bg-background"
              }`}
              aria-pressed={activeRole === "vendeur"}
            >
              Vendeur
            </button>
          </div>
        </section>

        <nav className="mt-5 grid gap-1.5" aria-label="Navigation secondaire">
          {onOpenCart && (
            <MenuRow
              icon={<ShoppingCart className="h-4 w-4" />}
              label="Panier"
              badge={cart.count}
              onClick={() => go(onOpenCart)}
            />
          )}
          {onOpenOrders && (
            <MenuRow
              icon={<ListChecks className="h-4 w-4" />}
              label="Mes demandes"
              onClick={() => go(onOpenOrders)}
            />
          )}
          {onOpenChat && (
            <MenuRow
              icon={<MessageCircle className="h-4 w-4" />}
              label="Messages"
              onClick={() => go(onOpenChat)}
            />
          )}
          {onOpenDemand && (
            <MenuRow
              icon={<Megaphone className="h-4 w-4" />}
              label="Vérifier la disponibilité"
              onClick={() => go(onOpenDemand)}
            />
          )}
          {onOpenWishlist && (
            <MenuRow
              icon={<Heart className="h-4 w-4" />}
              label="Produits recherchés"
              onClick={() => go(onOpenWishlist)}
            />
          )}
          {isStaff && (
            <MenuRow
              icon={<Shield className="h-4 w-4" />}
              label="Administration"
              onClick={() => go(() => navigate({ to: "/admin" }))}
            />
          )}
        </nav>

        {user && (
          <section className="mt-6">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <User className="h-4 w-4 shrink-0" /> Mon compte
            </h3>
            <div className="grid gap-1.5">
              {onOpenWishlist && (
                <MenuRow
                  icon={<SearchCheck className="h-4 w-4" />}
                  label="Recherches"
                  onClick={() => go(onOpenWishlist)}
                />
              )}
              {onOpenDemand && (
                <MenuRow
                  icon={<Megaphone className="h-4 w-4" />}
                  label="Disponibilités"
                  onClick={() => go(onOpenDemand)}
                />
              )}
            </div>
          </section>
        )}

        <div className="mt-6">
          {user ? (
            <Button variant="outline" className="w-full" onClick={() => go(() => void signOut())}>
              <LogOut className="mr-2 h-4 w-4" /> Déconnexion
            </Button>
          ) : (
            <Button className="w-full" onClick={() => go(() => navigate({ to: "/auth" }))}>
              <LogIn className="mr-2 h-4 w-4" /> Connexion
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MenuRow({
  icon,
  label,
  badge,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: number;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-background/70 px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-40"
    >
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      <span className="min-w-0 truncate">{label}</span>
      {badge && badge > 0 ? (
        <span className="shrink-0 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
          {badge}
        </span>
      ) : (
        <span />
      )}
    </button>
  );
}

/** Polls the user's notifications for the header badge and the panel list. */
export function useNotificationsFeed() {
  const { user } = useAuth();
  const fetchNotifications = useServerFn(listNotifications);
  const [items, setItems] = useState<NotificationRow[]>([]);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    try {
      setItems(await fetchNotifications({}));
    } catch {
      setItems([]);
    }
  }, [fetchNotifications, user]);

  useEffect(() => {
    void refresh();
    if (!user) return;
    const id = window.setInterval(() => void refresh(), 60000);
    return () => window.clearInterval(id);
  }, [refresh, user]);

  const markAllRead = useCallback(() => {
    setItems((prev) =>
      prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })),
    );
  }, []);

  return { items, unread: items.filter((n) => !n.read_at).length, markAllRead, refresh };
}
