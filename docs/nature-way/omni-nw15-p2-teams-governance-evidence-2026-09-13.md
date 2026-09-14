# NW-15 P2-A/P2-B — Gouvernance Admin/Operator/Team (référentiel équipes) — 2026-09-13

**Tranche:** **P2** de l'ordre validé fondateur (NW-14 §4 : P0 → P1 → P2 verrouillés, code débloqué). Répond à la plainte fondateur #4 : « les interfaces pour qu'un admin puisse faire d'un user operator / team ». **P2-A (serveur : référentiel teams + members + invites + zone)** livré et **P2-B (UI admin)** livré.
**Branche:** `omni-v2-rebuild`. **Phase Nature Way:** mini-preuve.

## 1. Objet

Donner à l'admin un **référentiel d'équipes** (groupes de travail nommés + zone) avec **membres** (comptes Omni) et **invitations par e-mail** (role `lead`/`member`, statut `pending`/`accepted`/`revoked`), **audité** via `v2_audit_events`, exposé par des routes admin dédiées et une UI dans `AdminV13` (« Équipe · Groupes »).

## 2. Contrat

### Migration `052_v2_teams.sql` (additive + idempotente)

- **`v2_teams`** : `id uuid PK default gen_random_uuid()`, `name text` CHECK `btrim(name) <> '' and char_length(btrim(name)) <= 60`, `zone text`, `description text`, `created_by_account_id uuid` FK `v2_accounts(id) ON DELETE SET NULL`, `created_at`, `updated_at`.
- **`v2_team_members`** : `team_id uuid` FK `v2_teams(id) ON DELETE CASCADE`, `account_id uuid` FK `v2_accounts(id) ON DELETE CASCADE`, **UNIQUE `(team_id, account_id)`**, `role_in_team text` CHECK `lead|member`, `status text` CHECK `active|revoked`, `added_by_account_id`, `created_at`, `revoked_at`.
- **`v2_team_invites`** : `team_id` FK CASCADE, `email`, `role_in_team` CHECK `lead|member`, `status` CHECK `pending|accepted|revoked`, `invited_by_account_id`, `created_at`, `accepted_at`, `revoked_at`.
- **Index UNIQUE PARTIAL** `v2_team_invites_pending_team_email_key ON v2_team_invites (team_id, email) WHERE status = 'pending'` — un seul `pending` par (équipe, email), mais **ré-invitation possible après `revoked`/`accepted`** (revoke-then-reinvite prouvé).
- Index : `v2_team_members_team_status_idx`, `v2_team_members_account_status_idx`, `v2_team_invites_team_status_idx`.

**APPLIED canonical `br-dawn-hill-am5amy22` 2026-09-14** (7 DDL + 1 index in transaction, Neon MCP) + registre `omni_schema_migrations` (checksum sha256 `45994f6c…`).

### Types (`src/trunk/types.ts`)
`Team { id, name, zone, description, createdByAccountId, createdAt, memberCount }`, `TeamMember { id, teamId, accountId, authUserId, roleInTeam, status, … }`, `TeamInvite { id, teamId, email, roleInTeam, status, … }`, `TeamListResult`, `CreateTeamResult`, `TeamMemberResult`, `TeamInviteResult`.

### Repo (`trunk-repository.ts`) — tous admin-guardés (CTE `admin` + audit `v2_audit_events`)
| Méthode | Événement audité | Retour |
|---|---|---|
| `listTeams` | — | `{ authorized, data: { teams[], members[], invites[] } }` (une requête, `json_agg(row_to_json(…))` → objets JSON propres) |
| `createTeam` | `team_created` | `{ id, name, zone }` (201) |
| `inviteTeamMember` | `team_invite_created` | `{ id, teamId, email, roleInTeam, status }` (201) |
| `revokeTeamInvite` | `team_invite_revoked` | `{ id, status: 'revoked' }` |
| `setTeamMemberStatus` | `team_member_active` / `team_member_revoked` | `{ teamId, accountId, roleInTeam, status }` |

