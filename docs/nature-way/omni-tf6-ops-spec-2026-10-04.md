# TF-6 Ops terrain — spec (pas de code)

> **Statut :** spec écrite 2026-10-04 (`HO-OMNI-28`, `/nature-way`). Aucune ligne
> de produit modifiée. Implémentation gated sur les décisions `D-OPS-1…6` (HQ/fondateur).
> **Porte :** Trunk, dernière tranche codable avant le lot terrain final.

## 1. Mini-seed — ce que cette tranche doit faire, pour qui, pourquoi

Un **opérateur** (rôle existant, sans espace de travail réel — voir §3) reçoit une
**tournée** : des dossiers à constater sur place (vérification d'entité,
revendication, signalement TF-5). Il **constate et documente** (photos, position,
compte rendu horodaté et signé) puis **transmet à l'admin qui décide**. Il ne décide
jamais du badge final — c'est la règle maquette, répétée sur les 4 écrans.

## 2. Ce que la maquette dit déjà (lu, pas inféré)

| Écran maquette | Contenu réel |
|---|---|
| `op-queue` (:1346) | « Ma tournée du jour · Terrain · zone Adawlato » — 4 dossiers : vérification « À visiter », revendication « Preuve à constater », signalement « Huile 1 L — À contrôler ». Lead : « L'opérateur agit **sur le terrain** : il constate, il documente, **il ne décide pas du badge final**. » |
| `op-visit` (:1359) | Dossier : Lieu / Contact / Déclaré par le vendeur. **Preuves de terrain (obligatoires)** : photo du lieu + position. Bouton « Rédiger le compte rendu ». Lead : « L'opérateur ne porte pas le badge ; il **transmet la preuve** à l'admin qui décide. » |
| `op-report` (:1372) | Constats : lieu existe / activité visible / contact joignable / réserve. « Transmettre à l'admin » (→ tournée, toast « Dossier transmis ») ou « Reprogrammer ». Lead : « Trace **horodatée et signée** — l'admin verra qui a constaté quoi, quand. » |
| `op-side` (:1385) | « Ce que voit l'entité (**lecture seule**) » : statut, offres, file de messages. « Envoyer un message de suivi » (toast). Lead : voir pour comprendre un dossier — **sans jamais modifier à sa place**. |

## 3. Mesure du sol (2026-10-04)

- **Rôle operator existe** dans le switch (`TrunkAppV13:55`, labels tournée :106) et le
  menu équipe (`:2232 Console/Notifications/Wallet`) — mais **« Console » ouvre
  `AdminV13`, qui exige le rôle admin** (`getAdminConsole` : `ar.role = 'admin'`) :
  un opérateur pur y est `unauthorized`. **Les opérateurs n'ont aujourd'hui aucun
  espace fonctionnel.** TF-6 le construit, pas un doublon.
- **0 table** visite/constat/tournée en migrations ; 0 occurrence `op-queue`/`visit`
  dans `src/` : greenfield, comme TF-5 l'était.
- **Preuves photo : réutilisable.** `src/server/evidence-storage.ts` = Vercel Blob
  **privé** (token `BLOB_READ_WRITE_TOKEN`, types/tailles bornés, scope claim) :
  même backend, **nouveau scope `visit`** à ouvrir (pas un nouveau stockage).
- **Position : acquise.** Géoloc + `arrivalTargetFor` existent (COR-1a) ; le relevé
  terrain = capturer lat/lng + horodatage au moment du constat, jamais la position
  live du téléphone en continu.
