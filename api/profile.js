// @ts-check

import { renderProfilePanel } from "../src/cards/profile-panel.js";
import { fetchProfile } from "../src/fetchers/profile.js";

// Rendered live on every request; locked to one account so the PAT can't be used for others.
const LOGIN = "kunalx731";
const CACHE_SECONDS = 300;

// @ts-ignore
export default async (req, res) => {
  const mode = req.query.theme === "light" ? "light" : "dark";
  res.setHeader("Content-Type", "image/svg+xml");
  try {
    const stats = await fetchProfile(LOGIN, process.env.PAT_1 ?? "");
    res.setHeader(
      "Cache-Control",
      `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=86400`,
    );
    return res.send(renderProfilePanel(stats, mode));
  } catch (err) {
    res.setHeader("Cache-Control", "no-store");
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.send(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="80" viewBox="0 0 1200 80"><text x="600" y="46" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#8b8b93">Activity is temporarily unavailable (${message.replace(/[<&>]/g, "")})</text></svg>`,
    );
  }
};
