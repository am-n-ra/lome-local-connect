import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Heart, Minus, Navigation, Phone, Plus, Search, Ticket } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  claimFacility,
  getFacility,
  listFavorites,
  recordWishlist,
  toggleFavorite as toggleFavoriteFn,
} from "@/lib/omni.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import {
  categoryLabel,
  formatDistance,
  freshnessLabel,
  isFresh,
  STATUS_LABEL,
  type FacilityRow,
  type ProductRow,
} from "@/lib/omni";
import { useMarket } from "@/lib/market";
import { createPurchaseIntent } from "@/lib/checkout.functions";
import { getProductOffer, type ProductOffer } from "@/lib/offers.functions";

type Coupon = { id: string; code: string; description: string | null; discount_percent: number };

type Props = {
  facility: FacilityRow & { isPro?: boolean };
  distanceKm: number | null;
  onItinerary?: () => void;
  onCheckAvailability?: () => void;
  routingBusy?: boolean;
};

export function FacilityPanel({
  facility,
  distanceKm,
  onItinerary,
  routingBusy,
  onCheckAvailability,
}: Props) {
  const { formatMoney } = useMarket();
  const navigate = useNavigate();
  const { user } = useAuth();
  const cart = useCart();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [offers, setOffers] = useState<Record<string, ProductOffer>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [favorite, setFavorite] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [demandOpen, setDemandOpen] = useState(false);
  const [demandTerm, setDemandTerm] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [intentBusy, setIntentBusy] = useState<string | null>(null);
  const [purchaseIntentCreated, setPurchaseIntentCreated] = useState(false);
  const isUnclaimed = facility.status === "unclaimed";

  const loadFacility = useServerFn(getFacility);
  const loadFavorites = useServerFn(listFavorites);
  const toggleFavoriteRemote = useServerFn(toggleFavoriteFn);
  const sendWishlist = useServerFn(recordWishlist);
  const claimFacilityRemote = useServerFn(claimFacility);
  const createIntent = useServerFn(createPurchaseIntent);
  const loadOffer = useServerFn(getProductOffer);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const result = await loadFacility({ data: { id: facility.id } });
        if (!active || !result) return;
        const productRows = result.products as unknown as ProductRow[];
        setProducts(productRows);
        setCoupons(result.coupons);
        if (user && productRows.length > 0) {
          const offerRows = await Promise.all(
            productRows.map(async (product) => {
              try {
                return [product.id, await loadOffer({ data: { productId: product.id } })] as const;
              } catch {
                return [product.id, { state: "none", label: "Aucune remise active" }] as const;
              }
            }),
          );
          if (active) setOffers(Object.fromEntries(offerRows));
        } else {
          setOffers({});
        }
      } catch {
        /* la fiche reste affichée sans produits */
      }
    })();
    return () => {
      active = false;
    };
  }, [facility.id, loadFacility, loadOffer, user]);

  useEffect(() => {
    if (!user) {
      setFavorite(false);
      return;
    }
    void (async () => {
      try {
        const rows = await loadFavorites();
        setFavorite(rows.some((r) => r.facility_id === facility.id));
      } catch {
        setFavorite(false);
      }
    })();
  }, [user, facility.id, loadFavorites]);

  const statusTone = useMemo(() => {
    if (facility.status === "certifie") return "bg-gold/20 text-foreground border-gold";
    if (facility.status === "certified") return "bg-forest/10 text-forest border-forest/40";
    return "bg-muted text-muted-foreground";
  }, [facility.status]);

  async function toggleFavorite() {
    if (!user) {
      toast.info("Connectez-vous pour enregistrer vos favoris.");
      return;
    }
    try {
      const result = await toggleFavoriteRemote({ data: { facilityId: facility.id } });
      setFavorite(result.favorite);
      if (result.favorite) toast.success("Ajouté à vos favoris");
    } catch {
      toast.error("Action impossible pour le moment.");
    }
  }

  async function claim() {
    if (!user) {
      toast.info("Connectez-vous pour réclamer ce commerce.");
      return;
    }
    setClaiming(true);
    try {
      await claimFacilityRemote({ data: { facilityId: facility.id } });
      toast.success("Demande envoyée : votre commerce passe en « non confirmé ».");
    } catch {
      toast.error("Réclamation impossible pour le moment.");
    } finally {
      setClaiming(false);
    }
  }

  async function startProductIntent(product: ProductRow, quantity: number) {
    if (!user) {
      toast.info("Connectez-vous pour commencer un achat.");
      navigate({
        to: "/auth",
        search: { redirectTo: `/fiche/${facility.id}` },
      });
      return;
    }
    setIntentBusy(product.id);
    try {
      const result = await createIntent({
        data: {
          productId: product.id,
          facilityId: facility.id,
          quantity,
          amount: product.price * quantity,
          paymentMode: "cash",
        },
      });
      setPurchaseIntentCreated(true);
      const offer = await loadOffer({
        data: { productId: product.id, transactionId: result.transactionId },
      });
      setOffers((current) => ({ ...current, [product.id]: offer }));
      toast.success(`Intention d'achat créée. Référence ${result.transactionId.slice(0, 8)}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Intention impossible.");
    } finally {
      setIntentBusy(null);
    }
  }

  async function submitDemand() {
    if (!user) {
      toast.info("Connectez-vous pour signaler un produit recherché.");
      return;
    }
    const term = demandTerm.trim();
    if (term.length < 2 || term.length > 120) {
      toast.error("Indiquez le nom du produit (2 à 120 caractères).");
      return;
    }
    try {
      await sendWishlist({
        data: {
          searchTerm: term,
          latitude: facility.latitude,
          longitude: facility.longitude,
        },
      });
    } catch {
      toast.error("Enregistrement impossible.");
      return;
    }
    setDemandTerm("");
    setDemandOpen(false);
    toast.success("Demande enregistrée. Les vendeurs proches la verront.");
  }

  return (
    <div className="min-w-0 space-y-4">
      {facility.cover_url && (
        <img
          src={facility.cover_url}
          alt={`Vitrine de ${facility.name}`}
          loading="lazy"
          className="aspect-[16/9] w-full rounded-[1.35rem] border border-border/70 object-cover shadow-[var(--shadow-soft)]"
        />
      )}
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold">{facility.name}</h2>
          <p className="text-sm text-muted-foreground">
            {categoryLabel(facility.category)}
            {facility.address ? ` · ${facility.address}` : ""}
            {distanceKm !== null ? ` · ${formatDistance(distanceKm)}` : ""}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Favori"
          onClick={() => void toggleFavorite()}
        >
          <Heart className={`h-5 w-5 ${favorite ? "fill-primary text-primary" : ""}`} />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className={statusTone}>
          {STATUS_LABEL[facility.status] ?? facility.status}
        </Badge>
        <Badge variant="secondary">{facility.type === "mobile" ? "Mobile" : "Fixe"}</Badge>
        {facility.isPro && <Badge className="bg-gold text-foreground">Sponsorisé</Badge>}
      </div>

      {facility.description && (
        <p className="text-sm text-muted-foreground">{facility.description}</p>
      )}

      {facility.status === "unclaimed" && (
        <div className="omni-glass space-y-2 rounded-2xl border border-dashed border-primary/35 p-3">
          <p className="text-sm font-medium">Ce commerce n'est pas encore inscrit sur OmniView.</p>
          <p className="text-xs text-muted-foreground">
            Les horaires, produits et prix ne sont pas confirmés.
          </p>
          <Button size="sm" disabled={claiming} onClick={() => void claim()}>
            {claiming ? "Envoi…" : "Est-ce votre commerce ?"}
          </Button>
        </div>
      )}

      {!isUnclaimed && onCheckAvailability && (
        <Button className="min-h-10 w-full" onClick={onCheckAvailability}>
          <CheckCircle2 className="mr-1.5 h-4 w-4" />
          Vérifier la disponibilité
        </Button>
      )}

      {isUnclaimed && (
        <div className="omni-glass rounded-2xl border border-dashed border-primary/25 p-3 text-xs text-muted-foreground">
          Cette fiche est issue d'une source publique. Les achats, itinéraires et contacts Omni
          seront disponibles après réclamation et vérification du commerce.
        </div>
      )}

      {purchaseIntentCreated ? (
        <div className="grid gap-2 sm:flex sm:flex-wrap">
          <Button
            className="min-h-10 min-w-0 flex-1"
            variant="outline"
            onClick={onItinerary}
            disabled={routingBusy}
          >
            <Navigation className="mr-1.5 h-4 w-4" />
            {routingBusy ? "Calcul…" : "Itinéraire"}
          </Button>
          <Button
            className="min-h-10 min-w-0 flex-1"
            variant="outline"
            onClick={() => setShowPhone((v) => !v)}
          >
            <Phone className="mr-1.5 h-4 w-4" />
            {showPhone ? (facility.phone ?? "Non renseigné") : "Contacter"}
          </Button>
          <Button
            className="min-h-10 min-w-0 flex-1"
            variant="outline"
            onClick={() => setDemandOpen((v) => !v)}
          >
            <Search className="mr-1.5 h-4 w-4" />
            Je cherche ce produit
          </Button>
        </div>
      ) : (
        <p className="rounded-xl bg-secondary/55 px-3 py-2 text-center text-[11px] text-muted-foreground">
          Créez une intention d'achat pour débloquer l'itinéraire et le contact.
        </p>
      )}

      {demandOpen && (
        <div className="omni-glass space-y-2 rounded-2xl p-3">
          <p className="text-sm font-medium">Quel produit cherchez-vous et ne trouvez pas ?</p>
          <div className="grid gap-2 sm:flex">
            <Input
              value={demandTerm}
              maxLength={120}
              onChange={(e) => setDemandTerm(e.target.value)}
              placeholder="Ex. Batterie externe solaire"
            />
            <Button className="min-h-10 shrink-0" onClick={() => void submitDemand()}>
              Envoyer
            </Button>
          </div>
        </div>
      )}

      {user && coupons.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Coupons actifs</p>
          {coupons.map((c) => (
            <div
              key={c.id}
              className="omni-glass flex min-w-0 items-center gap-2 rounded-2xl border border-dashed border-primary/35 p-2 text-sm"
            >
              <Ticket className="h-4 w-4 text-primary" />
              <span className="font-mono font-bold">{c.code}</span>
              <span className="text-muted-foreground">
                −{c.discount_percent}% {c.description ? `· ${c.description}` : ""}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm font-semibold">Produits ({products.length})</p>
        {products.map((p) => {
          const qty = quantities[p.id] ?? 1;
          const offer = offers[p.id];
          return (
            <div
              key={p.id}
              className="omni-glass grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-2xl p-3 sm:flex sm:items-center"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary text-xl">
                {p.photo_url ? (
                  <img
                    src={p.photo_url}
                    alt={p.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  "📦"
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.name}</p>
                <p className="text-sm font-semibold text-primary">{formatMoney(p.price)}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge
                    variant={p.in_stock ? "default" : "secondary"}
                    className={p.in_stock ? "bg-forest text-forest-foreground" : ""}
                  >
                    {p.in_stock ? "Disponible" : "En rupture"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      isFresh(p.last_confirmed_at)
                        ? "border-forest text-forest"
                        : "border-gold text-foreground"
                    }
                  >
                    {freshnessLabel(p.last_confirmed_at)}
                  </Badge>
                  {offer?.state === "active" && (
                    <Badge variant="outline" className="border-primary text-primary">
                      Coupon −{offer.discountValue}% · {offer.code}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="col-span-2 grid min-w-0 grid-cols-2 gap-2 sm:ml-auto sm:flex sm:flex-col sm:items-end sm:gap-1.5">
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    aria-label="Diminuer"
                    onClick={() => setQuantities((q) => ({ ...q, [p.id]: Math.max(1, qty - 1) }))}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-sm font-semibold">{qty}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    aria-label="Augmenter"
                    onClick={() => setQuantities((q) => ({ ...q, [p.id]: Math.min(99, qty + 1) }))}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isUnclaimed || !p.in_stock || intentBusy === p.id}
                  onClick={() => void startProductIntent(p, qty)}
                >
                  {intentBusy === p.id ? "Création…" : "Je veux acheter"}
                </Button>
                <Button
                  size="sm"
                  disabled={isUnclaimed || !p.in_stock}
                  onClick={() => {
                    cart.add(
                      {
                        productId: p.id,
                        facilityId: facility.id,
                        facilityName: facility.name,
                        name: p.name,
                        price: p.price,
                      },
                      qty,
                    );
                    toast.success(`${p.name} ajouté au panier`);
                  }}
                >
                  Ajouter au panier
                </Button>
              </div>
            </div>
          );
        })}
        {products.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucun produit publié.</p>
        )}
      </div>
    </div>
  );
}
