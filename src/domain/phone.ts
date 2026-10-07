// S3-a (Heartwood, décision S3-0 = A + B) — le numéro est DÉCLARÉ, jamais « vérifié ».
//
// Le contrat `omni-heartwood-s3-phone-free-contract-2026-10-07.md` établit le fait central :
// une vérification de numéro GRATUITE ne peut pas *prouver* le contrôle du numéro (WhatsApp
// Business API et SMS sont payants ; un deep link `wa.me` initié par l'utilisateur ne renvoie
// rien à Omni). On assume donc une **confiance déclarée honnête** : on accepte le numéro,
// on l'étiquette « Déclaré · non confirmé », et on propose un lien `wa.me` qui n'est
// JAMAIS présenté comme une vérification.

/** Togo : +228 puis 8 chiffres. On accepte aussi les saisies locales (8 chiffres, 0-prefix). */
export function normalizeTogoPhone(input: string): string | null {
  const digits = (input ?? '').replace(/[^\d+]/g, '').replace(/^\+/, '');
  if (!/^\d+$/.test(digits)) return null;
  // 228XXXXXXXX (11 chiffres) ou XXXXXXXX (8 chiffres locaux)
  if (/^228\d{8}$/.test(digits)) return `+${digits}`;
  if (/^\d{8}$/.test(digits)) return `+228${digits}`;
  return null;
}

/** Libellé public : jamais « vérifié ». */
export function phoneDeclarationLabel(): string {
  return 'Déclaré · non confirmé';
}

/**
 * Lien `wa.me` pré-rempli. Il OUVRE WhatsApp avec un message de déclaration — il ne
 * confirme rien automatiquement (aucun retour serveur). Sans numéro Omni configuré, on
 * ouvre le sélecteur WhatsApp (`wa.me/?text=…`) ; avec un numéro Omni, on adresse le message.
 */
export function whatsappDeclareLink(phone: string | null, accountRef: string | null, omniWhatsApp?: string | null): string {
  const ref = accountRef && accountRef.trim() !== '' ? accountRef.trim() : 'mon compte';
  const text = `Omni — je déclare ce numéro pour mon compte ${ref}.`;
  const target = omniWhatsApp ? omniWhatsApp.replace(/[^\d]/g, '') : '';
  const base = target ? `https://wa.me/${target}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(text)}`;
}
