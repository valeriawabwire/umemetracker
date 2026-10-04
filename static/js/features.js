(function () {

  function $(id) { return document.getElementById(id); }
  function lang() { return (typeof I18N !== "undefined" && I18N.lang) || "en"; }
  function tr(s) { return (typeof I18N !== "undefined" && I18N.t) ? I18N.t(s) : s; }

  function authTools() {
    let box = $("auth-tools");
    if (!box) {
      box = document.createElement("div");
      box.id = "auth-tools";
      box.className = "auth-tools";
      const card = document.querySelector(".auth-card");
      card.insertBefore(box, card.firstChild);
    }
    return box;
  }

  function makeBtn(id, cls, title) {
    const b = document.createElement("button");
    b.type = "button";
    b.id = id;
    b.className = cls;
    b.title = title;
    return b;
  }

  function dateIn(days) {
    const d = new Date();
    d.setDate(d.getDate() + Math.floor(days));
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }

  // ---------- dark mode ----------
  function getTheme() {
    try { return localStorage.getItem("umeme_theme") === "dark" ? "dark" : "light"; } catch (e) { return "light"; }
  }

  function setTheme(t) {
    if (t === "dark") document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
    try { localStorage.setItem("umeme_theme", t); } catch (e) { /* ignore */ }
    document.querySelectorAll(".theme-toggle").forEach(function (b) {
      b.textContent = t === "dark" ? "☀️" : "🌙";
    });
  }

  // ---------- low-units alerts ----------
  let dismissed = null;

  function buildAlert() {
    const s = state.stats;
    if (!s || s.burn === null || s.burn <= 0 || s.daysLeft === null) return null;
    const rate = s.avgCost || DEFAULT_TARIFF;
    const weekNeed = Math.max(0, s.burn * 7 - s.unitsNow);
    const suggestion = weekNeed > 0 ? " To last a week, buy about " + kes(weekNeed * rate) + "." : "";

    if (s.unitsNow <= 0) {
      return { level: "out", title: "Your units have probably run out", text: "Buy a token now so you are not left in the dark." + suggestion };
    }
    if (s.daysLeft < 1) {
      return { level: "last", title: "Last day to buy!", text: "Your units may run out today. Buy a token now so you don't get caught in the dark." + suggestion };
    }
    if (s.daysLeft < 3) {
      return {
        level: "low",
        title: "Low units: about " + Math.floor(s.daysLeft) + " day(s) left",
        text: "Plan to buy a token before " + dateIn(s.daysLeft) + "." + suggestion,
      };
    }
    return null;
  }

  function renderAlert() {
    const bar = $("alert-bar");
    const a = buildAlert();
    if (!a || dismissed === a.level + todayISO()) {
      bar.className = "alert-bar hidden";
      return;
    }
    bar.className = "alert-bar" + (a.level === "low" ? " amber" : "");
    $("alert-title").textContent = a.title;
    $("alert-text").textContent = a.text;
  }

  function notifSupported() { return "Notification" in window; }

  function updateBell() {
    const b = $("notify-btn");
    if (!notifSupported()) { b.classList.add("hidden"); return; }
    const p = Notification.permission;
    b.textContent = p === "granted" ? "🔔" : "🔕";
    b.title = p === "granted" ? "Low-units alerts are on" : p === "denied" ? "Alerts are blocked in your browser settings" : "Turn on low-units alerts";
  }

  async function sendNotification(title, body) {
    try {
      const reg = navigator.serviceWorker && (await navigator.serviceWorker.getRegistration());
      if (reg && reg.showNotification) {
        await reg.showNotification(title, { body: body, icon: "/static/icons/icon-192.png", tag: "umeme-low-units" });
        return;
      }
    } catch (e) { /* fall through */ }
    try { new Notification(title, { body: body, icon: "/static/icons/icon-192.png" }); } catch (e) { /* ignore */ }
  }

  function maybeNotify() {
    if (!notifSupported() || Notification.permission !== "granted" || !state.household) return;
    const a = buildAlert();
    if (!a) return;
    const key = "umeme_notified_" + state.household.id + "_" + a.level + "_" + todayISO();
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch (e) { /* ignore */ }
    sendNotification("Umeme Tracker", tr(a.title) + " " + tr(a.text));
  }

  function onBellClick() {
    if (!notifSupported()) return;
    const p = Notification.permission;
    if (p === "granted") {
      toast("Alerts are on. You will be notified when you have under 3 days left.", "success");
    } else if (p === "denied") {
      toast("Alerts are blocked. Allow notifications for this site in your browser settings.", "error");
    } else {
      Notification.requestPermission().then(function () {
        updateBell();
        if (Notification.permission === "granted") {
          toast("Alerts turned on.", "success");
          maybeNotify();
        }
      });
    }
  }

  // ---------- where your money goes ----------
  const RATE_DEFAULTS = { energy: 16.5, fuel: 3.14, forex: 0.72, rep: 5, levies: 0.04, vat: 16 };
  const RATE_KEY = "umeme_rates";
  const COLORS = ["#2563eb", "#f59e0b", "#7c3aed", "#14b8a6", "#ef4444"];
  const NAMES = ["Energy charge", "Fuel & forex", "REP levy", "EPRA & WARMA levies", "VAT"];
  let exampleOverride = null;

  function loadRates() {
    try {
      const saved = JSON.parse(localStorage.getItem(RATE_KEY));
      if (saved && typeof saved === "object") return Object.assign({}, RATE_DEFAULTS, saved);
    } catch (e) { /* ignore */ }
    return Object.assign({}, RATE_DEFAULTS);
  }

  function saveRates(r) {
    try { localStorage.setItem(RATE_KEY, JSON.stringify(r)); } catch (e) { /* ignore */ }
  }

  function readRates() {
    const r = {};
    Object.keys(RATE_DEFAULTS).forEach(function (k) {
      const v = parseFloat($("rate-" + k).value);
      r[k] = v >= 0 ? v : 0;
    });
    return r;
  }

  function fillRates(r) {
    Object.keys(RATE_DEFAULTS).forEach(function (k) { $("rate-" + k).value = r[k]; });
  }

  // cost of one unit (kWh) split into its parts
  function splitRate(r) {
    const fuelForex = r.fuel + r.forex;
    const rep = r.energy * r.rep / 100;
    const before = r.energy + fuelForex + rep + r.levies;
    const vat = before * r.vat / 100;
    return { parts: [r.energy, fuelForex, rep, r.levies, vat], total: before + vat };
  }

  function renderBreakdown() {
    if (!$("money-card")) return;
    const r = readRates();
    const b = splitRate(r);
    const s = state.stats;
    const stack = $("money-stack");
    const legend = $("money-legend");
    const summary = $("money-summary");
    const note = $("money-note");

    if (!(b.total > 0)) {
      stack.innerHTML = "";
      legend.innerHTML = "";
      summary.textContent = "Enter at least one rate to see the breakdown.";
      note.textContent = "";
      return;
    }

    let example = exampleOverride;
    if (!example) example = s && s.count ? Math.max(10, Math.round(s.totalSpent / s.count / 10) * 10) : 1000;
    if (document.activeElement !== $("rate-example")) $("rate-example").value = example;

    const widths = b.parts.map(function (p) { return (p / b.total) * 100; });
    stack.innerHTML = widths.map(function (w, i) {
      return '<span style="width:' + w.toFixed(2) + "%;background:" + COLORS[i] + '" title="' + NAMES[i] + '"></span>';
    }).join("");

    legend.innerHTML = b.parts.map(function (p, i) {
      return '<div><span class="dot" style="background:' + COLORS[i] + '"></span><span>' + NAMES[i] +
        '</span><span class="amt">' + kes(example * p / b.total) + " (" + fmt(widths[i], 0) + "%)</span></div>";
    }).join("");

    const taxShare = (b.parts[2] + b.parts[3] + b.parts[4]) / b.total;
    summary.textContent = "Of a " + kes(example) + " token, about " + kes(example * taxShare) + " (" +
      fmt(taxShare * 100, 0) + "%) goes to taxes and levies, and you get about " + fmt(example / b.total, 1) + " kWh.";

    if (s && s.avgCost) {
      const diff = Math.abs(b.total - s.avgCost) / s.avgCost * 100;
      note.textContent = "Your logged purchases averaged KES " + fmt(s.avgCost, 2) + " per kWh; these rates give KES " +
        fmt(b.total, 2) + " per kWh. " +
        (diff <= 12
          ? "Very close to your real average."
          : "Quite different from your real average. Your tariff band or this month's adjustments may differ, so check your latest KPLC receipt and update the rates.");
    } else {
      note.textContent = "Log purchases to compare this estimate with your real cost per unit.";
    }
  }

  // ---------- WhatsApp (English or Kiswahili) ----------
  function shareWhatsApp() {
    const s = state.stats;
    if (!s || !s.count) { toast("Log a purchase first.", "error"); return; }
    const sw = lang() === "sw";
    const lines = [
      (sw ? "⚡ Taarifa ya Umeme: " : "⚡ Umeme update: ") + state.household.name,
      (sw ? "Uniti zilizobaki: takriban " : "Units left: about ") + fmt(s.unitsNow, 1) + " kWh",
    ];
    if (s.burn !== null) lines.push((sw ? "Kasi ya matumizi: " : "Burn rate: ") + fmt(s.burn, 2) + (sw ? " kWh/siku" : " kWh/day"));
    if (s.daysLeft !== null) {
      lines.push((sw ? "Siku zilizobaki: takriban " : "Days left: about ") + Math.floor(s.daysLeft) +
        " (" + (sw ? "karibu " : "around ") + tr(dateIn(s.daysLeft)) + ")");
    }
    if (s.avgCost) lines.push((sw ? "Wastani wa gharama: KES " : "Average cost: KES ") + fmt(s.avgCost, 2) + (sw ? " kwa kWh" : " per kWh"));
    lines.push((sw ? "Jumla iliyotumika: " : "Spent so far: ") + kes(s.totalSpent));
    window.open("https://wa.me/?text=" + encodeURIComponent(lines.join("\n")), "_blank");
  }

  // ---------- build the extra UI ----------
  function inject() {
    $("status-banner").insertAdjacentHTML("beforebegin", `
      <section id="alert-bar" class="alert-bar hidden" role="alert">
        <div class="alert-icon">!</div>
        <div><strong id="alert-title"></strong><span id="alert-text"></span></div>
        <button type="button" class="alert-dismiss" id="alert-dismiss" aria-label="Dismiss">×</button>
      </section>
    `);

    $("share-card").insertAdjacentHTML("beforebegin", `
      <section class="card" id="money-card">
        <div class="card-head"><div>
          <h2>Where your money goes</h2>
          <p class="muted">A KPLC token pays for more than units. Edit the rates to match your latest KPLC receipt or EPRA notice.</p>
        </div></div>
        <div class="rate-grid">
          <label>Base energy charge (KES/kWh)<input type="number" id="rate-energy" step="0.01" min="0"></label>
          <label>Fuel energy cost (KES/kWh)<input type="number" id="rate-fuel" step="0.01" min="0"></label>
          <label>Forex adjustment (KES/kWh)<input type="number" id="rate-forex" step="0.01" min="0"></label>
          <label>REP levy (% of energy charge)<input type="number" id="rate-rep" step="0.1" min="0"></label>
          <label>EPRA &amp; WARMA levies (KES/kWh)<input type="number" id="rate-levies" step="0.01" min="0"></label>
          <label>VAT (%)<input type="number" id="rate-vat" step="0.1" min="0"></label>
          <label>Example token (KES)<input type="number" id="rate-example" step="10" min="0"></label>
        </div>
        <div class="form-actions" style="margin-bottom:14px">
          <button type="button" class="btn btn-outline btn-sm" id="rates-reset">Reset to defaults</button>
        </div>
        <div class="stack" id="money-stack"></div>
        <div class="legend" id="money-legend"></div>
        <div class="result-box" id="money-summary"></div>
        <p class="hint" id="money-note"></p>
      </section>
    `);
  }

  function addButtons() {
    const right = document.querySelector(".topbar-right");
    const lockBtn = $("lock-btn");

    const theme1 = makeBtn("theme-btn", "btn btn-ghost icon-btn theme-toggle", "Dark / light mode");
    const bell = makeBtn("notify-btn", "btn btn-ghost icon-btn", "Turn on low-units alerts");
    right.insertBefore(theme1, lockBtn);
    right.insertBefore(bell, lockBtn);

    const theme2 = makeBtn("theme-btn-auth", "btn theme-toggle", "Dark / light mode");
    authTools().appendChild(theme2);

    [theme1, theme2].forEach(function (b) {
      b.addEventListener("click", function () { setTheme(getTheme() === "dark" ? "light" : "dark"); });
    });
    bell.addEventListener("click", onBellClick);
  }

  // ---------- start ----------
  inject();
  addButtons();
  setTheme(getTheme());
  updateBell();
  fillRates(loadRates());

  $("alert-dismiss").addEventListener("click", function () {
    const a = buildAlert();
    if (a) dismissed = a.level + todayISO();
    renderAlert();
  });

  Object.keys(RATE_DEFAULTS).forEach(function (k) {
    $("rate-" + k).addEventListener("input", function () {
      saveRates(readRates());
      renderBreakdown();
    });
  });
  $("rate-example").addEventListener("input", function () {
    const v = parseFloat($("rate-example").value);
    exampleOverride = v > 0 ? v : null;
    renderBreakdown();
  });
  $("rates-reset").addEventListener("click", function () {
    fillRates(RATE_DEFAULTS);
    saveRates(Object.assign({}, RATE_DEFAULTS));
    exampleOverride = null;
    renderBreakdown();
    toast("Rates reset to defaults.", "success");
  });

  // replace the English-only WhatsApp button with the bilingual one
  const oldShare = $("share-wa");
  if (oldShare) {
    const fresh = oldShare.cloneNode(true);
    oldShare.parentNode.replaceChild(fresh, oldShare);
    fresh.addEventListener("click", shareWhatsApp);
  }

  // re-run whenever the main app redraws
  const prevRenderAll = renderAll;
  renderAll = function () {
    prevRenderAll();
    renderAlert();
    renderBreakdown();
    maybeNotify();
  };

  // days pass while the page stays open, so re-check now and then
  function refreshIfOpen() {
    if (state.household && !$("app-view").classList.contains("hidden")) renderAll();
  }
  setInterval(refreshIfOpen, 30 * 60 * 1000);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) refreshIfOpen();
  });

})();
