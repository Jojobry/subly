/* Subscription Cost Tracker
   100% local. All data lives in chrome.storage.local on this device. */

const DEFAULT_SETTINGS = {
  currency: "USD",
  theme: "system",
  notify: true,
  notifyDays: 3,
};

const CYCLE_MONTHS = { weekly: 12 / 52, monthly: 1, quarterly: 3, yearly: 12 };
const CYCLE_LABEL = { weekly: "/wk", monthly: "/mo", quarterly: "/qtr", yearly: "/yr" };
const CARD_COLORS = ["#6c5ce7", "#0984e3", "#00b894", "#e17055", "#e84393", "#fdcb6e", "#00cec9", "#d63031", "#636e72", "#a29bfe"];

let state = { subs: [], settings: { ...DEFAULT_SETTINGS } };

/* ---------- storage ---------- */
const storage = {
  get(keys) {
    return new Promise((res) => {
      if (typeof chrome !== "undefined" && chrome.storage) chrome.storage.local.get(keys, res);
      else res(JSON.parse(localStorage.getItem("subly") || "{}")); // dev fallback
    });
  },
  set(obj) {
    return new Promise((res) => {
      if (typeof chrome !== "undefined" && chrome.storage) chrome.storage.local.set(obj, res);
      else { localStorage.setItem("subly", JSON.stringify({ ...JSON.parse(localStorage.getItem("subly") || "{}"), ...obj })); res(); }
    });
  },
};

async function load() {
  const data = await storage.get(["subs", "settings"]);
  state.subs = Array.isArray(data.subs) ? data.subs : [];
  state.settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
}
async function saveSubs() {
  await storage.set({ subs: state.subs });
  scheduleAlarms();
}
async function saveSettings() {
  await storage.set({ settings: state.settings });
  scheduleAlarms();
}
function scheduleAlarms() {
  if (typeof chrome !== "undefined" && chrome.runtime) {
    chrome.runtime.sendMessage({ type: "reschedule" }, () => void chrome.runtime.lastError);
  }
}

/* ---------- helpers ---------- */
const $ = (id) => document.getElementById(id);
const uid = () => "s_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

function toMonthlyUSD(sub) {
  const cur = CUR_MAP[sub.currency] || CUR_MAP.USD;
  const usd = Number(sub.price) / cur.rate;
  return usd / CYCLE_MONTHS[sub.cycle];
}
function fmtMoney(amount, code) {
  const cur = CUR_MAP[code] || CUR_MAP.USD;
  const decimals = amount >= 1000 ? 0 : 2;
  return cur.symbol + amount.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + "T00:00:00");
  return Math.round((d - today) / 86400000);
}
function colorFor(name) {
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return CARD_COLORS[Math.abs(h) % CARD_COLORS.length];
}
function renewalText(sub) {
  const d = daysUntil(sub.nextDate);
  if (d === null) return "";
  if (d < 0) return "Overdue";
  if (d === 0) return "Due today";
  if (d === 1) return "Due tomorrow";
  return `Due in ${d} days`;
}

/* ---------- theme ---------- */
function applyTheme() {
  const t = state.settings.theme;
  const dark = t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
}

/* ---------- render ---------- */
function computeTotals() {
  const code = state.settings.currency;
  const cur = CUR_MAP[code] || CUR_MAP.USD;
  let monthlyUSD = 0, savedUSD = 0, active = 0, trial = 0, soon = 0, pausedCount = 0, currencies = new Set();
  for (const s of state.subs) {
    if (s.status === "cancelled") continue;
    currencies.add(s.currency);
    if (s.paused) { savedUSD += toMonthlyUSD(s); pausedCount++; continue; }
    monthlyUSD += toMonthlyUSD(s);
    if (s.status === "active") active++;
    if (s.status === "trial") trial++;
    const d = daysUntil(s.nextDate);
    if (d !== null && d >= 0 && d <= 7) soon++;
  }
  const monthly = monthlyUSD * cur.rate;
  const saved = savedUSD * cur.rate;
  return { monthly, yearly: monthly * 12, saved, pausedCount, active, trial, soon, mixed: currencies.size > 1 };
}

