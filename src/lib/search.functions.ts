import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { describeSearchImage, transcribeSearch } from "./ai-search.server";

/** Voice search — accepts a base64 WAV/WebM clip, returns a French search term. */
export const transcribeSearchAudio = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        audioBase64: z.string().min(100).max(8_000_000),
        mimeType: z.string().max(60).default("audio/wav"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    try {
      const term = await transcribeSearch(data.audioBase64, data.mimeType);
      return { term, error: null as string | null };
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      return {
        term: "",
        error:
          code === "EMPTY_AUDIO"
            ? "Enregistrement trop court, réessayez."
            : "Reconnaissance vocale indisponible pour le moment.",
      };
    }
  });

/** Image search — accepts a base64 data URL photo, returns a French search term. */
export const searchTermFromImage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        imageDataUrl: z
          .string()
          .min(100)
          .max(8_000_000)
          .refine((v) => v.startsWith("data:image/"), { message: "Image invalide" }),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    try {
      const term = await describeSearchImage(data.imageDataUrl);
      return { term, error: null as string | null };
    } catch {
      return { term: "", error: "Analyse de l'image indisponible pour le moment." };
    }
  });
