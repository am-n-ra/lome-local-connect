import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@/lib/useServerFn";
import { Heart, ListChecks, LogIn, LogOut, ShoppingCart, MessageCircle, SearchCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { OmniSheet } from "@/components/omni/ui/OmniPrimitives";
import { listNotifications, type NotificationRow } from "@/lib/omni.functions";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { saveMapContext, type MapContextSnapshot, type OmniRole } from "@/lib/map-context";
import { filterMenuActions, type OmniMenuAction } from "@/lib/omni-menu";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenCart?: (() => void) | undefined;
  onOpenWishlist?: (() => void) | undefined;
  onOpenOrders?: (() => void) | undefined;
  onOpenChat?: (() => void) | undefined;
  onOpenDemand?: (() => void) | undefined;
  actions?: OmniMenuAction[];
  activeRole?: OmniRole;
  contextSnapshot?: MapContextSnapshot | null;
  onSwitchRole?: (() => void) | undefined;
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
  actions = [],
  activeRole = "acheteur",
  contextSnapshot = null,
  onSwitchRole,
}: Props) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const cart = useCart();
  const menuActions = filterMenuActions(actions, activeRole, Boolean(user));

  function go(action?: () => void) {
    onOpenChange(false);
    action?.();
  }

  function selectAction(action: OmniMenuAction) {
    onOpenChange(false);
    if (!user && action.requiresAuth) {
      if (contextSnapshot) saveMapContext(contextSnapshot);
      void navigate({ to: "/auth", search: { redirectTo: contextSnapshot?.returnTo ?? "/carte" } });
      return;
    }
    action.onSelect();
  }

  return (
    <OmniSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Omni"
      description={user?.email ?? "Créez votre compte pour accéder à Omni et faire votre recherche."}
      footer={
        user ? (
          <Button variant="outline" className="w-full" onClick={() => go(() => void signOut())}>
            <LogOut className="mr-2 h-4 w-4" /> Déconnexion
          </Button>
        ) : (
          <Button className="w-full" onClick={() => go(() => navigate({ to: "/auth" }))}>
            <LogIn className="mr-2 h-4 w-4" /> Créer votre compte
          </Button>
        )
      }
    >
      <div data-omni-menu="true" data-omni-menu-role={activeRole}>
        <div className="mt-5 rounded-[1.25rem] border border-[var(--atlas-glass-border)] bg-[var(--atlas-paper)]/55 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Navigation
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Retrouvez votre activité sans quitter le contexte de la carte.
          </p>
          <p className="mt-2 text-xs font-semibold text-[var(--omni-orange-deep)]">
            Espace {activeRole === "acheteur" ? "acheteur" : "vendeur"}
          </p>
        </div>

        {menuActions.length > 0 ? (
          <section className="mt-5" aria-label="Actions disponibles">
            <h3 className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Actions disponibles</h3>
            <nav className="grid gap-1.5">
              {menuActions.map((action) => (
                <MenuRow
                  key={action.id}
                  id={action.id}
                  icon={<span aria-hidden="true">{action.icon}</span>}
                  label={action.label}
                  {...(action.description ? { description: action.description } : {})}
                  {...(action.badge != null ? { badge: action.badge } : {})}
                  onClick={() => selectAction(action)}
                />
              ))}
            </nav>
          </section>
        ) : null}

        {onSwitchRole ? (
          <section className="mt-5">
            <MenuRow
              icon={<span aria-hidden="true">⇄</span>}
              label="Changer d’espace"
              description={activeRole === "acheteur" ? "Passer à l’espace vendeur" : "Passer à la recherche buyer"}
              onClick={() => go(onSwitchRole)}
            />
          </section>
        ) : null}

        {actions.length === 0 ? (
          <section className="mt-5">
            <h3 className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Activité
            </h3>
            <nav className="grid gap-1.5" aria-label="Activité">
              {onOpenOrders && <MenuRow icon={<ListChecks className="h-4 w-4" />} label="Transactions" onClick={() => go(onOpenOrders)} />}
              {onOpenChat && <MenuRow icon={<MessageCircle className="h-4 w-4" />} label="Messages" onClick={() => go(onOpenChat)} />}
              {onOpenDemand && <MenuRow icon={<SearchCheck className="h-4 w-4" />} label="Disponibilités" onClick={() => go(onOpenDemand)} />}
              {onOpenWishlist && <MenuRow icon={<Heart className="h-4 w-4" />} label="Recherches enregistrées" onClick={() => go(onOpenWishlist)} />}
              {onOpenCart && <MenuRow icon={<ShoppingCart className="h-4 w-4" />} label="Panier" badge={cart.count} onClick={() => go(onOpenCart)} />}
            </nav>
          </section>
        ) : null}
      </div>
    </OmniSheet>
  );
}

function MenuRow({
  id,
  icon,
  label,
  badge,
  description,
  onClick,
  disabled,
}: {
  id?: string;
  icon: React.ReactNode;
  label: string;
  description?: string;
  badge?: number;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      data-omni-menu-action={id ?? label}
      onClick={onClick}
      disabled={disabled}
      className="grid min-h-11 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[1.1rem] border border-[var(--atlas-glass-border)] bg-[var(--atlas-paper)]/70 px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40"
    >
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      <span className="min-w-0">
        <span className="block truncate">{label}</span>
        {description ? <span className="mt-0.5 block truncate text-[11px] font-normal text-muted-foreground">{description}</span> : null}
      </span>
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
