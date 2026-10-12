import { X } from 'lucide-react';
import { trapDrawerFocus } from './ui-helpers';

/**
 * BRANCHES — surfaces légales minimales, en attendant la revue d'un conseil.
 *
 * Mesuré avant d'écrire : le dépôt n'avait AUCUNE page confidentialité, AUCUN
 * consentement au traitement, AUCUN moyen d'exercer les droits (accès, rectification,
 * suppression) alors que le produit collecte des données personnelles (e-mail,
 * prénom, numéro déclaré, avis, historique de transactions). C'est le premier
 * risque juridique d'Omni au regard de la loi togolaise n° 2019-014 (IPDCP) et de
 * l'exigence de consentement explicite.
 *
 * Ce que ce n'est PAS : un avis juridique, ni la politique définitive. C'est une
 * information honnête et vérifiable, étiquetée « pilote », qui dit ce qui est
 * collecté, pourquoi, et comment exercer ses droits. La version opposable doit être
 * validée par un conseil qualifié (Togo) — voir
 * `docs/nature-way/omni-branches-legal-readiness-2026-10-07.md`.
 */

/** Contact légal publié. Un seul endroit à changer si le fondateur en publie un autre. */
export const LEGAL_CONTACT = 'contact@sparkafrika.online';

export type LegalSectionId = 'confidentialite' | 'conditions' | 'mentions' | 'supprimer';

type LegalSection = { id: LegalSectionId; title: string; intro: string; rows: [string, string][]; note?: string };

export const LEGAL_SECTIONS: readonly LegalSection[] = [
  {
    id: 'confidentialite',
    title: 'Confidentialité',
    intro: "Ce qu'Omni garde, pourquoi, et pendant combien de temps.",
    rows: [
      ['Compte', 'E-mail, prénom et mot de passe (stocké chiffré).'],
      ['Numéro de téléphone', 'Optionnel, déclaré. Omni ne le présente jamais comme vérifié.'],
      ['Activité', 'Recherches, demandes de disponibilité, transactions, avis.'],
      ['Appareil', 'Données techniques minimales pour la carte et les notifications.'],
      ['Pourquoi', 'Faire fonctionner le service (trouver l’offre, confirmer la disponibilité, tracer la transaction), assurer la sécurité et le support.'],
      ['Base', 'Votre consentement, donné à la création du compte, et l’exécution du service.'],
      ['Combien de temps', 'Le temps nécessaire au service et aux obligations légales (notamment la comptabilité des transactions).'],
      ['Qui y accède', 'Omni et ses prestataires techniques (hébergement, envoi d’e-mails, paiement).'],
    ],
    note: 'Version pilote. La politique de confidentialité complète, opposable, est en cours de finalisation avec un conseil qualifié.',
  },
  {
    id: 'conditions',
    title: 'Conditions d’utilisation',
    intro: "Ce qu'Omni fait, et ce qu'Omni ne fait pas.",
    rows: [
      ['Omni met en relation', 'Omni montre où une offre existe et trace la transaction par QR.'],
      ['Omni n’est pas le vendeur', 'Le vendeur est responsable de ce qu’il publie : prix, disponibilité, légalité du bien.'],
      ['Pas de livraison', 'Omni n’exécute pas la livraison et n’est pas un service de transport.'],
      ['Paiement', 'Le portefeuille rechargeable passe par un prestataire de paiement agréé. Omni n’encaisse pas le prix des biens.'],
      ['Vérifiez avant de conclure', 'La disponibilité n’apparaît qu’une fois confirmée, jamais comme une promesse invérifiée.'],
      ['Usage acceptable', 'Pas de fraude, pas de faux avis, pas de contenu illégal.'],
    ],
    note: 'Version pilote. Les conditions complètes, opposables, sont en cours de finalisation avec un conseil qualifié.',
  },
  {
    id: 'mentions',
    title: 'Mentions légales',
    intro: 'Qui édite Omni, et sur quelles données la carte s’appuie.',
    rows: [
      ['Éditeur', `Omni, pilote à Lomé (Togo). Contact : ${LEGAL_CONTACT}.`],
      ['Hébergement', 'Infrastructure d’hébergement cloud, base de données et authentification.'],
      ['Carte', '© OpenStreetMap contributors, données sous licence ouverte (ODbL).'],
      ['Signalement', `Pour signaler un contenu ou un problème : ${LEGAL_CONTACT}.`],
    ],
  },
  {
    id: 'supprimer',
    title: 'Vos données : accès, correction, suppression',
    intro: 'Vous gardez la main sur vos données personnelles.',
    rows: [
      ['Accès et correction', 'Vos informations de compte sont visibles et modifiables depuis Compte.'],
      ['Suppression', `Vous pouvez demander la suppression de votre compte et de vos données en écrivant à ${LEGAL_CONTACT} depuis votre adresse de compte.`],
      ['Ce qui est conservé', 'Les enregistrements de transactions sont conservés le temps requis par les obligations légales et comptables, puis supprimés.'],
    ],
    note: 'La suppression automatisée depuis l’application est en cours de finalisation. En attendant, votre demande est traitée via le contact ci-dessus.',
  },
];

type LegalSheetV13Props = {
  initialSection?: LegalSectionId;
  onClose: () => void;
};

/** Une feuille, quatre sections : Confidentialité, Conditions, Mentions, Suppression. */
export function LegalSheetV13({ initialSection = 'confidentialite', onClose }: LegalSheetV13Props) {
  return (
    <section className="sheet h-mid" data-sheet="legal" role="dialog" aria-modal="false" aria-label="Informations légales" onKeyDown={trapDrawerFocus}>
      <div className="handle" />
      <div className="sheet-head">
        <div><div className="eyebrow">Informations légales · pilote</div><h1>Vos données et vos droits.</h1></div>
        <button type="button" className="sheet-close" onClick={onClose} aria-label="Fermer"><X size={15} /></button>
      </div>
      {[...LEGAL_SECTIONS].sort((a, b) => (a.id === initialSection ? -1 : b.id === initialSection ? 1 : 0)).map((section) => (
        <div className="cardbox" style={{ marginTop: 8 }} key={section.id} id={`legal-${section.id}`}>
          <b>{section.title}</b>
          <p className="tiny muted" style={{ marginTop: 4 }}>{section.intro}</p>
          {section.rows.map(([label, value]) => (
            <div className="kv" key={label} style={{ marginTop: 6 }}>
              <span>{label}</span>
              <b style={{ fontWeight: 500 }}>{value}</b>
            </div>
          ))}
          {section.note && <p className="tiny muted" style={{ marginTop: 6 }}>{section.note}</p>}
        </div>
      ))}
      <p className="tiny muted" style={{ marginTop: 10, textAlign: 'center' }}>Version pilote, susceptible d’évoluer. Elle ne remplace pas un avis juridique.</p>
    </section>
  );
}
