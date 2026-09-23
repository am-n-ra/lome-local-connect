# Intent Brief V2 — Omni

> **Status:** **Seed clos — `founder-confirmed` (2026-09-23)** · À RE-VALIDER par le fondateur sur la page finale (confirmation écrite)
> **As of:** 2026-09-23
> **Owner:** Founder (intent) / Nature Way (drafting)
> **Supersedes (une fois confirmé):** `docs/nature-way/omni-intent-brief-2026-09-02.md`
> **Branche:** `omni-v2-rebuild` — **aucun code modifié par ce document**
> **Contexte:** le fondateur a jugé que le process avait dérivé depuis Species (maquette V1.3 incomplète vs master canonique ; 18 dettes de cohérence V-8 ; plusieurs masters concurrents). Décision : **rouvrir Seed → Species**, guider par questions, une seule direction, routes externes (YC Winter 2027, HERLOG) **en pause**.

## Resource Receipt

| Statut | Ressource |
|---|---|
| Chargé | `.agents/skills/nature-way/references/founder-intent-discovery.md` |
| Template instancié | `.agents/skills/nature-way/templates/intent-brief.md` (ce document) |
| Chargé (baseline à corriger) | `docs/nature-way/omni-intent-brief-2026-09-02.md` |
| Non chargé / raison | Maquette et Root — **ne pas y toucher avant Seed confirmé** |

---

## Le Seed (une page)

