const APPLIANCES = [
  { name: "Refrigerator", watts: 150 },
  { name: "Deep Freezer", watts: 200 },
  { name: "Electric Iron", watts: 1000 },
  { name: "Electric Kettle", watts: 2000 },
  { name: "Television", watts: 100 },
  { name: "LED Bulb", watts: 12 },
  { name: "Incandescent Bulb", watts: 60 },
  { name: "Washing Machine", watts: 500 },
  { name: "Microwave", watts: 1200 },
  { name: "Desktop Computer", watts: 200 },
  { name: "Laptop Charger", watts: 65 },
  { name: "Electric Shower / Water Heater", watts: 3000 },
  { name: "Standing Fan", watts: 75 },
  { name: "Wi-Fi Router", watts: 10 },
  { name: "Phone Charger", watts: 10 },
];

const DEFAULT_TARIFF = 25; // KES per kWh, used until real purchases give a better average

function pad2(n) { return String(n).padStart(2, "0"); }

function todayISO() {
  const d = new Date();
  return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
}

function daysBetween(fromISO, toISO) {
  const a = new Date(fromISO + "T00:00:00");
  const b = new Date(toISO + "T00:00:00");
  return Math.round((b - a) / 86400000);
}

function shortDate(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function fullDate(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function sortPurchases(list) {
  return list.slice().sort(function (a, b) {
    if (a.date === b.date) return a.id - b.id;
    return a.date < b.date ? -1 : 1;
  });
}

// Burn rate between each pair of consecutive purchases:
// units on meter after the previous top-up, minus the reading before this top-up, divided by days.
function computeSegments(list) {
  const sorted = sortPurchases(list);
  const segments = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    const days = daysBetween(prev.date, cur.date);
    const consumed = prev.meter_reading + prev.units_bought - cur.meter_reading;
    if (days > 0 && consumed >= 0) {
      segments.push({ from: prev.date, to: cur.date, days: days, consumed: consumed, rate: consumed / days });
    }
  }
  return segments;
}

function computeStats(list) {
  const sorted = sortPurchases(list);
  const segments = computeSegments(list);
  const out = {
    count: sorted.length,
    segments: segments,
    burn: null,
    avgBurn: null,
    unitsNow: null,
    daysLeft: null,
    runOutDate: null,
    avgCost: null,
    totalSpent: 0,
    totalUnits: 0,
    status: "neutral",
  };

  sorted.forEach(function (p) {
    out.totalSpent += p.amount_paid;
    out.totalUnits += p.units_bought;
  });
  if (out.totalUnits > 0) out.avgCost = out.totalSpent / out.totalUnits;

  if (segments.length) {
    out.burn = segments[segments.length - 1].rate;
    const consumed = segments.reduce(function (s, x) { return s + x.consumed; }, 0);
    const days = segments.reduce(function (s, x) { return s + x.days; }, 0);
    out.avgBurn = consumed / days;
  }

  if (sorted.length) {
    const last = sorted[sorted.length - 1];
    const sinceLast = Math.max(0, daysBetween(last.date, todayISO()));
    const afterTopUp = last.meter_reading + last.units_bought;
    if (out.burn !== null) {
      out.unitsNow = Math.max(0, afterTopUp - out.burn * sinceLast);
      if (out.burn > 0) {
        out.daysLeft = out.unitsNow / out.burn;
        const d = new Date();
        d.setDate(d.getDate() + Math.floor(out.daysLeft));
        out.runOutDate = d;
      }
    } else {
      out.unitsNow = afterTopUp;
    }
  }

  if (out.burn === null) out.status = "neutral";
  else if (out.burn <= 0) out.status = "green";
  else if (out.daysLeft >= 7) out.status = "green";
  else if (out.daysLeft >= 3) out.status = "amber";
  else out.status = "red";

  return out;
}

function monthlySummary(list) {
  const map = {};
  list.forEach(function (p) {
    const key = p.date.slice(0, 7);
    if (!map[key]) map[key] = { key: key, count: 0, spent: 0, units: 0 };
    map[key].count += 1;
    map[key].spent += p.amount_paid;
    map[key].units += p.units_bought;
  });
  return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) {
    return a.key < b.key ? 1 : -1;
  });
}

function chartSeries(list, mode) {
  if (mode === "usage") {
    return computeSegments(list).map(function (s) { return { label: shortDate(s.to), value: s.rate }; });
  }
  const sorted = sortPurchases(list);
  if (mode === "cost") {
    return sorted.map(function (p) { return { label: shortDate(p.date), value: p.amount_paid / p.units_bought }; });
  }
  return sorted.map(function (p) { return { label: shortDate(p.date), value: p.amount_paid }; });
}

function applianceCalc(a, tariff) {
  const kwh = (a.watts * a.quantity * a.hours_per_day) / 1000;
  return { kwh: kwh, perDay: kwh * tariff, perMonth: kwh * tariff * 30 };
}
