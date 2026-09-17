import type { TransactionState } from './types';

/** Libellé court d'un état de transaction (FR, monochrome — pas de couleur de confiance). */
export function transactionStateLabel(state: TransactionState): string {
  switch (state) {
    case 'intent_created': return 'Intention posée';
    case 'qr_ready': return 'QR à scanner';
    case 'qr_verified': return 'Vérifiée (verrouillée)';
    case 'payment_declared': return 'Paiement déclaré';
    case 'payment_confirmed': return 'Paiement confirmé';
    case 'fulfilment_pending': return 'Exécution en cours';
    case 'fulfilled': return 'Remise faite';
    case 'received': return 'Réception à confirmer';
    case 'rated': return 'Avis donné';
    case 'closed': return 'Clôturée';
    default: return 'En cours';
  }
}

/** Qui doit agir à cette étape (affiché dans la liste « En cours »). */
export function transactionStateResponsible(state: TransactionState): 'buyer' | 'seller' | 'system' {
  switch (state) {
    case 'intent_created':
    case 'qr_ready': return 'buyer';
    case 'qr_verified':
    case 'payment_declared':
    case 'payment_confirmed':
    case 'fulfilment_pending': return 'seller';
    case 'fulfilled': return 'buyer';
    case 'received': return 'buyer';
    case 'rated':
    case 'closed': return 'system';
    default: return 'system';
  }
}

/** Âge relatif compact depuis un horodatage (ex. « il y a 12 min », « il y a 3 h », « il y a 2 j »). */
export function relativeAge(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const diff = Math.max(0, now - then);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

/** Est-ce que c'est à l'utilisateur donné d'agir ? */
export function isMyTurn(state: TransactionState, actorRole: 'buyer' | 'seller'): boolean {
  return transactionStateResponsible(state) === actorRole;
}

/** ETA + échéance par étape (FF-6) — le temps RELANCE, il n'annule jamais. */
export const STAGE_DEADLINE_MINUTES: Partial<Record<TransactionState, number>> = {
  intent_created: 10,
  qr_ready: 10,
  qr_verified: 120,
  payment_declared: 1440,
  payment_confirmed: 1440,
  fulfilment_pending: 10080,
  fulfilled: 4320,
  received: 43200,
};

/** Reste-t-il du temps (minutes) avant l'échéance, ou est-ce dépassé ? */
export function deadlineState(state: TransactionState, lastEventIso: string | null, now: number = Date.now()): { minutesLeft: number; overdue: boolean } | null {
  const limit = STAGE_DEADLINE_MINUTES[state];
  if (limit === undefined || !lastEventIso) return null;
  const then = new Date(lastEventIso).getTime();
  if (!Number.isFinite(then)) return null;
  const elapsedMin = Math.floor((now - then) / 60000);
  const minutesLeft = limit - elapsedMin;
  return { minutesLeft, overdue: minutesLeft < 0 };
}

/** Libellé compact d'un compte à rebours (ex. « 8 min », « 1 h 20 », « dépassé de 2 h »). */
export function deadlineLabel(minutesLeft: number): string {
  const overdue = minutesLeft < 0;
  const abs = Math.abs(minutesLeft);
  const human = abs < 60 ? `${abs} min` : abs < 1440 ? `${Math.floor(abs / 60)} h ${abs % 60 ? (abs % 60) + ' min' : ''}`.trim() : `${Math.floor(abs / 1440)} j`;
  return overdue ? `dépassé de ${human}` : `${human} restant`;
}

/** FF-5 — borne le TTL QR demandé sur la fenêtre 1..60 min (défaut 10). */
export function resolveQrTtlMinutes(requested: unknown): number {
  return Number.isInteger(requested) && (requested as number) > 0 && (requested as number) <= 60 ? (requested as number) : 10;
}

/** FF-5 — échéance ISO d'un QR émis, à partir de l'instant d'émission et du TTL (minutes). */
export function qrExpiryFrom(issuedAtIso: string, ttlMinutes: number): string {
  return new Date(new Date(issuedAtIso).getTime() + ttlMinutes * 60 * 1000).toISOString();
}