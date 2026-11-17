# Fresher & Intern Jobs India
Daily job scraper -> dedupe -> LLM tags (role, city) -> searchable GitHub Pages site.
Sources: Adzuna India API, Greenhouse and Lever public job board APIs (both are meant to be public). No HTML scraping of sites that forbid it.
Run: pip install -r requirements.txt; set ADZUNA_APP_ID, ADZUNA_APP_KEY, ANTHROPIC_API_KEY; python pipeline.py
Hosting: GitHub Pages from /docs. Daily refresh: .github/workflows/daily.yml
Accuracy + cost: python eval/hand_check.py sample / score

## Frontend (web/)
React + TypeScript + Vite. Source in web/src, builds into docs/ (the Pages folder).
Local dev: cd web && npm install && npm run dev (uses fake sample data, dev only)
Rebuild before pushing UI changes: cd web && npm run build, then commit docs/
Features: multi-word search with highlight, role/city chips with live counts, posted-within filter, sort, saved jobs, shareable URLs, dark mode.
