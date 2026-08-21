import { useState } from "react";
import { Check, CircleAlert, Loader2, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@/lib/useServerFn";
import { formatDateFr } from "@/lib/omni";
import { createCoupon, deleteCoupon, type VendorCoupon } from "@/lib/vendor.functions";

type Props = {
  facilityId: string;
  coupons: VendorCoupon[];
  onRefresh: () => void | Promise<void>;
};

export function CleanCouponPanel({ facilityId, coupons, onRefresh }: Props) {
  const create = useServerFn(createCoupon);
  const remove = useServerFn(deleteCoupon);
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [percent, setPercent] = useState("10");
  const [busy, setBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState<string | null>(null);

  async function submit() {
    const normalizedCode = code.trim().toUpperCase().slice(0, 24);
    const value = Number(percent);
    if (normalizedCode.length < 3 || !Number.isFinite(value) || value < 1 || value > 90) {
      toast.error("Le code doit contenir 3 caractères minimum et la remise doit être comprise entre 1 et 90 %.");
      return;
    }
    setBusy(true);
    try {
      await create({ data: { facilityId, code: normalizedCode, description: description.trim().slice(0, 140) || undefined, discountPercent: Math.round(value) } });
      await onRefresh();
      setCode("");
      setDescription("");
      setPercent("10");
      toast.success("Coupon créé.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Création impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function drop(couponId: string) {
    setDeleteBusy(couponId);
    try {
      await remove({ data: { facilityId, couponId } });
      await onRefresh();
      toast.success("Coupon supprimé.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Suppression impossible.");
    } finally {
      setDeleteBusy(null);
    }
  }

  return (
    <div className="space-y-5" data-omni-clean-coupons>
      <header className="rounded-[1.5rem] bg-[var(--omni-paper)] p-5">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--omni-orange-deep)]">Coupons</p>
        <h2 className="mt-1 font-display text-2xl font-extrabold tracking-[-0.04em]">Créer une offre claire</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--omni-ink-muted)]">Le coupon peut être appliqué par Omni pendant une intention d’achat. L’acheteur verra l’économie réelle avant de choisir.</p>
      </header>

      <form className="space-y-4 rounded-[1.5rem] border border-black/5 bg-white/75 p-5 shadow-[var(--omni-shadow-card)]" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
        <div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--omni-orange-wash)] text-[var(--omni-orange-deep)]"><Tag className="h-5 w-5" /></div><div><h3 className="font-display text-lg font-extrabold">Une remise par coupon</h3><p className="mt-1 text-sm text-[var(--omni-ink-muted)]">Le code est géré côté serveur et ne garantit jamais une remise qui n’existe pas.</p></div></div>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
          <label className="space-y-1.5"><span className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--omni-ink-muted)]">Code</span><input className="omni-clean-field text-base uppercase" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="Ex. BIENVENUE" maxLength={24} required /></label>
          <label className="space-y-1.5"><span className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--omni-ink-muted)]">Remise</span><input className="omni-clean-field text-base" type="number" inputMode="numeric" min={1} max={90} value={percent} onChange={(event) => setPercent(event.target.value.replace(/\D/g, ""))} aria-label="Pourcentage de remise" required /></label>
        </div>
        <label className="block space-y-1.5"><span className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--omni-ink-muted)]">Description facultative</span><input className="omni-clean-field text-base" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ex. Offre de bienvenue" maxLength={140} /></label>
        {code.trim() ? <div className="flex items-start gap-2 rounded-2xl bg-[var(--omni-orange-wash)] p-3 text-sm font-bold text-[var(--omni-orange-deep)]"><Check className="mt-0.5 h-4 w-4 shrink-0" /><span>Aperçu buyer : {code.trim().toUpperCase()} · économie de {percent || "0"} %</span></div> : null}
        <button type="submit" disabled={busy} className="omni-clean-primary-button min-h-12 w-full">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}{busy ? "Création…" : "Créer le coupon"}</button>
      </form>

      <section className="space-y-3" aria-labelledby="clean-coupon-list-title"><div><h3 id="clean-coupon-list-title" className="font-display text-lg font-extrabold">Coupons actifs</h3><p className="text-xs font-semibold text-[var(--omni-ink-muted)]">Chaque utilisation est liée au parcours transactionnel.</p></div>{coupons.length === 0 ? <div className="rounded-2xl border border-dashed border-black/10 bg-white/55 p-6 text-center"><CircleAlert className="mx-auto h-6 w-6 text-[var(--omni-ink-muted)]" /><p className="mt-2 font-extrabold">Aucun coupon</p><p className="mt-1 text-sm text-[var(--omni-ink-muted)]">Créez votre première remise au-dessus.</p></div> : <ul className="space-y-2">{coupons.map((coupon) => <li key={coupon.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white/75 p-4"><div className="min-w-0"><p className="font-mono font-extrabold tracking-[0.12em]">{coupon.code}</p><p className="mt-1 text-sm text-[var(--omni-ink-muted)]">−{coupon.discount_percent}% · {coupon.description ?? "Sans description"}</p><p className="mt-1 text-xs font-semibold text-[var(--omni-ink-muted)]">{formatDateFr(coupon.created_at)} · {coupon.redemption_count} utilisation(s)</p></div><button type="button" disabled={deleteBusy === coupon.id} onClick={() => void drop(coupon.id)} className="omni-clean-secondary-button min-h-11 text-[var(--omni-danger)]">{deleteBusy === coupon.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}Supprimer</button></li>)}</ul>}</section>
    </div>
  );
}
