/**
 * NansenCEXHealth — Frontend Dashboard Logic
 */

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const EXCHANGE_LOGOS = {
  Binance: "🟡",
  Coinbase: "🔵",
  OKX: "⚫",
  Bybit: "🟠",
  Kraken: "🟣",
};

// ── Formatters ──

function formatUsd(value) {
  if (value === 0) return "$0";
  const abs = Math.abs(value);
  if (abs >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function formatFlow(value) {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${formatUsd(value)}`;
}

function flowClass(value) {
  if (value > 0) return "metric__value--positive";
  if (value < 0) return "metric__value--negative";
  return "metric__value--neutral";
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

// ── Rendering ──

function renderSkeleton() {
  const grid = document.getElementById("grid");
  grid.innerHTML = Array(5)
    .fill("")
    .map(
      () => `
    <div class="card">
      <div class="card__header">
        <div class="skeleton" style="width:44px;height:44px;border-radius:12px"></div>
        <div>
          <div class="skeleton" style="width:120px;height:20px;margin-bottom:6px"></div>
          <div class="skeleton" style="width:80px;height:12px"></div>
        </div>
      </div>
      <div class="metrics">
        <div class="metric"><div class="skeleton" style="width:100%;height:54px"></div></div>
        <div class="metric"><div class="skeleton" style="width:100%;height:54px"></div></div>
      </div>
      <div class="skeleton" style="width:100%;height:6px;margin-bottom:20px"></div>
      <div class="skeleton" style="width:100%;height:80px"></div>
    </div>`,
    )
    .join("");
}

function renderCard(ex) {
  const logo = EXCHANGE_LOGOS[ex.name] || "🏦";
  const initial = ex.name.charAt(0);

  if (ex.error) {
    return `
    <div class="card card--error">
      <div class="card__header">
        <div class="card__logo">${initial}</div>
        <div>
          <div class="card__name">${ex.name}</div>
          <div class="card__entity">${ex.entity}</div>
        </div>
      </div>
      <div class="error-msg">${ex.error}</div>
    </div>`;
  }

  // Flow bar percentages
  const totalFlow = ex.totalInflows24hUsd + ex.totalOutflows24hUsd;
  const inflowPct = totalFlow > 0 ? (ex.totalInflows24hUsd / totalFlow) * 100 : 50;
  const outflowPct = 100 - inflowPct;

  const tokensHtml = ex.topTokens
    .map(
      (t) => `
    <li class="token">
      <span>
        <span class="token__symbol">${t.symbol}</span>
        <span class="token__chain">${t.chain}</span>
      </span>
      <span>
        <span class="token__value">${formatUsd(t.usdValue)}</span>
        <span class="token__pct">${t.percentage.toFixed(1)}%</span>
      </span>
    </li>`,
    )
    .join("");

  return `
  <div class="card">
    <div class="card__header">
      <div class="card__logo">${logo}</div>
      <div>
        <div class="card__name">${ex.name}</div>
        <div class="card__entity">${ex.entity}</div>
      </div>
    </div>

    <div class="metrics">
      <div class="metric">
        <div class="metric__label">Total Assets</div>
        <div class="metric__value">${formatUsd(ex.totalAssetsUsd)}</div>
      </div>
      <div class="metric">
        <div class="metric__label">24hr Net Flow</div>
        <div class="metric__value ${flowClass(ex.netFlow24hUsd)}">${formatFlow(ex.netFlow24hUsd)}</div>
      </div>
    </div>

    <div class="flow-bar">
      <div class="flow-bar__header">
        <span>Inflows ${formatUsd(ex.totalInflows24hUsd)}</span>
        <span>Outflows ${formatUsd(ex.totalOutflows24hUsd)}</span>
      </div>
      <div class="flow-bar__track">
        <div class="flow-bar__fill--in" style="width:${inflowPct}%"></div>
        <div class="flow-bar__fill--out" style="width:${outflowPct}%"></div>
      </div>
    </div>

    ${
      tokensHtml
        ? `<div class="tokens">
            <div class="tokens__title">Top Holdings</div>
            <ul class="tokens">${tokensHtml}</ul>
          </div>`
        : ""
    }
  </div>`;
}

function renderDashboard(data) {
  const grid = document.getElementById("grid");
  grid.innerHTML = data.exchanges.map(renderCard).join("");

  // Update status bar
  const dot = document.getElementById("statusDot");
  const text = document.getElementById("statusText");

  const hasErrors = data.exchanges.some((e) => e.error);
  dot.className = `status-bar__dot ${hasErrors ? "status-bar__dot--error" : ""}`;
  text.textContent = `Updated ${timeAgo(data.lastUpdated)} · ${data.exchanges.length} exchanges${data.cacheHit ? " · cached" : ""}`;
}

// ── Data Fetching ──

async function fetchData() {
  try {
    const res = await fetch("/api/exchanges");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderDashboard(data);
  } catch (err) {
    const dot = document.getElementById("statusDot");
    const text = document.getElementById("statusText");
    dot.className = "status-bar__dot status-bar__dot--error";
    text.textContent = `Error: ${err.message}`;
  }
}

// ── Init ──

renderSkeleton();
fetchData();
setInterval(fetchData, REFRESH_INTERVAL);
