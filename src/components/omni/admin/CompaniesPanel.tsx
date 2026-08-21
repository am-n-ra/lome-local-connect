import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, Building2, RefreshCw } from "lucide-react";

import { useServerFn } from "@/lib/useServerFn";
import { listAdminCompanies, setCompanyStatus, type AdminCompanyRow } from "@/lib/admin.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CompanyStatus = "unverified" | "pending" | "certified" | "rejected";

const FILTERS: Array<{ value: "all" | CompanyStatus; label: string }> = [
  { value: "pending", label: "À certifier" },
  { value: "unverified", label: "Non vérifiées" },
  { value: "certified", label: "Certifiées" },
  { value: "rejected", label: "Rejetées" },
  { value: "all", label: "Toutes" },
];

const STATUS_LABEL: Record<string, string> = {
  unverified: "Non vérifiée",
  pending: "En attente",
  certified: "Certifiée",
  rejected: "Rejetée",
};

export function CompaniesPanel() {
  const fetchCompanies = useServerFn(listAdminCompanies);
  const updateStatus = useServerFn(setCompanyStatus);
  const [rows, setRows] = useState<AdminCompanyRow[]>([]);
  const [status, setStatus] = useState<"all" | CompanyStatus>("pending");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      setRows(
        await fetchCompanies({
          data: { status, ...(search.trim() ? { search: search.trim() } : {}) },
        }),
      );
    } catch {
      setRows([]);
    }
  }, [fetchCompanies, search, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void reload(), 250);
    return () => window.clearTimeout(timer);
  }, [reload]);

  async function apply(companyId: string, next: CompanyStatus) {
    setBusy(true);
    try {
      await updateStatus({ data: { companyId, status: next } });
      toast.success(
        next === "certified"
          ? "Compagnie certifiée — ses facilités héritent du badge."
          : "Statut de la compagnie mis à jour.",
      );
      await reload();
    } catch {
      toast.error("Mise à jour impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="omni-card space-y-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <Building2 className="h-4 w-4 text-primary" aria-hidden="true" />
            Certification par compagnie
          </h2>
          <p className="text-xs text-muted-foreground">
            La confiance se décide au niveau de la compagnie. Certifier promeut toutes ses facilités
            revendiquées au niveau « certifiée ».
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void reload()}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Actualiser
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((filter) => (
          <Button
            key={filter.value}
            type="button"
            size="sm"
            variant={status === filter.value ? "default" : "outline"}
            onClick={() => setStatus(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher une compagnie…"
          className="h-9 w-full sm:w-64"
          aria-label="Rechercher une compagnie"
        />
      </div>

      <div className="space-y-2">
        {rows.map((row) => (
          <article
            key={row.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background/70 p-3"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-semibold">{row.name}</p>
                <Badge variant={row.status === "certified" ? "default" : "secondary"}>
                  {STATUS_LABEL[row.status] ?? row.status}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {row.owner_name ?? "Propriétaire inconnu"} · {row.facilities_count} facilité
                {row.facilities_count > 1 ? "s" : ""} · {row.certified_count} certifiée
                {row.certified_count > 1 ? "s" : ""}
                {row.country_code ? ` · ${row.country_code}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                disabled={busy || row.status === "certified"}
                onClick={() => void apply(row.id, "certified")}
              >
                <BadgeCheck className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                Certifier
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy || row.status === "pending"}
                onClick={() => void apply(row.id, "pending")}
              >
                En attente
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy || row.status === "rejected"}
                onClick={() => void apply(row.id, "rejected")}
              >
                Rejeter
              </Button>
            </div>
          </article>
        ))}
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            Aucune compagnie pour ce filtre.
          </p>
        ) : null}
      </div>
    </section>
  );
}
