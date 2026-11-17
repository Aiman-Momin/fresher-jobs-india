import { useEffect, useMemo, useState } from "react";
import type { Job, Meta, Query } from "./types";
import { applyQuery, facetItems, formatDate, readUrl, writeUrl, store, save } from "./lib";
import Facet from "./Facet";
import JobCard from "./JobCard";
import { FilterIcon, MoonIcon, SearchIcon, SunIcon } from "./icons";

const PAGE = 30;
const DAYS: [number, string][] = [[0, "Any time"], [1, "Past 24 hours"], [7, "Past week"], [14, "Past 2 weeks"]];

async function load(): Promise<[Job[], Meta]> {
  if (import.meta.env.DEV) {
    const d = await import("./sample.json");
    return [d.jobs as Job[], { updated: "dev sample", count: d.jobs.length }];
  }
  const [j, m] = await Promise.all([fetch("./jobs.json").then((r) => r.json()), fetch("./meta.json").then((r) => r.json())]);
  return [j, m];
}

export default function App() {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState<Query>(readUrl);
  const [typed, setTyped] = useState(query.q);
  const [limit, setLimit] = useState(PAGE);
  const [showFilters, setShowFilters] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(() => new Set(store<string[]>("saved", [])));
  const [dark, setDark] = useState(() => store<string>("theme", "light") === "dark");

  useEffect(() => { load().then(([j, m]) => { setJobs(j); setMeta(m); }).catch(() => setError(true)); }, []);
  useEffect(() => { document.documentElement.dataset.theme = dark ? "dark" : "light"; }, [dark]);
  const toggleTheme = () => { save("theme", dark ? "light" : "dark"); setDark(!dark); };
  useEffect(() => { const t = setTimeout(() => setQuery((q) => ({ ...q, q: typed })), 200); return () => clearTimeout(t); }, [typed]);
  useEffect(() => { writeUrl(query); setLimit(PAGE); }, [query]);

  const set = (p: Partial<Query>) => setQuery((q) => ({ ...q, ...p }));
  const toggle = (key: "roles" | "cities") => (v: string) =>
    set({ [key]: query[key].includes(v) ? query[key].filter((x) => x !== v) : [...query[key], v] });
  const toggleSave = (id: string) => setSaved((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    save("saved", [...n]);
    return n;
  });

  const all = jobs ?? [];
  const results = useMemo(() => applyQuery(all, query, saved), [all, query, saved]);
  const roleItems = useMemo(() => facetItems(all, applyQuery(all, query, saved, "roles"), "role", query.roles), [all, query, saved]);
  const cityItems = useMemo(() => facetItems(all, applyQuery(all, query, saved, "cities"), "city", query.cities), [all, query, saved]);
  const terms = query.q.toLowerCase().split(/\s+/).filter(Boolean);
  const active = query.roles.length + query.cities.length + (query.days ? 1 : 0) + (query.savedOnly ? 1 : 0);
  const clear = () => { setTyped(""); set({ q: "", roles: [], cities: [], days: 0, savedOnly: false }); };

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="./">Fresher Jobs <span>India</span></a>
          <button type="button" className="icon-btn" onClick={toggleTheme}
            aria-label={dark ? "Switch to light theme" : "Switch to dark theme"} title="Toggle theme">
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </header>

      <main className="page">
        <div className="intro">
          <h1>Entry-level jobs in India</h1>
          <p className="lede">
            {meta
              ? <>{meta.count.toLocaleString("en-IN")} openings for freshers and interns · Updated {formatDate(meta.updated)}</>
              : "Loading openings…"}
          </p>
        </div>

        <div className="searchbar">
          <SearchIcon />
          <input type="search" value={typed} onChange={(e) => setTyped(e.target.value)}
            placeholder="Search by title, company or skill" aria-label="Search jobs" />
        </div>

        <div className="layout">
          <aside className={"filters" + (showFilters ? " open" : "")} aria-label="Filters">
            <div className="filters-head">
              <span>Filters</span>
              {(active > 0 || query.q) && <button type="button" className="link" onClick={clear}>Clear all</button>}
            </div>
            {jobs && <>
              <Facet title="Role" items={roleItems} selected={query.roles} onToggle={toggle("roles")} />
              <Facet title="City" items={cityItems} selected={query.cities} onToggle={toggle("cities")} />
            </>}
            <fieldset className="facet">
              <legend>Date posted</legend>
              {DAYS.map(([d, label]) => (
                <label key={d} className="opt">
                  <input type="radio" name="days" checked={query.days === d} onChange={() => set({ days: d })} />
                  <span className="opt-label">{label}</span>
                </label>
              ))}
            </fieldset>
            <fieldset className="facet">
              <legend>Saved</legend>
              <label className="opt">
                <input type="checkbox" checked={query.savedOnly} onChange={(e) => set({ savedOnly: e.target.checked })} />
                <span className="opt-label">Saved jobs only</span>
                <span className="n">{saved.size}</span>
              </label>
            </fieldset>
          </aside>

          <section className="results" aria-label="Results">
            <div className="toolbar">
              <span className="count" aria-live="polite">
                {jobs ? <><strong>{results.length.toLocaleString("en-IN")}</strong> {results.length === 1 ? "job" : "jobs"}</> : " "}
              </span>
              <button type="button" className="filters-toggle" aria-expanded={showFilters} onClick={() => setShowFilters(!showFilters)}>
                <FilterIcon /> Filters{active > 0 && <span className="pill">{active}</span>}
              </button>
              <label className="sort">
                <span>Sort by</span>
                <select value={query.sort} onChange={(e) => set({ sort: e.target.value as Query["sort"] })}>
                  <option value="relevance">Relevance</option>
                  <option value="newest">Most recent</option>
                </select>
              </label>
            </div>

            {error && <div className="state"><p className="state-title">Couldn't load jobs</p><p>Refresh the page to try again.</p></div>}
            {!jobs && !error && <div className="list">{Array.from({ length: 6 }, (_, i) => <div key={i} className="job skel"><span /><span /><span /></div>)}</div>}
            {jobs && results.length === 0 && (
              jobs.length === 0
                ? <div className="state"><p className="state-title">No listings yet</p><p>The first daily refresh hasn't finished. Check back soon.</p></div>
                : <div className="state">
                    <p className="state-title">No matching jobs</p>
                    <p>Try a broader search or remove some filters.</p>
                    <button type="button" className="btn" onClick={clear}>Clear filters</button>
                  </div>
            )}
            {results.length > 0 && (
              <div className="list">
                {results.slice(0, limit).map((j) => <JobCard key={j.id} job={j} saved={saved.has(j.id)} onSave={toggleSave} mark={terms} />)}
              </div>
            )}
            {results.length > limit && (
              <button type="button" className="btn more" onClick={() => setLimit(limit + PAGE)}>
                Show more <span className="muted">({(results.length - limit).toLocaleString("en-IN")} remaining)</span>
              </button>
            )}
          </section>
        </div>

        <footer>Listings are collected daily from public job APIs. Every link opens the original posting.</footer>
      </main>
    </>
  );
}
