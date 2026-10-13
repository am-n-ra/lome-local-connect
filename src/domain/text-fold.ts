/**
 * Accent folding — ONE source of truth, shared by the client (place-name comparison)
 * and the server (SQL `translate` mirrors this exact map). Two copies of this map
 * would drift, and a name that folds differently on each side is a comparison bug.
 */

export const ACCENT_FOLD_FROM = 'àâäáãåçèéêëìíîïñòóôõöùúûüýÿÀÂÄÁÃÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ';
export const ACCENT_FOLD_TO = 'aaaaaaceeeeiiiinooooouuuuyyAAAAAACEEEEIIIINOOOOOUUUUY';

/** Fold accents (and lowercase) with the same map as the SQL `translate` side. */
export function foldAccents(input: string): string {
  let out = '';
  for (const ch of input.toLowerCase()) {
    const i = ACCENT_FOLD_FROM.indexOf(ch);
    out += i >= 0 ? ACCENT_FOLD_TO[i] : ch;
  }
  return out;
}
