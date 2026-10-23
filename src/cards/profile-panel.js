// @ts-check
// Apple-style activity panel for the kunalx731 profile README.

const FONT =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI Variable Display', 'Segoe UI', 'Helvetica Neue', Inter, Arial, sans-serif";

const THEMES = {
  dark: {
    panel: "#0f1115",
    border: "rgba(255,255,255,0.10)",
    text: "#f5f5f7",
    sub: "#8b8b93",
    faint: "#5c5c63",
    grid: "rgba(255,255,255,0.07)",
    accent: "#0a84ff",
    up: "#30d158",
    down: "#ff453a",
    muted: "#2a2c31",
    heat: ["#1b1d22", "#0a3a6b", "#0b5cad", "#0a84ff", "#5ac8fa"],
  },
  light: {
    panel: "#ffffff",
    border: "rgba(0,0,0,0.10)",
    text: "#1d1d1f",
    sub: "#6e6e73",
    faint: "#a1a1a6",
    grid: "rgba(0,0,0,0.06)",
    accent: "#0071e3",
    up: "#248a3d",
    down: "#d70015",
    muted: "#e8e8ed",
    heat: ["#ebedf0", "#cfe4ff", "#7fb8ff", "#2f8cff", "#0058b9"],
  },
};

const W = 1200;
const HEAT_H = 216;
const H = 610 + HEAT_H;
const PAD = 44;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const LONG_WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const fmt = (n) => n.toLocaleString("en-US");
const plural = (n, word) => `${fmt(n)} ${word}${n === 1 ? "" : "s"}`;
const dayLabel = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  });
const f1 = (n) => n.toFixed(1);

/** Monotone cubic interpolation (Fritsch–Carlson): smooth, never overshoots below zero. */
const smoothPath = (pts) => {
  const n = pts.length;
  if (n < 2) return "";
  const dx = [], m = [], t = new Array(n);
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1][0] - pts[i][0]);
    m.push((pts[i + 1][1] - pts[i][1]) / dx[i]);
  }
  t[0] = m[0];
  t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = t[i + 1] = 0;
      continue;
    }
    const a = t[i] / m[i], b = t[i + 1] / m[i], h = a * a + b * b;
    if (h > 9) {
      const k = 3 / Math.sqrt(h);
      t[i] = k * a * m[i];
      t[i + 1] = k * b * m[i];
    }
  }
  let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += ` C${f1(pts[i][0] + h)},${f1(pts[i][1] + t[i] * h)} ${f1(pts[i + 1][0] - h)},${f1(pts[i + 1][1] - t[i + 1] * h)} ${f1(pts[i + 1][0])},${f1(pts[i + 1][1])}`;
  }
  return d;
};

const niceMax = (v) => {
  if (v <= 0) return 10;
  const p = 10 ** Math.floor(Math.log10(v));
  return [1, 2, 2.5, 5, 10].map((s) => s * p).find((s) => s >= v) ?? 10 * p;
};

/**
 * @param {ReturnType<typeof import("../fetchers/profile.js").summarize>} s
 * @param {"dark" | "light"} mode
 * @param {{ interactive?: boolean }} [opts] adds hover targets for the HTML dashboard
 */
