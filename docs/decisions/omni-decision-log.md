# Journal des décisions Omni

> **⚠️ Corrigé le 2026-09-25.** Ce journal accompagnait `OMNI_MASTER_PRODUCT_INTERFACE.md` — un
> master du **2026-08-21**, **antérieur au Seed V2**. Il **s'arrêtait au 2026-08-16** : **aucune**
> décision V2 n'y figurait. Sa `DEC-001` affirmait « un seul master » — et désignait ce master-là.
> **Les deux sont corrigés ci-dessous.** Voir `docs/README.md` pour la chaîne d'autorité actuelle.

Une décision devient normative lorsqu'elle est intégrée à la **chaîne V2** (Seed → SDM → contrat du
socle → maquette) et référencée ici.

## Décisions V2 (`2026-09-2x`) — ajoutées le 2026-09-25

| ID | Date | Décision | Alternatives rejetées | Impact |
|---|---|---|---|---|
| DEC-V2-01 | 2026-09-23 | **L'offre appartient à l'ENTITÉ, pas au lieu** (`S-25`) : `v2_products.facility_id` devient **nullable**, `entity_id` ajouté sur offres/lieux/entitlements | Garder `facility_id not null` (contredisait `S-01`/`S-02`/`S-25`) | Migration `058`→`061` · code `coalesce(p.entity_id, f.entity_id)` |
| DEC-V2-02 | 2026-09-23 | **Le Seed V2 (`S-01…S-34`) supersède** l'Intent Brief du 2026-09-02 | Réconcilier les deux | `omni-intent-brief-v2-2026-09-23.md` = autorité produit |
| DEC-V2-03 | 2026-09-23 | **`D-C1` retenue** — reconstruire le socle au modèle Seed ; `D-C2`/`D-C3` écartées | `D-C2` (contredisait `S-01`/`S-02`/`S-25`) · `D-C3` (réduisait sans guérir) | `058`→`061` **exécutés** |
| DEC-V2-04 | 2026-09-25 | **`D-CON-1…5`** — les seuils de contrainte sont **réglables** (pas des interrupteurs) ; 3 groupes explicites ; distance comptée une fois | Chips figés | Maquette + gardes falsifiés |
| DEC-V2-05 | 2026-09-25 | **`D-LOC-1…5`** — **la devise suit la localisation de l'utilisateur**, portée par le state | Devise constante `OMNI_DEFAULT_LOCAL_CURRENCY` | Contrat `omni-currency-localization-contract` ; **app non alignée** |
| DEC-V2-06 | 2026-09-25 | **Species V2 CLOSE** `founder-confirmed` sur `SP-1…SP-10` → **Root ouvert** | Rester en Species | Porte `SPECIES_CLOSED_ROOT_OPEN` |
| DEC-V2-07 | 2026-09-25 | **`RT-D1`** — Mapbox comme fournisseur d'itinéraire, **proxy serveur obligatoire**, jamais de jeton dans le bundle client | Appel direct navigateur (tutoriel générique) | Gate d'identité + quota par acheteur |
| DEC-V2-08 | 2026-09-25 | **`D-TXN`** — Phase A souple / Phase B dure (verrou au `qr_verified`) ; **jamais « Annuler »** après verrou ; le temps **relance**, n'annule pas | Annulation d'une transaction engagée | Machine à 10 états ; FF-1…FF-9 |

## Décisions V1 (`2026-08-16`) — historiques

> Ces décisions concernent la **V1**. Elles restent vraies pour ce qu'elles disent (map-first,
> stateful, statut des lieux non revendiqués) **sauf `DEC-001`/`DEC-002`, corrigées**.

| ID | Date | Décision | Alternatives rejetées | Impact |
|---|---|---|---|---|
| ~~DEC-001~~ | 2026-08-16 | ~~`OMNI_MASTER_PRODUCT_INTERFACE.md` est l'unique source de vérité normative.~~ **CORRIGÉ 2026-09-25 : l'autorité est la CHAÎNE V2** (Seed → SDM → contrat → maquette). Ce master est **historique** — il ignore `S-25`. | ~~Maintenir plusieurs masters concurrents.~~ | Toute règle produit/UI va dans le Seed V2 ou un contrat `nature-way/`. |
| ~~DEC-002~~ | 2026-08-16 | `OMNI_MASTER.md` est historique et pointe vers le master canonique. **CORRIGÉ : les deux masters sont historiques.** | Continuer à l'utiliser comme seconde référence active. | Les références migrent vers la chaîne V2. |
| DEC-003 | 2026-08-16 | `omni-product-interface-spec.md` est conservée comme source intégrée/historique. | Supprimer la spécification et perdre la traçabilité. | Les nouvelles règles sont écrites dans la chaîne V2. |
| DEC-004 | 2026-08-16 | Les panneaux horizontaux défilables des facilities sont un pattern officiel de découverte. | Remplacer les résultats par une liste verticale ou une page de résultats séparée. | Le pattern doit être documenté, accessible, responsive et ancré au canvas carte. |
| DEC-005 | 2026-08-16 | Omni reste map-first et stateful ; la carte ne doit pas être remplacée par des pages isolées. | Home → Search → Results → Facility → Checkout comme parcours séparé. | Les nouveaux flows doivent évoluer par états sur la carte. |
| DEC-006 | 2026-08-16 | Le bouton de recherche doit être une affordance distincte et partager le même contrat que `Enter`. | Utiliser le bouton de marque comme soumission implicite. | `SmartSearchBar`, `SearchDock` et `carte.tsx` doivent partager une soumission idempotente. |
| DEC-008 | 2026-08-16 | Les facilities unclaimed issues d'OSM sont découvrables, mais ne sont pas présentées comme possédées ni directement transactionnables. | Les traiter comme des vendeurs Omni actifs. | Les cards indiquent le statut et proposent le claim lorsque pertinent. |

## Format obligatoire des nouvelles décisions

Toute nouvelle entrée doit indiquer :

- l'identifiant et la date ;
- la règle retenue, formulée de manière testable ;
- les alternatives rejetées ;
- **le maillon de la chaîne V2 concerné** (Seed / SDM / contrat du socle / maquette) ;
- l'impact UI, backend, base de données, auth, plan et tests ;
- la matrice de traçabilité à mettre à jour ;
- **la classe de preuve** et son entrée dans `omni-proof-register-v2-2026-09-25.md`.

