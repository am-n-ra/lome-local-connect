# Omni — Système de mouvement (design complet des motions)

> **Slice :** T-10t — motion system (Gate 5 Branches/UI)
> **Date :** 2026-09-05 — **Autorité visuelle :** maquette V1.3 + spécification v1.3 + retours fondateur
> **Principe directeur (fondateur) :** « l'application doit être vivante, mais toujours stable. Fils & contenus bougent, l'app ne bouge pas. »

---

## 0. Philosophie du mouvement Omni

Le mouvement Omni a **un seul job** : rendre visible les **transitions de contexte** sans jamais désorienter.
Trois règles d'or, dans l'ordre :

1. **La carte est le sol.** Elle ne bouge jamais de manière inattendue. Quand une surface monte, c'est **elle** qui se déplace au-dessus de la carte — jamais l'inverse.
2. **Le dock est le point d'ancrage.** Trois boutons, toujours au même endroit (bas, centré(. Ce qui change : ses **contenus** (icônes/labels contextuels(, pas sa position. Quand le clavier monte, ce sont les **enfants** (sheet, chips, contenu( qui montent — le dock « respire » mais ne quitte pas son ancre.
3. **Tout mouvement a une raison.** Chaque animation correspond à une transition d'état (ouverture/fermeture de surface, changement de rôle, résultat de recherche(. Pas d'animation gratuite. Respect strict de `prefers-reduced-motion`.

---

## 1. Tokens de mouvement (immuables)

