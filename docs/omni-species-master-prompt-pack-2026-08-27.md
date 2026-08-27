# Omni V2 — Species Master Prompt Pack

**Objectif :** générer les maquettes visuelles réalistes, modernes et cohérentes d’Omni avant toute nouvelle implémentation UI.

## Mode d’emploi obligatoire

Générer les images dans l’ordre. Utiliser la première image validée comme **image de référence visuelle** pour toutes les suivantes. Conserver le même langage de marque, la même densité, les mêmes rayons, la même typographie, les mêmes icônes et la même logique de surfaces. Chaque image est une maquette d’interface mobile réaliste, pas une affiche marketing et pas une capture de navigateur.

Utiliser une sortie **portrait 9:16**, idéalement 1440 × 2560 px, sans cadre de téléphone, sans navigateur et sans watermark. Les textes français placés entre guillemets doivent apparaître exactement et rester lisibles. Pour les textes secondaires non critiques, privilégier du texte lisible plutôt que du faux lorem ipsum.

## Direction artistique verrouillée : Omni World Layer

Omni est le **moteur mondial de recherche de l’offre et de la demande locale**. La carte/globe est son identité et sa landing, jamais une décoration. La direction visuelle est premium, contemporaine, calme et désirable : cartographie monochrome profonde ou ivoire selon l’état, lignes topographiques fines, pins lumineux, panneaux flottants à profondeur douce, typographie éditoriale forte pour les affirmations et sans-serif précise pour les données.

Palette : noir graphite `#101312`, ivoire chaud `#F8FAF8`, blanc `#FFFFFF`, gris brume `#E7ECE8`, vert signal `#16A66A` uniquement pour un état confirmé, ambre `#E8A226` pour ancien/à vérifier, rouge discret `#C64D4D` uniquement pour erreur/blocage. Aucun gradient néon, aucune palette marketplace générique, aucun glassmorphism excessif.

Règles de composition : carte/globe dominant sur les surfaces Buyer ; recherche comme geste principal ; sheets arrondies et généreuses ; une seule action primaire très claire ; navigation secondaire et contextuelle ; pas de dashboard Seller/Admin sur la landing ; pas de cartes produit artificiellement nombreuses ; les données de fraîcheur, quantité, budget, prix et confiance doivent rester lisibles.

Règles de mouvement à représenter visuellement : globe lent uniquement en état idle ; arrêt au toucher ou à la recherche ; ouverture de sheet par montée courte et physique ; clavier qui redimensionne le dock sans déplacer brutalement toute la scène ; respect de `prefers-reduced-motion`.

## Bloc négatif commun à ajouter à chaque prompt

`No browser chrome, no device frame, no desktop monitor, no fake lorem ipsum, no unreadable microtext, no random English UI, no invented logo, no payment success before confirmation, no public QR confused with transaction QR, no Seller/Admin controls on Buyer landing, no excessive glassmorphism, no neon gradients, no stock photography, no generic ecommerce homepage, no dense dashboard, no duplicated buttons, no distorted typography, no watermark.`

---

# A. Reference / brand DNA

## 01 — Buyer globe landing (master reference)

**Prompt :**

`High-fidelity realistic mobile app UI mockup for Omni World Layer, the world's local supply-and-demand search engine. Primary Buyer landing, portrait 9:16. A beautiful living monochrome globe/map fills most of the screen, with subtle topographic streets and a few luminous facility pins around Lomé, Togo, plus faint global arcs suggesting the world supply layer. The map is the hero and identity. Top left: exact wordmark “Omni”. Top right: quiet circular profile icon. Bottom floating search dock with exact placeholder “Rechercher un commerce, un produit…” and a single green search action. A small secondary control “Explorer” with scan icon. Over the lower map, refined editorial line: “Le monde local, à portée de recherche.” Supporting line: “Trouvez ce qui est disponible autour de vous.” No role switcher, no dashboard, no product catalogue, no forced login. Modern premium black, ivory, mist gray, restrained signal green, native rounded controls, sophisticated global-product polish. ${NEGATIVE}`

