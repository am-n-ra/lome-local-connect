import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  QrCode,
  ChevronUp,
  ChevronDown,
  Menu,
  Store,
  ShoppingBag,
  Users,
  UserCircle,
  MapPin,
  X,
  SlidersHorizontal,
  Grid3x3,
  Star,
  Wallet,
  Info,
} from "lucide-react";
import { V2BuyerMap } from "./V2BuyerMap";
import {
  discoverFromOverpass,
  discoverInBounds,
  type DiscoveryBounds,
  type DiscoveryFacility,
} from "../../lib/public-discovery";
import { listCatalogue } from "../../lib/catalogue";
import "./maquette.css";

const FACILITIES: DiscoveryFacility[] = [
  { id: "fac-accra-market", name: "Accra Market", category: "Market", lng: -0.187, lat: 5.6037 },
  { id: "fac-lome-market", name: "Lomé Central Market", category: "Market", lng: 1.2228, lat: 6.1319 },
  { id: "fac-kumasi-hub", name: "Kumasi Trade Hub", category: "Wholesale", lng: -1.6244, lat: 6.6885 },
  { id: "fac-cotonou-hall", name: "Cotonou Supply Hall", category: "Wholesale", lng: 2.3912, lat: 6.3703 },
  { id: "fac-lagos-yard", name: "Lagos Produce Yard", category: "Market", lng: 3.3792, lat: 6.5244 },
  { id: "fac-nairobi-market", name: "Nairobi Market", category: "Market", lng: 36.8219, lat: -1.2921 },
];

type ProfileMode = "buyer" | "seller";
type FilterState = {
  category: string;
  quantity: number;
  budgetMode: "unlimited" | "maximum";
  budget: string;
};

const DEFAULT_FILTERS: FilterState = {
  category: "All",
  quantity: 1,
  budgetMode: "unlimited",
  budget: "",
};

const PROFILES: { mode: ProfileMode; label: string; hint: string }[] = [
  { mode: "buyer", label: "Acheter", hint: "Rechercher et comparer" },
  { mode: "seller", label: "Vendre", hint: "Gérer mon espace vendeur" },
];

const NAV_OPTIONS = [
  { icon: Users, label: "Mes demandes" },
  { icon: Star, label: "Facilités enregistrées" },
  { icon: Wallet, label: "Portefeuille" },
  { icon: Info, label: "À propos d’Omni" },
];

