import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, ShoppingBag, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/omni/BrandMark";
import { SmartSearchBar } from "@/components/omni/SmartSearchBar";
import { NavMenuSheet } from "@/components/omni/NavMenuSheet";
import { NotificationsBell } from "@/components/omni/NotificationsBell";
import { OmniMapChrome } from "@/components/omni/ui/OmniMapChrome";
import { useCart } from "@/lib/cart";
import type { MapContextSnapshot } from "@/lib/map-context";
import type { OmniMenuAction } from "@/lib/omni-menu";

type Props = {
  query?: string;
  onQueryChange?: (value: string) => void;
  onSearchSubmit?: () => void;
  onOpenCart?: () => void;
  onOpenWishlist?: () => void;
  onOpenOrders?: () => void;
  onOpenChat?: () => void;
  onOpenDemand?: () => void;
  activeRole?: "acheteur" | "vendeur";
  /** Hides the inline search bar (used when a bottom search dock is shown). */
  hideSearch?: boolean;
  /** Map home chrome: only notifications and the hamburger float top-right. */
  minimalMapChrome?: boolean;
  actions?: OmniMenuAction[];
  contextSnapshot?: MapContextSnapshot | null;
  onSwitchRole?: () => void;
};

export function TopNav({
  query,
  onQueryChange,
  onSearchSubmit,
  onOpenCart,
  onOpenWishlist,
  onOpenOrders,
  onOpenChat,
  onOpenDemand,
  activeRole = "acheteur",
  hideSearch = false,
  minimalMapChrome = false,
  actions = [],
  contextSnapshot = null,
  onSwitchRole,
}: Props) {
  const navigate = useNavigate();
  const cart = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuBadge = cart.count;

  const menu = (
    <NavMenuSheet
      open={menuOpen}
      onOpenChange={setMenuOpen}
      onOpenCart={onOpenCart}
      onOpenWishlist={onOpenWishlist}
      onOpenOrders={onOpenOrders}
      onOpenChat={onOpenChat}
      onOpenDemand={onOpenDemand}
      actions={actions}
      activeRole={activeRole}
      contextSnapshot={contextSnapshot}
      onSwitchRole={onSwitchRole}
    />
  );

  if (minimalMapChrome) {
    return (
      <>
        <OmniMapChrome
          onMenuOpen={() => setMenuOpen(true)}
          menuBadge={menuBadge}
          left={
            <div className="omni-role-switch flex items-center gap-1 p-1" aria-label="Changer d’espace">
              <Button className="omni-role-switch-active h-9 rounded-full px-3" aria-current={activeRole === "acheteur" ? "page" : undefined}>
                <ShoppingBag className="h-4 w-4" />
                <span className="hidden text-xs font-bold min-[360px]:inline">Acheter</span>
              </Button>
              <Button variant="ghost" className="h-9 rounded-full px-3 text-[var(--omni-ink)] hover:bg-[var(--omni-paper-bright)]" onClick={onSwitchRole}>
                <Store className="h-4 w-4" />
                <span className="hidden text-xs font-bold min-[360px]:inline">Vendre</span>
              </Button>
            </div>
          }
        />
        {menu}
      </>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] md:px-5 md:pb-3 md:pt-[calc(env(safe-area-inset-top)+0.75rem)]">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/"
              className="flex shrink-0 items-center gap-1.5 font-display text-lg font-extrabold"
            >
              <BrandMark className="h-7 w-7" />
              <span className="truncate">OmniView</span>
            </Link>

            {!hideSearch && (
              <form
                className="hidden min-w-0 flex-1 items-center md:flex"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (onSearchSubmit) onSearchSubmit();
                  else void navigate({ to: "/carte" });
                }}
              >
                <SmartSearchBar
                  value={query ?? ""}
                  onChange={(value) => onQueryChange?.(value)}
                  onSubmit={() => {
                    if (onSearchSubmit) onSearchSubmit();
                    else void navigate({ to: "/carte" });
                  }}
                />
              </form>
            )}
          </div>

          <div className="flex min-w-0 items-center justify-end gap-2 md:gap-3">
            <NotificationsBell />
            <Button
              variant="outline"
              size="icon"
              aria-label="Ouvrir le menu"
              className="omni-glass relative shrink-0"
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
              {menuBadge > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {menuBadge > 99 ? "99+" : menuBadge}
                </span>
              ) : null}
            </Button>
          </div>
        </div>
      </header>
      {menu}
    </>
  );
}