## 02 — Idle globe / empty supply state

`Use the approved Omni World Layer reference. Buyer landing in an early-network state: globe/map remains beautiful and alive but has only a few distant neutral pins and a quiet label “Le réseau se peuple”. Search dock remains dominant with “Rechercher un commerce, un produit…”. Add a calm supporting message “Commencez par chercher ce dont vous avez besoin.” Show no fake abundance. Include a subtle link “Voir les facilités non revendiquées”. Same typography, palette, surfaces, map treatment and exact French UI quality. ${NEGATIVE}`

## 03 — Location permission sheet

`Use the approved reference. Monochrome globe dimmed behind a premium bottom sheet. Exact title “Voir les offres proches de vous ?”. Copy “La localisation est facultative. Vous pouvez continuer sans la partager.” Primary button “Autoriser la localisation”, secondary “Continuer sans localisation”. Show a small location glyph, generous safe-area bottom spacing, no invasive browser permission chrome. ${NEGATIVE}`

## 04 — Location denied / recovery

`Use the approved reference. Buyer map remains usable after denial. Bottom sheet exact title “La carte reste disponible”, copy “Autorisez la localisation quand vous voudrez voir les offres proches de vous.” Buttons “Autoriser la localisation” and “Continuer sans localisation”. The design must feel respectful, not like an error. ${NEGATIVE}`

# B. Buyer search and discovery

## 05 — Search focused with keyboard

`Use the approved reference. Mobile Buyer map-first screen with search dock expanded and the on-screen keyboard visibly occupying the lower safe area without pushing the whole map violently upward. Search field focused, exact text “Riz parfumé 5 kg”, suggestion rows “Riz parfumé”, “Riz 5 kg”, “Produits autour de moi”. A compact close button and a visible clear action. Map stays partially visible above. Native, calm, direct. ${NEGATIVE}`

## 06 — Auth prompt from unauthenticated search

`Use the approved reference. Map and search results remain dimly visible behind a bottom sheet. Exact eyebrow “VOTRE RECHERCHE EST PRÊTE”. Title “Créez votre espace pour voir les offres.” Copy “Nous gardons « Riz parfumé 5 kg » et reprenons automatiquement après une connexion rapide.” Primary “Continuer avec Omni”, secondary “Explorer sans compte”. Explain identity without sounding like a generic login wall. ${NEGATIVE}`

## 07 — Auth / sign in

`Use the approved reference. Clean full-screen mobile auth page reached from a search, not a generic marketing page. Exact title “Un espace, une recherche reprise.” Inputs “Votre adresse e-mail” and “Mot de passe”. Buttons “Se connecter” and “Créer mon compte”. Small back link “Retour à la carte”. Show tiny context label “Recherche conservée : Riz parfumé 5 kg”. ${NEGATIVE}`

## 08 — Onboarding step 1, location

`Use the approved reference. Minimal guided onboarding screen, exact header “Bienvenue dans Omni”, progress “1/3”, title “Votre zone”, copy “Pour afficher les offres proches de vous.” A small map/location illustration, note “La localisation est facultative.” Sticky primary “Continuer”, secondary “Passer pour maintenant”. No role selection yet. ${NEGATIVE}`

## 09 — Onboarding step 2, preserved search

`Use the approved reference. Onboarding step “2/3”, exact title “Votre première recherche”, copy “Nous avons conservé votre recherche.” Show a refined search card with “Riz parfumé 5 kg”. Sticky primary “Continuer”, secondary “Passer pour maintenant”. Make continuity and trust visually obvious. ${NEGATIVE}`

## 10 — Onboarding step 3, launch search

`Use the approved reference. Onboarding step “3/3”, exact title “Votre espace”, copy “Retrouvez demandes, transactions et favoris.” Sticky primary “Lancer ma recherche”, secondary “Passer pour maintenant”. Include a subtle sparkle/continuity motif, never a generic app-tour carousel. ${NEGATIVE}`

## 11 — Search results over map

