/* Subly background service worker.
   Schedules a daily local check and fires on-device notifications for
   upcoming renewals. No network, no servers — everything stays local. */

function fmtDate(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

// Advance a date by one billing cycle, calendar-accurate (true next month / next year).
function addCycle(dateStr, cycle) {
  const d = new Date(dateStr + "T00:00:00");
  if (cycle === "weekly") d.setDate(d.getDate() + 7);
  else if (cycle === "quarterly") d.setMonth(d.getMonth() + 3);
  else if (cycle === "yearly") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1); // monthly (default)
  return fmtDate(d);
}

function get(keys) {
  return new Promise((res) => chrome.storage.local.get(keys, res));
}
function set(obj) {
  return new Promise((res) => chrome.storage.local.set(obj, res));
}

async function setupDailyAlarm() {
  // Run a check shortly after install/startup, then once a day.
  chrome.alarms.create("subly-daily", { delayInMinutes: 1, periodInMinutes: 60 * 24 });
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + "T00:00:00");
  return Math.round((d - today) / 86400000);
}

function todayStr() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

async function checkRenewals() {
  const data = await get(["subs", "settings", "notified"]);
  const subs = Array.isArray(data.subs) ? data.subs : [];
  const settings = data.settings || {};
  if (settings.notify === false) return;

  const window = Number.isFinite(settings.notifyDays) ? settings.notifyDays : 3;
  const notified = data.notified || {}; // { subId: "YYYY-MM-DD of the renewal we already pinged" }

  // Roll past-due active subs forward to their next cycle so dates stay fresh.
  let changed = false;
  for (const s of subs) {
    if (s.status === "cancelled" || !s.nextDate) continue;
    let guard = 0;
    while (daysUntil(s.nextDate) < 0 && guard++ < 120) {
      s.nextDate = addCycle(s.nextDate, s.cycle);
      changed = true;
    }
  }
  if (changed) await set({ subs });

  for (const s of subs) {
    if (s.status === "cancelled" || !s.nextDate) continue;
    const d = daysUntil(s.nextDate);
    if (d === null || d < 0 || d > window) continue;
    if (notified[s.id] === s.nextDate) continue; // already pinged for this date

    const when = d === 0 ? "today" : d === 1 ? "tomorrow" : `in ${d} days`;
    const verb = s.status === "trial" ? "Free trial ends" : "Renews";
    chrome.notifications.create("subly-" + s.id, {
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: `${s.name} ${verb.toLowerCase()} ${when}`,
      message: `${s.name} · ${s.currency} ${s.price}. Open Subly to manage it.`,
      priority: 1,
    });
    notified[s.id] = s.nextDate;
  }
  await set({ notified });
}

chrome.runtime.onInstalled.addListener(setupDailyAlarm);
chrome.runtime.onStartup.addListener(() => { setupDailyAlarm(); checkRenewals(); });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "subly-daily") checkRenewals();
});

// Re-check immediately when the popup saves changes.
chrome.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === "reschedule") checkRenewals();
});

chrome.notifications.onClicked.addListener(() => {
  // Opening the action popup programmatically isn't allowed; clearing is enough.
  chrome.notifications.getAll((all) => Object.keys(all).forEach((id) => chrome.notifications.clear(id)));
});
