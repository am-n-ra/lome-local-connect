import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { useServerFn } from "@/lib/useServerFn";
import { CreditCard, MapPin, Store } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TopNav } from "@/components/omni/TopNav";
import { MapCanvas } from "@/components/omni/MapCanvas";
import { CouponsPanel } from "@/components/omni/vendor/CouponsPanel";
import { RequestsPanel } from "@/components/omni/vendor/RequestsPanel";
import { DemandPanel } from "@/components/omni/vendor/DemandPanel";
import { CheckoutPanel } from "@/components/omni/vendor/CheckoutPanel";
import {
  SellerProductForm,
  type SellerProductDraft,
} from "@/components/omni/vendor/SellerProductForm";
import {
  SellerOnboardingFlow,
  type SellerOnboardingDraft,
} from "@/components/omni/vendor/SellerOnboardingFlow";
import { MediaManager } from "@/components/omni/MediaManager";
import { OmniActionDock } from "@/components/omni/ui/OmniActionDock";
import { OmniMapShell } from "@/components/omni/ui/OmniMapShell";
import { CleanSellerWorkspace } from "@/components/omni-clean/CleanSellerWorkspace";
import { CleanProductForm } from "@/components/omni-clean/CleanProductForm";
import { CleanWalletPanel } from "@/components/omni-clean/CleanWalletPanel";
import { CleanSellerOnboarding } from "@/components/omni-clean/CleanSellerOnboarding";
import { CleanSellerAccessGate } from "@/components/omni-clean/CleanSellerAccessGate";
import { CleanScannerPanel } from "@/components/omni-clean/CleanScannerPanel";
import {
  OmniErrorState,
  OmniResumeBar,
  OmniSkeleton,
  OmniStatCard,
  OmniStatusBadge,
} from "@/components/omni/ui/OmniPrimitives";
import { BalanceSheet } from "@/components/omni/ui/BalanceSheet";
import { daysLeft, freshnessLabel, DEFAULT_CENTER, STATUS_LABEL } from "@/lib/omni";
import { useMarket } from "@/lib/market";
import { FREE_PRODUCT_CAP } from "@/lib/vendor";
import { OMNI_CONFIG } from "@/lib/omni.config";
import {
  confirmStock,
  createFacility as createFacilityFn,
  deleteProduct,
  getVendorCoupons,
  getVendorProducts,
  getVendorRequests,
  getVendorShell,
  updateCompany,
  updateFacility,
  updateMobilePosition,
  upsertProduct,
  type VendorCompany,
  type VendorCoupon,
  type VendorFacility,
  type VendorProduct,
  type VendorRequest,
  type VendorSubscription,
  type VendorBalance,
  type VendorUnlock,
  type DemandSignal,
} from "@/lib/vendor.functions";
import { createWalletDeposit, confirmWalletDeposit } from "@/lib/payments.functions";
import { transferWalletAllocation, type WalletAllocationBucket } from "@/lib/wallet.functions";

