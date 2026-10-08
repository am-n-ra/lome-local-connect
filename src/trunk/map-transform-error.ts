/**
 * Reconnaître une erreur de TRANSFORM de caméra MapLibre — par opposition à toute
 * autre erreur de page.
 *
 * Quand la matrice de projection devient dégénérée (globe singulier, padding qui
 * écrase la vue, centre non fini), MapLibre lève depuis son propre rendu et son
 * propre `unprojectScreenPoint`, PAS depuis nos handlers (déjà gardés). Ces lancers
 * remontent au `window.onerror` et se répètent à CHAQUE frame : c'est le « flood »
 * observé. Les reconnaître permet de re-ancrer la caméra et de couper la boucle,
 * sans jamais avaler une erreur qui n'est pas de cette classe.
 *
 * La signature est volontairement étroite : on n'agit que sur les messages que
 * MapLibre produit lui-même pour une matrice non inversible. Un `fetch` échoué, une
 * promesse rejetée métier, une erreur de composant ne matchent pas et passent.
 */

// Frames que MapLibre écrit lui-même dans le message OU la pile. On ne se fie pas au
// seul « Cannot read properties of null (reading '0') » — trop générique, il masquerait
// une vraie erreur applicative. C'est le FRAME MapLibre (`_calcMatrices`…) qui discrimine.
const TRANSFORM_FRAME_SIGNATURES = ['_calcMatrices', 'unprojectScreenPoint', 'transformMat4'];

/**
 * `text` doit contenir le message ET la pile (`error.stack`), pas seulement le message :
 * la lecture nulle générique n'est un transform error que lorsque la frame MapLibre
 * l'accompagne.
 *
 * `Invalid LngLat` n'est retenu QUE si `NaN` est présent : un `Invalid LngLat (1.2, 6.1)`
 * (coordonnée fournie invalide) n'est pas une matrice dégénérée et doit passer.
 */
export function isTransformMatrixError(text: string | null | undefined): boolean {
  if (typeof text !== 'string' || text.length === 0) return false;
  if (TRANSFORM_FRAME_SIGNATURES.some((signature) => text.includes(signature))) return true;
  return text.includes('Invalid LngLat') && text.includes('NaN');
}
