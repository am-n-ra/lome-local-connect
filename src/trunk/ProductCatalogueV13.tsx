import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, PackageOpen, Plus, Archive } from 'lucide-react';
import { getAuthToken } from '../auth';
import { getSellerCatalogue, transitionSellerProduct } from './api';
import type { SellerCatalogueProduct } from './types';

type ProductCatalogueV13Props = { onClose: () => void; onStockEvent: (productId: string) => void };

const STATE_LABEL: Record<string, string> = {
  en_stock: 'En stock', verifie: 'Vérifié', a_valider: 'À valider', bientot: 'Bientôt',
  draft: 'Brouillon', pending_validation: 'À valider', published: 'Publié', sold_out: 'Épuisé', archived: 'Archivé',
};

export function ProductCatalogueV13({ onClose, onStockEvent }: ProductCatalogueV13Props) {
  const [products, setProducts] = useState<SellerCatalogueProduct[]>([]);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    const token = await getAuthToken();
    if (!token) return;
    const result = await getSellerCatalogue({ token });
    if (result.ok && result.data) setProducts(result.data.products);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const publish = useCallback(async (product: SellerCatalogueProduct) => {
    setBusy(true);
    try {
      const token = await getAuthToken();
      if (!token) return;
      const to = product.publicationState === 'published' ? 'archived' : 'published';
      const result = await transitionSellerProduct({ token, productId: product.id, to });
      if (result.ok) { setToast(`${product.name}: ${to === 'published' ? 'publié' : 'archivé'}.`); void load(); }
    } finally { setBusy(false); }
  }, [load]);

  return (
    <section className="sheet h-mid" data-sheet="products" role="region" aria-label="Produits">
      <div className="handle" />
      <div className="sheet-head">
        <div><div className="eyebrow">Produits</div><h1>Catalogue</h1></div>
        <button type="button" className="btn ghost sm" style={{ width: 'auto', minHeight: 28 }} onClick={onClose}><ArrowLeft size={15} /></button>
      </div>
      {toast && <p className="sub" role="status">{toast}</p>}
      {busy && <p className="sub">…</p>}
      <div className="plist">
        {products.length === 0 && <p className="tiny muted">Aucun produit dans votre catalogue.</p>}
        {products.map((product) => (
          <div className="pitem" key={product.id}>
            <span className="pthumb" />
            <span>
              <b>{product.name}</b>
              <small>Allocation Omni : {product.stockLoueOmni}</small>
            </span>
            <span className="pr">{(product.prixReduit / 100).toFixed(2)} {product.currency}</span>
          </div>
        ))}
      </div>
      <p className="tiny muted" style={{ marginTop: 7 }}>L'allocation Omni ≠ votre stock total. C'est la part que vous rendez disponible aux transactions Omni.</p>
      <div className="btnrow" style={{ marginTop: 5 }}>
        <button className="btn" type="button" disabled><Plus size={14} /> Ajouter un produit</button>
        <button className="btn ghost" type="button" onClick={() => { if (products[0]) onStockEvent(products[0].id); }}>Historique stock</button>
      </div>
    </section>
  );
}
