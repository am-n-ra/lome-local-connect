# MASTER BUILD PROMPT — OMNI ATLAS GLASS

## Rôle

Tu es un lead product designer, UX architect et frontend engineer senior. Tu dois reconstruire l’interface Omni depuis une base visuelle nouvelle, cohérente et premium. Ne prolonge pas mécaniquement les composants actuels et ne fais pas une simple passe de polish. Conçois et implémente une nouvelle expérience map-first appelée **Omni Atlas Glass**.

Avant d’écrire du code, comprends le produit : Omni est un moteur de recherche géospatial mondial qui relie la demande et l’offre. L’utilisateur arrive sur une carte vivante, recherche un produit, service ou commerce, voit les facilities et les repères, demande la disponibilité, compare les réponses, crée une intention d’achat avec QR immédiat, puis reprend une transaction persistante jusqu’au paiement externe, à la livraison, à la réception et au rating. Le vendeur reçoit les demandes, répond, gère son produit/coupon, scanne le QR et suit la transaction.

## Références visuelles obligatoires

Utilise les deux références suivantes comme inspiration structurelle et visuelle, sans copier leur code ni leur identité de manière servile :

- Buyer : `https://predeploy-44ae5f66-omnimap-gmngu3h4-2xgzgq5mdgitftoy.manus.space/`
- Seller : `https://predeploy-44ae5f66-omnimap-gmngu3h4-2xgzgq5mdgitftoy.manus.space/seller`

Extrais de la référence buyer la carte pleine surface, le chrome minimal, le dock flottant crème/glass, la recherche unique, le bouton orange dominant et les paramètres quantité/budget qui apparaissent à la demande. Extrais de la référence seller le segment **Carte / Console**, les compteurs courts, la card sombre de demande prioritaire avec les réponses Disponible/Partiel/Non et les quatre raccourcis Ajouter un produit, Créer un coupon, Scanner un code et Parcours vendeur.

Ne remplace jamais ces qualités par un dashboard générique, un panneau latéral permanent ou une accumulation de cards.

## Contraintes non négociables

1. **Conserver MapLibre GL v5 et la projection globe actuels.** Ne pas remplacer le globe par Google Maps, une carte plate, une image, un canvas simulé ou une bibliothèque différente.
2. **Ne pas modifier la présentation des pins, clusters, discovery OSM, couverture mondiale ou animation de repos/search.** Toute amélioration doit agir autour de la carte, pas contre elle.
3. **Le globe reste visible** sur landing, résultats, fiche facility, room transactionnelle et seller map-first. Les surfaces sont flottantes au-dessus de la carte.
4. **Ne pas réintroduire de navigation globale lourde.** Le chrome contient seulement Omni, notification, menu/compte, rôle ou solde contextuel lorsque nécessaire.
5. **Une seule Omni Wallet rechargeable.** FedaPay est réservé au rechargement hosted checkout. Pro, Publicité, Coupons et crédits sont des allocations internes ; aucun retrait seller et aucun paiement buyer-seller in-app en V1.
6. **La disponibilité précède l’intention d’achat.** Aucun bouton d’achat direct depuis une facility ne doit contourner la disponibilité.
7. **Le QR est créé immédiatement au clic `Je veux payer ici`.** Il devient l’identité de la room transactionnelle.
8. **La room transactionnelle est persistante.** Fermer une surface ne cancel pas une transaction. La reprise fonctionne depuis la carte, le menu, la notification, le QR et `/transaction/$id`.
9. **Contact et itinéraire sont gated.** Avant l’intention, ils restent masqués ou expliqués ; après l’intention et selon les règles de vérification, ils deviennent disponibles.
10. **Paiement externe uniquement.** Cash, TMoney, Flooz et pay-on-delivery sont des choix déclaratifs. Le buyer déclare, le seller confirme.
11. **Rating requis avant `completed`.** Le flow impose réception confirmée, note/commentaire puis complétion.
12. **Mobile first.** Safe-area, pas de zoom automatique des inputs, CTA accessibles, caméra QR réelle sous HTTPS, fallback manuel permanent.
13. **Ne jamais afficher de secrets.** Ne pas commit `.env`, credentials, fixtures sensibles, tokens ou artefacts `.vercel`.

