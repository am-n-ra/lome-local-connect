import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { initialSurfaceState, reduceSurface } from "../../core/surface-state";
import { discoverFromOverpass, discoverInBounds, type DiscoveryBounds } from "../../lib/public-discovery";
import { listCatalogue, type Product } from "../../lib/catalogue";
import { OmniSheet } from "./OmniSheet";
import { V2BuyerMap } from "./V2BuyerMap";

type Facility = { id: string; name: string; category: string; lng: number; lat: number };
const FACILITIES: Facility[] = [
  { id: "fac-accra-market", name: "Accra Market", category: "Produce", lng: -0.187, lat: 5.6037 },
  { id: "fac-lome-market", name: "Lomé Central Market", category: "Produce", lng: 1.2228, lat: 6.1319 },
  { id: "fac-kumasi-hub", name: "Kumasi Trade Hub", category: "Wholesale", lng: -1.6244, lat: 6.6885 },
  { id: "fac-cotonou-hall", name: "Cotonou Supply Hall", category: "Wholesale", lng: 2.3912, lat: 6.3703 },
  { id: "fac-lagos-yard", name: "Lagos Produce Yard", category: "Produce", lng: 3.3792, lat: 6.5244 },
  { id: "fac-nairobi-market", name: "Nairobi Market", category: "Produce", lng: 36.8219, lat: -1.2921 },
];