export const Route = createFileRoute("/vendeur")({
  validateSearch: z.object({
    depot: z.string().uuid().optional(),
    transactionId: z.string().uuid().optional(),
  }),
  head: () => ({
    meta: [
      { title: "Espace vendeur — OmniView" },
      {
        name: "description",
        content:
          "Créez votre fiche commerce, gérez vos produits, vos demandes et vos campagnes de visibilité à Lomé avec 10 000 FCFA offerts.",
      },
      { property: "og:title", content: "Espace vendeur — OmniView" },
      {
        property: "og:description",
        content: "Gérez votre commerce, vos produits et votre visibilité sur OmniView.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VendeurPage,
});

type Dashboard = {
  facilities: VendorFacility[];
  companies: VendorCompany[];
  subscription: VendorSubscription | null;
  products: VendorProduct[];
  coupons: VendorCoupon[];
  requests: VendorRequest[];
  demand: DemandSignal[];
  walletBalance: number;
  balances: VendorBalance[];
  unlock: VendorUnlock | null;
  counts: { products: number; requests: number; coupons: number; campaigns: number };
};

function VendeurPage() {
  const { user, loading } = useAuth();
  const { formatMoney, market } = useMarket();
  const fallbackCenter =
    market?.default_lat != null
      ? { lat: market.default_lat, lng: market.default_lng }
      : DEFAULT_CENTER;
  const { depot, transactionId } = useSearch({ from: "/vendeur" });
  const navigate = useNavigate();
  const [data, setData] = useState<Dashboard | null>(null);
  const [ready, setReady] = useState(false);
  const [activeFacilityId, setActiveFacilityId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("apercu");
  const [liveDemandCount, setLiveDemandCount] = useState(0);

  useEffect(() => {
    if (!transactionId) return;
    setActiveTab("encaisser");
    window.sessionStorage.setItem(
      "omni:last-transaction-room",
      JSON.stringify({ transactionId, role: "seller" }),
    );
  }, [transactionId]);
  const [bonusOpen, setBonusOpen] = useState(false);
  const [hours, setHours] = useState("");
  const [discoveryMinutes, setDiscoveryMinutes] = useState("120");

  const [saving, setSaving] = useState(false);
  const [companySaving, setCompanySaving] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyLegalName, setCompanyLegalName] = useState("");
  const [companyCountry, setCompanyCountry] = useState("");

  const [topUpAmount, setTopUpAmount] = useState("5000");
  const [topUpBusy, setTopUpBusy] = useState(false);
  const [allocationBucket, setAllocationBucket] = useState<WalletAllocationBucket>("pro_credit");
  const [allocationAmount, setAllocationAmount] = useState("5000");
  const [allocationBusy, setAllocationBusy] = useState(false);
  const [overviewExpanded, setOverviewExpanded] = useState(false);
  const [surfaceLoading, setSurfaceLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const surfaceCache = useRef(
    new Map<
      string,
      {
        products?: VendorProduct[];
        requests?: VendorRequest[];
        coupons?: VendorCoupon[];
      }
    >(),
  );

  const loadProducts = useServerFn(getVendorProducts);
  const loadRequests = useServerFn(getVendorRequests);
  const loadCoupons = useServerFn(getVendorCoupons);
  const loadShell = useServerFn(getVendorShell);
  const createFacility = useServerFn(createFacilityFn);
  const saveProduct = useServerFn(upsertProduct);
  const removeProductFn = useServerFn(deleteProduct);
  const confirmAll = useServerFn(confirmStock);
  const patchCompany = useServerFn(updateCompany);
  const patchFacility = useServerFn(updateFacility);
  const moveMobile = useServerFn(updateMobilePosition);
  const confirmDeposit = useServerFn(confirmWalletDeposit);
  const createDeposit = useServerFn(createWalletDeposit);
  const transferAllocation = useServerFn(transferWalletAllocation);

  const reloadSurface = useCallback(
    async (facilityId: string, surface: "products" | "requests" | "coupons") => {
      surfaceCache.current.delete(facilityId);
      if (surface === "products") {
        const products = await loadProducts({ data: { facilityId } });
        surfaceCache.current.set(facilityId, { products });
        setData((current) => (current ? { ...current, products } : current));
      } else if (surface === "requests") {
        const requests = await loadRequests({ data: { facilityId } });
        surfaceCache.current.set(facilityId, { requests });
        setData((current) => (current ? { ...current, requests } : current));
      } else {
        const coupons = await loadCoupons({ data: { facilityId } });
        surfaceCache.current.set(facilityId, { coupons });
        setData((current) => (current ? { ...current, coupons } : current));
      }
    },
    [loadCoupons, loadProducts, loadRequests],
  );

  const refresh = useCallback(async () => {
    setLoadError(null);
    try {
      const shell = await loadShell();
      const walletBalance =
        shell.balances.find((balance) => balance.bucket === "wallet")?.amount ??
        shell.subscription?.wallet_balance ??
        0;
      setData({
        facilities: shell.facilities,
        companies: shell.companies,
        subscription: shell.subscription,
        products: [],
        coupons: [],
        requests: [],
        demand: [],
        walletBalance,
        balances: shell.balances,
        unlock: shell.unlock,
        counts: shell.counts,
      });
      setReady(true);
    } catch (error) {
      setData(null);
      setLoadError(error instanceof Error ? error.message : "Impossible de charger l’espace vendeur.");
      setReady(true);
    }
  }, [loadShell]);

  useEffect(() => {
    if (!user) {
      setReady(true);
      return;
    }
    void refresh();
  }, [user, refresh]);

  // Back from the FedaPay checkout page: reconcile then clean the URL.
  useEffect(() => {
    if (!depot || !user) return;
    void (async () => {
      try {
        const result = await confirmDeposit({ data: { depositId: depot } });
        if (result.status === "approved") {
          toast.success(`${formatMoney(result.amount)} ajoutés à votre portefeuille.`);
          await refresh();
        } else if (result.status === "pending") {
          toast.info("Paiement en cours de validation, votre solde sera crédité sous peu.");
        } else {
          toast.error("Le paiement n'a pas abouti.");
        }
      } catch {
        toast.error("Impossible de vérifier le paiement.");
      } finally {
        void navigate({ to: "/vendeur", search: {}, replace: true });
      }
    })();
  }, [depot, user, confirmDeposit, refresh, navigate, formatMoney]);

  const facility =
    data?.facilities.find((item) => item.id === activeFacilityId) ?? data?.facilities[0] ?? null;

  const company =
    data?.companies.find((item) => item.id === facility?.company_id) ?? data?.companies[0] ?? null;

  useEffect(() => {
    if (!facility) return;
    setHours(facility.operating_hours ?? "");
  }, [facility?.id, facility?.operating_hours]);

  useEffect(() => {
    if (!company) return;
    setCompanyName(company.name);
    setCompanyLegalName(company.legal_name ?? "");
    setCompanyCountry(company.country_code ?? "");
  }, [company?.id, company?.name, company?.legal_name, company?.country_code]);

  async function saveCompany() {
    if (!company) return;
    if (companyName.trim().length < 2) {
      toast.error("Indiquez un nom de compagnie valide.");
      return;
    }
    setCompanySaving(true);
    try {
      await patchCompany({
        data: {
          companyId: company.id,
          name: companyName.trim(),
          legalName: companyLegalName.trim() || null,
          countryCode: companyCountry.trim().toUpperCase() || null,
        },
      });
      await refresh();
      toast.success("Identité de la compagnie enregistrée.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Compagnie non enregistrée.");
    } finally {
      setCompanySaving(false);
    }
  }

  async function startTopUp() {
    const amount = Number(topUpAmount);
    if (!Number.isInteger(amount) || amount < 500) {
      toast.error("La recharge minimale est de 500 FCFA.");
      return;
    }
    if (!facility) {
      toast.error("Aucune facility active n’est disponible.");
      return;
    }
    setTopUpBusy(true);
    try {
      const result = await createDeposit({ data: { facilityId: facility.id, amount } });
      window.location.assign(result.url);
    } catch {
      toast.error("Impossible d’ouvrir la recharge FedaPay.");
      setTopUpBusy(false);
    }
  }

  async function allocateWallet() {
    const amount = Number(allocationAmount);
    if (!Number.isInteger(amount) || amount < 1) {
      toast.error("Indiquez un montant d’allocation valide.");
      return;
    }
    if (!facility) {
      toast.error("Aucune facility active n’est disponible.");
      return;
    }
    setAllocationBusy(true);
    try {
      const result = await transferAllocation({
        data: { facilityId: facility.id, bucket: allocationBucket, amount },
      });
      const balances = result.balances.map(
        (balance: { bucket: string; availableAmount: number }) => ({
          bucket: balance.bucket,
          amount: balance.availableAmount,
        }),
      );
      setData((current) =>
        current
          ? {
              ...current,
              balances,
              walletBalance:
                balances.find(
                  (balance: { bucket: string; amount: number }) => balance.bucket === "wallet",
                )?.amount ?? 0,
            }
          : current,
      );
      setAllocationAmount("");
      toast.success("Allocation interne effectuée depuis Omni Wallet.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Allocation impossible.");
    } finally {
      setAllocationBusy(false);
    }
  }
  const subscription = data?.subscription ?? null;
  const products = useMemo(() => data?.products ?? [], [data]);
  const mapFacilities = useMemo(
    () => data?.facilities.map((item) => ({ ...item, owner_id: user?.id ?? null })) ?? [],
    [data?.facilities, user?.id],
  );
  const pro = useMemo(
    () =>
      !!subscription &&
      subscription.tier === "pro" &&
      !!subscription.pro_active_until &&
      new Date(subscription.pro_active_until).getTime() >= Date.now(),
    [subscription],
  );
  const atProductCap = !pro && products.length >= FREE_PRODUCT_CAP;

  async function submitOnboarding(draft: SellerOnboardingDraft) {
    setSaving(true);
    try {
      await createFacility({
        data: {
          name: draft.name.trim().slice(0, 80),
          category: draft.category,
          type: draft.type,
          phone: draft.phone.trim().slice(0, 30) || undefined,
          address: draft.address.trim().slice(0, 140) || undefined,
          description: draft.description.trim().slice(0, 400) || undefined,
          latitude: draft.position.lat,
          longitude: draft.position.lng,
        },
      });
      await refresh();
      setBonusOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Création impossible.");
    } finally {
      setSaving(false);
    }
  }

  async function addProduct(draft: SellerProductDraft) {
    if (!facility) throw new Error("Aucune facility active.");
    const price = Number(draft.price);
    const quantityAvailable = Number(draft.quantity);
    const omniAllocationPercent = Number(draft.allocation);
    const allocatedOmni = Number(draft.allocatedOmni || 0);
    if (
      draft.name.trim().length < 2 ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isFinite(quantityAvailable) ||
      quantityAvailable < 0 ||
      !Number.isFinite(omniAllocationPercent) ||
      omniAllocationPercent < 0 ||
      omniAllocationPercent > 100
    ) {
      throw new Error("Nom et prix valides requis.");
    }
    await saveProduct({
      data: {
        facilityId: facility.id,
        name: draft.name.trim().slice(0, 80),
        price: Math.round(price),
        inStock: draft.status === "active" && quantityAvailable > 0,
        status: draft.status,
        quantityAvailable: Math.round(quantityAvailable),
        omniAllocationPercent: Math.round(omniAllocationPercent),
        quantityAllocatedOmni: Number.isFinite(allocatedOmni)
          ? Math.max(0, Math.round(allocatedOmni))
          : 0,
        discountPercent: Math.max(1, Math.min(90, Number(draft.couponPercent) || 1)),
        photoUrl: draft.photoUrl.trim() || null,
        coupon: draft.couponCode.trim()
          ? {
              code: draft.couponCode.trim().toUpperCase().slice(0, 24),
              description: draft.couponDescription.trim().slice(0, 200) || undefined,
              discountPercent: Math.max(1, Math.min(90, Number(draft.couponPercent) || 10)),
            }
          : null,
      },
    });
    await reloadSurface(facility.id, "products");
  }

  async function toggleStock(product: VendorProduct) {
    if (!facility) return;
    try {
      await saveProduct({
        data: {
          facilityId: facility.id,
          productId: product.id,
          name: product.name,
          price: product.price,
          inStock: !product.in_stock,
          status: !product.in_stock ? "active" : "sold_out",
          quantityAvailable: !product.in_stock ? Math.max(1, product.quantity_available) : 0,
          omniAllocationPercent: product.omni_allocation_percent,
          quantityAllocatedOmni: product.quantity_allocated_omni,
          discountPercent: product.discount_percent,
          photoUrl: product.photo_url,
        },
      });
      await reloadSurface(facility.id, "products");
    } catch {
      toast.error("Mise à jour impossible.");
    }
  }

  async function confirmProduct(product: VendorProduct) {
    if (!facility) return;
    try {
      await saveProduct({
        data: {
          facilityId: facility.id,
          productId: product.id,
          name: product.name,
          price: product.price,
          inStock: product.in_stock,
          status: product.status as "draft" | "active" | "paused" | "sold_out",
          quantityAvailable: product.quantity_available,
          omniAllocationPercent: product.omni_allocation_percent,
          quantityAllocatedOmni: product.quantity_allocated_omni,
          discountPercent: product.discount_percent,
          photoUrl: product.photo_url,
        },
      });
      await reloadSurface(facility.id, "products");
      toast.success("Disponibilité confirmée.");
    } catch {
      toast.error("Confirmation impossible.");
    }
  }

  async function removeProduct(product: VendorProduct) {
    if (!facility) return;
    try {
      await removeProductFn({ data: { facilityId: facility.id, productId: product.id } });
      await reloadSurface(facility.id, "products");
    } catch {
      toast.error("Suppression impossible.");
    }
  }

  async function confirmEverything() {
    if (!facility) return;
    try {
      await confirmAll({ data: { facilityId: facility.id } });
      await reloadSurface(facility.id, "products");
      toast.success("Tout le catalogue a été confirmé.");
    } catch {
      toast.error("Confirmation impossible.");
    }
  }

  async function toggleOnline(next: boolean) {
    if (!facility) return;
    try {
      await patchFacility({
        data: {
          facilityId: facility.id,
          isOnline: next,
          emergencyShutdown: next ? false : undefined,
        },
      });
      await refresh();
    } catch {
      toast.error("Mise à jour impossible.");
    }
  }

  async function saveOperatingHours() {
    if (!facility) return;
    try {
      await patchFacility({
        data: { facilityId: facility.id, operatingHours: hours.trim() || null },
      });
      await refresh();
      toast.success("Horaires enregistrés.");
    } catch {
      toast.error("Horaires non enregistrés.");
    }
  }

  async function toggleEmergencyShutdown(next: boolean) {
    if (!facility) return;
    try {
      await patchFacility({ data: { facilityId: facility.id, emergencyShutdown: next } });
      await refresh();
      toast.success(next ? "Arrêt d'urgence activé." : "Arrêt d'urgence levé.");
    } catch {
      toast.error("Arrêt d'urgence non enregistré.");
    }
  }

  async function toggleManualOpen(next: boolean) {
    if (!facility) return;
    try {
      await patchFacility({ data: { facilityId: facility.id, manualOpen: next } });
      await refresh();
      toast.success(next ? "Réponses automatiques activées." : "Réponses automatiques suspendues.");
    } catch {
      toast.error("État de disponibilité non enregistré.");
    }
  }

  async function toggleDiscovery(next: boolean) {
    if (!facility) return;
    const minutes = Number(discoveryMinutes);
    if (!Number.isInteger(minutes) || minutes < 15 || minutes > 720) {
      toast.error("Choisissez une durée Discovery entre 15 minutes et 12 heures.");
      return;
    }
    try {
      await patchFacility({
        data: { facilityId: facility.id, discoveryMode: next, discoveryMinutes: minutes },
      });
      await refresh();
      toast.success(next ? `Discovery activé pendant ${minutes} minutes.` : "Discovery désactivé.");
    } catch {
      toast.error("Mode Discovery non enregistré.");
    }
  }

  const refreshRequests = useCallback(async () => {
    if (facility) await reloadSurface(facility.id, "requests");
  }, [facility?.id, reloadSurface]);

  const refreshCoupons = useCallback(async () => {
    if (facility) await reloadSurface(facility.id, "coupons");
  }, [facility?.id, reloadSurface]);

  const updatePosition = useCallback(
    async (coords: { lat: number; lng: number }) => {
      if (!facility) return;
      try {
        if (facility.type === "mobile") {
          await moveMobile({
            data: {
              facilityId: facility.id,
              latitude: coords.lat,
              longitude: coords.lng,
              active: facility.is_online,
            },
          });
        } else {
          await patchFacility({
            data: { facilityId: facility.id, latitude: coords.lat, longitude: coords.lng },
          });
        }
        await refresh();
        toast.success("Position mise à jour.");
      } catch {
        toast.error("Position non enregistrée.");
      }
    },
    [facility, moveMobile, patchFacility, refresh],
  );

  useEffect(() => {
    setHours(facility?.operating_hours ?? "");
  }, [facility?.id, facility?.operating_hours]);

  useEffect(() => {
    if (!facility || !["produits", "demandes", "coupons"].includes(activeTab)) return;
    const cached = surfaceCache.current.get(facility.id);
    if (activeTab === "produits" && cached?.products) {
      setData((current) => (current ? { ...current, products: cached.products! } : current));
      return;
    }
    if (activeTab === "demandes" && cached?.requests) {
      setData((current) => (current ? { ...current, requests: cached.requests! } : current));
      return;
    }
    if (activeTab === "coupons" && cached?.coupons) {
      setData((current) => (current ? { ...current, coupons: cached.coupons! } : current));
      return;
    }
    let cancelled = false;
    setSurfaceLoading(true);
    void (async () => {
      try {
        if (activeTab === "produits") {
          const products = await loadProducts({ data: { facilityId: facility.id } });
          if (!cancelled) {
            surfaceCache.current.set(facility.id, {
              ...surfaceCache.current.get(facility.id),
              products,
            });
            setData((current) => (current ? { ...current, products } : current));
          }
        } else if (activeTab === "demandes") {
          const requests = await loadRequests({ data: { facilityId: facility.id } });
          if (!cancelled) {
            surfaceCache.current.set(facility.id, {
              ...surfaceCache.current.get(facility.id),
              requests,
            });
            setData((current) => (current ? { ...current, requests } : current));
          }
        } else if (activeTab === "coupons") {
          const coupons = await loadCoupons({ data: { facilityId: facility.id } });
          if (!cancelled) {
            surfaceCache.current.set(facility.id, {
              ...surfaceCache.current.get(facility.id),
              coupons,
            });
            setData((current) => (current ? { ...current, coupons } : current));
          }
        }
      } catch {
        if (!cancelled) toast.error("Impossible de charger cette surface.");
      } finally {
        if (!cancelled) setSurfaceLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, facility?.id, loadCoupons, loadProducts, loadRequests]);

  if (loading || !ready) {
    return (
      <main className="min-h-[100dvh] bg-background p-4 sm:p-8">
        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2">
          <OmniSkeleton className="h-24" />
          <OmniSkeleton className="h-24" />
          <OmniSkeleton className="h-64 sm:col-span-2" />
        </div>
      </main>
    );
  }

  if (!user) {
    return <CleanSellerAccessGate />;
  }

  if (loadError) {
    return (
      <main className="min-h-[100dvh] bg-background px-4 py-16">
        <div className="mx-auto max-w-md">
          <OmniErrorState title="Espace vendeur indisponible" description={loadError} onRetry={() => void refresh()} />
        </div>
      </main>
    );
  }

  if (!facility) {
    return <CleanSellerOnboarding center={fallbackCenter} saving={saving} onSubmit={submitOnboarding} />;
  }

  const useCleanSellerUi = !import.meta.env["VITE_DISABLE_CLEAN_SELLER_UI"];
  if (useCleanSellerUi) {
    const bonusProgress = data?.unlock?.qualifying_count ?? 0;
    const bonusState = bonusProgress >= 3 || data?.unlock?.status === "granted"
      ? "20 $ utilisables sur Omni"
      : "20 $ annoncés · verrouillés jusqu’à 3 ventes";
    const cleanPanel = activeTab === "apercu" ? (
      <div className="space-y-3 rounded-2xl bg-white/55 p-4">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[var(--omni-orange-deep)]">Votre scène vendeur</p>
        <h2 className="font-display text-xl font-extrabold tracking-[-0.03em]">La carte reste votre contexte.</h2>
        <p className="text-sm leading-6 text-[var(--omni-ink-muted)]">Touchez la carte pour corriger la position de cette facilité. Utilisez les cinq actions ci-dessous pour répondre, publier, vérifier ou gérer votre compte.</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <button type="button" onClick={() => setActiveTab("produits")} className="omni-clean-secondary-button min-h-11">Ajouter un produit</button>
          <button type="button" onClick={() => setActiveTab("demandes")} className="omni-clean-secondary-button min-h-11">Voir les demandes</button>
          <button type="button" onClick={() => setActiveTab("encaisser")} className="omni-clean-primary-button min-h-11">Ouvrir le scanner</button>
        </div>
      </div>
    ) : activeTab === "produits" ? (
      <div className="space-y-4">
        <CleanProductForm atProductCap={atProductCap} onSubmit={addProduct} />
        <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[var(--omni-orange-deep)]">Catalogue</p><h2 className="font-display text-xl font-extrabold">Produits publiés</h2></div><button type="button" onClick={() => void confirmEverything()} className="omni-clean-secondary-button min-h-10">Tout confirmer</button></div>
        <div className="space-y-2">{products.map((product) => <div key={product.id} className="rounded-2xl border border-black/5 bg-white/70 p-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-extrabold">{product.name}</p><p className="text-xs font-semibold text-[var(--omni-ink-muted)]">{formatMoney(product.price)} · Stock total {product.quantity_available} · Omni visible {product.quantity_allocated_omni}</p></div><div className="flex items-center gap-2"><button type="button" onClick={() => void confirmProduct(product)} className="omni-clean-secondary-button min-h-10 px-3">Confirmer</button><button type="button" onClick={() => void removeProduct(product)} className="omni-clean-secondary-button min-h-10 px-3">Supprimer</button></div></div></div>)}{products.length === 0 ? <p className="rounded-2xl bg-white/60 p-4 text-sm text-[var(--omni-ink-muted)]">Aucun produit pour l’instant.</p> : null}</div>
      </div>
    ) : activeTab === "demandes" ? (
      <div className="space-y-6"><DemandPanel demand={data?.demand ?? []} facilityId={facility.id} onLiveCountChange={setLiveDemandCount} /><RequestsPanel facilityId={facility.id} requests={data?.requests ?? []} onRefresh={refreshRequests} /></div>
    ) : activeTab === "encaisser" ? (
      <CleanScannerPanel facilityId={facility.id} {...(transactionId ? { initialTransactionId: transactionId } : {})} />
    ) : activeTab === "coupons" ? (
      <CouponsPanel facilityId={facility.id} coupons={data?.coupons ?? []} onRefresh={refreshCoupons} />
    ) : activeTab === "solde" ? (
      <CleanWalletPanel
        balances={data?.balances ?? []}
        formatMoney={formatMoney}
        topUpAmount={topUpAmount}
        topUpBusy={topUpBusy}
        allocationBucket={allocationBucket}
        allocationAmount={allocationAmount}
        allocationBusy={allocationBusy}
        onTopUpAmountChange={setTopUpAmount}
        onTopUp={() => void startTopUp()}
        onAllocationBucketChange={setAllocationBucket}
        onAllocationAmountChange={setAllocationAmount}
        onAllocate={() => void allocateWallet()}
      />
    ) : (
      <div className="space-y-4 rounded-2xl bg-white/55 p-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[var(--omni-orange-deep)]">Compte</p><h2 className="font-display text-xl font-extrabold">Un seul Omni Wallet</h2><p className="text-sm leading-6 text-[var(--omni-ink-muted)]">Rechargez votre Omni Wallet pour les services de la plateforme. Il n’existe pas de retrait vendeur dans la V1.</p><div className="grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => setActiveTab("solde")} className="omni-clean-secondary-button min-h-11"><CreditCard className="h-4 w-4" />Solde et recharge</button><button type="button" onClick={() => setActiveTab("coupons")} className="omni-clean-secondary-button min-h-11">Coupons · {data?.counts.coupons ?? 0}</button></div>{company ? <div className="rounded-2xl border border-black/5 bg-white/70 p-4"><p className="font-extrabold">{company.name}</p><p className="mt-1 text-xs font-semibold text-[var(--omni-ink-muted)]">{company.status === "certified" ? "Compagnie certifiée" : "Compagnie en vérification"}</p></div> : null}</div>
    );

    return (
      <CleanSellerWorkspace
        facility={facility}
        activeTab={activeTab}
        productsCount={products.length || data?.counts.products || 0}
        requestsCount={liveDemandCount || data?.counts.requests || 0}
        couponCount={data?.counts.coupons || 0}
        pro={pro}
        bonusProgress={bonusProgress}
        bonusState={bonusState}
        map={<MapCanvas facilities={mapFacilities} selectedId={facility.id} focus={{ lat: facility.latitude, lng: facility.longitude }} onMapClick={updatePosition} className="h-full w-full" />}
        panel={cleanPanel}
        onTabChange={(tab) => setActiveTab(tab)}
        onToggleOnline={(next) => void toggleOnline(next)}
      />
    );
  }

  return (
    <OmniMapShell
      label="Carte opérationnelle vendeur Omni"
      className="bg-[var(--atlas-paper)]"
      map={
        <>
          <MapCanvas
            facilities={mapFacilities}
            selectedId={facility.id}
            focus={{ lat: facility.latitude, lng: facility.longitude }}
            onMapClick={updatePosition}
            className="h-full w-full"
          />
          <div className="pointer-events-none absolute inset-0 bg-background/10" />
        </>
      }
      chrome={<TopNav activeRole="vendeur" minimalMapChrome />}
    >
      <main className="pointer-events-none absolute inset-0 z-10 flex max-h-[100dvh] items-start justify-center overflow-hidden px-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+4.75rem)] sm:px-5 sm:pt-24">
        <div
          className={`omni-atlas-surface pointer-events-auto flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-[1.75rem] bg-[var(--atlas-glass)]/72 transition-[max-width] duration-200 ${activeTab === "apercu" ? "max-w-xl" : "max-w-6xl"}`}
          data-omni-seller-surface={activeTab}
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 [scrollbar-width:thin] sm:p-4">
            <div className="mx-auto w-full max-w-5xl min-w-0">
              <section className="omni-atlas-surface rounded-[1.5rem] p-3 sm:p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-primary">
                      Espace vendeur · carte active
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <h1 className="truncate font-display text-2xl font-bold sm:text-3xl">
                        {facility.name}
                      </h1>
                      <OmniStatusBadge tone={facility.is_online ? "positive" : "neutral"}>
                        {STATUS_LABEL[facility.status] ?? facility.status}
                      </OmniStatusBadge>
                      {pro && <Badge className="bg-gold text-gold-foreground">Pro actif</Badge>}
                    </div>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">
                      {facility.company_name ?? "Compagnie non renseignée"} · {facility.company_status === "certified" ? "Compagnie certifiée" : "Compagnie en vérification"}
                    </p>
                    <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
                      La carte reste le contexte principal ; cette surface regroupe uniquement les actions V1 nécessaires.
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    {data && data.facilities.length > 1 && (
                      <label className="flex items-center gap-2 rounded-full bg-background/60 px-3 py-2 text-xs font-semibold">
                        <span className="text-muted-foreground">Facility</span>
                        <select
                          value={facility.id}
                          onChange={(event) => setActiveFacilityId(event.target.value)}
                          className="max-w-40 bg-transparent text-xs font-bold outline-none"
                          aria-label="Facility active"
                        >
                          {data.facilities.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    <label className="flex items-center gap-2 rounded-full bg-background/60 px-3 py-2 text-xs font-semibold">
                      <span
                        className={facility.is_online ? "text-forest" : "text-muted-foreground"}
                      >
                        {facility.is_online ? "En ligne" : "En pause"}
                      </span>
                      <Switch
                        checked={facility.is_online}
                        onCheckedChange={(v) => void toggleOnline(v)}
                      />
                    </label>
                  </div>
                </div>
              </section>

              {transactionId ? (
                <div className="mt-4">
                  <OmniResumeBar
                    label="Transaction seller en cours"
                    detail="Ouvrir la vérification, le paiement ou la remise"
                    onClick={() => setActiveTab("encaisser")}
                  />
                </div>
              ) : null}

              <div className="mt-5 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="min-w-0">
                {surfaceLoading ? (
                  <p className="mt-3 text-center text-xs font-semibold text-muted-foreground">
                    Chargement de la surface…
                  </p>
                ) : null}
                <OmniActionDock
                  active={activeTab}
                  onChange={setActiveTab}
                  placement="inline"
                  items={[
                    { value: "apercu", label: "Facility", shortLabel: "Accueil" },
                    {
                      value: "produits",
                      label: "Catalogue",
                      shortLabel: "Produits",
                      count: products.length || data?.counts.products || 0,
                    },
                    {
                      value: "demandes",
                      label: "Demandes reçues",
                      shortLabel: "Demandes",
                      count: liveDemandCount || data?.requests.length || data?.counts.requests || 0,
                    },
                    { value: "encaisser", label: "Scanner QR", shortLabel: "Scanner" },
                    { value: "compte", label: "Compte", shortLabel: "Compte" },
                  ]}
                />

                {pro && OMNI_CONFIG.sellerAgentEnabled && (
                  <TabsContent value="agent" className="mt-5 space-y-4">
                    <div className="omni-card space-y-3 p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                        Agent Omni
                      </p>
                      <h2 className="font-display text-2xl font-bold">Votre copilote vendeur</h2>
                      <p className="text-sm text-muted-foreground">
                        L'Agent priorise les demandes locales, prépare les réponses de disponibilité
                        et met en avant les actions qui renforcent la confiance.
                      </p>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border border-border p-3">
                          <p className="text-xs text-muted-foreground">Demandes locales</p>
                          <p className="mt-1 text-2xl font-bold">{data?.demand.length ?? 0}</p>
                        </div>
                        <div className="rounded-xl border border-border p-3">
                          <p className="text-xs text-muted-foreground">Demandes reçues</p>
                          <p className="mt-1 text-2xl font-bold">{data?.requests.length ?? 0}</p>
                        </div>
                        <div className="rounded-xl border border-border p-3">
                          <p className="text-xs text-muted-foreground">Statut</p>
                          <p className="mt-1 text-2xl font-bold">
                            {facility.is_online ? "Actif" : "En pause"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                )}

                <TabsContent value="compte" className="mt-5 space-y-4">
                  <section className="omni-atlas-surface space-y-3 rounded-[1.5rem] p-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                        Compte vendeur
                      </p>
                      <h2 className="mt-1 font-display text-xl font-bold">Gérez vos outils Omni</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Le Wallet et les coupons restent accessibles ici sans encombrer vos actions
                        opérationnelles quotidiennes.
                      </p>
                    </div>
                                            <div className="grid gap-2 sm:grid-cols-2">
                          <Button type="button" variant="outline" onClick={() => setActiveTab("solde")}>
                            Omni Wallet
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setActiveTab("coupons")}>
                            Coupons{data?.coupons.length ? ` · ${data.coupons.length}` : ""}
                          </Button>
                        </div>
                        {company ? (
                          <div className="space-y-3 rounded-2xl border border-border/70 bg-background/55 p-3">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                                Identité compagnie
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Cette identité regroupe vos facilities et reste distincte du portefeuille Omni.
                              </p>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="space-y-1.5">
                                <Label htmlFor="vendor-company-name">Nom affiché</Label>
                                <Input
                                  id="vendor-company-name"
                                  value={companyName}
                                  onChange={(event) => setCompanyName(event.target.value)}
                                  maxLength={120}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label htmlFor="vendor-company-country">Pays</Label>
                                <Input
                                  id="vendor-company-country"
                                  value={companyCountry}
                                  onChange={(event) => setCompanyCountry(event.target.value.toUpperCase())}
                                  maxLength={3}
                                  placeholder="TG"
                                />
                              </div>
                              <div className="space-y-1.5 sm:col-span-2">
                                <Label htmlFor="vendor-company-legal-name">Nom légal (facultatif)</Label>
                                <Input
                                  id="vendor-company-legal-name"
                                  value={companyLegalName}
                                  onChange={(event) => setCompanyLegalName(event.target.value)}
                                  maxLength={160}
                                />
                              </div>
                            </div>
                            <Button type="button" variant="outline" onClick={() => void saveCompany()} disabled={companySaving}>
                              {companySaving ? "Enregistrement…" : "Enregistrer l’identité"}
                            </Button>
                          </div>
                        ) : null}

                  </section>
                </TabsContent>

                <TabsContent value="solde" className="mt-5 space-y-4">
                  <BalanceSheet
                    balances={data?.balances ?? []}
                    formatMoney={formatMoney}
                    topUpControl={
                      <div className="w-full space-y-3 sm:w-auto sm:min-w-[22rem]">
                        <div className="flex w-full flex-wrap items-end gap-2">
                          <div className="min-w-32 flex-1 sm:flex-none">
                            <Label htmlFor="omni-wallet-top-up" className="sr-only">
                              Montant à recharger en FCFA
                            </Label>
                            <Input
                              id="omni-wallet-top-up"
                              inputMode="numeric"
                              type="number"
                              min="500"
                              value={topUpAmount}
                              onChange={(event) =>
                                setTopUpAmount(event.target.value.replace(/\\D/g, ""))
                              }
                              className="h-9 text-base sm:w-32 sm:text-sm"
                              aria-label="Montant à recharger en FCFA"
                            />
                          </div>
                          <Button size="sm" onClick={() => void startTopUp()} disabled={topUpBusy}>
                            <CreditCard className="mr-1.5 h-4 w-4" />
                            {topUpBusy ? "Ouverture FedaPay…" : "Payer par carte"}
                          </Button>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Recharge unique Omni Wallet via le checkout FedaPay sécurisé. Les
                          paiements buyer-vendeur et retraits seller restent externes à la V1.
                        </p>
                        <div className="space-y-2 rounded-xl border border-border/70 bg-background/55 p-2">
                          <Label htmlFor="omni-wallet-allocation">Allouer depuis Omni Wallet</Label>
                          <div className="flex flex-wrap gap-2">
                            <select
                              id="omni-wallet-allocation"
                              value={allocationBucket}
                              onChange={(event) =>
                                setAllocationBucket(event.target.value as WalletAllocationBucket)
                              }
                              className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm"
                            >
                              <option value="pro_credit">Pro</option>
                              <option value="ad_credit">Publicité</option>
                              <option value="coupon_credit">Coupons</option>
                            </select>
                            <Input
                              inputMode="numeric"
                              type="number"
                              min="1"
                              value={allocationAmount}
                              onChange={(event) =>
                                setAllocationAmount(event.target.value.replace(/\\D/g, ""))
                              }
                              className="h-9 w-28 text-base sm:text-sm"
                              aria-label="Montant à allouer depuis Omni Wallet"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void allocateWallet()}
                              disabled={allocationBusy}
                            >
                              {allocationBusy ? "Allocation…" : "Allouer"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    }
                  />
                </TabsContent>

                <TabsContent value="apercu" className="mt-5 space-y-4">
                  <div className="omni-atlas-surface pointer-events-auto ml-auto max-w-2xl rounded-[1.6rem] p-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                        Surface seller map-first
                      </p>
                      <h2 className="mt-1 font-display text-2xl font-bold">
                        Vos opérations autour de cette facility
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        La carte reste visible en permanence. Utilisez les onglets ci-dessous pour
                        agir sans perdre votre contexte géospatial.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 rounded-full"
                        onClick={() => setOverviewExpanded((value) => !value)}
                      >
                        {overviewExpanded ? "Réduire les détails" : "Afficher les opérations"}
                      </Button>
                    </div>
                    <div className="mt-4 rounded-2xl border border-border/70 bg-background/55 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{facility.name}</p>
                        <Badge variant={facility.is_online ? "default" : "secondary"}>
                          {facility.is_online ? "En ligne" : "Hors ligne"}
                        </Badge>
                        {facility.emergency_shutdown && (
                          <Badge variant="destructive">Arrêt urgence</Badge>
                        )}
                        <Badge variant="secondary">
                          {STATUS_LABEL[facility.status] ?? facility.status}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {facility.address ?? facility.neighbourhood ?? "Adresse à compléter"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 omni-atlas-surface rounded-[1.6rem] p-4">
                    <DemandPanel
                    demand={data?.demand ?? []}
                    facilityId={facility.id}
                    mode="mission"
                    onLiveCountChange={setLiveDemandCount}
                  />
                  </div>
                  {overviewExpanded && (
                    <>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <button
                          type="button"
                          onClick={() => setActiveTab("demandes")}
                          className="omni-card text-left transition-transform hover:-translate-y-0.5"
                        >
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">
                            À traiter
                          </p>
                          <p className="mt-2 font-display text-2xl font-extrabold">
                            {data?.requests.length ?? 0}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">Demandes reçues</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("produits")}
                          className="omni-card text-left transition-transform hover:-translate-y-0.5"
                        >
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">
                            Stock
                          </p>
                          <p className="mt-2 font-display text-2xl font-extrabold">
                            {products.filter((product) => !product.in_stock).length}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">Produits à confirmer</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("demandes")}
                          className="omni-card text-left transition-transform hover:-translate-y-0.5"
                        >
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">
                            Demande
                          </p>
                          <p className="mt-2 font-display text-2xl font-extrabold">
                            {data?.demand.length ?? 0}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground"> Demandes à traiter</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("coupons")}
                          className="omni-card text-left transition-transform hover:-translate-y-0.5"
                        >
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">
                            Coupons
                          </p>
                          <p className="mt-2 font-display text-2xl font-extrabold text-primary">
                            {data?.coupons.length ?? 0}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {" "}
                            Offres produit à gérer
                          </p>
                        </button>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-4">
                        <div className="omni-card p-5">
                          <p className="text-sm text-muted-foreground">Portefeuille</p>
                          <p className="mt-1 font-display text-2xl font-extrabold text-primary">
                            {formatMoney(data?.walletBalance ?? 0)}
                          </p>
                        </div>
                        <div className="omni-card p-5">
                          <p className="text-sm text-muted-foreground">Produits</p>
                          <p className="mt-1 font-display text-2xl font-extrabold">
                            {products.length}
                          </p>
                        </div>
                        <div className="omni-card p-5">
                          <p className="text-sm text-muted-foreground">Palier</p>
                          <p className="mt-1 font-display text-2xl font-extrabold">
                            {pro ? "Pro" : "Gratuit"}
                          </p>
                          {pro && (
                            <p className="text-xs text-muted-foreground">
                              {daysLeft(subscription?.pro_active_until ?? null)} jour(s) restants
                            </p>
                          )}
                        </div>
                        <div className="omni-card p-5">
                          <p className="text-sm text-muted-foreground">Coupons</p>
                          <p className="mt-1 font-display text-2xl font-extrabold">
                            {data?.counts.coupons ?? 0}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                        <div className="omni-card p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                                Unlocker vendeur
                              </p>
                              <h3 className="mt-1 font-display text-xl font-bold">
                                Crédit Pro de test · 20 USD
                              </h3>
                            </div>
                            <Badge
                              variant={
                                data?.unlock?.status === "eligible" ? "default" : "secondary"
                              }
                            >
                              {data?.unlock?.status === "eligible"
                                ? "Éligible"
                                : data?.unlock?.status === "granted"
                                  ? "Accordé"
                                  : "En progression"}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {data?.unlock?.qualifying_count ?? 0} /{" "}
                            {data?.unlock?.required_count ?? 3} ventes terminées. Le crédit est non
                            monétaire et n’est activé qu’après validation serveur.
                          </p>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                            <div
                              className="h-full rounded-full bg-primary transition-[width]"
                              style={{
                                width: `${Math.min(100, ((data?.unlock?.qualifying_count ?? 0) / Math.max(1, data?.unlock?.required_count ?? 3)) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="omni-card p-5">
                        <p className="font-display text-lg font-bold">Opérations</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Mettez à jour horaires, statut en ligne et arrêt d'urgence. Touchez la
                          carte pour corriger l'emplacement affiché aux acheteurs.
                        </p>
                        <div className="mt-3 space-y-3 rounded-lg border border-border p-3">
                          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                            <Input
                              value={hours}
                              onChange={(e) => setHours(e.target.value)}
                              placeholder="Horaires (ex. Lun-Sam 8h-19h)"
                              aria-label="Horaires d'ouverture"
                            />
                            <Button variant="outline" onClick={() => void saveOperatingHours()}>
                              Enregistrer horaires
                            </Button>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <label className="flex items-center justify-between gap-3 rounded-xl bg-background/55 px-3 py-2 text-sm">
                              <span>
                                <strong className="block">Disponibilité automatique</strong>
                                <span className="text-xs text-muted-foreground">
                                  {facility.manual_open ? "Ouverte aux réponses" : "Réponses suspendues"}
                                </span>
                              </span>
                              <Switch
                                checked={facility.manual_open}
                                onCheckedChange={(v) => void toggleManualOpen(v)}
                              />
                            </label>
                            <div className="rounded-xl bg-background/55 px-3 py-2 text-sm">
                              <div className="flex items-center justify-between gap-3">
                                <span>
                                  <strong className="block">Mode Discovery</strong>
                                  <span className="text-xs text-muted-foreground">
                                    {facility.discovery_mode
                                      ? facility.discovery_until
                                        ? `Actif jusqu'à ${new Date(facility.discovery_until).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
                                        : "Actif"
                                      : "Inactif"}
                                  </span>
                                </span>
                                <Switch
                                  checked={facility.discovery_mode}
                                  onCheckedChange={(v) => void toggleDiscovery(v)}
                                />
                              </div>
                              <div className="mt-2 flex items-center gap-2">
                                <Label htmlFor="vendor-discovery-duration" className="sr-only">
                                  Durée Discovery en minutes
                                </Label>
                                <Input
                                  id="vendor-discovery-duration"
                                  inputMode="numeric"
                                  type="number"
                                  min={15}
                                  max={720}
                                  value={discoveryMinutes}
                                  onChange={(event) => setDiscoveryMinutes(event.target.value.replace(/\\D/g, ""))}
                                  className="h-8 text-sm"
                                  aria-label="Durée Discovery en minutes"
                                />
                                <span className="shrink-0 text-xs text-muted-foreground">minutes</span>
                              </div>
                            </div>
                          </div>
                          <label className="flex items-center gap-2 text-sm">
                            <Switch
                              checked={facility.emergency_shutdown}
                              onCheckedChange={(v) => void toggleEmergencyShutdown(v)}
                            />
                            Arrêt d'urgence : masque immédiatement la facility des opérations en
                            ligne.
                          </label>
                        </div>
                        <div className="mt-3 rounded-lg border border-border bg-secondary/45 p-3 text-sm text-muted-foreground">
                          La carte persistante en arrière-plan est le contexte unique de
                          positionnement. Touchez-la directement pour déplacer la facility.
                        </div>
                        {facility.type === "mobile" && (
                          <Button
                            className="mt-3"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigator.geolocation?.getCurrentPosition(
                                (p) =>
                                  void updatePosition({
                                    lat: p.coords.latitude,
                                    lng: p.coords.longitude,
                                  }),
                                () => toast.error("Position GPS indisponible."),
                              )
                            }
                          >
                            <MapPin className="mr-1.5 h-4 w-4" /> Mettre à jour ma position GPS
                          </Button>
                        )}
                      </div>

                      {OMNI_CONFIG.mediaUiEnabled && <MediaManager facilityId={facility.id} />}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="produits" className="mt-5 space-y-4">
                  <SellerProductForm atProductCap={atProductCap} onSubmit={addProduct} />
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                        Stock
                      </p>
                      <h3 className="mt-1 font-display text-xl font-bold">Produits publiés</h3>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => void confirmEverything()}>
                      Tout confirmer
                    </Button>
                  </div>
                  <ul className="space-y-2">
                    {products.map((p) => (
                      <li
                        key={p.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/80 p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{p.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatMoney(p.price)} · Stock total {p.quantity_available} · Omni visible{" "}
                            {p.quantity_allocated_omni} · {p.status} · {freshnessLabel(p.last_confirmed_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => void confirmProduct(p)}>
                            Confirmer
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            {p.in_stock ? "Disponible" : "En rupture"}
                          </span>
                          <Switch
                            checked={p.in_stock}
                            onCheckedChange={() => void toggleStock(p)}
                          />
                          <Button size="sm" variant="ghost" onClick={() => void removeProduct(p)}>
                            Supprimer
                          </Button>
                        </div>
                      </li>
                    ))}
                    {products.length === 0 && (
                      <p className="text-sm text-muted-foreground">Aucun produit pour l’instant.</p>
                    )}
                  </ul>
                </TabsContent>

                <TabsContent value="demandes" className="mt-5 space-y-8">
                  <DemandPanel
                    demand={data?.demand ?? []}
                    facilityId={facility.id}
                    onLiveCountChange={setLiveDemandCount}
                  />
                  <RequestsPanel
                    facilityId={facility.id}
                    requests={data?.requests ?? []}
                    onRefresh={refreshRequests}
                  />
                </TabsContent>

                <TabsContent value="encaisser" className="mt-5">
                  <CheckoutPanel
                    facilityId={facility.id}
                    {...(transactionId ? { initialTransactionId: transactionId } : {})}
                  />
                </TabsContent>

                <TabsContent value="coupons" className="mt-5">
                  <CouponsPanel
                    facilityId={facility.id}
                    coupons={data?.coupons ?? []}
                    onRefresh={refreshCoupons}
                  />
                </TabsContent>

                <TabsContent value="demande-locale" className="mt-5">
                  <DemandPanel
                    demand={data?.demand ?? []}
                    facilityId={facility.id}
                    showLiveRequests={false}
                  />
                </TabsContent>
              </Tabs>
              <aside className="hidden space-y-3 lg:sticky lg:top-4 lg:block">
                <div className="omni-atlas-surface space-y-3 rounded-[1.4rem] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">À garder sous la main</p>
                  <div className="grid grid-cols-2 gap-2">
                    <OmniStatCard label="Fiches" value={data?.facilities.length ?? 0} />
                    <OmniStatCard label="Produits" value={data?.counts.products ?? 0} />
                    <OmniStatCard label="Demandes" value={data?.counts.requests ?? 0} tone="warning" />
                    <OmniStatCard label="Coupons" value={data?.counts.coupons ?? 0} />
                  </div>
                  <Button className="min-h-11 w-full" onClick={() => setActiveTab("demandes")}>
                    Voir les demandes
                  </Button>
                  <Button variant="outline" className="min-h-11 w-full" onClick={() => setActiveTab("encaisser")}>
                    Ouvrir le scanner
                  </Button>
                </div>
              </aside>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={bonusOpen} onOpenChange={setBonusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>10 000 FCFA offerts 🎉</DialogTitle>
            <DialogDescription>
              Votre fiche est créée. Ce crédit finance vos campagnes de visibilité et vous garde en
              palier Pro pendant 2 mois.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setBonusOpen(false)}>Commencer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OmniMapShell>
  );
}