| Champ | Réponse (Seed V2) |
|---|---|
| **Trigger** | Un besoin réel, à contraintes du moment, ne se satisfait pas aujourd'hui : à 2h du matin, pour des pâtes non cuites, à pied, en urgence — on marche vers des lieux « connus » qui sont fermés ou sans stock. Ou des brochettes : le vendeur habituel ne vient pas, on fait la ville à l'aveugle. Ou des bananes : contacter 10, 20, 30 vendeurs un par un pour n'acheter qu'à un seul n'est **pas** une solution. |
| **Problem** | Trouver **une offre** (produit, service, occasion, transport, digital, immobilier…) selon **ses contraintes du moment** — **distance d'abord**, puis heure/ouverture, budget, quantité, état — **sans contacter l'offre une par une**, et en voyant **l'ensemble de l'offre** au lieu de la carte mentale des lieux qu'on connaît déjà. |
| **Affected actors & context** | **Acheteur** : n'importe qui avec un téléphone, mobile-first, Lomé (pilote). **Entité offreuse** : commerce, particulier (occasion), ambulant, prestataire de service, transporteur (zem/taxi), vendeur digital — toute entité peut offrir, sans maintenir un inventaire complet. **Opérateur/Admin** : équipe Omni + agents de terrain (revendication, vérification, audit). |
| **Current alternatives** | Google Maps / pages (statiques, pas de disponibilité), marketplaces (Meta, etc.), bouche-à-bouche, appels un par un, marcher et demander. Toutes échouent : information dispersée, périmée, ou absente à l'instant T. |
| **Desired outcome** | **Un seul regard sur toute l'offre**, selon les contraintes de celui qui cherche : voir ce qui existe, où c'est (et d'où ça provient même pour le digital), à quel prix, et si c'est **disponible maintenant**. La charge de chercher / contacter / comparer disparaît. |
| **Harm or failure to avoid** | **(1)** Mentir sur la disponibilité : montrer un résultat qui promet du stock alors qu'il n'y a rien derrière (danger central). **(2)** Forcer un vendeur à tenir un inventaire complet ou un « beau magasin ». **(3)** Exposer le contact d'un vendeur avant une intention réelle. **(4)** Discriminer l'offre par type dès le lancement (créer une dette de modèle). **(5)** Perdre la carte mentale / la confiance en affichant du faux ou du vide illisible. **(6)** Modifier/détruire les identités et enregistrements Neon existants. **(7)** **Donner le contrôle d'une entité réelle (lieu déjà sur la carte) à une mauvaise entité** — usurpation d'un commerce existant (voir S-18). **(8)** Facturer le fondateur au fur et à mesure de la croissance (voir S-15). |
| **Smallest critical journey** | Acheteur ouvre Omni → cherche selon ses contraintes (distance, heure, budget, quantité…) **ou** flâne sur la carte filtrée → voit l'offre (et les offres alentour, pas seulement celle qu'il connaît) → sait si elle est **disponible maintenant** (réponse vendeur, ou auto depuis le stock alloué) → décide (« je veux acheter » / réserver) → transaction tracée par QR → paiement externe déclaré+confirmé → exécution confirmée des deux côtés → avis → **événement de stock** qui rend la disponibilité plus fiable. |
| **Success signal** | Un **vendeur réel** (hors équipe) et un **acheteur réel** (hors équipe) bouclent le trajet complet, avec une transaction tracée QR et un événement de stock résultant ; le stock alloué du vendeur et son compteur « ventes vérifiées » bougent. Secondaire : demandes de disponibilité répondues dans la fenêtre de fraîcheur. |
| **Constraints & resources** | Fondateur solo + IA ; PWA mobile-first, natif plus tard ; **UI française** (vouvoiement) ; **MapLibre uniquement** (pas de Google Maps) ; Neon Postgres + Vercel ; FedaPay pour les recharges wallet **uniquement** ; pas de paiement des biens dans l'app ; préserver les enregistrements existants. Capacité limitée = **pourquoi** le stock alloué + les demandes de disponibilité existent au lieu d'un inventaire complet. |
| **Non-goals (V1)** | Devenir un processeur de paiement ; devenir un acteur de livraison ; devenir un annuaire statique ; être un produit « AI-first » ; gérer un inventaire complet ; promettre du temps réel de mobilité (zem en mouvement, suivi live) ; import OSM massif au-delà de l'amorçage de la carte ; multi-facilités global / panier global ; réseau social. **Précisés (boucle D) :** pas de matching/assignation transport · pas d'exécution de livraison · pas de paiement de biens in-app · pas de KYC payant · pas de temps réel de mobilité. |
| **Assumptions / unknowns** | A-1 Les vendeurs acceptent la contrainte Omni (ex. remise obligatoire) parce qu'elle finance la boucle traçable — confiance moyenne, revoir après 5 vendeurs réels. A-2 Les acheteurs enverront une demande de disponibilité plutôt que d'appeler — non testé. A-3 La disponibilité automatique depuis le stock alloué est assez fiable dans une fenêtre de fraîcheur — non testé. A-4 Lomé = première géographie (pilote). A-5 Le socle transport/mobilité = **TV1+** (modèle oui, comportement plus tard). |
| **Risk classification** | **Elevated** — identité, coordonnées vendeur (texte affiché après intention), wallet avec argent réel (recharges FedaPay), données de localisation, base de production avec enregistrements existants. Revue qualifiée requise avant toute migration touchant trust_state, wallet/ledger, ou la sémantique de paiement. |
| **Next proof and gate** | **Seed CLOS (2026-09-23)** — boucles A→E closes, `S-01…S-18` + recommandations retenues. Prochain : **Reconciliation des masters concurrents** → **System Dependency Map V2** → **Species V2** (maquette exposée au fondateur via navigateur). |

---

## Définition du cœur (confirmée par le fondateur 2026-09-23)

> **Omni = un index COMPLET et VIVANT de l'offre, interrogeable par les contraintes du chercheur — pour supprimer la recherche, le contact et la comparaison à la main.**
>
> - **COMPLET** : « qui a ça ? » — toute l'offre, toutes entités (commerce, particulier/occasion, ambulant, service, transport, digital, immobilier).
> - **VIVANT** : « qui l'a maintenant ? » — l'état de chaque offre est connu à l'instant T. Le « vivant » a un **coût** : l'état doit être maintenu (confirmation vendeur, ou auto depuis le stock alloué, dans une **fenêtre de fraîcheur** unique).
> - **INTERROGEABLE PAR CONTRAINTES** : près de moi, maintenant, tel prix, telle quantité, tel état — sans appels.

