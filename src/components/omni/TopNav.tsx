import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, LogIn, MapPin, ShoppingCart, Store, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SmartSearchBar } from "@/components/omni/SmartSearchBar";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";

type Props = {
  query?: string;
  onQueryChange?: (value: string) => void;
  onSearchSubmit?: () => void;
  onOpenCart?: () => void;
  onOpenWishlist?: () => void;
  activeRole?: "acheteur" | "vendeur";
};

export function TopNav({
  query,
  onQueryChange,
  onSearchSubmit,
  onOpenCart,
  onOpenWishlist,
  activeRole = "acheteur",
}: Props) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const cart = useCart();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-3 py-2 md:gap-3 md:px-5 md:py-3">
        <Link to="/" className="flex items-center gap-1.5 font-display text-lg font-extrabold">
          <MapPin className="h-5 w-5 text-primary" />
          OmniView
        </Link>

        <form
          className="order-3 flex w-full items-center gap-2 md:order-none md:w-auto md:flex-1"
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

        <div className="ml-auto flex items-center gap-1.5">
          <div className="flex rounded-full border border-border bg-secondary p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => navigate({ to: "/carte" })}
              className={`rounded-full px-3 py-1.5 transition-colors ${
                activeRole === "acheteur"
                  ? "bg-primary text-primary-foreground"
                  : "text-secondary-foreground"
              }`}
            >
              Acheteur
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: "/vendeur" })}
              className={`flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors ${
                activeRole === "vendeur"
                  ? "bg-primary text-primary-foreground"
                  : "text-secondary-foreground"
              }`}
            >
              <Store className="h-3.5 w-3.5" />
              Vendeur
            </button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Produits recherchés"
            onClick={onOpenWishlist}
          >
            <Heart className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Panier"
            className="relative"
            onClick={onOpenCart}
          >
            <ShoppingCart className="h-5 w-5" />
            {cart.count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {cart.count}
              </span>
            )}
          </Button>

          {user ? (
            <Button variant="outline" size="sm" onClick={() => void signOut()}>
              <User className="mr-1 h-4 w-4" />
              Déconnexion
            </Button>
          ) : (
            <Button size="sm" onClick={() => navigate({ to: "/auth" })}>
              <LogIn className="mr-1 h-4 w-4" />
              Connexion
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
