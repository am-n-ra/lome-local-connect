import { ArrowLeft, Check, RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getFacility, type ProductRow } from "@/lib/omni.functions";
import { useServerFn } from "@/lib/useServerFn";
import { cn } from "@/lib/utils";

type SelectedProduct = {
  facilityId: string;
  productId: string;
  name: string;
  price: number | null;
  quantityAvailable: number | null;
};

type Props = {
  open: boolean;
  facilityId: string | null;
  facilityName?: string | null;
  matchedProductId?: string | null;
  onOpenChange: (open: boolean) => void;
  onSelectProduct: (product: SelectedProduct) => void;
};

function productPrice(product: ProductRow) {
  if (!Number.isFinite(product.price)) return "Prix à confirmer";
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(product.price)} FCFA`;
}

export function CleanBuyerCatalogSheet({
  open,
  facilityId,
  facilityName,
  matchedProductId,
  onOpenChange,
  onSelectProduct,
}: Props) {
  const get = useServerFn(getFacility);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open || !facilityId) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    void get({ data: { id: facilityId } })
      .then((payload) => {
        if (cancelled) return;
        setProducts(payload?.products ?? []);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [facilityId, get, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center bg-[rgba(30,28,26,.22)] p-0 backdrop-blur-[2px] sm:items-center sm:p-4" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="clean-buyer-catalog-title"
        data-omni-buyer-catalog
        className="omni-clean-flow-sheet flex max-h-[min(92dvh,48rem)] w-full max-w-2xl flex-col overflow-hidden rounded-t-[2rem] sm:rounded-[2rem]"
      >
        <header className="flex items-center justify-between gap-3 border-b border-black/5 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--omni-orange-deep)]">Catalogue de la facilité</p>
            <h2 id="clean-buyer-catalog-title" className="mt-1 truncate font-display text-2xl font-extrabold tracking-[-0.04em]">{facilityName ?? "Produits disponibles"}</h2>
          </div>
          <button type="button" onClick={() => onOpenChange(false)} aria-label="Fermer le catalogue" className="omni-clean-icon-button h-11 w-11"><X className="h-4 w-4" /></button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {loading ? <div className="rounded-[1.5rem] bg-[var(--omni-paper)] p-5 text-sm font-semibold text-[var(--omni-ink-muted)]">Chargement du catalogue…</div> : null}
          {error ? (
            <div className="rounded-[1.5rem] border border-[var(--omni-danger)]/25 bg-[var(--omni-danger)]/5 p-5">
              <p className="font-extrabold">Catalogue momentanément indisponible</p>
              <button type="button" onClick={() => onOpenChange(false)} className="omni-clean-secondary-button mt-4 min-h-11 w-full"><RefreshCw className="h-4 w-4" />Retour à la fiche</button>
            </div>
          ) : null}
          {!loading && !error && products.length === 0 ? (
            <div className="rounded-[1.5rem] bg-[var(--omni-paper)] p-5">
              <p className="font-display text-xl font-extrabold">Aucun produit publié ici pour le moment</p>
              <p className="mt-2 text-sm leading-6 text-[var(--omni-ink-muted)]">Vous pouvez revenir à la fiche et utiliser la recherche de secours si vous ne trouvez pas ce que vous cherchez.</p>
              <button type="button" onClick={() => onOpenChange(false)} className="omni-clean-secondary-button mt-5 min-h-11 w-full"><ArrowLeft className="h-4 w-4" />Retour à la fiche</button>
            </div>
          ) : null}
          {!loading && !error && products.length > 0 ? (
            <div className="space-y-3" aria-label="Produits de la facilité">
              {products.map((product) => {
                const matched = product.id === matchedProductId;
                const eligible = product.status === "active" && product.in_stock && product.quantity_available > 0;
                return (
                  <button
                    key={product.id}
                    type="button"
                    disabled={!eligible}
                    onClick={() => onSelectProduct({ facilityId: product.facility_id, productId: product.id, name: product.name, price: product.price, quantityAvailable: product.quantity_available })}
                    className={cn("w-full rounded-[1.35rem] border p-4 text-left transition", matched ? "border-[var(--omni-orange)] bg-[var(--omni-orange-wash)]" : "border-black/5 bg-white/80", !eligible && "cursor-not-allowed opacity-50")}
                    data-omni-catalog-product={product.id}
                  >
                    <div className="flex items-start gap-3">
                      {product.photo_url ? <img src={product.photo_url} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover" /> : <div className="h-16 w-16 shrink-0 rounded-2xl bg-[var(--omni-paper)]" />}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2"><p className="font-extrabold">{product.name}</p>{matched ? <span className="shrink-0 rounded-full bg-[var(--omni-orange)] px-2 py-1 text-[10px] font-extrabold text-white">Correspond à votre recherche</span> : null}</div>
                        <p className="mt-2 text-sm font-extrabold">{productPrice(product)}</p>
                        <p className="mt-1 text-xs font-semibold text-[var(--omni-ink-muted)]">{eligible ? `${product.quantity_available} unité(s) disponible(s)` : "Indisponible actuellement"}{product.discount_percent > 0 ? ` · -${product.discount_percent}%` : ""}</p>
                      </div>
                      <span className={cn("mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border", matched ? "border-[var(--omni-orange)] text-[var(--omni-orange)]" : "border-black/10 text-transparent")}><Check className="h-4 w-4" /></span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <footer className="border-t border-black/5 px-5 py-4 sm:px-6">
          <button type="button" onClick={() => onOpenChange(false)} className="omni-clean-secondary-button min-h-12 w-full"><ArrowLeft className="h-4 w-4" />Retour à la fiche</button>
        </footer>
      </section>
    </div>
  );
}
