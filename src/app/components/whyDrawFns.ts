// Canvas draw functions for the "Why?" particle cards.
// Each function renders a bold graphic that gets sampled into dots.

/**
 * Card 1: Loneliness rising — upward area chart
 * Data: % of men with no close friends (3% in 1990 → 15% in 2021)
 */
export function drawLoneliness(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const pad = 50;
  const chartW = w - pad * 2;
  const chartH = h - pad * 2;

  // Data points (normalized year steps, value = %)
  const points = [
    { t: 0, v: 3 },
    { t: 0.15, v: 3.5 },
    { t: 0.3, v: 5 },
    { t: 0.45, v: 7 },
    { t: 0.55, v: 8 },
    { t: 0.65, v: 10 },
    { t: 0.75, v: 11 },
    { t: 0.85, v: 13 },
    { t: 1, v: 15 },
  ];
  const maxV = 20;

  function px(t: number) { return pad + t * chartW; }
  function py(v: number) { return h - pad - (v / maxV) * chartH; }

  // Filled area — solid coral
  ctx.beginPath();
  ctx.moveTo(px(0), h - pad);
  ctx.lineTo(px(0), py(points[0].v));
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (px(prev.t) + px(curr.t)) / 2;
    ctx.bezierCurveTo(cpx, py(prev.v), cpx, py(curr.v), px(curr.t), py(curr.v));
  }
  ctx.lineTo(px(1), h - pad);
  ctx.closePath();

  const grad = ctx.createLinearGradient(0, py(maxV), 0, h - pad);
  grad.addColorStop(0, "rgba(220, 60, 60, 0.95)");
  grad.addColorStop(1, "rgba(250, 130, 110, 0.7)");
  ctx.fillStyle = grad;
  ctx.fill();

  // Stroke the curve
  ctx.beginPath();
  ctx.moveTo(px(0), py(points[0].v));
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (px(prev.t) + px(curr.t)) / 2;
    ctx.bezierCurveTo(cpx, py(prev.v), cpx, py(curr.v), px(curr.t), py(curr.v));
  }
  ctx.strokeStyle = "rgb(180, 40, 40)";
  ctx.lineWidth = 4;
  ctx.stroke();

  // Big label
  ctx.fillStyle = "rgb(180, 40, 40)";
  ctx.font = "bold 48px sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("5×", w - pad, pad + 10);

  // Axis labels
  ctx.font = "bold 14px sans-serif";
  ctx.fillStyle = "rgb(160, 50, 50)";
  ctx.textAlign = "left";
  ctx.fillText("1990", pad, h - pad + 20);
  ctx.textAlign = "right";
  ctx.fillText("2021", w - pad, h - pad + 20);
}

/**
 * Card 2: Screen time — vertical bars growing
 * Average daily screen time: ~4h (2013) → ~7h (2024)
 */
export function drawScreenTime(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const pad = 50;
  const chartH = h - pad * 2;
  const barCount = 6;
  const gap = 12;
  const totalGap = gap * (barCount - 1);
  const barW = (w - pad * 2 - totalGap) / barCount;

  // Hours per day over years
  const data = [
    { label: "'13", hours: 4.0 },
    { label: "'15", hours: 4.7 },
    { label: "'17", hours: 5.3 },
    { label: "'19", hours: 5.9 },
    { label: "'21", hours: 6.5 },
    { label: "'24", hours: 7.1 },
  ];
  const maxH = 9;

  for (let i = 0; i < data.length; i++) {
    const x = pad + i * (barW + gap);
    const barHeight = (data[i].hours / maxH) * chartH;
    const y = h - pad - barHeight;

    // Bar gradient — blue to purple
    const grad = ctx.createLinearGradient(x, y, x, h - pad);
    grad.addColorStop(0, "rgba(80, 70, 200, 0.95)");
    grad.addColorStop(1, "rgba(140, 100, 220, 0.65)");
    ctx.fillStyle = grad;

    // Rounded top
    const radius = barW / 4;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + barW - radius, y);
    ctx.quadraticCurveTo(x + barW, y, x + barW, y + radius);
    ctx.lineTo(x + barW, h - pad);
    ctx.lineTo(x, h - pad);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();

    // Year label
    ctx.fillStyle = "rgb(80, 70, 180)";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(data[i].label, x + barW / 2, h - pad + 18);
  }

  // Big label
  ctx.fillStyle = "rgb(80, 60, 180)";
  ctx.font = "bold 44px sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("7h+", w - pad, pad + 10);
}

/**
 * Card 3: Third space decline — downward area chart
 * Civic participation, membership in community orgs dropping
 */
export function drawThirdSpace(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const pad = 50;
  const chartW = w - pad * 2;
  const chartH = h - pad * 2;

  // Normalized decline: civic org membership (relative index, 100 = peak)
  const points = [
    { t: 0, v: 95 },
    { t: 0.1, v: 92 },
    { t: 0.2, v: 85 },
    { t: 0.3, v: 78 },
    { t: 0.4, v: 68 },
    { t: 0.5, v: 60 },
    { t: 0.6, v: 52 },
    { t: 0.7, v: 45 },
    { t: 0.8, v: 40 },
    { t: 0.9, v: 37 },
    { t: 1, v: 35 },
  ];
  const maxV = 100;

  function px(t: number) { return pad + t * chartW; }
  function py(v: number) { return h - pad - (v / maxV) * chartH; }

  // Filled area — teal
  ctx.beginPath();
  ctx.moveTo(px(0), h - pad);
  ctx.lineTo(px(0), py(points[0].v));
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (px(prev.t) + px(curr.t)) / 2;
    ctx.bezierCurveTo(cpx, py(prev.v), cpx, py(curr.v), px(curr.t), py(curr.v));
  }
  ctx.lineTo(px(1), h - pad);
  ctx.closePath();

  const grad = ctx.createLinearGradient(0, py(maxV), 0, h - pad);
  grad.addColorStop(0, "rgba(20, 150, 140, 0.9)");
  grad.addColorStop(1, "rgba(60, 190, 170, 0.5)");
  ctx.fillStyle = grad;
  ctx.fill();

  // Stroke
  ctx.beginPath();
  ctx.moveTo(px(0), py(points[0].v));
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (px(prev.t) + px(curr.t)) / 2;
    ctx.bezierCurveTo(cpx, py(prev.v), cpx, py(curr.v), px(curr.t), py(curr.v));
  }
  ctx.strokeStyle = "rgb(15, 120, 110)";
  ctx.lineWidth = 4;
  ctx.stroke();

  // Big label
  ctx.fillStyle = "rgb(15, 120, 110)";
  ctx.font = "bold 40px sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("−60%", w - pad, pad + 10);

  // Axis labels
  ctx.font = "bold 14px sans-serif";
  ctx.fillStyle = "rgb(20, 130, 120)";
  ctx.textAlign = "left";
  ctx.fillText("1964", pad, h - pad + 20);
  ctx.textAlign = "right";
  ctx.fillText("2024", w - pad, h - pad + 20);
}
