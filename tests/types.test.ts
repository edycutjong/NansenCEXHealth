import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type {
  ExchangeHealth,
  TopToken,
  DashboardData,
  BalanceToken,
  Counterparty,
} from "../src/api/types.js";

describe("API Types", () => {
  it("ExchangeHealth has all required fields", () => {
    const health: ExchangeHealth = {
      name: "Binance",
      entity: "Binance",
      totalAssetsUsd: 100_000_000_000,
      netFlow24hUsd: 500_000_000,
      totalInflows24hUsd: 1_200_000_000,
      totalOutflows24hUsd: 700_000_000,
      topTokens: [],
      fetchedAt: new Date().toISOString(),
    };
    assert.equal(health.name, "Binance");
    assert.equal(health.totalAssetsUsd, 100_000_000_000);
    assert.ok(health.netFlow24hUsd > 0);
  });

  it("TopToken represents a single holding", () => {
    const token: TopToken = {
      symbol: "BTC",
      chain: "bitcoin",
      usdValue: 50_000_000_000,
      percentage: 50,
    };
    assert.equal(token.symbol, "BTC");
    assert.equal(token.percentage, 50);
  });

  it("DashboardData aggregates exchanges", () => {
    const data: DashboardData = {
      exchanges: [],
      lastUpdated: new Date().toISOString(),
      cacheHit: false,
    };
    assert.equal(data.exchanges.length, 0);
    assert.equal(data.cacheHit, false);
  });

  it("BalanceToken matches API shape", () => {
    const token: BalanceToken = {
      token_symbol: "ETH",
      token_address: "0x0000000000000000000000000000000000000000",
      chain: "ethereum",
      balance: 1000,
      usd_value: 3_500_000,
      price_usd: 3500,
    };
    assert.equal(token.token_symbol, "ETH");
    assert.equal(token.usd_value, 3_500_000);
  });

  it("Counterparty matches API shape", () => {
    const cp: Counterparty = {
      counterparty_entity: "Coinbase",
      inflow_usd: 1_000_000,
      outflow_usd: 500_000,
      total_volume_usd: 1_500_000,
    };
    assert.equal(cp.counterparty_entity, "Coinbase");
    assert.equal(cp.inflow_usd - cp.outflow_usd, 500_000);
  });
});
