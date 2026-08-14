import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMarket, type MarketRow } from "./market.functions";

type MarketContextValue = {
  market: MarketRow | null;
  loading: boolean;
  formatMoney: (cents: number) => string;
  locale: string;
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
  const fetchMarket = useServerFn(getMarket);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const row = await fetchMarket({ data: {} });
        if (active) setMarket(row);
      } catch {
        if (active) setMarket(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [fetchMarket]);

  const formatMoney = (amount: number): string => {
    if (!market) return `${amount}`;
    const decimals = market.currency_decimals ?? 0;
    const formatted = new Intl.NumberFormat(market.languages?.[0] ?? "fr", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(Math.round(amount));
    return `${formatted} ${market.currency_symbol}`;
  };

  const locale = market?.languages?.[0] ?? "fr";

  return (
    <MarketContext.Provider value={{ market, loading, formatMoney, locale }}>
      {children}
    </MarketContext.Provider>
  );
}
