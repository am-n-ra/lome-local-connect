import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Volume2, X } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { listFacilities, type MapFacility as ApiFacility } from "@/lib/omni.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapCanvas, type MapFacility } from "@/components/omni/MapCanvas";
import { FacilityPanel } from "@/components/omni/FacilityPanel";
import { CartPanel } from "@/components/omni/CartPanel";
import { WishlistPanel } from "@/components/omni/WishlistPanel";
import { OrdersPanel } from "@/components/omni/OrdersPanel";
import { ChatPanel } from "@/components/omni/ChatPanel";
import { DemandRequestPanel } from "@/components/omni/DemandRequestPanel";
import { TopNav } from "@/components/omni/TopNav";
import { SearchDock, DEFAULT_FILTERS, type MapFilters } from "@/components/omni/SearchDock";

import {
  categoryLabel,
  formatDistance,
  haversineKm,
  DEFAULT_CENTER,
  LOCATION_APPROXIMATE_ACCURACY_METERS,
} from "@/lib/omni";
import { deriveOmniSurfaceState } from "@/lib/omni-state";
import { useMarket } from "@/lib/market";
import {
  restorePendingAvailabilitySearch,
  savePendingAvailabilitySearch,
  useAuth,
} from "@/lib/auth";

export const Route = createFileRoute("/carte")({
  head: () => ({
    meta: [
      { title: "Carte des commerces à Lomé — OmniView" },
      {
        name: "description",
        content:
          "Explorez la carte OmniView : commerces ouverts, produits disponibles, distance et itinéraire à pied dans Lomé.",
      },
      { property: "og:title", content: "Carte des commerces à Lomé — OmniView" },
      { property: "og:description", content: "Trouvez un produit disponible près de vous à Lomé." },
    ],
  }),
  component: CartePage,
});

type RouteStep = { instruction: string; distance: number };
type LocationStatus = "pending" | "granted" | "fallback" | "unavailable";
type BrowserPermissionStatus = "unknown" | "prompt" | "granted" | "denied" | "unsupported";
type LocationSnapshot = {
  lat: number;
  lng: number;
  accuracy: number | null;
  timestamp: number;
  requestId: number;
};
type PublicDiscoveryRow = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  address: string | null;
  neighbourhood: string | null;
  latitude: number;
  longitude: number;
  status: string;
  type: string;
  is_online: boolean;
  product_count: number;
  min_price: number | null;
  cover_url: string | null;
};