export const renderProfilePanel = (s, mode, { interactive = false } = {}) => {
  const t = THEMES[mode] ?? THEMES.dark;
  const id = (name) => `${name}-${mode}`; // both themes share one HTML page
  const tip = (text) => (interactive ? ` data-tip="${esc(text)}"` : "");
  const colW = (W - 2 * PAD) / 4;

  // ---- KPIs
  const delta = s.prev30 ? (s.last30 - s.prev30) / s.prev30 : null;
  const deltaPill =
    delta === null
      ? `<text x="0" y="0" font-size="15" fill="${t.sub}">vs. previous 30 days</text>`
      : (() => {
          const up = delta >= 0;
          const label = `${up ? "▲" : "▼"} ${Math.abs(delta * 100).toFixed(0)}%`;
          const w = 16 + label.length * 8.6;
          return `<rect x="0" y="-16" width="${f1(w)}" height="24" rx="12" fill="${up ? t.up : t.down}" fill-opacity="0.14"/>
            <text x="${f1(w / 2)}" y="1" text-anchor="middle" font-size="13" font-weight="600" fill="${up ? t.up : t.down}">${label}</text>
            <text x="${f1(w + 10)}" y="1" font-size="15" fill="${t.sub}">vs. prior 30 days</text>`;
        })();
  const kpis = [
    ["Contributions", fmt(s.total), `<text x="0" y="0" font-size="15" fill="${t.sub}">${fmt(Math.round(s.total / 52))} per week on average</text>`],
    ["Last 30 days", fmt(s.last30), deltaPill],
    ["Current streak", `${s.current}<tspan font-size="22" font-weight="500" fill="${t.sub}" dx="6">days</tspan>`, `<text x="0" y="0" font-size="15" fill="${t.sub}">Longest this year: ${s.longest} days</text>`],
    ["Pull requests", fmt(s.prs), `<text x="0" y="0" font-size="15" fill="${t.sub}">${fmt(s.issues)} issues · ${fmt(s.repos)} repositories</text>`],
  ];
  const kpiSvg = kpis
    .map(([label, value, sub], i) => {
      const x = PAD + i * colW + (i ? 28 : 0);
      const divider = i
        ? `<line x1="${f1(PAD + i * colW)}" y1="104" x2="${f1(PAD + i * colW)}" y2="200" stroke="${t.grid}"/>`
        : "";
      return `${divider}<g class="rise" style="animation-delay:${(0.15 + i * 0.08).toFixed(2)}s">
        <text x="${f1(x)}" y="122" font-size="12.5" font-weight="600" letter-spacing="1.4" fill="${t.sub}">${label.toUpperCase()}</text>
        <text x="${f1(x)}" y="170" font-size="46" font-weight="600" letter-spacing="-1.6" fill="${t.text}" class="num">${value}</text>
        <g transform="translate(${f1(x)},198)">${sub}</g></g>`;
    })
    .join("");

  // ---- contribution heatmap
  const hy = 262;
  const nz = s.calendar.flat().map((d) => d.count).filter(Boolean).sort((a, b) => a - b);
  const q = [0.25, 0.5, 0.75].map((f) => nz[Math.floor(nz.length * f)] ?? 0);
  const level = (c) => (c ? 1 + q.filter((v) => c > v).length : 0); // quartiles keep spikes from washing it out
  const pitch = (W - 2 * PAD) / s.calendar.length;
  const cell = pitch - 4.5;
  let heatMonth = "";
  const heatMonths = [], cells = [];
  s.calendar.forEach((week, c) => {
    const m = new Date(`${week[0].date}T00:00:00Z`).toLocaleString("en-US", { month: "short", timeZone: "UTC" });
    if (m !== heatMonth && c < s.calendar.length - 2) {
      heatMonths.push(`<text x="${f1(PAD + c * pitch)}" y="${hy + 26}" font-size="12" fill="${t.faint}">${m}</text>`);
      heatMonth = m;
    }
    week.forEach((d) => {
      cells.push(`<rect class="cell k${c}" x="${f1(PAD + c * pitch)}" y="${f1(hy + 40 + d.weekday * pitch)}" width="${f1(cell)}" height="${f1(cell)}" rx="4" fill="${t.heat[level(d.count)]}"${tip(`${plural(d.count, "contribution")} · ${dayLabel(d.date)}`)}/>`);
    });
  });
  const heatLegend = t.heat
    .map((c, i) => `<rect x="${W - PAD - 40 - (5 - i) * 17}" y="-11" width="12" height="12" rx="3" fill="${c}"/>`)
    .join("");
  const heatmap = `
    <g class="rise" style="animation-delay:.3s">
      <text x="${PAD}" y="${hy}" font-size="15" font-weight="600" fill="${t.text}">Contribution activity</text>
      <g transform="translate(0,${hy - 1})">
        <text x="${W - PAD - 40 - 5 * 17 - 8}" y="0" text-anchor="end" font-size="12" fill="${t.faint}">Less</text>
        ${heatLegend}
        <text x="${W - PAD}" y="0" text-anchor="end" font-size="12" fill="${t.faint}">More</text>
      </g>
      ${heatMonths.join("")}
    </g>
    ${cells.join("")}`;
  const heatCss = s.calendar.map((_, c) => `.k${c}{animation-delay:${(0.45 + c * 0.014).toFixed(3)}s}`).join("");

  // ---- weekly trend
  const cx0 = PAD, cx1 = W - PAD - 44, cy0 = 292 + HEAT_H, cy1 = 442 + HEAT_H;
  const weeks = s.weekly;
  const top = niceMax(Math.max(...weeks.map((w) => w.count)));
  const px = (i) => cx0 + (i / (weeks.length - 1)) * (cx1 - cx0);
  const py = (v) => cy1 - (v / top) * (cy1 - cy0);
  const pts = weeks.map((w, i) => [px(i), py(w.count)]);
  const line = smoothPath(pts);
  const area = `${line} L${f1(cx1)},${cy1} L${f1(cx0)},${cy1} Z`;
  const grid = [0, 0.5, 1]
    .map(
      (f) => `<line x1="${cx0}" y1="${f1(py(top * f))}" x2="${cx1}" y2="${f1(py(top * f))}" stroke="${t.grid}" ${f ? 'stroke-dasharray="2 5"' : ""}/>
      <text x="${W - PAD}" y="${f1(py(top * f) + 4)}" text-anchor="end" font-size="12" fill="${t.faint}" class="num">${fmt(top * f)}</text>`,
    )
    .join("");
  let lastMonth = "";
  const months = weeks
    .map((w, i) => {
      const m = new Date(`${w.start}T00:00:00Z`).toLocaleString("en-US", { month: "short", timeZone: "UTC" });
      if (m === lastMonth || i > weeks.length - 3) return "";
      lastMonth = m;
      return `<text x="${f1(px(i))}" y="${cy1 + 24}" font-size="12" fill="${t.faint}">${m}</text>`;
    })
    .join("");
  const peakIdx = weeks.reduce((b, w, i) => (w.count > weeks[b].count ? i : b), 0);
  const [pkx, pky] = pts[peakIdx];
  const peakLabel = `Peak · ${fmt(weeks[peakIdx].count)}`;
  const peakAnchor = pkx > W - 240 ? "end" : pkx < 160 ? "start" : "middle";
  const lastPt = pts[pts.length - 1];
  const step = (cx1 - cx0) / (weeks.length - 1);
  const weekHits = interactive
    ? weeks
        .map((w, i) => {
          const [x, y] = pts[i];
          const label = new Date(`${w.start}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
          return `<g class="wk"${tip(`Week of ${label} · ${plural(w.count, "contribution")}`)}>
            <rect x="${f1(x - step / 2)}" y="${cy0 - 20}" width="${f1(step)}" height="${cy1 - cy0 + 20}" fill="transparent"/>
            <line class="hl" x1="${f1(x)}" y1="${cy0 - 10}" x2="${f1(x)}" y2="${cy1}" stroke="${t.sub}" stroke-opacity=".5"/>
            <circle class="hl" cx="${f1(x)}" cy="${f1(y)}" r="5.5" fill="${t.panel}" stroke="${t.accent}" stroke-width="2.5"/></g>`;
        })
        .join("")
    : "";
  const trend = `
    <text x="${PAD}" y="${cy0 - 26}" font-size="15" font-weight="600" fill="${t.text}">Weekly contributions</text>
    ${grid}${months}
    <path d="${area}" fill="url(#${id("areafill")})" class="fade" style="animation-delay:1.2s"/>
    <path d="${line}" stroke="${t.accent}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" pathLength="1" class="draw"/>
    <g class="fade" style="animation-delay:1.9s">
      <line x1="${f1(pkx)}" y1="${f1(pky + 8)}" x2="${f1(pkx)}" y2="${cy1}" stroke="${t.accent}" stroke-opacity=".35" stroke-dasharray="2 4"/>
      <circle cx="${f1(pkx)}" cy="${f1(pky)}" r="5" fill="${t.panel}" stroke="${t.accent}" stroke-width="2.5"/>
      <text x="${f1(pkx)}" y="${f1(pky - 14)}" text-anchor="${peakAnchor}" font-size="13" font-weight="600" fill="${t.text}">${peakLabel}</text>
    </g>
    <g class="fade" style="animation-delay:2.1s">
      <circle cx="${f1(lastPt[0])}" cy="${f1(lastPt[1])}" r="9" fill="${t.accent}" class="pulse"/>
      <circle cx="${f1(lastPt[0])}" cy="${f1(lastPt[1])}" r="4.5" fill="${t.accent}"/>
    </g>
    ${weekHits}`;

  // ---- languages
  const halfW = (W - 2 * PAD - 64) / 2;
  const by = 532 + HEAT_H;
  let bx = 0, lx = 0;
  const segs = [], legend = [];
  s.langs.forEach(({ name, share, color }) => {
    const w = halfW * share;
    segs.push(`<rect x="${f1(bx)}" y="-6" width="${f1(w + 0.5)}" height="18" fill="${color}"${tip(`${name} · ${(share * 100).toFixed(1)}%`)}/>`);
    bx += w;
    const pct = `${(share * 100).toFixed(0)}%`;
    legend.push(`<circle cx="${f1(lx + 4)}" cy="31" r="4" fill="${color}"/>
      <text x="${f1(lx + 14)}" y="36" font-size="14" fill="${t.text}">${esc(name)}<tspan fill="${t.sub}" dx="6">${pct}</tspan></text>`);
    lx += 14 + (name.length + pct.length) * 8 + 26;
  });
  const languages = `
    <g class="rise" style="animation-delay:.6s">
      <text x="${PAD}" y="${by - 22}" font-size="15" font-weight="600" fill="${t.text}">Languages</text>
      <g transform="translate(${PAD},${by})">
        <clipPath id="${id("lbar")}"><rect width="${f1(halfW)}" height="6" rx="3"/></clipPath>
        <rect width="${f1(halfW)}" height="6" rx="3" fill="${t.muted}"/>
        <g clip-path="url(#${id("lbar")})"><g class="grow">${segs.join("")}</g></g>
        ${legend.join("")}
      </g>
    </g>`;

  // ---- weekday rhythm
  const wx = PAD + halfW + 64;
  const maxDay = Math.max(...s.weekday, 1);
  const best = s.weekday.indexOf(maxDay);
  const slot = halfW / 7;
  const bars = s.weekday
    .map((v, i) => {
      const h = Math.max(4, (v / maxDay) * 44);
      const x = wx + i * slot + slot / 2 - 9;
      return `<rect x="${f1(x)}" y="${f1(by + 30 - h)}" width="18" height="${f1(h)}" rx="4" fill="${i === best ? t.accent : t.muted}" class="bar"${tip(`${LONG_WEEKDAYS[i]}s · ${plural(v, "contribution")}`)} style="animation-delay:${(0.9 + i * 0.05).toFixed(2)}s"/>
        <text x="${f1(x + 9)}" y="${by + 52}" text-anchor="middle" font-size="12" fill="${i === best ? t.text : t.faint}">${WEEKDAYS[i]}</text>`;
    })
    .join("");
  const rhythm = `
    <g class="rise" style="animation-delay:.7s">
      <text x="${f1(wx)}" y="${by - 22}" font-size="15" font-weight="600" fill="${t.text}">Rhythm<tspan fill="${t.sub}" font-weight="400" dx="8">Most active on ${LONG_WEEKDAYS[best]}s</tspan></text>
    </g>${bars}`;

  // ---- header
  const updated = new Date().toLocaleString("en-GB", {
    timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
  const header = `
    <text x="${PAD}" y="56" font-size="22" font-weight="600" letter-spacing="-.4" fill="${t.text}">Activity</text>
    <text x="${PAD + 92}" y="56" font-size="15" fill="${t.sub}">Last 12 months</text>
    <g transform="translate(${W - PAD - 232},36)">
      <rect width="232" height="30" rx="15" fill="${t.up}" fill-opacity=".1"/>
      <circle cx="18" cy="15" r="7" fill="${t.up}" class="pulse"/>
      <circle cx="18" cy="15" r="3.5" fill="${t.up}"/>
      <text x="32" y="20" font-size="13" font-weight="500" fill="${t.text}">Live<tspan fill="${t.sub}" font-weight="400"> · Updated ${esc(updated)} IST</tspan></text>
    </g>
    <line x1="${PAD}" y1="84" x2="${W - PAD}" y2="84" stroke="${t.grid}"/>`;

  const css = `
    text { font-family: ${FONT}; }
    .num { font-variant-numeric: tabular-nums; }
    .rise { opacity: 0; animation: rise .9s cubic-bezier(.2,.8,.2,1) forwards; }
    @keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
    .draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw 1.8s cubic-bezier(.65,0,.35,1) .45s forwards; }
    @keyframes draw { to { stroke-dashoffset: 0; } }
    .fade { opacity: 0; animation: fade .8s ease forwards; }
    @keyframes fade { to { opacity: 1; } }
    .grow { transform-box: fill-box; transform-origin: left; transform: scaleX(0); animation: grow 1.3s cubic-bezier(.2,.8,.2,1) .8s forwards; }
    @keyframes grow { to { transform: scaleX(1); } }
    .bar { transform-box: fill-box; transform-origin: bottom; transform: scaleY(0); animation: bar .8s cubic-bezier(.2,.8,.2,1) forwards; }
    @keyframes bar { to { transform: scaleY(1); } }
    .pulse { transform-box: fill-box; transform-origin: center; opacity: .35; animation: pulse 2.4s ease-out infinite; }
    @keyframes pulse { from { transform: scale(.6); opacity: .5; } to { transform: scale(2.2); opacity: 0; } }
    .cell { opacity: 0; transform-box: fill-box; transform-origin: center; animation: pop .6s cubic-bezier(.2,.8,.2,1) forwards; }
    @keyframes pop { from { opacity: 0; transform: scale(.3); } to { opacity: 1; transform: none; } }
    .wk .hl { opacity: 0; transition: opacity .15s; }
    .wk:hover .hl { opacity: 1; }
    ${heatCss}
    @media (prefers-reduced-motion: reduce) {
      .rise, .fade, .cell { animation: none !important; opacity: 1 !important; }
      .draw { animation: none !important; stroke-dashoffset: 0 !important; }
      .grow, .bar { animation: none !important; transform: none !important; }
      .pulse { animation: none !important; opacity: 0 !important; }
    }`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" role="img" aria-label="${fmt(s.total)} contributions in the last year">
  <style>${css}</style>
  <defs>
    <linearGradient id="${id("areafill")}" x1="0" y1="${cy0}" x2="0" y2="${cy1}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${t.accent}" stop-opacity=".28"/>
      <stop offset="1" stop-color="${t.accent}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="28" fill="${t.panel}" stroke="${t.border}"/>
  <g class="rise">${header}</g>
  ${kpiSvg}
  ${heatmap}
  <g class="rise" style="animation-delay:.35s">${trend}</g>
  ${languages}
  ${rhythm}
</svg>`;
};
