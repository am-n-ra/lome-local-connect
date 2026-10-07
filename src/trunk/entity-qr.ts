/**
 * Heartwood S1b — QR public d'entité (S-21), partagé entre le rendu vendeur et le scanner acheteur.
 *
 * Un seul payload, une seule définition : si le producteur et le décodeur divergeaient, un QR
 * scannable cesserait de résoudre. `entity` est distinct de `facility` (PublicQrScannerSheet) —
 * une entité porte des offres partout, un lieu est un des endroits où elle opère.
 */

const UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/** Payload du QR public d'entité : `<origin>/?entity=<uuid>`. L'origine vient de l'appelant
 *  (`window.location.origin`) — jamais inventée, pour que le QR encode l'hôte réellement servi. */
export function entityQrPayload(entityId: string, origin: string): string {
  const base = origin.replace(/\/+$/, '');
  return `${base}/?entity=${encodeURIComponent(entityId)}`;
}

/** Relit un id d'entité depuis un payload scanné : uuid brut, `?entity=<id>`, ou URL. */
export function parseEntityIdFromQr(payload: string): string | null {
  const text = payload.trim();
  if (!text) return null;

  if (UUID.test(text)) return text;

  try {
    const url = new URL(text);
    const param = url.searchParams.get('entity');
    if (param && UUID.test(param)) return param;
  } catch {
    const match = text.match(/(?:^|[?&])entity=([0-9a-fA-F-]{36})/);
    if (match && UUID.test(match[1])) return match[1];
  }
  return null;
}
