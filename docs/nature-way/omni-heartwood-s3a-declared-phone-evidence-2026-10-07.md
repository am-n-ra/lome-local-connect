# Heartwood S3-a — Numéro DÉCLARÉ + `wa.me` gratuit (S-16)

> **Porte :** Heartwood OPEN · **Local Plan :** `NW-PROD-OMNI-HEARTWOOD-01`
> **Contrat parent :** `omni-heartwood-s3-phone-free-contract-2026-10-07.md` (S3-0 = **A + B**).
> **Décision fondateur :** méthode téléphone **gratuite** ; S3-0 option **A + B** (« go »).

## 1. Ce qui est livré

S3-a rend exécutable l'option A + B : **inscription e-mail-first** (déjà en place, OTP Neon Auth) **plus**
un **numéro Togo déclaré** — jamais « vérifié » — et un **deep link `wa.me` gratuit** d'invitation.

| Élément | Fichier |
|---|---|
| Helpers purs (normalisation Togo, libellé honnête, lien `wa.me`) | `src/domain/phone.ts` (+ `phone.test.ts`) |
| Colonnes `phone_declared` / `phone_declared_at` + CHECK format | `db/migrations/069_v2_declared_phone.sql` |
| Lecture (`getAccountContext`) + écriture (`setDeclaredPhone`) | `src/server/trunk-repository.ts` |
| Validateur + route `POST /api/v2/account/phone` | `src/server/http.ts` |
| Client `setDeclaredPhone` + type `phoneDeclared` | `src/trunk/api.ts`, `src/trunk/types.ts` |
| Champ **Téléphone (optionnel)** à l'inscription (S-16) | `src/trunk/OnboardV13.tsx` |
| Carte « Numéro de téléphone » dans la sheet Compte | `src/trunk/TrunkAppV13.tsx` |

Le numéro est déclarable **à deux moments** : **à l'inscription** (S-16, téléphone-first — champ optionnel,
enregistré best-effort après la création du compte) et depuis la **sheet Compte** (déclarer / remplacer /
retirer + deep link `wa.me`).

## 2. Le fait central : « Déclaré », jamais « Vérifié »

`phoneDeclarationLabel()` renvoie **« Déclaré · non confirmé »**. La carte Compte dit noir sur blanc
« Omni ne vérifie pas ce numéro ; c'est un contact que vous déclarez. » L'API renvoie
`declaration: 'declared_unverified'`. Le lien WhatsApp est libellé **« Confirmer sur WhatsApp »** —
jamais « vérifier ». **Une vérification de numéro gratuite ne peut pas prouver le contrôle du numéro** ;
le produit ne le prétend donc pas. Deux gardes de source verrouillent ce contrat et ont été falsifiées.

## 3. Bug réel trouvé par la preuve contre Postgres (invisible aux tests stubbés)

La première écriture faisait **deux sous-instructions dans une même requête** : un CTE
`insert … returning id` puis `update … where auth_user_id`. En Postgres, une sous-instruction **ne voit
pas** la ligne écrite par une autre dans la **même instruction** (sémantique de snapshot) → l'`update`
ne touchait **aucune** ligne et `setDeclaredPhone` renvoyait `null` pour **tout appel** (l'UI aurait
affiché « impossible d'enregistrer »).

**Corrigé** en **une seule** instruction `insert … on conflict (auth_user_id) do update … returning`.
Découvert par `scripts/prove-s3a-declared-phone.mjs` (branche jetable), puis gardé par
`src/server/declared-phone-write.test.ts` (statique, falsifié). **Même classe que notation / QR / état
courant transaction : ne jamais relire dans la même instruction ce qu'on vient d'écrire.**

## 4. Preuve

- **Postgres réel** (branche jetable `s3a-code-proof`, supprimée) — **6/6 PASS** :
  T1 numéro local → `+22890123456` ; T2 lecture l'expose ; T3 numéro invalide **rejeté** et valeur
  intacte ; T4 la contrainte SQL rejette le mauvais format (garde en profondeur) ; T5 `null` efface ;
  T6 compte inconnu provisionné à la volée. **0 résidu**.
- **Migration `069`** : colonnes + CHECK présents sur la canonique `br-dawn-hill-am5amy22` ; registre
  `omni_schema_migrations` (checksum `e3c60c62…`, 2026-10-07T14:47Z).
- **Suite** : **910/910** (100 fichiers), `tsc` 0, 7 gardes vertes (`state`/`docs`/`coherence`/
  `live-surface`/`boundary`/`dead-css`/`maquette`).
- **Falsifications** : libellé « Vérifié » → **2 tests échouent** ; écriture en deux instructions →
  **garde échoue** ; libellé d'inscription « va vérifier » → **2 tests échouent** ; restaurés → verts.
- **Bundles serverless régénérés** dans le même commit (route `account/phone` présente dans
  `api/v2/availability.js` et `api/v2/account/context.js`).

## 5. Résidus honnêtes

- **Aucune vérification de numéro** — par conception et par décision fondateur (gratuit ≠ preuve).
- **Preuve navigateur du formulaire Compte** non exécutée (session réelle requise) ; le contrat est
  prouvé unitairement + en base + au niveau bundle.
- **D-C1/D-LOC** (socle entité, devise) : inchangés, hors périmètre de S3-a.
