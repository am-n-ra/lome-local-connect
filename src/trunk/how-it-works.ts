/**
 * GUIDE-1b — « Comment ça marche » : le contenu du guide, en UNE source.
 *
 * Le fondateur (2026-10-14) : « on pourrait avoir un guide lors de onboarding pour la
 * premiere fois pour au moins montrer les elements core ». Les trois surfaces (accueil,
 * spotlight carte, surface menu) lisent CE module — jamais de texte dupliqué, jamais un
 * chiffre en dur (règle GUIDE-1a : tout dérivé à la lecture).
 *
 * Non négociable (S-31, S-28) : le guide EXPLIQUE, il ne BLOQUE jamais. Aucune étape
 * n'est un préalable ; « passer » reste toujours possible.
 *
 * Les mots de l'échelle sont ceux VERROUILLÉS par le Seed (S-06) et la maquette
 * (`EXISTENCE_LEVELS`) : le guide enseigne le mot juste, il ne le réinvente pas.
 */

import { EXISTENCE_LEVELS } from './offer-existence';

/** Les trois temps du cœur, mots du Seed (« Découvrir → Interroger → Vérifier & transiger »). */
export interface GuideMoment {
  /** Numéro d'ordre, 1..3. */
  order: number;
  /** Titre court, tel que le Seed le nomme. */
  title: string;
  /** Une phrase : ce que l'utilisateur fait, et pourquoi. */
  line: string;
}

export const GUIDE_MOMENTS: readonly GuideMoment[] = [
  {
    order: 1,
    title: 'Découvrir',
    line: 'Cherchez ce qui existe près de vous : un lieu connu, même non revendiqué, apparaît sur la carte.',
  },
  {
    order: 2,
    title: 'Interroger',
    line: 'Demandez si ça peut satisfaire votre demande maintenant. La disponibilité n’est montrée qu’une fois confirmée.',
  },
  {
    order: 3,
    title: 'Vérifier & transiger',
    line: 'Scannez le QR du vendeur : la transaction est tracée et verrouillée. Elle ne s’annule pas, elle se reprend.',
  },
];

/** Une ligne de l'échelle 0→4, lue depuis la source unique (jamais recopiée). */
export interface GuideLevel {
  level: number;
  label: string;
  hint: string;
}

/** L'échelle d'existence telle que le guide doit l'enseigner (source : `EXISTENCE_LEVELS`). */
export function guideLevels(): GuideLevel[] {
  return EXISTENCE_LEVELS.map((entry, level) => ({ level, label: entry.label, hint: entry.hint }));
}

/**
 * Ce qu'Omni ne peut PAS dire d'un lieu non revendiqué (niveau 0). Honnêteté : c'est la
 * promesse fondateur « aucune promesse de stock » (S-05). Le guide nomme les trois
 * silences pour qu'un lieu vide ne soit pas lu comme « cassé ».
 */
export const GUIDE_UNCLAIMED_SILENCE = [
  'sa disponibilité',
  'son prix',
  'ses horaires',
] as const;
