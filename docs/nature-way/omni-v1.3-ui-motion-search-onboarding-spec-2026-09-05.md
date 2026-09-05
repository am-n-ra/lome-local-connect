# OMNI — Spec mouvement, recherche & onboarding (V1.3(

> **Correction technique importante** : la carte de production est une vraie carte vectorielle **MapLibre GL JS** (pas le SVG de la maquette, qui n'était qu'une illustration statique pour prototyper l'UI.). Toute la section 1 est donc réécrite en termes d'API MapLibre réelle (`flyTo`, `easeTo`, `bearing`, `pitch`, `padding`, `Marker`), directement exploitable par l'équipe dev sans traduction supplémentaire.



Ce document couvre : le scénario d'animation de carte, le comportement réel de la recherche(chargement, contraintes, gating d'auth), la synchronisation grille ↔ carte, la stratégie onboarding/paywall, **le détail écran par écran côté Buyer ET Seller/Admin**, et **les micro-copies exactes en français** pour chaque état. Rien ne doit rester à l'interprétation du développeur.



## 1. La carte(MapLibre GL JS( comme scène cinématique


### 1.1 État par défaut au lancement
- `map.jumpTo({ center: [userLng, userLat], zoom: 15.5, pitch: 0, bearing:  ​​0 })` au premier rendu(pas d'animation ici, c'est l'état de repos..
- Les pins sont des `maplibregl.Marker` avec un élément DOM custom(le pin actuel de la maquette devient le `element` du marker( — pas une symbol layer, parce qu'on a besoin des états CSS `dim` / `focused` / `pulse-review` déjà spécifiés en V1.2, et ceux-ci s'appliquent nativement à un DOM marker..
- Apparition échelonnée : ajouter les markers un par un avec `setTimeout` de 40-60ms entre chaque, chacun avec la classe `pop-in`(keyframe déjà définie( plutôt que de tous les ajouter d'un coup..
- Le point"vous êtes ici" est un marker séparé, toujours ajouté en premier, sans délai..

### 1.2 Séquence déclenchée par une recherche
MapLibre propose nativement l'effet recherché(dézoomer → survoler → rezoomer( via le paramètre `curve` de `flyTo` — inutile de simuler ça à la main avec des étapes manuelles fragiles. Voici l'implémentation recommandée en trois appels chaînés :


```js
// Étape A — bascule de caméra(250ms(: léger tilt + rotation, indique"on prend de la hauteur"
map.easeTo({ pitch: 35, bearing: 8, zoom: map.getZoom() -  ​1, duration: 250, easing: t => t*(2-t( } );


// Étape B — le vol cinématique lui-même(MapLibre gère seul le dézoom/rezoom via `curve`)
map.once('moveend', () => {
  map.flyTo({
    center: resultsBoundsCenter,     // centre calculé à partir des résultats + position utilisateur
    zoom: targetZoom,                // zoom qui contient utilisateur + résultats(voir 1.2.1(
    curve: 1.7,                      // >1.4 all"arc"vue satellite" perceptible ; c'est le réglage clé
    speed: 1.2,                      // ajusté pour tomber dans la fourchette 900-1400ms de vol
    pitch: 0,
    bearing:  ​​0,
    essential: true
  });
});


// Étape C — au moveend du flyTo, déclenche l'apparition des markers résultats puis la sheet
map.once('moveend', () => {
  revealResultMarkers();   // stagger 50ms, voir 1.1
  setTimeout(openResultsSheet, 350); // la sheet glisse APRÈS les markers, jamais avant
});
```


**Durée totale visée(étape A + vol + settle(: 1200-1900ms.** Si `speed`/`curve` donnent une durée hors fourchette pour une distance donnée, ajuster `speed` dynamiquement selon la distance réelle(`map.cameraForBounds`) plutôt que fixer une valeur unique — sur une recherche très locale, le vol doit rester court(~900ms( sinon ça paraît lent pour rien..


#### 1.2.1 Calcul du zoom/centre cible
- Utiliser `map.cameraForBounds(bounds, { padding: { top:  ​​60, bottom: sheetHeightPx + 40, left:  ​24, right:  ​24 } })` où `bounds` = enveloppe(LngLatBounds( contenant la position utilisateur + tous les pins résultats retenus..
- Le `padding.bottom` doit **toujours** intégrer la hauteur actuelle de la sheet ouverte — c'est ce qui garantit que les pins ne finissent jamais visuellement"sous" la sheet à la fin du vol(cf. §1.4.(.


####½.2.2 Libellé contextuel pendant le vol(l'effet"on resserre" (
- Écouter l'event `zoom` pendant le vol et mettre à jour un label en haut de carte par palier de zoom(pas par géocodage inverse en temps réel, trop coûteux/latent pour une simple micro-copie( :


| Zoom courant | Libellé affiché |
|---|---|
| < 4 | `Recherche dans le monde…` |
| 4 –  ​​6 | `Afrique de l'Ouest`(déduit du pays de session, statique côté client( |
| 6 –  ​​9 | `Togo` |
| 9 –  ​12 | `Région Maritime` |
| 12 –  ​14 | `Lomé` |
| > 14 |(label masqué, on est au niveau rue( |


Le crossfade entre libellés dure 120ms, jamais un simple remplacement sec..


###½.3 Attente réseau réelle
- Si la réponse serveur n'est pas arrivée à la fin de l'étape B(moveend(, **ne pas enchaîner l'étape C tout de suite** : `map.easeTo({ zoom: targetZoom +  ### 0.3, duration:  ​​600 })` en boucle douce(respiration très légère, ±0.3 zoom( tant que la réponse n'est pas là,, avec le bandeau `Recherche en cours dans votre zone…`(cf. micro-copies §6(..
- Passé 2,5s sans réponse : garder la caméra stable(arrêter la respiration( et afficher `La connexion est plus lente que prévu…` sans jamais relancer le vol depuis le début..
- Aucun résultat : la caméra s'arrête au palier"ville"(zoom ~12-13(, jamais au niveau rue,, et la sheet affiche l'état vide(§6(..


###½.4 Synchronisation grille horizontale ↔ markers
- À chaque `scrollsnap` sur une carte de la grille : `map.easeTo({ center: marker.getLngLat(), zoom: focusZoom, padding: { bottom: sheetHeightPx }, duration:  ​220 })`. Le marker correspondant reçoit `.focused`(anneau + scale 1.15(, l'ancien repasse en `.dim` — un seul crossfade, jamais de flash..
- Tap direct sur un marker : `grid.scrollTo({ left: cardOffsetLeft, behavior: 'smooth' })` **et** applique le même `easeTo` — la synchro doit fonctionner dans les deux sens, jamais un seul..
- Ouverture de la fiche facilité(tap marker ou carte(: `map.easeTo({ center, zoom: focusZoom + 1.5, padding: { bottom: facilitySheetHeight }, duration:  ​380 })` **avant** que la sheet FACILITY ne glisse(délai `setTimeout` de 150ms entre la fin de l'`easeTo` et l'ouverture de la sheet.. Le padding garantit nativement que le marker reste au-dessus de la sheet — plus besoin de"trait connecteur" artificiel évoqué en V1.2, MapLibre gère ça proprement via `padding`..
- Retour arrière : restaurer le dernier état de caméra de la session de résultats(garder `lastResultsCamera = {center, zoom, bearing, pitch}` en mémoire,, jamais recalculer depuis zéro..


---

##½. Comportement réel de la recherche(inchangé sur le fond, cf. V1.2 §2(
- Halo de chargement sur le champ dès le tap d'envoi(pas de résultat avant la fin de la séquence §1.2-1.3..).
- Gating d'authentification contextuel : recherche mémorisée intégralement si l'utilisateur n'est pas identifié, onboarding minimal inséré, reprise automatique de la recherche originale ensuite — voir le schéma complet en §4..


---

##½. Où placer l'authentification et le paywall(inchangé sur le fond, cf. V1.2 §3(
- Jamais d'auth complète en premier écran ; identité minimale(téléphone/email + code( seulement au moment d'une intention réelle(recherche complète, achat( ; plans présentés tôt en soft paywall non bloquant, jamais comme un mur..


---

##¼. Schéma de gating(reprise exacte, pour référence dev(


```
Recherche lancée
   │
   ▼
Session existante ? ── NON ──▶ Mémoriser requête + contraintes intégralement
   │ OUI                              │
   ▼                                  ▼
Séquence carte §1.2          Onboarding minimal(identité + soft paywall(
                                       │
                                       ▼
                              Reprise AUTOMATIQUE de la recherche mémorisée
                              → Séquence carte §1.2(jamais retaper la requête(
```


---

##½. Détail écran par écran — comportement complet


Pour chaque écran : **déclencheur d'entrée**, **comportement pendant**, **sortie(s( possibles**, **états**(chargement/vide/erreur/succès.. Les micro-copies exactes sont en §6(référencées par code [M-xx](..


###½.1 Parcours Buyer


**SEARCH**
- Entrée : tap sur l'icône recherche du dock, ou retour depuis un résultat..
- Pendant : saisie libre + chips de contraintes ; chaque chip togglée met à jour un compteur discret"3 contraintes actives" au-dessus du champ..
- Sortie : Entrée clavier ou tap flèche → déclenche §2/§4. Tap dock"Carte" → ferme sans chercher, aucune confirmation nécessaire(rien n'est perdu, la requête reste dans le champ si l'utilisateur rouvre SEARCH..).
- États : chargement = halo(§1.2( ; erreur = `[M-01]` en bandeau au-dessus du champ, champ réactivé..


**RESULTS**
- Entrée : automatique à la fin de la séquence carte §1.2(jamais avant..).
- Pendant : grille scrollable, synchro carte §1.4. Compteur de résultats en tête(`resultsCount`( mis à jour en temps réel si des résultats arrivent en différé(dispo groupée en cours..)
- Sortie : tap"Comparer" → COMPARE(seulement si ≥2 facilités transactables, sinon bouton désactivé avec tooltip `[M-11]`(.. Tap"Dispo groupée" → BULK. Tap carte/marker → FACILITY...
- États : vide = `[M-02]` + bouton"Élargir les contraintes" qui réouvre SEARCH avec les chips distance/budget pré-sélectionnées pour modification rapide..


**FACILITY**
- Entrée : tap marker ou carte grille(après `easeTo` §1.4(, ou scan QR public..
- Pendant : squelette de 3 lignes de produits(rectangles gris pulsés, animation `shimmer` 1.2s en boucle( pendant le chargement du catalogue,, remplacé par la vraie liste dès réception.. Sélection multi-produits persistée par facilité(déjà spécifié en V1.1 — `SELECTIONS[facId]`..)
- Sortie :"Demander la disponibilité"(désactivé tant que sélection vide( → AVAIL. Bouton"Revendiquer"(facilité non revendiquée( → flux de claim(hors périmètre de ce document, cf. Seller §5.2..)
- États : vide = `[M-03]`(déjà présent pour `claim`, à généraliser(( ; erreur = `[M-04]` avec bouton"Réessayer" qui relance uniquement l'appel catalogue, pas toute la navigation..


**AVAIL**
- Entrée : tap"Demander la disponibilité" depuis FACILITY(bouton désactivé si sélection vide — jamais atteignable vide..).
- Pendant : récap de la sélection(lecture seule ici, la modification se fait en revenant à FACILITY( + choix retrait/livraison + note libre..
- Sortie :"Envoyer la demande" → PENDING. Le bouton passe en état chargement(200-400ms simulé mini pour éviter l'effet instantané, même si la requête est en réalité un simple insert( pendant l'envoi..
- États : erreur d'envoi = `[M-05]` + bouton"Réessayer" qui renvoie la même charge sans repasser par FACILITY..


**PENDING**
- Entrée : automatique après envoi réussi depuis AVAIL ou BULK..
- Pendant : statut"en attente" par produit, mis à jour en temps réel(websocket/poll( si une réponse arrive avant que l'utilisateur ne quitte l'écran..
- Sortie : automatique vers ARESULT dès qu'une réponse est reçue(toutes les lignes traitées( — sinon l'utilisateur peut quitter(l'état continue en fond, badge sur BUYERHOME..
- États : `[M-06]` si aucune réponse après le délai raisonnable(défini par le vendeur/l'auto-availability — pas un timeout arbitraire côté client..).


**ARESULT**
- Entrée : automatique depuis PENDING, ou en revenant depuis BUYERHOME si une réponse est arrivée en fond..
- Pendant : chaque ligne affiche source(auto/vendeur( + fraîcheur(déjà spécifié V1.1..).
- Sortie :"Comparer" → COMPARE."Je veux acheter" → INTENT..
- États : `[M-07]` si toutes les lignes reviennent indisponibles(pas de bouton"Je veux acheter" affiché dans ce cas, remplacé par"Voir d'autres facilités" → retour RESULTS..).


**COMPARE**
- Entrée : depuis RESULTS ou ARESULT..
- Pendant : tri actif visible(pastille sur le sortchip sélectionné(, recalcul instantané de l'ordre au changement de tri(pas de rechargement réseau, tri côté client sur les données déjà reçues..)
- Sortie :"Choisir & acheter" → INTENT avec la facilité mise en avant par le tri courant..
- États : `[M-11]` si <2 facilités transactables(écran non atteignable dans ce cas, cf. RESULTS..).


**INTENT**
- Entrée : depuis ARESULT ou COMPARE..
- Pendant : récap prix/remise figé(snapshot, pas recalculé en live — évite qu'un prix change sous les yeux de l'utilisateur entre l'affichage et la confirmation..)
- Sortie :"Confirmer l'intention" → si non identifié, déclenche le gating d'auth(§4( avant de créer la transaction ; si identifié → TXN directement..
- États : `[M-08]` si le prix/dispo a expiré entre-temps(facilité désormais indisponible( → retour ARESULT avec message..


**TXN**
- Entrée : automatique après confirmation d'intention..
- Pendant : machine à états complète(§42 du master( déjà spécifiée ; chat contextuel..
- Sortie : progression normale jusqu'à COMPLETED, ou"Annuler" → confirmation `[M-09]` avant annulation réelle(jamais d'annulation en un seul tap,, c'est irréversible..
- États : `[M-10]` si la transaction expire(vendeur n'a pas scanné le QR à temps..)..


**QR**(scan public( / **MENU** / **BUYERHOME** / **WALLET** / **PLANS** / **PAYMENT** / **SAVED** / **ACCOUNT**
- Comportement identique à la maquette V1.1 sur le fond ; ajouter systématiquement : squelette de chargement sur les listes(WALLET solde, SAVED alertes, ACCOUNT infos(,, état vide explicite si applicable(`[M-12]` à `[M-15]`,cf. §6(,, et pour PAYMENT : le bouton"Déclarer le paiement" passe en chargement 400-600ms avant de révéler l'état"en attente de confirmation vendeur" dans TXN(jamais un aller-retour instantané qui donne l'impression que rien n'a été enregistré..)..


**ONBOARD**
- Entrée : déclenché uniquement par le gating(§4(,, jamais au lancement de l'app..
- Séquence exacte : écran de valeur → localisation(facultative( → identité minimale(téléphone/email + code OTP( → soft paywall plans → reprise automatique de l'action initiale..
- États : `[M-16]` code invalide, `[M-17]` code expiré avec bouton renvoyer(cooldown visible,, ex. `Renvoyer dans 0:28`..)..


###½.2 Parcours Seller(rême rigueur que Buyer — souvent oublié(


**SELLER**(home(**
- Entrée : bascule de rôle(switch en haut( ou premier accès après avoir revendiqué une facilité..
- Pendant : toggle ON/OFF de disponibilité active en tête d'écran — c'est l'action la plus fréquente, elle doit rester accessible sans scroller.. Changement d'état immédiat visuellement(optimistic UI( avec confirmation serveur en fond ; en cas d'échec, revert visuel + `[M-18]`..
- Sortie :"Produits" → PRODUCTS,"Offres" → OFFERS, tap compagnie → COMPANY..
- États : vide = `[M-19]`(aucune compagnie/facilité encore créée( avec CTA"Créer ma première facilité" qui lance le flux de claim/création directement, sans détour par COMPANY..


**COMPANY**
- Entrée : depuis SELLER ou MENU..
- Pendant : liste des compagnies avec état de vérification..
- Sortie :"+ Créer une compagnie" → formulaire de création(nom, secteur( → retour ici avec la nouvelle compagnie en état `À valider`..
- États : vide = `[M-19]`(même message que SELLER, cohérence..)..


**PRODUCTS**
- Entrée : depuis SELLER ou dock(raccourci"Stock"..).
- Pendant : chaque produit affiche son allocation Omni(pas l'inventaire total, déjà spécifié..). Édition inline de l'allocation au tap sur la valeur(pas un écran séparé pour un changement aussi simple..).
- Sortie :"+ Ajouter un produit" → formulaire minimal(nom, prix, allocation initiale( ; "Historique stock" → STOCKEVENT..
- États : vide = `[M-20]` avec CTA direct vers le formulaire d'ajout ; erreur de sauvegarde d'allocation = `[M-21]` inline sous le champ concerné(pas un toast générique qui masque quel produit a échoué..)..


**STOCKEVENT**
- Entrée : depuis PRODUCTS..
- Pendant : ledger read-only, pagination infinie au scroll(pas de bouton"charger plus"..).
- États : vide = `[M-22]`(aucun événement encore, normal pour une facilité neuve — ton neutre, pas alarmant..)..


**OFFERS**
- Entrée : depuis SELLER ou PRODUCTS(lien croisé produit → son offre..).
- Pendant : simulation du prix Omni en temps réel pendant la saisie de la remise(pas seulement au submit..).
- Sortie :"Enregistrer l'offre" → confirmation inline `[M-23]`, reste sur l'écran(pas de redirection automatique, le vendeur enchaîne souvent plusieurs offres..)..
- États : `[M-24]` si la remise saisie est à 0% — avertissement non-bloquant rappelant que l'offre ne sera pas transactable sans remise Omni(cf. master §28(,, avec bouton"Enregistrer quand même"..)..


###½.3 Parcours équipe(Admin/Operator(


**ADMIN**
- Entrée : bascule de rôle..
- Pendant : file de claims/créations à valider, triable par ancienneté(le plus vieux en premier par défaut — jamais un tri arbitraire qui laisse un claim ancien invisible..).
- Sortie :"Valider" → confirmation `[M-25]`(action irréversible,, motif obligatoire si refus — champ texte requis avant de pouvoir taper"Preuve demandée" ou"Refuser"..)..
.
 États : vide = `[M-26]`(aucune revue en attente — ton positif, pas neutre : c'est une bonne nouvelle pour l'équipe..)..


---

##½. Micro-copies exactes(FR(


| Code | Contexte | Texte exact |
|---|---|---|
| M-01 | Erreur réseau pendant la recherche | Recherche impossible pour le moment.. Vérifiez votre connexion et réessayez.. |
| M-02 | Aucun résultat | Aucune fourniture ne correspond à ces contraintes ici.. Essayez d'élargir la distance ou le budget.. |
| M-03 | Facilité sans catalogue | Cette facilité n'a pas encore de produits référencés.. |
| M-04 | Erreur chargement fiche facilité | Impossible de charger cette facilité.. Réessayer |
| M-05 | Échec envoi demande de disponibilité | Votre demande n'a pas pu être envoyée.. Réessayer |
| M-06 | Pas de réponse après délai raisonnable | Le vendeur n'a pas encore répondu.. Vous serez notifié dès sa réponse.. |
| M-07 | Toutes les lignes indisponibles | Aucune de ces facilités ne peut satisfaire votre demande actuellement.. |
| M-08 | Offre expirée entre intention et confirmation | Cette offre n'est plus disponible aux conditions affichées.. Vérifier à nouveau |
| M-09 | Confirmation avant annulation de transaction | Annuler cette transaction ? Cette action est définitive et ne peut pas être reprise.. |
| M-10 | Transaction expirée(QR non scanné à temps( | Cette transaction a expiré car elle n'a pas été vérifiée à temps.. Contactez le vendeur ou recommencez.. |
| M-11 | Comparaison indisponible(<2 facilités( | Comparaison indisponible : une seule facilité correspond à votre recherche.. |
| M-12 | Wallet en chargement/vide | Aucun mouvement pour l'instant.. |
| M-13 | Recherches enregistrées vide | Vous n'avez pas encore enregistré de recherche.. |
| M-14 | Compte — chargement | (squelette, pas de texte( |
| M-15 | Erreur générique de chargement de liste | Le chargement a échoué.. Réessayer |
| M-16 | Code OTP invalide | Ce code est incorrect.. Vérifiez et réessayez.. |
| M-17 | Code OTP expiré | Ce code a expiré.. Renvoyer dans {compte à rebours} |
| M-18 | Échec bascule ON/OFF facilité | Le changement n'a pas pu être enregistré.. Votre facilité reste {état précédent}.. |
| M-19 | Aucune facilité/compagnie côté Seller | Vous n'avez pas encore de facilité sur Omni.. Créer ma première facilité |
| M-20 | Catalogue vendeur vide | Aucun produit pour l'instant.. Ajouter un produit |
| M-21 | Échec sauvegarde allocation | Ce changement n'a pas pu être enregistré.. |
| M-22 | Historique de stock vide | Aucun mouvement de stock encore enregistré pour cette facilité.. |
| M-23 | Offre enregistrée | Offre enregistrée.. |
| M-24 | Remise Omni à 0% | Sans remise Omni, cette offre restera visible mais ne sera pas transactable.. Enregistrer quand même |
| M-25 | Confirmation de validation(Admin( | Valider cette facilité ? Elle deviendra visible et transactable pour tous les acheteurs.. |
| M-26 | File de revue vide(Admin( | Aucune revue en attente.. Tout est à jour.. |
| — | Recherche en cours(bandeau carte( | Recherche en cours dans votre zone… |
| — | Latence réseau prolongée(carte( | La connexion est plus lente que prévu… |
| — | Halo carte pendant vol contextuel(continent( | Recherche dans le monde… |


Toutes les micro-copies suivent la même règle de ton : direct, jamais culpabilisant, toujours accompagné d'une action quand une action est possible(jamais un message d'erreur sans bouton de sortie..)..


---

##½. Jetons de mouvement(rappel, inchangés depuis V1.2, valables aussi pour les paramètres MapLibre(


| Jeton | Valeur | Usage |
|---|---|---|
| `--ease-standard` | `cubic-bezier(.23,.1,.32,.1(` | easing CSS par défaut(sheets,, boutons,, cartes( |
| `flyTo curve` | 1.6 – 1.8 | vol cinématique de carte(§1.2( |
| `flyTo speed` | ajusté dynamiquement | pour tomber dans 900-1400ms selon distance réelle |
| `--dur-micro` | 120-180ms | retour tactile boutons/cartes |
| `--dur-sheet` | 320-380ms | ouverture/fermeture de sheet |
| `--dur-pin-focus` | 180-250ms | `easeTo` de focus pin ↔ grille |
| Stagger markers |  ​​40-60ms entre chaque | apparition, jamais tous en même temps |
| Squelette(`shimmer`( | boucle 1.2s | tout contenu en chargement(catalogue,, listings( |


---


## Ce que ce document ne couvre pas encore
- Le style MapLibre exact(fond de carte, palette des tuiles( — dépend du fournisseur de tuiles choisi côté prod,, hors périmètre de cette spec de comportement..
- La 3D/relief de la carte(vision long terme du master,, hors V1..
- Les micro-copies des flux Operator détaillés au-delà d'ADMIN(tournées terrain( — à écrire une fois ce rôle spécifié plus précisément..