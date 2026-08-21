import { useReducer, useState } from "react";
import { initialSurfaceState, reduceSurface } from "../../core/surface-state";
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
  const [facilities, setFacilities] = useState(FACILITIES);
  const [selected, setSelected] = useState<Facility | null>(null);
  const [location, setLocation] = useState<"idle" | "requesting" | "exact" | "denied" | "timeout">("idle");
  const showSheet = surface.active !== "map";
  const submitSearch = () => {
    const query = surface.query.trim().toLowerCase();
    setFacilities(query ? FACILITIES.filter((facility) => `${facility.name} ${facility.category}`.toLowerCase().includes(query)) : FACILITIES);
    dispatch({ type: "open", surface: "result", returnSurface: "dock" });
  };
  const selectFacility = (facility: Facility) => { setSelected(facility); dispatch({ type: "select-facility", facilityId: facility.id }); };

  return (
    <main className="omni-shell">
      <section className="omni-map-scene" aria-label="Persistent map scene"><V2BuyerMap facilities={facilities} selectedId={selected?.id ?? null} onSelect={selectFacility} onLocationState={(state) => setLocation(state === "approximate" ? "idle" : state)} /></section>
      <header className="omni-chrome"><div className="omni-brand"><span className="omni-brand__mark">O</span><strong>Omni</strong><span>Find what is available nearby</span></div><nav aria-label="Primary actions"><button type="button" onClick={() => dispatch({ type: "open", surface: "dock" })}>Search</button><button type="button" onClick={() => dispatch({ type: "open", surface: "map" })}>Menu</button></nav></header>
      <section className="omni-dock" aria-label="Search dock"><p className="omni-eyebrow">PUBLIC DISCOVERY · {location === "requesting" ? "LOCATING…" : location === "exact" ? "LOCATION FOUND" : "EXPLORE THE GLOBE"}</p><div className="omni-dock__row"><input aria-label="Search facilities or products" value={surface.query} onChange={(event) => dispatch({ type: "set-query", query: event.target.value })} onKeyDown={(event) => { if (event.key === "Enter") submitSearch(); }} placeholder="What are you looking for?" /><button type="button" onClick={submitSearch}>Search</button></div><small>{facilities.length} public facilities in this discovery set · <button className="omni-link" type="button" onClick={() => document.querySelector<HTMLButtonElement>(".omni-map-controls button")?.click()}>Use my location</button></small></section>
      {showSheet && <div className="omni-sheet-slot"><OmniSheet title={surface.active === "result" ? `${facilities.length} places found` : selected?.name ?? surface.active} onClose={() => dispatch({ type: "close" })} onBack={() => dispatch({ type: "back" })} footer={<button type="button" onClick={() => dispatch({ type: "close" })}>Return to map</button>}><div className="omni-result-list">{surface.active === "result" && facilities.map((facility) => <button className="omni-result" key={facility.id} type="button" onClick={() => selectFacility(facility)}><span className="omni-result__dot" /><span><strong>{facility.name}</strong><small>{facility.category} · {facility.lat.toFixed(2)}, {facility.lng.toFixed(2)}</small></span><span aria-hidden="true">›</span></button>)}{surface.active === "facility" && selected && <><p className="omni-eyebrow">PUBLIC FACILITY</p><h3>{selected.name}</h3><p>{selected.category} discovery point. Public information only; claiming and transaction actions are reserved for later verified flows.</p><button type="button" className="omni-primary" onClick={() => dispatch({ type: "open", surface: "catalogue", returnSurface: "facility" })}>View public catalogue</button></>}{surface.active !== "result" && surface.active !== "facility" && <p>This V1 surface is ready for the next catalogue slice.</p>}</div></OmniSheet></div>}
    </main>
  );
}
