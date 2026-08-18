# Omni E2E staging

Ces scripts sont volontairement séparés des fixtures QA production. Ils ne doivent jamais être exécutés avec la chaîne `DATABASE_URL` de production.

## Préparation

Définir dans un environnement staging isolé :

```bash
export OMNI_E2E_TARGET=staging
export OMNI_E2E_ALLOW_MUTATION=1
export OMNI_E2E_SELLER_ID=<seller-fixture-id>
export OMNI_E2E_BUYER_ID=<buyer-fixture-id>
export OMNI_E2E_RUN_ID=$(date +%Y%m%d%H%M%S)
```

Le seed est refusé si `OMNI_E2E_TARGET` n’est pas exactement `staging` ou si `OMNI_E2E_ALLOW_MUTATION` n’est pas égal à `1`.

```bash
node scripts/e2e/seed-staging.mjs
```

## Certification des invariants

Le cutoff rend explicite la date à partir de laquelle la règle `rating-before-completed` est obligatoire. Les transactions legacy sont signalées séparément et ne doivent pas masquer une violation nouvelle.

```bash
export OMNI_E2E_ENFORCE_AFTER=2026-08-18T00:00:00Z
node scripts/e2e/assert-invariants.mjs
```

Le scénario complet doit ensuite exécuter, avec deux sessions authentifiées et rollback staging : recherche, réponse availability, intention, QR, scan seller, choix de paiement externe, déclaration buyer, confirmation seller, fulfillment, réception et rating. Il doit répéter en concurrence l’intention, le scan, le webhook, la confirmation de paiement et le rating, puis relancer `assert-invariants.mjs` après chaque groupe.

## Invariants bloquants

Une certification réussie exige zéro transaction active sans `intent_key`, zéro clé d’intention active dupliquée, zéro coupon consommé deux fois, zéro dépôt approuvé sans écriture ledger, zéro dérive snapshot/ledger et zéro transaction post-cutoff `completed` sans review. Les violations legacy doivent être traitées séparément par migration ou action utilisateur, jamais par la fabrication d’un rating.
