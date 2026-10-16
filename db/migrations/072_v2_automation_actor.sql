-- Omni V2 — NR-9 : la réponse automatique au nom de l'entité (Species §95/§113, Root §6.3/§7).
--
-- Décision fondateur 2026-10-15 (« go ») : construire l'acteur `automation`.
--
-- LE DÉFAUT DE RACINE QUE CETTE MIGRATION FERME.
-- Root §6.3 décrit `availability_responses` comme « request, seller/automation actor, … »,
-- mais la table n'avait AUCUNE colonne d'acteur : seul `responder_account_id` (nullable).
-- Le NULL n'était jamais interprété. Conséquence mesurée : l'interface ne POUVAIT PAS lire
-- l'origine d'une réponse, donc elle l'a INVENTÉE — le mensonge `(source : auto)` corrigé par
-- NR-7. Un modèle Root non implémenté force l'interface à mentir.
--
-- CE QUE LA COLONNE EST, ET CE QU'ELLE N'EST PAS.
-- `actor_kind` est DÉCLARÉE par le producteur (une réponse automatique dit qu'elle l'est), et
-- non déduite de la nullité de `responder_account_id`. La nullité reste une garde en profondeur
-- (C9) ; la déduction seule ferait d'un futur compte vendeur supprimé (`on delete set null`)
-- une fausse automatisation. On ne déduit pas un acteur d'une absence.
--
-- Règles C1–C10 (contrat omni-nr9-auto-response-contract-2026-10-15.md) que le SCHÉMA tient :
--   * C4/C9 : une réponse `automation` porte `quantity_available` ET un acteur — jamais partielle,
--     jamais muette ;
--   * C9    : `automation` ⇒ `responder_account_id IS NULL` (jamais un compte humain) ;
--   * C10   : l'automate répond au nom de l'ENTITÉ ; il n'écrit jamais une proposition de prix.
-- Ces trois règles sont des CHECK : elles refusent l'écriture incohérente, elles ne la commentent pas.
--
-- Additive + idempotente. Aucune ligne réécrite : les réponses existantes (toutes humaines)
-- prennent le défaut `seller`, ce qui est exactement ce qu'elles sont.

alter table v2_availability_responses
  add column if not exists actor_kind text not null default 'seller';

comment on column v2_availability_responses.actor_kind is
  'NR-9/Root §6.3 : qui a produit la réponse — seller (humain) ou automation (au nom de l''entité, Species §95). Déclarée par le producteur, jamais déduite de responder_account_id.';

-- Garde en profondeur C9 : l'automate n'est pas un compte. Une réponse `automation` avec un
-- compte répondant serait une contradiction (qui a répondu : un humain ou la machine ?).
-- Une réponse `seller` sans compte reste POSSIBLE : c'est le compte supprimé (`on delete set null`),
-- un fait historique qu'on n'a pas le droit de réécrire en « automatique ».
alter table v2_availability_responses
  drop constraint if exists v2_availability_responses_actor_kind_check;

alter table v2_availability_responses
  add constraint v2_availability_responses_actor_kind_check
  check (
    actor_kind in ('seller', 'automation')
    and (actor_kind <> 'automation' or responder_account_id is null)
  );

-- C4/C9 : une réponse automatique dit toujours combien. « Quantité insuffisante ⇒ EXCLUE,
-- jamais partielle » (Species §113) : l'automate ne répond pas, ou il répond avec un nombre.
-- Une quantité NULL dans une réponse `automation` serait un « disponible » creux — le mensonge
-- que Species interdit explicitement.
alter table v2_availability_responses
  drop constraint if exists v2_availability_responses_automation_quantity_check;

alter table v2_availability_responses
  add constraint v2_availability_responses_automation_quantity_check
  check (actor_kind <> 'automation' or quantity_available is not null);

-- Idempotence de l'automate : une demande ne reçoit qu'UNE réponse automatique. Le chemin vendeur
-- garde son index d'origine (005, sur `responder_account_id`), qui ne peut pas couvrir l'automate
-- (compte NULL — or NULL n'est jamais égal à NULL dans un index unique : deux réponses auto
-- passeraient). On indexe donc sur la demande.
create unique index if not exists v2_availability_responses_one_automation_idx
  on v2_availability_responses(request_id)
  where actor_kind = 'automation';

-- Lecture de l'origine par la surface acheteur (NR-7 lit déjà `responder_kind`) : la dérivation
-- doit rester EXACTE maintenant que l'automate existe. On ne réécrit aucune requête ici ; on
-- documente le contrat pour que le prochain lecteur ne le redécouvre pas à l'envers.
comment on table v2_availability_responses is
  'Root §6.3 : request, seller/automation actor, status, quantity, price/offer snapshot, freshness, correction metadata and audit linkage. L''acteur est PORTÉ par actor_kind (NR-9) : une réponse automation a responder_account_id NULL et une quantité non nulle.';
