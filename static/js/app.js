const STORAGE_KEY = "umeme_household";

const state = {
  household: null,
  purchases: [],
  appliances: [],
  stats: null,
  editingId: null,
  chartMode: "usage",
  tariffOverride: null,
};

// ---------- helpers ----------
function $(id) { return document.getElementById(id); }

function fmt(n, d) {
  return Number(n).toLocaleString("en-KE", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function kes(n) {
  return "KES " + Number(n).toLocaleString("en-KE", { maximumFractionDigits: 0 });
}

function esc(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

function readNumber(id) {
  const s = $(id).value.trim();
  return s === "" ? NaN : Number(s);
}

let toastTimer = null;
function toast(message, type) {
  const t = $("toast");
  t.textContent = message;
  t.className = "toast " + (type || "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { t.classList.add("hidden"); }, 3500);
}

function setFieldError(inputId, errId, message) {
  $(errId).textContent = message || "";
  $(inputId).classList.toggle("invalid", !!message);
}

// ---------- auth screens ----------
function showAuth(panel) {
  ["lock", "register", "switch"].forEach(function (p) {
    $(p + "-panel").classList.toggle("hidden", p !== panel);
  });
  ["lock-error", "register-error", "switch-error"].forEach(function (id) { $(id).textContent = ""; });
  $("auth-view").classList.remove("hidden");
  $("app-view").classList.add("hidden");
}

function showLock() {
  const h = state.household;
  $("lock-title").textContent = "Welcome back, " + h.name;
  $("lock-meter").textContent = "Meter " + h.meter_number;
  $("lock-pin").value = "";
  showAuth("lock");
  $("lock-pin").focus();
}

async function doLogin(meter, pin, errorEl) {
  try {
    const household = await Api.login({ meter_number: meter, pin: pin });
    Api.pin = pin;
    await enterApp(household);
  } catch (err) {
    errorEl.textContent = err.message;
  }
}

async function handleLock(e) {
  e.preventDefault();
  const pin = $("lock-pin").value.trim();
  if (!/^\d{4}$/.test(pin)) {
    $("lock-error").textContent = "PIN must be exactly 4 digits.";
    return;
  }
  await doLogin(state.household.meter_number, pin, $("lock-error"));
}

async function handleSwitch(e) {
  e.preventDefault();
  const meter = $("switch-meter").value.trim();
  const pin = $("switch-pin").value.trim();
  if (!meter) { $("switch-error").textContent = "Enter the meter number."; return; }
  if (!/^\d{4}$/.test(pin)) { $("switch-error").textContent = "PIN must be exactly 4 digits."; return; }
  await doLogin(meter, pin, $("switch-error"));
}

async function handleRegister(e) {
  e.preventDefault();
  const name = $("reg-name").value.trim();
  const meter = $("reg-meter").value.trim();
  const pin = $("reg-pin").value.trim();
  const pin2 = $("reg-pin2").value.trim();
  const errorEl = $("register-error");

  if (!name) { errorEl.textContent = "Enter a household name."; return; }
  if (!/^[A-Za-z0-9]{4,30}$/.test(meter)) { errorEl.textContent = "Enter a valid meter number (letters and digits only)."; return; }
  if (!/^\d{4}$/.test(pin)) { errorEl.textContent = "PIN must be exactly 4 digits."; return; }
  if (pin !== pin2) { errorEl.textContent = "The two PINs do not match."; return; }

  try {
    const household = await Api.createHousehold({ name: name, meter_number: meter, pin: pin });
    Api.pin = pin;
    await enterApp(household);
  } catch (err) {
    errorEl.textContent = err.message;
  }
}

async function enterApp(household) {
  state.household = household;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(household));
  state.purchases = [];
  state.appliances = [];
  state.editingId = null;
  state.tariffOverride = null;

  $("hh-name").textContent = household.name;
  $("hh-meter").textContent = "Meter " + household.meter_number;
  $("auth-view").classList.add("hidden");
  $("app-view").classList.remove("hidden");
  resetPurchaseForm();
  await loadData();
  window.scrollTo(0, 0);
}

function lockApp() {
  Api.pin = null;
  state.purchases = [];
  state.appliances = [];
  showLock();
}

async function loadData() {
  try {
    const results = await Promise.all([
      Api.listPurchases(state.household.id),
      Api.listAppliances(state.household.id),
    ]);
    state.purchases = results[0];
    state.appliances = results[1];
  } catch (err) {
    toast(err.message, "error");
  }
  renderAll();
}

// ---------- purchase form ----------
function validatePurchase(v) {
  const errs = {};
  if (!v.date) errs.date = "Pick a date.";
  else if (v.date > todayISO()) errs.date = "The date can't be in the future.";
  if (!(v.amount_paid > 0)) errs.amount = "Enter an amount greater than zero.";
  if (!(v.units_bought > 0)) errs.units = "Enter units greater than zero.";
  if (!(v.meter_reading >= 0)) errs.meter = "Enter the units on your meter (0 or more).";
  return errs;
}

function resetPurchaseForm() {
  $("purchase-form").reset();
  $("p-date").value = todayISO();
  $("p-date").max = todayISO();
  state.editingId = null;
  $("p-submit").textContent = "Add purchase";
  $("p-cancel").classList.add("hidden");
  $("form-title").textContent = "Log a token purchase";
  setFieldError("p-date", "e-date", "");
  setFieldError("p-amount", "e-amount", "");
  setFieldError("p-units", "e-units", "");
  setFieldError("p-meter", "e-meter", "");
}

async function handlePurchaseSubmit(e) {
  e.preventDefault();
  const v = {
    date: $("p-date").value,
    amount_paid: readNumber("p-amount"),
    units_bought: readNumber("p-units"),
    meter_reading: readNumber("p-meter"),
  };
  const errs = validatePurchase(v);
  setFieldError("p-date", "e-date", errs.date);
  setFieldError("p-amount", "e-amount", errs.amount);
  setFieldError("p-units", "e-units", errs.units);
  setFieldError("p-meter", "e-meter", errs.meter);
  if (Object.keys(errs).length) return;

  const button = $("p-submit");
  button.disabled = true;
  try {
    if (state.editingId) {
      await Api.updatePurchase(state.editingId, v);
      toast("Purchase updated.", "success");
    } else {
      await Api.addPurchase(state.household.id, v);
      toast("Purchase added.", "success");
    }
    resetPurchaseForm();
    state.purchases = await Api.listPurchases(state.household.id);
    renderAll();
  } catch (err) {
    toast(err.message, "error");
  } finally {
    button.disabled = false;
  }
}

function startEdit(id) {
  const p = state.purchases.find(function (x) { return x.id === id; });
  if (!p) return;
  state.editingId = id;
  $("p-date").value = p.date;
  $("p-amount").value = p.amount_paid;
  $("p-units").value = p.units_bought;
  $("p-meter").value = p.meter_reading;
  $("p-submit").textContent = "Save changes";
  $("p-cancel").classList.remove("hidden");
  $("form-title").textContent = "Edit purchase";
  $("purchase-card").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function removePurchase(id) {
  if (!confirm("Delete this purchase?")) return;
  try {
    await Api.deletePurchase(id);
    if (state.editingId === id) resetPurchaseForm();
    state.purchases = await Api.listPurchases(state.household.id);
    renderAll();
    toast("Purchase deleted.", "success");
  } catch (err) {
    toast(err.message, "error");
  }
}

// ---------- rendering ----------
function renderAll() {
  state.stats = computeStats(state.purchases);
  renderBanner();
  renderStats();
  renderChart();
  renderMonthly();
  renderHistory();
  setTariffInput();
  renderAppliances();
}

function renderBanner() {
  const s = state.stats;
  const el = $("status-banner");
  let cls = "neutral", icon = "i", title = "", text = "";

  if (s.count === 0) {
    title = "Let's get started";
    text = "Log your first KPLC token purchase to begin tracking your electricity.";
  } else if (s.burn === null) {
    title = "One purchase logged";
    text = "Log your next purchase with the meter reading to unlock your burn rate and run-out prediction.";
  } else if (s.burn <= 0) {
    cls = "green"; icon = "✓";
    title = "No usage detected";
    text = "Your meter readings show no consumption between purchases.";
  } else {
    const days = Math.floor(s.daysLeft);
    const when = s.runOutDate ? s.runOutDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";
    if (s.status === "green") {
      cls = "green"; icon = "✓";
      title = "You're in good shape";
      text = "About " + days + " days of electricity left (around " + when + ").";
    } else if (s.status === "amber") {
      cls = "amber"; icon = "!";
      title = "Running lower, plan your next top-up";
      text = "About " + days + " days left at your current burn rate (around " + when + ").";
    } else {
      cls = "red"; icon = "!";
      if (s.unitsNow <= 0) {
        title = "Your units have probably run out";
        text = "Based on your usage, the meter should be at zero. Buy a token as soon as you can.";
      } else {
        title = "Top up soon!";
        text = days < 1 ? "Less than a day of electricity left at your current burn rate." : "Only about " + days + " day(s) left at your current burn rate.";
      }
    }
  }

  el.className = "banner banner-" + cls;
  $("banner-icon").textContent = icon;
  $("banner-title").textContent = title;
  $("banner-text").textContent = text;
}

function renderStats() {
  const s = state.stats;
  $("stat-units").textContent = s.unitsNow !== null ? fmt(s.unitsNow, 1) + " kWh" : "—";
  $("stat-units-sub").textContent = s.burn === null ? (s.count ? "Units after your last top-up" : "No purchases yet") : "Estimated from your last reading";

  $("stat-burn").textContent = s.burn !== null ? fmt(s.burn, 2) + " kWh/day" : "—";
  $("stat-burn-sub").textContent = s.avgBurn !== null ? "Average: " + fmt(s.avgBurn, 2) + " kWh/day" : "Needs 2+ purchases";

  if (s.daysLeft !== null) {
    $("stat-days").textContent = Math.floor(s.daysLeft) + " days";
    $("stat-days-sub").textContent = "Runs out around " + s.runOutDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } else {
    $("stat-days").textContent = "—";
    $("stat-days-sub").textContent = "";
  }

  $("stat-cost").textContent = s.avgCost !== null ? "KES " + fmt(s.avgCost, 2) : "—";
  $("stat-cost-sub").textContent = s.count ? "Total spent " + kes(s.totalSpent) : "";
}

function renderChart() {
  const mode = state.chartMode;
  const points = chartSeries(state.purchases, mode);
  const cfg = {
    usage: { kind: "line", unit: "kWh per day", note: "Daily electricity use between consecutive purchases.", empty: "Log at least 2 purchases to see usage" },
    cost: { kind: "line", unit: "KES per kWh", note: "What you paid per unit on each purchase.", empty: "Log a purchase to see cost per unit" },
    spend: { kind: "bar", unit: "KES", note: "Amount spent on each token purchase.", empty: "Log a purchase to see spending" },
  }[mode];
  $("chart-note").textContent = cfg.note;
  drawChart($("trend-chart"), points, cfg.kind, cfg.unit, cfg.empty);
}

function renderMonthly() {
  const rows = monthlySummary(state.purchases);
  const body = $("monthly-body");
  if (!rows.length) {
    body.innerHTML = '<tr><td colspan="5" class="empty">No purchases yet.</td></tr>';
    return;
  }
  body.innerHTML = rows.map(function (r) {
    const label = new Date(r.key + "-01T00:00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    return "<tr><td>" + label + '</td><td class="num">' + r.count + '</td><td class="num">' + fmt(r.units, 2) +
      '</td><td class="num"><strong>' + kes(r.spent) + '</strong></td><td class="num">' + fmt(r.spent / r.units, 2) + "</td></tr>";
  }).join("");
}

function renderHistory() {
  const body = $("history-body");
  const rows = sortPurchases(state.purchases).reverse();
  if (!rows.length) {
    body.innerHTML = '<tr><td colspan="6" class="empty">No purchases yet. Log your first token above.</td></tr>';
    return;
  }
  body.innerHTML = rows.map(function (p) {
    return "<tr><td>" + fullDate(p.date) + '</td><td class="num">' + kes(p.amount_paid) +
      '</td><td class="num">' + fmt(p.units_bought, 2) +
      '</td><td class="num">' + fmt(p.amount_paid / p.units_bought, 2) +
      '</td><td class="num">' + fmt(p.meter_reading, 2) +
      '</td><td><div class="row-actions">' +
      '<button type="button" class="btn btn-outline btn-sm" data-action="edit" data-id="' + p.id + '">Edit</button>' +
      '<button type="button" class="btn btn-danger btn-sm" data-action="delete" data-id="' + p.id + '">Delete</button>' +
      "</div></td></tr>";
  }).join("");
}

// ---------- appliances ----------
function currentTariff() {
  if (state.tariffOverride) return state.tariffOverride;
  return state.stats && state.stats.avgCost ? state.stats.avgCost : DEFAULT_TARIFF;
}

function setTariffInput() {
  const hasReal = state.stats && state.stats.avgCost;
  if (state.tariffOverride === null) $("cost-per-unit").value = currentTariff().toFixed(2);
  if (state.tariffOverride !== null) $("cost-source").textContent = "Using your custom rate.";
  else if (hasReal) $("cost-source").textContent = "Using your average cost per unit from logged purchases.";
  else $("cost-source").textContent = "Default estimate. Log purchases to get your real rate.";
}

function setupAppliancePicker() {
  const select = $("a-select");
  select.innerHTML = APPLIANCES.map(function (a) {
    return '<option value="' + esc(a.name) + '">' + esc(a.name) + "</option>";
  }).join("") + '<option value="custom">Custom appliance…</option>';
  onApplianceChange();
}

function onApplianceChange() {
  const value = $("a-select").value;
  if (value === "custom") {
    $("a-custom-wrap").classList.remove("hidden");
    $("a-watts").value = "";
  } else {
    $("a-custom-wrap").classList.add("hidden");
    const preset = APPLIANCES.find(function (a) { return a.name === value; });
    if (preset) $("a-watts").value = preset.watts;
  }
}

async function handleApplianceSubmit(e) {
  e.preventDefault();
  const selected = $("a-select").value;
  const name = selected === "custom" ? $("a-name").value.trim() : selected;
  const watts = readNumber("a-watts");
  const qty = readNumber("a-qty");
  const hours = readNumber("a-hours");

  let error = "";
  if (!name) error = "Enter a name for the appliance.";
  else if (!Number.isInteger(watts) || watts < 1 || watts > 20000) error = "Watts must be a whole number from 1 to 20000.";
  else if (!Number.isInteger(qty) || qty < 1 || qty > 50) error = "Quantity must be a whole number from 1 to 50.";
  else if (!(hours > 0 && hours <= 24)) error = "Hours per day must be more than 0 and at most 24.";
  $("appliance-error").textContent = error;
  if (error) return;

  try {
    await Api.addAppliance(state.household.id, { name: name, watts: watts, quantity: qty, hours_per_day: hours });
    state.appliances = await Api.listAppliances(state.household.id);
    renderAppliances();
    $("a-hours").value = "";
    $("a-qty").value = 1;
    if (selected === "custom") $("a-name").value = "";
    toast("Appliance saved.", "success");
  } catch (err) {
    toast(err.message, "error");
  }
}

async function removeAppliance(id) {
  try {
    await Api.deleteAppliance(id);
    state.appliances = await Api.listAppliances(state.household.id);
    renderAppliances();
    toast("Appliance removed.", "success");
  } catch (err) {
    toast(err.message, "error");
  }
}

function renderAppliances() {
  const tariff = currentTariff();
  const body = $("appliance-body");
  const foot = $("appliance-foot");
  const box = $("compare-box");

  if (!state.appliances.length) {
    body.innerHTML = '<tr><td colspan="9" class="empty">No appliances saved yet. Add the ones you use above.</td></tr>';
    foot.innerHTML = "";
    box.className = "compare-box compare-neutral";
    box.textContent = "Save your appliances to compare their estimated usage with your actual metered usage.";
    return;
  }

  const rows = state.appliances.map(function (a) { return { a: a, c: applianceCalc(a, tariff) }; });
  const total = rows.reduce(function (t, r) {
    return { kwh: t.kwh + r.c.kwh, perDay: t.perDay + r.c.perDay, perMonth: t.perMonth + r.c.perMonth };
  }, { kwh: 0, perDay: 0, perMonth: 0 });

  body.innerHTML = rows.map(function (r) {
    const share = total.perDay > 0 ? (r.c.perDay / total.perDay) * 100 : 0;
    return "<tr><td>" + esc(r.a.name) + '</td><td class="num">' + r.a.watts +
      '</td><td class="num">' + r.a.quantity +
      '</td><td class="num">' + fmt(r.a.hours_per_day, 1) +
      '</td><td class="num">' + fmt(r.c.kwh, 2) +
      '</td><td class="num">' + kes(r.c.perDay) +
      '</td><td class="num">' + kes(r.c.perMonth) +
      '</td><td><div class="share-bar"><span style="width:' + share.toFixed(0) + '%"></span></div></td>' +
      '<td><button type="button" class="btn btn-danger btn-sm" data-action="del-app" data-id="' + r.a.id + '">Remove</button></td></tr>';
  }).join("");

  foot.innerHTML = '<tr><td colspan="4">Total</td><td class="num">' + fmt(total.kwh, 2) +
    '</td><td class="num">' + kes(total.perDay) + '</td><td class="num">' + kes(total.perMonth) + '</td><td colspan="2"></td></tr>';

  const top = rows.reduce(function (m, r) { return r.c.perDay > m.c.perDay ? r : m; }, rows[0]);
  const topShare = total.perDay > 0 ? (top.c.perDay / total.perDay) * 100 : 0;
  const topLine = "Biggest cost: <strong>" + esc(top.a.name) + "</strong> (" + fmt(topShare, 0) + "% of your appliance bill).";

  const burn = state.stats ? state.stats.burn : null;
  let cls, html;
  if (burn === null || burn <= 0) {
    cls = "compare-neutral";
    html = "Not enough metered usage yet. Log at least two token purchases to compare this estimate with your real usage. " + topLine;
  } else {
    const diff = ((total.kwh - burn) / burn) * 100;
    if (Math.abs(diff) <= 20) {
      cls = "compare-ok";
      html = "<strong>Good match.</strong> Your appliances add up to " + fmt(total.kwh, 2) + " kWh/day against " + fmt(burn, 2) +
        " kWh/day on the meter (" + fmt(Math.abs(diff), 0) + "% " + (diff >= 0 ? "above" : "below") + "). ";
    } else if (diff < 0) {
      cls = "compare-warn";
      html = "<strong>Mismatch.</strong> Your appliances explain only " + fmt((total.kwh / burn) * 100, 0) + "% of your metered usage (" +
        fmt(total.kwh, 2) + " vs " + fmt(burn, 2) + " kWh/day). You may be missing appliances or underestimating hours. ";
    } else {
      cls = "compare-warn";
      html = "<strong>Mismatch.</strong> Your estimate of " + fmt(total.kwh, 2) + " kWh/day is " + fmt(diff, 0) +
        "% higher than the metered " + fmt(burn, 2) + " kWh/day. Hours of use may be overestimated. ";
    }
    html += topLine;
  }
  box.className = "compare-box " + cls;
  box.innerHTML = html;
}

// ---------- events ----------
function bindEvents() {
  $("lock-form").addEventListener("submit", handleLock);
  $("register-form").addEventListener("submit", handleRegister);
  $("switch-form").addEventListener("submit", handleSwitch);

  $("show-switch-from-lock").addEventListener("click", function () { showAuth("switch"); });
  $("show-switch-from-register").addEventListener("click", function () { showAuth("switch"); });
  $("show-register-from-switch").addEventListener("click", function () { showAuth("register"); });
  $("switch-back").addEventListener("click", function () {
    if (state.household) showLock(); else showAuth("register");
  });

  $("lock-btn").addEventListener("click", lockApp);
  $("switch-btn").addEventListener("click", function () {
    Api.pin = null;
    state.purchases = [];
    state.appliances = [];
    $("switch-meter").value = "";
    $("switch-pin").value = "";
    showAuth("switch");
  });

  document.querySelectorAll(".pin-input").forEach(function (input) {
    input.addEventListener("input", function () { input.value = input.value.replace(/\D/g, ""); });
  });

  $("purchase-form").addEventListener("submit", handlePurchaseSubmit);
  $("p-cancel").addEventListener("click", resetPurchaseForm);

  $("history-body").addEventListener("click", function (e) {
    const button = e.target.closest("button[data-action]");
    if (!button) return;
    const id = Number(button.dataset.id);
    if (button.dataset.action === "edit") startEdit(id);
    if (button.dataset.action === "delete") removePurchase(id);
  });

  document.querySelectorAll("#chart-modes button").forEach(function (button) {
    button.addEventListener("click", function () {
      document.querySelectorAll("#chart-modes button").forEach(function (b) { b.classList.remove("active"); });
      button.classList.add("active");
      state.chartMode = button.dataset.mode;
      renderChart();
    });
  });

  $("a-select").addEventListener("change", onApplianceChange);
  $("appliance-form").addEventListener("submit", handleApplianceSubmit);
  $("appliance-body").addEventListener("click", function (e) {
    const button = e.target.closest("button[data-action='del-app']");
    if (button) removeAppliance(Number(button.dataset.id));
  });

  $("cost-per-unit").addEventListener("input", function () {
    const value = parseFloat($("cost-per-unit").value);
    state.tariffOverride = value > 0 ? value : null;
    setTariffInput();
    renderAppliances();
  });

  let resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (!$("app-view").classList.contains("hidden")) renderChart();
    }, 150);
  });
}

function init() {
  setupAppliancePicker();
  bindEvents();

  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (err) { saved = null; }

  if (saved && saved.id && saved.meter_number) {
    state.household = saved;
    showLock();
  } else {
    showAuth("register");
  }
}

init();
