/**
 * CEX Health Monitor — core business logic
 *
 * Fetches exchange balances and 24hr net flows from Nansen API,
 * aggregates them into a unified health dashboard format.
 */

import { fetchCurrentBalance, fetchCounterparties } from "../api/nansen.js";
import { cacheGet, cacheSet } from "./cache.js";
import type { ExchangeHealth, TopToken, DashboardData } from "../api/types.js";

export interface ExchangeConfig {
  name: string;
  entity: string;
}

export const EXCHANGES: ExchangeConfig[] = [
  { name: "Binance", entity: "Binance" },
  { name: "Coinbase", entity: "Coinbase" },
  { name: "OKX", entity: "OKX" },
  { name: "Bybit", entity: "Bybit" },
  { name: "Kraken", entity: "Kraken" },
];

/**
 * Get health data for a single exchange
 */
export async function getExchangeHealth(
  config: ExchangeConfig,
): Promise<ExchangeHealth> {
  const cacheKey = `exchange:${config.entity}`;
  const cached = cacheGet<ExchangeHealth>(cacheKey);
  if (cached) return cached;

  try {
    // Step 1: Fetch current balances
    const balanceRes = await fetchCurrentBalance(config.entity);
    const tokens = balanceRes.data || [];

    const totalAssetsUsd = tokens.reduce((sum, t) => sum + (t.usd_value || 0), 0);

    // Top tokens by USD value
    const sorted = [...tokens].sort((a, b) => (b.usd_value || 0) - (a.usd_value || 0));
    const topTokens: TopToken[] = sorted.slice(0, 5).map((t) => ({
      symbol: t.token_symbol,
      chain: t.chain,
      usdValue: t.usd_value,
      percentage: totalAssetsUsd > 0 ? (t.usd_value / totalAssetsUsd) * 100 : 0,
    }));

    // Step 2: Calculate 24hr net flow via counterparties
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const dateTo = now.toISOString();
    const dateFrom = yesterday.toISOString();

    let totalInflows24hUsd = 0;
    let totalOutflows24hUsd = 0;

    try {
      const counterRes = await fetchCounterparties(
        config.entity,
        "all",
        dateFrom,
        dateTo,
      );
      const parties = counterRes.data || [];
      totalInflows24hUsd = parties.reduce((sum, p) => sum + (p.inflow_usd || 0), 0);
      totalOutflows24hUsd = parties.reduce((sum, p) => sum + (p.outflow_usd || 0), 0);
    } catch {
      // Counterparties may fail for some exchanges/chains — graceful fallback
    }

    const result: ExchangeHealth = {
      name: config.name,
      entity: config.entity,
      totalAssetsUsd,
      netFlow24hUsd: totalInflows24hUsd - totalOutflows24hUsd,
      totalInflows24hUsd,
      totalOutflows24hUsd,
      topTokens,
      fetchedAt: new Date().toISOString(),
    };

    cacheSet(cacheKey, result);
    return result;
  } catch (err) {
    return {
      name: config.name,
      entity: config.entity,
      totalAssetsUsd: 0,
      netFlow24hUsd: 0,
      totalInflows24hUsd: 0,
      totalOutflows24hUsd: 0,
      topTokens: [],
      fetchedAt: new Date().toISOString(),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Get health data for all configured exchanges in parallel
 */
export async function getAllExchangeHealth(): Promise<DashboardData> {
  const cacheKey = "dashboard:all";
  const cached = cacheGet<DashboardData>(cacheKey);
  if (cached) return { ...cached, cacheHit: true };

  const exchanges = await Promise.all(
    EXCHANGES.map((cfg) => getExchangeHealth(cfg)),
  );

  // Sort by total assets descending
  exchanges.sort((a, b) => b.totalAssetsUsd - a.totalAssetsUsd);

  const result: DashboardData = {
    exchanges,
    lastUpdated: new Date().toISOString(),
    cacheHit: false,
  };

  cacheSet(cacheKey, result, 60_000); // Cache full dashboard for 1 min
  return result;
}
