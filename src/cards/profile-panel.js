// @ts-check
// Live stats strip for the kunalx731 profile README, in the style of its hero:
// three large numbers over a thin Siri-gradient trend line.

import { INTER_FONT_FACES } from "./inter-font.js";

const THEMES = {
  dark: { bg: "#000000", border: "rgba(255,255,255,0.12)", text: "#f5f5f7", sub: "#86868b", live: "#30d158", fill: 0.22 },
  light: { bg: "#f5f5f7", border: "rgba(0,0,0,0)", text: "#1d1d1f", sub: "#6e6e73", live: "#248a3d", fill: 0.16 },
};
const SIRI = ["#0894ff", "#c959dd", "#ff2e54", "#ff9004"];

const W = 1200;
const H = 340;
const PAD = 64;
const EASE = "cubic-bezier(.16,1,.3,1)";

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const fmt = (n) => n.toLocaleString("en-US");
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

/**
 * @param {ReturnType<typeof import("../fetchers/profile.js").summarize>} s
 * @param {"dark" | "light"} mode
 */
export const renderProfilePanel = (s, mode) => {
  const t = THEMES[mode] ?? THEMES.dark;

  const stats = [
    [fmt(s.total), "contributions this year"],
    [`${s.longest}`, "day longest streak"],
    [fmt(s.prs), "pull requests"],
  ];
  const colW = (W - 2 * PAD) / 3;
  const numbers = stats
    .map(
      ([value, label], i) => `
    <g class="in" style="animation-delay:${(0.15 + i * 0.12).toFixed(2)}s">
      <text x="${f1(PAD + i * colW)}" y="132" font-size="76" font-weight="600" letter-spacing="-3" fill="${t.text}" class="num">${esc(value)}</text>
      <text x="${f1(PAD + i * colW)}" y="172" font-size="21" font-weight="400" fill="${t.sub}">${esc(label)}</text>
    </g>`,
    )
    .join("");

  // weekly trend, full-bleed along the bottom of the card
  const y0 = 214, y1 = H - 26;
  const weeks = s.weekly.map((w) => w.count);
  const max = Math.max(...weeks, 1);
  const pts = weeks.map((c, i) => [(i / (weeks.length - 1)) * W, y1 - (c / max) * (y1 - y0)]);
  const line = smoothPath(pts);
  const area = `${line} L${W},${H} L0,${H} Z`;

  const updated = new Date().toLocaleString("en-GB", {
    timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });

  const css = `
    ${INTER_FONT_FACES}
    text { font-family: 'Inter KK', -apple-system, 'SF Pro Display', 'Segoe UI', sans-serif; }
    .num { font-variant-numeric: tabular-nums; }
    .in { opacity: 0; animation: in 1.4s ${EASE} forwards; }
    @keyframes in { from { opacity: 0; transform: translateY(20px); filter: blur(10px); } to { opacity: 1; transform: none; filter: blur(0); } }
    .draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw 2.4s ${EASE} .5s forwards; }
    @keyframes draw { to { stroke-dashoffset: 0; } }
    .fade { opacity: 0; animation: fade 1.6s ease 1.2s forwards; }
    @keyframes fade { to { opacity: 1; } }
    .pulse { transform-box: fill-box; transform-origin: center; animation: pulse 2.4s ease-out infinite; }
    @keyframes pulse { from { transform: scale(.6); opacity: .6; } to { transform: scale(2.4); opacity: 0; } }
    @media (prefers-reduced-motion: reduce) {
      .in, .fade { animation: none !important; opacity: 1 !important; }
      .draw { animation: none !important; stroke-dashoffset: 0 !important; }
      .pulse { animation: none !important; opacity: 0 !important; }
    }`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" role="img" aria-label="${fmt(s.total)} contributions this year, ${s.longest} day longest streak, ${fmt(s.prs)} pull requests">
  <style>${css}</style>
  <defs>
    <clipPath id="card-${mode}"><rect width="${W}" height="${H}" rx="36"/></clipPath>
    <linearGradient id="stroke-${mode}" x1="0" y1="0" x2="${W}" y2="0" gradientUnits="userSpaceOnUse">
      ${SIRI.map((c, i) => `<stop offset="${(i / (SIRI.length - 1)).toFixed(2)}" stop-color="${c}"/>`).join("")}
    </linearGradient>
    <linearGradient id="fade-${mode}" x1="0" y1="${y0}" x2="0" y2="${H}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <mask id="areamask-${mode}"><rect width="${W}" height="${H}" fill="url(#fade-${mode})"/></mask>
  </defs>
  <g clip-path="url(#card-${mode})">
    <rect width="${W}" height="${H}" fill="${t.bg}"/>
    <path d="${area}" fill="url(#stroke-${mode})" fill-opacity="${t.fill}" mask="url(#areamask-${mode})" class="fade"/>
    <path d="${line}" stroke="url(#stroke-${mode})" stroke-width="2.5" stroke-linecap="round" pathLength="1" class="draw"/>
  </g>
  <rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="35.5" stroke="${t.border}"/>
  ${numbers}
  <g class="in" style="animation-delay:.6s">
    <circle cx="${W - PAD - 6}" cy="58" r="5" fill="${t.live}" class="pulse"/>
    <circle cx="${W - PAD - 6}" cy="58" r="4" fill="${t.live}"/>
    <text x="${W - PAD - 20}" y="64" text-anchor="end" font-size="16" fill="${t.sub}">Live · ${esc(updated)} IST</text>
  </g>
</svg>`;
};
