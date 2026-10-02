import { describe, expect, it, vi } from 'vitest';
import { pickFrenchVoice, speakRoute, stopRouteVoice, voiceCapability } from './route-voice';

function voice(lang: string): SpeechSynthesisVoice {
  return { lang } as unknown as SpeechSynthesisVoice;
}

function utterance(text: string): SpeechSynthesisUtterance {
  return { text, lang: '', rate: 1, voice: null, onend: null } as unknown as SpeechSynthesisUtterance;
}

describe('route voice contract (RT-4)', () => {
  it('prefers an fr-FR voice, falls back to any French voice, never invents one', () => {
    expect(pickFrenchVoice([voice('en-US'), voice('fr-FR'), voice('fr-CA')])?.lang).toBe('fr-FR');
    expect(pickFrenchVoice([voice('en-US'), voice('fr-CA')])?.lang).toBe('fr-CA');
    expect(pickFrenchVoice([voice('en-US'), voice('de-DE')])).toBeNull();
    expect(pickFrenchVoice([])).toBeNull();
  });

  it('names the capability honestly: FR ready, other ready, or unsupported', () => {
    const synth = { getVoices: () => [] };
    expect(voiceCapability(synth, [voice('fr-FR')])).toBe('ready-fr');
    expect(voiceCapability(synth, [voice('en-US')])).toBe('ready-other');
    expect(voiceCapability(null, [])).toBe('unsupported');
    expect(voiceCapability(undefined, [])).toBe('unsupported');
  });

  it('speaks summary plus steps in French after cancelling overlap, once', () => {
    const synth = { cancel: vi.fn(), speak: vi.fn() };
    const onEnd = vi.fn();
    const handle = speakRoute(synth, {
      summary: 'Itinéraire vers Marché : 1,2 km, 5 min',
      steps: ['Tournez à gauche', '  ', 'Arrivée à destination'],
      voice: voice('fr-FR'),
      utteranceFactory: utterance,
      onEnd,
    });
    expect(handle).not.toBeNull();
    expect(synth.cancel).toHaveBeenCalledTimes(1);
    expect(synth.speak).toHaveBeenCalledTimes(1);
    const said = synth.speak.mock.calls[0][0] as unknown as { lang: string; text: string; onend: (() => void) | null };
    expect(said.lang).toBe('fr-FR');
    expect(said.text).toContain('Itinéraire vers Marché');
    expect(said.text).toContain('Tournez à gauche');
    expect(said.text).not.toContain('  ');
    said.onend?.();
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('says nothing honest on no engine, no text, or a sick engine', () => {
    expect(speakRoute(null, { summary: 'x', steps: [], voice: null, utteranceFactory: utterance })).toBeNull();
    const synth = { cancel: vi.fn(), speak: vi.fn() };
    expect(speakRoute(synth, { summary: '   ', steps: [], voice: null, utteranceFactory: utterance })).toBeNull();
    expect(synth.speak).not.toHaveBeenCalled();
    const sick = { cancel: vi.fn(() => { throw new Error('sick'); }), speak: vi.fn() };
    expect(speakRoute(sick, { summary: 'x', steps: [], voice: null, utteranceFactory: utterance })).toBeNull();
  });

  it('stops without throwing, even on a missing or sick engine', () => {
    expect(() => stopRouteVoice(null)).not.toThrow();
    const sick = { cancel: vi.fn(() => { throw new Error('sick'); }) };
    expect(() => stopRouteVoice(sick)).not.toThrow();
    const handle = speakRoute({ cancel: vi.fn(), speak: vi.fn() }, { summary: 'x', steps: [], voice: null, utteranceFactory: utterance });
    expect(() => handle?.stop()).not.toThrow();
  });
});
