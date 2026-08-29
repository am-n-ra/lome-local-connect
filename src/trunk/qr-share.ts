// PR-H — écran 9 (QR vitrine): URL construction + clipboard/share helpers.
// The vitrine QR encodes the facility's public URL; « Partager » and
// « Copier le lien » must reuse exactly that URL (the same string the
// buyer scans), so the construction lives here for both the QR generator
// and the share/copy actions.

export function facilityPublicUrl(origin: string, facilityId: string): string {
  return `${origin}/?facility=${encodeURIComponent(facilityId)}`;
}

export function canNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

// Clipboard write with a graceful fallback: navigator.clipboard first
// (async, permission-gated), then a hidden-textarea execCommand copy for
// older browsers or denied permission. Returns false only when nothing
// worked — the caller must show visible French feedback in that case
// (never a silent failure).
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Permission denied or document not focused — fall through to execCommand.
    }
  }
  if (typeof document === 'undefined' || typeof document.execCommand !== 'function') return false;
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}
