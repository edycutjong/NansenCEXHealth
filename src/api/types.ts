/**
 * Nansen API response types for CEX Health monitoring
 */

// --- Current Balance ---

export interface BalanceToken {
  token_symbol: string;
  token_address: string;
  chain: string;
  balance: number;
  usd_value: number;
  price_usd: number;
}

export interface CurrentBalanceResponse {
  data: BalanceToken[];
  pagination?: {
    page: number;
    per_page: number;
    total: number;
  };
}

// --- Counterparties ---

export interface Counterparty {
  counterparty_address?: string;
  counterparty_entity?: string;
  counterparty_label?: string;
  inflow_usd: number;
  outflow_usd: number;
  total_volume_usd: number;
  nof_transactions?: number;
}

export interface CounterpartiesResponse {
  data: Counterparty[];
  pagination?: {
    page: number;
    per_page: number;
    total: number;
  };
}

// --- Aggregated Exchange Health ---

export interface ExchangeHealth {
  name: string;
  entity: string;
  totalAssetsUsd: number;
  netFlow24hUsd: number;
  totalInflows24hUsd: number;
  totalOutflows24hUsd: number;
  topTokens: TopToken[];
  fetchedAt: string;
  error?: string;
}

export interface TopToken {
  symbol: string;
  chain: string;
  usdValue: number;
  percentage: number;
}

export interface DashboardData {
  exchanges: ExchangeHealth[];
  lastUpdated: string;
  cacheHit: boolean;
}
