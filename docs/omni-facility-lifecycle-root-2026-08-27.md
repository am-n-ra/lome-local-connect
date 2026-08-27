# Omni V2 — Facility Lifecycle Root Contract

**Statut :** Root contract proposé, à valider avant implémentation.

Ce contrat complète la Species blueprint et la maquette lifecycle. Il fait de la relation compte–compagnie–facilité la source de vérité pour les permissions, les catalogues, le stock Omni, les plans Pro, les ventes et la récompense Seller.

## 1. Entités et portée

| Entité | Règle d’autorité |
| --- | --- |
| Compte | Propriétaire de l’identité, du Wallet global et des accès aux compagnies |
| Compagnie | Regroupe des facilités ; ne porte pas le compteur de ventes ni le Pro opérationnel |
| Facilité | Porte le lieu, le catalogue, le stock Omni, le slot, le plan Pro, les statuts de confiance, les transactions et le compteur de ventes |
| Slot | Autorise un compte à gérer une facilité selon les limites du plan de capacité |
| Wallet | Porte les crédits du compte ; chaque dépense ou bonus doit avoir une référence et un audit |
| Entitlement | Porte le Pro d’une facilité précise et sa période de validité |

Une même identité peut gérer plusieurs compagnies et une compagnie plusieurs facilités. Une autorisation sur une facilité ne donne pas implicitement accès à une autre facilité de la même compagnie.

## 2. Mapping avec le schéma V2 existant

Le schéma racine possède déjà `v2_accounts`, `v2_companies`, `v2_facilities`, `v2_facility_slots`, `v2_verification_requests`, `v2_verification_evidence`, `v2_verification_reviews`, `v2_products`, `v2_wallets`, `v2_wallet_ledger_entries` et les tables transactionnelles. Les colonnes existantes `v2_facilities.trust_state`, `qualifying_sales` et `bonus_unlocked_at` sont des points de compatibilité à préserver.

Le Root ne doit pas créer une seconde table de facilités ni remplacer silencieusement les données existantes. Avant implémentation, il faudra décider si `trust_state` reste une projection de lecture compatible ou si les dimensions claim, certification, confiance commerciale et publication sont normalisées dans des colonnes/tables additives. Dans les deux cas, l’API doit exposer les dimensions séparées décrites ci-dessous. Le champ `qualifying_sales` ne doit être incrémenté qu’après l’évaluation transactionnelle éligible ; `bonus_unlocked_at` ne doit être renseigné qu’avec une écriture de ledger idempotente.

## 3. États de facilité

La confiance et la propriété sont deux dimensions différentes et ne doivent pas être compressées dans un seul badge.

| Dimension | États autorisés | Transition autorisée |
| --- | --- | --- |
| Source | `osm_public`, `created`, `claimed` | définie à la création ou au claim ; non modifiée silencieusement |
| Claim | `unclaimed`, `claim_pending`, `claimed`, `claim_rejected`, `evidence_requested` | demande du claimant puis décision Reviewer |
| Certification | `verification_draft`, `under_review`, `certified`, `rejected` | soumission, revue manuelle, demande de preuves ou décision |
| Confiance commerciale | `not_confirmed`, `confirmed` | `not_confirmed → confirmed` après trois ventes éligibles |
| Publication | `draft`, `public_pending_review`, `public_active`, `paused`, `archived` | action autorisée selon source, certification, ownership et état de compte |

`certified` signifie que l’équipe Omni a validé l’identité, l’emplacement et les preuves de la facilité. `confirmed` signifie que trois ventes vérifiées et clôturées ont été enregistrées pour cette facilité. Aucun de ces états ne peut être déduit d’un rôle Admin, d’un abonnement Pro ou de la présence d’un produit.

Une facilité OSM non revendiquée peut être découverte sur la carte, mais ne peut pas recevoir un catalogue géré par un Seller tant qu’un claim n’a pas été accepté. Une facilité créée par un Seller est publiable comme présence en cours selon la politique choisie, mais reste non certifiée jusqu’à la revue.

## 4. Claim et création

### Création

`POST /api/v2/seller/facilities` exige une identité authentifiée, un contexte Seller actif, une compagnie existante ou un payload de nouvelle compagnie, un slot disponible, un nom, une catégorie, une adresse, des coordonnées validées et une clé d’idempotence. Le serveur crée une facilité `source=created`, `certification=verification_draft`, `claim=claimed` et `commercial_confidence=not_confirmed`.

La répétition de la même clé retourne la ressource originale et ne consomme pas de slot supplémentaire. Les coordonnées ne sont jamais considérées comme preuve de certification. La permission de localisation reste une décision d’interface ; le serveur accepte aussi une position manuellement ajustée.

### Claim

`POST /api/v2/facilities/:facilityId/claim` exige que la facilité soit revendicable, que le claimant soit Seller actif et qu’il fournisse une preuve privée. Le serveur crée une soumission idempotente `claim_pending` et ne rattache pas la facilité au compte avant décision positive.

Le Reviewer peut `certify`, `request_evidence` ou `reject`. Chaque décision exige un motif, l’identité du Reviewer, l’horodatage et une entrée d’audit. Une décision ne doit pas exposer les preuves privées au public ni aux autres Sellers.

## 5. Ventes éligibles et compteur 3/3

Une vente est éligible uniquement si elle respecte toutes les conditions suivantes : elle est liée à la facilité concernée, à une transaction réelle et non à une fixture locale ; le Buyer a confirmé l’achat ; le Seller a vérifié la transaction ; le paiement externe est déclaré selon le moyen choisi ; le Seller a confirmé le fulfilment ; le Buyer a confirmé la réception ou la clôture prévue ; et la transaction n’est ni annulée, ni expirée, ni contestée selon les règles actives.

