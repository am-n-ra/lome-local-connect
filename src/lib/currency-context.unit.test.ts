import { describe, expect, it } from "vitest";
import { XOF_DISPLAY, currencyForLocale, formatMarketMoney, formatMarketAmount } from "./currency-context";

describe("currencyForLocale", () => {
  it("keeps the Omni home market zone on XOF/FCFA", () => {
    for (const locale of ["fr-TG", "fr-CI", "fr-SN", "fr-BJ", "fr-ML"]) {
      const display = currencyForLocale(locale);
      expect(display.code).toBe("XOF");
      expect(display.symbol).toBe("FCFA");
    }
  });

  it("maps other countries to their own display currency", () => {
    expect(currencyForLocale("en-US")).toMatchObject({ code: "USD", symbol: "$" });
    expect(currencyForLocale("en-GB")).toMatchObject({ code: "GBP" });
    expect(currencyForLocale("fr-FR")).toMatchObject({ code: "EUR", symbol: "€" });
    expect(currencyForLocale("en-NG")).toMatchObject({ code: "NGN" });
    expect(currencyForLocale("en-GH")).toMatchObject({ code: "GHS" });
    expect(currencyForLocale("en-KE")).toMatchObject({ code: "KES" });
    expect(currencyForLocale("en-ZA")).toMatchObject({ code: "ZAR" });
  });

  it("falls back to XOF when the locale is unknown or absent", () => {
    expect(currencyForLocale(null)).toBe(XOF_DISPLAY);
    expect(currencyForLocale("")).toBe(XOF_DISPLAY);
    expect(currencyForLocale("xx-YY")).toBe(XOF_DISPLAY);
  });
});

describe("formatMarketMoney", () => {
  it("formats minor units with the contextual currency", () => {
    expect(formatMarketMoney(150000, "en-US")).toBe("$1,500.00");
    expect(formatMarketMoney(150000, "fr-FR")).toBe("1\u202f500,00\u00a0€");
  });
});

describe("formatMarketAmount", () => {
  it("formats major-unit amounts with the contextual currency", () => {
    expect(formatMarketAmount(15000, "en-US")).toBe("$15,000.00");
    expect(formatMarketAmount(15000, "fr-FR")).toBe("15\u202f000,00\u00a0€");
  });
});
