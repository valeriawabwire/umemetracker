function drawChart(canvas, points, kind, unit, emptyMsg) {
  const wrap = canvas.parentElement;
  const w = Math.max(280, wrap.clientWidth);
  const h = 300;
  const dpr = window.devicePixelRatio || 1;

  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const font = "12px 'Segoe UI', Arial, sans-serif";
  ctx.font = font;

  if (!points.length) {
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "14px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(emptyMsg || "No data yet", w / 2, h / 2);
    return;
  }

  const pad = { l: 54, r: 16, t: 26, b: 46 };
  const pw = w - pad.l - pad.r;
  const ph = h - pad.t - pad.b;

  let max = Math.max.apply(null, points.map(function (p) { return p.value; }));
  if (!(max > 0)) max = 1;
  max = max * 1.15;
  const decimals = max < 10 ? 1 : 0;

  // grid + y labels
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#64748b";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + ph - (ph * i) / 4;
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(w - pad.r, y);
    ctx.stroke();
    ctx.fillText((max * i / 4).toFixed(decimals), pad.l - 8, y);
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText(unit, pad.l, pad.t - 8);

  const n = points.length;
  const step = pw / n;
  const xAt = function (i) { return pad.l + step * (i + 0.5); };
  const yAt = function (v) { return pad.t + ph - (v / max) * ph; };
  const baseY = pad.t + ph;

  if (kind === "bar") {
    const bw = Math.min(46, step * 0.6);
    points.forEach(function (p, i) {
      const x = xAt(i) - bw / 2;
      const y = yAt(p.value);
      const grad = ctx.createLinearGradient(0, y, 0, baseY);
      grad.addColorStop(0, "#3b82f6");
      grad.addColorStop(1, "#1d4ed8");
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, bw, baseY - y);
    });
  } else {
    // area fill
    ctx.beginPath();
    points.forEach(function (p, i) {
      if (i === 0) ctx.moveTo(xAt(i), yAt(p.value));
      else ctx.lineTo(xAt(i), yAt(p.value));
    });
    ctx.lineTo(xAt(n - 1), baseY);
    ctx.lineTo(xAt(0), baseY);
    ctx.closePath();
    const area = ctx.createLinearGradient(0, pad.t, 0, baseY);
    area.addColorStop(0, "rgba(37,99,235,.25)");
    area.addColorStop(1, "rgba(37,99,235,0)");
    ctx.fillStyle = area;
    ctx.fill();

    // line
    ctx.beginPath();
    points.forEach(function (p, i) {
      if (i === 0) ctx.moveTo(xAt(i), yAt(p.value));
      else ctx.lineTo(xAt(i), yAt(p.value));
    });
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.stroke();

    // dots
    points.forEach(function (p, i) {
      ctx.beginPath();
      ctx.arc(xAt(i), yAt(p.value), 4.5, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#2563eb";
      ctx.stroke();
    });
  }

  // value labels
  if (n <= 12) {
    ctx.fillStyle = "#0f172a";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    points.forEach(function (p, i) {
      ctx.fillText(p.value.toFixed(p.value < 10 ? 2 : 0), xAt(i), yAt(p.value) - 8);
    });
  }

  // x labels
  ctx.fillStyle = "#64748b";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const every = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(pw / 64))));
  points.forEach(function (p, i) {
    if (i % every === 0) ctx.fillText(p.label, xAt(i), baseY + 10);
  });
}
