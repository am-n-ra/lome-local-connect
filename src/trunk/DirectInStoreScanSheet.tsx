import React, { useState } from 'react';
import { X, ShoppingBag, Plus, Minus, Check, MapPin, Store } from 'lucide-react';
import type { PublicFacility, PublicProduct } from './types';
import { PriceBadge, StatusBadge, facilityStatus, discountPercent } from './v3';

export interface DirectInStoreScanSheetProps {
  facility: PublicFacility;
  products: PublicProduct[];
  onClose: () => void;
  onAddToCart?: (product: PublicProduct, quantity: number) => void;
}

export function DirectInStoreScanSheet({
  facility,
  products,
  onClose,
  onAddToCart,
}: DirectInStoreScanSheetProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cartAdded, setCartAdded] = useState<Record<string, boolean>>({});

  const badge = facilityStatus(facility);

  const handleQuantityChange = (productId: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[productId] ?? 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [productId]: next };
    });
  };

  const handleAdd = (product: PublicProduct) => {
    const qty = quantities[product.id] ?? 1;
    onAddToCart?.(product, qty);

    setCartAdded((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setCartAdded((prev) => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-labelledby="instore-sheet-title">
      <section className="omni-sheet omni-sheet-enter omni-keyboard-aware context-sheet instore-scan-sheet">
        <div className="sheet-handle" />
        <div className="sheet-head">
          <div>
            <span className="section-kicker">Retrait direct en magasin</span>
            <h2 id="instore-sheet-title">{facility.name}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        <div className="instore-facility-hero">
          <div className="facility-meta-row">
            <span className="facility-category-label"><Store size={14} /> {facility.category || 'Lieu local'}</span>
            <StatusBadge variant={badge.variant}>{badge.label}</StatusBadge>
          </div>
          <p className="instore-note">
            Vous êtes présent en boutique. Sélectionnez les articles souhaités pour bénéficier immédiatement de vos avantages Omni au comptoir.
          </p>
        </div>

        <div className="instore-products-list">
          <span className="section-kicker">Articles en rayon ({products.length})</span>

          {products.length === 0 ? (
            <p className="empty-subtext">Aucun produit renseigné pour ce point de vente.</p>
          ) : (
            products.map((product) => {
              const qty = quantities[product.id] ?? 1;
              const percent = discountPercent(product);
              const isAdded = cartAdded[product.id];

              return (
                <div key={product.id} className="instore-product-card">
                  <div className="product-info-block">
                    <strong className="product-title">{product.name}</strong>
                    <div className="product-pricing">
                      <span className="discounted-price">
                        {product.prixReduit.toLocaleString('fr-FR')} {product.currency || 'CFA'}
                      </span>
                      {product.prixOriginal > product.prixReduit && (
                        <span className="original-price">
                          {product.prixOriginal.toLocaleString('fr-FR')}
                        </span>
                      )}
                      {percent && <PriceBadge percent={percent} />}
                    </div>
                  </div>

                  <div className="product-actions-block">
                    <div className="quantity-stepper">
                      <button
                        type="button"
                        aria-label="Diminuer la quantité"
                        onClick={() => handleQuantityChange(product.id, -1)}
                      >
                        <Minus size={14} />
                      </button>
                      <span>{qty}</span>
                      <button
                        type="button"
                        aria-label="Augmenter la quantité"
                        onClick={() => handleQuantityChange(product.id, 1)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <button
                      type="button"
                      className={`primary-button omni-pressable ${isAdded ? 'added' : ''}`}
                      onClick={() => handleAdd(product)}
                    >
                      {isAdded ? (
                        <>
                          <Check size={16} /> Ajouté
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={16} /> Ajouter au panier
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <button type="button" className="secondary-button wide omni-pressable" onClick={onClose}>
          Fermer la fiche
        </button>
      </section>
    </div>
  );
}
