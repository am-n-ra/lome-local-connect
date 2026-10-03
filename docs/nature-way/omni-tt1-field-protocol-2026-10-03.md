# TT-1 — Protocole terrain : premiers vendeurs réels (2026-10-03, proposition relais)

> **Statut :** proposition — le fondateur amende (qui, combien, où), l'équipe exécute.
> Objectif TT-1 : observer des parcours complets réels (claim → offre → dispo → intention →
> QR → clôture → avis), pas remplir la base. 2–3 vendeurs suffisent ; au-delà, c'est de la
> distribution, pas de la preuve.

## 0. Avant de partir — vérifications bloquantes (sans elles, on ne part pas)

| # | Vérifier | Comment | Si non |
|---|---|---|---|
| V1 | La prod sert le dernier build | hash `index-*.js` === dernier build local (T-07d) | STOP — signaler au relais |
| V2 | Création de compte réelle | S'inscrire avec un e-mail test (Neon Auth) | STOP — auth cassée |
| V3 | Upload de preuve possible | Démarrer un claim → statut stockage (`claim-storage-status`) | Si « Bloqué » : les claims ne peuvent pas aboutir — STOP ou terrain sans claim |
| V4 | Mode FedaPay (test vs live) | Demander : les recharges débitent-elles du vrai argent ? | Si live : n'utiliser que des micro-montants + prévenir chaque participant |
| V5 | Bonus 20 USD | Rappel : 3 ventes à acheteurs distincts = vrai grant ledger, même en test | Assumé connu, pas une surprise |
| V6 | La carte tient sur vos téléphones | Pan/zoom 1 min chacun, console d'erreurs si possible | Si flood NaN : noter appareil + gestes, continuer prudemment (durcissements actifs) |

## 1. Recrutement minimum viable (proposé)

- 1 commerce fixe (boutique, visuel + 2–3 offres dont 1 occasion si possible),
- 1 particulier (objet unique d'occasion — exerce le seuil à 1 vente),
- 1 mobile ou service (exerce rayon / immatériel),
- 1–2 acheteurs hors équipe (dont 1 à distance, en autonomie complète).

## 2. Parcours à observer (par vendeur)

1. Entrée espace vendeur → créer OU revendiquer (tap tuile si lieu connu des tuiles).
2. Publier 1–2 offres (caractéristiques + visuel + avantage) — noter chaque refus de porte
   (sont-ils compris ? le motif aide-t-il ?).
3. Acheteur : chercher, demander la dispo, intention, QR, paiement, réception, avis.
4. Vendeur : répondre, scanner, déclarer, mettre en œuvre.
5. Vérifier l'état final : niveau d'existence, confiance, bonus (X/3 ?), ledger.

## 3. Noter (daté, brut, sans interpréter sur place)

- Frictions : où chacun hésite, demande de l'aide, se trompe, abandonne (avec l'écran).
- Verbatims : phrases exactes sur la valeur (« ça m'évite… », « je ne comprends pas… »).
- Temps : durée claim complet, durée transaction complète.
- Bugs : captures + actions exactes avant le bug (+ console si possible).
- À distance : tout le parcours SANS aide (c'est le vrai test) + appel de débrief après.

## 4. Règles données (non négociables)

- Comptes marqués : e-mails et noms contenant `test` (ex. `test-vendeur-1@…`), jamais de
  vraies identités mélangées aux fixtures.
- Petits montants uniquement (centaines de francs), jamais de Pro activé « pour voir »
  (5 000 F débités pour de vrai).
- Pas de fausses preuves : photos réelles du lieu uniquement (S-18 s'applique au test).
- Après l'opération : HQ décide garder (seed vivant assumé) ou nettoyer (liste d'ids) —
  par défaut ON GARDE et on étiquette (H4 : fixtures étiquetées, jamais silencieuses).

## 5. Critères d'arrêt terrain (stop-and-report, comme les vagues)

- Auth/claim/upload cassé (V2/V3) · paiements inattendus (V4) · crash carte bloquant
  reproductible · un vendeur ne comprend pas deux portes de suite (signal produit, pas honte).
