import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EXCHANGES } from "../src/services/cex-monitor.js";

describe("CEX Monitor", () => {
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
});
