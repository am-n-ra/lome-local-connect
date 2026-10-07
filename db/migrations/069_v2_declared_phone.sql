-- Omni V2 — HEARTWOOD S3-a : numéro DÉCLARÉ (S-16, décision S3-0 = A + B).
--
-- Contrat : docs/nature-way/omni-heartwood-s3-phone-free-contract-2026-10-07.md.
-- Fait central : une vérification de numéro GRATUITE ne peut pas *prouver* le contrôle
-- du numéro (WhatsApp Business API et SMS sont payants ; un deep link wa.me initié par
-- l'utilisateur ne renvoie rien à Omni). On assume donc une CONFIANCE DÉCLARÉE HONNÊTE :
-- le numéro est stocké et étiqueté « Déclaré · non confirmé », jamais « vérifié ».
--
-- L'inscription reste e-mail-first (Neon Auth OTP, gratuit). Ce champ n'est PAS une preuve
-- d'identité : c'est un contact déclaré, comme le contact vendeur (RAC-1).
--
-- Additive + idempotente. Aucune ligne réécrite.

alter table v2_accounts
  add column if not exists phone_declared text;

alter table v2_accounts
  add column if not exists phone_declared_at timestamptz;

-- Format Togo : +228 puis 8 chiffres, ou NULL. On refuse toute autre forme — un numéro
-- mal saisi n'est pas un contact, c'est un mensonge dormant.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'v2_accounts_phone_declared_format'
  ) then
    alter table v2_accounts
      add constraint v2_accounts_phone_declared_format
      check (phone_declared is null or phone_declared ~ '^\+228[0-9]{8}$');
  end if;
end $$;

comment on column v2_accounts.phone_declared is
  'S3-a : numéro déclaré par l''utilisateur (+228XXXXXXXX). DÉCLARÉ, jamais vérifié — aucune preuve de contrôle.';
comment on column v2_accounts.phone_declared_at is
  'S3-a : horodatage de la déclaration du numéro (traçabilité honnête, pas une vérification).';