export function V2Shell() {
  const [surface, dispatch] = useReducer(reduceSurface, initialSurfaceState);
  const [bounds, setBounds] = useState<DiscoveryBounds | null>(null);
  const [publicFacilities, setPublicFacilities] = useState<Facility[]>(FACILITIES);
  const [discoveryState, setDiscoveryState] = useState<"fixture" | "loading" | "osm" | "fallback">("fixture");
  const [retryNonce, setRetryNonce] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [budget, setBudget] = useState<"unlimited" | "manual">("unlimited");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [selected, setSelected] = useState<Facility | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState("All");
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<number | null>(null);
  const [location, setLocation] = useState<"idle" | "requesting" | "exact" | "approximate" | "denied" | "timeout" | "cancelled">("idle");
  useEffect(() => {
    if (!bounds || Math.abs(bounds[2] - bounds[0]) > 24 || Math.abs(bounds[3] - bounds[1]) > 24) return;
    const controller = new AbortController(); setDiscoveryState("loading");
    discoverFromOverpass(bounds, controller.signal).then((items) => { if (items.length) { setPublicFacilities(items); setDiscoveryState("osm"); } else { setPublicFacilities(FACILITIES); setDiscoveryState("fallback"); } }).catch(() => { if (!controller.signal.aborted) { setPublicFacilities(FACILITIES); setDiscoveryState("fallback"); } });
    return () => controller.abort();
  }, [bounds, retryNonce]);
  const visibleFacilities = useMemo(() => discoverInBounds(publicFacilities, bounds, surface.active === "result" ? surface.query : "").filter((facility) => category === "All" || facility.category === category), [bounds, category, publicFacilities, surface.active, surface.query]);
  const submitSearch = () => { if (searching) return; setSearching(true); dispatch({ type: "set-async", async: "loading" }); searchTimer.current = window.setTimeout(() => { setSearching(false); dispatch({ type: "set-async", async: "ready" }); dispatch({ type: "open", surface: "result", returnSurface: "dock" }); }, 180); };
  const cancelSearch = () => { if (searchTimer.current !== null) window.clearTimeout(searchTimer.current); searchTimer.current = null; setSearching(false); dispatch({ type: "set-async", async: "idle" }); };
  const selectFacility = (facility: Facility) => { setSelected(facility); setSelectedProduct(null); dispatch({ type: "select-facility", facilityId: facility.id, returnSurface: surface.active === "result" ? "result" : "map" }); };
  const facilityProducts = selected ? listCatalogue(selected.id) : [];
  const selectProduct = (product: Product) => { setSelectedProduct(product); dispatch({ type: "select-product", productId: product.id }); };

  return <main className="omni-shell">
    <section className="omni-map-scene" aria-label="Persistent map scene"><V2BuyerMap facilities={visibleFacilities} selectedId={selected?.id ?? null} onSelect={selectFacility} onBoundsChange={setBounds} onLocationState={setLocation} /></section>
    <header className="omni-chrome"><div className="omni-brand"><span className="omni-brand__mark">O</span><strong>Omni</strong><span>Find what is available nearby</span></div><nav aria-label="Primary actions"><button type="button" onClick={() => dispatch({ type: "open", surface: "dock" })}>Search</button><button type="button" onClick={() => dispatch({ type: "open", surface: "map" })}>Menu</button></nav></header>
    <section className="omni-dock" aria-label="Search dock"><p className="omni-eyebrow">PUBLIC DISCOVERY · {location === "requesting" ? "LOCATING…" : location === "exact" ? "LOCATION FOUND" : location === "approximate" ? "APPROXIMATE LOCATION" : location === "denied" ? "LOCATION UNAVAILABLE" : discoveryState === "loading" ? "UPDATING THIS VIEW…" : discoveryState === "osm" ? "OPENSTREETMAP DATA" : "EXPLORE THE GLOBE"}</p><div className="omni-dock__row"><input aria-label="Search facilities or products" value={surface.query} onChange={(event) => dispatch({ type: "set-query", query: event.target.value })} onKeyDown={(event) => { if (event.key === "Enter") submitSearch(); }} placeholder="What are you looking for?" />{searching ? <button type="button" onClick={cancelSearch}>Cancel</button> : <button type="button" onClick={submitSearch}>Search</button>}</div><div className="omni-dock__meta"><small>{visibleFacilities.length} public facilities in this view</small><button className="omni-link" type="button" aria-expanded={optionsOpen} onClick={() => setOptionsOpen((open) => !open)}>Options⌄</button></div>{optionsOpen && <div className="omni-options" role="region" aria-label="Search options"><label>Category<select value={category} onChange={(event) => setCategory(event.target.value)}><option>All</option><option>Produce</option><option>Wholesale</option></select></label><label>Quantity<input type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))} /></label><label>Budget<select value={budget} onChange={(event) => setBudget(event.target.value as "unlimited" | "manual")}><option value="unlimited">Unlimited</option><option value="manual">Manual maximum</option></select></label>{budget === "manual" && <label>Maximum amount<input inputMode="decimal" value={budgetAmount} onChange={(event) => setBudgetAmount(event.target.value)} placeholder="Enter amount" /></label>}<p>These constraints stay in the search context and do not open a separate view.</p>{discoveryState === "fallback" && <div className="omni-recovery"><span>Public data is temporarily unavailable.</span><button type="button" onClick={() => setRetryNonce((value) => value + 1)}>Retry</button></div>}<button className="omni-link" type="button" onClick={() => { setCategory("All"); setOptionsOpen(false); }}>Reset options</button></div>}</section>
    {surface.active !== "map" && <div className="omni-sheet-slot"><OmniSheet title={surface.active === "result" ? `${visibleFacilities.length} places found` : surface.active === "catalogue" ? `${selected?.name ?? "Facility"} catalogue` : selected?.name ?? surface.active} onClose={() => dispatch({ type: "close" })} onBack={() => dispatch({ type: "back" })} footer={<button type="button" onClick={() => dispatch({ type: "close" })}>Return to map</button>}><div className="omni-result-list">{surface.active === "result" && visibleFacilities.map((facility) => <button className="omni-result" key={facility.id} type="button" onClick={() => selectFacility(facility)}><span className="omni-result__dot" /><span><strong>{facility.name}</strong><small>{facility.category} · {facility.lat.toFixed(2)}, {facility.lng.toFixed(2)}</small></span><span aria-hidden="true">›</span></button>)}{surface.active === "result" && visibleFacilities.length === 0 && <div className="omni-empty"><strong>No public facilities found in this view.</strong><p>Move the globe or broaden the search. Public data may not be available for every area yet.</p><button type="button" onClick={() => { dispatch({ type: "close" }); dispatch({ type: "set-query", query: "" }); }}>Clear search</button></div>}{surface.active === "facility" && selected && <><p className="omni-eyebrow">PUBLIC FACILITY</p><h3>{selected.name}</h3><p>{selected.category} discovery point. Public information only; claiming and transaction actions are reserved for later verified flows.</p><button type="button" className="omni-primary" onClick={() => dispatch({ type: "open", surface: "catalogue", returnSurface: "facility" })}>View public catalogue</button></>}{surface.active === "catalogue" && selected && !selectedProduct && <><p className="omni-eyebrow">PUBLIC CATALOGUE</p><p>Choose an item from this facility. Quantity and budget remain in the search context.</p>{facilityProducts.length ? facilityProducts.map((product) => <button className="omni-result" key={product.id} type="button" onClick={() => selectProduct(product)}><span className="omni-result__dot" /><span><strong>{product.name}</strong><small>{product.unit} · {product.category} · {product.availabilityLabel}</small></span><span aria-hidden="true">›</span></button>) : <div className="omni-empty"><strong>No public products listed here.</strong><p>This facility has no catalogue available for public discovery yet.</p></div>}</>}{surface.active === "catalogue" && selectedProduct && <><p className="omni-eyebrow">PRODUCT SELECTED</p><h3>{selectedProduct.name}</h3><p>{selectedProduct.unit} · {selectedProduct.category}</p><p>Availability, quantity and budget will be verified in the next step.</p><button type="button" className="omni-primary" onClick={() => dispatch({ type: "open", surface: "availability", returnSurface: "catalogue" })}>Check availability</button></>}</div></OmniSheet></div>}
  </main>;
}
