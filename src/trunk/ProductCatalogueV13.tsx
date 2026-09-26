import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ImagePlus, PackageOpen } from 'lucide-react';
import { getAuthToken } from '../auth';
import { getSellerCatalogue, transitionSellerProduct, uploadSellerProductMedia } from './api';
import type { SellerCatalogueProduct } from './types';

type ProductCatalogueV13Props = { onClose: () => void; onStockEvent: (productId: string) => void };

const STATE_LABEL: Record<string, string> = {
  en_stock: 'En stock', verifie: 'Vérifié', a_valider: 'À valider', bientot: 'Bientôt',
  draft: 'Brouillon', pending_validation: 'À valider', published: 'Publié', sold_out: 'Épuisé', archived: 'Archivé',
};

/**
 * E-03/E-04 — the refusal the server pronounces, translated for the seller. The server names the
 * reason (MEDIA_REQUIRED / ADVANTAGE_REQUIRED); the UI must not swallow it into a generic error,
 * otherwise the seller has no idea what to fix.
 */
function publicationMessage(code: string): string {
  if (code === 'MEDIA_REQUIRED') return "Ajoutez d'abord un visuel : la maquette exige 1 image par offre.";
  if (code === 'ADVANTAGE_REQUIRED') return "Ajoutez d'abord un avantage Omni (une remise) : il est requis pour publier.";
  if (code === 'FORBIDDEN_OR_LIMIT_REACHED') return "Publication refusée : plafond d'offres gratuites atteint, ou offre non modifiable.";
  return 'La publication a été refusée.';
}

export function ProductCatalogueV13({ onClose, onStockEvent }: ProductCatalogueV13Props) {
  const [products, setProducts] = useState<SellerCatalogueProduct[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement | null>(null);
  const pendingUploadId = useRef<string | null>(null);

  const load = useCallback(async () => {
    const token = await getAuthToken();
    if (!token) return;
    const result = await getSellerCatalogue({ token });
    if (result.ok && result.data) setProducts(result.data.products);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const publish = useCallback(async (product: SellerCatalogueProduct) => {
    setBusyId(product.id);
    setError('');
    try {
      const token = await getAuthToken();
      if (!token) return;
      const to = product.publicationState === 'published' ? 'archived' : 'published';
      const result = await transitionSellerProduct({ token, productId: product.id, to });
      if (result.ok) {
        setNotice(`${product.name} : ${to === 'published' ? 'publiée' : 'archivée'}.`);
        void load();
      } else {
        setError(`${product.name} — ${publicationMessage(result.error?.code ?? '')}`);
      }
    } finally { setBusyId(null); }
  }, [load]);

  const pickVisual = useCallback((productId: string) => {
    pendingUploadId.current = productId;
    setError('');
    fileInput.current?.click();
  }, []);

  const onFileChosen = useCallback(async (file: File | null) => {
    const productId = pendingUploadId.current;
    pendingUploadId.current = null;
    if (!file || !productId) return;
    setUploadingId(productId);
    setError('');
    try {
      const token = await getAuthToken();
      if (!token) return;
      const result = await uploadSellerProductMedia({ token, productId, file });
      if (result.ok) { setNotice("Visuel ajouté à l'offre."); void load(); }
      else setError(`Visuel refusé — ${result.error?.message ?? 'réessayez.'}`);
    } catch {
      setError('Envoi du visuel interrompu. Réessayez.');
    } finally { setUploadingId(null); }
  }, [load]);

  return (
    <section className="sheet h-mid" data-sheet="products" role="region" aria-label="Produits">
      <div className="handle" />
      <div className="sheet-head">
        <div><div className="eyebrow">Produits</div><h1>Catalogue</h1></div>
        <button type="button" className="btn ghost sm" style={{ width: 'auto', minHeight: 28 }} onClick={onClose}><ArrowLeft size={15} /></button>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => { void onFileChosen(e.target.files?.[0] ?? null); e.target.value = ''; }}
      />
      {notice && <p className="sub" role="status">{notice}</p>}
      {error && <p className="sub" role="alert">{error}</p>}
      <div className="plist">
        {products.length === 0 && <p className="tiny muted">Aucun produit dans votre catalogue.</p>}
        {products.map((product) => {
          const hasVisual = (product.media?.length ?? 0) > 0;
          const hasAdvantage = product.pourcentageReduction > 0 || product.prixReduit < product.prixOriginal;
          const isDraft = product.publicationState === 'draft';
          const blocked = isDraft && (!hasVisual || !hasAdvantage);
          return (
            <div className="pitem" key={product.id}>
              {hasVisual
                ? <img className="pthumb" src={product.media[0]!.url} alt="" />
                : <span className="pthumb" />}
              <span>
                <b>{product.name}</b>
                <small>
                  {STATE_LABEL[product.publicationState] ?? product.publicationState} · Allocation Omni : {product.stockLoueOmni}
                </small>
                {blocked && (
                  <small className="muted" style={{ display: 'block' }}>
                    {!hasVisual ? '1 image requise' : ''}{!hasVisual && !hasAdvantage ? ' · ' : ''}{!hasAdvantage ? 'Avantage Omni requis' : ''}
                  </small>
                )}
              </span>
              <span className="pr">{(product.prixReduit / 100).toFixed(2)} {product.currency}</span>
              <span className="btnrow" style={{ gap: 6, marginTop: 6 }}>
                <button
                  className="btn ghost sm"
                  type="button"
                  style={{ width: 'auto', minHeight: 28 }}
                  disabled={uploadingId === product.id}
                  onClick={() => pickVisual(product.id)}
                >
                  {uploadingId === product.id ? '…' : <ImagePlus size={13} />} {hasVisual ? 'Changer le visuel' : 'Ajouter un visuel'}
                </button>
                <button
                  className={product.publicationState === 'published' ? 'btn ghost sm' : 'btn sm'}
                  type="button"
                  style={{ width: 'auto', minHeight: 28 }}
                  disabled={busyId === product.id || blocked}
                  onClick={() => void publish(product)}
                >
                  {busyId === product.id ? '…' : product.publicationState === 'published' ? 'Archiver' : 'Publier'}
                </button>
              </span>
            </div>
          );
        })}
      </div>
      <p className="tiny muted" style={{ marginTop: 7 }}>L'allocation Omni ≠ votre stock total. C'est la part que vous rendez disponible aux transactions Omni.</p>
      <p className="tiny muted" style={{ marginTop: 4 }}>Une offre ne peut être publiée qu'avec <b>1 visuel</b> et un <b>avantage Omni</b> — la disponibilité affichée doit être vérifiable.</p>
      <div className="btnrow" style={{ marginTop: 5 }}>
        <button className="btn ghost" type="button" onClick={() => { if (products[0]) onStockEvent(products[0].id); }}><PackageOpen size={14} /> Historique stock</button>
      </div>
    </section>
  );
}