## Direction artistique — Atlas Glass

Construis une interface lumineuse, calme et éditoriale. Le fond global est crème chaud, avec des surfaces blanc/crème translucides. Le verre ne doit jamais devenir un blur décoratif illisible : utilise une opacité réelle, une bordure fine, un contraste WCAG acceptable et une ombre diffuse.

| Élément | Règle |
|---|---|
| Fond | Crème chaud, texture ou variation radiale très subtile, jamais un fond noir autour du globe. |
| Surface glass | `background: rgba(255, 252, 246, .78–.92)`, bordure `rgba(40, 35, 28, .10–.16)`, blur modéré, ombre large douce. |
| Surface sombre | Charbon brun-noir réservé à mission seller, QR/action critique et progression active. |
| Orange | CTA primaire, recherche, progression et état actif. Un seul orange dominant par surface. |
| Vert | Disponible, succès, paiement confirmé, seller online, localisation précise. |
| Ambre | Partiel, approximatif, à confirmer. |
| Rouge | Non disponible, refus ou erreur seulement. |
| Titres | Police display/serif avec peu de mots, contraste et rythme éditorial. |
| Corps | Sans-serif lisible, phrases courtes, libellés opérationnels. |
| Rayons | 12 px champs, 16 px cards secondaires, 22–28 px surfaces principales, pills pour statuts. |
| Motion | 160–240 ms, `transform`/`opacity` seulement, `prefers-reduced-motion` obligatoire. |
| Touch | Tous les contrôles principaux ont au moins 44 px de hauteur utile. |

## Architecture de surface

Utilise seulement quatre niveaux : `MAP`, `FLOAT`, `SHEET`, `CONSOLE`.

`MAP` est le canvas MapLibre toujours vivant. `FLOAT` porte le chrome supérieur, le pill de reprise, le dock et les résultats compacts. `SHEET` porte une décision courte avec header, corps scrollable et pied d’action fixe. `CONSOLE` porte les opérations seller longues, mais conserve le contexte carte et le segment Carte/Console.

Chaque surface doit avoir un seul sujet dominant, un statut courant explicite, un CTA primaire et des actions secondaires moins fortes. Aucun écran ne doit afficher deux boutons primaires visuellement équivalents.

## Construire le shell buyer

La landing buyer est un stage, pas un dashboard. Le globe occupe le centre. En haut, affiche uniquement Omni, notifications et menu. À gauche, garde les contrôles de zoom/recentrage existants. Au-dessus du dock, affiche le pill `N transaction(s) en cours · Reprendre` seulement si nécessaire.

Le dock inférieur est centré et compact. Il contient une barre de commande de recherche avec placeholder `Chercher un produit ou un commerce`, recherche vocale si disponible, bouton Affiner, bouton Catégories et un bouton orange de recherche. Par défaut, ne montre ni quantité ni budget comme formulaire lourd. Le bouton Affiner ouvre un corps court contenant quantité éditable, budget illimité ou montant manuel, rayon, ouvert maintenant, remise et tri.

Le dock ne doit pas bouger le globe lorsque l’input reçoit le focus. Il doit respecter la safe-area et éviter tout scroll horizontal. Les états localisation, couverture et fallback doivent être de petites pills contextuelles ; aucune erreur technique brute ne doit apparaître.

## Recherche et résultats

Au submit par bouton ou Enter, utilise le moteur de recherche existant et conserve ses contrats. Le globe peut révéler progressivement la zone recherchée — continent, pays, région, ville/zone, résultats — avec pauses courtes. Le repos doit rester un globe propre et vivant.