`Use the approved reference. Map remains primary; a rising results sheet titled “Résultats près de vous” with query “Riz parfumé 5 kg”. Filter chips “10 unités”, “Budget 10 $”, “À proximité”. Result card 1: “Omni Demo Seller Hub”, “9,50 $”, “Disponible · 10 unités”, “Observé il y a 2 min”. Result card 2: “Marché de Hanoukopé”, “9,80 $”, “Vérification nécessaire”. Add a restrained action “Vérifier plusieurs facilités · Bulk Facility”. ${NEGATIVE}`

## 12 — No results / recovery

`Use the approved reference. Buyer search state with query “Lait d’amande 1 L”, map still visible and an elegant empty sheet. Exact title “Aucun résultat exact”. Copy “Nous pouvons élargir la zone ou vérifier plusieurs facilités.” Buttons “Élargir la zone” and “Vérifier plusieurs facilités”. No fake results. ${NEGATIVE}`

## 13 — Filters / currency

`Use the approved reference. Filter sheet exact title “Affiner votre recherche”. Fields “Quantité demandée”, “Budget maximum”, “Zone”, “Devise affichée”. Show example “10 unités”, “10 $”, “Autour de moi”, “USD · selon votre localisation”. Primary “Appliquer les filtres”. Include a tiny explanation that Omni displays prices in the user’s local currency when available. ${NEGATIVE}`

## 14 — Facility and products sheet

`Use the approved reference. Map behind a large rounded facility sheet. Exact title “Omni Demo Seller Hub”, location “Lomé, Togo”, badges “Certifiée Omni” and “Unconfirmed · 2/3 ventes”. A clearly separated public QR block: “QR public de la facilité”, “Découvrir les offres, pas une transaction.” Product cards “Riz parfumé 5 kg · 9,50 $ · 10 disponibles · Donnée fraîche” and “Huile végétale 1 L · 3,20 $ · Donnée ancienne · 8 alloués”. Buttons “Vérifier la disponibilité” and “Ajouter au panier”. ${NEGATIVE}`

## 15 — Public facility QR entry

`Use the approved reference. Public QR discovery state over a dimmed map. Exact title “Découvrir cette facilité”, facility “Omni Demo Seller Hub”, badge “Offres Omni”, copy “Explorez les produits et les prix réservés Omni chez ce vendeur.” Primary “Voir les produits”, secondary “Rechercher ailleurs”. Mandatory distinction line: “QR public de la facilité — pas un QR de transaction.” No payment amount, no coupon, no transaction QR. ${NEGATIVE}`

## 16 — Manual availability request

`Use the approved reference. Buyer availability sheet exact eyebrow “DISPONIBILITÉ MANUELLE · GRATUITE”, title “Vérifier avant de bouger.” Product “Riz parfumé 5 kg”, fields “Quantité 10” and “Budget max 10 $”, badge “Donnée ancienne”, primary “Envoyer la demande”, secondary “Ajouter au panier”. Helper: “Le vendeur confirme la quantité exacte au moment de votre demande.” ${NEGATIVE}`

## 17 — Bulk Facility request

`Use the approved reference. Premium Buyer Pro sheet exact title “Voir plus. Appeler moins.” Badge “Buyer Pro · service facturé”. Quota card “842 crédits disponibles”. Request “Riz parfumé 5 kg · 10 unités · Budget 10 $”. Selection “12 facilités sélectionnées”. Cost “Cette demande : 12 crédits”. Primary “Lancer la vérification”, secondary “Acheter plus de crédits”. Explain “Les offres anciennes seront vérifiées en temps réel.” ${NEGATIVE}`

# C. Buyer intent and transaction

## 18 — Multi-product cart

`Use the approved reference. Exact title “Votre sélection”, facility context “Omni Demo Seller Hub · Lomé”. Lines “Riz parfumé 5 kg × 10 · 95,00 $” and “Huile végétale 1 L × 2 · 6,40 $”. Green line “Offre Omni incluse”. Total “101,40 $”. Warning card “Le stock Omni sera revalidé avant l’achat.” Primary “Créer mon intention”, secondary “Modifier la sélection”. ${NEGATIVE}`

