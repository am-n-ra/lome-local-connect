# Omni V2 — Progression Admin & Certification

## Ring livré

Le reviewer Admin émet déjà un événement `claim_reviewed` vers l’Inbox du claimant après chaque décision. Le payload serveur contient l’outcome certifié, rejeté ou demandant davantage de preuves. Ce ring expose désormais cet outcome au client et affiche un message de reprise explicite dans l’Inbox.

| Décision Admin | Message claimant | Reprise attendue |
|---|---|---|
| `certified` | « Facilité certifiée » | Poursuivre l’activation Seller et préparer le catalogue. |
| `needs_more_evidence` | « Preuves supplémentaires demandées » | Ajouter les preuves demandées puis resoumettre le claim. |
| `rejected` | « Claim rejeté » | Consulter le motif de revue ou recommencer avec une facilité éligible. |

La séparation des responsabilités est conservée : la certification lie le compte claimant à la facilité, l’activation Seller reste une action Admin distincte, et aucune décision de certification ne modifie le Wallet, les paiements FedaPay, les QR transactionnels ou le chat privé.

## Validation

Le 27 août 2026, la suite de tests a réussi avec **151 tests sur 151**, puis le build Vercel a produit les **12 fonctions serverless** prévues et le bundle client de production. Le commit est `4318944` (`feat: explain claim review outcomes in inbox`) sur la branche `omni-v2-rebuild`.

## Limite volontaire

Ce ring ne remplace pas encore une preuve de navigation mobile sur un appareil réel. Le prochain contrôle doit vérifier les trois chemins de reprise dans l’Inbox, puis la stabilisation du clavier, de l’installation PWA et de la récupération Push sur viewport mobile.

## Références internes

- `src/server/trunk-repository.ts`
- `src/trunk/types.ts`
- `src/trunk/TrunkApp.tsx`
- `docs/transactional-handoff-progress-2026-08-27.md`
- `db/migrations/011_v2_transaction_messages.sql`

Auteur : **Manus AI**
Date : **2026-08-27**
