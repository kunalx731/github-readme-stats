// @ts-check

const EXCLUDE_REPOS = new Set(["nhai_nhidcl", "co_dashboard"]); // committed virtualenvs
const HIDE_LANGS = new Set(["HTML", "CSS"]);

const QUERY = `
query($login: String!) {
  user(login: $login) {
    pullRequests { totalCount }
    issues { totalCount }
    repositories(ownerAffiliations: OWNER, isFork: false, first: 100) {
      totalCount
      nodes {
        name
        languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
          edges { size node { name color } }
        }
      }
    }
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount weekday } }
      }
    }
  }
}`;

/**
 * @param {string} login
 * @param {string} token
 */
export const fetchProfile = async (login, token) => {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${token}`, "User-Agent": login },
    body: JSON.stringify({ query: QUERY, variables: { login } }),
  });
  const payload = await res.json();
  if (!res.ok || payload.errors) {
    throw new Error(payload.errors?.[0]?.message ?? `GitHub API ${res.status}`);
  }
  return summarize(payload.data.user);
};

/** @param {any} user */
export const summarize = (user) => {
  const cal = user.contributionsCollection.contributionCalendar;
  const days = cal.weeks.flatMap((w) => w.contributionDays);
  const counts = days.map((d) => d.contributionCount);

  let longest = 0, run = 0;
  for (const c of counts) {
    run = c ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  const tail = counts.slice().reverse();
  if (tail.length && !tail[0]) tail.shift(); // today isn't over yet
  let current = 0;
  for (const c of tail) {
    if (!c) break;
    current++;
  }

  const sum = (a) => a.reduce((x, y) => x + y, 0);
  const weekday = [0, 0, 0, 0, 0, 0, 0];
  days.forEach((d) => (weekday[d.weekday] += d.contributionCount));

  /** @type {Record<string, number>} */
  const sizes = {};
  /** @type {Record<string, string>} */
  const colors = {};
  for (const repo of user.repositories.nodes) {
    if (EXCLUDE_REPOS.has(repo.name)) continue;
    for (const { size, node } of repo.languages.edges) {
      if (HIDE_LANGS.has(node.name)) continue;
      sizes[node.name] = (sizes[node.name] ?? 0) + size;
      colors[node.name] = node.color ?? "#8e8e93";
    }
  }
  const total = sum(Object.values(sizes)) || 1;
  const langs = Object.entries(sizes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, size]) => ({ name, share: size / total, color: colors[name] }))
    .filter((l) => l.share >= 0.02);
  const rest = 1 - sum(langs.map((l) => l.share));
  if (rest > 0.005) langs.push({ name: "Other", share: rest, color: "#8e8e93" });

  return {
    total: cal.totalContributions,
    last30: sum(counts.slice(-30)),
    prev30: sum(counts.slice(-60, -30)),
    current,
    longest,
    weekly: cal.weeks.map((w) => ({
      start: w.contributionDays[0].date,
      count: sum(w.contributionDays.map((d) => d.contributionCount)),
    })),
    calendar: cal.weeks.map((w) =>
      w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount, weekday: d.weekday })),
    ),
    weekday,
    prs: user.pullRequests.totalCount,
    issues: user.issues.totalCount,
    repos: user.repositories.totalCount,
    langs,
  };
};
