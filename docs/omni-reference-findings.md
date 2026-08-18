# Référence visuelle Omni — findings

## Buyer

**URL :** https://predeploy-44ae5f66-omnimap-gmngu3h4-2xgzgq5mdgitftoy.manus.space/

La référence buyer présente un canvas cartographique plein écran comme surface dominante, avec un chrome supérieur extrêmement léger : logo/pill Omni à gauche, notification et menu à droite, puis un petit badge de contexte de zone. Les contrôles zoom/recentrage sont regroupés verticalement à gauche. Le dock inférieur est centré, étroit et flottant ; il utilise une enveloppe blanche/crème translucide, un rayon très élevé, une ombre diffuse et une recherche unique avec icône, bouton d’affinage, bouton de catégories et CTA orange de recherche.

Le panneau d’affinage s’ouvre dans le même dock, sans remplacer la carte. Il ajoute uniquement deux champs structurés — **Quantité** et **Budget maximum** — dans une seconde rangée alignée, tout en conservant la recherche au-dessus. La carte continue d’occuper l’essentiel du viewport ; les repères et labels cartographiques restent visibles sous les surfaces glass.

La hiérarchie à reproduire n’est pas celle d’un dashboard. Il s’agit d’un **instrument de découverte** : la carte fournit le contexte, le dock fournit la commande, les paramètres apparaissent à la demande, et le CTA orange est réservé à l’exécution.

## Buyer après chargement des repères

La référence chargée montre une carte urbaine claire avec repères groupés et labels géographiques. Le dock reste centré au bas de l’écran, avec les champs quantité/budget en dessous de la recherche. Le fond du dock est clair, légèrement opaque, avec un effet glass discret plutôt qu’un panneau sombre. Le bouton de recherche est un cercle orange de forte affordance, visuellement distinct des contrôles secondaires.

## Principes à extraire

| Élément | Qualité à reprendre pour Omni | Adaptation obligatoire |
|---|---|---|
| Carte plein écran | Laisser la géographie dominer la scène. | Conserver MapLibre GL v5 et le globe Omni ; ne pas remplacer par Google Maps. |
| Dock flottant | Commande unique, compacte, centrée et toujours accessible. | Ajouter la progression Omni, la reprise transactionnelle et les contraintes repliées sans empiler les panneaux. |
| Glass clair | Fond crème/blanc translucide, bordure douce, rayon généreux, ombre diffuse. | Maintenir le contraste des pins et le globe charbon/ivoire. |
| CTA orange | Une action primaire très identifiable. | L’utiliser pour rechercher, vérifier disponibilité, acheter, scanner ou confirmer selon la surface. |
| Paramètres à la demande | Quantité et budget apparaissent seulement lorsqu’utiles. | Budget illimité et édition manuelle restent pris en charge. |
| Chrome minimal | Logo, notification, menu et contexte de zone peu intrusifs. | Ajouter le rôle et la reprise sans recréer une barre de navigation globale. |

## Seller

**URL :** https://predeploy-44ae5f66-omnimap-gmngu3h4-2xgzgq5mdgitftoy.manus.space/seller

La référence seller garde la carte comme contexte mais propose un segment bas très clair **Carte / Console**. La vue Console abandonne la carte comme surface active et présente une console centrée, très calme, sur fond crème. Le header montre le logo Omni à gauche, le statut « En ligne » et le solde Omni Wallet à droite.

La console est structurée en quatre niveaux. D’abord, trois compteurs courts — Fiches, Catalogue, Demandes — avec leur plan ou statut. Ensuite, une card sombre de demande de disponibilité qui domine la page : produit et quantité en titre, explication courte, puis trois actions de réponse en pleine largeur, Disponible/Partiel/Non, colorées vert/orange/rouge. Enfin, quatre raccourcis en grille deux colonnes : Ajouter un produit, Créer un coupon, Scanner un code, Parcours vendeur. Une card Agent désactivée est reléguée en dernier niveau.

Cette composition est intéressante parce qu’elle transforme le seller en **poste de décision** plutôt qu’en dashboard générique. Le vendeur répond d’abord à la demande entrante ; il gère ensuite son catalogue, son coupon, son QR et la perception de sa fiche. Le wallet reste visible dans le chrome mais n’occupe pas la première surface d’action.

## Seller : principes à reprendre et amélioration Omni

| Élément référence | À reprendre | À améliorer pour Omni |
|---|---|---|
| Segment Carte/Console | Basculer sans perdre le contexte géospatial. | Conserver la carte en arrière-plan dans le mode Console et garder une room ciblée accessible. |
| Compteurs | Lecture instantanée du portefeuille d’activité. | Ajouter un compteur transactions/QR et une indication d’urgence, sans transformer la console en tableau de bord financier. |
| Demande sombre | Une mission prioritaire, actions en trois états. | Connecter directement les réponses aux demandes backend et afficher disponibilité, prix, quantité et coupon courant. |
| Raccourcis grille | Quatre actions faciles à scanner. | Garder exactement quatre actions V1 : produit, coupon, scanner, parcours vendeur ; les autres capacités restent secondaires. |
| Wallet au header | Solde toujours visible. | Expliquer « Omni Wallet rechargeable » et séparer clairement les allocations internes sans proposer de retrait V1. |
| Fond crème/glass | Surface premium et calme. | Préserver le contraste du bloc mission sombre et des CTA de statut. |

## References

[1]: https://predeploy-44ae5f66-omnimap-gmngu3h4-2xgzgq5mdgitftoy.manus.space/ — Référence visuelle Omni buyer, dock map-first et affinage.
[2]: https://predeploy-44ae5f66-omnimap-gmngu3h4-2xgzgq5mdgitftoy.manus.space/seller — Référence visuelle Omni seller, Console et mission prioritaire.