Affiche les résultats au-dessus du dock sous forme d’un rail product-first. Chaque card doit montrer, dans cet ordre : produit recherché, média, facility, claimed/unclaimed, disponibilité connue ou à confirmer, prix ou minimum, quantité, distance, remise éventuelle et CTA. Utilise une largeur `min(20rem, calc(100vw - 1.5rem))`, aucun élément ne doit sortir horizontalement de l’écran.

L’état vide explique la demande et propose élargissement de zone ou vérification de disponibilité. L’état erreur propose Réessayer. La carte et les pins restent visibles dans tous les cas.

## Fiche facility et disponibilité

La fiche est une sheet, jamais une page qui remplace la carte. Elle contient hero média, nom, catégorie, adresse/distance, statut de confiance, description, produits visibles, coupons publics et CTA.

Pour une facility confirmée, le seul CTA dominant est `Vérifier la disponibilité`. Les actions contact/itinéraire restent gated jusqu’à l’intention. Pour une facility unclaimed, indique clairement `Découverte OSM · non réclamée`, rends la disponibilité non garantie et propose `Est-ce votre commerce ?` sans simuler un achat.

Le flow disponibilité possède trois étapes visuelles :

1. **Quoi ?** produit/service, quantité et unité.
2. **Où ?** facility sélectionnée, zone, marché ou couverture.
3. **Contraintes** budget, rayon, ouvert, remise et tri.

Chaque étape a un titre court, une explication d’une phrase, un corps simple et un pied d’action fixe. Les réponses se comparent disponible, partiel, indisponible puis prix. La meilleure option est marquée, pas imposée.

## Transaction Room

Fais de `/transaction/$id` la room canonique. Elle reste au-dessus de la carte et peut être reprise sans perte de contexte. L’en-tête montre facility, produit, statut et fermeture non destructive. Ensuite affiche :

- Montant catalogue.
- Réduction Omni/coupon si applicable.
- Net à payer.
- Progression `Intention → Offre → QR → Paiement → Réception`.
- QR grand et lisible dès l’intention.
- Bloc `MAINTENANT` avec une seule action courante.
- Timeline secondaire en lecture.

Le flow exact est : disponibilité → choix d’offre → `Je veux payer ici` → transaction + QR immédiat → seller vérifie QR → buyer choisit cash/TMoney/Flooz/pay-on-delivery → buyer déclare paiement → seller confirme paiement reçu → seller démarre remise/livraison → buyer confirme reçu → buyer note et commente → completed.

Ne mets jamais un bouton de paiement in-app dans cette room. Le chat peut exister comme thread secondaire, mais toutes les décisions critiques doivent rester visibles dans le bloc courant. Les notifications et QR deep-links ouvrent la même room ou la console seller ciblée.

## Construire le shell seller

Le seller utilise un segment bas stable `Carte / Console`. En mode Carte, la carte est la priorité. En mode Console, affiche une surface crème centrée et calme, sans perdre la possibilité de revenir à la carte.

La Console suit cette structure :

1. Header : Omni, online/offline, solde Omni Wallet rechargeable.
2. Compteurs : Fiches, Catalogue, Demandes, Transactions/QR si disponible.
3. Mission dominante : card sombre de demande ou transaction à traiter maintenant.
4. Quatre raccourcis V1 : Ajouter un produit, Créer un coupon, Scanner un code, Parcours vendeur.
5. Gestion secondaire : wallet, catalogue détaillé, coupons actifs et fonctions futures désactivées clairement.

La mission de disponibilité affiche produit, quantité, date de demande, facility et trois actions Disponibilité/Partiel/Non. La réponse doit mettre à jour le buyer sans faire naviguer vers un autre dashboard.

