# NW-13j — Publicité sponsorisée IA (campagnes manuelles) — 2026-09-13

**Tranche:** #8 de l'ordre validé fondateur — **P3 (#8, dernière de l'ordre)** « Publicité sponsorisée (campagnes manuelles seulement; IA = draft only, non construite) ».
**Branche:** `omni-v2-rebuild`. **Phase Nature Way:** Branche (mini-racine → mini-tronc → mini-preuve).

## 1. Objet

Donner au vendeur **Pro** la possibilité de **lancer des campagnes de publicité sponsorisée de façon manuelle**, et à l'acheteur de repérer la facilité sponsorisée en tête de recherche avec le badge « Sponsorisé ». Conforme à la spec **NW-13j** (campagnes manuelles uniquement; la génération/ciblage IA reste « draft only », non construite; Free → campagnes indisponibles; **le budget pub est explicitement réservé depuis le wallet à la création**, il ne se confond pas avec un solde « budget pub » séparé; fonctions non implémentées → « Bientôt disponible »).

## 2. Contrat

### Migration `051_v2_ad_campaigns.sql` (additive + idempotente)
Table **`v2_ad_campaigns`**:
- `id uuid PK default gen_random_uuid()`
- `facility_id uuid NOT NULL` FK → `v2_facilities(id) ON DELETE CASCADE`
- `name text NOT NULL` CHECK `length(btrim(name)) between 1 and 60`
- `budget_minor int NOT NULL` CHECK `budget_minor > 0`
- `spent_minor int NOT NULL default 0` CHECK `spent_minor >= 0` + CHECK `spent_minor <= budget_minor`
- `status text NOT NULL default 'planifiee'` CHECK `status in ('planifiee','active','terminee','pausee')`
- `starts_at timestamptz NOT NULL`, `ends_at timestamptz NOT NULL`, CHECK `starts_at < ends_at`
- `created_at timestamptz NOT NULL default now()`

Index:
- `v2_ad_campaigns_active_idx` (facility_id)
- `v2_ad_campaigns_sponsored_scan_idx` **partiel** `(status, starts_at, ends_at) WHERE status = 'active'` — scan sponsorisé de la recherche.

**APPLIED canonical `br-dawn-hill-am5amy22` 2026-09-13** (3 statements Neon) + registre `omni_schema_migrations` (checksum sha256 `4df27a30…4c04`).

### Types (serveur + fork client `src/trunk/types.ts`)
```ts
type SellerAdCampaign = { id: string; facilityId: string; name: string; budgetMinor: number;
  spentMinor: number; status: 'planifiee' | 'active' | 'terminee' | 'pausee';
  startsAt: string; endsAt: string; createdAt: string };
type AdCampaignCreateResult = { campaign: SellerAdCampaign; spendLedgerEntryId: string;
  budgetRemainingMinor: number; billingCurrency: string };
type AdCampaignListResult = { campaigns: SellerAdCampaign[]; budgetRemainingMinor: number };
```
`PublicFacility` gagne `sponsored: boolean`.

### Routes
- `POST /api/v2/seller/facilities/:id/campaigns` — crée une campagne (owner + Pro → 201; 401 sans session; 400 validation; 409 `POLICY_REJECTED` non-Pro/insuffisant/étranger; header `Idempotency-Key` requis).
- `GET /api/v2/seller/facilities/:id/campaigns` — liste les campagnes du propriétaire + budget wallet restant (200/401/409).

## 3. Preuves

| Classe | Élément | Résultat |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | clean |
| Tests unitaires | `trunk-repository.test.ts` (+6: create débite/reserve, list, non-owner, non-Pro, insuffisant, idempotent), `http.test.ts` (+6 validator + mapping 409 `POLICY_REJECTED` non-retryable), `api.test.ts` (+2 client GET/POST avec header `Idempotency-Key`) | **56 files / 443 tests pass** |
| Frontière client | `npm run check:boundary` | clean |
| Build | `npm run build` | `dist/assets/index-C0Gc3Psp.js` + `index-CXK07M8c.css` |
| Bundles serverless | `npm run build` (build:vercel-functions) | 13 fonctions régénérées; `createAdCampaign`/`listFacilityAdCampaigns`/`campaigns` présents dans `availability.js` + `facilities/[id].js` |
| Preuve DB — branche temp `br-jolly-thunder-amr30jz7` (2026-09-13) | 8 contraintes `pg_constraint` vérifiées; 2 index présents (dont partiel sponsored_scan); **scan sponsorisé**: facilité avec campagne `active` dans la fenêtre → `sponsored=1` et boost (`order by (count(camp.id)>0)::int desc`), campagne `planifiee` → non sponsorisée; CHECK rejette `status='bogus'`, budget 0, fenêtre inversée; **rejeu idempotent** (create table + indexes `if not exists` no-op); cleanup DELETE → **0 trace** | PASS |
| Smoke navigateur | preview local `dist` (bundle `index-C0Gc3Psp.js`); app boot sans crash (canvas + dock Recherche/QR/Menu/Buyer); **chaînes UI campagne présentes dans le bundle servi** `Campagnes sponsorisées`/`Activez Omni Pro`/`Nom de la campagne`/`Budget réservé`/`Lancer`/`Aucune campagne` | PASS |
| Prod (T-07d) | push `5cfb268` (code) + `cabf271` (AGENTS.md); poll prod → **prod sert `index-C0Gc3Psp.js` + `index-CXK07M8c.css` === dist local byte-identical**; `GET/POST /api/v2/seller/facilities/:id/campaigns` → **401** sans session; chaînes UI présentes dans le bundle prod | PASS |

### Requêtes SQL clés (vérifiées en preuve temp)
- Insertion campagne: `insert into v2_ad_campaigns (facility_id, name, budget_minor, status, starts_at, ends_at) values (…)` — `'active'` si `starts_at <= now()`, sinon `'planifiee'` (décision au moment de la création).
- Scan sponsorisé de la recherche (`listPublicFacilities`):
```sql
left join v2_ad_campaigns camp
  on camp.facility_id = f.id
     and camp.status = 'active'
     and camp.starts_at <= now() and camp.ends_at > now()
…
min(camp.id) as sponsored_campaign_id
group by f.id
order by (count(camp.id) > 0)::int desc, f.trust_state = 'unclaimed', f.name
```
- `toFacility`: `sponsored = row.sponsored_campaign_id !== null`.

## 4. Résidus honnêtes

- **Preuve navigateur UI** de la cardbox « Campagnes sponsorisées » non capturée avec **session vendeur Pro réelle** (sandbox sans DB/Auth). Chaînes UI vérifiées dans le bundle prod; app boot vérifié en preview.
- **Aucune campagne créée en prod** (attente d'un vendeur Pro réel — spot-check fondateur).
- **Génération/ciblage IA = "draft only", non construite** (conforme spec NW-13j — fonctionnalités affichées « Bientôt disponible »).
- **Budget pub** = réservé depuis le wallet à la création (`ad_spend` ledger, référence `ad-budget:{facilityId}:{startsAt}`, on-conflict idempotent). Le reste du wallet reste disponible pour d'autres usages; expo UI du budget restant = solde wallet courant. Pas de budget pub séparé (séparation wallet vs budget pub explicite = choix de simplicité; le débit à la création verrouille le budget réseau).
- Barème « quantité »/tarification pub = non verrouillée par le fondateur (montant libre au lancement) — à confirmer.
- Gate 6 `closed` maintenu; Gate 7 `watch`.