export function MaquetteApp() {
  const [viewMode, setViewMode] = useState<ProfileMode>("buyer");
  const [profilesOpen, setProfilesOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [bounds, setBounds] = useState<DiscoveryBounds | null>(null);
  const [publicFacilities, setPublicFacilities] = useState<DiscoveryFacility[]>(FACILITIES);
  const [discoveryState, setDiscoveryState] = useState<"fixture" | "loading" | "osm" | "fallback">("fixture");
  const [retryNonce, setRetryNonce] = useState(0);

  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [gridState, setGridState] = useState<"idle" | "revealed">("idle");
  const [selected, setSelected] = useState<DiscoveryFacility | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const searchTimer = useRef<number | null>(null);

  // Live OSM discovery within the current map bounds, with fixture fallback.
  useEffect(() => {
    if (!bounds || Math.abs(bounds[2] - bounds[0]) > 24 || Math.abs(bounds[3] - bounds[1]) > 24) return;
    const controller = new AbortController();
    setDiscoveryState("loading");
    discoverFromOverpass(bounds, controller.signal)
      .then((items) => {
        if (items.length) {
          setPublicFacilities(items);
          setDiscoveryState("osm");
        } else {
          setPublicFacilities(FACILITIES);
          setDiscoveryState("fallback");
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setPublicFacilities(FACILITIES);
          setDiscoveryState("fallback");
        }
      });
    return () => controller.abort();
  }, [bounds, retryNonce]);

  const visibleFacilities = useMemo(
    () =>
      discoverInBounds(publicFacilities, bounds, query).filter(
        (facility) => filters.category === "All" || facility.category === filters.category,
      ),
    [bounds, publicFacilities, query, filters.category],
  );

  const gridPeek = gridState === "revealed" ? 0 : 72; // grid height drives the dock's resting position
  const dockBottom = gridPeek + 12;

  const submitSearch = () => {
    if (searchTimer.current !== null) window.clearTimeout(searchTimer.current);
    setGridState("revealed");
  };

  const clearSearch = () => {
    setQuery("");
    setFilters(DEFAULT_FILTERS);
  };

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  const catalogue = selected ? listCatalogue(selected.id) : [];
  const selectedProductData = catalogue.find((p) => p.id === selectedProduct) ?? null;

  return (
    <main className="mq-root">
      <section className="mq-map-scene" aria-label="Carte de découverte Omni">
        <V2BuyerMap
          facilities={visibleFacilities}
          selectedId={selected?.id ?? null}
          onSelect={(facility) => {
            setSelected(facility);
            setSelectedProduct(null);
          }}
          onBoundsChange={setBounds}
        />
      </section>

      {/* Top-left: SELLER ↔ BUYER switch + other profiles */}
      <div className="mq-top-left">
        <div className="mq-mode-switch" role="group" aria-label="Basculer acheteur / vendeur">
          {PROFILES.map((profile) => (
            <button
              key={profile.mode}
              type="button"
              className={viewMode === profile.mode ? "active" : ""}
              aria-pressed={viewMode === profile.mode}
              onClick={() => setViewMode(profile.mode)}
            >
              {profile.mode === "buyer" ? <ShoppingBag size={14} /> : <Store size={14} />}
              {profile.label}
            </button>
          ))}
          <button
            type="button"
            className="mq-mode-more"
            aria-label="Autres profils"
            aria-expanded={profilesOpen}
            onClick={() => setProfilesOpen((open) => !open)}
          >
            {profilesOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
        {profilesOpen && (
          <div className="mq-popover mq-popover-left">
            <p className="mq-popover-title">Profils du compte</p>
            {PROFILES.map((profile) => (
              <button
                key={profile.mode}
                type="button"
                className="mq-popover-item"
                onClick={() => {
                  setViewMode(profile.mode);
                  setProfilesOpen(false);
                }}
              >
                <span className="mq-popover-icon">
                  {profile.mode === "buyer" ? <ShoppingBag size={16} /> : <Store size={16} />}
                </span>
                <span>
                  <strong>{profile.label}</strong>
                  <small>{profile.hint}</small>
                </span>
                {viewMode === profile.mode && <span className="mq-check">✓</span>}
              </button>
            ))}
            <button type="button" className="mq-popover-item muted">
              <span className="mq-popover-icon"><UserCircle size={16} /></span>
              <span><strong>+ Nouveau profil</strong><small>À venir</small></span>
            </button>
          </div>
        )}
        {viewMode === "seller" && (
          <div className="mq-seller-note">Espace vendeur · à venir dans un jalon dédié</div>
        )}
      </div>

      {/* Top-right: MENU */}
      <div className="mq-top-right">
        <button
          type="button"
          className="mq-menu-button"
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Menu size={20} />
        </button>
        {menuOpen && (
          <div className="mq-popover mq-popover-right">
            <p className="mq-popover-title">Navigation</p>
            {NAV_OPTIONS.map((option) => (
              <button key={option.label} type="button" className="mq-popover-item" onClick={() => setMenuOpen(false)}>
                <span className="mq-popover-icon"><option.icon size={16} /></span>
                <span><strong>{option.label}</strong></span>
              </button>
            ))}
            <p className="mq-popover-foot">Omni · Voir avant de bouger</p>
          </div>
        )}
      </div>

      {/* Bottom cluster: FACILITY GRID (belows the dock) slides up/down */}
      <div className={`mq-grid ${gridState === "revealed" ? "revealed" : "idle"}`} aria-label="Grille des facilités">
        <button
          type="button"
          className="mq-grid-handle"
          aria-expanded={gridState === "revealed"}
          onClick={() => setGridState((state) => (state === "revealed" ? "idle" : "revealed"))}
        >
          {gridState === "revealed" ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          <span className="mq-grid-handle-copy">
            <strong>{visibleFacilities.length} facilité{visibleFacilities.length === 1 ? "" : "s"} dans la zone</strong>
            <small>{gridState === "revealed" ? "Replier la grille" : "Glisser pour révéler les mini-cartes"}</small>
          </span>
          <span className="mq-grid-handle-actions">
            <span className="mq-grid-count"><Grid3x3 size={14} /> {visibleFacilities.length}</span>
            {query && <span className="mq-grid-chip">{query}</span>}
          </span>
        </button>
        <div className="mq-grid-body">
          {visibleFacilities.length === 0 ? (
            <div className="mq-grid-empty">
              <strong>Aucune facilité dans cette zone</strong>
              <button type="button" onClick={clearSearch}>Effacer la recherche</button>
            </div>
          ) : (
            <div className="mq-grid-scroll">
              {visibleFacilities.map((facility) => {
                const products = listCatalogue(facility.id);
                const isSelected = selected?.id === facility.id;
                return (
                  <button
                    key={facility.id}
                    type="button"
                    className={`mq-card ${isSelected ? "selected" : ""}`}
                    onClick={() => { setSelected(facility); setSelectedProduct(null); }}
                  >
                    <span className="mq-card-top">
                      <span className="mq-card-icon"><MapPin size={15} /></span>
                      <span className="mq-card-cat">{facility.category}</span>
                    </span>
                    <strong className="mq-card-name">{facility.name}</strong>
                    <span className="mq-card-meta">
                      {products.length ? `${products.length} offre${products.length === 1 ? "" : "s"}` : "Lieu public"}
                    </span>
                    <span className="mq-card-distance">{facility.lat.toFixed(2)}°, {facility.lng.toFixed(2)}°</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* SEARCH DOCK — pinned above the grid, slides/toggles without covering the map controls */}
      <div
        className="mq-dock"
        style={{ ["--dock-bottom" as string]: `${dockBottom}px` }}
        role="search"
        aria-label="Recherche de facilités"
      >
        <div className="mq-dock-row">
          <Search size={18} className="mq-dock-search-icon" />
          <input
            aria-label="Rechercher une facilité ou un produit"
            value={query}
            onChange={(event) => { setQuery(event.target.value); setSelectedProduct(null); }}
            onKeyDown={(event) => { if (event.key === "Enter") submitSearch(); }}
            placeholder="Produit ou facilité de proximité…"
          />
          {/* QR = FACILITY DISCOVERY (not transactions) */}
          <button type="button" className="mq-qr-button" aria-label="Scanner un QR de découverte de facilité">
            <QrCode size={20} />
          </button>
          <button
            type="button"
            className={`mq-chevron ${filtersOpen ? "open" : ""}`}
            aria-label="Afficher ou masquer les contraintes et filtres"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((open) => !open)}
          >
            {filtersOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
          <button type="button" className="mq-submit" onClick={submitSearch}>Rechercher</button>
        </div>

        {/* Constraints / filters slide in/out */}
        {filtersOpen && (
          <div className="mq-filters">
            <div className="mq-filters-head">
              <span className="mq-filters-title"><SlidersHorizontal size={14} /> Contraintes de recherche</span>
              <button type="button" className="mq-link" onClick={resetFilters}>Réinitialiser</button>
            </div>
            <div className="mq-filters-grid">
              <label className="mq-field">
                <span>Catégorie</span>
                <select
                  value={filters.category}
                  onChange={(event) => setFilters({ ...filters, category: event.target.value })}
                >
                  <option value="All">Toutes</option>
                  <option value="Market">Marché</option>
                  <option value="Wholesale">Grossiste</option>
                </select>
              </label>
              <label className="mq-field">
                <span>Quantité</span>
                <div className="mq-stepper">
                  <button type="button" onClick={() => setFilters({ ...filters, quantity: Math.max(1, filters.quantity - 1) })}>−</button>
                  <strong>{filters.quantity}</strong>
                  <button type="button" onClick={() => setFilters({ ...filters, quantity: filters.quantity + 1 })}>+</button>
                </div>
              </label>
              <label className="mq-field mq-field-budget">
                <span>Budget</span>
                <div className="mq-budget-toggle">
                  <button
                    type="button"
                    className={filters.budgetMode === "unlimited" ? "active" : ""}
                    onClick={() => setFilters({ ...filters, budgetMode: "unlimited" })}
                  >
                    Sans plafond
                  </button>
                  <button
                    type="button"
                    className={filters.budgetMode === "maximum" ? "active" : ""}
                    onClick={() => setFilters({ ...filters, budgetMode: "maximum" })}
                  >
                    Prix maximum
                  </button>
                </div>
              </label>
              {filters.budgetMode === "maximum" && (
                <label className="mq-field">
                  <span>Montant max</span>
                  <input
                    inputMode="decimal"
                    placeholder="0,00"
                    value={filters.budget}
                    onChange={(event) => setFilters({ ...filters, budget: event.target.value })}
                  />
                </label>
              )}
            </div>
            <p className="mq-filters-note">
              Ces contraintes restent dans le dock ; elles ne couvrent pas les contrôles de la carte.
            </p>
          </div>
        )}
      </div>

      {/* Discovery status chip (lower-left, clear of the dock/grid) */}
      <div className="mq-status">
        {discoveryState === "loading" ? "Mise à jour de cette zone…"
          : discoveryState === "osm" ? "Données OpenStreetMap"
          : discoveryState === "fallback" ? "Données de démonstration"
          : "Explorez le globe"}
      </div>

      {/* Facility mini-detail sheet (discovery level only) */}
      {selected && (
        <section className="mq-sheet" role="dialog" aria-modal="false" aria-label="Fiche facilité">
          <div className="mq-sheet-handle" />
          <div className="mq-sheet-head">
            <span className="mq-card-icon"><MapPin size={15} /></span>
            <div>
              <span className="mq-sheet-kicker">{selected.category}</span>
              <h2>{selected.name}</h2>
            </div>
            <button type="button" className="mq-icon-btn" aria-label="Fermer" onClick={() => setSelected(null)}>
              <X size={18} />
            </button>
          </div>
          <p className="mq-sheet-lede">
            Facilité publique découverte sur la carte. Découverte uniquement — les actions d’achat et transactionnelles
            arrivent dans des jalons dédiés.
          </p>
          {selectedProductData ? (
            <div className="mq-product-detail">
              <span className="mq-sheet-kicker">Produit sélectionné</span>
              <h3>{selectedProductData.name}</h3>
              <p>{selectedProductData.unit} · {selectedProductData.category}</p>
              <p className="mq-product-avail">{selectedProductData.availabilityLabel}</p>
              <button
                type="button"
                className="mq-primary"
                onClick={() => setSelectedProduct(null)}
              >
                Retour au catalogue
              </button>
            </div>
          ) : (
            <>
              <span className="mq-sheet-kicker">Catalogue public</span>
              {catalogue.length ? (
                <div className="mq-product-list">
                  {catalogue.map((product) => (
                    <button key={product.id} type="button" className="mq-product" onClick={() => setSelectedProduct(product.id)}>
                      <span><strong>{product.name}</strong><small>{product.unit} · {product.availabilityLabel}</small></span>
                      {product.priceLabel}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mq-sheet-empty">Aucun catalogue public publié pour cette facilité.</p>
              )}
            </>
          )}
          <p className="mq-sheet-foot">Contact et itinéraire restent verrouillés — découverte publique uniquement.</p>
        </section>
      )}
    </main>
  );
}
