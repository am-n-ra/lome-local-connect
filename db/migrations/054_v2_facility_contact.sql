-- Omni V2 seller contact (RAC-1 — audit cycle V1 2026-09-14).
-- Founder requirement: "si on génère une intention d'achat, l'acheteur a accès au
-- contact et à l'itinéraire vers le vendeur ; avant intention le contact est masqué".
-- Le contact vendeur est une donnée de facilité, exposée UNIQUEMENT dans le contexte
-- d'une transaction (après intention) — jamais sur la fiche publique.
-- Additive + idempotent (if not exists / guarded ALTER).

alter table v2_facilities
  add column if not exists contact_phone text
    check (contact_phone is null or (char_length(btrim(contact_phone)) between 5 and 40));

alter table v2_facilities
  add column if not exists contact_whatsapp text
    check (contact_whatsapp is null or (char_length(btrim(contact_whatsapp)) between 5 and 40));

comment on column v2_facilities.contact_phone is
  'Numéro de téléphone du vendeur (voir RAC-1). Exposé seulement dans le contexte transactionnel (après intention d''achat).';
comment on column v2_facilities.contact_whatsapp is
  'WhatsApp du vendeur (voir RAC-1). Exposé seulement dans le contexte transactionnel (après intention d''achat).';