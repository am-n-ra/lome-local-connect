import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Volume2, X } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@/lib/useServerFn";
import { listFacilitiesInBounds, type MapFacility as ApiFacility } from "@/lib/omni.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapCanvas, type MapFacility } from "@/components/omni/MapCanvas";
import { FacilityPanel } from "@/components/omni/FacilityPanel";
import { CartPanel } from "@/components/omni/CartPanel";
import { WishlistPanel } from "@/components/omni/WishlistPanel";
import { OrdersPanel } from "@/components/omni/OrdersPanel";
import { ChatPanel } from "@/components/omni/ChatPanel";
import { DemandRequestPanel } from "@/components/omni/DemandRequestPanel";
import { TopNav } from "@/components/omni/TopNav";
import { SearchDock, DEFAULT_FILTERS, type MapFilters } from "@/components/omni/SearchDock";
import { OmniMapShell } from "@/components/omni/ui/OmniMapShell";
import { OmniResumeBar, OmniSheetSurface } from "@/components/omni/ui/OmniPrimitives";
import { ResultRail } from "@/components/omni/ResultRail";

import {
  categoryLabel,
  formatDistance,
  haversineKm,
  DEFAULT_CENTER,
  LOCATION_APPROXIMATE_ACCURACY_METERS,
} from "@/lib/omni";
import { deriveOmniMotionState, deriveOmniSurfaceState } from "@/lib/omni-state";
import { canRenderPersonalLocationMarker, classifyLocationAccuracy } from "@/lib/omni-v1-contracts";
import { useMarket } from "@/lib/market";
import {
  restorePendingAvailabilitySearch,
  savePendingAvailabilitySearch,
  useAuth,
} from "@/lib/auth";
import { getTransactionTimeline, listMyOrders } from "@/lib/checkout.functions";
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
type ViewportBounds = { west: number; south: number; east: number; north: number; zoom: number };

type CartePageProps = {
  initialTransactionId?: string;
  initialDemandRequestId?: string;
  initialDemandResponseId?: string;
};

