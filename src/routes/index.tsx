import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { V2BuyerMap } from "../components/v2/V2BuyerMap";
import { V2Shell } from "../components/v2/V2Shell";
import { mockDiscovery, type DiscoveryBounds, type PublicFacility } from "../contracts/discovery";

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
  | "facility_selected";

export const Route = createFileRoute("/")({ component: V2BuyerPage });

function V2BuyerPage() {
  const [state, setState] = useState<BuyerState>("idle_globe");
  const [query, setQuery] = useState("");
  const [bounds, setBounds] = useState<DiscoveryBounds | null>(null);
  const [facilities, setFacilities] = useState<PublicFacility[]>([]);
  const [selected, setSelected] = useState<PublicFacility | null>(null);
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
        setLocationMessage(
          accuracy <= 250
            ? "Position récente disponible. Vous pouvez rechercher autour de vous."
            : "Position approximative disponible. Vous pouvez la préciser ou explorer manuellement.",
        );
        setState(accuracy <= 250 ? "location_exact" : "location_approximate");
      },
      () => {
        setLocationMessage("La position n’a pas été accordée. Le globe reste entièrement exploratoire.");
        setState("fallback_market");
      },
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 30_000 },
    );
  }, []);

  useEffect(() => {
    locate();
  }, [locate]);

  const runSearch = useCallback(async () => {
    if (!bounds) return;
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      setState("search_input");
      setLocationMessage("Écrivez ce que vous cherchez, puis lancez la recherche.");
      return;
    }

    setSelected(null);
    setState("search_submitting");
    setLocationMessage("Recherche dans la zone visible…");
    await new Promise((resolve) => window.setTimeout(resolve, 180));
    setState("search_reveal");

    try {
      const result = await mockDiscovery({ query: normalizedQuery, bounds });
      setFacilities(result.facilities);
      setState(result.facilities.length > 0 ? "results_visible" : "empty_results");
      setLocationMessage(
        result.facilities.length > 0
          ? `${result.facilities.length} lieu${result.facilities.length > 1 ? "x" : ""} trouvé${result.facilities.length > 1 ? "s" : ""} dans la vue.`
          : "Aucun lieu source-backed ne correspond dans la zone visible.",
      );
    } catch {
      setFacilities([]);
      setState("search_error");
      setLocationMessage("La recherche a échoué. Réessayez sans perdre votre requête.");
    }
  }, [bounds, query]);

  const handleBoundsChange = useCallback((nextBounds: DiscoveryBounds) => {
    setBounds(nextBounds);
  }, []);

  const resultSummary = useMemo(() => {
    if (state === "search_submitting" || state === "search_reveal") return "Recherche en cours";
    if (state === "empty_results") return "Aucun résultat";
    if (state === "search_error") return "Recherche indisponible";
    if (state === "results_visible") return `${facilities.length} résultats`;
    return "Découverte publique";
  }, [facilities.length, state]);

  return (
    <V2Shell
      scene={<V2BuyerMap facilities={facilities} onBoundsChange={handleBoundsChange} />}
      chrome={
        <div className="v2-top-chrome">
          <span className="v2-chrome-label">Omni</span>
          <button type="button" className="v2-location-button" onClick={locate} disabled={state === "locating"}>
            {state === "locating" ? "Localisation…" : "Recentrer"}
          </button>
        </div>
      }
      dock={
        <form
          className="v2-search-dock"
          onSubmit={(event) => {
            event.preventDefault();
            void runSearch();
          }}
        >
          <label className="v2-search-label" htmlFor="v2-search">
            Rechercher sur la carte
          </label>
          <div className="v2-search-row">
            <input
              id="v2-search"
              value={query}
              onFocus={() => setState("search_input")}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Que cherchez-vous ?"
              autoComplete="off"
            />
            <button type="submit" disabled={state === "search_submitting" || state === "search_reveal"}>
              {state === "search_submitting" || state === "search_reveal" ? "…" : "Rechercher"}
            </button>
          </div>
          <button type="button" className="v2-options-button" onClick={() => setLocationMessage("Options disponibles dans la prochaine étape.")}>
            Options <span aria-hidden="true">⌄</span>
          </button>
          <p className="v2-search-status" role="status">{locationMessage}</p>
        </form>
      }
      sheet={
        <div className="v2-result-sheet">
          <div className="v2-result-heading">
            <strong>{resultSummary}</strong>
            <span>Zone visible</span>
          </div>
          {selected ? (
            <button type="button" className="v2-facility-detail" onClick={() => setSelected(null)}>
              <span className="v2-facility-category">{selected.category} · {selected.status}</span>
              <strong>{selected.name}</strong>
              <span>{selected.city} · {selected.productCount} produits publics</span>
              <small>Retourner aux résultats</small>
            </button>
          ) : (
            <div className="v2-result-list">
              {facilities.map((facility) => (
                <button
                  type="button"
                  className="v2-result-card"
                  key={facility.id}
                  onClick={() => {
                    setSelected(facility);
                    setState("facility_selected");
                  }}
                >
                  <span className="v2-facility-category">{facility.category} · source {facility.source}</span>
                  <strong>{facility.name}</strong>
                  <span>{facility.city} · {facility.productCount} produits publics</span>
                </button>
              ))}
              {facilities.length === 0 && <span className="v2-empty-result">Lancez une recherche pour découvrir les lieux visibles.</span>}
            </div>
          )}
        </div>
      }
    />
  );
}
