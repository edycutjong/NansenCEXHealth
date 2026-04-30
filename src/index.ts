/**
 * NansenCEXHealth — Express server entry point
 *
 * Serves the premium CEX health dashboard and REST API.
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import { fileURLToPath } from "node:url";
import path from "node:path";
import healthRoutes from "./routes/health.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use("/api", healthRoutes);

// Serve static frontend
const publicDir = path.resolve(__dirname, "..", "public");
app.use(express.static(publicDir));

// SPA fallback (Express 5 wildcard syntax)
app.get("/{*path}", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`\n  🏦 NansenCEXHealth Dashboard`);
  console.log(`  ────────────────────────────`);
  console.log(`  Dashboard:  http://localhost:${PORT}`);
  console.log(`  API:        http://localhost:${PORT}/api/exchanges`);
  console.log(`  Cache TTL:  ${process.env.CACHE_TTL || "300"}s\n`);
});

export default app;