Le compteur est monotone jusqu’à trois pour le parcours normal et ne progresse qu’une fois par transaction. Une transaction multi-produit compte comme une vente de la facilité, pas comme une vente par ligne de produit. Une transaction provenant d’une autre facilité de la même compagnie ne compte pas.

`POST /api/v2/transactions/:transactionId/close` doit appeler une évaluation idempotente de l’éligibilité. Au troisième résultat positif, la mutation doit, dans une même transaction de base de données, enregistrer `confirmed_at`, le milestone `three_verified_sales` et l’entrée de bonus de 20 $. Une reprise après timeout retourne le résultat original.

## 6. Bonus Seller de 20 $

Le bonus est un crédit Omni confirmé, attribué une seule fois au compte Seller lorsque la facilité concernée atteint `3/3`. L’écriture possède au minimum `kind=bonus`, `amount=20`, `currency=USD` comme valeur de référence, `source_type=facility_three_verified_sales`, `source_facility_id`, `source_milestone_id`, `idempotency_key`, `created_at` et l’acteur ou l’opération qui l’a déclenchée.

Le bonus est visible dans Wallet/Rewards et rattaché à sa facilité d’origine. Il peut être réservé pour acheter ou essayer le Pro de cette facilité, ou un autre service Omni explicitement éligible. Le Seller doit confirmer l’usage ; aucun Pro ne s’active automatiquement. Le bonus n’est pas le paiement des produits vendus, ne représente pas un montant dû par Omni au Seller et ne change jamais l’état du paiement externe Buyer/Seller.

Les règles de Root restant à verrouiller avant facturation sont la conversion d’affichage dans la devise de localisation, l’expiration, la réservation, la restitution après annulation d’une vente, l’usage inter-facilités et la liste exacte des services éligibles. Tant qu’elles ne sont pas décidées, l’interface doit les présenter comme règles en attente et ne doit pas promettre une convertibilité en argent.

## 7. Pro, slots et catalogue

Le Pro est attaché à une facilité, jamais au compte global ni à toute la compagnie. Le compte peut avoir plusieurs slots et acheter un Pro séparé pour chacune des facilités concernées. Le Pro Seller à 10 USD par facilité et par mois peut lever la limite de catalogue et autoriser l’auto-réponse depuis le stock Omni, sous réserve d’une entitlement active.

Le bonus de 20 $ et le solde rechargé sont deux origines de crédit distinctes dans le ledger. Une dépense doit indiquer son origine, sa facilité cible, son entitlement cible et sa référence d’idempotence. Le système ne doit pas dépenser le bonus sur une facilité non autorisée ni transformer une dépense de Pro en paiement vendeur.

## 8. Permissions minimales

| Opération | Buyer | Seller propriétaire/gestionnaire | Reviewer | Admin |
| --- | --- | --- | --- | --- |
| Voir une facilité publique | Oui | Oui | Oui | Oui |
| Créer une compagnie/facilité | Non | Oui si Seller actif et slot disponible | Non | Selon outil autorisé |
| Soumettre un claim | Non | Oui si revendicable | Non | Selon politique |
| Décider la certification | Non | Non | Oui | Oui, audité |
| Modifier le compteur 3/3 | Non | Non | Non | Exception auditée uniquement |
| Voir les preuves privées | Non | Claimant concerné | Oui | Oui selon besoin |
| Utiliser le bonus | Non | Oui, pour service éligible | Non | Grant/revoke audité |
| Activer Pro | Non | Oui pour une facilité possédée et slot assigné | Non | Override audité |

## 9. Idempotence, audit et fixtures

Les claims, soumissions de preuves, décisions, clôtures de transaction, avancées de compteur, grants de bonus, réservations et dépenses doivent accepter une clé idempotente. Toute opération répétée renvoie le résultat précédent sans doubler le slot, la vente, le bonus ou la dépense.

Les événements suivants sont auditables : création de compagnie, création de facilité, claim, décision de revue, mutation de propriétaire, clôture éligible, progression de compteur, attribution/révocation du bonus, réservation de crédit et activation/expiration Pro. Les fixtures de démonstration doivent être identifiées dans les données et exclues des ventes éligibles.

## 10. API de lecture minimale

`GET /api/v2/seller/companies` retourne les compagnies accessibles et leurs facilités résumées. `GET /api/v2/seller/facilities/:id/overview` retourne le contexte, les statuts, le compteur `verified_sales_count`, l’éligibilité attendue du bonus, le plan Pro et le stock Omni sans exposer le stock global. `GET /api/v2/wallet/overview` sépare le solde, les bonus, les crédits d’usage et les entitlements de facilité.

Les réponses doivent porter une version de contrat, des états explicites de chargement/erreur au niveau UI et une référence de corrélation pour les mutations.

## 11. Acceptance Root

Le Root est accepté lorsque le schéma et les migrations préservent les données existantes, que la propriété compagnie–facilité–slot est serveur-authoritative, que claim et création sont deux opérations séparées, que certification et confirmation sont deux statuts séparés, que seules trois ventes éligibles de la même facilité déclenchent une confirmation et un unique bonus de 20 $, et que les tests négatifs couvrent les doublons, les mauvais comptes, les mauvais slots, les mauvaises facilités, les transactions annulées, les fixtures et les doubles grants.

**Handoff Root → Trunk :** commencer par un vertical slice Seller `facilité certifiée → transaction éligible → vente 1/3 → vente 2/3 → vente 3/3 → bonus visible`, avec une preuve serveur et une preuve UI distinctes.
