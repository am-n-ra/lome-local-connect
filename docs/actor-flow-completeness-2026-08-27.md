# Omni V2 — Audit de complétude Buyer–Seller–Admin

**Date :** 27 août 2026  
**Autorité :** Nature Way / Founder HQ  
**Périmètre :** UI, opérations serveur, permissions, états de récupération et preuves de release.

## Réponse courte

Non, il ne faut pas encore dire que tout est entièrement en place et prouvé. La majorité du squelette fonctionnel Buyer–Seller–Admin existe, les déploiements production sont `READY`, et les tests locaux sont verts. En revanche, le parcours complet n’est pas encore certifié de bout en bout sur appareil réel et certaines erreurs runtime historiques montrent que la complétude commerciale ne peut pas être déduite de la présence des écrans.

La bonne classification est : **trunk transactionnel livré**, **branches Buyer/Seller/Admin largement présentes**, **Canopy mobile/PWA partiellement prouvé**, et **preuve production end-to-end encore manuelle**.

## Matrice des parcours

| Parcours | UI | Serveur / données | Permissions | États et récupération | Preuve | Verdict |
|---|---|---|---|---|---|---|
| Buyer : recherche de facilités/produits | Présente avec dock, résultats repliables et scène carte/globe | Routes de disponibilité et recherche présentes | Lecture publique bornée par facilité/produit | Chargement, erreur et maintien du contexte partiellement traités | Tests et preuves de recherche existants | **Livré, preuve partielle** |
| Buyer : disponibilité | Présente via les réponses de disponibilité | `/api/v2/availability`, `/api/v2/availability-responses` et persistance Neon | Buyer propriétaire de sa demande | Réponse disponible, partielle ou indisponible prise en compte | Code et tests présents | **Livré** |
| Buyer : intention d’achat | Présente | `/api/v2/purchase-intents`, création d’une transaction et snapshot | Buyer doit posséder la demande/réponse | Idempotence prévue par clé, mais une collision `response_id` a été observée historiquement | Preuves QR/transaction existantes ; preuve négative à renforcer | **Livré, gate Heartwood ouvert** |
| Buyer : chat transactionnel | Présente dans la transaction | `v2_transaction_messages` et endpoints chat intégrés au catalogue pour respecter la limite Vercel | Accès limité aux membres de la transaction | Erreur de session et retry prévus côté UI | Migration appliquée, tests verts | **Livré, walkthrough réel restant** |
| Buyer : itinéraire et contacts Seller | Présents après l’intent | Données liées à la facilité/transaction | Accessible dans le contexte transactionnel | Dépend de l’intent actif | Vérifié dans le travail transactionnel | **Livré** |
| Buyer : QR transactionnel | Présent et distinct du QR public de facilité | Émission et vérification via `/api/v2/qr-issuances` et `/api/v2/qr-verifications` | QR lié à la transaction et au Buyer | QR frais, expiration et régénération couverts par les preuves existantes | Preuves QR documentées | **Livré et prouvé sur fixtures/production contrôlée** |
| Seller : création de facilité | Présente avec localisation actuelle et coordonnées manuelles | `/api/v2/seller/facilities` et `createSellerFacility` | Seller authentifié, propriétaire de la facilité | Validation des coordonnées et états d’erreur présents | Déploiement production confirmé | **Livré** |
| Seller : claim d’une facilité OSM | Présente via claim, upload et submit | `/api/v2/facilities/:id?action=claim*` | Seller claimant ; preuves privées séparées | Certifié, rejeté ou demande de preuves supplémentaires exposés dans l’Inbox | Preuve Admin evidence viewing et outcome Inbox | **Livré, certification manuelle** |
| Seller : catalogue | Présente pour création, édition, publication et limites | `/api/v2/seller/catalogue` et produits liés à la facilité | Facility-scoped ; Seller ne gère que ses facilités | Publication, retour en draft et idempotence prévues | Une erreur historique `discount_kind` a été observée ; schéma Neon actuel contient la colonne | **Livré, compatibilité à revalider** |
| Seller : free/pro par facilité | Modèle et routes présentes | `/api/v2/wallet/pro` et contrôle de slot/facility | Pro doit être facility-scoped, pas compte-global | État Wallet/Pro et limites doivent être vérifiés sur walkthrough | Contrat documenté, preuve end-to-end manquante | **Partiel / non certifié** |
| Seller : réponses de disponibilité | Présentes | `/api/v2/seller/availability-requests`, réponses et transitions | Seller limité aux demandes concernant ses facilités | Disponible, partiel, indisponible et confirmation couverts | Tests présents | **Livré** |
| Seller : scan QR et confirmation | UI et endpoints présents dans le trunk | `/api/v2/qr-verifications`, `/api/v2/transaction-transitions` | Seller doit être membre de la transaction | Confirmation, fulfilment et fulfilled prévus | Preuves QR présentes, walkthrough réel restant | **Livré, preuve end-to-end restante** |
| Seller : paiement externe | Présent via FedaPay hosted checkout et confirmation | Déclaration, webhook signé et confirmation externe | Paiement externe séparé du Wallet | Échec, attente et confirmation traités | Live validé par utilisateur ; logs historiques à auditer | **Livré, preuve opérationnelle à maintenir** |
| Admin : menu et accès Reviewer | Présents mais à vérifier en production réelle | Queue Reviewer, runs et evidence viewing exposés | Les endpoints Reviewer doivent rester admin-only | Outcome certifié/rejeté/more evidence affiché au claimant | UI/code et déploiement présents | **Partiellement prouvé** |
| Admin : revue de claim | Présente | Queue, inspection evidence et décision de revue | Reviewer/Admin uniquement côté serveur | Certify, reject et request-more-evidence | Déploiement `73e947c` et Inbox `4318944` | **Livré** |
| Admin : activation Seller/permissions | Présente dans le modèle de rôles et workspace | Accès distinct de la certification | Activation manuelle Admin | États d’accès à revalider avec comptes réels | Preuve complète de non-fuite non disponible | **Partiel / gate sécurité** |
| PWA installation | Bootstrap et service worker versionné | `src/main.tsx`, `public/sw.js` | N/A | Échec d’enregistrement capturé et cache v2 | Build validé ; OS réel non testé | **Implémenté, non prouvé appareil** |
| Push notifications | Subscribe/revoke/status exposés | `/api/v2/notifications/push` | Session utilisateur | Recovery de permission à vérifier | Code présent ; clic OS non prouvé | **Partiel / non prouvé** |

