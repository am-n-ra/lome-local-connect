# Omni — Contrat de suppression de compte (BRANCHES-DELETE)

Date : 2026-10-07 · Porte : `HEARTWOOD_CLOSED_BRANCHES_OPEN` · Branche : `omni-v2-rebuild`

## Décision (Option A, fondateur 2026-10-07)

**On n'efface PAS les transactions. On détache l'identité.**

La suppression d'un compte est une opération en deux natures :

1. **Détachement (immédiat, réel)** — les lieux créés/revendiqués par le compte redeviennent
   « Non revendiquée » (niveau 0, `S-05`), les offres sont dépubliées, le contact est effacé,
   l'entité est déliée. L'utilisateur cesse d'exister comme offreur.
2. **Rétention (légale)** — la ligne `v2_accounts` et les transactions passées **restent**,
   rattachées à un compte **anonymisé** (`deleted_at` non nul, téléphone effacé). La loi
   togolaise n° 2019-014 (protection des données à caractère personnel) et les obligations
   comptables imposent de conserver l'historique de transaction. Effacer la ligne casserait
   des FK `RESTRICT` (`v2_transaction_members`) et **détruirait une preuve d'achat**.

Ce n'est donc **pas** un `DELETE` : c'est une **anonymisation + détachement**.

## Ce qui est fait, exactement

Dans **une seule instruction gardée** (`repository.deleteAccount`) :

| CTE | Effet |
|---|---|
| `open_txn` | Compte les transactions **non terminales** (état courant ∉ `closed`/`expired`) |
| `gate` | `select 1 where open_txn = 0` — **le refus est un gate**, pas un filtre final |
| `archived` | `v2_products.publication_state = 'archived'` pour les offres des lieux du compte |
| `detached` | `v2_facilities` : `account_id = null`, `entity_id = null`, `trust_state = 'unclaimed'`, `commercial_plan = 'free'`, contact effacé |
| `freed_slots` | `v2_facility_slots.status = 'revoked'` |
| `cleared_roles` | `v2_account_roles.status = 'revoked'` |
| `purged` / `purged_saved` / `purged_push` | favoris, recherches sauvegardées, abonnements push supprimés |
| `marked` | `v2_accounts.deleted_at = now()`, `deletion_reason`, `phone_declared` effacé |
| `audited` | `v2_audit_events` : `account_deleted` |

Puis côté client : `authClient.deleteUser()` (Neon Auth, best-effort) + `signOut()`.

## Invariants tenus

- **I-1 — Pas de suppression en cours de transaction.** Une transaction ouverte → `409
  ACCOUNT_DELETION_BLOCKED`, et **rien n'est touché** (le gate conditionne chaque CTE destructif).
- **I-2 — Le refus est un gate, pas un filtre.** En SQL, un CTE de données modifie la base
  **même s'il n'est pas lu**. Un simple `marked ... where open_txn = 0` aurait laissé les autres
  CTE détacher/dépublier malgré le refus. Garde : `src/server/account-deletion-gate.test.ts`.
- **I-3 — On ne perd pas de preuve.** Aucune ligne de transaction n'est supprimée.
- **I-4 — Un compte supprimé ne peut pas re-entrer.** `getAccountContext` exclut `deleted_at is not null`.
- **I-5 — Idempotence honnête.** Une seconde suppression est refusée (compte déjà supprimé), sans double effet.
- **I-6 — L'audit survit.** L'événement `account_deleted` reste dans `v2_audit_events`.

## Migration

`db/migrations/070_v2_account_deletion.sql` — additive + idempotente :
`v2_accounts.deleted_at timestamptz`, `v2_accounts.deletion_reason text`, + commentaires.
**Appliquée sur la canonique `br-dawn-hill-am5amy22`** (2026-10-07) et enregistrée dans
`omni_schema_migrations` (checksum `9c418aeb…`).

## Preuve

`scripts/prove-v2-account-deletion.mjs` (branche jetable, code livré) — **6/6 PASS** :
T1 refus si transaction ouverte (rien touché), T2 suppression après clôture (lieu → non
revendiqué, offre dépubliée), T3 audit, T4 pas de re-entrée, T5 re-suppression refusée,
T6 acheteur sans lieu supprimé proprement. **Falsifié** : gate retiré → T1/T2 échouent.

## Résidus honnêtes

- **Neon Auth `deleteUser`** : appelé best-effort depuis le client. Si l'endpoint n'est pas
  disponible, la suppression Omni reste effective (`deleted_at`) et la session est fermée ;
  l'identité auth orpheline ne peut plus rien faire (aucun compte Omni ne la reconnaît).
- **Pas de purge des fichiers média** des offres archivées (le blob reste référencé mais
  l'offre n'est plus publique). À traiter si le volume le justifie.
- **`entity` orpheline** : si l'entité n'avait que ce lieu, elle reste sans lieu actif (ligne
  conservée, `v2_products.entity_id` inchangé). Non nettoyée — décision future.