- **Message de suivi : NOUVEAU scope.** `v2_transaction_messages` est **member-scoped**
  (acheteur/vendeur d'une transaction) : un message opérateur→entité hors
  transaction n'y rentre pas. Options en D-OPS-4.
- **Scope de file : réutilisable.** Filtre zone P2-C (`team.zone = f.zone`,
  reviewer/operator) : la tournée se scope pareil (zone de mission de l'équipe).
- **Cible du constat : existe.** `decideOfferReport` TF-5 accepte déjà
  `constate_infirme/confirme` par operator/reviewer/admin : les dossiers
  « signalement » s'y branchent sans nouveau endpoint de constat.

## 4. Contrat proposé (à implémenter après décisions)

**Table `v2_field_visits`** (migration MCP apply) : `id`, `subject_type` CHECK
(`verification`/`claim`/`offer_report`), `subject_id` uuid, `zone` nullable,
`assignee_account_id` FK nullable (NULL = file de zone, premier preneur honnête —
voir D-OPS-1), `state` CHECK (`a_visiter`/`en_cours`/`transmis`/`reprogramme`),
`created_at`, `transmitted_at` nullable. Index `(state, zone)`.

**Table `v2_visit_reports`** (1 par visite transmise) : `visit_id` FK UNIQUE,
`lieu_ok` bool, `activite` text ≤500, `contact_ok` bool, `reserve` text ≤500 nullable,
`photo_refs` jsonb (refs Blob scope `visit`, ≤4 comme les médias offre),
`latitude`/`longitude` numeric nullable (relevé au constat),
`reporter_account_id` (signé), `reported_at` (horodaté) —
le « qui a constaté quoi, quand » de la maquette, lisible admin/reviewer.
(Raffinement à l'implémentation : pas de `decision_note` ici — la décision vit
dans les files existantes, D-OPS-3, pour ne pas créer un second canal.)

**Transitions** : `a_visiter` → `en_cours` (prise, operator, idempotent) →
`transmis` (+ ligne `v2_visit_reports`, preuves obligatoires — voir D-OPS-2) ou
`reprogramme` (motif). `transmis` = terminal côté opérateur ; la décision badge
reste aux files existantes (review TF-5/`admin-review`).

**Surfaces** : entrée menu « Tournée du jour » (rôle operator, file scopée zone) ;
fiche dossier (lieu/contact/déclaré + boutons preuves + compte rendu) ;
compte rendu (4 constats + transmettre/reprogrammer) ; aperçu lecture seule
(`op-side`, sans écriture). Réutiliser les atomes `.cardbox/.kv/.btn/.chip` —
aucun nouveau pattern (mini-species héritée, pas d'écran inventé).

**Règles serveur** : auth + rôle operator/reviewer/admin (constat), jamais de
décision badge (garde : aucun `state` badge touché par ces routes) ; audit
`v2_audit_events` (prise, transmission, reprogrammation) ; photos = refs Blob
privées, jamais d'URL publique durable.

## 5. Décisions — TRANCHÉES 2026-10-04 (DEC-V2-37)

| ID | Décision fondateur |
|---|---|
| D-OPS-1 | **File de zone, premier-preneur** (pas de dispatcher ; traçabilité par la prise) |
| D-OPS-2 | **Preuves bloquantes** : photo + position exigées avant transmission ; reprogrammer = sortie honnête sans preuves |
| D-OPS-3 | **Files existantes** : signalements → `decide-report` TF-5 ; vérifications → `admin-review` ; aucune file neuve |
| D-OPS-4 | **Message de suivi reporté** : l'aperçu lecture seule suffit en TF-6 |
| D-OPS-5 | **Lecture seule restreinte** : statut + offres + compteurs ; jamais contenu des messages ni contacts acheteurs |
| D-OPS-6 | **Scope Blob `visit`** : même backend privé, scope séparé, mêmes bornes que le scope claim |

## 6. Preuve prévue (implémentation, plus tard)

Tests dépôt falsifiés (garde rôle, prise idempotente, transmission sans preuves
refusée, jamais de touche badge, file scopée zone) ; validateurs purs + tests ;
preuve MCP sur jetable puis canonique (cycle a_visiter→en_cours→transmis,
reprogrammation, opérateur verrouillé hors zone) ; T-07d. Estimation : tranche L
(migration + serveur + 4 surfaces), ~1–2 sessions après décisions.

## 7. Non-goals

Décision badge côté opérateur, auto-assignation intelligente, navigation GPS
intégrée (position relevée, pas guidage — RT-D2 reste l'itinéraire acheteur),
chat opérateur↔vendeur, statistiques de tournée (TF-6 mesure l'acte, pas le rendement).
