/**
 * API routes for CEX health data
 */

import { Router } from "express";
import { getAllExchangeHealth, getExchangeHealth, EXCHANGES } from "../services/cex-monitor.js";

const router = Router();

/**
 * GET /api/exchanges — all exchange health data
 */
router.get("/exchanges", async (_req, res) => {
  try {
    const data = await getAllExchangeHealth();
    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : "Internal server error",
    });
  }
});

/**
 * GET /api/exchanges/:name — single exchange health
 */
router.get("/exchanges/:name", async (req, res) => {
  const name = req.params.name;
  const config = EXCHANGES.find(
    (e) => e.name.toLowerCase() === name.toLowerCase(),
  );

  if (!config) {
    res.status(404).json({
      error: `Exchange "${name}" not found`,
      available: EXCHANGES.map((e) => e.name),
    });
    return;
  }

  try {
    const data = await getExchangeHealth(config);
    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : "Internal server error",
    });
  }
});

export default router;
