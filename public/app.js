/**
 * NansenCEXHealth — Frontend Dashboard Logic
 */

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
let refreshTimer = null;

// ── SVG Icons ──

const ICONS = {
  vault: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><rect x="3" y="3" width="18" height="4" rx="2"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="14" x2="13" y2="14"/><circle cx="12" cy="17" r="1.5"/></svg>`,
  arrowUpRight: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>`,
  arrowDownRight: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 7l10 10"/><path d="M17 7v10H7"/></svg>`,
  wallet: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5z"/><path d="M16 12a1 1 0 1 0 2 0 1 1 0 1 0-2 0"/></svg>`,
  activity: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  coins: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="M16.71 13.88l.7.71-2.82 2.82"/></svg>`,
};

// ── Crypto Token Icons CDN ──
const CRYPTO_ICON_CDN = 'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color';

// ── Exchange Brand Logos ──

const EXCHANGE_BRAND = {
  Binance: {
    color: '#f3ba2f',
    svg: `<svg width="28" height="28" viewBox="0 0 126 126" fill="#f3ba2f">
      <path d="M38.2 53.3L63 28.5l24.8 24.8 14.4-14.4L63 0 24 39l14.2 14.3zM0 63l14.4-14.4L28.8 63l-14.4 14.4zM38.2 72.7L63 97.5l24.8-24.8 14.5 14.4L63 126.1 24 87l-.1-.2 14.3-14.1zM97.2 63l14.4-14.4L126 63l-14.4 14.4z"/>
      <path d="M77.6 63L63 48.4 52.2 59.1l-1.2 1.3L48.4 63 63 77.6 77.6 63z"/>
    </svg>`
  },
  Coinbase: {
    color: '#0052ff',
    svg: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="14" fill="#0052ff"/>
      <path d="M14 5.6a8.4 8.4 0 1 0 0 16.8 8.4 8.4 0 0 0 0-16.8zm-1.4 5.6h2.8a.7.7 0 0 1 .7.7v4.2a.7.7 0 0 1-.7.7h-2.8a.7.7 0 0 1-.7-.7v-4.2a.7.7 0 0 1 .7-.7z" fill="#fff"/>
    </svg>`
  },
  OKX: {
    color: '#ffffff',
    svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="#fff">
      <rect x="1" y="1" width="6.5" height="6.5" rx="1.2"/>
      <rect x="9" y="9" width="6.5" height="6.5" rx="1.2"/>
      <rect x="16.5" y="1" width="6.5" height="6.5" rx="1.2"/>
      <rect x="1" y="16.5" width="6.5" height="6.5" rx="1.2"/>
      <rect x="16.5" y="16.5" width="6.5" height="6.5" rx="1.2"/>
    </svg>`
  },
  Bybit: {
    color: '#f7a600',
    svg: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="6" fill="#f7a600"/>
      <path d="M8 8h5v5H8V8zm7 0h5v12h-5V8zM8 15h5v5H8v-5z" fill="#fff"/>
    </svg>`
  },
  Kraken: {
    color: '#7b61ff',
    svg: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="6" fill="#7b61ff"/>
      <path d="M9 7h3.5v5.5L17 7h4l-5.5 6.5L21 21h-4l-4.5-6v6H9V7z" fill="#fff"/>
    </svg>`
  },
};

function exchangeLogo(name) {
  const ex = EXCHANGE_BRAND[name];
  if (!ex) {
    return `<div class="card__logo" style="background:rgba(99,102,241,0.12);border-color:rgba(99,102,241,0.25);color:#6366f1">${name.charAt(0)}</div>`;
  }
  return `<div class="card__logo" style="background:${hexToRgba(ex.color,0.12)};border-color:${hexToRgba(ex.color,0.25)}">${ex.svg}</div>`;
}

function tokenIcon(symbol) {
  const lower = (symbol || '').toLowerCase();
  return `<span class="token__icon">
    <img src="${CRYPTO_ICON_CDN}/${lower}.svg"
         width="18" height="18"
         alt="${symbol}"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
    /><span class="token__icon-fallback" style="display:none">${(symbol || '?').charAt(0)}</span>
  </span>`;
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

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

// ═══════════════════════════════════════════════
// VIEW ROUTING
// ═══════════════════════════════════════════════

const landingView = document.getElementById("landingView");
const dashboardView = document.getElementById("dashboardView");

function showDashboard() {
  landingView.classList.add("landing--exit");
  setTimeout(() => {
    landingView.style.display = "none";
    dashboardView.style.display = "";
    dashboardView.classList.add("dashboard--enter");
    renderSkeleton();
    fetchData();
    refreshTimer = setInterval(fetchData, REFRESH_INTERVAL);
  }, 350);
}

function showLanding() {
  dashboardView.style.display = "none";
  dashboardView.classList.remove("dashboard--enter");
  landingView.style.display = "";
  // Force reflow then remove exit class
  void landingView.offsetWidth;
  landingView.classList.remove("landing--exit");
  if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
}

document.getElementById("ctaDashboard").addEventListener("click", showDashboard);
document.getElementById("btnBack").addEventListener("click", showLanding);

// ── Animated counter on landing ──
function animateCounters() {
  document.querySelectorAll("[data-count]").forEach(el => {
    const target = parseInt(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    const duration = 1200;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.round(target * eased);
      el.textContent = current + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

// Run counter animation when landing is visible
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { animateCounters(); observer.disconnect(); } });
});
const bannerEl = document.querySelector(".stats-banner");
if (bannerEl) observer.observe(bannerEl);

// ═══════════════════════════════════════════════
// DASHBOARD RENDERING
// ═══════════════════════════════════════════════

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
  const logo = exchangeLogo(ex.name);

  if (ex.error) {
    return `
    <div class="card card--error">
      <div class="card__header">
        ${logo}
        <div>
          <div class="card__name">${ex.name}</div>
          <div class="card__entity">${ex.entity}</div>
        </div>
      </div>
      <div class="error-msg">${ex.error}</div>
    </div>`;
  }

  const totalFlow = ex.totalInflows24hUsd + ex.totalOutflows24hUsd;
  const inflowPct = totalFlow > 0 ? (ex.totalInflows24hUsd / totalFlow) * 100 : 50;
  const outflowPct = 100 - inflowPct;

  const inflowIcon = `<span style="color:var(--accent-green)">${ICONS.arrowUpRight}</span>`;
  const outflowIcon = `<span style="color:var(--accent-red)">${ICONS.arrowDownRight}</span>`;

  const tokensHtml = ex.topTokens
    .map(
      (t) => `
    <li class="token">
      <span>
        ${tokenIcon(t.symbol)}
        <span class="token__symbol">${t.symbol}</span>
        <span class="token__chain">${t.chain}</span>
      </span>
      <span>
        <span class="token__value">${formatUsd(t.usdValue || 0)}</span>
        <span class="token__pct">${(t.percentage ?? 0).toFixed(1)}%</span>
      </span>
    </li>`,
    )
    .join("");

  return `
  <div class="card">
    <div class="card__header">
      ${logo}
      <div>
        <div class="card__name">${ex.name}</div>
        <div class="card__entity">${ex.entity}</div>
      </div>
    </div>

    <div class="metrics">
      <div class="metric">
        <div class="metric__label">${ICONS.wallet} Total Assets</div>
        <div class="metric__value">${formatUsd(ex.totalAssetsUsd)}</div>
      </div>
      <div class="metric">
        <div class="metric__label">${ICONS.activity} 24hr Net Flow</div>
        <div class="metric__value ${flowClass(ex.netFlow24hUsd)}">${formatFlow(ex.netFlow24hUsd)}</div>
      </div>
    </div>

    <div class="flow-bar">
      <div class="flow-bar__header">
        <span class="flow-bar__label">${inflowIcon} Inflows ${formatUsd(ex.totalInflows24hUsd)}</span>
        <span class="flow-bar__label">${outflowIcon} Outflows ${formatUsd(ex.totalOutflows24hUsd)}</span>
      </div>
      <div class="flow-bar__track">
        <div class="flow-bar__fill--in" style="width:${inflowPct}%"></div>
        <div class="flow-bar__fill--out" style="width:${outflowPct}%"></div>
      </div>
    </div>

    ${
      tokensHtml
        ? `<div class="tokens">
            <div class="tokens__title">${ICONS.coins} Top Holdings</div>
            <ul class="tokens">${tokensHtml}</ul>
          </div>`
        : ""
    }
  </div>`;
}

function renderDashboard(data) {
  const grid = document.getElementById("grid");
  grid.innerHTML = data.exchanges.map(renderCard).join("");

  const dot = document.getElementById("statusDot");
  const text = document.getElementById("statusText");

  const hasErrors = data.exchanges.some((e) => e.error);
  dot.className = `status-dot ${hasErrors ? "status-dot--error" : ""}`;
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
    dot.className = "status-dot status-dot--error";
    text.textContent = `Error: ${err.message}`;
  }
}