function render() {
  const t = computeTotals();
  const code = state.settings.currency;
  const approx = t.mixed ? "≈" : "";
  $("monthlyTotal").textContent = approx + fmtMoney(t.monthly, code);
  $("yearlyTotal").textContent = approx + fmtMoney(t.yearly, code) + " / year";
  const savingsEl = $("savingsLine");
  if (t.pausedCount > 0) {
    savingsEl.textContent = `↓ Saving ${approx}${fmtMoney(t.saved, code)}/mo · ${approx}${fmtMoney(t.saved * 12, code)}/yr`;
    savingsEl.classList.remove("hidden");
  } else {
    savingsEl.classList.add("hidden");
  }
  $("activeCount").textContent = t.active;
  $("trialCount").textContent = t.trial;
  $("soonCount").textContent = t.soon;

  const q = ($("searchInput").value || "").toLowerCase().trim();
  let subs = state.subs.filter(s => !q || s.name.toLowerCase().includes(q) || (s.category || "").toLowerCase().includes(q));

  const container = $("listContainer");
  const empty = $("emptyState");

  if (state.subs.length === 0) {
    container.innerHTML = ""; container.classList.add("hidden"); empty.classList.remove("hidden"); return;
  }
  empty.classList.add("hidden"); container.classList.remove("hidden");

  // sort: soonest renewal first within group
  const byDate = (a, b) => {
    const da = daysUntil(a.nextDate), db = daysUntil(b.nextDate);
    if (da === null) return 1; if (db === null) return -1; return da - db;
  };
  const groups = [
    { key: "trial", title: "Free trials", items: subs.filter(s => s.status === "trial").sort(byDate) },
    { key: "active", title: "Active", items: subs.filter(s => s.status === "active").sort(byDate) },
    { key: "cancelled", title: "Cancelled", items: subs.filter(s => s.status === "cancelled") },
  ];

  let html = "";
  for (const g of groups) {
    if (!g.items.length) continue;
    html += `<div class="group-title">${g.title} · ${g.items.length}</div>`;
    for (const s of g.items) html += cardHTML(s);
  }
  if (!html) html = `<div class="group-title" style="text-align:center;padding:24px 0">No matches.</div>`;
  container.innerHTML = html;

  container.querySelectorAll(".pause-toggle").forEach(el => {
    el.addEventListener("click", (e) => { e.stopPropagation(); togglePause(el.dataset.toggle); });
  });
  container.querySelectorAll(".sub-card").forEach(el => {
    el.addEventListener("click", () => openEdit(el.dataset.id));
  });
}

async function togglePause(id) {
  const s = state.subs.find(x => x.id === id);
  if (!s) return;
  s.paused = !s.paused;
  await saveSubs();
  render();
}

