// HP-3 — borner l'attente d'une requête. Sur un réseau mobile instable (Lomé), un `fetch`
// qui ne récupère jamais laisse l'utilisateur devant « Chargement… » indéfiniment : ni erreur,
// ni reprise. Le délai transforme ce silence en message honnête et libère l'écran.
//
// Le Trade-off assumé : on borne l'ATTENTE, on n'annule pas la requête (le fournisseur reste
// payé une fois). Annuler exigerait d'injecter un `signal` dans chaque `init`, ce qui changerait
// la forme des requêtes existantes (et leurs tests) pour un gain marginal sur un fetch déjà parti.

export const REQUEST_TIMEOUT_MS = 15000;

const TIMEOUT_MESSAGE = 'Le réseau ne répond pas. Vérifiez votre connexion et réessayez.';

export class RequestTimeoutError extends Error {
  readonly code = 'REQUEST_TIMEOUT';
  readonly retryable = true;
  constructor(message: string = TIMEOUT_MESSAGE) {
    super(message);
    this.name = 'RequestTimeoutError';
  }
}

export function isRequestTimeoutError(value: unknown): value is RequestTimeoutError {
  return value instanceof RequestTimeoutError || (typeof value === 'object' && value !== null && (value as { code?: unknown }).code === 'REQUEST_TIMEOUT');
}

/**
 * Rend `promise` si elle se règle avant `timeoutMs`, sinon lève `RequestTimeoutError`.
 * Le minuteur est toujours nettoyé (pas de fuite) ; la promesse perdante reste observée par
 * `Promise.race` (donc aucun rejet non géré si elle se règle plus tard).
 */
export function raceWithTimeout<T>(promise: Promise<T>, timeoutMs: number = REQUEST_TIMEOUT_MS): Promise<T> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return promise;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new RequestTimeoutError()), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer !== undefined) clearTimeout(timer);
  });
}