export function CartePage() {
  const navigate = useNavigate();
  const { market, formatMoney } = useMarket();
  const { user, loading: authLoading } = useAuth();
  const fallbackCenter = useMemo(
    () =>
      market?.default_lat != null
        ? { lat: market.default_lat, lng: market.default_lng }
        : DEFAULT_CENTER,
    [market?.default_lat, market?.default_lng],
  );
  const [facilities, setFacilities] = useState<ApiFacility[]>([]);
  const [discoveryFacilities, setDiscoveryFacilities] = useState<ApiFacility[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);
  const [searchRunKey, setSearchRunKey] = useState<string | null>(null);
  const [revealRunning, setRevealRunning] = useState(false);

  const [selected, setSelected] = useState<MapFacility | null>(null);
  const [userPos, setUserPos] = useState<{
    lat: number;
    lng: number;
    accuracy: number | null;
  } | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("pending");
  const [browserPermission, setBrowserPermission] = useState<BrowserPermissionStatus>("unknown");
  const [locationSnapshot, setLocationSnapshot] = useState<LocationSnapshot | null>(null);
  const locationRequestStartedRef = useRef(false);
  const locationRequestIdRef = useRef(0);
  const [quantity, setQuantity] = useState(1);
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
  const [steps, setSteps] = useState<RouteStep[]>([]);
  const [routingBusy, setRoutingBusy] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishOpen, setWishOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [demandOpen, setDemandOpen] = useState(false);
  const [demandMode, setDemandMode] = useState<"bulk" | "manual">("bulk");
  const [demandFacilityName, setDemandFacilityName] = useState<string | null>(null);
  const [pendingTargetFacilityIds, setPendingTargetFacilityIds] = useState<string[] | null>(null);
  const [pendingUserPos, setPendingUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyMobile, setNearbyMobile] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const fetchFacilities = useServerFn(listFacilities);

  useEffect(() => {
    let active = true;
    const handle = window.setTimeout(
      () => {
        if (authLoading || !user || (!query.trim() && !category)) {
          setFacilities([]);
          return;
        }
        void (async () => {
          try {
            const rows = await fetchFacilities({
              data: {
                search: query.trim() || undefined,
                category: category ?? undefined,
                includeUnclaimed: true,
              },
            });
            if (active) setFacilities(rows);
          } catch {
            if (active) setFacilities([]);
          }
        })();
      },
      query.trim() ? 300 : 0,
    );
    return () => {
      active = false;
      window.clearTimeout(handle);
    };
  }, [authLoading, category, fetchFacilities, query, user]);

  useEffect(() => {
    let active = true;
    const marketCode = market?.market_code ?? "TG-LOME";
    void fetch(`/api/public/v1/facilities?market_code=${encodeURIComponent(marketCode)}&limit=32`)
      .then(async (response) => {
        if (!response.ok) throw new Error("discovery unavailable");
        return (await response.json()) as { data?: PublicDiscoveryRow[] };
      })
      .then((payload) => {
        if (!active) return;
        setDiscoveryFacilities(
          (payload.data ?? []).map((row) => ({
            ...row,
            phone: null,
            last_position_update: null,
            owner_id: null,
            max_discount_percent: 0,
            sponsored: false,
            tier: "free",
          })),
        );
      })
      .catch(() => {
        if (active) setDiscoveryFacilities([]);
      });
    return () => {
      active = false;
    };
  }, [market?.market_code]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setBrowserPermission("unsupported");
      setLocationStatus("unavailable");
      return;
    }
    setLocationStatus("pending");
    const requestId = ++locationRequestIdRef.current;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextPosition = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null,
        };
        const snapshot = {
          ...nextPosition,
          timestamp: Date.now(),
          requestId,
        };
        setLocationSnapshot(snapshot);
        if (import.meta.env.DEV) {
          console.info("[Omni location callback]", {
            ...snapshot,
            accuracyBand:
              nextPosition.accuracy != null &&
              nextPosition.accuracy > LOCATION_APPROXIMATE_ACCURACY_METERS
                ? "approximate-network"
                : "precise",
            marketCenter: fallbackCenter,
            sameAsMarketCenter:
              Math.abs(nextPosition.lat - fallbackCenter.lat) < 0.0001 &&
              Math.abs(nextPosition.lng - fallbackCenter.lng) < 0.0001,
          });
        }
        setBrowserPermission("granted");
        setUserPos(nextPosition);
        setLocationStatus("granted");
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) setBrowserPermission("denied");
        setUserPos(null);
        setLocationSnapshot(null);
        setLocationStatus("unavailable");
      },
      // Do not accept a cached network/IP coordinate: request a fresh device position.
      { enableHighAccuracy: true, maximumAge: 0, timeout: 12000 },
    );
  }, [fallbackCenter]);

  useEffect(() => {
    if (locationRequestStartedRef.current) return;
    locationRequestStartedRef.current = true;
    let active = true;
    let permissionStatus: PermissionStatus | null = null;

    const markPermission = (value: BrowserPermissionStatus) => {
      if (active) setBrowserPermission(value);
    };

    const run = async () => {
      if (!navigator.geolocation) {
        markPermission("unsupported");
        setLocationStatus("unavailable");
        return;
      }

      if (!navigator.permissions?.query) {
        try {
          if (window.sessionStorage.getItem("omni:location-auto-attempted") === "1") {
            setLocationStatus("unavailable");
            return;
          }
          window.sessionStorage.setItem("omni:location-auto-attempted", "1");
        } catch {
          // Storage can be unavailable in privacy-restricted browser contexts.
        }
        requestLocation();
        return;
      }

      try {
        permissionStatus = await navigator.permissions.query({ name: "geolocation" });
        if (!active) return;
        const syncPermission = () => {
          if (!permissionStatus || !active) return;
          markPermission(permissionStatus.state as BrowserPermissionStatus);
        };
        syncPermission();
        permissionStatus.onchange = syncPermission;

        if (permissionStatus.state === "denied") {
          setLocationStatus("unavailable");
          return;
        }
        requestLocation();
      } catch {
        markPermission("unknown");
        requestLocation();
      }
    };

    void run();
    return () => {
      active = false;
      if (permissionStatus) permissionStatus.onchange = null;
    };
  }, [requestLocation]);

  function useMarketFallback() {
    setUserPos(null);
    setLocationStatus("fallback");
  }

  // Proximity banner (mode démo) — computed on load, no background tracking
  useEffect(() => {
    if (!userPos || facilities.length === 0) return;
    const near = facilities.find(
      (f) =>
        f.type === "mobile" &&
        f.is_online &&
        haversineKm(userPos, { lat: f.latitude, lng: f.longitude }) <= 2,
    );
    setNearbyMobile(near ? near.name : null);
  }, [userPos, facilities]);

  const origin = userPos ?? fallbackCenter;

  const results = useMemo(() => {
    const rows = facilities
      .map((f) => ({
        ...f,
        isPro: f.sponsored || f.tier === "pro",
        mobile_presence: f.type === "mobile" && f.is_online,
        distanceKm: haversineKm(origin, { lat: f.latitude, lng: f.longitude }),
      }))
      .filter((f) => {
        if (filters.radiusKm < 50 && f.distanceKm > filters.radiusKm) return false;
        if (filters.openOnly && !f.is_online) return false;
        if (filters.discountOnly && (f.max_discount_percent ?? 0) < 1) return false;
        if (filters.maxPrice !== null && (f.min_price ?? Infinity) > filters.maxPrice) return false;
        return true;
      });

    return rows.sort((a, b) => {
      if (filters.sort === "price") return (a.min_price ?? Infinity) - (b.min_price ?? Infinity);
      if (filters.sort === "distance") return a.distanceKm - b.distanceKm;
      if (a.isPro !== b.isPro) return a.isPro ? -1 : 1;
      return a.distanceKm - b.distanceKm;
    });
  }, [facilities, origin, filters]);

  // After each search or filter change, frame the user plus the nearest visible matches.
  const [fitPoints, setFitPoints] = useState<{ lat: number; lng: number }[] | null>(null);
  const hasActiveSearch =
    Boolean(query.trim()) ||
    Boolean(category) ||
    filters.radiusKm !== DEFAULT_FILTERS.radiusKm ||
    filters.maxPrice !== DEFAULT_FILTERS.maxPrice ||
    filters.openOnly !== DEFAULT_FILTERS.openOnly ||
    filters.discountOnly !== DEFAULT_FILTERS.discountOnly ||
    filters.sort !== DEFAULT_FILTERS.sort;
  const searchKey = `${query.trim()}|${category ?? ""}|${filters.radiusKm}|${filters.maxPrice ?? ""}|${filters.openOnly}|${filters.discountOnly}|${filters.sort}`;
  const resultPointKey = results
    .slice(0, 12)
    .map((f) => `${f.id}:${f.latitude.toFixed(5)}:${f.longitude.toFixed(5)}`)
    .join("|");
  const discoveryResults = useMemo(
    () =>
      discoveryFacilities
        .map((f) => ({
          ...f,
          isPro: false,
          mobile_presence: f.type === "mobile" && f.is_online,
          distanceKm: haversineKm(origin, { lat: f.latitude, lng: f.longitude }),
        }))
        .slice(0, 32),
    [discoveryFacilities, origin],
  );

  useEffect(() => {
    if (!hasActiveSearch) {
      setFitPoints(null);
      return;
    }
    if (results.length === 0) {
      setFitPoints(userPos ? [userPos] : null);
      return;
    }
    const nearest = [...results]
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 6)
      .map((f) => ({ lat: f.latitude, lng: f.longitude }));
    setFitPoints(userPos ? [userPos, ...nearest] : nearest);
  }, [
    hasActiveSearch,
    searchKey,
    resultPointKey,
    results.length,
    userPos?.lat,
    userPos?.lng,
    origin.lat,
    origin.lng,
  ]);

  const demandTargetFacilityIds = pendingTargetFacilityIds ?? results.map((f) => f.id);
  const demandUserPos = pendingUserPos ?? userPos;
  const surfaceState = deriveOmniSurfaceState({
    hasSearch: hasActiveSearch,
    hasResults: results.length > 0,
    selectedFacility: Boolean(selected),
    availabilityOpen: demandOpen,
    revealRunning,
  });

  function handOffAvailabilitySearch(
    mode: "bulk" | "manual" = "bulk",
    facility?: MapFacility | null,
  ) {
    const payload = {
      term: query,
      category,
      filters,
      targetFacilityIds: facility ? [facility.id] : results.map((f) => f.id),
      location: userPos,
      locationSource:
        locationStatus === "granted" ? ("browser" as const) : ("market_fallback" as const),
      quantity,
      demandOpen: true,
      mode: "availability" as const,
      demandMode: mode,
      demandFacilityName: facility?.name ?? null,
    };
    savePendingAvailabilitySearch(payload);
    const redirectTo = `/carte?pendingSearch=1`;
    navigate({
      to: "/auth",
      search: { redirectTo },
    });
  }

  /** Bulk when called without argument, manual (single facility) with an id. */
  function openDemandRequest(facilityId?: string) {
    if (authLoading) return;
    if (!user) {
      handOffAvailabilitySearch("bulk");
      return;
    }
    setDemandMode("bulk");
    setDemandFacilityName(null);
    setPendingTargetFacilityIds(null);
    setPendingUserPos(null);
    setDemandOpen(true);
  }

  function openManualAvailability(facility: MapFacility) {
    if (authLoading) return;
    if (!user) {
      handOffAvailabilitySearch("manual", facility);
      return;
    }
    setDemandMode("manual");
    setDemandFacilityName(facility.name);
    setPendingTargetFacilityIds([facility.id]);
    setPendingUserPos(userPos);
    setDemandOpen(true);
  }

  useEffect(() => {
    if (authLoading || !user) return;
    const pending = restorePendingAvailabilitySearch();
    if (!pending) return;
    setQuery(pending.term);
    setCategory(pending.category);
    setFilters(pending.filters as MapFilters);
    setPendingTargetFacilityIds(pending.targetFacilityIds);
    setPendingUserPos(pending.location);
    setQuantity(pending.quantity ?? 1);
    setDemandMode(pending.demandMode ?? "bulk");
    setDemandFacilityName(pending.demandFacilityName ?? null);
    setDemandOpen(pending.demandOpen);
    setSearchRunKey(`restored:${Date.now()}:${pending.term}`);
    toast.success("Recherche restaurée. Vous pouvez lancer la vérification.");
    window.history.replaceState(null, "", "/carte");
  }, [authLoading, user]);

  function handleSearchSubmit() {
    if (!query.trim() && !category) {
      toast.info("Saisissez un produit, un service ou choisissez une catégorie.");
      return;
    }
    if (authLoading) return;
    if (!user) {
      savePendingAvailabilitySearch({
        term: query.trim(),
        category,
        filters,
        targetFacilityIds: [],
        location: userPos,
        locationSource:
          locationStatus === "granted" ? ("browser" as const) : ("market_fallback" as const),
        quantity,
        demandOpen: false,
        mode: "search",
      });
      navigate({ to: "/auth", search: { redirectTo: "/carte?pendingSearch=1" } });
      return;
    }
    if (locationStatus === "pending") setLocationStatus("fallback");
    setSelected(null);
    setRouteCoords(null);
    setSteps([]);
    setSearchRunKey(`${Date.now()}:${query.trim()}:${category ?? ""}`);
  }

  async function buildItinerary(f: MapFacility) {
    if (!userPos) {
      toast.info(
        "Position exacte indisponible. Autorisez la localisation pour obtenir un itinéraire.",
      );
      return;
    }
    const from = userPos;
    setRoutingBusy(true);
    try {
      const url = `https://router.project-osrm.org/route/v1/foot/${from.lng},${from.lat};${f.longitude},${f.latitude}?overview=full&geometries=geojson&steps=true`;
      const res = await fetch(url);
      const json = (await res.json()) as {
        routes?: {
          geometry: { coordinates: [number, number][] };
          legs: {
            steps: {
              maneuver: { type: string; modifier?: string };
              name: string;
              distance: number;
            }[];
          }[];
        }[];
      };
      const route = json.routes?.[0];
      if (!route) {
        toast.error("Itinéraire indisponible.");
        return;
      }
      setRouteCoords(route.geometry.coordinates);
      const list: RouteStep[] = (route.legs[0]?.steps ?? []).map((s) => ({
        instruction: `${translateManeuver(s.maneuver.type, s.maneuver.modifier)}${s.name ? ` sur ${s.name}` : ""}`,
        distance: s.distance,
      }));
      setSteps(list);
      speak(`Itinéraire vers ${f.name}. ${list[0]?.instruction ?? ""}`);
    } catch {
      toast.error("Impossible de calculer l'itinéraire.");
    } finally {
      setRoutingBusy(false);
    }
  }

  return (
    <div
      className="flex h-screen flex-col bg-background"
      data-omni-surface={surfaceState}
      data-omni-map-first="true"
    >
      <TopNav
        query={query}
        onQueryChange={setQuery}
        onOpenCart={() => setCartOpen(true)}
        onOpenWishlist={() => setWishOpen(true)}
        onOpenOrders={() => setOrdersOpen(true)}
        onOpenChat={() => setChatOpen(true)}
        onOpenDemand={() => setDemandOpen(true)}
        activeRole="acheteur"
        hideSearch
        minimalMapChrome
      />

      {nearbyMobile && !bannerDismissed && (
        <div className="flex items-center gap-2 bg-accent px-4 py-2 text-sm text-accent-foreground">
          <span className="font-medium">{nearbyMobile} est à proximité de vous</span>
          <Badge variant="secondary">Mode démo</Badge>
          <button
            type="button"
            className="ml-auto"
            onClick={() => setBannerDismissed(true)}
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="relative flex-1 overflow-hidden">
        <MapCanvas
          facilities={hasActiveSearch ? results : discoveryResults}
          selectedId={selected?.id ?? null}
          onSelect={(f) => {
            setSelected(f);
            setRouteCoords(null);
            setSteps([]);
          }}
          routeCoords={routeCoords}
          userPosition={userPos}
          marketCenter={fallbackCenter}
          marketZoom={market?.default_zoom ?? 12.2}
          revealKey={searchRunKey}
          showFacilities={true}
          showUserLocation={locationStatus === "granted"}
          onRevealStateChange={setRevealRunning}
          focus={selected ? { lat: selected.latitude, lng: selected.longitude } : null}
          fitPoints={selected ? null : fitPoints}
          className="h-full w-full"
        />

        {!revealRunning &&
          !selected &&
          (query.trim() || category) &&
          results.length > 0 &&
          steps.length === 0 && (
            <div
              className="pointer-events-none absolute inset-x-3 z-10 mx-auto max-w-6xl"
              style={{ bottom: "var(--omni-dock-clearance, 12rem)" }}
            >
              <div className="pointer-events-auto flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:justify-center">
                {results.slice(0, 6).map((facility) => (
                  <button
                    key={facility.id}
                    type="button"
                    onClick={() => {
                      setSelected(facility);
                      setRouteCoords(null);
                      setSteps([]);
                    }}
                    className="omni-glass w-72 shrink-0 rounded-2xl p-3 text-left shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{facility.name}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {facility.status === "unclaimed"
                            ? "Facility à réclamer"
                            : "Facility certifiable Omni"}
                        </p>
                      </div>
                      <Badge variant={facility.status === "confirmed" ? "default" : "secondary"}>
                        {facility.status === "confirmed" || facility.status === "certified"
                          ? "✓"
                          : "•"}
                      </Badge>
                    </div>
                    <div className="mt-3 rounded-xl bg-background/65 p-2">
                      <p className="truncate text-sm font-semibold">
                        {query.trim() || (category ? categoryLabel(category) : "Recherche")}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Requested product / service
                      </p>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <span className="rounded-full bg-background/65 px-2 py-1 font-semibold">
                        {facility.min_price != null
                          ? `From ${formatMoney(facility.min_price)}`
                          : "Price to confirm"}
                      </span>
                      <span className="rounded-full bg-background/65 px-2 py-1 text-right font-semibold">
                        {formatDistance(facility.distanceKm)}
                      </span>
                      <span className="rounded-full bg-background/65 px-2 py-1 text-muted-foreground">
                        {facility.product_count} offer{facility.product_count > 1 ? "s" : ""}
                      </span>
                      <span className="rounded-full bg-background/65 px-2 py-1 text-right text-primary">
                        {facility.max_discount_percent > 0
                          ? `${facility.max_discount_percent}% off`
                          : "Availability first"}
                      </span>
                    </div>
                    <div className="mt-3 rounded-full bg-primary px-3 py-1.5 text-center text-xs font-semibold text-primary-foreground">
                      Check availability
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

        {!selected && steps.length === 0 && (
          <SearchDock
            query={query}
            onQueryChange={setQuery}
            onSubmit={handleSearchSubmit}
            category={category}
            onCategoryChange={(value) => {
              if (!value) {
                setCategory(null);
                return;
              }
              if (authLoading) return;
              if (!user) {
                savePendingAvailabilitySearch({
                  term: "",
                  category: value,
                  filters,
                  targetFacilityIds: [],
                  location: userPos,
                  locationSource:
                    locationStatus === "granted"
                      ? ("browser" as const)
                      : ("market_fallback" as const),
                  quantity,
                  demandOpen: false,
                  mode: "search",
                });
                navigate({ to: "/auth", search: { redirectTo: "/carte?pendingSearch=1" } });
                return;
              }
              setCategory(value);
              setSearchRunKey(`${Date.now()}:category:${value}`);
            }}
            filters={filters}
            onFiltersChange={setFilters}
            resultCount={results.length}
            onVerifyAvailability={openDemandRequest}
            quantity={quantity}
            onQuantityChange={setQuantity}
            locationStatus={locationStatus}
            browserPermission={browserPermission}
            locationAccuracy={userPos?.accuracy ?? null}
            locationCoordinates={userPos}
            locationRequestId={locationSnapshot?.requestId ?? null}
            onRequestLocation={requestLocation}
            onUseMarketFallback={useMarketFallback}
            onBrandClick={() => {
              if (userPos) setFitPoints([userPos]);
              else toast.info("Position indisponible.");
            }}
          />
        )}

        {selected && (
          <div className="absolute inset-x-0 bottom-0 max-h-[70%] overflow-y-auto rounded-t-3xl border-t border-border bg-card p-4 shadow-[var(--shadow-sheet)] md:left-auto md:right-4 md:top-4 md:max-h-[calc(100%-2rem)] md:w-[420px] md:rounded-2xl md:border">
            <div className="mb-2 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: "/fiche/$id", params: { id: selected.id } })}
              >
                Page complète
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Fermer"
                onClick={() => setSelected(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <FacilityPanel
              facility={selected}
              distanceKm={haversineKm(origin, { lat: selected.latitude, lng: selected.longitude })}
              routingBusy={routingBusy}
              onItinerary={() => void buildItinerary(selected)}
              onCheckAvailability={() => openManualAvailability(selected)}
            />
          </div>
        )}

        {steps.length > 0 && (
          <div className="absolute inset-x-3 bottom-3 max-h-48 overflow-y-auto rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-soft)] md:right-[460px] md:inset-x-auto md:left-3 md:w-96">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-display font-bold">Guidage à pied</p>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Relire"
                  onClick={() => speak(steps[0]?.instruction ?? "")}
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Arrêter le guidage"
                  onClick={() => {
                    setSteps([]);
                    setRouteCoords(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <ol className="space-y-1.5 text-sm">
              {steps.map((s, i) => (
                <li key={`${s.instruction}-${i}`} className="flex gap-2">
                  <span className="font-semibold text-primary">{i + 1}.</span>
                  <span>
                    {s.instruction}{" "}
                    <span className="text-muted-foreground">
                      ({formatDistance(s.distance / 1000)})
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <CartPanel open={cartOpen} onOpenChange={setCartOpen} />
      <OrdersPanel open={ordersOpen} onOpenChange={setOrdersOpen} />
      <ChatPanel open={chatOpen} onOpenChange={setChatOpen} />
      <DemandRequestPanel
        open={demandOpen}
        onOpenChange={setDemandOpen}
        userPos={demandUserPos}
        initialTerm={query}
        targetFacilityIds={demandTargetFacilityIds}
        mode={demandMode}
        facilityName={demandFacilityName}
        initialQuantity={quantity}
      />
      <WishlistPanel
        open={wishOpen}
        onOpenChange={setWishOpen}
        onRerun={(term) => setQuery(term)}
      />
    </div>
  );
}

function translateManeuver(type: string, modifier?: string): string {
  const dir: Record<string, string> = {
    left: "à gauche",
    right: "à droite",
    "slight left": "légèrement à gauche",
    "slight right": "légèrement à droite",
    straight: "tout droit",
    uturn: "demi-tour",
  };
  if (type === "depart") return "Départ";
  if (type === "arrive") return "Vous êtes arrivé";
  if (type === "turn") return `Tournez ${dir[modifier ?? ""] ?? ""}`.trim();
  if (type === "roundabout") return "Prenez le rond-point";
  return `Continuez ${dir[modifier ?? ""] ?? "tout droit"}`;
}

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !text) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "fr-FR";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}
