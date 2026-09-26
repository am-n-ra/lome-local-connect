# Founder Mission Contract — Omni

> **ID :** `FMC-OMNI-2026-09-26`
> **Founder decision :** « oui on l'écrit » (2026-09-26)
> **Instantiated from :** `.agents/skills/nature-way/templates/founder-mission-contract.md`
> **Authority chain :** Intent Brief V2 (`S-01…S-32`, `founder-confirmed` 2026-09-23) → ce contrat → Root → Trunk
> **As of :** 2026-09-26 · **Review date :** 2026-12-26 **ou** tout changement de stade / de boucle / de devise

| Décision | Accord |
|---|---|
| **Mission** | **Un index complet et vivant de l'offre locale**, interrogeable par les contraintes du chercheur, pour **supprimer la recherche, le contact et la comparaison à la main**. Un acheteur trouve où une chose existe près de lui, apprend si elle peut le satisfaire **maintenant**, et convertit cela en une transaction Omni tracée par QR. Un vendeur de **n'importe quelle forme** devient de l'offre sans tenir un inventaire complet. |
| **Utilisateur primaire et parcours critique** | **Acheteur** → cherche une offre par contraintes (produit, budget, rayon, disponibilité) → **voit si c'est transactable maintenant** → intention → **QR** → transaction verrouillée → réception → **avis**. En parallèle : **vendeur** publie une offre (3 types de lieu : fixe/mobile/digital) ; **opérateur** vérifie l'entité et les équipes. |
| **Cible de maturité** | **`pilot-ready`** sur le terrain pilote de **Lomé**. **Pas** `production-ready` : pas de trafic temps réel, pas de KYC, pas de paiement de biens in-app, pas de géocodage de qualité garantie. |
| **Périmètre** | Boucle complète : Seed → Species (maquette acceptée) → Root (`058`→`061`) → Trunk (boucle cœur prouvée) → Heartwood (durcissement) → tranches Root restantes (`S-06`, `S-32`). Rôles : acheteur, vendeur, opérateur/admin. Devise **dépend de la localisation de l'utilisateur** (`D-LOC-1…5`). |
| **Non-goals** | Pas de matching/assignation transport · pas d'exécution de livraison · pas de paiement de biens in-app · pas de KYC payant · pas de temps réel de mobilité · pas de recommandations IA (tranche ultérieure) · pas de déploiement `main`. |
| **Décisions fondateur nécessaires** | **1)** Trancher la **distribution live** de l'échelle `S-06`/intégrité `S-32` (attendu : peu de ✓, à cause de `0/16` visuels) — c'est un **acte vendeur**, pas un bug. **2)** Le barème bulk `D-J` (hypothèse réversible, non verrouillée). **3)** Toute exposition publique nouvelle. |
| **Responsabilités de l'IA** | Découverte d'intention · artefacts (Seed/Species/Root/Trunk) · construction (interface + serveur + données + intégration) · durcissement (états vides/erreur/retry/verrouillé) · tests (unitaire, négatif, navigateur, 4 largeurs) · preuve (mesures live, `T-07d` prod === local) · **rapport honnête** des dettes et résidus. |
| **Frontière de revue humaine** | Ce qui engage **de l'argent** (paiement, wallet, remboursement) · ce qui touche **des données personnelles** (contact vendeur, identités) · toute **migration destructive** · tout changement d'**autorité de données** ou de **sécurité** · tout ce qui sort du périmètre pilote Lomé. |
| **Succès et garde-fou** | **Succès :** un acheteur réel trouve une offre transactable et la conclut par QR, sans recherche/contact manuel. **Garde-fou :** si une décision confirmée du Seed n'est **pas construite** (cas `S-06`/`S-32`), ou si la maquette montre un état que le code ne peut pas produire, **on s'arrête et on le dit** — on ne peint pas par-dessus. |
| **Définition de done** | Une tranche est `done` quand : elle marche **de bout en bout** (UI → API → base), gère ses états vides/erreur/chargement/verrouillé, respecte la **maquette acceptée**, est **accessible** aux largeurs requises, et que sa **preuve est écrite** (commande, réponse, mesure, résidu). |
| **Prochaine porte** | **Root** — tranche `R-F` (`S-06` + `S-32`), contrat `ROOT-CONTRACT-S06-S32-2026-09-26`. Puis **Trunk** (boucle cœur) → **Heartwood** → clôture `pilot-ready`. |

## Note d'accord

**Confirmé par le fondateur :** Seed V2 « c'est ça » (2026-09-23) · Species V2 close `founder-confirmed` (2026-09-25) · `S-06`/`S-32` en **tranche Root** (2026-09-26) · ce contrat **écrit** (2026-09-26).

**Hypothèses visibles et réversibles :** la grille `BULK_PACKS` (prix pack) est une **hypothèse**, pas une décision. Le **taux pilote** `1 USD = 500 XOF` est une constante de pilote. Le **prix Pro** (`$10` vendeur / `$5` acheteur) est confirmé, affiché en devise locale.

**Limites connues :** `0/16` offres ont un visuel → l'intégrité `S-32` sera **non-✓ partout** tant que ce n'est pas corrigé côté vendeur. `S-06` dépend du stock réservable, donc une offre publiée sans stock sera **niveau 3**, jamais 4. **Ces limites sont le produit, pas un défaut caché.**

**Revue :** à la prochaine porte (Trunk) ou au premier déclencheur (changement de stade, d'autorité de données, de devise, ou incident).
