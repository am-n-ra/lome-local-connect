import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { V2BuyerMap } from "../components/v2/V2BuyerMap";
import { V2Shell } from "../components/v2/V2Shell";
import { mockDiscovery, type DiscoveryBounds, type PublicFacility } from "../contracts/discovery";
import { filterPublicProducts, mockCatalogue, type PublicFacilityDetail, type PublicProduct } from "../contracts/catalogue";

type BuyerState =
  | "idle_globe"
  | "locating"
  | "location_exact"
  | "location_approximate"
  | "fallback_market"
  | "search_input"
  | "search_submitting"
  | "search_reveal"
  | "results_visible"
  | "empty_results"
  | "search_error"
  | "facility_selected"
  | "facility_detail_loading"
  | "facility_detail_ready"
  | "facility_detail_error"
  | "catalogue_visible"
  | "product_selected"
  | "catalogue_empty"
  | "catalogue_unavailable";

export const Route = createFileRoute("/")({ component: V2BuyerPage });

function V2BuyerPage() {
  const [state, setState] = useState<BuyerState>("idle_globe");
  const [query, setQuery] = useState("");
  const [bounds, setBounds] = useState<DiscoveryBounds | null>(null);
  const [facilities, setFacilities] = useState<PublicFacility[]>([]);
  const [selected, setSelected] = useState<PublicFacility | null>(null);
  const [detail, setDetail] = useState<PublicFacilityDetail | null>(null);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<PublicProduct | null>(null);
  const [locationMessage, setLocationMessage] = useState("Explorez le globe ou recherchez ce dont vous avez besoin.");

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationMessage("La localisation n’est pas disponible dans ce navigateur.");
      setState("fallback_market");
      return;
    }
    setState("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const accuracy = position.coords.accuracy;
        setLocationMessage(accuracy <= 250 ? "Position récente disponible. Vous pouvez rechercher autour de vous." : "Position approximative disponible. Vous pouvez la préciser ou explorer manuellement.");
        setState(accuracy <= 250 ? "location_exact" : "location_approximate");
      },
      () => {
        setLocationMessage("La position n’a pas été accordée. Le globe reste entièrement exploratoire.");
        setState("fallback_market");
      },
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 30_000 },
    );
  }, []);

  useEffect(() => { locate(); }, [locate]);

  const runSearch = useCallback(async () => {
    if (!bounds) return;
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      setState("search_input");
      setLocationMessage("Écrivez ce que vous cherchez, puis lancez la recherche.");
      return;
    }
    setSelected(null);
    setDetail(null);
    setSelectedProduct(null);
    setState("search_submitting");
    setLocationMessage("Recherche dans la zone visible…");
    await new Promise((resolve) => window.setTimeout(resolve, 180));
    setState("search_reveal");
    try {
      const result = await mockDiscovery({ query: normalizedQuery, bounds });
      setFacilities(result.facilities);
      setState(result.facilities.length > 0 ? "results_visible" : "empty_results");
      setLocationMessage(result.facilities.length > 0 ? `${result.facilities.length} lieu${result.facilities.length > 1 ? "x" : ""} trouvé${result.facilities.length > 1 ? "s" : ""} dans la vue.` : "Aucun lieu source-backed ne correspond dans la zone visible.");
    } catch {
      setFacilities([]);
      setState("search_error");
      setLocationMessage("La recherche a échoué. Réessayez sans perdre votre requête.");
    }
  }, [bounds, query]);

  const openFacility = useCallback(async (facility: PublicFacility) => {
    setSelected(facility);
    setDetail(null);
    setProducts([]);
    setSelectedProduct(null);
    setState("facility_detail_loading");
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 120));
      const result = await mockCatalogue(facility);
      setDetail(result.facility);
      setProducts(result.products);
      setState(result.products.length > 0 ? "facility_detail_ready" : "catalogue_empty");
    } catch {
      setState("facility_detail_error");
      setLocationMessage("La fiche publique est momentanément indisponible. Réessayez.");
    }
  }, []);

  const showCatalogue = useCallback(() => {
    setState(products.length > 0 ? "catalogue_visible" : "catalogue_empty");
  }, [products.length]);

  const visibleProducts = useMemo(() => filterPublicProducts(products, query), [products, query]);
  const resultSummary = useMemo(() => {
    if (state === "search_submitting" || state === "search_reveal") return "Recherche en cours";
    if (state === "empty_results") return "Aucun résultat";
    if (state === "search_error") return "Recherche indisponible";
    if (state === "facility_detail_loading") return "Ouverture de la fiche";
    if (state === "catalogue_visible" || state === "catalogue_empty" || state === "product_selected") return "Catalogue public";
    if (state === "facility_detail_ready") return "Fiche publique";
    if (state === "results_visible") return `${facilities.length} résultats`;
    return "Découverte publique";
  }, [facilities.length, state]);

  const returnToResults = () => {
    setSelected(null);
    setDetail(null);
    setProducts([]);
    setSelectedProduct(null);
    setState(facilities.length > 0 ? "results_visible" : "empty_results");
  };

  return (
    <V2Shell
      scene={<V2BuyerMap facilities={facilities} onBoundsChange={setBounds} />}
      chrome={<div className="v2-top-chrome"><span className="v2-chrome-label">Omni</span><button type="button" className="v2-location-button" onClick={locate} disabled={state === "locating"}>{state === "locating" ? "Localisation…" : "Recentrer"}</button></div>}
      dock={<form className="v2-search-dock" onSubmit={(event) => { event.preventDefault(); void runSearch(); }}>
        <label className="v2-search-label" htmlFor="v2-search">Rechercher sur la carte</label>
        <div className="v2-search-row"><input id="v2-search" value={query} onFocus={() => setState("search_input")} onChange={(event) => setQuery(event.target.value)} placeholder="Que cherchez-vous ?" autoComplete="off" /><button type="submit" disabled={state === "search_submitting" || state === "search_reveal"}>{state === "search_submitting" || state === "search_reveal" ? "…" : "Rechercher"}</button></div>
        <button type="button" className="v2-options-button" onClick={() => setLocationMessage("Options disponibles dans la prochaine étape.")}>Options <span aria-hidden="true">⌄</span></button>
        <p className="v2-search-status" role="status">{locationMessage}</p>
      </form>}
      sheet={<div className="v2-result-sheet">
        <div className="v2-result-heading"><strong>{resultSummary}</strong><span>Zone visible</span></div>
        {state === "facility_detail_loading" && <div className="v2-detail-loading" role="status">Ouverture de la fiche publique…</div>}
        {detail && (state === "facility_detail_ready" || state === "catalogue_visible" || state === "catalogue_empty" || state === "product_selected") ? <>
          <div className="v2-facility-detail v2-detail-card">
            {detail.media[0] && <img className="v2-facility-media" src={detail.media[0].url} alt={detail.media[0].alt} />}
            <div className="v2-detail-copy"><span className="v2-facility-category">{detail.category} · {detail.status}</span><h2>{detail.name}</h2><p>{detail.description}</p><span>{detail.addressLabel} · source {detail.source}</span><button type="button" className="v2-secondary-action" onClick={returnToResults}>← Retour aux résultats</button></div>
          </div>
          {state !== "catalogue_visible" && state !== "catalogue_empty" && state !== "product_selected" && <button type="button" className="v2-primary-action" onClick={showCatalogue}>Voir le catalogue public · {detail.catalogueCount}</button>}
          {(state === "catalogue_visible" || state === "catalogue_empty" || state === "product_selected") && <div className="v2-catalogue"><div className="v2-catalogue-heading"><strong>Produits listés publiquement</strong><span>{products.length}</span></div>{visibleProducts.map((product) => <button type="button" className={`v2-product-card${selectedProduct?.id === product.id ? " is-selected" : ""}`} key={product.id} onClick={() => { setSelectedProduct(product); setState("product_selected"); }}><img src={product.media[0]?.url} alt={product.media[0]?.alt ?? product.name} /><span><strong>{product.name}</strong><small>{product.category} · par {product.unit}</small><small>{product.availability === "publicly_listed" ? "Présence publique déclarée" : "Disponibilité à vérifier à l’étape suivante"}</small></span></button>)}{visibleProducts.length === 0 && <p className="v2-empty-result">Aucun produit public ne correspond à cette recherche.</p>}{selectedProduct && <div className="v2-selection-note" role="status">Produit sélectionné : <strong>{selectedProduct.name}</strong><span>La vérification de disponibilité sera disponible à l’étape suivante.</span></div>}</div>}
        </> : null}
        {!detail && <div className="v2-result-list">{facilities.map((facility) => <button type="button" className="v2-result-card" key={facility.id} onClick={() => void openFacility(facility)}><span className="v2-facility-category">{facility.category} · source {facility.source}</span><strong>{facility.name}</strong><span>{facility.city} · {facility.productCount} produits publics</span></button>)}{facilities.length === 0 && <span className="v2-empty-result">Lancez une recherche pour découvrir les lieux visibles.</span>}</div>}
      </div>}
    />
  );
}
