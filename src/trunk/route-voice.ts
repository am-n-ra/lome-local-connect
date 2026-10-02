/**
 * RT-4 — guidage vocal d'itinéraire, coût 0 (Web Speech API, voix de l'appareil).
 *
 * Règles honnêtes, non négociables :
 * - JAMAIS d'autoplay : la parole part d'un geste utilisateur explicite (bouton Écouter),
 *   ce que les politiques autoplay des navigateurs exigent de toute façon.
 * - JAMAIS de guidage en mouvement promis : pas de suivi GPS étape par étape ici —
 *   on LIT l'itinéraire (résumé + instructions du fournisseur), à consulter avant de partir.
 *   La dispo d'une voix FR sur Android réel est NON prouvée (essai appareil requis) :
 *   sans voix FR on lit quand même (voix standard) EN LE DISANT, on ne se tait pas.
 * - Ce module ne touche aucun global à l'import : `speechSynthesis` est injecté (tests,
 *   absence d'API). Un moteur malade ne lève jamais — `speakRoute` rend `null`.
 */

export type VoiceCapability = 'ready-fr' | 'ready-other' | 'unsupported';

export interface RouteVoiceHandle {
  stop(): void;
}

export function pickFrenchVoice(voices: readonly SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  return (
    voices.find((voice) => voice.lang.toLowerCase() === 'fr-fr') ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith('fr')) ??
    null
  );
}

export function voiceCapability(
  synth: Pick<SpeechSynthesis, 'getVoices'> | null | undefined,
  voices: readonly SpeechSynthesisVoice[],
): VoiceCapability {
  if (!synth) return 'unsupported';
  try {
    void synth.getVoices;
  } catch {
    return 'unsupported';
  }
  return pickFrenchVoice(voices) ? 'ready-fr' : 'ready-other';
}

export function speakRoute(
  synth: Pick<SpeechSynthesis, 'cancel' | 'speak'> | null | undefined,
  input: {
    summary: string;
    steps: readonly string[];
    voice: SpeechSynthesisVoice | null;
    rate?: number;
    onEnd?: () => void;
    /** Injecté en test : `SpeechSynthesisUtterance` n'existe pas hors navigateur. */
    utteranceFactory?: (text: string) => SpeechSynthesisUtterance;
  },
): RouteVoiceHandle | null {
  if (!synth) return null;
  const lines = [input.summary.trim(), ...input.steps.map((step) => step.trim()).filter(Boolean)];
  const text = lines.filter(Boolean).join('. ');
  if (!text) return null;
  try {
    synth.cancel();
    const create = input.utteranceFactory ?? ((spoken: string) => new SpeechSynthesisUtterance(spoken));
    const utterance = create(text);
    utterance.lang = 'fr-FR';
    utterance.rate = input.rate ?? 1;
    if (input.voice) utterance.voice = input.voice;
    if (input.onEnd) utterance.onend = () => input.onEnd?.();
    synth.speak(utterance as SpeechSynthesisUtterance);
    return { stop: () => { try { synth.cancel(); } catch { /* already stopped */ } } };
  } catch {
    return null;
  }
}

export function stopRouteVoice(
  synth: Pick<SpeechSynthesis, 'cancel'> | null | undefined,
): void {
  if (!synth) return;
  try {
    synth.cancel();
  } catch { /* already stopped */ }
}
