/**
 * Nansen API client — direct HTTP calls
 *
 * Uses native fetch (Node 20+). No external HTTP dependencies.
 */

import type {
  CurrentBalanceResponse,
  CounterpartiesResponse,
} from "./types.js";

const API_BASE = "https://api.nansen.ai/api/v1";

function getApiKey(): string {
  const key = process.env.NANSEN_API_KEY;
  if (!key) throw new Error("NANSEN_API_KEY environment variable is required");
  return key;
}

async function nansenPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apiKey: getApiKey(),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`Nansen API ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Fetch current token balances for an exchange entity
 */
export async function fetchCurrentBalance(
  entityName: string,
  chain = "all",
  page = 1,
  perPage = 1000,
): Promise<CurrentBalanceResponse> {
  return nansenPost<CurrentBalanceResponse>(
    "/profiler/address/current-balance",
    {
      entity_name: entityName,
      chain,
      hide_spam_token: true,
      pagination: { page, per_page: perPage },
    },
  );
}

/**
 * Fetch counterparties for 24hr net flow calculation
 */
export async function fetchCounterparties(
  entityName: string,
  chain: string,
  dateFrom: string,
  dateTo: string,
  page = 1,
  perPage = 1000,
): Promise<CounterpartiesResponse> {
  return nansenPost<CounterpartiesResponse>(
    "/profiler/address/counterparties",
    {
      entity_name: entityName,
      chain,
      date: { from: dateFrom, to: dateTo },
      group_by: "entity",
      source_input: "Combined",
      pagination: { page, per_page: perPage },
    },
  );
}
