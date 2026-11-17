import type { Job, Query } from "./types";

export const daysAgo = (d?: string): number | null => {
  if (!d) return null;
  const t = Date.parse(d);
  return Number.isNaN(t) ? null : Math.max(0, Math.floor((Date.now() - t) / 864e5));
};

export const ageLabel = (d?: string) => {
  const n = daysAgo(d);
  if (n === null) return "Date unknown";
  if (n === 0) return "Today";
  if (n === 1) return "Yesterday";
  return `${n} days ago`;
};

const hay = (j: Job) => `${j.title} ${j.company} ${j.location} ${j.role ?? ""} ${j.city ?? ""} ${j.description}`.toLowerCase();

export function score(j: Job, terms: string[]): number {
  if (!terms.length) return 0;
  const h = hay(j), t = j.title.toLowerCase(), c = j.company.toLowerCase();
  let s = 0;
  for (const w of terms) {
    if (!h.includes(w)) return -1;
    s += 1 + (t.includes(w) ? 3 : 0) + (c.includes(w) ? 2 : 0);
  }
  return s;
}

// skip: ignore one facet's own filter when counting it
export function applyQuery(jobs: Job[], q: Query, saved: Set<string>, skip?: "roles" | "cities"): Job[] {
  const terms = q.q.toLowerCase().split(/\s+/).filter(Boolean);
  const out: { j: Job; s: number }[] = [];
  for (const j of jobs) {
    if (skip !== "roles" && q.roles.length && !q.roles.includes(j.role ?? "")) continue;
    if (skip !== "cities" && q.cities.length && !q.cities.includes(j.city ?? "")) continue;
    if (q.savedOnly && !saved.has(j.id)) continue;
    if (q.days) { const a = daysAgo(j.posted); if (a === null || a > q.days) continue; }
    const s = score(j, terms);
    if (s < 0) continue;
    out.push({ j, s });
  }
  if (q.sort === "relevance" && terms.length) out.sort((a, b) => b.s - a.s);
  return out.map((x) => x.j);
}

export function countBy(jobs: Job[], key: "role" | "city"): Map<string, number> {
  const m = new Map<string, number>();
  for (const j of jobs) { const v = j[key] ?? "Unknown"; m.set(v, (m.get(v) ?? 0) + 1); }
  return m;
}

export function facetItems(all: Job[], filtered: Job[], key: "role" | "city", selected: string[]): [string, number][] {
  const total = countBy(all, key);
  const counts = countBy(filtered, key);
  for (const s of selected) if (!total.has(s)) total.set(s, 0);
  return [...total.keys()]
    .sort((a, b) => total.get(b)! - total.get(a)! || a.localeCompare(b))
    .map((k) => [k, counts.get(k) ?? 0]);
}

export function formatDate(d: string) {
  const t = Date.parse(d);
  if (Number.isNaN(t)) return d;
  return new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function readUrl(): Query {
  const p = new URLSearchParams(location.search);
  const days = Number(p.get("days") ?? 0);
  return {
    q: p.get("q") ?? "",
    roles: p.get("role")?.split("|").filter(Boolean) ?? [],
    cities: p.get("city")?.split("|").filter(Boolean) ?? [],
    days: [0, 1, 7, 14].includes(days) ? days : 0,
    sort: p.get("sort") === "newest" ? "newest" : "relevance",
    savedOnly: p.get("saved") === "1",
  };
}

export function writeUrl(q: Query) {
  const p = new URLSearchParams();
  if (q.q) p.set("q", q.q);
  if (q.roles.length) p.set("role", q.roles.join("|"));
  if (q.cities.length) p.set("city", q.cities.join("|"));
  if (q.days) p.set("days", String(q.days));
  if (q.sort === "newest") p.set("sort", "newest");
  if (q.savedOnly) p.set("saved", "1");
  const s = p.toString();
  history.replaceState(null, "", s ? `?${s}` : location.pathname);
}

export function store<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}
export function save(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
}
