import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { query, queryOne } from "./db.server";

export type MarketRow = {
  market_code: string;
  name: string | null;
  country_name: string;
  currency_code: string;
  currency_symbol: string;
  currency_decimals: number;
  payment_provider: string;
  languages: string[];
  community_channel_type: string | null;
  community_channel_url: string | null;
  community_channel_explanation: string | null;
  informal_certification_enabled: boolean;
  default_platform_fee_percent: number;
  default_lat: number;
  default_lng: number;
  default_zoom: number;
};

const SELECT = `
  SELECT market_code, name, country_name, currency_code, currency_symbol, currency_decimals,
         payment_provider, languages, community_channel_type, community_channel_url,
         community_channel_explanation, informal_certification_enabled,
         default_platform_fee_percent, default_lat, default_lng, default_zoom
  FROM public.markets
`;

/** Active market configuration — no currency, centre or channel is hard-coded in the UI. */
export const getMarket = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ code: z.string().max(20).optional() }).parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    if (data.code) {
      return queryOne<MarketRow>(`${SELECT} WHERE market_code = $1`, [data.code]);
    }
    return queryOne<MarketRow>(`${SELECT} WHERE active ORDER BY market_code ASC LIMIT 1`);
  });

export const listMarkets = createServerFn({ method: "GET" }).handler(async () =>
  query<MarketRow>(`${SELECT} WHERE active ORDER BY market_code ASC`),
);