| Token | Valeur | Usage |
|---|---|---|
| `--ease-omni` | `cubic-bezier(.23, 1, .32, 1)` | easing par défaut (sheets, dock, cartes, focus( |
| `--ease-expo` | `cubic-bezier(.16, 1, .3, 1)` | vols carte cinématiques (search reveal( |
| `--dur-micro` | 120–180 ms | retours tactiles (boutons, chips, cartes( |
| `--dur-sheet` | 320–380 ms | ouverture/fermeture de sheet |
| `--dur-dock` | 220–280 ms | morphisme / breathe du dock |
| `--dur-focus` | 180–250 ms | `easeTo` pin ↔ grille |
| `--dur-vol` | 900–1900 ms | séquence de recherche (calculé par distance( |
| stagger | 40–60 ms | apparition des éléments (markers, cartes, lignes( |

**Reduced motion :** tout ce qui est listé ci-dessus est **désactivé ou réduit à une simple opacité** sous `prefers-reduced-motion: reduce`.

---

## 2. Le dock — « point d'ancrage vivant »

### 2.1 Apparence
Pill noir `#111`, ombre `0 20px 48px rgba(15,15,15,.16)`, 3 contrôles : [action primaire] [action centrale 46px] [menu]. Z-index 60 (au-dessus des sheets 50 et du gradient 6(.

### 2.2 Comportements
- **Changement de contexte** : quand le dock passe d'un état à l'autre (Recherche ↔ QR/Stock/À valider(, un **morphisme doux** : le pill « respire » (`scale 1 → 1.06 → 1` en 260ms( et les icônes/labels font un léger crossfade. *(Implémenté : `navpill-morph` + `key=dockFingerprint`.*
- **Ouverture d'une sheet** : le dock fait un **recul léger** (translateY -2px + ombre renforcée( puis revient — comme si la sheet le « poussait » depuis le bas. *(À implémenter : classe `.dock-sheet-open`.*
- **Clavier ouvert** : le dock **reste ancré au-dessus du clavier** (déjà `--omni-keyboard`(, et **les enfants (sheet/chips/content( montent ensemble** avec lui — l'app (carte, role switch( ne bouge pas. *(Partiel : le dock monte ; à compléter pour que la sheet suive sans saut.*
- **Sur desktop** : le dock reste **collé en bas-centré** comme sur mobile (pas flottant haut(. *(✅ déjà.*

### 2.3 États visuels
| État | Dock | Justification |
|---|---|---|
| Carte seule | [⌕] [centre action] [≡] | action centrale = QR (buyer( / Stock (seller( / À valider (équipe( |
| Sheet ouverte | [←] [centre action] [≡] | ← retour ; centre = action contextuelle |
| Recherche | [⌕] [≡] | le champ est la surface ; dock réduit |
| Transaction verrouillée | [✕] [▦ QR] [≡] | ✕ annuler ; QR = seul avancement (pas de ←( |

---

## 3. Sheets — « surfaces flottantes ancrées en bas »

### 3.1 Principes
- **Bottom-anchored + centrées** partout (mobile et desktop( : `bottom:0; left:50%; translateX(-50%)` avec `max-width:min(100%,560px)`.
- **Arrivée** : glissement depuis le bas + `fade` (320–380ms, `--ease-omni`(, avec un léger **stagger** des enfants (40ms par ligne(.
- **Départ** : le même glissement inversé (+fade( ; jamais un `display:none` sec.

### 3.2 Morphisme sheet ↔ dock
- À l'ouverture : la sheet **monte depuis le dock** (le premier 24px de la sheet se fond avec le dock pendant 260ms( — visuellement la sheet « sort » du pill.
- À la fermeture : la sheet « rentre » dans le dock (coupe à 24px avant le bas, fondu(.
- *(Partiel : `omni-sheet-enter` existe ; le morphisme dock↔sheet réel à affiner avec `dock-sheet-open`.*

### 3.3 Fondu au scroll — « ça disparaît devant le dock »
- Quand on défile dans une sheet, le contenu ne passe **pas derrière** le dock : il **s'estompe** (mask gradient sur les 110–160px bas de la sheet( + le `omni-bottom-gradient` (blur `rgba(255,255,255,.72)( ` masque la transition entre sheet et dock.
- *(Partiel : `scroll-fade` sur la sheet + `omni-bottom-gradient` existent. À améliorer : le mask doit suivre le scroll en direct (pas figé à l'ouverture(.*

---

## 4. Séquences cinématiques (carte)

### 4.1 Recherche (= la grande séquence du fondateur(
| Étape | Caméra | Durée | Label |
|---|---|---|---|
| 0. Reset globe | `jumpTo` monde, bearing 0 | instantané | — |
| 1. Dézoom + légère rotation | `easeTo` globe zoom 1.5, rotate 8° | 400ms | « Recherche dans le monde… » |
| 2. Continent | `flyTo` zoom 3.2, curve 1.7 | 900ms | Continent |
| 3. Pays | `flyTo` zoom 5.5, curve 1.7 | 900ms | Pays |
| 4. Région | `flyTo` zoom 8.3, curve 1.7 | 900ms | Région |
| 5. Ville | `flyTo` zoom 11.5, curve 1.7 | 900ms | Ville |
| 6. Position | `flyTo` zoom 14.2 (autour de l'utilisateur( | 900ms | « Votre position » |
| 7. Framing | `cameraForBounds`(user + pins( + padding sheet | 900ms | (label masqué( |
| 8. Reveal pins | stagger 50ms, `pop-in` | 300ms | — |
| 9. Grille | la sheet glisse, APRÈS les pins | 380ms | compteur |

**Règle d'or :** la grille n'apparaît **jamais** avant la fin du vol. *(✅ implémenté : REVEAL_STEPS + reveal gating.*
**Attente réseau :** si les données ne sont pas revenues à la fin du vol → la caméra fait un léger « souffle » (±0.3 zoom, 600ms( + bandeau « Recherche en cours dans votre zone… ». *(À compléter si réseau lent.)* 

### 4.2 Synchro grille ↔ cartes
- **Défiler la grille** = **dérouler la carte** : à chaque snap d'une carte, la caméra `easeTo` sur le pin correspondant (220ms, `--dur-focus`( avec padding bas = hauteur sheet ; le pin reçoit `.focused` (anneau+scale(, les autres `.dim`.
- **Cliquer un pin** = **scroll la grille** vers la carte correspondante `scrollTo({behavior:'smooth'})` + même `easeTo`.
- **Ouverture fiche** : `easeTo` zoom +1.5 avec padding sheet bas AVANT que la sheet ne glisse (150ms de décalage( — le pin reste visible au-dessus de la sheet.
- *(✅ implémenté : `focusFacilityOnMap` + `wireGridSync` + `openFacilityAnimated`.*

---

## 5. Feedback tactile (micro-interactions)

| Élément | Comportement |
|---|---|
| Bouton/dock | `scale(.97-.9)` à l'appui (180ms( |
| Carte grille | `scale(.97)` au tap + relèvement |
| Chip contrainte | `scale(.96)` + remplissage encre |
| Pin | `pop-in` à l'apparition ; `.focused` anneau vert + scale 1.15 ; `.dim` opacité .15 |
| User marker | breathing ring 2.8s (pas d'animation sous reduced-motion( |
| Skeleton | shimmer 1.2s (toute liste en chargement( |
| Stepper | `omni-step-enter` 240ms par étape active |

---

## 6. Onboarding & conversion (paywall tôt, auth au besoin)

Le fondateur a demandé (fidèle à la V1.3 §3-4( :
- **Pas d'auth au premier écran** : la carte + les offres sont consultables librement.
- **Auth au moment du besoin** : lancer une recherche sans session → on **mémorise la requête**, on propose l'identité minimale (email/n° + code(, on **reprend la recherche automatiquement** après. *(✅ implémenté `beginSearch` + `restorePendingSearch`.*
- **Paywall tôt, pas un mur** : dans le parcours onboarding/après identité, on **présente brièvement les plans** (Free vs Pro( avec un CTA discret, jamais bloquant. L'utilisateur peut « Continuer gratuitement ».
- *(L'onboarding 3-slides `OnboardingModal` existe ; le soft paywall est dans `buyer-pro-plans`. À vérifier : le moment exact où le proposer pour maximiser la conversion sans nuire.)*

---

## 7. Règles d'accessibilité

- `prefers-reduced-motion: reduce` : on **désactive** toutes les animations (sheets, dock, cartes, stagger, gradient( — remplacées par des fondus d'opacité de 150ms ou rien.
- Pas de mouvement > 380ms sans contrôle utilisateur (les vols carte respectent `duration` raisonnable + annulables au drag/tap(.
- Les focus pins ↔ grille sont **liés à la navigation clavier** (tab sur une carte → focus pin(.
- Le `aria-label` du dock est mis à jour à chaque changement de contexte (aria-live polite sur le pill(.

---

## 8. Ce qui reste à implémenter (après audit du code(

| Comportement | État | Action |
|---|---|---|
| `navpill-morph` (morphisme dock au changement de contexte( | ✅ | — |
| `scroll-fade` (fondu fin de sheet( | ✅ | — |
| `omni-bottom-gradient` (blur devant dock( | ✅ | — |
| dock monte au clavier (`--omni-keyboard`( | ✅ | — |
| sheet remonte avec le dock au clavier (sans saut( | ✅ | vérifié : `omni-keyboard-aware` sur les sheets + dock |
| dock « breath » à l'ouverture de sheet (`dock-sheet-open`( | ✅ | ajouté (CSS `navpill-breath` + useEffect panel/options/menu( |
| mask scroll en direct (pas figé( | ✅ | ajouté (`.scrolled` togglé au scroll via rAF( |
| soft paywall dans le flux onboarding/recherche | ✅ | ajouté (OnboardingModal slide paywall + enchaînement auth( |
| gating auth recherche + reprise auto | ✅ | déjà (T-10s2( |

## 9. Définition de done (slice T-10t)

- [x] Spec motion documentée (ce fichier(
- [x] Dock « breath » à l'ouverture/fermeture de sheet
- [x] Alignement sheet+dock au clavier (pas de saut(
- [x] Mask scroll en direct sur les sheets
- [x] Soft paywall onboarding positionné au bon moment
- [x] `npm run lint`, `npm test`, `npm run build` verts
- [x] Push + hash prod === local