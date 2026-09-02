import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { FacilityMediaRow } from "@/lib/omni.functions";

/** Showcase carousel used on the facility detail page. */
export function MediaCarousel({ media }: { media: FacilityMediaRow[] }) {
  const [index, setIndex] = useState(0);
  if (media.length === 0) return null;
  const current = media[Math.min(index, media.length - 1)]!;

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-muted">
      {current.kind === "image" ? (
        <img
          src={current.url}
          alt="Photo du commerce"
          loading="lazy"
          className="aspect-[16/10] w-full object-cover"
        />
      ) : (
        <video
          src={current.url}
          className="aspect-[16/10] w-full object-cover"
          controls
          muted
          playsInline
          preload="metadata"
        />
      )}

      {media.length > 1 && (
        <>
          <Button
            size="icon"
            variant="secondary"
            aria-label="Média précédent"
            className="omni-glass absolute left-2 top-1/2 h-8 w-8 -translate-y-1/2"
            onClick={() => setIndex((i) => (i - 1 + media.length) % media.length)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            aria-label="Média suivant"
            className="omni-glass absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2"
            onClick={() => setIndex((i) => (i + 1) % media.length)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
            {media.map((m, i) => (
              <span
                key={m.id}
                className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-primary" : "bg-background/70"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
