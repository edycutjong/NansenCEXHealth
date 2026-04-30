import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { cacheGet, cacheSet, cacheClear, cacheSize } from "../src/services/cache.js";

describe("Cache Service", () => {
  beforeEach(() => {
    cacheClear();
  });

  it("returns null for missing keys", () => {
    assert.equal(cacheGet("nonexistent"), null);
  });

  it("stores and retrieves values", () => {
    cacheSet("test-key", { value: 42 });
    const result = cacheGet<{ value: number }>("test-key");
    assert.deepEqual(result, { value: 42 });
  });

  it("returns null for expired entries", async () => {
    cacheSet("expire-key", "data", 1); // 1ms TTL
    await new Promise((r) => setTimeout(r, 10));
    assert.equal(cacheGet("expire-key"), null);
  });

  it("tracks cache size", () => {
    assert.equal(cacheSize(), 0);
    cacheSet("a", 1);
    cacheSet("b", 2);
    assert.equal(cacheSize(), 2);
  });

  it("clears all entries", () => {
    cacheSet("x", 1);
    cacheSet("y", 2);
    cacheClear();
    assert.equal(cacheSize(), 0);
    assert.equal(cacheGet("x"), null);
  });

  it("overwrites existing keys", () => {
    cacheSet("key", "old");
    cacheSet("key", "new");
    assert.equal(cacheGet("key"), "new");
  });
});
