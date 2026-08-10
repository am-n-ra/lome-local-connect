/**
 * Browser-side media preparation: images are resized and re-encoded to WebP
 * before upload so nothing heavy ever leaves the phone.
 */

export const MAX_IMAGE_EDGE = 1600;
export const THUMB_EDGE = 480;
export const IMAGE_QUALITY = 0.8;
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024;
export const MAX_VIDEO_SECONDS = 60;

function loadBitmap(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image illisible."));
    };
    img.src = url;
  });
}

function drawToBlob(img: HTMLImageElement, maxEdge: number): Promise<Blob> {
  const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Compression indisponible sur cet appareil.");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Compression échouée."))),
      "image/webp",
      IMAGE_QUALITY,
    );
  });
}

export type PreparedImage = { full: Blob; thumb: Blob };

/** Resizes to a display copy plus a small thumbnail, both WebP. */
export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!file.type.startsWith("image/")) throw new Error("Ce fichier n'est pas une image.");
  const img = await loadBitmap(file);
  const [full, thumb] = await Promise.all([
    drawToBlob(img, MAX_IMAGE_EDGE),
    drawToBlob(img, THUMB_EDGE),
  ]);
  return { full, thumb };
}

/** Reads a video duration without uploading it. */
export function videoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Math.round(video.duration || 0));
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Vidéo illisible."));
    };
    video.src = url;
  });
}

export async function checkVideo(file: File): Promise<number> {
  if (!file.type.startsWith("video/")) throw new Error("Ce fichier n'est pas une vidéo.");
  if (file.size > MAX_VIDEO_BYTES)
    throw new Error("Vidéo trop lourde : 25 Mo maximum. Filmez plus court ou en qualité inférieure.");
  const duration = await videoDuration(file);
  if (duration > MAX_VIDEO_SECONDS)
    throw new Error("Vidéo trop longue : 60 secondes maximum.");
  return duration;
}

/** Uploads a blob to the presigned R2 URL. */
export async function putToStorage(uploadUrl: string, blob: Blob, contentType: string) {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "content-type": contentType },
    body: blob,
  });
  if (!response.ok) throw new Error("Envoi du fichier impossible.");
}
