-- Omni V2 — RT-D1 : budget d'itinéraires par acheteur.
-- Décision fondateur (2026-09-17) : « seul ceux avec réel intent peuvent user de
-- itinéraire, ça réduit nos coûts ». L'intention est appliquée ailleurs ; ici on
-- borne la dépense réelle.
--
-- Pourquoi la base et pas une mémoire locale : la route est servie par une
-- fonction serverless. Chaque instance a son propre compteur, donc une limite en
-- mémoire se contourne en parallélisant. Un seul état partagé existe déjà dans
-- l'architecture — la base Neon — et elle est déjà facturée, donc la réutiliser
-- n'ajoute pas de fournisseur.
--
-- Clé = `auth_user_id` (le `sub` du JWT), pas `v2_accounts.id` : un acheteur peut
-- demander un itinéraire avant que sa ligne compte n'existe, et une clé étrangère
-- transformerait alors un itinéraire qui marchait en erreur 500. Un identifiant
-- d'authentification opaque suffit à compter, et n'exige aucune jointure.
--
-- La table ne contient QUE (identifiant d'authentification, horodatage) : aucun
-- itinéraire, aucune coordonnée, aucun nom de lieu. Elle s'efface d'elle-même.
-- Additive + idempotente.

create table if not exists v2_route_requests (
  id uuid primary key default gen_random_uuid(),
  auth_user_id text not null,
  occurred_at timestamptz not null default now()
);

comment on table v2_route_requests is
  'Journal de consommation d''itinéraires par utilisateur authentifié (RT-D1). Borne la dépense du fournisseur de routage facturé à la requête. Ne contient aucune donnée de trajet : uniquement (identifiant d''authentification, horodatage).';

-- Les deux seules lectures sont « ce compte a-t-il dépassé l'heure / le jour ».
create index if not exists v2_route_requests_user_time_idx
  on v2_route_requests (auth_user_id, occurred_at desc);