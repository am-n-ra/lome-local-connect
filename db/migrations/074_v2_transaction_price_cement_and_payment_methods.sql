-- 074_v2_transaction_price_cement_and_payment_methods.sql
--
-- Deux manques mesurés le 2026-10-16, tous deux « argent » (contrat avant code) :
--
-- 1. LE PRIX REMISÉ N'ÉTAIT NI AFFICHÉ NI FIGÉ (point 4 fondateur).
--    La Room affichait `net_amount_minor` BRUT sans /100 et SANS la remise Omni : le
--    snapshot portait `unit_price_minor` = prix que le vendeur a tapé, alors que la remise
--    vit sur l'OFFRE (`v2_products.discount_kind`/`discount_value`). Résultat : l'acheteur
--    voyait un montant faux, et la remise (l'avantage Omni, S-19) disparaissait du tunnel.
--
--    Décision fondateur 2026-10-16 (option B) : la remise est ANNONCÉE avant (fiche, file,
--    flux), GELÉE à l'intention (le snapshot est écrit une fois, et il est APPEND-ONLY —
--    plus rien ne peut le changer), puis CIMENTÉE au sens « irrévocable par le geste du
--    vendeur » quand il valide via Omni (`qr_ready -> qr_verified`, scan physique en
--    retrait OU clic dashboard en livraison). Le gel se produit à l'INTENTION, pas à la
--    validation : `transitionTransaction` ne touche jamais aux prix. On ajoute donc au
--    snapshot la trace de ce qui a été gelé :
--      * `list_price_minor`  — le prix AFFICHÉ de l'offre (avant remise), tel que l'acheteur
--                              l'a vu au moment de l'intention. Jamais recalculé après coup :
--                              si le vendeur change sa remise plus tard, la transaction garde
--                              la sienne (une transaction est une version gelée, S-26).
--      * `discount_minor`    — la remise Omni réellement appliquée, en unités mineures.
--
--    `unit_price_minor` reste le prix RÉELLEMENT DÛ (après remise) — aucun sens existant
--    n'est réécrit, on AJOUTE la trace de l'origine et de la remise. Additive, idempotente.
--
--    ⚠️ PAS de colonne « ciment » : `v2_transaction_snapshots` est APPEND-ONLY — une telle
--    colonne ne pourrait jamais être écrite. Le ciment a déjà sa source : l'événement
--    `qr_verified` de `v2_transaction_events`. On le DÉRIVE, on ne le stocke pas.
--
-- 2. LE VENDEUR NE POUVAIT PAS DÉCLARER SES MOYENS DE PAIEMENT (point 6 fondateur).
--    La Room affichait deux boutons figés (« Payer Mobile Money », « Payer cash ») : le
--    vendeur n'avait AUCUN endroit pour dire ce qu'il accepte, et l'acheteur ne choisissait
--    rien — il subissait. On ajoute `v2_facilities.accepted_payment_methods` (tableau de
--    textes, valeurs contraintes aux moyens connus). NULL = non déclaré : l'acheteur voit
--    alors les deux moyens (repli honnête), jamais un mensonge sur ce qui est accepté.

-- ---------------------------------------------------------------------------
-- 1. Trace de prix cimentée sur le snapshot de transaction.
-- ---------------------------------------------------------------------------
alter table public.v2_transaction_snapshots
  add column if not exists list_price_minor integer;

alter table public.v2_transaction_snapshots
  add column if not exists discount_minor integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'v2_transaction_snapshots_price_guard'
  ) then
    alter table public.v2_transaction_snapshots
      add constraint v2_transaction_snapshots_price_guard
      check (
        (list_price_minor is null or list_price_minor >= 0)
        and discount_minor >= 0
        and (list_price_minor is null or discount_minor <= list_price_minor)
      );
  end if;
end $$;

comment on column public.v2_transaction_snapshots.list_price_minor is
  'Prix affiché de l''offre (avant remise Omni) au moment de l''intention. Gelé : jamais recalculé après coup.';
comment on column public.v2_transaction_snapshots.discount_minor is
  'Remise Omni réellement appliquée (unités mineures). 0 = aucune remise.';

-- ---------------------------------------------------------------------------
-- 2. Moyens de paiement acceptés, déclarés par le vendeur au niveau du LIEU.
--    Le lieu dit OÙ l'on paie ; l'entité dit QUI vend (S-25). Le paiement se fait
--    au point de remise : la déclaration vit donc sur la facilité.
-- ---------------------------------------------------------------------------
alter table public.v2_facilities
  add column if not exists accepted_payment_methods text[];

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'v2_facilities_payment_methods_guard'
  ) then
    alter table public.v2_facilities
      add constraint v2_facilities_payment_methods_guard
      check (
        accepted_payment_methods is null
        or (
          coalesce(array_length(accepted_payment_methods, 1), 0) between 1 and 2
          and accepted_payment_methods <@ array['cash', 'mobile_money']::text[]
        )
      );
  end if;
end $$;

comment on column public.v2_facilities.accepted_payment_methods is
  'Moyens de paiement acceptés au point de remise (cash, mobile_money). NULL = non déclaré : l''acheteur voit les deux (repli honnête).';
