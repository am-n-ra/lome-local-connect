# Heartwood S3 / S3-1 — Contrat « téléphone gratuit » (S-16)

> **Porte :** Heartwood OPEN · **Local Plan :** `NW-PROD-OMNI-HEARTWOOD-01`
> **Décisions fondateur :** la **méthode téléphone est gratuite** (2026-10-07) ; **S-16 confirmé** au Seed.
> **Objet :** extraire S-16 en contrat exécutable. **Ce document ne code rien** — il fixe ce qui est
> gratuit, ce qui est payant, et l'option retenue à implémenter.

## 1. Ce que le Seed engage (S-16)

> *Inscription téléphone-first (au Togo le numéro est plus courant que l'e-mail) : **email ou numéro**.
> Vérification **e-mail = OTP Neon Auth (gratuit)** ; vérification **numéro = confirmation WhatsApp
> initiée par l'utilisateur (coût ~0)**. **SMS payant exclu par défaut.***

L'exigence est **l'inscription**, pas le contact vendeur (RAC-1, déjà livré : `contact_whatsapp`
affiché après intention). Ici on parle de **créer un compte Omni avec un numéro**.

## 2. Le fait à ne pas contourner : « WhatsApp gratuit » n'est vrai que d'une façon

| Voie | Coût réel | Ce qu'elle prouve |
|---|---|---|
| **SMS OTP** | **payant** (opérateur) | le numéro est contrôlé |
| **WhatsApp Business API** (message sortant + webhook entrant) | **payant** (facturation à la conversation) | le numéro est contrôlé, automatique |
| **Lien `wa.me` initié par l'utilisateur** (deep link pré-rempli) | **0** | l'utilisateur **a accès** à ce WhatsApp — mais **pas** que ce numéro est le sien, tant qu'on ne reçoit rien |
| **Vérification par e-mail** (OTP Neon Auth) | **0** | l'e-mail est contrôlé |

**Le nœud :** « initiée par l'utilisateur » exclut par construction l'appel API sortant payant. Reste
le deep link `wa.me` — gratuit — mais il ne *ferme pas* la boucle (Omni n'a rien reçu). Donc **prouver
le contrôle du numéro est impossible gratuitement et automatiquement** : soit on paie (SMS/API), soit
on **assume une confiance déclarée**.

## 3. Options (à trancher par le fondateur — S3-0)

- **Option A — Inscription e-mail-first (gratuit, zéro nouveau)** : compte = email + mot de passe,
  vérifié par **OTP Neon Auth** (déjà en place). Le numéro est **saisi comme contact déclaré**
  (badge honnête « Non confirmé », comme RAC-1). **Aucun coût, aucune fondation neuve**, respecte
  S-16 (« email **ou** numéro »).
- **Option B — Numéro-first, contrôle **déclaré** (gratuit)** : on accepte `+228…` à l'inscription,
  on ouvre un **deep link `wa.me`** (« confirmez depuis votre WhatsApp ») **sans attendre de retour**,
  et on affiche **« Numéro déclaré »** (jamais « Vérifié »). Gratuit, honnête, mais **pas une preuve**.
- **Option C — Numéro-first vérifié (payant)** : SMS OTP ou WhatsApp Business API → **coût réel**,
  contredit « SMS payant exclu » et « ~0 coût ». **Écarté par la décision fondateur** sauf revirement.

## 4. Recommandation (à confirmer)

**Option A + B combinées** : inscription e-mail-first par défaut (gratuit, déjà là), **plus** un
champ numéro accepté avec badge **« Déclaré »** et un deep link `wa.me` d'invitation. Cela satisfait
S-16 (« email ou numéro ») **au coût zéro**, sans jamais mentir sur le niveau de vérification.

## 5. Sous-tranche S3-a (après décision S3-0)

- Champs d'inscription/onboarding : accepter `phone` (format Togo), badge **Déclaré/Non confirmé**.
- Deep link `wa.me` pré-rempli avec le code de compte, **jamais** présenté comme vérification.
- **Aucune fondation neuve** : Neon Auth (email OTP) existe ; le reste est UI + un champ.

## 6. Ce qui est prouvé / pas prouvé

- **Prouvé :** Neon Auth email OTP fonctionne (comptes réels `demo@seller.omni`, `demo@buyer.omni`) ;
  le contact WhatsApp vendeur est visible après intention (RAC-1).
- **Non prouvé :** qu'une vérification de numéro **gratuite** puisse *prouver* le contrôle du numéro —
  **c'est le fait central**, et il pousse vers une **confiance déclarée** honnête, pas vers une fausse
  « vérification ».
