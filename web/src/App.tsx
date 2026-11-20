import { useEffect, useMemo, useState } from "react";
import type { Job, Meta, Query } from "./types";
import { applyQuery, facetItems, formatDate, readUrl, writeUrl, store, save } from "./lib";
import Facet from "./Facet";
import JobCard from "./JobCard";
import { BookmarkIcon, CloseIcon, FilterIcon, MoonIcon, SearchIcon, SunIcon } from "./icons";

const PAGE = 30;
const DAYS: [number, string][] = [[0, "Any time"], [1, "Last 24 hours"], [7, "Last 7 days"], [14, "Last 14 days"]];

async function load(): Promise<[Job[], Meta]> {
  if (import.meta.env.DEV) {
    const d = await import("./sample.json");
    return [d.jobs as Job[], { updated: "dev sample", count: d.jobs.length }];
  }
  const [j, m] = await Promise.all([fetch("./jobs.json").then((r) => r.json()), fetch("./meta.json").then((r) => r.json())]);
  return [j, m];
}

const prefersDark = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches;

export default function App() {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState<Query>(readUrl);
  const [typed, setTyped] = useState(query.q);
  const [limit, setLimit] = useState(PAGE);
  const [showFilters, setShowFilters] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(() => new Set(store<string[]>("saved", [])));
  const [dark, setDark] = useState(() => store<string>("theme", prefersDark() ? "dark" : "light") === "dark");

  useEffect(() => { load().then(([j, m]) => { setJobs(j); setMeta(m); }).catch(() => setError(true)); }, []);
  useEffect(() => { document.documentElement.dataset.theme = dark ? "dark" : "light"; }, [dark]);
  const toggleTheme = () => { save("theme", dark ? "light" : "dark"); setDark(!dark); };
  useEffect(() => { const t = setTimeout(() => setQuery((q) => ({ ...q, q: typed })), 200); return () => clearTimeout(t); }, [typed]);
  useEffect(() => { writeUrl(query); setLimit(PAGE); }, [query]);
  useEffect(() => {
    document.body.classList.toggle("sheet-open", showFilters);
    if (!showFilters) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setShowFilters(false);
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, [showFilters]);

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
  const n = (x: number) => x.toLocaleString("en-IN");

  // heading like "128 Software Engineering jobs in Bengaluru"
  const what = query.roles.length === 1 ? `${query.roles[0]} jobs` : "Fresher jobs";
  const where = query.cities.length === 1 && !["Unknown", "Other India"].includes(query.cities[0]) ? query.cities[0] : "India";

  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <a className="brand" href="./">fresher<span>jobs</span></a>
          <nav className="nav-links">
            <a href="./" className={!query.savedOnly ? "on" : ""} onClick={(e) => { e.preventDefault(); set({ savedOnly: false }); }}>Jobs</a>
            <a href="./?saved=1" className={query.savedOnly ? "on" : ""} onClick={(e) => { e.preventDefault(); set({ savedOnly: true }); }}>
              <BookmarkIcon filled={query.savedOnly} size={15} /> Saved <span className="count-badge">{saved.size}</span>
            </a>
            <button type="button" className="icon-btn" onClick={toggleTheme}
              aria-label={dark ? "Switch to light theme" : "Switch to dark theme"} title="Toggle theme">
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
          </nav>
        </div>
      </header>

      <main className="page">
        <div className="page-head">
          <h1>{jobs ? <>{n(results.length)} {query.savedOnly ? "Saved jobs" : what} in {where}</> : "Fresher jobs in India"}</h1>
          <p>{meta ? <>Latest fresher jobs and internships · Updated {formatDate(meta.updated)}</> : "Loading…"}</p>
        </div>

        <div className="mobile-bar">
          <form className="kw kw-mobile" role="search" onSubmit={(e) => e.preventDefault()}>
            <input type="search" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Search jobs, companies, skills" aria-label="Search jobs" />
            <button type="submit" aria-label="Search"><SearchIcon /></button>
          </form>
          <button type="button" className="filters-toggle" aria-expanded={showFilters} onClick={() => setShowFilters(true)}>
            <FilterIcon /> Filters{active > 0 && <span className="count-badge solid">{active}</span>}
          </button>
        </div>

        <div className="layout">
          <div className={"scrim" + (showFilters ? " show" : "")} onClick={() => setShowFilters(false)} aria-hidden="true" />
          <aside className={"filters" + (showFilters ? " open" : "")} aria-label="Filters">
            <div className="filters-head">
              <FilterIcon /> <span>Filters</span>
              <button type="button" className="icon-btn sheet-close" aria-label="Close filters" onClick={() => setShowFilters(false)}><CloseIcon /></button>
            </div>

            <div className="fgroup">
              <label className="flabel" htmlFor="kw">Keyword search</label>
              <form className="kw" role="search" onSubmit={(e) => e.preventDefault()}>
                <input id="kw" type="search" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="e.g. React, Analyst, Pune" />
                <button type="submit" aria-label="Search"><SearchIcon /></button>
              </form>
            </div>

            {jobs && <>
              <Facet title="Profile" items={roleItems} selected={query.roles} onToggle={toggle("roles")} />
              <Facet title="Location" items={cityItems} selected={query.cities} onToggle={toggle("cities")} />
            </>}

            <div className="fgroup" role="radiogroup" aria-labelledby="posted-h">
              <h3 id="posted-h" className="flabel">Date posted</h3>
              {DAYS.map(([d, label]) => (
                <label key={d} className={"opt" + (query.days === d ? " on" : "")}>
                  <input type="radio" name="days" checked={query.days === d} onChange={() => set({ days: d })} />
                  <span className="opt-label">{label}</span>
                </label>
              ))}
            </div>

            <div className="filters-foot">
              <button type="button" className="link" onClick={clear} disabled={!active && !query.q}>Clear all</button>
              <button type="button" className="btn primary sheet-done" onClick={() => setShowFilters(false)}>
                Show {n(results.length)} jobs
              </button>
            </div>
          </aside>

          <section className="results" aria-label="Results">
            <div className="toolbar">
              <div className="active-chips">
                {query.roles.map((r) => <button key={r} type="button" className="achip" onClick={() => toggle("roles")(r)}>{r} <CloseIcon /></button>)}
                {query.cities.map((c) => <button key={c} type="button" className="achip" onClick={() => toggle("cities")(c)}>{c} <CloseIcon /></button>)}
                {query.q && <button type="button" className="achip" onClick={() => setTyped("")}>“{query.q}” <CloseIcon /></button>}
              </div>
              <label className="sort">
                <span>Sort by</span>
                <select value={query.sort} onChange={(e) => set({ sort: e.target.value as Query["sort"] })}>
                  <option value="relevance">Relevance</option>
                  <option value="newest">Most recent</option>
                </select>
              </label>
            </div>

            {error && <div className="state"><p className="state-title">Couldn't load jobs</p><p>Refresh the page to try again.</p></div>}
            {!jobs && !error && <div className="list">{Array.from({ length: 4 }, (_, i) => <div key={i} className="card skel"><span /><span /><span /><span /></div>)}</div>}
            {jobs && results.length === 0 && (
              jobs.length === 0
                ? <div className="state"><p className="state-title">No listings yet</p><p>The first daily refresh hasn't finished. Check back soon.</p></div>
                : <div className="state">
                    <p className="state-title">{query.savedOnly && saved.size === 0 ? "No saved jobs yet" : "No jobs found"}</p>
                    <p>{query.savedOnly && saved.size === 0 ? "Tap the bookmark on any job to save it here." : "Try removing a few filters or searching something broader."}</p>
                    <button type="button" className="btn primary" onClick={clear}>Clear all filters</button>
                  </div>
            )}
            {results.length > 0 && (
              <div className="list">
                {results.slice(0, limit).map((j) => <JobCard key={j.id} job={j} saved={saved.has(j.id)} onSave={toggleSave} mark={terms} />)}
              </div>
            )}
            {results.length > limit && (
              <button type="button" className="btn more" onClick={() => setLimit(limit + PAGE)}>
                Load more jobs ({n(results.length - limit)} left)
              </button>
            )}
          </section>
        </div>
      </main>

      <footer className="foot">
        <div className="foot-inner">
          <span className="brand small">fresher<span>jobs</span></span>
          <p>Listings are collected daily from public job APIs (Adzuna, Greenhouse, Lever). Every link opens the original posting. Always verify an employer, and never pay money to get a job.</p>
        </div>
      </footer>
    </>
  );
}