## 19 — Intent created / pending verification

`Use the approved reference. Exact title “On vérifie pour vous.” Reference “Intention créée · #OMNI-4827”. Status “Vérification en attente”. Timeline “Intention créée” completed, “Vérification” active, “Je veux acheter” pending. Copy “Vous ne serez engagé qu’après vérification.” Actions “Suivre la vérification” and “Annuler l’intention”. ${NEGATIVE}`

## 20 — Verified availability decision

`Use the approved reference. Exact title “Tout est prêt pour décider.” Facility, product, price “95,00 $”, badge “Vérifié maintenant”. Question “Souhaitez-vous acheter ?”. Primary “Je veux acheter”, secondary “Pas maintenant”. Small line “Votre transaction et votre QR seront créés après confirmation.” No payment controls. ${NEGATIVE}`

## 21 — Transaction QR hub

`Use the approved reference. Exact title “Votre passage est prêt.” Large highly realistic black-and-white QR code labeled “QR de transaction”, reference “OMNI-4827”, expiry “Expire dans 28 min”, facility and total “95,00 $”. Actions “Ouvrir le chat”, “Itinéraire”, “Contacts du vendeur”. Mandatory warning: “Ce QR est lié à cette transaction et à votre coupon — ne pas confondre avec le QR public de la facilité.” ${NEGATIVE}`

## 22 — Transaction chat

`Use the approved reference. Secure transaction chat screen exact header “Chat transactionnel · OMNI-4827”. Show system messages “QR vérifié”, “Transaction rattachée à Omni Demo Seller Hub”, Buyer and Seller bubbles, attachment button, itinerary shortcut, and a quiet transaction status rail. No generic social chat chrome. ${NEGATIVE}`

## 23 — Payment and fulfilment

`Use the approved reference. Exact title “Paiement à confirmer.” Timeline “QR vérifié” completed, “Paiement” active, “Retrait / livraison” pending. Payment choices “Mobile Money”, “Carte”, “Espèces déclarées”. Primary “Déclarer le paiement”. Helper “Le vendeur confirmera le paiement dans le chat.” No success state yet. ${NEGATIVE}`

## 24 — Received, rating and closed

`Use the approved reference. Exact title “Achat reçu. Merci à vous.” Status “Transaction clôturée”. Facility and total visible. Section “Votre avis est requis”, five large star controls, field “Partagez votre expérience”, primary “Publier mon avis”. Supporting line “Votre avis contribue à la confiance de cette facilité.” ${NEGATIVE}`

# D. Seller lifecycle

## 25 — Seller entry / role-aware menu

`Use the approved reference. Contextual account menu, not visible on Buyer landing. Show Buyer identity, menu rows “Mes demandes”, “Wallet & Rewards”, “Devenir vendeur”, and only if server capability exists “Espace Seller”. No Admin option for an ordinary Buyer. Exact title “Votre espace”. ${NEGATIVE}`

## 26 — Company list

`Use the approved reference. Seller workspace exact title “Mes compagnies”. Cards “Demo Seller Group · 2 facilités · 1 certifiée · 1 confirmée” and “Kegue Services · 1 facilité · En revue”. Primary “Créer une compagnie”, secondary “Ajouter une facilité”. Explicit note “Le Pro est propre à chaque facilité.” ${NEGATIVE}`

## 27 — Create company

`Use the approved reference. Guided Seller screen exact title “Donnez un nom à votre activité.” Fields “Nom de la compagnie” and “Type d’activité”. Helper “Une compagnie peut gérer plusieurs facilités.” Primary “Créer la compagnie”. ${NEGATIVE}`

## 28 — Create facility with map

`Use the approved reference. Guided stepper exact header “Créer une facilité”, progress “1 Informations · 2 Localisation · 3 Preuves · 4 Vérifier”. Fields “Nom de la facilité”, “Type de commerce”, “Adresse publique”. Large grayscale map with draggable black pin, button “Utiliser ma position”, helper “Déplacez le pin jusqu’à l’entrée réelle”. Sticky primary “Continuer”. ${NEGATIVE}`

