# Omni — Rapport de remédiation des failles V1

**Date : 18 août 2026**  
**Branche : `main`**  
**État : remédiations critiques publiées, certification finale partielle**

## Conclusion exécutive

L’audit a confirmé plusieurs failles importantes qui ne relevaient pas uniquement de l’interface : exposition serveur du téléphone seller avant intention, codes coupon présents dans les réponses publiques, montant client accepté comme autorité lors de la création d’intention, réutilisation trop large des transactions actives, mutations directes du solde legacy et absence de vérification stricte du montant/devise FedaPay.

Ces points ont été corrigés et publiés. Le globe MapLibre, la projection globe, les pins, les clusters, la découverte OSM, les paiements buyer-vendeur externes et les contrats transactionnels V1 n’ont pas été remplacés. Les migrations `033_transaction_intent_fingerprint.sql` et `034_role_provenance_expiry.sql` ont été appliquées sur Neon et versionnées dans le dépôt.

La conclusion correcte n’est toutefois pas « Omni est entièrement certifié production-ready ». Les validations automatisées et les smokes desktop sont solides, mais un parcours E2E authentifié qui crée une nouvelle transaction, un vrai test caméra sur appareil mobile et une certification complète des largeurs 320/390/768/1024 px restent à exécuter dans un environnement de test dédié ou après autorisation explicite de muter les fixtures.

## Failles corrigées

| Domaine | Correction publiée | Preuve |
|---|---|---|
| Confidentialité contact | Les réponses publiques de discovery et de fiche ne renvoient plus `phone` ni `owner_id`. Le contact passe par `getFacilityContact`, protégé par authentification et transaction active ou propriété seller. | `src/lib/omni.functions.ts`, `src/components/omni/FacilityPanel.tsx`, commit `fcfd491` |
| Coupons | Les fiches publiques renvoient une indication d’offre active sans code. La résolution du code reste côté serveur pendant l’intention, avec utilisateur, période, produit et état d’assignation vérifiés. | `src/lib/omni.functions.ts`, commit `fcfd491` |
| Montant transactionnel | Le champ `amount` client a été retiré du schéma de création d’intention. Le serveur recalcule le panier, le produit ou la réponse availability avant coupon et frais. | `src/lib/checkout.functions.ts`, commit `f3fbccb` |
| Idempotence QR | L’empreinte d’intention inclut source, facility, panier/produit/réponse, quantité, offre, coupon, montant brut et montant net. Une transaction active n’est réutilisée que si cette empreinte correspond. | `db/migrations/033_transaction_intent_fingerprint.sql`, `buildTransactionIntentKey`, commit `f3fbccb` |
| Wallet admin | `adjustWallet` n’écrit plus directement `subscriptions.wallet_balance`. Il crée une écriture ledger signée par l’acteur staff, avec raison, référence et snapshot retourné. | `src/lib/admin.functions.ts`, commit `eef098c` |
| Campagnes seller | Les campagnes publicitaires consomment atomiquement le bucket `wallet` via `consumeWalletBucket`; le contrôle legacy n’est plus la source de vérité. | `src/lib/vendor.functions.ts`, commit `eef098c` |
| Payout seller | Après rating, le payout reste dans le bucket canonique `payout`; la double écriture `subscriptions.payout_balance` a été retirée. | `src/lib/checkout.functions.ts`, commit `eef098c` |
| Recharge FedaPay | Avant crédit, Omni revalide le statut provider, le montant exact, la devise `XOF` et la metadata `deposit_id`. Les webhooks restent signés et idempotents. | `src/lib/fedapay.server.ts`, `src/lib/payments.server.ts`, tests finance, commit `eef098c` |
| Abus discovery/OSM | Les endpoints publics de discovery et bounds sont limités par sujet IP-aware; le back-fill OSM est limité à dix opérations par minute et les bounds antimeridiens sont traités explicitement. | `src/lib/rate-limit.server.ts`, `src/lib/omni.functions.ts`, commit `4c7195b` |
| Révocation RBAC | Les rôles stockés supportent provenance/expiration; les claims provider et `ADMIN_EMAILS` sont évalués à chaque requête sans persistance silencieuse. | `db/migrations/034_role_provenance_expiry.sql`, `src/lib/neon-auth.server.ts`, commit `4c7195b` |

