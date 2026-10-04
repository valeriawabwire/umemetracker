(function () {

  // ---------- add the new sections to the page ----------
  function injectUI() {
    document.querySelector(".stats-grid").insertAdjacentHTML("afterend", `
      <div class="grid-2" id="extras-grid">
        <section class="card" id="budget-card">
          <div class="card-head"><div>
            <h2>Monthly budget</h2>
            <p class="muted">Set a limit and watch your spending.</p>
          </div></div>
          <div class="budget-row">
            <label>Budget (KES per month)
              <input type="number" id="budget-input" min="0" step="50" placeholder="e.g. 3000">
            </label>
            <button type="button" class="btn btn-primary" id="budget-save">Save</button>
          </div>
          <div class="progress hidden" id="budget-bar"><span id="budget-fill"></span></div>
          <div class="result-box" id="budget-result"></div>
        </section>

        <section class="card" id="planner-card">
          <div class="card-head"><div>
            <h2>Smart top-up planner</h2>
            <p class="muted">Know what a token will give you before you pay.</p>
          </div></div>
          <div class="planner-grid">
            <label>If I spend (KES)
              <input type="number" id="plan-amount" min="0" step="10" placeholder="e.g. 500">
            </label>
            <label>I want it to last (days)
              <input type="number" id="plan-days" min="0" step="1" placeholder="e.g. 30">
            </label>
            <div class="result-box" id="plan-spend-result"></div>
            <div class="result-box" id="plan-days-result"></div>
          </div>
          <div class="table-wrap ladder">
            <table>
              <thead><tr><th>Token amount</th><th class="num">You get</th><th class="num">Lasts about</th></tr></thead>
              <tbody id="ladder-body"></tbody>
            </table>
          </div>
          <p class="hint" id="plan-note" style="margin-top:8px"></p>
        </section>
      </div>
    `);

    document.getElementById("compare-box").insertAdjacentHTML("afterend", '<div id="tips-box" class="tips-box hidden"></div>');

    document.querySelector(".container").insertAdjacentHTML("beforeend", `
      <section class="card" id="share-card">
        <div class="card-head"><div>
          <h2>Share &amp; export</h2>
          <p class="muted">Send an update to the family or keep a copy of your records.</p>
        </div></div>
        <div class="share-actions">
          <button type="button" class="btn btn-whatsapp" id="share-wa">Share on WhatsApp</button>
          <button type="button" class="btn btn-outline" id="export-csv">Download CSV</button>
          <button type="button" class="btn btn-outline" id="print-btn">Print report</button>
        </div>
      </section>
    `);
  }

  // ---------- helpers ----------
  function rate() {
    return state.stats && state.stats.avgCost ? state.stats.avgCost : DEFAULT_TARIFF;
  }

  function planContext() {
    const s = state.stats;
    return {
      rate: rate(),
      burn: s && s.burn && s.burn > 0 ? s.burn : null,
      have: s && s.unitsNow ? s.unitsNow : 0,
    };
  }

  function dateIn(days) {
    const d = new Date();
    d.setDate(d.getDate() + Math.floor(days));
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }

  // ---------- monthly budget ----------
  function budgetKey() { return "umeme_budget_" + state.household.id; }

  function loadBudget() {
    try {
      const v = parseFloat(localStorage.getItem(budgetKey()));
      return v > 0 ? v : null;
    } catch (err) { return null; }
  }

  function saveBudget(value) {
    try {
      if (value > 0) localStorage.setItem(budgetKey(), String(value));
      else localStorage.removeItem(budgetKey());
    } catch (err) { /* ignore */ }
  }

  function renderBudget() {
    const s = state.stats;
    const budget = loadBudget();
    const input = document.getElementById("budget-input");
    if (document.activeElement !== input) input.value = budget || "";

    const monthKey = todayISO().slice(0, 7);
    const row = monthlySummary(state.purchases).find(function (m) { return m.key === monthKey; });
    const spent = row ? row.spent : 0;

    let estimate = null;
    if (s.burn !== null && s.burn > 0) estimate = s.burn * rate() * 30;

    const bar = document.getElementById("budget-bar");
    const box = document.getElementById("budget-result");
    let html = "";

    if (budget) {
      const pct = (spent / budget) * 100;
      bar.className = "progress" + (pct >= 100 ? " red" : pct >= 75 ? " amber" : "");
      document.getElementById("budget-fill").style.width = Math.min(100, pct).toFixed(0) + "%";
      html += "<strong>" + kes(spent) + "</strong> of " + kes(budget) + " spent this month (" + fmt(pct, 0) + "%). ";
      html += pct >= 100 ? "You are over budget." : kes(budget - spent) + " left.";
    } else {
      bar.className = "progress hidden";
      html += "Set a monthly budget to track what you spend on tokens. ";
    }

    if (estimate !== null) {
      html += "<br>Your usage costs roughly <strong>" + kes(estimate) + "</strong> a month (" + fmt(s.burn, 2) + " kWh/day × KES " + fmt(rate(), 2) + " × 30).";
      if (budget && estimate > budget) html += " That is above your budget. See the saving tips in the appliance section.";
    }
    box.innerHTML = html;
  }

  // ---------- top-up planner ----------
  function calcSpend() {
    const out = document.getElementById("plan-spend-result");
    const amount = parseFloat(document.getElementById("plan-amount").value);
    if (!(amount > 0)) { out.textContent = "Enter an amount to see what it buys."; return; }
    const c = planContext();
    const units = amount / c.rate;
    let html = kes(amount) + " buys about <strong>" + fmt(units, 1) + " kWh</strong>.";
    if (c.burn) {
      const days = (c.have + units) / c.burn;
      html += " With the ~" + fmt(c.have, 1) + " kWh you have left, that lasts about <strong>" + Math.floor(days) + " days</strong> (until " + dateIn(days) + ").";
    }
    out.innerHTML = html;
  }

  function calcDays() {
    const out = document.getElementById("plan-days-result");
    const days = parseFloat(document.getElementById("plan-days").value);
    if (!(days > 0)) { out.textContent = "Enter the number of days to see how much to buy."; return; }
    const c = planContext();
    if (!c.burn) { out.textContent = "Log at least two purchases so I can learn your daily usage."; return; }
    const need = c.burn * days - c.have;
    if (need <= 0) {
      out.innerHTML = "<strong>You already have enough</strong> for " + days + " days at your current usage.";
    } else {
      out.innerHTML = "To last " + days + " days you need about <strong>" + fmt(need, 1) + " kWh</strong> more, roughly <strong>" + kes(need * c.rate) + "</strong>.";
    }
  }

  function renderPlanner() {
    const c = planContext();
    const amounts = [100, 200, 500, 1000, 2000];
    document.getElementById("ladder-body").innerHTML = amounts.map(function (a) {
      const units = a / c.rate;
      const lasts = c.burn ? Math.max(1, Math.round((c.have + units) / c.burn)) + " days" : "—";
      return "<tr><td>" + kes(a) + '</td><td class="num">' + fmt(units, 1) + ' kWh</td><td class="num">' + lasts + "</td></tr>";
    }).join("");
    document.getElementById("plan-note").textContent =
      "Estimates use your average of KES " + fmt(c.rate, 2) + " per kWh" + (state.stats && state.stats.avgCost ? "" : " (default until you log purchases)") + ". Real KPLC tokens can differ slightly.";
    calcSpend();
    calcDays();
  }

  // ---------- saving tips ----------
  function renderTips() {
    const box = document.getElementById("tips-box");
    if (!box) return;
    if (!state.appliances.length) { box.classList.add("hidden"); return; }

    const tariff = currentTariff();
    const tips = [];

    state.appliances.forEach(function (a) {
      const oneHour = Math.min(a.hours_per_day, 1);
      const saving = (a.watts * a.quantity * oneHour / 1000) * tariff * 30;
      tips.push({ saving: saving, text: "Use your <strong>" + esc(a.name) + "</strong> 1 hour less each day and save about <strong>" + kes(saving) + "</strong> a month." });
    });
    tips.sort(function (x, y) { return y.saving - x.saving; });
    const top = tips.slice(0, 3).map(function (t) { return t.text; });

    state.appliances.forEach(function (a) {
      if (/incandescent/i.test(a.name) && a.watts > 12) {
        const saving = ((a.watts - 12) * a.quantity * a.hours_per_day / 1000) * tariff * 30;
        top.unshift("Swap your <strong>" + a.quantity + " incandescent bulb(s)</strong> for LED and save about <strong>" + kes(saving) + "</strong> a month.");
      }
    });

    box.innerHTML = "<h3>Ways to save</h3><ul>" + top.map(function (t) { return "<li>" + t + "</li>"; }).join("") + "</ul>";
    box.classList.remove("hidden");
  }

  // ---------- share and export ----------
  function shareWhatsApp() {
    const s = state.stats;
    if (!s || !s.count) { toast("Log a purchase first.", "error"); return; }
    const lines = ["⚡ Umeme update: " + state.household.name, "Units left: about " + fmt(s.unitsNow, 1) + " kWh"];
    if (s.burn !== null) lines.push("Burn rate: " + fmt(s.burn, 2) + " kWh/day");
    if (s.daysLeft !== null) lines.push("Days left: about " + Math.floor(s.daysLeft) + " (around " + dateIn(s.daysLeft) + ")");
    if (s.avgCost) lines.push("Average cost: KES " + fmt(s.avgCost, 2) + " per kWh");
    lines.push("Spent so far: " + kes(s.totalSpent));
    window.open("https://wa.me/?text=" + encodeURIComponent(lines.join("\n")), "_blank");
  }

  function downloadCSV() {
    if (!state.purchases.length) { toast("No purchases to export yet.", "error"); return; }
    const rows = [["Date", "Amount paid (KES)", "Units bought (kWh)", "Meter reading before (kWh)", "KES per kWh"]];
    sortPurchases(state.purchases).forEach(function (p) {
      rows.push([p.date, p.amount_paid.toFixed(2), p.units_bought.toFixed(2), p.meter_reading.toFixed(2), (p.amount_paid / p.units_bought).toFixed(2)]);
    });
    const csv = rows.map(function (r) { return r.join(","); }).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "umeme-" + state.household.meter_number + "-" + todayISO() + ".csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  // ---------- wire everything up ----------
  function renderExtras() {
    renderBudget();
    renderPlanner();
    renderTips();
  }

  injectUI();

  document.getElementById("budget-save").addEventListener("click", function () {
    const value = parseFloat(document.getElementById("budget-input").value);
    saveBudget(value > 0 ? value : null);
    renderBudget();
    toast(value > 0 ? "Budget saved." : "Budget cleared.", "success");
  });
  document.getElementById("plan-amount").addEventListener("input", calcSpend);
  document.getElementById("plan-days").addEventListener("input", calcDays);
  document.getElementById("share-wa").addEventListener("click", shareWhatsApp);
  document.getElementById("export-csv").addEventListener("click", downloadCSV);
  document.getElementById("print-btn").addEventListener("click", function () { window.print(); });

  // re-run the extras whenever the main app redraws
  const baseRenderAll = renderAll;
  renderAll = function () { baseRenderAll(); renderExtras(); };
  const baseRenderAppliances = renderAppliances;
  renderAppliances = function () { baseRenderAppliances(); renderTips(); };

})();