### Routes (`http.ts`)
- `GET /api/v2/admin/teams` → 200 `{ authorized, data }` (vide OK) ; 401 sans session ; 403 non-admin.
- `POST /api/v2/admin/teams` → 201 (name 1..60, zone ≤120, description ≤1000).
- `POST /api/v2/admin/teams/:teamId/invite` → 201 (email valide + roleInTeam).
- `POST /api/v2/admin/team-invites/:inviteId/revoke` → 200 (motif ≥3).
- `POST /api/v2/admin/teams/:teamId/members/:accountId/status` → 200 (roleInTeam + status + motif ≥3).

### Client (`api.ts`) + UI (`AdminV13.tsx` « Équipe · Groupes »)
Créer un groupe (nom/zone/description), inviter par e-mail avec rôle Membre/Responsable, révoquer une invitation, retirer/réactiver un membre. Toasts + reload.

## 3. Preuves

| Classe | Élément | Résultat |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | clean |
| Tests unitaires | `team-governance.test.ts` (+10 : list autorisé/vide/non-admin/mapping, create + audit, name bounds, invite + audit + email normalisé, email invalide, revoke + audit, set status + audit, role/status invalides) | **57 files / 455 tests pass** |
| Frontière client | `npm run check:boundary` | clean |
| Migration (preuve branche temp) | `br-withered-glitter-amdavlod` puis `br-wandering-union-amr99yl8` : DDL appliqués, contraintes vérifiées (CHECK role/status, FK CASCADE, UNIQUE (team,account), **UNIQUE PARTIAL pending**), duplicate pending refusé, **revoke→re-invite OK**, accept OK, **cascade delete OK** (team → members/invites 0) | PASS |
| Repo CTE live (branche temp `br-rapid-queen-amn6m8xj`) | 5 CTE exécutés avec **vrai admin** (`7bd0f09d…`, `auth_user_id 6dfee45e…`) : create team → invite → list (JSON propre) → set member status → revoke invite, audit écrit | PASS (toutes colonnes attendues) |
| Build | `npm run build` | `index-9io-ht-T.js` + `index-CXK07M8c.css` |
| Prod hash | `curl omni.sparkafrika.online/` → `index-9io-ht-T.js` === dist local | T-07d ✅ |
| Routes prod sans session | `GET/POST /api/v2/admin/teams` | **401 AUTH_REQUIRED** (« Sign in as an Omni Admin to manage teams. ») |
| Strings UI prod | bundle prod contient `Équipe · Groupes`, `Créer le groupe`, `Inviter un compte` | présent |
| Serveurless | 13 bundles `api/v2/*.js` régénérés (SQL `v2_team` présent) | OK |

## 4. Résidus honnêtes
- **Cycle complet live (create → invite → accept → revoke) via HTTP authentifié non exécuté** : nécessite une session admin réelle (celle du fondateur dans son navigateur). Pattern établi (NW-13j/13g) : routes 401 owner-only vérifiées en prod ; le proof navigateur complet est un spot-check fondateur.
- **P2-C restants** : assignation de zone (liaison team→facilities zonées), exposition « encourage operator-assign » du rôle via l'UI des comptes, invite accept flow côté invite (lien d'acceptation) — tranches suivantes.
- Pas de suppression d'équipe (soft par révocations seulement pour l'instant).

## 5. Fichiers
- `db/migrations/052_v2_teams.sql`
- `src/server/trunk-repository.ts` (+5 méthodes), `src/server/http.ts` (+5 routes), `src/server/team-governance.test.ts` (+10)
- `src/trunk/types.ts` (+9 types), `src/trunk/api.ts` (+5 clients), `src/trunk/AdminV13.tsx` (+UI groupes)
- Commits : `353ea59` (P2-A serveur) → `642205f` (P2-B UI + flatten client)