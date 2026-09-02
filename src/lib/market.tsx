import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getMarket, type MarketRow } from "./market.functions";

type MarketContextValue = {
  market: MarketRow | null;
  loading: boolean;
  formatMoney: (cents: number) => string;
  locale: string;
};

const DEFAULT_MARKET: MarketRow = {
  market_code: "TG-LOME",
  name: "Grand Lomé",
  country_name: "Togo",
  currency_code: "XOF",
  currency_symbol: "FCFA",
  currency_decimals: 0,
  payment_provider: "fedapay",
  languages: ["fr", "en"],
  community_channel_type: null,
  community_channel_url: null,
  community_channel_explanation: null,
  informal_certification_enabled: true,
  default_platform_fee_percent: 2,
  default_lat: 6.1725,
  default_lng: 1.2314,
  default_zoom: 12.2,
};

const MarketContext = createContext<MarketContextValue>({
  market: null,
  loading: true,
  formatMoney: (n) => `${n}`,
  locale: "fr",
});

export function useMarket() {
  return useContext(MarketContext);
}

export function MarketProvider({ children }: { children: ReactNode }) {
  const [market, setMarket] = useState<MarketRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const row = await getMarket({ data: {} });
        if (active) setMarket(row ?? DEFAULT_MARKET);
      } catch {
        if (active) setMarket(DEFAULT_MARKET);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const formatMoney = (amount: number): string => {
    const m = market ?? DEFAULT_MARKET;
    const decimals = m.currency_decimals ?? 0;
    const formatted = new Intl.NumberFormat(m.languages?.[0] ?? "fr", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(Math.round(amount));
    return `${formatted} ${m.currency_symbol}`;
  };

  const locale = (market ?? DEFAULT_MARKET).languages?.[0] ?? "fr";

  return (
    <MarketContext.Provider value={{ market: market ?? DEFAULT_MARKET, loading, formatMoney, locale }}>
      {children}
    </MarketContext.Provider>
  );
}
