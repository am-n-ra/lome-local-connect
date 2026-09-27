# HO-OMNI-HQ — Reçu de handoff · 2026-09-27

## Demande fondateur (verbatim)

> « j'ai essayé de finir omni ces dernières semaines avec open hands mais leur IA ne m'a pas
> arrangé, on a assez tourné en rond et je pense qu'on a raté tout le process depuis Species ; même
> si j'aime bien la présentation visuelle globale actuelle mais tout le fond et la logique qui doit
> faire de omni omni n'est pas là et même il y a beaucoup d'incohérence dans ce qu'on veut
> réellement faire et proposer. »

Complétée par l'instruction de session : « ne me fais pas réfléchir inutilement… fais le nécessaire. »

## Disposition

`execute` — action directe autorisée, sans nouveau vote fondateur sur les points techniques.

## Ce que je ne fais pas

- **Je ne rouvre ni Seed ni Species.** Species V2 est close `founder-confirmed` 2026-09-25.
- **Je n'élargis pas.** Une caractéristique, pas quatre.
- **Je ne pousse pas en prod.** Le guardrail `T-07d` exige l'ordre explicite ; la branche
  `omni-v2-rebuild` est poussée, `omni.sparkafrika.online` n'est pas touchée.

## Ce qui est livré

- **Tranche `R-G`** — la pièce unique est une **présence**, plus un stock. Commit `3753c95`, poussé.
- **Réconciliation HQ** — board mis à jour, réponse mesurée à « le fond manque » et « le process est
  raté ». Commit `8f111ee`, poussé.
- Registres : `omni-rg-piece-unique-presence-evidence-2026-09-27.md` ;
  `omni-root-vs-seed-v2-diagnosis-2026-09-27.md` (session précédente) ; `founder-hq-board.md`.

## Mesure honnête (à ne pas lisser)

| Question fondateur | Réponse mesurée |
|---|---|
| Le fond manque-t-il ? | **Oui, et c'est chiffré** : les 4 caractéristiques d'offre étaient des colonnes sans logique. `R-G` en a rendu **1** vivante. **3 restent des déclarations.** |
| Le process depuis Species est-il raté ? | **Non.** Species close (`27/27`, `NON MESURÉ = 0`) ; `R-C`/`R-D`/`R-E`/`R-F` **livrés et poussés** (commits vérifiés ancêtres de HEAD). Ce qui a tourné en rond est **ma lecture**, pas le produit. |
| Pourquoi 664 → 596 tests ? | `fed06b0` (V-9') : 29 fichiers de tests v1 morts + 6 tests **factices** supprimés, 5 ajoutés. Perte attendue. La capacité a été déplacée, pas perdue. |
| Y a-t-il des incohérences réelles ? | **Oui, deux trouvées en travaillant** : (1) éditer une offre **effaçait** ses cinq caractéristiques ; (2) une pièce **retirée** était annoncée réservable — bug dans **ma propre** formule, trouvé par falsification. Les deux corrigés. |

## Décision fondateur demandée (une seule)

**Quelle caractéristique rendre vivante ensuite ?** Recommandation : `price_kind = 'negociable'` (la
négociation) — elle s'ajoute à la machine transactionnelle à 10 états déjà robuste.

## Ce qui reste et n'est pas promis

`condition_kind`, `handover_kind` = déclarations. `price_kind` = déclaration jusqu'à `R-H`. Preuve
navigateur de la surface « Présence » = prochain spot-check fondateur (sandbox sans DB/Auth).

## Limites d'authorité

Preuve navigateur et verdict de clôture de porte : **fondateur**. La clôture Root n'est pas
prononcée par moi.
