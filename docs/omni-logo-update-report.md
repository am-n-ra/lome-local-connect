# Mise à jour du logo Omni

## Source et intégration

Le fichier fourni par l’utilisateur correspond déjà exactement à `src/assets/omni-logo.png`, utilisé par le composant partagé `BrandMark`. Les surfaces onboarding et les autres usages UI de `BrandMark` utilisent donc le nouveau symbole Omni sans modification de la carte, du globe ou des contrats métier.

Les trois assets publics ont été régénérés depuis cette source, avec des dimensions adaptées à leur usage : `public/favicon.png` en 192×192, `public/pwa-icon-192.png` en 192×192 et `public/pwa-icon-512.png` en 512×512. Le manifest, le favicon global, le lien Apple Touch et la redirection favicon serveur continuent de pointer vers ces chemins stables.

## Preuve production

La page `/onboarding` déployée affiche le symbole Omni dans la marque `OmniView`. La vérification DOM production a confirmé :

| Élément | Référence constatée |
| --- | --- |
| Logo UI | `/assets/omni-logo-D2pwBZcD.png` avec `alt="Omni logo"` |
| Favicon | `/favicon.png` |
| Manifest PWA | `/manifest.webmanifest` |
| Apple Touch Icon | `/pwa-icon-192.png` |

La preuve a été obtenue en lecture seule après le déploiement `9781fb5`. Les captures et le code confirment que le nouveau logo est visible dans l’onboarding et que les références web/PWA sont cohérentes.

## Limite

La capture production confirme le rendu DOM et visuel de la page onboarding, mais l’icône exacte affichée par le shell OS après installation PWA doit toujours être vérifiée sur un appareil réel, car les navigateurs peuvent conserver une ancienne icône en cache jusqu’à une nouvelle installation ou un rafraîchissement du manifest.
