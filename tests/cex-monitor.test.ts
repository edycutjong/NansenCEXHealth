import { describe, it, mock, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { EXCHANGES, getExchangeHealth, getAllExchangeHealth } from "../src/services/cex-monitor.js";
import * as cacheService from "../src/services/cache.js";

describe("CEX Monitor", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NANSEN_API_KEY = "test-key";
  });

  afterEach(() => {
    process.env = originalEnv;
    mock.restoreAll();
    cacheService.cacheClear();
  });

  describe("Exchange Configuration", () => {
    it("has 5 exchanges configured", () => {
      assert.equal(EXCHANGES.length, 5);
    });

    it("includes the major exchanges", () => {
      const names = EXCHANGES.map((e) => e.name);
      assert.ok(names.includes("Binance"));
      assert.ok(names.includes("Coinbase"));
      assert.ok(names.includes("OKX"));
      assert.ok(names.includes("Bybit"));
      assert.ok(names.includes("Kraken"));
    });

    it("each exchange has name and entity fields", () => {
      for (const ex of EXCHANGES) {
        assert.ok(ex.name, `Missing name for exchange`);
        assert.ok(ex.entity, `Missing entity for ${ex.name}`);
        assert.equal(typeof ex.name, "string");
        assert.equal(typeof ex.entity, "string");
      }
    });

    it("exchange names are unique", () => {
      const names = EXCHANGES.map((e) => e.name);
      const unique = new Set(names);
      assert.equal(unique.size, names.length, "Duplicate exchange names found");
    });
  });

  describe("getExchangeHealth", () => {
    it("returns cached data if available", async () => {
      cacheService.cacheSet("exchange:Binance", { name: "Binance Cached", entity: "Binance" });
      const result = await getExchangeHealth(EXCHANGES[0]);
      assert.equal(result.name, "Binance Cached");
    });

    it("fetches and computes exchange health", async () => {
      mock.method(global, "fetch", async (url: any) => {
        if (url.toString().includes("current-balance")) {
          return {
            ok: true,
            json: async () => ({
              data: [
                { token_symbol: "BTC", usd_value: 60000 },
                { token_symbol: "ETH", usd_value: 40000 }
              ]
            })
          };
        } else if (url.toString().includes("counterparties")) {
          return {
            ok: true,
            json: async () => ({
              data: [
                { inflow_usd: 1000, outflow_usd: 500 }
              ]
            })
          };
        }
      });

      const result = await getExchangeHealth(EXCHANGES[0]);
      
      assert.equal(result.name, "Binance");
      assert.equal(result.totalAssetsUsd, 100000);
      assert.equal(result.netFlow24hUsd, 500);
      assert.equal(result.totalInflows24hUsd, 1000);
      assert.equal(result.totalOutflows24hUsd, 500);
      assert.equal(result.topTokens.length, 2);
      assert.equal(result.topTokens[0].symbol, "BTC");
      assert.equal(result.topTokens[0].percentage, 60);
      assert.equal(result.topTokens[1].symbol, "ETH");
      assert.equal(result.topTokens[1].percentage, 40);
    });

    it("handles counterparties API failure gracefully", async () => {
      mock.method(global, "fetch", async (url: any) => {
        if (url.toString().includes("current-balance")) {
          return {
            ok: true,
            json: async () => ({
              data: [{ token_symbol: "BTC", usd_value: 60000 }]
            })
          };
        } else if (url.toString().includes("counterparties")) {
          return {
            ok: false,
            status: 500,
            text: async () => "Error"
          };
        }
      });

      const result = await getExchangeHealth(EXCHANGES[0]);
      
      assert.equal(result.totalAssetsUsd, 60000);
      assert.equal(result.netFlow24hUsd, 0);
      assert.equal(result.totalInflows24hUsd, 0);
      assert.equal(result.totalOutflows24hUsd, 0);
    });

    it("returns error state on balance API failure", async () => {
      mock.method(global, "fetch", async (url: any) => {
        if (url.toString().includes("current-balance")) {
          return {
            ok: false,
            status: 500,
            text: async () => "API Error"
          };
        }
      });

      const result = await getExchangeHealth(EXCHANGES[0]);
      
      assert.equal(result.totalAssetsUsd, 0);
      assert.ok(result.error?.includes("API Error"));
    });

    it("handles missing data arrays and default fallbacks", async () => {
      mock.method(global, "fetch", async (url: any) => {
        if (url.toString().includes("current-balance")) {
          return {
            ok: true,
            json: async () => ({
              data: [
                { token_symbol: "ZERO" }, // missing usd_value
                { token_symbol: "ZERO2", usd_value: 0 }
              ]
            })
          };
        } else if (url.toString().includes("counterparties")) {
          return {
            ok: true,
            json: async () => ({
              // empty response (data is undefined)
            })
          };
        }
      });

      const result = await getExchangeHealth(EXCHANGES[0]);
      assert.equal(result.totalAssetsUsd, 0);
      assert.equal(result.topTokens[0].percentage, 0);
      assert.equal(result.totalInflows24hUsd, 0);
    });

    it("handles undefined top-level data and undefined inflow/outflow", async () => {
      mock.method(global, "fetch", async (url: any) => {
        if (url.toString().includes("current-balance")) {
          return {
            ok: true,
            json: async () => ({}) // missing data array
          };
        } else if (url.toString().includes("counterparties")) {
          return {
            ok: true,
            json: async () => ({
              data: [
                { inflow_usd: undefined, outflow_usd: undefined }
              ]
            })
          };
        }
      });

      const result = await getExchangeHealth(EXCHANGES[0]);
      assert.equal(result.totalAssetsUsd, 0);
      assert.equal(result.totalInflows24hUsd, 0);
      assert.equal(result.totalOutflows24hUsd, 0);
    });

    it("handles non-Error thrown exceptions", async () => {
      mock.method(global, "fetch", async () => {
        throw "String Error";
      });

      const result = await getExchangeHealth(EXCHANGES[0]);
      assert.ok(result.error?.includes("String Error"));
    });
  });

  describe("getAllExchangeHealth", () => {
    it("returns cached dashboard if available", async () => {
      cacheService.cacheSet("dashboard:all", { exchanges: [{ name: "Mocked Dashboard" }] });
      const result = await getAllExchangeHealth();
      assert.equal(result.cacheHit, true);
      assert.equal(result.exchanges[0].name, "Mocked Dashboard");
    });

    it("aggregates and sorts multiple exchanges", async () => {
      mock.method(global, "fetch", async (url: any, options: any) => {
        const body = JSON.parse(options.body);
        if (url.toString().includes("current-balance")) {
          if (body.entity_name === "Binance") return { ok: true, json: async () => ({ data: [{ usd_value: 200000 }] }) };
          if (body.entity_name === "Coinbase") return { ok: true, json: async () => ({ data: [{ usd_value: 300000 }] }) };
          return { ok: true, json: async () => ({ data: [{ usd_value: 100000 }] }) };
        } else {
          return { ok: true, json: async () => ({ data: [] }) };
        }
      });

      const result = await getAllExchangeHealth();
      
      assert.equal(result.cacheHit, false);
      assert.equal(result.exchanges.length, 5);
      
      // Should be sorted by totalAssetsUsd descending
      assert.equal(result.exchanges[0].name, "Coinbase");
      assert.equal(result.exchanges[0].totalAssetsUsd, 300000);
      assert.equal(result.exchanges[1].name, "Binance");
      assert.equal(result.exchanges[1].totalAssetsUsd, 200000);
    });
  });
});
