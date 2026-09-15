# NW-15 P2-C — Invite-accept + mission zones (gouvernance team) — 2026-09-14

**Tranche:** **P2-C** de l'ordre validé fondateur (NW-14 §4 : P0 → P1 → P2 verrouillés, code débloqué). Clôture de **NW-15 P2** (Gouvernance Admin/Operator/Team) — répond à la plainte fondateur #4 : « les interfaces pour qu'un admin puisse faire d'un user operator / team ». P2-A (serveur teams), P2-B (UI admin), P2-B2 (identité réelle) déjà livrés ; **P2-C = accept d'invitation par l'invité + mission zone (facilities) + filtre reviewer par zone**.
**Branche:** `omni-v2-rebuild`. **Phase Nature Way:** mini-preuve.

## 1. Objet

1. **Acceptation d'invitation team par l'invité** : un compte Omni destinataire d'une invitation (e-mail) peut lister ses invitations (`GET /api/v2/team/invites`) et les accepter (`POST /api/v2/team/invites/:id/accept`) → devient membre actif (`v2_team_members`, rôle `lead`/`member`), invite marquée `accepted`, audit `team_invite_accepted`. Nouvelle UI dans le sheet **Compte** (`TrunkAppV13`) : carte « Invitations d'équipe » (pending) + bouton « Accepter ».
2. **Mission zone (admin)** : un admin assigne une zone (text libre, ex. « Lomé Est ») à une facilité — `v2_facilities.zone` (migration `053`) — via `POST /api/v2/admin/facilities/:id/zone`, audit `facility_zone_assigned`. UI `AdminV13` : champ + bouton « Zone » par item de la file de revue.
3. **Filtre « mission zone » reviewer/operator** : `listReviewQueue` + `listSellerActivationQueue` masquent les facilités hors zone quand le reviewer appartient à une équipe zonée (`t.zone = f.zone`), avec la règle « pas d'équipe zonée → tout visible ».

## 2. Contrat

### Migration `053_v2_facility_zone.sql` (additive + idempotente)

- `alter table v2_facilities add column if not exists zone text;`
- `create index if not exists v2_facilities_zone_idx on v2_facilities (zone) where zone is not null;`
- `comment on column v2_facilities.zone is 'Zone de mission (reviewer/operator par équipe)';`

**APPLIED canonical `br-dawn-hill-am5amy22` 2026-09-14** + registre `omni_schema_migrations` (checksum `6793fa83…`). Preuve branche temp T1–T4 (colonne, index, idempotence, INSERT/UPDATE/DELETE) puis cleanup.

### Routes (`http.ts`)
| Méthode | Retour | Contrôle |
|---|---|---|
| `GET /api/v2/team/invites` | 200 `{ invites: MyTeamInvite[] }` | owner (401 sans session) |
| `POST /api/v2/team/invites/:id/accept` | 200 `TeamInviteAcceptResult` | owner destinataire seulement |
| `POST /api/v2/admin/facilities/:id/zone` | 200 `{ facilityId, zone }` | admin (401 sans session) |

### Repo (`trunk-repository.ts`)
- `listMyTeamInvites` : owner, joint `v2_teams` → `teamName`/`teamZone`.
- `acceptTeamInvite` : UN guarded CTE — insert membre + invite→`accepted` + audit, idempotent.
- `assignFacilityZone` : admin-guardé, `for update of f`, trim, audit `facility_zone_assigned`.
- Filtre zone sur `listReviewQueue`/`listSellerActivationQueue` (pattern partagé `not exists équipe zonée OR t.zone = f.zone`).

### UI
- `TrunkAppV13` sheet Compte : charge `listMyTeamInvites` à l'ouverture (ref mono-shot) + carte invitations + bouton Accepter.
- `AdminV13` file de revue : champ zone + bouton « Zone », zone courante pré-remplie (mapping `f.zone` → `ReviewQueueItem.zone`).

## 3. Preuves
- tsc clean ; **57 files / 466 tests** (+11 : filtre zone repo, validators invite-accept/zone) ; boundary clean ; build `index-BwnpSj7_.js` ; 12 bundles serverless régénérés.
- **Push prod exécuté** : remote URL corrigée (`am-n-ra/lome-local-connect` — l'ancien remote `ghu_…` était mort + nom erroné bloquait le push). commits `b5c8868` (feature + migration) + `cea8809` (docs) → prod sert **`index-BwnpSj7_.js` + `index-CXK07M8c.css` === dist local (T-07d ✅)**.
- Routes prod : `GET /api/v2/team/invites`, `POST /api/v2/team/invites/:id/accept`, `POST /api/v2/admin/facilities/:id/zone` → **401 sans session**.

## 4. Résidus honnêtes
- Cycle HTTP complètement authentifié non exécuté (session fondateur requise pour le proof navigateur — spot-check).
- Proof navigateur UI (sheet Compte invitations + console Admin zone) non capturé (sandbox sans DB/Auth).
- P2-C est la dernière sous-tranche de NW-15 P2. **NW-15 P2 → CLOSED.**
- Gate 6 reste CLOSED (verdict « Go with limits » 2026-09-11). Gate 7 (Venture Lifecycle) en `watch`.