import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { getAuthToken } from '../auth';
import { getSellerCatalogue } from './api';
import { currencyFor, formatMoney } from '../domain/currency';
import { Skeleton } from './Skeleton';
import type { SellerCatalogueProduct } from './types';

type OffersV13Props = { onClose: () => void };

export function OffersV13({ onClose }: OffersV13Props) {
  const [products, setProducts] = useState<SellerCatalogueProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) return;
      const result = await getSellerCatalogue({ token });
      if (result.ok && result.data) setProducts(result.data.products);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const first = products[0];
  // `prixReduit` is ALREADY the discounted amount: applying the percentage again
  // double-counted it. Both prices are shown in the OFFER's currency.
  const offerCurrency = currencyFor(first?.currency);
  const normalPrice = first ? formatMoney(first.prixOriginal, offerCurrency.currency) : '';
  const omniPrice = first ? formatMoney(first.prixReduit, offerCurrency.currency) : '';
  const discountPct = first?.pourcentageReduction ?? 0;

  return (
    <section className="sheet h-mid" data-sheet="offers" role="region" aria-label="Offres Omni">
      <div className="handle" />
      <div className="sheet-head">
        <div><div className="eyebrow">Offres Omni</div><h1>Prix & remise</h1></div>
        <button type="button" className="btn ghost sm" style={{ width: 'auto', minHeight: 28 }} onClick={onClose} aria-label="Fermer"><ArrowLeft size={15} /></button>
      </div>
      {loading && <Skeleton variant="pitem" count={3} />}
      {!loading && !first && <p className="sub">Aucun produit à configurer.</p>}
      {first && (
        <>
          <div className="cardbox">
            <div className="kv"><span>Prix normal</span><b className="code">{normalPrice}</b></div>
            <div className="kv"><span>Remise Omni</span><b className="code" style={{ color: 'var(--accent)' }}>{discountPct} %</b></div>
            <div className="kv"><span>Prix Omni</span><b className="code">{omniPrice}</b></div>
          </div>
          <p className="tiny muted" style={{ marginTop: 7 }}>Sans remise Omni configurée : la facilité reste découvrable, mais l'offre n'est pas transactable.</p>
          <button className="btn" style={{ marginTop: 10 }} type="button" disabled>Enregistrer l'offre</button>
        </>
      )}
    </section>
  );
}
