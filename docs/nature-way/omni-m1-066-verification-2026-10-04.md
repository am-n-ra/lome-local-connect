# M1 — 066 vérifiée appliquée sur la canonique · 2026-10-04

> **Ordre** : MCP « TF-6 M1 SEULE » (fichier poussé `33581be`, code TF-6 non poussé).
> **Objet** : jouer `db/migrations/066_v2_field_visits.sql` sur la canonique.
> **Owner** : relais · **Statut** : `PROUVÉ` (déjà appliquée — vérifiée, non réécrite).

## 1. Constat

`066_v2_field_visits.sql` **était déjà appliquée** sur la canonique
`br-dawn-hill-am5amy22` (identifiée par ses données : **13 744 facilités / 9
comptes / 16 produits**) :

- `omni_schema_migrations` porte `db/migrations/066_v2_field_visits.sql`,
  checksum **`85b37ce0d243480fecfd57a7bb1e5a297141bc0f35c6b079fdc30bfdafa5cb1f`**,
  `applied_at = 2026-10-04T12:29:02Z`.
- Le **sha256 du fichier** est **identique** au checksum enregistré (aucune
  dérive fichier ↔ base).
- `v2_field_visits` et `v2_visit_reports` **existent**, **vides** (0 ligne) —
  la migration est additive, aucune réécriture.

## 2. Vérification (branche jetable `m1-066-proof`, supprimée)

Aucune écriture canonique. Sur la branche jetable (créée depuis la canonique) :

| Contrôle | Résultat |
|---|---|
| Re-run 066 (12 statements) | **no-op** (idempotent, 0 erreur) |
| Colonnes `v2_field_visits` (id/subject_type/subject_id/zone/assignee_account_id/state/created_at/transmitted_at) | **oui** |
| Colonnes `v2_visit_reports` (visit_id/lieu_ok/activite/contact_ok/reserve/photo_refs/latitude/longitude/reporter_account_id/reported_at) | **oui** |
| `subject_type='bogus'` | **rejeté** (`v2_field_visits_subject_check`) |
| `state='bogus'` | **rejeté** (`v2_field_visits_state_check`) |
| `activite='   '` (vide) | **rejeté** (`v2_visit_reports_activite_check`) |
| `reserve` 501 | **rejeté** (`v2_visit_reports_reserve_check`) ; 500 **accepté** |
| 2ᵉ visite **active** même sujet | **refusée** (`v2_field_visits_one_active_idx`) ; après `transmis` → **ré-acceptée** |
| Index `v2_field_visits_one_active_idx` (unique partiel) + `v2_field_visits_state_zone_idx` | **présents** |

## 3. Cleanup

- Branche jetable `m1-066-proof` **supprimée**.
- Canonique **intacte** : `v2_field_visits=0`, `v2_visit_reports=0`,
  `v2_facilities=13744`, `v2_accounts=9` — **0 résidu**.

## 4. Suite

**M2** (code TF-6 → push → T-07d) est le **second ordre**, non exécuté ici.
