import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import {
  getAdminStats,
  listAdminFacilities,
  listNeighbourhoods,
  markContacted,
  setFacilityStatus,
  updateAdminFacility,
  type AdminFacilityRow,
  type AdminStats,
} from "@/lib/admin.functions";
import { getProductFunnelSummary, type ProductFunnelSummary } from "@/lib/analytics.functions";
import { OpsPanel } from "@/components/omni/admin/OpsPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { CATEGORIES, categoryLabel, STATUS_LABEL } from "@/lib/omni";
import { OMNI_CONFIG } from "@/lib/omni.config";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Console acquisition — OmniView Lomé" },
      {
        name: "description",
        content:
          "Console interne OmniView : moderation des commerces, suivi des contacts de l'équipe acquisition et journal d'audit.",
      },
      { property: "og:title", content: "Console acquisition — OmniView" },
      {
        property: "og:description",
        content: "Moderation des commerces et suivi acquisition pour le marché de Lomé.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const OUTCOMES = [
  { value: "interesse", label: "Intéressé" },
  { value: "rappeler", label: "À rappeler" },
  { value: "refus", label: "Refus" },
  { value: "injoignable", label: "Injoignable" },
] as const;

const STATUSES = ["all", "unclaimed", "unconfirmed", "certified", "confirmed"] as const;

