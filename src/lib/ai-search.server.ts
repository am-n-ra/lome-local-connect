/**
 * Multimodal search helpers (voice + photo).
 *
 * Groq is used first when GROQ_API_KEY is configured (free tier, very cheap,
 * independent of Lovable Cloud). The Lovable AI gateway is the fallback so the
 * feature keeps working without any extra key.
 */

const GROQ_BASE = "https://api.groq.com/openai/v1";
const LOVABLE_BASE = "https://ai.gateway.lovable.dev/v1";

const LANGUAGE_HINT =
  "Le locuteur parle français, éwé ou mina (Togo). Transcris fidèlement, puis donne uniquement " +
  "les mots-clés du produit ou commerce recherché, en français, sans phrase d'introduction.";

function b64ToBytes(base64: string): Uint8Array {
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

function extFor(mime: string): string {
  const map: Record<string, string> = {
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/webm": "webm",
    "audio/mp4": "mp4",
    "audio/mpeg": "mp3",
    "audio/ogg": "ogg",
  };
  return map[mime.split(";")[0] ?? ""] ?? "wav";
}

async function groqTranscribe(key: string, bytes: Uint8Array, mime: string): Promise<string> {
  const form = new FormData();
  form.append("model", "whisper-large-v3-turbo");
  form.append(
    "file",
    new Blob([bytes as unknown as BlobPart], { type: mime }),
    `voice.${extFor(mime)}`,
  );
  form.append("prompt", "Recherche de produit à Lomé, Togo. Français, éwé ou mina.");
  form.append("response_format", "json");

  const res = await fetch(`${GROQ_BASE}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  if (!res.ok) throw new Error(`groq stt ${res.status} ${await res.text().catch(() => "")}`);
  const json = (await res.json()) as { text?: string };
  return (json.text ?? "").trim();
}

async function lovableTranscribe(key: string, bytes: Uint8Array, mime: string): Promise<string> {
  const form = new FormData();
  form.append("model", "openai/gpt-4o-transcribe");
  form.append(
    "file",
    new Blob([bytes as unknown as BlobPart], { type: mime }),
    `voice.${extFor(mime)}`,
  );

  const res = await fetch(`${LOVABLE_BASE}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  if (!res.ok) throw new Error(`lovable stt ${res.status} ${await res.text().catch(() => "")}`);
  const json = (await res.json()) as { text?: string };
  return (json.text ?? "").trim();
}

/** Audio (base64) → search term in French. Falls back across providers. */
export async function transcribeSearch(base64: string, mime: string): Promise<string> {
  const bytes = b64ToBytes(base64);
  if (bytes.byteLength < 1500) throw new Error("EMPTY_AUDIO");

  const groqKey = process.env["GROQ_API_KEY"];
  const lovableKey = process.env["LOVABLE_API_KEY"];
  let raw = "";
  let lastError: unknown = null;

  if (groqKey) {
    try {
      raw = await groqTranscribe(groqKey, bytes, mime);
    } catch (error) {
      lastError = error;
    }
  }
  if (!raw && lovableKey) {
    try {
      raw = await lovableTranscribe(lovableKey, bytes, mime);
    } catch (error) {
      lastError = error;
    }
  }
  if (!raw) throw lastError ?? new Error("NO_PROVIDER");

  // Normalise éwé / mina wording into a French product keyword.
  const cleaned = await chat(
    [
      { role: "system", content: LANGUAGE_HINT },
      {
        role: "user",
        content: `Transcription brute : "${raw}". Donne uniquement les mots-clés de recherche en français (3 mots max).`,
      },
    ],
    24,
  ).catch(() => raw);

  return (cleaned || raw).replace(/^["'\s]+|["'.\s]+$/g, "").slice(0, 80);
}

type ChatMessage = { role: "system" | "user"; content: unknown };

/** Small text/vision chat call, Groq first then Lovable gateway. */
async function chat(messages: ChatMessage[], maxTokens: number, vision = false): Promise<string> {
  const groqKey = process.env["GROQ_API_KEY"];
  const lovableKey = process.env["LOVABLE_API_KEY"];

  const attempts: { url: string; key: string; model: string }[] = [];
  if (groqKey) {
    attempts.push({
      url: `${GROQ_BASE}/chat/completions`,
      key: groqKey,
      model: vision ? "meta-llama/llama-4-scout-17b-16e-instruct" : "llama-3.3-70b-versatile",
    });
  }
  if (lovableKey) {
    attempts.push({
      url: `${LOVABLE_BASE}/chat/completions`,
      key: lovableKey,
      model: "google/gemini-3.6-flash",
    });
  }

  let lastError: unknown = new Error("NO_PROVIDER");
  for (const attempt of attempts) {
    try {
      const res = await fetch(attempt.url, {
        method: "POST",
        headers: { Authorization: `Bearer ${attempt.key}`, "content-type": "application/json" },
        body: JSON.stringify({ model: attempt.model, messages, max_tokens: maxTokens }),
      });
      if (!res.ok) throw new Error(`${res.status} ${await res.text().catch(() => "")}`);
      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const text = json.choices?.[0]?.message?.content?.trim();
      if (text) return text;
      throw new Error("EMPTY_COMPLETION");
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

/** Photo (data URL) → French product keywords used as a search term. */
export async function describeSearchImage(dataUrl: string): Promise<string> {
  const text = await chat(
    [
      {
        role: "system",
        content:
          "Tu identifies le produit principal d'une photo pour une recherche de commerce à Lomé. " +
          "Réponds uniquement par 2 à 4 mots-clés en français, sans ponctuation ni phrase.",
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Quel produit dois-je chercher ?" },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
    24,
    true,
  );
  return text.replace(/^["'\s]+|["'.\s]+$/g, "").slice(0, 80);
}