## Ce qui est effectivement en place

Le produit dispose bien d’un parcours transactionnel cohérent : un Buyer peut rechercher une offre, recevoir une réponse de disponibilité, créer une intention, accéder au chat et à l’itinéraire, obtenir un QR transactionnel distinct du QR public, puis être rejoint par un Seller qui vérifie et fait progresser la transaction. Le Seller dispose également des fondations de création de facilité, claim, catalogue, réponses de disponibilité, scan et confirmation.

Le côté Admin possède la queue de review, la lecture des preuves privées et la restitution d’un outcome explicite au claimant. La certification reste volontairement **manuelle par l’équipe Omni**. Le Wallet et les paiements FedaPay restent deux rails séparés : un paiement externe ne doit pas créditer le Wallet sans webhook signé.

## Ce qui n’est pas encore suffisamment prouvé

La première lacune est la preuve de la boucle complète sur production avec deux sessions distinctes : Buyer recherche et crée l’intent, Seller reçoit ou retrouve la transaction, le QR est vérifié, le Seller confirme, puis la transaction atteint son état terminal. Les artefacts existants prouvent plusieurs morceaux, mais pas encore une observation unique et reproductible de toute la chaîne.

La deuxième lacune concerne la robustesse historique des routes commerciales. Vercel a observé dans les dernières 24 heures contrôlées un groupe `v2_api_error` avec une colonne absente, un paramètre SQL indéterminé et une collision d’idempotence. La dernière fenêtre d’une heure contrôlée était saine, mais cela constitue une observation favorable, pas une preuve durable de correction.

La troisième lacune est mobile : le stage fixe et le cache PWA versionné sont implémentés, mais l’installation, la permission Push, le clic sur notification et le comportement exact du clavier doivent encore être observés sur un téléphone réel.

## Décision Nature Way

Omni peut avancer en **exposition contrôlée** avec comptes démo et utilisateurs explicitement invités. Omni ne doit pas encore être présenté comme totalement production-ready pour une campagne publique générale. Le prochain ring prioritaire est un test end-to-end Buyer–Seller sur production, suivi d’une vérification Admin et d’une observation runtime, puis seulement l’ouverture progressive.

Les modifications API non commités présentes dans le workspace doivent rester hors de ce ring tant qu’elles ne sont pas auditées, testées et déployées intentionnellement.

## Handoff Founder HQ

> **Milestone actif :** exposition contrôlée du trunk Buyer–Seller–Admin.  
> **Gate courant :** preuve end-to-end et Heartwood des routes transactionnelles.  
> **Preuves :** tests locaux 151/151, build 12 fonctions, déploiements Vercel `READY`, preuves QR et certification documentées.  
> **Gap résiduel :** walkthrough réel complet, sécurité de menu en production, PWA/Push sur appareil réel, audit des erreurs historiques.  
> **Propriétaire :** équipe produit/technique Omni.  
> **Prochaine action :** exécuter une transaction contrôlée complète puis enregistrer résultat, erreurs, états et rollback.  
> **Trigger de revue :** toute erreur runtime transactionnelle, fuite de rôle, paiement mal séparé du Wallet ou QR expiré accepté.
