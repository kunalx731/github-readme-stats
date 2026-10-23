// @ts-check

import { renderProfilePanel } from "../src/cards/profile-panel.js";
import { fetchProfile } from "../src/fetchers/profile.js";

// Interactive version of /api/profile: the same panel inlined into a page, with hover tooltips.
const LOGIN = "kunalx731";
const CACHE_SECONDS = 300;

const page = (dark, light) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark light">
<title>Krishna Kunal · Activity</title>
<style>
  :root { --bg: #f5f5f7; --text: #1d1d1f; --sub: #6e6e73; --tip-bg: rgba(255,255,255,.82); --tip-border: rgba(0,0,0,.08); }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #000; --text: #f5f5f7; --sub: #8b8b93; --tip-bg: rgba(30,30,32,.82); --tip-border: rgba(255,255,255,.12); }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; background: var(--bg); color: var(--text);
    font: 15px/1.4 -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Inter, sans-serif;
    display: flex; flex-direction: column; align-items: center; padding: 48px 16px;
  }
  nav { width: 100%; max-width: 1200px; display: flex; justify-content: space-between; margin-bottom: 20px; }
  a { color: var(--sub); text-decoration: none; transition: color .2s; }
  a:hover { color: var(--text); }
  .panel { width: 100%; max-width: 1200px; }
  .panel svg { width: 100%; height: auto; display: block; }
  .light { display: none; }
  @media (prefers-color-scheme: light) { .dark { display: none; } .light { display: block; } }
  [data-tip] { cursor: pointer; }
  .cell { transition: filter .15s; }
  .cell:hover { stroke: var(--text); stroke-width: 2; filter: brightness(1.2); }
  .bar { transition: filter .15s; }
  .bar:hover { filter: brightness(1.3); }
  #tip {
    position: fixed; pointer-events: none; z-index: 10; padding: 7px 11px; border-radius: 10px;
    background: var(--tip-bg); border: 1px solid var(--tip-border); color: var(--text);
    -webkit-backdrop-filter: blur(20px) saturate(180%); backdrop-filter: blur(20px) saturate(180%);
    box-shadow: 0 8px 30px rgba(0,0,0,.18); font-size: 13px; font-weight: 500; white-space: nowrap;
    opacity: 0; transform: translateY(4px); transition: opacity .12s, transform .12s;
  }
  #tip.on { opacity: 1; transform: none; }
</style>
</head>
<body>
<nav><a href="https://github.com/${LOGIN}">← github.com/${LOGIN}</a><a href="mailto:krishnakunal731@gmail.com">Say hello</a></nav>
<div class="panel dark">${dark}</div>
<div class="panel light">${light}</div>
<div id="tip" role="tooltip"></div>
<script>
  const tip = document.getElementById("tip");
  document.addEventListener("pointermove", (e) => {
    const el = e.target.closest && e.target.closest("[data-tip]");
    if (!el) return tip.classList.remove("on");
    tip.textContent = el.dataset.tip;
    const w = tip.offsetWidth, x = Math.min(innerWidth - w - 8, Math.max(8, e.clientX - w / 2));
    tip.style.left = x + "px";
    tip.style.top = e.clientY - tip.offsetHeight - 14 + "px";
    tip.classList.add("on");
  });
  document.addEventListener("pointerleave", () => tip.classList.remove("on"));
</script>
</body>
</html>`;

// @ts-ignore
export default async (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  try {
    const stats = await fetchProfile(LOGIN, process.env.PAT_1 ?? "");
    res.setHeader("Cache-Control", `public, max-age=0, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=86400`);
    return res.send(
      page(
        renderProfilePanel(stats, "dark", { interactive: true }),
        renderProfilePanel(stats, "light", { interactive: true }),
      ),
    );
  } catch (err) {
    res.setHeader("Cache-Control", "no-store");
    res.statusCode = 502;
    return res.send(page("<p>Activity is temporarily unavailable.</p>", "<p>Activity is temporarily unavailable.</p>"));
  }
};
