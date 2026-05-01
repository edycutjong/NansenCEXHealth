import { describe, it, mock, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { fetchCurrentBalance, fetchCounterparties } from "../src/api/nansen.js";

describe("Nansen API Client", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    mock.restoreAll();
  });

  it("throws error if NANSEN_API_KEY is not set", async () => {
    delete process.env.NANSEN_API_KEY;
    await assert.rejects(
      async () => fetchCurrentBalance("Binance"),
      /NANSEN_API_KEY environment variable is required/
    );
  });

  it("handles non-ok responses", async () => {
    process.env.NANSEN_API_KEY = "test-key";
    
    mock.method(global, "fetch", async () => {
      return {
        ok: false,
        status: 400,
        text: async () => "Bad Request",
      };
    });

    await assert.rejects(
      async () => fetchCurrentBalance("Binance"),
      /Nansen API 400: Bad Request/
    );
  });

  it("handles fetchCurrentBalance success", async () => {
    process.env.NANSEN_API_KEY = "test-key";
    
    const mockData = { data: [{ token_symbol: "BTC", usd_value: 50000 }] };
    mock.method(global, "fetch", async (url: any, options: any) => {
      assert.ok(url.toString().includes("/profiler/address/current-balance"));
      assert.equal(options.headers.apiKey, "test-key");
      
      const body = JSON.parse(options.body);
      assert.equal(body.entity_name, "Binance");
      
      return {
        ok: true,
        json: async () => mockData,
      };
    });

    const res = await fetchCurrentBalance("Binance");
    assert.deepEqual(res, mockData);
  });

  it("handles fetchCounterparties success", async () => {
    process.env.NANSEN_API_KEY = "test-key";
    
    const mockData = { data: [{ inflow_usd: 100, outflow_usd: 50 }] };
    mock.method(global, "fetch", async (url: any, options: any) => {
      assert.ok(url.toString().includes("/profiler/address/counterparties"));
      
      const body = JSON.parse(options.body);
      assert.equal(body.entity_name, "Binance");
      assert.equal(body.date.from, "2023-01-01");
      assert.equal(body.date.to, "2023-01-02");
      
      return {
        ok: true,
        json: async () => mockData,
      };
    });

    const res = await fetchCounterparties("Binance", "all", "2023-01-01", "2023-01-02");
    assert.deepEqual(res, mockData);
  });
});
