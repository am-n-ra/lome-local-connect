// Contextual currency for buyer-facing market prices.

export interface CurrencyDisplay {
  code: string;
  symbol: string;
  locale: string;
  decimals: number;
}

export const XOF_DISPLAY: CurrencyDisplay = {
  code: "XOF",
  symbol: "FCFA",
  locale: "fr-FR",
  decimals: 0,
};

const LOCALE_TO_CURRENCY: Record<string, CurrencyDisplay> = {
  "en-us": { code: "USD", symbol: "$", locale: "en-US", decimals: 2 },
  "en-gb": { code: "GBP", symbol: "£", locale: "en-GB", decimals: 2 },
  "en-ca": { code: "CAD", symbol: "$", locale: "en-CA", decimals: 2 },
  "fr-ca": { code: "CAD", symbol: "$", locale: "fr-CA", decimals: 2 },
   "fr-fr": { code: "EUR", symbol: "€", locale: "fr-FR", decimals:  ​​2 },
  "fr-be": { code: "EUR", symbol: "€", locale: "fr-BE", decimals:  ​​2 },
  "fr-ch": { code: "CHF", symbol: "CHF", locale: "fr-CH", decimals:  ​​2 },
  "de-de": { code: "EUR", symbol: "€", locale: "de-DE", decimals:  ​​2 },
   "de-ch": { code: "CHF", symbol: "CHF", locale: "de-CH", decimals:  ​​2 },
   "it-it": { code: "EUR", symbol: "€", locale: "it-IT", decimals:  ​​2 },
   "es-es": { code: "EUR", symbol: "€", locale: "es-ES", decimals:  ​​2 },
   "pt-pt": { code: "EUR", symbol: "€", locale: "pt-PT", decimals:  ​​2 },
   "pt-br": { code: "BRL", symbol: "R$", locale: "pt-BR", decimals:  ​​2 },
   "nl-nl": { code: "EUR", symbol: "€", locale: "nl-NL", decimals:  ​​2 },
   "en-ng": { code: "NGN", symbol: "₦", locale: "en-NG", decimals:  ​​2 },
   "ha-ng": { code: "NGN", symbol: "₦", locale: "ha-NG", decimals:  ​​2 },
   "yo-ng": { code: "NGN", symbol: "₦", locale: "yo-NG", decimals:  ​​2 },
   "ig-ng": { code: "NGN", symbol: "₦", locale: "ig-NG", decimals:  ​​2 },
   "en-gh": { code: "GHS", symbol: "GH₵", locale: "en-GH", decimals:  ​​2 },
   "en-ke": { code: "KES", symbol: "KSh", locale: "en-KE", decimals:  ​​2 },
   "sw-ke": { code: "KES", symbol: "KSh", locale: "sw-KE", decimals:  ​​2 },
   "en-za": { code: "ZAR", symbol: "R", locale: "en-ZA", decimals:  ​​2 },
   "fr-cm": { code: "XAF", symbol: "FCFA", locale: "fr-FR", decimals:  ​​0 },
   "en-cm": { code: "XAF", symbol: "FCFA", locale: "en-CM", decimals:  ​​0 },
   "fr-tg": { code: "XOF", symbol: "FCFA", locale: "fr-FR", decimals:  ​​0 },
   "fr-ci": { code: "XOF", symbol: "FCFA", locale: "fr-FR", decimals:  ​​0 },
   "fr-sn": { code: "XOF", symbol: "FCFA", locale: "fr-FR", decimals:  ​​0 },
   "fr-bj": { code: "XOF", symbol: "FCFA", locale: "fr-FR", decimals:  ​​0 },
   "fr-ml": { code: "XOF", symbol: "FCFA", locale: "fr-FR", decimals:  ​​0 },
   "fr-ne": { code: "XOF", symbol: "FCFA", locale: "fr-FR", decimals:  ​​0 },
   "fr-bf": { code: "XOF", symbol: "FCFA", locale: "fr-FR", decimals:  ​​0 },
   "fr-td": { code: "XAF", symbol: "FCFA", locale: "fr-FR", decimals:  ​​0 },
   "fr-ga": { code: "XAF", symbol: "FCFA", locale: "fr-FR", decimals:  ​​0 },
};

const REGION_FALLBACK: Record<string, CurrencyDisplay> = {
  "us": { code: "USD", symbol: "$", locale: "en-US", decimals:  ​​2 },
  "gb": { code: "GBP", symbol: "£", locale: "en-GB", decimals:  ​​2 },
   "ca": { code: "CAD", symbol: "$", locale: "en-CA", decimals:  ​​2 },
   "fr": { code: "EUR", symbol: "€", locale: "fr-FR", decimals:  ​​2 },
   "de": { code: "EUR", symbol: "€", locale: "de-DE", decimals:  ​​2 },
   "ng": { code: "NGN", symbol: "₦", locale: "en-NG", decimals:  ​​2 },
   "gh": { code: "GHS", symbol: "GH₵", locale: "en-GH", decimals:  ​​2 },
   "ke": { code: "KES", symbol: "KSh", locale: "en-KE", decimals:  ​​2 },
   "za": { code: "ZAR", symbol: "R", locale: "en-ZA", decimals:  ​​2 },
};

export function currencyForLocale(locale: string | null | undefined): CurrencyDisplay {
  if (!locale) return XOF_DISPLAY;
  const key = locale.trim().toLowerCase();
  const exact = LOCALE_TO_CURRENCY[key];
  if (exact) return exact;
  const [lang, region] = key.split(/[-_]/);
  if (region) {
    const byRegion = LOCALE_TO_CURRENCY[`${lang}-${region}`];
    if (byRegion) return byRegion;
    if (lang === "fr" && ["ci", "sn", "bj", "ml", "ne", "bf", "tg"].includes(region)) return XOF_DISPLAY;

    const regionOnly = REGION_FALLBACK[region];
    if (regionOnly) return regionOnly;

  }
  if (lang === "fr") return XOF_DISPLAY;
 return XOF_DISPLAY;
 }


/** Formats a minor-unit amount for buyer surfaces with the contextual currency. */
export function formatMarketMoney(minor: number, locale: string | null | undefined): string {
  const display = currencyForLocale(locale);
  const value = minor / 100;
  const formatted = new Intl.NumberFormat(display.locale, {
    style: "currency",
    currency: display.code,
    minimumFractionDigits: display.decimals,
    maximumFractionDigits: display.decimals,
  }).format(value);
  return formatted;
}

/** Formats an amount already in major units (e.g. FCFA francs( with the contextual currency. */
export function formatMarketAmount(amount: number, locale: string | null | undefined): string {
  const display = currencyForLocale(locale);
  const formatted = new Intl.NumberFormat(display.locale, {
    style: "currency",
    currency: display.code,
    minimumFractionDigits: display.decimals,
    maximumFractionDigits: display.decimals,
  }).format(amount);
  return formatted;
}
