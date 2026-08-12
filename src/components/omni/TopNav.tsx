import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/omni/BrandMark";
import { SmartSearchBar } from "@/components/omni/SmartSearchBar";
import { NavMenuSheet, useNotificationsFeed } from "@/components/omni/NavMenuSheet";
import { useCart } from "@/lib/cart";

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
  /** Map home chrome: only the hamburger floats top-right, no brand/navigation bar. */
  minimalMapChrome?: boolean;
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
}: Props) {
  const navigate = useNavigate();
  const cart = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const feed = useNotificationsFeed();
  const badge = cart.count + feed.unread;

  return (
    <header
      className={
        minimalMapChrome
          ? "pointer-events-none absolute inset-x-0 top-0 z-30 bg-transparent"
          : "sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur"
      }
    >
      <div
        className={
          minimalMapChrome
            ? "flex justify-end px-3 py-3 md:px-5"
            : "mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 md:px-5 md:py-3"
        }
      >
        {!minimalMapChrome && (
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
                onSubmit={(e) => {
                  e.preventDefault();
                  if (onSearchSubmit) onSearchSubmit();
                  else navigate({ to: "/carte" });
                }}
              >
                <SmartSearchBar
                  value={query ?? ""}
                  onChange={(v) => onQueryChange?.(v)}
                  onSubmit={() => {
                    if (onSearchSubmit) onSearchSubmit();
                    else navigate({ to: "/carte" });
                  }}
                />
              </form>
            )}
          </div>
        )}

        <Button
          variant="outline"
          size="icon"
          aria-label="Ouvrir le menu"
          className="omni-glass pointer-events-auto relative shrink-0"
          onClick={() => setMenuOpen(true)}
        >
          <Menu className="h-5 w-5" />
          {badge > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {badge}
            </span>
          )}
        </Button>
      </div>

      <NavMenuSheet
        open={menuOpen}
        onOpenChange={setMenuOpen}
        activeRole={activeRole}
        onOpenCart={onOpenCart}
        onOpenWishlist={onOpenWishlist}
        onOpenOrders={onOpenOrders}
        onOpenChat={onOpenChat}
        onOpenDemand={onOpenDemand}
        notifications={feed.items}
        onNotificationsRead={feed.markAllRead}
      />
    </header>
  );
}