Le formulaire produit demande d’abord nom, unité, prix, quantité et média ; les options avancées contiennent visibilité, allocation interne et coupon. Le coupon demande code, type, valeur, période et aperçu de l’économie client. Les deux formulaires ont un seul CTA primaire et une prévisualisation claire.

Le scanner ouvre une sheet dédiée avec permission explicite HTTPS, `facingMode: environment` si disponible, grande zone vidéo, cadre de scan, état permission/actif/refusé, saisie manuelle toujours visible et arrêt complet du stream à la fermeture. BarcodeDetector est optionnel.

## Wallet et compte

Il existe un seul concept `Omni Wallet`. Affiche un solde rechargeable et un CTA FedaPay hébergé. Les allocations Pro, Publicité, Coupons et crédits sont des lignes internes en lecture claire. Ne jamais afficher de retrait seller V1.

Le menu compte montre identité, rôle courant, bascule Acheteur/Vendeur, transactions, messages, recherches enregistrées, panier si disponible, wallet et déconnexion. Supprime les destinations non implémentées ou marque-les explicitement comme futures ; aucune entrée morte.

## Onboarding et auth

L’onboarding explique trois choses : rechercher, comprendre une facility, agir avec disponibilité/QR/transaction. Il demande ensuite rôle, localisation optionnelle et consentement analytique. L’utilisateur doit voir une phrase claire : `Créez votre compte pour accéder à Omni et faire votre recherche`.

Les états auth, onboarding, admin, buyer et seller doivent distinguer loading, unauthorized, empty, error, retry et success. Les skeletons reprennent la géométrie finale et ne provoquent aucun loader infini.

## Responsive et accessibilité

Certifie 320, 390, 768, 1024 et 1280 px. À 320 px, aucun scroll horizontal ; les sheets utilisent safe-area ; les CTA restent visibles ; les inputs numériques utilisent `text-base` ; le dock ne recouvre pas le recentrage ; les cards résultats restent lisibles. À 1024/1280 px, utilise deux colonnes seller mais conserve le globe et une seule action dominante.

Ajoute focus rings visibles, navigation clavier, labels aria, états live pour caméra et transaction, contraste lisible du glass, motion réduite, active scale subtile et fermeture sheet avec retour de focus.

## Méthode d’implémentation

1. Lire les contrats, state machines et server functions existants avant de modifier l’UI.
2. Ne pas dupliquer la logique métier dans les composants ; utiliser les helpers canoniques.
3. Construire d’abord les primitives Atlas Glass et les tokens CSS.
4. Construire le shell buyer et le dock avant les cards.
5. Construire fiche → disponibilité → comparaison.
6. Construire la room transactionnelle et la reprise.
7. Construire le segment seller, la mission, les raccourcis et les forms.
8. Construire scanner, wallet, onboarding et menu compte.
9. Ajouter les états loading/empty/error/retry et les tests de contrat visuel.
10. Valider chaque groupe avant le suivant et publier par commits atomiques.

## Critères de non-régression

Le globe MapLibre doit rester visible et fonctionnel. Les pins, clusters, labels, découverte OSM, recherche, géolocalisation, disponibilité, QR, room, scanner, wallet, FedaPay hosted checkout et notifications doivent conserver leurs contrats actuels. Toute divergence doit être traitée comme une régression jusqu’à preuve contraire.

## Validation finale obligatoire

Exécute :

```bash
pnpm test
pnpm exec tsc --noEmit
pnpm build
pnpm check:client-boundary
```

Puis vérifie manuellement buyer et seller sur les cinq largeurs. Vérifie le parcours recherche → facility → disponibilité → offre → room → QR → paiement externe déclaré → réception → rating, puis seller demande → réponse → scanner → confirmation → fulfillment. Teste au moins une session anonyme, une session buyer, une session seller, une facility claimed et une facility unclaimed.

Ne termine pas en disant seulement que l’UI est « jolie ». Termine avec une matrice route/état/CTA, des captures, les tests exécutés, les limites restantes et les commits publiés.
