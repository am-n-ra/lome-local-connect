import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@/lib/useServerFn";
import { Heart, ListChecks, LogIn, LogOut, ShoppingCart, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { OmniSheet } from "@/components/omni/ui/OmniPrimitives";
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
};

/** Single glass navigation panel holding every secondary action. */
export function NavMenuSheet({
  open,
  onOpenChange,
  onOpenCart,
  onOpenWishlist,
  onOpenOrders,
  onOpenChat,
}: Props) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const cart = useCart();

  function go(action?: () => void) {
    onOpenChange(false);
    action?.();
  }

  return (
    <OmniSheet
      open={open}
      onOpenChange={onOpenChange}
      title="OmniView"
      description={user?.email ?? "Vous n'êtes pas connecté."}
      footer={
        user ? (
          <Button variant="outline" className="w-full" onClick={() => go(() => void signOut())}>
            <LogOut className="mr-2 h-4 w-4" /> Déconnexion
          </Button>
        ) : (
          <Button className="w-full" onClick={() => go(() => navigate({ to: "/auth" }))}>
            <LogIn className="mr-2 h-4 w-4" /> Connexion
          </Button>
        )
      }
    >
      <div>
        <div className="mt-5 rounded-[1.25rem] border border-[var(--atlas-glass-border)] bg-[var(--atlas-paper)]/55 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Navigation
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Retrouvez votre activité sans quitter le contexte de la carte.
          </p>
        </div>

        <section className="mt-5">
          <h3 className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Activité
          </h3>
          <nav className="grid gap-1.5" aria-label="Activité">
            {onOpenOrders && (
              <MenuRow
                icon={<ListChecks className="h-4 w-4" />}
                label="Transactions"
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
            {onOpenWishlist && (
              <MenuRow
                icon={<Heart className="h-4 w-4" />}
                label="Recherches enregistrées"
                onClick={() => go(onOpenWishlist)}
              />
            )}
            {onOpenCart && (
              <MenuRow
                icon={<ShoppingCart className="h-4 w-4" />}
                label="Panier"
                badge={cart.count}
                onClick={() => go(onOpenCart)}
              />
            )}
          </nav>
        </section>
      </div>
    </OmniSheet>
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
      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[1.1rem] border border-[var(--atlas-glass-border)] bg-[var(--atlas-paper)]/70 px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-white disabled:opacity-40"
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
