# Omni UI System — Source unique de vérité V1

**Statut :** normative  
**Portée :** carte buyer, room transactionnelle, console seller, onboarding, compte, wallet, coupons et états d’entrée.

## Promesse d’interface

Omni est d’abord un moteur de découverte géospatiale. Le globe MapLibre, sa projection, ses pins, ses clusters et ses transitions de recherche restent le contexte permanent. Les surfaces sont posées au-dessus de la carte et ne la remplacent pas, sauf pour les espaces longs ou tabulaires de console qui conservent néanmoins le chrome et le lien vers la carte.

Chaque écran répond dans cet ordre : **où suis-je ?**, **que dois-je faire maintenant ?**, **que se passe-t-il ensuite ?**. Toute conséquence durable est inscrite dans la surface concernée. Un toast peut confirmer une action technique, mais ne doit jamais être le seul endroit où apparaît un coupon, un paiement déclaré, une réponse vendeur ou une transition transactionnelle.

## Trois surfaces

| Surface | Usage | Règles |
|---|---|---|
| `FLOAT` | dock recherche, barre de reprise, puces, contrôles map | pointer-events explicites, largeur bornée, safe-area respectée, ne masque jamais les contrôles essentiels de la carte |
| `SHEET` | fiche, disponibilité, compte, coupon, scanner, demandes, room courte | bas sur mobile, centrée sur desktop, `w-[min(calc(100vw-1.5rem),34rem)]`, corps scrollable, pied fixe |
| `PAGE` | console seller longue, admin, tableaux | `min-w-0`, grille responsive, en-tête avec retour et rôle, pas de panneau latéral concurrent |

Il n’existe pas de panneau transactionnel ancré à droite. Les composants historiques `OmniCenteredPanel` et les usages directs de `SheetContent side="right"` sont considérés legacy et doivent être migrés vers `OmniSheet` ou `OmniSheetSurface`.

## Enveloppe et action

Une surface décisionnelle suit toujours : **sur-titre → titre → progression éventuelle → corps → pied d’action**. L’en-tête contient le retour ou la fermeture. Le pied est sticky dans la feuille et comprend une seule action principale pleine largeur ; les actions secondaires sont outline, groupées avant le CTA ou dans un menu secondaire.

```tsx
<OmniFlowSheet
  open={open}
  onOpenChange={setOpen}
  eyebrow="Disponibilité · 1/3"
  title="Que cherchez-vous ?"
  progress={<TransactionProgress steps={["Quoi", "Où", "Contraintes"]} current={0} />}
  footer={<OmniActionFooter><Button className="w-full">Continuer</Button></OmniActionFooter>}
>
  {/* corps scrollable */}
</OmniFlowSheet>
```

Les cibles tactiles font au moins 44 px. Les champs utilisent `text-base` sur mobile pour éviter l’auto-zoom. Les textes sont `min-w-0`, les icônes `shrink-0`, et les en-têtes mixtes utilisent des colonnes `minmax(0,1fr)_auto`.

## Tokens visuels

| Token | V1 |
|---|---|
| Fond | crème clair, contrasté avec les surfaces glass et le globe |
| Accent | orange Omni pour les actions, progression active et surlignage |
| Action forte | noir profond ou orange Omni, jamais deux CTA primaires simultanés |
| Positif | vert doux pour disponible, confirmé et en ligne |
| Alerte | ambre pour partiel, expiration imminente ou attente |
| Danger | rouge lisible pour refus, erreur, caméra refusée et QR expiré |
| Rayons | `rounded-2xl` pour cards, `rounded-[1.5rem]` pour sheets, `rounded-full` pour pills |
| Mouvement | 180–240 ms, uniquement `transform` et `opacity`, désactivé sous `prefers-reduced-motion` |

## Bloc « maintenant »

`OmniActionBlock` est le seul bloc qui porte l’action métier courante. Il est alimenté par les contrats canoniques et ne calcule pas de transition localement. Dans une transaction, il suit : QR à présenter, vérification seller, paiement à choisir, paiement à déclarer, attente vendeur, remise, réception, rating, terminé.

Le fil sous le bloc est en lecture. Il rend les événements `transaction_events`, les conséquences de coupon et les erreurs persistantes. Le chat est une option liée à la transaction ; il ne devient jamais le contenant de l’état métier.

## Barre de reprise

`OmniResumeBar` est visible lorsqu’au moins une transaction active existe. Elle indique le nombre de transactions et, si disponible, la facility, l’étape et le montant. Cliquer la barre ouvre `Mes demandes` ou la room `/transaction/$id`. Fermer une surface ne supprime ni la room, ni le QR, ni le `transactionId` de session.

## Carte et résultats

Le dock de recherche reste flottant en bas. La carte de résultats est synchronisée avec le viewport et présente le produit recherché avant le nom de la facility. Une fiche affiche médias, distance, statut claimed/unclaimed, prix ou « à confirmer », disponibilité et CTA **Vérifier la disponibilité**.

La disponibilité est un flow homogène en trois étapes : **Quoi ?**, **Où ?**, **Contraintes**. La quantité et le budget sont éditables ; l’illimité est une valeur valide. La comparaison affiche une réponse par card, triée disponible → partiel → indisponible, avec un CTA de décision unique.

## Console seller

La console utilise un segment `Carte / Console` dans l’en-tête, pas un dock recouvrant les cartes. En desktop, elle adopte deux colonnes : demandes et transactions à gauche ; actions, wallet, coupons et indicateurs à droite. Sur mobile, elle devient une pile ordonnée par priorité.

Le scanner est une `SHEET`. La permission caméra ne se demande qu’au clic. Les états visibles sont `requesting`, `active`, `denied` et `unsupported`. La saisie manuelle est toujours présente. Après scan, la room inverse les actions buyer : confirmer paiement externe, confirmer remise/livraison, puis notifier la progression.

## Compte et rôle

La feuille compte affiche le nom, le rôle courant, le bouton pleine largeur pour basculer Acheteur/Vendeur, le solde Omni Wallet et les compteurs Disponibilités, Transactions et Messages. Le changement de rôle ramène à l’écran équivalent, sans perdre la navigation courante.

## États d’entrée

| État | Obligatoire |
|---|---|
| chargement | skeleton local par surface, délai borné, aucun écran vide |
| vide | phrase utile + action qui débloque |
| erreur | explication courte + `Réessayer`, conservation de la carte si possible |
| refus auth | message d’accès réservé + route `/auth` |
| permission | différence claire entre refus, timeout, unsupported et action de reprise |
| succès | conséquence visible dans le fil ou la card, pas seulement toast |

## Certification

Chaque route est testée à 320, 390, 768, 1024 et 1280 px. La certification échoue si le document dépasse horizontalement, si un CTA sort du cadre, si une cible fait moins de 44 px, si le canvas MapLibre est absent hors limites headless, si une feuille est latérale, ou si un deep-link transactionnel ne reconstruit pas la room.

Les tests doivent couvrir `/`, `/carte`, `/transaction/$id`, `/vendeur`, `/onboarding`, `/admin` et `/auth`, avec recherche, disponibilité, intention QR, seller verification, paiement externe, réception, rating, bascule de rôle et scanner manuel/caméra.
