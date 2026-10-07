-- Omni V2 — TRUNK-X2 : automatisation vendeur (maquette seller-automation / fraicheur).
--
-- Décision fondateur 2026-10-07 : « construire ». La maquette Pro promet « Disponibilité
-- automatique » et « le badge vieillit : mis à jour par le vendeur OU automatiquement,
-- entité Pro ». Aucun chemin n'écrivait une disponibilité vivante depuis le stock alloué.
--
-- Modèle (contrat omni-trunk-x2-auto-availability-contract-2026-10-07.md) :
--   * la dispo auto DÉRIVE le badge du stock (greatest(allocated - reserved, 0)),
--   * bientot reste MANUEL (un état humain ne se déduit pas du stock),
--   * verifie n'est PAS un état de stock (palier de confiance S-06) — l'auto écrit en_stock,
--   * fenêtre de fraîcheur unique : availability_expires_at = now() + 24h,
--   * garde Pro (D-04) sur l'ENTITLEMENT VIVANT (lieu OU entité, R-4b), pas la colonne plan.
--
-- Additive + idempotente. Aucune ligne réécrite d'un état déjà vivant.

alter table v2_products
  add column if not exists auto_availability boolean not null default false;

comment on column v2_products.auto_availability is
  'TRUNK-X2 : l''offre participe à la disponibilité automatique (Pro). Le badge est dérivé du stock alloué par v2_reconcile_auto_availability().';

create or replace function v2_reconcile_auto_availability()
returns integer
language plpgsql
as $$
declare
  affected integer;
begin
  with desired as (
    select
      p.id,
      p.availability_state as from_state,
      -- capacité réelle = alloué - réservé, plancher 0 (FF-8) ; pièce unique = capacité 1 (R-G).
      case
        when p.uniqueness_kind = 'piece_unique'
          then (case when p.quantity_allocated_omni >= 1 and p.quantity_reserved_omni < 1 then 'en_stock' else 'a_valider' end)
        else (case when (p.quantity_allocated_omni - p.quantity_reserved_omni) > 0 then 'en_stock' else 'a_valider' end)
      end as to_state
    from v2_products p
    left join v2_facilities f on f.id = p.facility_id
    join v2_entities e on e.id = coalesce(p.entity_id, f.entity_id)
    where p.auto_availability = true
      and p.publication_state = 'published'
      -- bientot reste manuel : l'auto ne l'écrase jamais.
      and p.availability_state <> 'bientot'
      -- Pro vivant uniquement (D-04 / R-4b) : lieu OU entité.
      and exists (
        select 1 from v2_facility_entitlements fe
        where fe.entitlement_kind = 'facility_pro'
          and fe.state = 'active'
          and fe.ends_at > now()
          and (fe.facility_id = f.id or (fe.entity_id is not null and fe.entity_id = e.id))
      )
  ),
  changed as (
    update v2_products p
    set availability_state = d.to_state,
        availability_updated_at = now(),
        availability_expires_at = now() + interval '24 hours'
    from desired d
    where p.id = d.id
      and p.availability_state is distinct from d.to_state
    returning p.id, d.from_state, d.to_state
  )
  insert into v2_product_stock_events (product_id, from_state, to_state, source, reason)
  select id, from_state, to_state, 'auto', 'auto_from_stock' from changed;

  get diagnostics affected = row_count;
  return affected;
end;
$$;

comment on function v2_reconcile_auto_availability is
  'TRUNK-X2/D-04 : dérive en_stock/a_valider depuis le stock alloué pour les offres auto_availability d''un Pro vivant. N''écrase jamais bientot (manuel).';