function cardHTML(s) {
  const color = colorFor(s.name);
  const initial = s.name.trim().charAt(0).toUpperCase() || "?";
  const d = daysUntil(s.nextDate);
  let badge = "";
  if (s.paused && s.status !== "cancelled") badge = `<span class="badge paused">Paused</span>`;
  else if (s.status === "trial") badge = `<span class="badge trial">Trial</span>`;
  else if (s.status === "cancelled") badge = `<span class="badge cancelled">Cancelled</span>`;
  else if (d !== null && d < 0) badge = `<span class="badge due">Overdue</span>`;
  else if (d !== null && d <= 3) badge = `<span class="badge due">${renewalText(s)}</span>`;
  else if (d !== null && d <= 7) badge = `<span class="badge soon">${renewalText(s)}</span>`;

  const showRenewal = !s.paused && s.status !== "cancelled" && !badge;
  const meta = s.status === "cancelled"
    ? (s.category || "Cancelled")
    : [s.category, showRenewal ? renewalText(s) : ""].filter(Boolean).join(" · ");

  // Pause-from-stats toggle (not shown for cancelled subs — already excluded).
  const toggle = s.status === "cancelled" ? "" : `
      <button class="pause-toggle ${s.paused ? "is-paused" : ""}" data-toggle="${s.id}"
        title="${s.paused ? "Include in totals again" : "Pause — see what you'd save"}"
        aria-label="${s.paused ? "Resume" : "Pause"}">${s.paused ? "▶" : "⏸"}</button>`;

  const cardClass = s.status === "cancelled" ? "card-cancelled" : (s.paused ? "card-paused" : "");
  return `
    <div class="sub-card ${cardClass}" data-id="${s.id}">
      <div class="sub-logo" style="background:${color}">${initial}</div>
      <div class="sub-info">
        <div class="sub-name">${escapeHtml(s.name)}</div>
        <div class="sub-meta">${escapeHtml(meta)} ${badge}</div>
      </div>
      <div class="sub-right">
        <div class="sub-price ${s.paused ? "struck" : ""}">${fmtMoney(Number(s.price), s.currency)}</div>
        <div class="sub-cycle">${CYCLE_LABEL[s.cycle]}</div>
      </div>
      ${toggle}
    </div>`;
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ---------- modal ---------- */
function openAdd() {
  $("modalTitle").textContent = "Add subscription";
  $("subForm").reset();
  $("subId").value = "";
  $("fCurrency").value = state.settings.currency;
  $("fStatus").value = "active";
  $("fCycle").value = "monthly";
  $("deleteBtn").classList.add("hidden");
  $("modal").classList.remove("hidden");
  $("fName").focus();
}
function openEdit(id) {
  const s = state.subs.find(x => x.id === id);
  if (!s) return;
  $("modalTitle").textContent = "Edit subscription";
  $("subId").value = s.id;
  $("fName").value = s.name;
  $("fPrice").value = s.price;
  $("fCurrency").value = s.currency;
  $("fCycle").value = s.cycle;
  $("fNextDate").value = s.nextDate || "";
  $("fStatus").value = s.status;
  $("fCategory").value = s.category || "";
  $("fUrl").value = s.url || "";
  $("fNotes").value = s.notes || "";
  $("deleteBtn").classList.remove("hidden");
  $("modal").classList.remove("hidden");
}
function closeModal() { $("modal").classList.add("hidden"); }

async function submitForm(e) {
  e.preventDefault();
  const id = $("subId").value || uid();
  const existing = state.subs.find(x => x.id === id);
  const sub = {
    id,
    paused: existing ? !!existing.paused : false,
    name: $("fName").value.trim(),
    price: parseFloat($("fPrice").value) || 0,
    currency: $("fCurrency").value,
    cycle: $("fCycle").value,
    nextDate: $("fNextDate").value || "",
    status: $("fStatus").value,
    category: $("fCategory").value,
    url: $("fUrl").value.trim(),
    notes: $("fNotes").value.trim(),
  };
  if (!sub.name) return;
  const idx = state.subs.findIndex(x => x.id === id);
  if (idx >= 0) state.subs[idx] = sub; else state.subs.push(sub);
  await saveSubs();
  closeModal();
  render();
}

async function deleteSub() {
  const id = $("subId").value;
  if (!id) return;
  if (!confirm("Delete this subscription?")) return;
  state.subs = state.subs.filter(x => x.id !== id);
  await saveSubs();
  closeModal();
  render();
}

/* ---------- settings ---------- */
function openSettings() {
  $("setCurrency").value = state.settings.currency;
  $("setTheme").value = state.settings.theme;
  $("setNotify").checked = state.settings.notify;
  $("setNotifyDays").value = String(state.settings.notifyDays);
  $("settingsModal").classList.remove("hidden");
}
function closeSettings() { $("settingsModal").classList.add("hidden"); }

async function onSettingsChange() {
  state.settings.currency = $("setCurrency").value;
  state.settings.theme = $("setTheme").value;
  state.settings.notify = $("setNotify").checked;
  state.settings.notifyDays = parseInt($("setNotifyDays").value, 10);
  await saveSettings();
  applyTheme();
  render();
}

/* ---------- import / export ---------- */
function exportData() {
  const blob = new Blob([JSON.stringify({ subs: state.subs, settings: state.settings, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "subscriptions-backup.json"; a.click();
  URL.revokeObjectURL(url);
}
function importData(file) {
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data.subs)) throw new Error("Invalid file");
      if (!confirm(`Import ${data.subs.length} subscriptions? This replaces your current list.`)) return;
      state.subs = data.subs;
      if (data.settings) state.settings = { ...DEFAULT_SETTINGS, ...data.settings };
      await saveSubs(); await saveSettings();
      populateCurrencies(); applyTheme(); render();
      closeSettings();
    } catch { alert("Could not read that file."); }
  };
  reader.readAsText(file);
}

/* ---------- currency selects ---------- */
function populateCurrencies() {
  const opts = CURRENCIES.map(c => `<option value="${c.code}">${c.code} — ${c.name}</option>`).join("");
  $("fCurrency").innerHTML = opts;
  $("setCurrency").innerHTML = opts;
}

/* ---------- init ---------- */
async function init() {
  await load();
  populateCurrencies();
  applyTheme();
  render();

  $("addBtn").addEventListener("click", openAdd);
  $("emptyAddBtn").addEventListener("click", openAdd);
  $("modalClose").addEventListener("click", closeModal);
  $("cancelBtn").addEventListener("click", closeModal);
  $("subForm").addEventListener("submit", submitForm);
  $("deleteBtn").addEventListener("click", deleteSub);
  $("searchInput").addEventListener("input", render);

  $("settingsBtn").addEventListener("click", openSettings);
  $("settingsClose").addEventListener("click", closeSettings);
  ["setCurrency", "setTheme", "setNotify", "setNotifyDays"].forEach(id => $(id).addEventListener("change", onSettingsChange));
  $("exportBtn").addEventListener("click", exportData);
  $("importBtn").addEventListener("click", () => $("importFile").click());
  $("importFile").addEventListener("change", (e) => { if (e.target.files[0]) importData(e.target.files[0]); });

  $("themeBtn").addEventListener("click", async () => {
    const order = ["system", "light", "dark"];
    state.settings.theme = order[(order.indexOf(state.settings.theme) + 1) % 3];
    await saveSettings(); applyTheme();
  });

  // close modals on overlay click
  [["modal", closeModal], ["settingsModal", closeSettings]].forEach(([id, fn]) => {
    $(id).addEventListener("click", (e) => { if (e.target.id === id) fn(); });
  });

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme);
}

document.addEventListener("DOMContentLoaded", init);