function AdminPage() {
  const { user, loading, isStaff, isAdmin } = useAuth();
  const [denied, setDenied] = useState(false);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [funnel, setFunnel] = useState<ProductFunnelSummary[]>([]);
  const [rows, setRows] = useState<AdminFacilityRow[]>([]);
  const [hoods, setHoods] = useState<{ neighbourhood: string; count: number }[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("unclaimed");
  const [category, setCategory] = useState("all");
  const [hood, setHood] = useState("");
  const [contacted, setContacted] = useState<"any" | "yes" | "no">("any");
  const [openId, setOpenId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const fetchStats = useServerFn(getAdminStats);
  const fetchFunnel = useServerFn(getProductFunnelSummary);
  const fetchRows = useServerFn(listAdminFacilities);
  const fetchHoods = useServerFn(listNeighbourhoods);
  const contactFn = useServerFn(markContacted);
  const statusFn = useServerFn(setFacilityStatus);
  const editFn = useServerFn(updateAdminFacility);

  const reload = useCallback(async () => {
    try {
      const [s, list, funnelRows] = await Promise.all([
        fetchStats(),
        fetchRows({
          data: {
            search: search.trim() || undefined,
            status,
            category,
            neighbourhood: hood || undefined,
            contacted,
          },
        }),
        fetchFunnel(),
      ]);
      setStats(s);
      setRows(list);
      setFunnel(funnelRows);
      setDenied(false);
    } catch {
      setDenied(true);
    }
  }, [fetchStats, fetchRows, fetchFunnel, search, status, category, hood, contacted]);

  useEffect(() => {
    if (!user || !isStaff) return;
    const t = window.setTimeout(() => void reload(), 250);
    return () => window.clearTimeout(t);
  }, [user, isStaff, reload]);

  useEffect(() => {
    if (!user || !isStaff) return;
    void (async () => {
      try {
        setHoods(await fetchHoods());
      } catch {
        setHoods([]);
      }
    })();
  }, [user, isStaff, fetchHoods]);

  const openRow = useMemo(() => rows.find((r) => r.id === openId) ?? null, [rows, openId]);

  async function act(fn: () => Promise<unknown>, message: string) {
    setBusy(true);
    try {
      await fn();
      toast.success(message);
      await reload();
    } catch {
      toast.error("Action impossible.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return null;

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto max-w-2xl p-6">
          <h1 className="font-display text-2xl font-bold">Console interne</h1>
          <p className="mt-2 text-muted-foreground">Connectez-vous avec un compte de l'équipe.</p>
        </main>
      </div>
    );
  }

  if (denied || !isStaff) {
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto max-w-2xl p-6">
          <h1 className="font-display text-2xl font-bold">Accès réservé</h1>
          <p className="mt-2 text-muted-foreground">
            Ce compte n'a pas de rôle interne (admin, modérateur ou acquisition).
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-6xl space-y-6 p-4 pb-24">
        <header>
          <h1 className="font-display text-2xl font-bold">Console acquisition</h1>
          <p className="text-sm text-muted-foreground">
            Commerces pré-listés depuis OpenStreetMap, à contacter puis onboarder.
          </p>
        </header>

        {isAdmin && (
          <section className="omni-card space-y-3 p-4">
            <div>
              <h2 className="font-display text-lg font-bold">Feature flags globales</h2>
              <p className="text-xs text-muted-foreground">
                Visibles uniquement aux administrateurs Neon Auth. Les changements de production
                passent par la configuration contrôlée et restent désactivés par défaut.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                ["Automatisation IA", OMNI_CONFIG.aiAutomationEnabled],
                ["Agent acheteur", OMNI_CONFIG.buyerAgentEnabled],
                ["Agent vendeur", OMNI_CONFIG.sellerAgentEnabled],
                ["Interface média", OMNI_CONFIG.mediaUiEnabled],
              ].map(([label, enabled]) => (
                <div
                  key={String(label)}
                  className="flex items-center justify-between rounded-xl border border-border bg-background/70 px-3 py-2"
                >
                  <span className="text-sm font-medium">{String(label)}</span>
                  <Badge variant={enabled ? "default" : "secondary"}>
                    {enabled ? "Activé" : "Désactivé"}
                  </Badge>
                </div>
              ))}
            </div>
          </section>
        )}

        {stats && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["Total", stats.total],
              ["Non réclamés", stats.unclaimed],
              ["Non confirmés", stats.unconfirmed],
              ["Vérifiés", stats.certified],
              ["Confirmés", stats.confirmed],
              ["Contactés", stats.contacted],
              ["Produits", stats.products],
              ["Campagnes actives", stats.campaigns_active],
            ].map(([label, value]) => (
              <div key={String(label)} className="omni-card p-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-display text-xl font-bold">{value}</p>
              </div>
            ))}
          </div>
        )}

        <section className="omni-card space-y-3 p-4">
          <div>
            <h2 className="font-display text-lg font-bold">Funnel produit — 30 derniers jours</h2>
            <p className="text-xs text-muted-foreground">
              Données minimisées, réservées à l’équipe staff.
            </p>
          </div>
          {funnel.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun événement consenti pour cette période.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {funnel.map((row) => (
                <div
                  key={row.event_name}
                  className="rounded-xl border border-border bg-background/60 p-3"
                >
                  <p className="truncate text-xs font-semibold text-muted-foreground">
                    {row.event_name}
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold">{row.event_count}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {row.unique_users} utilisateur(s)
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="omni-card grid gap-3 p-3 md:grid-cols-5">
          <Input
            placeholder="Nom, adresse, téléphone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "Tous les statuts" : (STATUS_LABEL[s] ?? s)}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">Toutes catégories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={hood}
            onChange={(e) => setHood(e.target.value)}
          >
            <option value="">Tous les quartiers</option>
            {hoods.map((h) => (
              <option key={h.neighbourhood} value={h.neighbourhood}>
                {h.neighbourhood} ({h.count})
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={contacted}
            onChange={(e) => setContacted(e.target.value as "any" | "yes" | "no")}
          >
            <option value="any">Contact : tous</option>
            <option value="no">Jamais contactés</option>
            <option value="yes">Déjà contactés</option>
          </select>
        </div>

        <div className="space-y-2">
          {rows.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun commerce pour ces filtres.</p>
          )}
          {rows.map((row) => (
            <div key={row.id} className="omni-card p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{row.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {categoryLabel(row.category)}
                    {row.neighbourhood ? ` · ${row.neighbourhood}` : ""}
                    {row.address ? ` · ${row.address}` : ""}
                    {row.phone ? ` · ${row.phone}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{STATUS_LABEL[row.status] ?? row.status}</Badge>
                  <Badge variant="secondary">{row.source}</Badge>
                  {row.contacted_at && (
                    <Badge className="bg-forest/10 text-forest">
                      {OUTCOMES.find((o) => o.value === row.contact_outcome)?.label ?? "Contacté"}
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setOpenId(openId === row.id ? null : row.id);
                      setNotes(row.contact_notes ?? "");
                    }}
                  >
                    {openId === row.id ? "Fermer" : "Traiter"}
                  </Button>
                </div>
              </div>

              {openId === row.id && openRow && (
                <div className="mt-3 space-y-3 border-t border-border pt-3">
                  <div className="grid gap-2 md:grid-cols-3">
                    <Input
                      defaultValue={openRow.name}
                      onBlur={(e) =>
                        void act(
                          () =>
                            editFn({
                              data: {
                                facilityId: openRow.id,
                                name: e.target.value,
                                category: openRow.category,
                                neighbourhood: openRow.neighbourhood,
                                address: openRow.address,
                                phone: openRow.phone,
                              },
                            }),
                          "Fiche mise à jour",
                        )
                      }
                    />
                    <Input
                      placeholder="Quartier"
                      defaultValue={openRow.neighbourhood ?? ""}
                      onBlur={(e) =>
                        void act(
                          () =>
                            editFn({
                              data: {
                                facilityId: openRow.id,
                                name: openRow.name,
                                category: openRow.category,
                                neighbourhood: e.target.value,
                                address: openRow.address,
                                phone: openRow.phone,
                              },
                            }),
                          "Fiche mise à jour",
                        )
                      }
                    />
                    <Input
                      placeholder="Téléphone"
                      defaultValue={openRow.phone ?? ""}
                      onBlur={(e) =>
                        void act(
                          () =>
                            editFn({
                              data: {
                                facilityId: openRow.id,
                                name: openRow.name,
                                category: openRow.category,
                                neighbourhood: openRow.neighbourhood,
                                address: openRow.address,
                                phone: e.target.value,
                              },
                            }),
                          "Fiche mise à jour",
                        )
                      }
                    />
                  </div>

                  <Textarea
                    placeholder="Notes de contact"
                    value={notes}
                    maxLength={500}
                    onChange={(e) => setNotes(e.target.value)}
                  />

                  <div className="flex flex-wrap gap-2">
                    {OUTCOMES.map((o) => (
                      <Button
                        key={o.value}
                        size="sm"
                        variant="secondary"
                        disabled={busy}
                        onClick={() =>
                          void act(
                            () =>
                              contactFn({
                                data: { facilityId: openRow.id, outcome: o.value, notes },
                              }),
                            `Contact enregistré : ${o.label}`,
                          )
                        }
                      >
                        {o.label}
                      </Button>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={busy || openRow.status === "certified"}
                      onClick={() =>
                        void act(
                          () => statusFn({ data: { facilityId: openRow.id, status: "certified" } }),
                          "Commerce vérifié",
                        )
                      }
                    >
                      Marquer vérifié
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy || openRow.status === "unconfirmed"}
                      onClick={() =>
                        void act(
                          () =>
                            statusFn({ data: { facilityId: openRow.id, status: "unconfirmed" } }),
                          "Statut mis à jour",
                        )
                      }
                    >
                      Remettre en non confirmé
                    </Button>
                    <a
                      className="text-sm text-primary underline"
                      href={`/carte?facility=${openRow.id}`}
                    >
                      Voir sur la carte
                    </a>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    « Confirmé » est mérité automatiquement après 3 transactions QR de clients
                    distincts — jamais attribué à la main.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <OpsPanel />
      </main>
    </div>
  );
}
