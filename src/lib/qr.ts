const CODE_ALPHABET = "ACDEFGHJKLMNPQRSTUVWXYZ2345679";

/**
 * Generates a short, human-readable transaction code.
 * Ambiguous characters are intentionally excluded because sellers can use the manual fallback.
 */
export function newTransactionCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("");
}

export function isValidTransactionCode(code: string): boolean {
  return code.length === 8 && [...code].every((char) => CODE_ALPHABET.includes(char));
}

export const TRANSACTION_CODE_ALPHABET = CODE_ALPHABET;
