# Preuve — itinéraires routiers Omni (2026-09-17)

**Mission :** corrige la qualité d'itinéraire (« aussi parfait que Google Maps »).
**Handoff :** `HO-OMNI-18` · **Commit :** `fa524f3`
**Statut :** mécanisme livré et prouvé de bout en bout ; **activation en production
conditionnée à une décision fournisseur** (RT-D1).

## 1. La ligne droite était une régression, pas un manque

`src/components/omni/CartePage.tsx` et `src/routes/fiche.$id.tsx` appelaient OSRM
(`overview=full&geometries=geojson&steps=true`) et affichaient un vrai
turn-by-turn. `src/main.tsx` ne monte que `TrunkAppV13` : ces deux fichiers sont
**du code mort**. Le tronc a donc perdu un routage qui fonctionnait et l'a
remplacé par une ligne droite haversine.

## 2. Écart mesuré : la ligne droite sous-estime de +12 % à +38 %

Cinq trajets réels de Lomé, mesurés contre un moteur routier :

| Trajet | Ligne droite | Route | Rapport |
|---|---|---|---|
| Adawlato → Tokoin | 3,90 km | 5,39 km | 1,38× |
| Grand Marché → Bè | 6,05 km | 6,76 km | 1,12× |
| Baguida → Port | 5,81 km | 7,56 km | 1,30× |
| Agoè → Adidogomé | 3,99 km | 5,41 km | 1,36× |
| Boulevard 13 → Kodjoviakopé | 3,73 km | 4,57 km | 1,23× |

Moyenne **1,28×**. La valeur affichée avant correction était donc fausse d'environ
un quart sur chaque trajet.

## 3. Preuve de bout en bout (réponse fournisseur réelle)

Exécution du handler complet (`handleApi` → adaptateur → fournisseur), trajet
Adawlato → Tokoin, avec un endpoint routier réel configuré :

```
status: 200
available: true | provider: osrm | profile: driving
distance: 5,4 km | duration: 6 min
geometry points: 181
first coord: [1.213782,6.131494] last: [1.222607,6.165502]
steps: 8
   - Partez (34 m)
   - Tournez à droite sur Boulevard du 13 Janvier (1084 m)
   - Au rond-point, continuez sur Boulevard du 13 Janvier (53 m)
   - Continuez sur Boulevard du 13 Janvier (751 m)
   - Tournez à gauche sur Avenue Maman N'Danida (1480 m)
```

181 points de géométrie et 8 instructions avec de **vraies rues de Lomé**. Le
mécanisme produit bien un itinéraire de classe Google Maps.

## 4. Les trois comportements face à l'imprévu (vérifiés en production)

| Cas | Réponse prod | Pourquoi c'est correct |
|---|---|---|
| Coordonnées absentes | **400** `INVALID_INPUT` | Corrige un bug réel : `Number(null)` vaut `0`, donc la requête partait de 0,0 |
| Fournisseur non configuré | **200** `available:false` `PROVIDER_NOT_CONFIGURED` | Honnête, et le client garde son repli **étiqueté** `tracé direct` |
| Destination hors zone (Ghana réel) | **200** `available:false` `OUT_OF_ZONE` | 17 facilités en base ont une longitude < 0 ; on refuse au lieu de router faux |

## 5. Frontière de sécurité (preuve sur le bundle)

| Contrôle | Résultat |
|---|---|
| `router.project-osrm.org` dans le bundle client | **0** |
| `OSRM_BASE_URL` dans le bundle client | **0** |
| `route/v1` dans le bundle client | **0** |
| Proxy `/api/v2/public/routing` dans le bundle client | 1 |
| Adaptateur dans le bundle serverless (`api/v2/availability.js`) | 1 |

Aucune URL ni clé fournisseur n'atteint le navigateur. L'endpoint de démo
public n'est **jamais** utilisé en repli : sa politique n'autorise qu'un usage
raisonnable non commercial à ≤ 1 req/s.

## 6. Tests et falsification

- **545 tests** passent (523 avant), `tsc` propre, frontière client propre.
- **Falsification 1 :** neutraliser la garde de zone ou la garde de
  configuration fait **échouer 2 tests**.
- **Falsification 2 :** élargir la zone au monde entier (comportement d'avant,
  sans périmètre) fait **échouer 2 tests**.
- **Falsification 3 :** revenir à `numberParam` (le bug 0,0) fait **échouer
  3 tests**.

## 7. Ce qui reste bloqué, et sur qui

| ID | Décision | Owner | Pourquoi OpenHands ne peut pas la prendre seul |
|---|---|---|---|
| RT-D1 | Fournisseur de routage + budget, puis définir `OSRM_BASE_URL` | fondateur | Créer un compte et engager une dépense récurrente dépasse mon autorité |
| RT-D2 | Sort des 17 facilités hors zone (masquer / marquer / supprimer) | fondateur | Choisir entre supprimer de la donnée et la garder visible est une décision produit |

Tant que RT-D1 n'est pas tranchée, l'itinéraire reste **honnêtement étiqueté**
`tracé direct` : aucune fausse promesse n'est faite à l'utilisateur.

## 8. Ce que je ne prétends pas

- Je ne prétends pas égaler Google Maps : le trafic temps réel, le reroutage
  dynamique et la qualité de géocodage ne viennent pas de l'open data.
- Je ne prétends pas que la production route aujourd'hui : elle répond
  `PROVIDER_NOT_CONFIGURED`, ce qui est exact.
- Je ne prétends pas que la couverture d'adresses (2,9 % des facilités) soit
  réparée : c'est une dette de données distincte, documentée séparément.