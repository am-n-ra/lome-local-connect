import { useCallback, useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Loader2, Star, Trash2, Video } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  createMediaUploadUrl,
  deleteMedia,
  listFacilityMedia,
  registerMedia,
  type MediaRow,
} from "@/lib/media.functions";
import { checkVideo, prepareImage, putToStorage } from "@/lib/media-client";

type Props = { facilityId: string };

/** Vendor showcase manager: photos, videos, ordering (first = vitrine). */
export function MediaManager({ facilityId }: Props) {
  const [media, setMedia] = useState<MediaRow[]>([]);
  const [busy, setBusy] = useState(false);
  const imageInput = useRef<HTMLInputElement | null>(null);
  const videoInput = useRef<HTMLInputElement | null>(null);

  const reload = useCallback(async () => {
    try {
      setMedia(await listFacilityMedia({ data: { facilityId } }));
    } catch {
      setMedia([]);
    }
  }, [facilityId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function uploadImage(file: File) {
    const { full, thumb } = await prepareImage(file);
    const signed = await createMediaUploadUrl({
      data: {
        scope: "facility",
        targetId: facilityId,
        kind: "image",
        contentType: "image/webp",
        bytes: full.size,
      },
    });
    await putToStorage(signed.uploadUrl, full, "image/webp");

    const thumbSigned = await createMediaUploadUrl({
      data: {
        scope: "facility",
        targetId: facilityId,
        kind: "image",
        contentType: "image/webp",
        bytes: thumb.size,
      },
    }).catch(() => null);
    let thumbUrl: string | null = null;
    if (thumbSigned) {
      await putToStorage(thumbSigned.uploadUrl, thumb, "image/webp");
      thumbUrl = thumbSigned.publicUrl;
    }

    await registerMedia({
      data: {
        scope: "facility",
        targetId: facilityId,
        kind: "image",
        url: signed.publicUrl,
        thumbUrl,
        storageKey: signed.key,
        bytes: full.size,
      },
    });
  }

  async function uploadVideo(file: File) {
    const duration = await checkVideo(file);
    const signed = await createMediaUploadUrl({
      data: {
        scope: "facility",
        targetId: facilityId,
        kind: "video",
        contentType: file.type,
        bytes: file.size,
        durationS: duration,
      },
    });
    await putToStorage(signed.uploadUrl, file, file.type);
    await registerMedia({
      data: {
        scope: "facility",
        targetId: facilityId,
        kind: "video",
        url: signed.publicUrl,
        storageKey: signed.key,
        bytes: file.size,
        durationS: duration,
      },
    });
  }

  async function handleFiles(files: FileList | null, kind: "image" | "video") {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        if (kind === "image") await uploadImage(file);
        else await uploadVideo(file);
      }
      toast.success("Média ajouté");
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Envoi impossible");
    } finally {
      setBusy(false);
      if (imageInput.current) imageInput.current.value = "";
      if (videoInput.current) videoInput.current.value = "";
    }
  }

  async function remove(id: string) {
    try {
      await deleteMedia({ data: { scope: "facility", id } });
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Suppression impossible");
    }
  }

  async function makeCover(id: string) {
    const ordered = [id, ...media.filter((m) => m.id !== id).map((m) => m.id)];
    try {
      const { reorderMedia } = await import("@/lib/media.functions");
      await reorderMedia({ data: { scope: "facility", targetId: facilityId, orderedIds: ordered } });
      toast.success("Vitrine mise à jour");
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action impossible");
    }
  }

  return (
    <section className="rounded-2xl border bg-card p-4">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">Vitrine & médias</h3>
          <p className="text-xs text-muted-foreground">
            6 photos et 2 vidéos maximum. Les photos sont compressées sur votre téléphone.
          </p>
        </div>
        {busy && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />}
      </header>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={busy} onClick={() => imageInput.current?.click()}>
          <ImageIcon className="mr-2 h-4 w-4" /> Ajouter des photos
        </Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => videoInput.current?.click()}>
          <Video className="mr-2 h-4 w-4" /> Ajouter une vidéo
        </Button>
        <input
          ref={imageInput}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files, "image")}
        />
        <input
          ref={videoInput}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files, "video")}
        />
      </div>

      {media.length === 0 ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Aucun média pour l'instant. La première photo devient l'image vitrine sur la carte.
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {media.map((item, index) => (
            <li key={item.id} className="group relative overflow-hidden rounded-xl border bg-muted">
              {item.kind === "image" ? (
                <img
                  src={item.thumb_url ?? item.url}
                  alt="Média du commerce"
                  loading="lazy"
                  className="aspect-square w-full object-cover"
                />
              ) : (
                <video src={item.url} muted playsInline className="aspect-square w-full object-cover" />
              )}
              {index === 0 && (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  Vitrine
                </span>
              )}
              <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between gap-1">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-7 w-7"
                  onClick={() => void makeCover(item.id)}
                  aria-label="Définir comme vitrine"
                >
                  <Star className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-7 w-7"
                  onClick={() => void remove(item.id)}
                  aria-label="Supprimer le média"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
