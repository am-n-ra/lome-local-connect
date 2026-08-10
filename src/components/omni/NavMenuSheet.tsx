import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Bell,
  Heart,
  ListChecks,
  LogIn,
  LogOut,
  Shield,
  ShoppingCart,
  Store,
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
import { markNotificationsRead } from "@/lib/checkout.functions";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeRole?: "acheteur" | "vendeur";
  onOpenCart?: () => void;
  onOpenWishlist?: () => void;
  onOpenOrders?: () => void;
  notifications: NotificationRow[];
  onNotificationsRead: () => void;
};

/** Single glass navigation panel holding every secondary action. */
export function NavMenuSheet({
  open,
  onOpenChange,
  activeRole = "acheteur",
  onOpenCart,
  onOpenWishlist,
  onOpenOrders,
  notifications,
  onNotificationsRead,
}: Props) {
  const navigate = useNavigate();
  const { user, isStaff, signOut } = useAuth();
  const cart = useCart();
  const markRead = useServerFn(markNotificationsRead);
  const unread = notifications.filter((n) => !n.read_at).length;

  useEffect(() => {
    if (!open || unread === 0 || !user) return;
    void (async () => {
      try {
        await markRead({});
        onNotificationsRead();
      } catch {
        /* silencieux */
      }
    })();
  }, [open, unread, user, markRead, onNotificationsRead]);

  function go(action?: () => void) {
    onOpenChange(false);
    action?.();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="omni-glass w-full max-w-sm overflow-y-auto p-5">
        <SheetHeader className="p-0 text-left">
          <SheetTitle className="flex items-center gap-2">
            <BrandMark className="h-6 w-6" /> OmniView
          </SheetTitle>
          <SheetDescription className="text-xs">
            {user?.email ?? "Vous n'êtes pas connecté."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 grid grid-cols-2 gap-1 rounded-full border border-border bg-secondary/70 p-1 text-sm font-semibold">
          <button
            type="button"
            onClick={() => go(() => navigate({ to: "/carte" }))}
            className={`rounded-full px-3 py-2 transition-colors ${
              activeRole === "acheteur"
                ? "bg-primary text-primary-foreground"
                : "text-secondary-foreground"
            }`}
          >
            Acheteur
          </button>
          <button
            type="button"
            onClick={() => go(() => navigate({ to: "/vendeur" }))}
            className={`flex items-center justify-center gap-1.5 rounded-full px-3 py-2 transition-colors ${
              activeRole === "vendeur"
                ? "bg-primary text-primary-foreground"
                : "text-secondary-foreground"
            }`}
          >
            <Store className="h-4 w-4 shrink-0" />
            Vendeur
          </button>
        </div>

        <nav className="mt-5 grid gap-1.5">
          <MenuRow
            icon={<ShoppingCart className="h-4 w-4" />}
            label="Panier"
            badge={cart.count}
            onClick={() => go(onOpenCart)}
            disabled={!onOpenCart}
          />
          <MenuRow
            icon={<ListChecks className="h-4 w-4" />}
            label="Mes demandes"
            onClick={() => go(onOpenOrders)}
            disabled={!onOpenOrders}
          />
          <MenuRow
            icon={<Heart className="h-4 w-4" />}
            label="Produits recherchés"
            onClick={() => go(onOpenWishlist)}
            disabled={!onOpenWishlist}
          />
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
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Bell className="h-4 w-4 shrink-0" /> Notifications
              {unread > 0 && (
                <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                  {unread}
                </span>
              )}
            </h3>
            <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-border bg-background/70">
              {notifications.length === 0 && (
                <p className="px-3 py-4 text-sm text-muted-foreground">Aucune notification.</p>
              )}
              {notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className="block w-full border-b border-border px-3 py-2 text-left last:border-0 hover:bg-secondary"
                  onClick={() => go(() => n.link && navigate({ to: n.link }))}
                >
                  <span className="block truncate text-sm font-medium">{n.title}</span>
                  {n.body && <span className="block text-xs text-muted-foreground">{n.body}</span>}
                  <span className="block text-[11px] text-muted-foreground">
                    {new Date(n.created_at).toLocaleString("fr-FR")}
                  </span>
                </button>
              ))}
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
    setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })));
  }, []);

  return { items, unread: items.filter((n) => !n.read_at).length, markAllRead, refresh };
}
