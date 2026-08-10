import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Mic, Search, Square } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";

import { Input } from "@/components/ui/input";
import { searchTermFromImage, transcribeSearchAudio } from "@/lib/search.functions";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
};

const BAR_COUNT = 16;

function encodeWav(chunks: Float32Array[], sampleRate: number): Blob {
  const length = chunks.reduce((n, c) => n + c.length, 0);
  const merged = new Float32Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  // Downsample to 16 kHz mono to keep uploads small.
  const target = 16000;
  const ratio = sampleRate / target;
  const outLength = Math.floor(length / ratio);
  const buffer = new ArrayBuffer(44 + outLength * 2);
  const view = new DataView(buffer);
  const writeString = (pos: number, str: string) => {
    for (let i = 0; i < str.length; i += 1) view.setUint8(pos + i, str.charCodeAt(i));
  };
  writeString(0, "RIFF");
  view.setUint32(4, 36 + outLength * 2, true);
  writeString(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, target, true);
  view.setUint32(28, target * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, outLength * 2, true);
  for (let i = 0; i < outLength; i += 1) {
    const sample = merged[Math.floor(i * ratio)] ?? 0;
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(44 + i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let i = 0; i < buffer.length; i += 1) binary += String.fromCharCode(buffer[i]!);
  return btoa(binary);
}

/** Search field with in-field voice (fr / éwé / mina) and photo search. */
export function SmartSearchBar({ value, onChange, onSubmit, placeholder }: Props) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [levels, setLevels] = useState<number[]>(() => new Array(BAR_COUNT).fill(0.08));

  const transcribe = useServerFn(transcribeSearchAudio);
  const fromImage = useServerFn(searchTermFromImage);

  const stopRef = useRef<(() => Promise<void>) | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => () => void stopRef.current?.(), []);

  async function startRecording() {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast.error("Accès au micro refusé.");
      return;
    }

    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    const processor = ctx.createScriptProcessor(4096, 1, 1);
    const chunks: Float32Array[] = [];
    processor.onaudioprocess = (e) =>
      chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
    source.connect(analyser);
    source.connect(processor);
    processor.connect(ctx.destination);

    const bins = new Uint8Array(analyser.frequencyBinCount);
    let raf = 0;
    const tick = () => {
      analyser.getByteFrequencyData(bins);
      setLevels(
        Array.from({ length: BAR_COUNT }, (_, i) => {
          const v = (bins[Math.floor((i / BAR_COUNT) * bins.length)] ?? 0) / 255;
          return Math.max(0.08, v);
        }),
      );
      raf = requestAnimationFrame(tick);
    };
    tick();

    setRecording(true);

    stopRef.current = async () => {
      stopRef.current = null;
      cancelAnimationFrame(raf);
      processor.disconnect();
      source.disconnect();
      stream.getTracks().forEach((t) => t.stop());
      const blob = encodeWav(chunks, ctx.sampleRate);
      await ctx.close().catch(() => undefined);
      setRecording(false);
      setLevels(new Array(BAR_COUNT).fill(0.08));

      if (blob.size < 4000) {
        toast.error("Enregistrement trop court, réessayez.");
        return;
      }
      setBusy(true);
      try {
        const res = await transcribe({
          data: { audioBase64: await blobToBase64(blob), mimeType: "audio/wav" },
        });
        if (res.error || !res.term) {
          toast.error(res.error ?? "Je n'ai pas compris, réessayez.");
          return;
        }
        onChange(res.term);
        onSubmit?.();
      } catch {
        toast.error("Recherche vocale indisponible.");
      } finally {
        setBusy(false);
      }
    };
  }

  async function handlePhoto(file: File) {
    if (file.size > 6_000_000) {
      toast.error("Photo trop lourde (6 Mo max).");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("read"));
        reader.readAsDataURL(file);
      });
      const res = await fromImage({ data: { imageDataUrl: dataUrl } });
      if (res.error || !res.term) {
        toast.error(res.error ?? "Produit non reconnu sur la photo.");
        return;
      }
      onChange(res.term);
      onSubmit?.();
      toast.success(`Recherche : ${res.term}`);
    } catch {
      toast.error("Analyse de l'image impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative w-full">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Que cherchez-vous ?"}
        className="pl-9 pr-20"
        aria-label="Rechercher un produit"
      />

      {recording && (
        <div className="pointer-events-none absolute inset-y-0 left-9 right-20 flex items-center gap-[3px] bg-background/95 px-1">
          {levels.map((level, i) => (
            <span
              key={i}
              className="w-[3px] rounded-full bg-primary transition-[height] duration-75"
              style={{ height: `${Math.round(level * 22 + 4)}px` }}
            />
          ))}
          <span className="ml-2 text-xs font-medium text-muted-foreground">Parlez…</span>
        </div>
      )}

      <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void handlePhoto(file);
          }}
        />
        <button
          type="button"
          aria-label="Rechercher par image"
          disabled={busy || recording}
          onClick={() => fileRef.current?.click()}
          className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
        >
          <Camera className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label={recording ? "Arrêter la dictée" : "Recherche vocale"}
          disabled={busy}
          onClick={() => (recording ? void stopRef.current?.() : void startRecording())}
          className={`rounded-full p-1.5 transition-colors disabled:opacity-40 ${
            recording
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : recording ? (
            <Square className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
