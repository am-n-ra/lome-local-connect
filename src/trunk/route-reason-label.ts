/**
 * RT-D1 — libellés français des raisons de non-disponibilité d'un itinéraire.
 *
 * Le serveur renvoie des codes stables et ne parle pas au nom du produit ; le
 * client possède donc la formulation. Deux familles doivent être distinguées :
 *
 *   - les codes de `data.reason` (HTTP 200, `available: false`) : le service a
 *     répondu, il a une raison produit de ne pas servir d'itinéraire ;
 *   - les codes d'`error.code` (HTTP 4xx/5xx) : la requête a été refusée AVANT
 *     tout calcul, notamment `AUTH_REQUIRED` quand le moteur est facturé.
 *
 * Oublier la seconde famille n'est pas cosmétique : sans libellé, la raison est
 * jetée et le dégradé affiche un générique trompeur (« itinéraire routier
 * indisponible ») alors que la vraie cause est « connectez-vous ». L'acheteur
 * voit une ligne droite dont il ne peut pas deviner la raison, ni comment y
 * remédier. Chaque code doit donc dire quoi faire, pas seulement ce qui manque.
 */
export function routeReasonLabel(reason: string | undefined, fallback: string | undefined): string | null {
  switch (reason) {
    case 'QUOTA_HOURLY':
      return 'vous avez atteint votre nombre d’itinéraires pour cette heure';
    case 'QUOTA_DAILY':
      return 'vous avez atteint votre nombre d’itinéraires pour la journée';
    case 'INTENT_REQUIRED':
      return 'choisissez cette offre pour en afficher l’itinéraire';
    case 'PROVIDER_NOT_CONFIGURED':
      return 'aucun service d’itinéraire n’est configuré';
    // Le moteur facturé exige une identité : c'est un état de session normal,
    // pas une panne, et la seule action utile est de se connecter.
    case 'AUTH_REQUIRED':
    case 'HTTP_401':
      return 'connectez-vous pour obtenir l’itinéraire routier';
    case 'OUT_OF_ZONE':
      return 'cette destination est hors de notre zone d’itinéraires';
    case 'PROVIDER_ERROR':
    case 'HTTP_502':
    case 'HTTP_503':
      return 'le service d’itinéraire est momentanément indisponible';
    // Distinct de PROVIDER_ERROR : le service va très bien, il n'y a pas de route.
    case 'NO_ROUTE':
      return 'aucun itinéraire routier n’est disponible pour cette destination';
    default:
      return fallback ?? null;
  }
}