import { ArrowLeft, Package, Boxes } from 'lucide-react';
import type { SellerCatalogueProduct, SellerCatalogueResult } from './types';

type CompanyV13Props = { onClose: () => void; onProducts: () => void; onOffers: () => void; catalogue: SellerCatalogueResult | null };

export function CompanyV13({ onClose, onProducts, onOffers, catalogue }: CompanyV13Props) {
  if (!catalogue || !catalogue.authorized) return (
    <section className="sheet h-mid" data-sheet="company" role="region" aria-label="Compagnies">
      <div className="handle" />
      <div className="sheet-head">
        <div><div className="eyebrow">Compagnies</div><h1>Mes compagnies</h1></div>
        <button type="button" className="btn ghost sm" style={{ width: 'auto', minHeight: 28 }} onClick={onClose}><ArrowLeft size={15} /></button>
      </div>
      <p className="sub">Chargement des données compagnie…</p>
    </section>
  );

  const byFacility = new Map<string, SellerCatalogueProduct[]>();
  for (const product of catalogue.products) {
    const key = product.entityId ?? product.facilityId ?? 'sans-lieu';
    const list = byFacility.get(key) ?? [];
    list.push(product);
    byFacility.set(key, list);
  }

  const availabilityCount = (products: SellerCatalogueProduct[]): { enStock: number; aValider: number } =>
    products.reduce((counts, product) => {
      if (product.stockLoueOmni >  ​0) counts.enStock +=  ​1;
      else counts.aValider +=  ​1;
      return counts;
    }, { enStock:  ​0, aValider:  ​0 });

  const totalStock = (products: SellerCatalogueProduct[]): number =>
    products.reduce((sum, product) => sum + product.stockLoueOmni, 0);

  return (
    <section className="sheet h-mid" data-sheet="company" role="region" aria-label="Compagnies">
      <div className="handle" />
      <div className="sheet-head">
        <div><div className="eyebrow">Compagnies</div><h1>Mes compagnies</h1></div>
        <button type="button" className="btn ghost sm" style={{ width: 'auto', minHeight:  ​28 }} onClick={onClose}><ArrowLeft size={15} /></button>
      </div>
      <div className="cardbox">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div><b>Compagnie Omni</b><br /><span className="tiny muted">Données réelles serveur · {catalogue.facilities.length} facilité{catalogue.facilities.length > 1 ? 's' : ''} · mis à jour à l'ouverture</span></div>
          <span className={`status ${catalogue.catalogReady ? 'ok' : 'dash'}`}>{catalogue.catalogReady ? 'Catalogue prêt' : 'Catalogue incomplet'}</span>
        </div>
      </div>
      {[...byFacility.entries()].map(([entityId, products]) => {
        const counts = availabilityCount(products);
        const entityName = products[0]?.entityName ?? 'Entité';
        const placeNames = [...new Set(products.map((p) => p.facilityName).filter((n): n is string => Boolean(n)))];
        const placeSummary = placeNames.length > 0 ? placeNames.join(', ') : 'sans lieu (offre mobile / immatérielle)';
        return (
          <div className="cardbox" key={entityId}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div><b>{entityName}</b><br /><span className="tiny muted">{placeSummary}</span></div>
              <span className="status gray">{products.length} offre{products.length > 1 ? 's' : ''}</span>
            </div>
            <div className="kv" style={{ marginTop: 6 }}><span>Stock Omni</span><b>{totalStock(products)} unités</b></div>
            <div className="kv" style={{ marginTop: 2 }}><span>Disponibilité</span><b>{counts.enStock > 0 ? `${counts.enStock} En stock` : '0 En stock'}{counts.aValider > 0 ? ` · ${counts.aValider} à valider` : ''}</b></div>
            <div className="btnrow" style={{ marginTop: 8 }}>
              <button className="btn ghost sm" type="button" onClick={onProducts}><Package size={13} /> Offres & produits</button>
              <button className="btn ghost sm" type="button" onClick={onOffers}><Boxes size={13} /> Dispo auto</button>
            </div>
          </div>
        );
      })}
      {byFacility.size === 0 && <p className="sub">Aucune compagnie enregistrée.</p>}
    </section>
  );
}