## 29 — Claim unclaimed facility

`Use the approved reference. Public facility sheet with badge “Non revendiquée”. Exact title “Vous gérez cet endroit ?”. Copy “Revendiquer une facilité existante vous permet de gérer ses offres sans créer une fiche en double.” Primary “Revendiquer cette facilité”. Show private evidence path but no Seller catalogue controls before approval. ${NEGATIVE}`

## 30 — Claim evidence and review

`Use the approved reference. Seller claim screen exact title “Prouver votre lien avec cette facilité”. Steps “Identité”, “Preuve privée”, “Revue Omni”. Upload card “Vos preuves restent privées”. Primary “Soumettre le claim”. States must be visually ready for “En revue”, “Preuve demandée”, “Rejeté — corriger”, “Certifié”. ${NEGATIVE}`

## 31 — Certification and 3/3 progression

`Use the approved reference. Seller facility detail exact title “Omni Demo Seller Hub”. Separate badges “Certifiée Omni” and “Unconfirmed”. Large progression “Ventes vérifiées 2/3”, copy “Encore 1 vente vérifiée pour débloquer 20 $”. After the third sale variant, replace with “Confirmée · 3/3”, green success, and card “Bonus de 20 $ débloqué pour essayer Omni Pro et les services Omni”. Show no transfer-to-bank language. ${NEGATIVE}`

## 32 — Seller catalogue Free/Pro

`Use the approved reference. Exact title “Vos offres”. Facility context visible. Free state badge “5/5 Free”, product cards with edit actions, primary “Ajouter un produit”, warning “La limite Free est atteinte”, secondary “Passer Pro · 10 $ / facilité”. Create/edit state must require an Omni discount in either percentage or fixed amount. ${NEGATIVE}`

## 33 — Omni-allocated stock

`Use the approved reference. Exact title “Stock alloué à Omni.” Product card “Riz parfumé 5 kg”, “10 alloués”, timestamp “Observé il y a 2 min”, action “Modifier”. Helper “Ce stock est distinct du stock global de votre activité.” Show a Pro-only card “Réponses automatiques” with “Stock frais” condition and an amber stale state. ${NEGATIVE}`

## 34 — Seller availability queue

`Use the approved reference. Exact title “Répondre au bon moment.” Incoming request “Riz parfumé 5 kg · ×10”, Buyer, age, status “À vérifier”. Copy “Stock Omni observé il y a 14 h. Une réponse temps réel est requise.” Actions “Disponible”, “Partiel”, “Indisponible”, “Demander plus d’informations”. Separate Bulk Facility queue card. ${NEGATIVE}`

## 35 — Seller transaction / scan QR

`Use the approved reference. Exact title “Vérifier puis accompagner.” Transaction reference “OMNI-4827”. Camera scan surface labeled “Scanner le QR Buyer”, status “QR de transaction attendu”. After scan variant: “Transaction rattachée”, product, amount, actions “Confirmer le paiement”, “Ouvrir le chat”, “Marquer comme remis”. Never display the public facility QR as a transaction. ${NEGATIVE}`

## 36 — Seller Pro and 20 $ reward

`Use the approved reference. Facility-scoped Pro page exact title “Plus de capacité pour cette facilité”. Price “10 $ / mois · cette facilité”. Show Free vs Pro comparison: “5 produits” vs “Produits illimités”, “Réponses manuelles” vs “Réponses automatiques sur stock frais”. Reward card “20 $ disponibles après 3 ventes vérifiées”, CTA “Utiliser pour essayer Pro”. ${NEGATIVE}`

# E. Admin / Reviewer / system states

## 37 — Admin review queue

`Use the approved reference. Protected Admin/Reviewer workspace, not accessible from Buyer landing. Exact title “Revue Omni”, role badge “Reviewer”. Tabs “Nouvelles créations” and “Claims”. Cards with “À examiner”, evidence count and buttons “Ouvrir”. Note “Le compteur de ventes ne se modifie pas ici.” ${NEGATIVE}`