Tous les cas fondateur (spaghetti 2h, brochettes, bananes, ordinateur d'occasion, zem/taxi, appartement) sont des **variantes** de ce cœur — aucun n'exige une mécanique séparée.

**« Disponible » = UNE notion** (« peut me satisfaire maintenant »), exprimée **par caractéristique** (un nombre pour un stock, une présence pour un objet unique, une place libre pour un créneau, une position pour un transport) — **une seule logique de fraîcheur**, pas quatre.

**Racine du raté précédent** : l'architecture actuelle ne couvre qu'une tranche — *Facility → produit → stock comptable* — donc « commerce fixe, produit fongible avec un nombre ». Toute offre hors de ce moule (occasion, appart, coupe, zem, digital) casse le schéma. C'est la dette de base que S-01/S-02 suppriment.

## Décisions structurantes acquises (Seed V2)

| ID | Décision | Statut |
|---|---|---|
| **S-01** | **Tout est offre.** Pas de types séparés ; les différences sont des **caractéristiques**. | confirmé |
| **S-02** | **Modèle universel dès jour 1** ; **comportements séquencés** (un vrai à la fois) — aucune dette de base à l'ajout d'un type. | proposé — accord fondateur requis |
| **S-03** | **L'entité mère liste son offre** — Omni est un registre où l'entité dépose ; personne ne connaît mieux son offre que son fournisseur. | confirmé |
| **S-04** | **Toute offre existe via une entité** — pas d'offre orpheline. | confirmé |
| **S-05** | **Amorçage à froid** : les lieux déjà présents (fonds de carte) sont montrés **`unclaimed`** (niveau 0) — visibles en recherche comme « Lieu connu — pas encore géré », **sans promesse de stock**, avec bouton *Revendiquer*. N'est **qu'une tactique** d'amorçage, pas le cœur. | confirmé |
| **S-06** | **Échelle d'existence** : 0 Présente → 1 Revendiquée → 2 Offre publiée → 3 Disponibilité vivante → 4 Transactable (= Discoverable ≠ Queryable ≠ Available ≠ Transactable). | confirmé |
| **S-07** | **Carte et recherche = deux vues d'un seul corpus.** La carte est **filtrable** par l'utilisateur (tout / transport / types d'entités…) pour ne pas saturer. | confirmé |
| **S-08** | **Itinéraire = fonction de soutien** (partiellement servi par la découverte du lieu) ; **transport = une offre** comme les autres, avec caractéristiques mobiles. | confirmé |
| **S-09** | **Le prix compte** et doit être visible/comparable sans faire le tour des magasins. | confirmé |
| **S-10** | L'offre n'est **pas** limitée au physique : digital, hybride, service, immobilier, transport — **et** l'origine géographique compte même pour le digital. | confirmé |
| **S-11** | **Deux niveaux de recherche cohabitent** : (i) chercher une **entité** par son identité ; (ii) chercher une **offre** (scopée éventuellement à une entité). Entité et offre sont deux objets **reliés** d'un même index, pas deux systèmes. **Test de non-régression obligatoire au Root** : un cas qui casse l'un des deux niveaux invalide la logique. | confirmé |
| **S-12** | **Transport** : fondation (modèle d'offre mobile) dès jour 1 · affichage des offres de transport en V1 · **requête A→B + assignation = `V1+`** (on n'entre pas en concurrent direct de Gozem). | confirmé |
| **S-13** | **« Entité » = tout offreur** — commerce, organisation **ou personne seule**, même objet. Un particulier à offre unique n'a besoin d'aucun « facility » ni stock. | confirmé (a) |
| **S-14** | **Confiance = identité (entité) + preuve (offre), séparées.** Seuil adapté au **volume** : 1 transaction réussie pour un particulier à offre unique, 3 pour un commerce. Jamais de mensonge sur la disponibilité. | confirmé |
| **S-15** | **Coût marginal pour le fondateur = 0** — contrainte de conception de premier ordre. Aucun service payant au fur et à mesure de la croissance. Exception à décider avant activation du routage (Mapbox facturé vs OSRM auto-hébergé) → `S-15-exception`. | confirmé |
| **S-16** | **Inscription téléphone-first** (au Togo le numéro est plus courant que l'e-mail) : email **ou** numéro. Vérification **e-mail = OTP Neon Auth** (gratuit) ; vérification **numéro = confirmation WhatsApp initiée par l'utilisateur** (coût ~0). **SMS payant exclu par défaut.** | confirmé |
| **S-17** | **Paliers de confiance** : 0/1 Joignable/Numéro confirmé → publie, badge « Non vérifié » · 2 Vérifié par **opérateur Omni** (temps humain, 0 logiciel) → badge « Vérifié » · 3 Prouvé par usage → « Vérifié · N ventes ». **On publie tôt, on gagne la confiance ensuite.** Une organisation = **une entité comme une personne** (même objet), avec un **compte responsable** et possiblement plusieurs offres. | confirmé |
| **S-18** | **Revendication d'une entité DÉJÀ présente sur la carte (`unclaimed`) ≠ création d'une entité nouvelle.** Création = libre (badge). **Revendication d'un lieu réel = demande + preuve de contrôle (lieu / contact / document) + arbitrage opérateur AVANT transfert de contrôle** — le demandeur ne contrôle rien tant que la preuve n'est pas passée. But : empêcher l'usurpation d'un commerce réel. | confirmé |

## Caractéristiques de l'offre (modèle jour 1 / comportement pilote)

| # | Caractéristique | Modèle jour 1 | Comportement pilote |
|---|---|---|---|
| 1 | Quantité / déplétion | oui | oui |
| 2 | Unicité (occasion → disparaît après vente) | oui | oui |
| 3 | Position **fixe / mobile / immatérielle** | oui | fixe oui ; mobile = `V1+` |
| 4 | Temporalité (fenêtre / créneau / durée) | oui | fenêtre oui ; créneau & durée = `V1+` |
| 5 | Retrait / livraison / immatériel | oui | retrait oui ; autres = `V1+` |
| 6 | État neuf / occasion | oui | oui |
| 7 | Prix fixe / à négocier | oui | oui |

## Première preuve (boucle E — confirmée 2026-09-23)

> **Périmètre :** carte **mondiale** avec les éléments existants (niveau 0 `unclaimed` partout, la carte n'est jamais vide) ; **l'acquisition terrain commence à Lomé** (pilote), naturellement.
>
> **Trajet de première preuve (cas 1+3+4 — le cœur validé pleinement) :** un **commerce réel** à Lomé (offres + disponibilité tenue fraîche) **et** un **particulier réel** (offre unique, son propre objet) → un **acheteur réel hors équipe** cherche par contraintes (distance + produit) → trouve **plusieurs** offres (pas seulement son commerce connu) → voit le « maintenant » → transige en **QR tracé** → l'**événement de stock** bouge.
>
> **Hypothèses testées (encore non prouvées) :**
> - **H1 — Vivant** : un vendeur réel tient-il sa disponibilité fraîche (ou l'auto la maintient-elle) ? *Si non : le « maintenant » meurt, Omni = Google Maps.*
> - **H2 — Contact absorbé** : l'acheteur cherche-t-il au lieu d'appeler/WhatsApp ? *Si non : la valeur du cœur disparaît.*
>
> **Périmètre géographique de la preuve :** un quartier de Lomé (plus petit = plus prouvable).

## Validation du cœur contre les cas fondateur (2026-09-23)

| Cas | Complet | Vivant « maintenant » | Verdict |
|---|---|---|---|
| 1 · Pâtes 2h du matin | ✅ | ✅ ouvert + en stock | ✅ **plein** |
| 3 · Bananes (ne pas appeler 30) | ✅ | ✅ stock | ✅ **plein** |
| 4 · Ordi d'occasion (particulier) | ✅ | ✅ « toujours à vendre » | ✅ **plein** |
| 8 · Digital | ✅ (origine géo conservée) | ✅ « existe / accès » | ✅ **plein** |
| 2 · Brochettes (ambulant) | ✅ | ⚠️ position mouvante | ⚠️ partiel (`V1+`) |
| 5 · Coupe (service) | ✅ | ⚠️ « maintenant » = créneau | ⚠️ partiel (`V1+`) |
| 6 · Zem / taxi | ✅ | ⚠️ position live + libre | ⚠️ partiel (`V1+`, S-12) |
| 7 · Appartement (2 démarcheurs) | ⚠️ objet, plusieurs entités | ⚠️ durée = `V1+` | ⚠️ partiel + S-1 |

**Conclusion :** le cœur est **validé pleinement par les 4 cas à offre fixe et « maintenant » simple** (la majorité du quotidien : pâtes, bananes, occasion, digital). Les 4 autres sont **délimités, pas invalidés** : le motif est toujours *le temps* (position qui bouge, créneau, durée) — le modèle les porte (caractéristiques 3 & 4), le comportement est `V1+` (S-02). **Aucune dette de base.**

## Recommandations de fermeture des points ouverts (fondateur : « fermons en même temps »)

| Point | Recommandation (retenue) | Raison |
|---|---|---|
| **S-02** | **Confirmé définitivement** — modèle universel jour 1, comportements séquencés. | Règle anti-dette ; tout en découle. |
| **S-1** (même objet, plusieurs entités) | **Toutes les offres séparées d'abord** (chaque entité = une offre réelle) ; un **signal « même lieu probable »** est un raffinement `V1+`, **jamais un regroupement forcé** qui masquerait une offre. | Respecte « toute offre a le droit d'être vue ». |
| **S-2** (niveau 0 en recherche) | **Validé** : « Lieu connu — pas encore géré », aucune promesse de stock, bouton *Revendiquer*. | Honnête + argument d'adoption. |
| **S-15-exception** (coût routage) | **Par défaut : OSRM auto-hébergé/compatible (coût 0)** ; Mapbox = option bornée activable plus tard, jamais un défaut silencieux. | Contrainte coût-zéro (S-15). |
| **Non-goals précisés** | Pas de matching/assignation transport · pas d'exécution de livraison · pas de paiement de biens in-app · pas de KYC payant · pas de temps réel de mobilité. | Frontières de la boucle D. |

---

## Founder confirmation

**Confirmé par le fondateur (2026-09-23), en ses mots :**

> « c'est ça » — le cœur d'Omni est bien *un index complet et vivant de l'offre, interrogeable par les contraintes du chercheur, pour supprimer la recherche, le contact et la comparaison à la main.*
>
> « que quelqu'un cherchant juste une entité ou un autre cherchant un produit seulement chez l'entité le trouveront, et que notre logique ne casse pas » — d'où **S-11** (double niveau entité / offre) et son **test de non-régression obligatoire au Root**.
>
> Le fondateur a par ailleurs jugé que le process avait dérivé depuis Species et a demandé de **reprendre depuis le Seed** : « j'ai moi-même assez oublié tout ce que je veux qu'Omni fasse. » Routes externes (YC Winter 2027, HERLOG) **en pause**.
>
> Décision finale : **Seed CLOS** ; prochain = réconciliation des masters → SDM V2 → **Species V2 (maquette montrée au fondateur dans le navigateur)**, dans l'ordre : acheteur → offreur → échelle d'existence.
