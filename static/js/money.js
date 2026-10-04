(function () {
  var KEY = "umeme_rates";
  var DEFAULTS = { energy: 16.45, fuel: 3.51, forex: 1.18, wra: 0.015, vat: 16, rep: 5, epra: 1 };
  var FIELDS = [
    { key: "energy", label: "Energy charge (KES/kWh)", step: "0.01" },
    { key: "fuel", label: "Fuel energy cost (KES/kWh)", step: "0.01" },
    { key: "forex", label: "Forex adjustment (KES/kWh)", step: "0.01" },
    { key: "wra", label: "WRA levy (KES/kWh)", step: "0.001" },
    { key: "vat", label: "VAT (%)", step: "0.1" },
    { key: "rep", label: "REP levy (% of energy)", step: "0.1" },
    { key: "epra", label: "EPRA levy (% of energy)", step: "0.1" }
  ];

  function loadRates() {
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { saved = {}; }
    var out = {};
    Object.keys(DEFAULTS).forEach(function (k) {
      var v = saved[k];
      out[k] = (typeof v === "number" && isFinite(v) && v >= 0) ? v : DEFAULTS[k];
    });
    return out;
  }

  var rates = loadRates();

  function saveRates() {
    try { localStorage.setItem(KEY, JSON.stringify(rates)); } catch (e) { /* ignore */ }
  }

  // price of one kWh, split into its parts
  function parts(r) {
    var vat = (r.energy + r.fuel + r.forex) * r.vat / 100;
    var rep = r.energy * r.rep / 100;
    var epra = r.energy * r.epra / 100;
    return {
      energy: r.energy, fuel: r.fuel, forex: r.forex, vat: vat, rep: rep, epra: epra, wra: r.wra,
      total: r.energy + r.fuel + r.forex + vat + rep + epra + r.wra
    };
  }

  function injectUI() {
    var inputs = FIELDS.map(function (f) {
      return '<label>' + f.label + '<input type="number" id="rate-' + f.key + '" min="0" step="' + f.step + '"></label>';
    }).join("");

    document.getElementById("appliance-card").insertAdjacentHTML("afterend", `
      <section class="card" id="money-card">
        <div class="card-head">
          <div>
            <h2>Where your money goes</h2>
            <p class="muted">A KPLC token pays for more than electricity. This is an estimate of the split.</p>
          </div>
          <label class="inline-select">Show for
            <select id="money-scope">
              <option value="all">All my purchases</option>
              <option value="month">This month</option>
              <option value="example">A KES 1,000 token</option>
            </select>
          </label>
        </div>

        <div class="money-tiles">
          <div class="tile">
            <div class="stat-label">Energy itself</div>
            <div class="stat-value" id="tile-energy">—</div>
            <div class="stat-sub" id="tile-energy-sub"></div>
          </div>
          <div class="tile tile-fuel">
            <div class="stat-label">Fuel &amp; forex</div>
            <div class="stat-value" id="tile-fuel">—</div>
            <div class="stat-sub" id="tile-fuel-sub"></div>
          </div>
          <div class="tile tile-tax">
            <div class="stat-label">Taxes &amp; levies</div>
            <div class="stat-value" id="tile-tax">—</div>
            <div class="stat-sub" id="tile-tax-sub"></div>
          </div>
        </div>

        <div class="stack-bar" id="money-bar"></div>

        <div class="table-wrap">
          <table>
            <thead><tr><th>Item</th><th class="num">KES per kWh</th><th class="num">Share</th></tr></thead>
            <tbody id="money-body"></tbody>
            <tfoot id="money-foot"></tfoot>
          </table>
        </div>

        <div class="result-box" id="money-insight" style="margin-top:14px"></div>

        <details class="rates-box">
          <summary>Edit the rates (they change every month)</summary>
          <div class="rates-grid">${inputs}</div>
          <p class="hint">Rates change monthly. Check EPRA's gazette notices or your KPLC statement and update the numbers. They are saved on this device.</p>
          <button type="button" class="btn btn-outline btn-sm" id="rates-reset" style="margin-top:10px">Reset to defaults</button>
        </details>
      </section>
    `);
  }

  function fillInputs() {
    FIELDS.forEach(function (f) { document.getElementById("rate-" + f.key).value = rates[f.key]; });
  }

  function renderMoney() {
    if (!state.stats) return;
    var p = parts(rates);
    var bar = document.getElementById("money-bar");
    if (!(p.total > 0)) {
      bar.innerHTML = "";
      document.getElementById("money-body").innerHTML = "";
      document.getElementById("money-foot").innerHTML = "";
      return;
    }

    var scope = document.getElementById("money-scope").value;
    var base = 1000;
    var example = false;
    if (scope === "all") {
      base = state.stats.totalSpent;
    } else if (scope === "month") {
      var mk = todayISO().slice(0, 7);
      var row = monthlySummary(state.purchases).find(function (m) { return m.key === mk; });
      base = row ? row.spent : 0;
    }
    if (scope !== "example" && !(base > 0)) { base = 1000; example = true; }

    var levies = p.rep + p.epra + p.wra;
    var energyShare = p.energy / p.total * 100;
    var fuelShare = (p.fuel + p.forex) / p.total * 100;
    var taxShare = (p.vat + levies) / p.total * 100;

    document.getElementById("tile-energy").textContent = kes(base * energyShare / 100);
    document.getElementById("tile-fuel").textContent = kes(base * fuelShare / 100);
    document.getElementById("tile-tax").textContent = kes(base * taxShare / 100);
    document.getElementById("tile-energy-sub").textContent = fmt(energyShare, 0) + "% of what you pay";
    document.getElementById("tile-fuel-sub").textContent = fmt(fuelShare, 0) + "% of what you pay";
    document.getElementById("tile-tax-sub").textContent = fmt(taxShare, 0) + "% of what you pay";

    var segs = [
      { w: p.energy, c: "#2563eb" },
      { w: p.fuel + p.forex, c: "#f59e0b" },
      { w: p.vat, c: "#dc2626" },
      { w: levies, c: "#7c3aed" }
    ];
    bar.innerHTML = segs.map(function (s) {
      return '<span style="width:' + (s.w / p.total * 100).toFixed(2) + '%;background:' + s.c + '"></span>';
    }).join("");

    var vatLabel = fmt(rates.vat, 1).replace(/\.0$/, "");
    var rows = [
      ["Energy charge", p.energy, "#2563eb"],
      ["Fuel energy cost", p.fuel, "#f59e0b"],
      ["Forex adjustment", p.forex, "#f59e0b"],
      ["VAT (" + vatLabel + "%)", p.vat, "#dc2626"],
      ["REP levy", p.rep, "#7c3aed"],
      ["EPRA levy", p.epra, "#7c3aed"],
      ["WRA levy", p.wra, "#7c3aed"]
    ];
    document.getElementById("money-body").innerHTML = rows.map(function (r) {
      var value = r[1] < 0.1 ? r[1].toFixed(3) : r[1].toFixed(2);
      return '<tr><td><i class="chip" style="background:' + r[2] + '"></i>' + r[0] + '</td><td class="num">' + value +
        '</td><td class="num">' + fmt(r[1] / p.total * 100, 1) + "%</td></tr>";
    }).join("");

    document.getElementById("money-foot").innerHTML =
      '<tr><td>All-in price per unit</td><td class="num">KES ' + fmt(p.total, 2) + '</td><td class="num">100%</td></tr>';

    var perThousand = 1000 / p.total;
    var withoutTax = 1000 / (p.energy + p.fuel + p.forex);
    var html = 'Only about <strong>' + fmt(energyShare, 0) + '%</strong> of each token pays for the energy itself. ' +
      'On every KES 1,000 you buy about ' + fmt(perThousand, 1) + ' kWh. ' +
      'Without VAT and levies you would get about ' + fmt(withoutTax, 1) + ' kWh.';
    if (state.stats.avgCost) {
      html += '<br>Your real average is KES ' + fmt(state.stats.avgCost, 2) + ' per kWh; this estimate is KES ' + fmt(p.total, 2) +
        '. If they differ a lot, update the rates below.';
    }
    if (example) {
      html += '<br>Showing an example KES 1,000 token because you have no purchases for this period yet.';
    }
    document.getElementById("money-insight").innerHTML = html;
  }

  injectUI();
  fillInputs();

  FIELDS.forEach(function (f) {
    document.getElementById("rate-" + f.key).addEventListener("input", function (e) {
      var v = parseFloat(e.target.value);
      if (isFinite(v) && v >= 0) {
        rates[f.key] = v;
        saveRates();
        renderMoney();
      }
    });
  });

  document.getElementById("rates-reset").addEventListener("click", function () {
    rates = JSON.parse(JSON.stringify(DEFAULTS));
    saveRates();
    fillInputs();
    renderMoney();
  });

  document.getElementById("money-scope").addEventListener("change", renderMoney);

  var baseRenderAll = renderAll;
  renderAll = function () { baseRenderAll(); renderMoney(); };
})();