## Preuves de validation

Les contrôles locaux ont été exécutés sur la version publiée et sont tous verts.

| Contrôle | Résultat |
|---|---:|
| Tests Vitest | **58 tests passés** dans 10 fichiers |
| TypeScript | `pnpm exec tsc --noEmit` réussi |
| Build Vite/Nitro | `pnpm build` réussi |
| Client boundary | 43 artefacts JavaScript et 167 fichiers source analysés, contrôle réussi |
| Diff whitespace | `git diff --check` réussi |
| Branche | `main` alignée avec `origin/main` |
| Commits de remédiation | `fcfd491`, `f3fbccb`, `eef098c`, `4c7195b` |

Les nouvelles couvertures unitaires vérifient la stabilité de l’empreinte d’intention, sa variation avec quantité/source/coupon/montant, ainsi que le rejet des divergences FedaPay de montant, devise, metadata et statut.

## Smoke production observé

Sur [`https://omni.sparkafrika.online/`](https://omni.sparkafrika.online/), le canvas MapLibre réel est visible avec la projection globe, la cartographie OpenFreeMap et les clusters/pins. Une recherche publique de contrôle « riz » a été soumise par le bouton de recherche; le globe a affiché l’état de recherche et **3 résultats**, avec le CTA availability visible. Aucun écran d’erreur serveur n’a été observé dans la console lors du smoke.

Sur [`/vendeur`](https://omni.sparkafrika.online/vendeur), la Console seller a rendu le globe en arrière-plan, la facility fixture, le segment `Facility / Catalogue / Demandes reçues / Scanner QR / Omni Wallet / Coupons`, la mission availability prioritaire et les raccourcis. La console navigateur n’a signalé aucune erreur.

Sur [`/onboarding`](https://omni.sparkafrika.online/onboarding), les trois étapes sont présentes. L’étape 1/3 affiche le choix Acheteur/Vendeur, le consentement analytics, la localisation optionnelle et les CTA. À la largeur observée de 1280 px, la mesure DOM indiquait `scrollWidth = innerWidth = 1280`, donc aucun débordement horizontal à cette largeur.

## Audit read-only de la base

Le contrôle QA n’a créé ni supprimé de transaction et n’a pas modifié de solde. Il a confirmé les éléments suivants.

| Invariant observé | Valeur |
|---|---:|
| Colonne `transactions.intent_key` présente | Oui |
| Colonnes RBAC `source` et `expires_at` présentes | Oui |
| Transactions actives sans `intent_key` | 0 |
| Transactions actives existantes | 1 `payment_pending`, 4 `qr_generated` |
| Facilities comparées pour la projection wallet | 7 |
| Divergence snapshot wallet / legacy sur l’échantillon | 0 |
| Rôles stockés au moment du contrôle | Aucun |

L’existence de transactions actives confirme que la base contient des fixtures ou des opérations antérieures, mais elle ne remplace pas une preuve E2E neuve et contrôlée de chaque transition.

## Failles encore ouvertes

### E2E transactionnel complet non certifié dans cette passe

Le parcours complet recherche → availability → intention → QR → vérification seller → choix paiement externe → déclaration buyer → confirmation seller → fulfillment → réception → rating n’a pas été rejoué de bout en bout avec une nouvelle transaction pendant cette passe. La raison est de ne pas muter davantage la production et de ne pas déclencher un paiement ou un état transactionnel sans environnement de test explicitement isolé.

Cette limite est importante : les handlers et invariants sont testés statiquement, mais la preuve opérationnelle avec deux sessions authentifiées, deux rôles et notifications deep-link reste à produire.

### Caméra réelle et certification mobile incomplète

Le scanner a été compilé et son flux caméra existe, mais l’autorisation, le flux vidéo de la caméra arrière, l’arrêt des tracks à la fermeture et les cas refus/QR illisible doivent encore être testés sur un vrai téléphone HTTPS. Les largeurs 320, 390, 768 et 1024 px n’ont pas toutes été mesurées dans cette passe; seule la largeur desktop observée à 1280 px est documentée ici.

### Observabilité corrélée encore perfectible

Les erreurs critiques sont mieux contenues, mais le système ne dispose pas encore partout d’un request ID corrélé entre appel server function, événement transactionnel, webhook FedaPay, écriture ledger et notification. Les `catch` de discovery et de back-fill restent volontairement fail-soft, ce qui protège l’expérience mais peut réduire la précision du diagnostic.

### Legacy wallet à retirer à terme

Les colonnes legacy `subscriptions.wallet_balance` et `payout_balance` restent dans le schéma pour compatibilité. Les lectures et mutations critiques corrigées utilisent désormais les comptes, entrées et snapshots du ledger canonique. Une migration ultérieure pourra supprimer ces colonnes après une période de réconciliation et une vérification qu’aucune intégration externe ne les lit encore.

### Validation provider FedaPay réelle à finaliser

La logique de comparaison montant/devise/metadata est testée unitairement, mais une transaction FedaPay sandbox complète avec webhook signé, événement rejoué, retour navigateur et réconciliation différée reste à exécuter. Aucun test réel de carte bancaire n’a été réalisé dans cette passe.

## Ordre recommandé pour la suite

La prochaine étape doit être un environnement **staging transactionnel** avec fixtures renouvelables et rollback automatique. Il devra fournir un buyer, un seller propriétaire, une facility claimed, un produit, une réponse availability et un dépôt FedaPay sandbox. Le scénario devra enregistrer les invariants après chaque mutation et lancer deux appels concurrents pour intention, scan, confirmation de paiement, webhook et rating.

Ensuite, il faudra exécuter la matrice mobile sur 320, 390, 768, 1024 et 1280 px, puis tester la caméra sur appareil réel. Enfin, il faudra ajouter le request ID corrélé et planifier le retrait des colonnes wallet legacy.

## Références

[1]: https://github.com/am-n-ra/lome-local-connect "Dépôt GitHub Omni — lome-local-connect"
[2]: https://omni.sparkafrika.online/ "Production Omni — buyer map-first"
[3]: https://omni.sparkafrika.online/vendeur "Production Omni — seller Console"
[4]: https://omni.sparkafrika.online/onboarding "Production Omni — onboarding"


## Addendum — certification contrôlée E2E/mobile

Le kit E2E staging a été publié dans `scripts/e2e/`. Le seed est protégé par un double verrou (`OMNI_E2E_TARGET=staging` et `OMNI_E2E_ALLOW_MUTATION=1`) et refuse donc la chaîne de connexion actuelle lorsqu’elle n’est pas explicitement déclarée staging. Le vérificateur read-only a confirmé zéro transaction post-cutoff `completed` sans review, zéro transaction active sans `intent_key`, zéro clé d’intention active dupliquée, zéro double redemption coupon, zéro dépôt FedaPay approuvé sans entrée ledger et zéro dérive snapshot/ledger. Il a séparément signalé trois transactions legacy `completed` sans review, créées avant le cutoff du nouveau contrat rating; aucun rating n’a été fabriqué pour les corriger.

La reprise production read-only a été vérifiée depuis `https://omni.sparkafrika.online/`. La pill `2 transactions en cours — Reprendre depuis Mes demandes` ouvre la sheet de reprise et affiche les états `QR en attente de scan`, `Paiement à confirmer` et `Transaction terminée`, ainsi que les événements transactionnels correspondants. Aucun CTA de mutation n’a été déclenché.

La certification statique mobile a validé dix garanties de code et 59 tests automatisés restent verts. Les captures headless de la landing à 320, 390, 768 et 1024 px ne montrent pas de débordement horizontal évident; le runner a été interrompu avant la capture 1280 px et cette preuve reste visuelle, non DOM complète. La caméra reste à certifier sur appareil réel HTTPS avec permission, caméra arrière, QR illisible, refus, reprise d’onglet et fermeture du scanner.
