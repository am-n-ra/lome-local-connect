import { useReducer } from "react";
import { initialSurfaceState, reduceSurface } from "../../core/surface-state";
import { OmniSheet } from "./OmniSheet";

export function V2Shell() {
  const [surface, dispatch] = useReducer(reduceSurface, initialSurfaceState);
  const showSheet = surface.active !== "map";

  return (
    <main className="omni-shell">
      <section className="omni-map-scene" aria-label="Persistent map scene">
        <div className="omni-map-placeholder" aria-label="Map scene reserved for V1 implementation">
          <div className="omni-globe-mark" aria-hidden="true">◌</div>
          <p>Map scene</p>
          <span>V0 surface reserved for the real globe</span>
        </div>
      </section>
      <header className="omni-chrome">
        <div className="omni-brand"><span className="omni-brand__mark">O</span><strong>Omni</strong><span>V2 foundation</span></div>
        <nav aria-label="Primary actions">
          <button type="button" onClick={() => dispatch({ type: "open", surface: "dock" })}>Search</button>
          <button type="button" onClick={() => dispatch({ type: "open", surface: "map" })}>Menu</button>
        </nav>
      </header>
      <section className="omni-dock" aria-label="Search dock">
        <p className="omni-eyebrow">MAP-FIRST PRODUCT KERNEL</p>
        <div className="omni-dock__row">
          <input aria-label="Search" value={surface.query} onChange={(event) => dispatch({ type: "set-query", query: event.target.value })} placeholder="Search will arrive in V1" />
          <button type="button" onClick={() => dispatch({ type: "open", surface: "result", returnSurface: "dock" })}>Explore</button>
        </div>
        <small>Typing preserves the map and unfinished context.</small>
      </section>
      {showSheet && (
        <div className="omni-sheet-slot">
          <OmniSheet title={surface.active} onClose={() => dispatch({ type: "close" })} onBack={() => dispatch({ type: "back" })} footer={<button type="button" onClick={() => dispatch({ type: "close" })}>Return to map</button>}>
            <p>This V0 surface is a typed seam for the next vertical slice.</p>
            <p className="omni-muted">Current actor: {surface.actor}. Query context is preserved: {surface.query || "empty"}.</p>
          </OmniSheet>
        </div>
      )}
    </main>
  );
}