## 38 — Evidence review decision

`Use the approved reference. Exact title “Décider avec des preuves.” Private evidence viewer for a facility claim. Actions “Certifier la facilité”, “Demander une preuve”, “Rejeter avec motif”. Show audit timestamp and reviewer identity. No editing of sales count, stock or Wallet. ${NEGATIVE}`

## 39 — Admin role management

`Use the approved reference. Protected Admin screen exact title “Gestion des accès”. Rows for account, current role, actions “Attribuer operator”, “Attribuer reviewer”, “Retirer le rôle”. Show audit confirmation modal with reason required and warning “Chaque mutation est enregistrée.” No role controls for ordinary users. ${NEGATIVE}`

## 40 — Universal loading / error / retry board

`Create a polished Omni design-system board containing four realistic mobile states using the approved reference language: map loading with skeleton pins; network error “Impossible de charger la carte” with “Réessayer”; stale availability “Donnée ancienne — vérification nécessaire” with “Vérifier maintenant”; locked action “Disponible avec Buyer Pro” with “Voir Pro”. These are product states, not a collage or moodboard. ${NEGATIVE}`

## 41 — Camera denied / QR recovery

`Use the approved reference. Seller scan flow after camera permission denial. Exact title “La caméra est nécessaire pour scanner”. Copy “Vous pouvez autoriser la caméra dans les réglages ou utiliser le lien de transaction.” Buttons “Autoriser la caméra”, “Ouvrir un lien”, “Annuler”. Show no fake camera feed. ${NEGATIVE}`

## 42 — Session expired / recovery

`Use the approved reference. A transaction context remains behind a calm recovery sheet. Exact title “Votre session a expiré”. Copy “Votre recherche et votre transaction sont conservées.” Primary “Se reconnecter”, secondary “Retour au globe”. Make recovery and trust explicit. ${NEGATIVE}`

## 43 — Responsive / keyboard / reduced motion reference board

`Create a precise UI reference board showing the same Omni search dock at 320 px, 390 px, 768 px and 1280 px widths, plus a keyboard-open mobile state and a reduced-motion state. Keep the map-first hierarchy, safe areas, visible focus ring and no layout jump. Label widths clearly but keep the result as a professional design-system board, not a developer screenshot. ${NEGATIVE}`

---

# Validation checklist before returning images

| Test | Expected visual proof |
|---|---|
| Buyer-first | Chaque entrée publique commence par le globe/carte et la recherche |
| Auth continuity | Une recherche saisie avant auth est visible et reprise après onboarding |
| QR distinction | QR public = découverte ; QR transactionnel = coupon/transaction précise |
| Availability | Frais = réponse automatique possible ; ancien = vérification temps réel |
| Bulk | Service facturé au Buyer avec crédits/quotas visibles |
| Company/facility | Plusieurs compagnies et facilités ; Pro propre à chaque facilité |
| Claim/certification | Création ou claim, preuves privées, revue manuelle, statut Certified séparé |
| Trust progression | `Certified + Unconfirmed 0/3 → 1/3 → 2/3 → Confirmed 3/3` |
| Seller reward | Bonus unique de 20 $ après la troisième vente vérifiée sur cette facilité |
| Permissions | Caméra/localisation demandées contextuellement, refus récupérable |
| Roles | Seller/Admin invisibles sans capacité serveur correspondante |
| States | Loading, empty, error, retry, locked, stale, expired, cancelled et recovery présents |

## Format de retour recommandé

Renvoyer les images avec leurs numéros dans les noms de fichiers, par exemple `01-buyer-globe-landing.png`, `06-auth-prompt.png`, `31-certification-3-of-3.png`. Ne pas recadrer les écrans et ne pas ajouter de cadre de téléphone. Après réception, les images seront comparées à ce pack, enregistrées dans le registre Species, puis la maquette HTML sera réalignée uniquement après validation du fondateur.