export function CartePage({
  initialTransactionId,
  initialDemandRequestId,
  initialDemandResponseId,
}: CartePageProps = {}) {
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
  const [submittedQuery, setSubmittedQuery] = useState("");
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
  const [sessionLocation, setSessionLocation] = useState<LocationSnapshot | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("pending");
  const [browserPermission, setBrowserPermission] = useState<BrowserPermissionStatus>("unknown");
  const [locationSnapshot, setLocationSnapshot] = useState<LocationSnapshot | null>(null);
  // A restored session coordinate may inform approximate discovery, but it must
  // never create a personal marker until this browser session receives a fresh
  // geolocation callback.
  const [hasFreshBrowserLocation, setHasFreshBrowserLocation] = useState(false);
  const locationRequestStartedRef = useRef(false);
  const locationRequestIdRef = useRef(0);
  const locationWatchIdRef = useRef<number | null>(null);
  const locationWatchTimeoutRef = useRef<number | null>(null);
  const bestPositionRef = useRef<{
    lat: number;
    lng: number;
    accuracy: number | null;
  } | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
  const [steps, setSteps] = useState<RouteStep[]>([]);
  const [routingBusy, setRoutingBusy] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishOpen, setWishOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [transactionChat, setTransactionChat] = useState<{
    transactionId: string;
    facilityId: string;
    facilityName: string;
    amount: number;
  } | null>(null);
  const [activeTransactionCount, setActiveTransactionCount] = useState(0);
  const [demandOpen, setDemandOpen] = useState(false);
  const [demandMode, setDemandMode] = useState<"bulk" | "manual">("bulk");
  const [demandFacilityName, setDemandFacilityName] = useState<string | null>(null);
  const [pendingTargetFacilityIds, setPendingTargetFacilityIds] = useState<string[] | null>(null);
  const [pendingUserPos, setPendingUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [visibleViewport, setVisibleViewport] = useState<ViewportBounds | null>(null);
  const [coverageStatus, setCoverageStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const viewportRequestKeyRef = useRef<string | null>(null);
  const fetchFacilitiesInBounds = useServerFn(listFacilitiesInBounds);
  const fetchInitialTimeline = useServerFn(getTransactionTimeline);
  const fetchMyOrders = useServerFn(listMyOrders);
  const hasCoverageSearch = Boolean(submittedQuery.trim() || category);

  useEffect(() => {
    if (!user) {
      setActiveTransactionCount(0);
      return;
    }
    let active = true;
    const refreshActiveTransactions = async () => {
      try {
        const orders = await fetchMyOrders({});
        if (!active) return;
        const activeStatuses = new Set([
          "pending",
          "qr_generated",
          "qr_verified",
          "payment_pending",
          "paid",
          "fulfillment",
          "received",
          "rating_pending",
        ]);
        setActiveTransactionCount(
          orders.filter(
            (order) =>
              Boolean(order.transaction_id) &&
              activeStatuses.has(order.transaction_status ?? order.status),
          ).length,
        );
      } catch {
        if (active) setActiveTransactionCount(0);
      }
    };
    void refreshActiveTransactions();
    const interval = window.setInterval(() => void refreshActiveTransactions(), 15000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [fetchMyOrders, user]);

  useEffect(() => {
    if (!transactionChat) return;
    window.sessionStorage.setItem(
      "omni:last-transaction-room",
      JSON.stringify({ transactionId: transactionChat.transactionId, role: "buyer" }),
    );
  }, [transactionChat]);

  useEffect(() => {
    if (!user || !initialDemandRequestId) return;
    setDemandMode("manual");
    setDemandFacilityName(null);
    setPendingTargetFacilityIds([]);
    setPendingUserPos(null);
    setDemandOpen(true);
  }, [initialDemandRequestId, user]);

  useEffect(() => {
    if (!user || !initialTransactionId) return;
    let active = true;
    void fetchInitialTimeline({ data: { transactionId: initialTransactionId } })
      .then((timeline) => {
        if (!active) return;
        setTransactionChat({
          transactionId: timeline.transaction.id,
          facilityId: timeline.transaction.facility_id,
          facilityName: timeline.transaction.facility_name,
          amount: timeline.transaction.amount,
        });
        setChatOpen(true);
      })
      .catch(() => {
        if (active) toast.error("Cette transaction n’est pas accessible avec ce compte.");
      });
    return () => {
      active = false;
    };
  }, [fetchInitialTimeline, initialTransactionId, user]);

  useEffect(() => {
    if (!visibleViewport) return;
    const key = [
      Math.round(visibleViewport.west * 1000),
      Math.round(visibleViewport.south * 1000),
      Math.round(visibleViewport.east * 1000),
      Math.round(visibleViewport.north * 1000),
      Math.floor(visibleViewport.zoom),
      submittedQuery.trim(),
      category ?? "",
    ].join(":");
    if (viewportRequestKeyRef.current === key) return;
    viewportRequestKeyRef.current = key;
    let active = true;
    const handle = window.setTimeout(
      () => {
        setCoverageStatus("loading");
        void fetchFacilitiesInBounds({
          data: {
            ...visibleViewport,
            search: hasCoverageSearch ? submittedQuery.trim() || undefined : undefined,
            category: hasCoverageSearch ? (category ?? undefined) : undefined,
            includeUnclaimed: true,
            limit: hasCoverageSearch ? 240 : 120,
          },
        })
          .then((rows) => {
            if (!active) return;
            if (hasCoverageSearch) setFacilities(rows);
            else setDiscoveryFacilities(rows);
            setCoverageStatus("ready");
          })
          .catch((error) => {
            if (!active) return;
            setCoverageStatus("error");
            console.warn("Omni coverage request failed", error);
          });
      },
      hasCoverageSearch ? 260 : 120,
    );
    return () => {
      active = false;
      window.clearTimeout(handle);
    };
  }, [category, fetchFacilitiesInBounds, hasCoverageSearch, submittedQuery, visibleViewport]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setBrowserPermission("unsupported");
      setLocationStatus("unavailable");
      return;
    }

    if (locationWatchIdRef.current != null) {
      navigator.geolocation.clearWatch(locationWatchIdRef.current);
      locationWatchIdRef.current = null;
    }
    if (locationWatchTimeoutRef.current != null) {
      window.clearTimeout(locationWatchTimeoutRef.current);
      locationWatchTimeoutRef.current = null;
    }

    setLocationStatus("pending");
    const requestId = ++locationRequestIdRef.current;

    const acceptPosition = (pos: GeolocationPosition) => {
      const nextPosition = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null,
      };
      const previous = bestPositionRef.current;
      const isBetter =
        !hasFreshBrowserLocation ||
        !previous ||
        (nextPosition.accuracy == null && previous.accuracy == null) ||
        (nextPosition.accuracy != null &&
          (previous.accuracy == null || nextPosition.accuracy < previous.accuracy));
      if (!isBetter) return false;

      const snapshot = { ...nextPosition, timestamp: Date.now(), requestId };
      bestPositionRef.current = nextPosition;
      setLocationSnapshot(snapshot);
      setSessionLocation(snapshot);
      setUserPos(nextPosition);
      setHasFreshBrowserLocation(true);
      setBrowserPermission("granted");
      setLocationStatus("granted");
      try {
        window.sessionStorage.setItem("omni:last-location", JSON.stringify(snapshot));
      } catch {
        // Session storage can be unavailable in privacy-restricted contexts.
      }
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
      return true;
    };

    const startWatch = () => {
      if (locationWatchIdRef.current != null) return;
      locationWatchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          acceptPosition(pos);
          if (
            Number.isFinite(pos.coords.accuracy) &&
            pos.coords.accuracy <= LOCATION_APPROXIMATE_ACCURACY_METERS
          ) {
            if (locationWatchIdRef.current != null) {
              navigator.geolocation.clearWatch(locationWatchIdRef.current);
              locationWatchIdRef.current = null;
            }
            if (locationWatchTimeoutRef.current != null) {
              window.clearTimeout(locationWatchTimeoutRef.current);
              locationWatchTimeoutRef.current = null;
            }
          }
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) setBrowserPermission("denied");
          setLocationStatus(bestPositionRef.current ? "granted" : "unavailable");
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
      );
      locationWatchTimeoutRef.current = window.setTimeout(() => {
        if (locationWatchIdRef.current != null) {
          navigator.geolocation.clearWatch(locationWatchIdRef.current);
          locationWatchIdRef.current = null;
        }
        locationWatchTimeoutRef.current = null;
        setLocationStatus(bestPositionRef.current ? "granted" : "unavailable");
      }, 12000);
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        acceptPosition(pos);
        startWatch();
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setBrowserPermission("denied");
          setLocationStatus("unavailable");
          return;
        }
        startWatch();
        setLocationStatus(bestPositionRef.current ? "granted" : "pending");
      },
      // Never accept a cached network estimate as the fresh location proof.
      { enableHighAccuracy: false, maximumAge: 0, timeout: 5000 },
    );
  }, [fallbackCenter, hasFreshBrowserLocation]);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem("omni:last-location");
      if (!raw) return;
      const parsed = JSON.parse(raw) as LocationSnapshot;
      if (
        !Number.isFinite(parsed.lat) ||
        !Number.isFinite(parsed.lng) ||
        !Number.isFinite(parsed.timestamp) ||
        Date.now() - parsed.timestamp > 1000 * 60 * 60 * 12
      ) {
        window.sessionStorage.removeItem("omni:last-location");
        return;
      }
      setSessionLocation(parsed);
      setUserPos({ lat: parsed.lat, lng: parsed.lng, accuracy: parsed.accuracy });
      setLocationSnapshot(parsed);
      bestPositionRef.current = { lat: parsed.lat, lng: parsed.lng, accuracy: parsed.accuracy };
      setBrowserPermission("granted");
      setLocationStatus("granted");
    } catch {
      // Ignore malformed or unavailable session storage.
    }

    return () => {
      if (locationWatchIdRef.current != null) {
        navigator.geolocation?.clearWatch(locationWatchIdRef.current);
        locationWatchIdRef.current = null;
      }
      if (locationWatchTimeoutRef.current != null) {
        window.clearTimeout(locationWatchTimeoutRef.current);
        locationWatchTimeoutRef.current = null;
      }
    };
  }, []);

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
          if (!bestPositionRef.current) setLocationStatus("unavailable");
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

  function ensureFallbackViewport(force = false) {
    if (visibleViewport && !force) return;
    viewportRequestKeyRef.current = null;
    if (visibleViewport && force) {
      setVisibleViewport((current) => (current ? { ...current } : current));
      return;
    }
    const zoom = market?.default_zoom ?? 12.2;
    const latitudeSpan = Math.max(0.12, 2.5 / 2 ** Math.max(0, zoom - 8));
    const longitudeSpan = Math.max(0.16, 3.5 / 2 ** Math.max(0, zoom - 8));
    setVisibleViewport({
      west: Math.max(-180, fallbackCenter.lng - longitudeSpan),
      south: Math.max(-85, fallbackCenter.lat - latitudeSpan),
      east: Math.min(180, fallbackCenter.lng + longitudeSpan),
      north: Math.min(85, fallbackCenter.lat + latitudeSpan),
      zoom,
    });
  }

  function retryCoverage() {
    viewportRequestKeyRef.current = null;
    setCoverageStatus("idle");
    if (visibleViewport) {
      setVisibleViewport((current) => (current ? { ...current } : current));
    } else {
      ensureFallbackViewport();
    }
  }

  function useMarketFallback() {
    setUserPos(null);
    setSessionLocation(null);
    setLocationSnapshot(null);
    setHasFreshBrowserLocation(false);
    bestPositionRef.current = null;
    setLocationStatus("fallback");
    ensureFallbackViewport(true);
    try {
      window.sessionStorage.removeItem("omni:last-location");
    } catch {
      // Storage can be unavailable in privacy-restricted contexts.
    }
  }

  const rawOrigin = userPos ?? sessionLocation;
  const hasPreciseUserPosition = canRenderPersonalLocationMarker(
    hasFreshBrowserLocation,
    rawOrigin?.accuracy,
    LOCATION_APPROXIMATE_ACCURACY_METERS,
  );
  const preciseUserPos = hasPreciseUserPosition ? rawOrigin : null;
  const approximateUserPos =
    rawOrigin &&
    classifyLocationAccuracy(rawOrigin.accuracy, LOCATION_APPROXIMATE_ACCURACY_METERS) ===
      "approximate"
      ? rawOrigin
      : null;
  const usableOrigin = rawOrigin ?? fallbackCenter;
  const origin = usableOrigin;

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
    Boolean(submittedQuery.trim()) ||
    Boolean(category) ||
    (Boolean(searchRunKey) &&
      (filters.radiusKm !== DEFAULT_FILTERS.radiusKm ||
        filters.maxPrice !== DEFAULT_FILTERS.maxPrice ||
        filters.openOnly !== DEFAULT_FILTERS.openOnly ||
        filters.discountOnly !== DEFAULT_FILTERS.discountOnly ||
        filters.sort !== DEFAULT_FILTERS.sort));
  const searchKey = `${submittedQuery.trim()}|${category ?? ""}|${filters.radiusKm}|${filters.maxPrice ?? ""}|${filters.openOnly}|${filters.discountOnly}|${filters.sort}`;
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
      setFitPoints(rawOrigin ? [usableOrigin] : null);
      return;
    }
    const nearest = [...results]
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 6)
      .map((f) => ({ lat: f.latitude, lng: f.longitude }));
    setFitPoints(rawOrigin ? [usableOrigin, ...nearest] : nearest);
  }, [
    hasActiveSearch,
    searchKey,
    resultPointKey,
    results,
    rawOrigin,
    usableOrigin,
    origin.lat,
    origin.lng,
  ]);

  const demandTargetFacilityIds = pendingTargetFacilityIds ?? results.map((f) => f.id);
  const demandUserPos = pendingUserPos ?? preciseUserPos;
  const surfaceState = deriveOmniSurfaceState({
    hasSearch: hasActiveSearch,
    hasResults: results.length > 0,
    selectedFacility: Boolean(selected),
    availabilityOpen: demandOpen,
    revealRunning,
  });
  const motionState = deriveOmniMotionState({
    locating: locationStatus === "pending",
    searching: hasActiveSearch && results.length === 0,
    revealRunning,
    selected: Boolean(selected),
    transaction: surfaceState === "transaction_chat" || surfaceState === "completed",
  });

  function handOffAvailabilitySearch(
    mode: "bulk" | "manual" = "bulk",
    facility?: MapFacility | null,
  ) {
    const payload = {
      term: submittedQuery,
      category,
      filters,
      targetFacilityIds: facility ? [facility.id] : results.map((f) => f.id),
      location: preciseUserPos,
      locationSource: hasPreciseUserPosition ? ("browser" as const) : ("market_fallback" as const),
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
    setPendingUserPos(preciseUserPos);
    setDemandOpen(true);
  }

  useEffect(() => {
    if (authLoading || !user) return;
    const pending = restorePendingAvailabilitySearch();
    if (!pending) return;
    setQuery(pending.term);
    setSubmittedQuery(pending.term);
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
        location: preciseUserPos,
        locationSource: hasPreciseUserPosition
          ? ("browser" as const)
          : ("market_fallback" as const),
        quantity,
        demandOpen: false,
        mode: "search",
      });
      navigate({ to: "/auth", search: { redirectTo: "/carte?pendingSearch=1" } });
      return;
    }
    if (locationStatus === "pending") setLocationStatus("fallback");
    if (!visibleViewport) ensureFallbackViewport();
    setSelected(null);
    setRouteCoords(null);
    setSteps([]);
    setSubmittedQuery(query.trim());
    setSearchRunKey(`${Date.now()}:${query.trim()}:${category ?? ""}`);
  }

  async function buildItinerary(f: MapFacility) {
    if (!preciseUserPos) {
      toast.info(
        "Votre position précise est indisponible. Autorisez la localisation pour obtenir un itinéraire.",
      );
      return;
    }
    const from = preciseUserPos;
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
    <OmniMapShell
      label="Carte de recherche Omni"
      className="bg-[var(--atlas-paper)]"
      map={
        <MapCanvas
          facilities={hasActiveSearch ? results : discoveryResults}
          selectedId={selected?.id ?? null}
          onSelect={(f) => {
            setSelected(f);
            setRouteCoords(null);
            setSteps([]);
          }}
          routeCoords={routeCoords}
          userPosition={preciseUserPos}
          approximatePosition={approximateUserPos}
          marketCenter={usableOrigin}
          marketZoom={market?.default_zoom ?? 12.2}
          revealKey={searchRunKey}
          showFacilities={true}
          showUserLocation={hasPreciseUserPosition}
          onRevealStateChange={setRevealRunning}
          onViewportChange={setVisibleViewport}
          focus={selected ? { lat: selected.latitude, lng: selected.longitude } : null}
          fitPoints={selected ? null : fitPoints}
          className="h-full w-full"
        />
      }
      chrome={
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
      }
    >
      {activeTransactionCount > 0 ? (
        <div className="pointer-events-auto absolute inset-x-3 top-[calc(env(safe-area-inset-top)+4.75rem)] z-20 mx-auto w-[min(calc(100vw-1.5rem),34rem)] md:top-20">
          <OmniResumeBar
            label={`${activeTransactionCount} transaction${activeTransactionCount > 1 ? "s" : ""} en cours`}
            detail="Reprendre depuis Mes demandes"
            onClick={() => setOrdersOpen(true)}
          />
        </div>
      ) : null}

      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        data-omni-surface={surfaceState}
        data-omni-motion={motionState}
      >
        {!revealRunning && !selected && hasActiveSearch && steps.length === 0 ? (
          <ResultRail
            facilities={results}
            queryLabel={
              submittedQuery.trim() || (category ? categoryLabel(category) : "Recherche Omni")
            }
            onSelect={(facility) => {
              setSelected(facility);
              setRouteCoords(null);
              setSteps([]);
            }}
          />
        ) : null}

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
                  location: preciseUserPos,
                  locationSource: hasPreciseUserPosition
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
              setSubmittedQuery("");
              setSearchRunKey(`${Date.now()}:category:${value}`);
            }}
            filters={filters}
            onFiltersChange={setFilters}
            resultCount={results.length}
            activeSearch={hasActiveSearch}
            coverageStatus={coverageStatus}
            onVerifyAvailability={openDemandRequest}
            quantity={quantity}
            onQuantityChange={setQuantity}
            locationStatus={locationStatus}
            browserPermission={browserPermission}
            locationAccuracy={hasFreshBrowserLocation ? (userPos?.accuracy ?? null) : null}
            onRequestLocation={requestLocation}
            onUseMarketFallback={useMarketFallback}
            onRetryCoverage={retryCoverage}
          />
        )}

        {selected && (
          <OmniSheetSurface className="omni-atlas-surface pointer-events-auto absolute bottom-0 left-1/2 top-auto z-40 flex max-h-[min(88dvh,48rem)] w-[min(calc(100vw-1rem),34rem)] -translate-x-1/2 flex-col overflow-hidden rounded-t-[1.75rem] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-[1.75rem] sm:p-5">
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
            <div className="mb-3 overflow-hidden rounded-2xl bg-secondary/60">
              {selected.cover_url ? (
                <img
                  src={selected.cover_url}
                  alt={`Aperçu de ${selected.name}`}
                  loading="lazy"
                  className="h-36 w-full object-cover"
                />
              ) : (
                <div className="grid h-36 place-items-center bg-secondary/50 text-center text-xs font-semibold text-muted-foreground">
                  Aucun média public disponible
                </div>
              )}
            </div>
            <div className="min-h-0 overflow-y-auto">
              <FacilityPanel
                facility={selected}
                distanceKm={haversineKm(origin, {
                  lat: selected.latitude,
                  lng: selected.longitude,
                })}
                routingBusy={routingBusy}
                onItinerary={() => void buildItinerary(selected)}
                transactionAccessGranted={transactionChat?.facilityId === selected.id}
                onCheckAvailability={() => openManualAvailability(selected)}
              />
            </div>
          </OmniSheetSurface>
        )}

        {steps.length > 0 && (
          <div className="omni-atlas-surface pointer-events-auto absolute inset-x-3 bottom-3 max-h-48 overflow-y-auto rounded-2xl p-3 md:right-[460px] md:inset-x-auto md:left-3 md:w-96">
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
      <ChatPanel
        open={chatOpen}
        onOpenChange={setChatOpen}
        facilityId={transactionChat?.facilityId}
        facilityName={transactionChat?.facilityName}
        transactionContext={
          transactionChat
            ? {
                transactionId: transactionChat.transactionId,
                status: "Intention créée",
                amountLabel: formatMoney(transactionChat.amount),
              }
            : undefined
        }
      />
      <DemandRequestPanel
        open={demandOpen}
        onOpenChange={setDemandOpen}
        userPos={demandUserPos}
        initialTerm={query}
        targetFacilityIds={demandTargetFacilityIds}
        mode={demandMode}
        facilityName={demandFacilityName}
        initialQuantity={quantity}
        resumeRequestId={initialDemandRequestId}
        resumeResponseId={initialDemandResponseId}
        onTransactionCreated={({ transactionId, facilityId, facilityName, amount }) => {
          setTransactionChat({ transactionId, facilityId, facilityName, amount });
          setActiveTransactionCount((count) => Math.max(1, count + 1));
          setDemandOpen(false);
          setChatOpen(true);
        }}
      />
      <WishlistPanel
        open={wishOpen}
        onOpenChange={setWishOpen}
        onRerun={(term) => setQuery(term)}
      />
    </OmniMapShell>
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
