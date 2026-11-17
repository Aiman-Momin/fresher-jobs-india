import os, re, json, time, hashlib, requests, datetime as dt
from difflib import SequenceMatcher
import sources

FRESHER = re.compile(r"\bintern(ship)?s?\b|fresher|graduate|entry[- ]level|trainee|apprentice|\b0\s*(-|to)\s*[12]\s*(yrs|years|year)|junior|campus", re.I)
ROLES = ["Software Engineering", "Data/ML", "Product", "Design", "Marketing", "Sales/BD", "Operations", "Finance", "HR", "Content/Writing", "Other"]
CITIES = ["Bengaluru", "Mumbai", "Delhi NCR", "Hyderabad", "Pune", "Chennai", "Kolkata", "Ahmedabad", "Remote", "Other India", "Unknown"]
MODEL = os.getenv("TAG_MODEL", "gemini-flash-latest")
PROMPT = f"""You tag Indian job posts. For each post return a role and a city.
Roles (pick exactly one): {ROLES}
Cities (pick exactly one): {CITIES}
Rules: use Delhi NCR for Delhi, Gurgaon, Noida, Ghaziabad, Faridabad. Use Remote only if the post says remote/work from home and no office city. If the city is in India but not listed use "Other India". If no city can be told use "Unknown". Role comes from the actual work in the post, not the company.
Reply with ONLY a JSON array like [{{"id":"..","role":"..","city":".."}}], nothing else."""

def norm(s): return re.sub(r"[^a-z0-9 ]", "", (s or "").lower()).strip()
def jid(j): return hashlib.md5(norm(j["url"].split("?")[0]).encode()).hexdigest()[:12]

def dedupe(jobs):
    seen_url, seen_key, kept, by_company = set(), set(), [], {}
    for j in jobs:
        u = j["url"].split("?")[0]
        key = (norm(j["title"]), norm(j["company"]), norm(j["location"]).split(" ")[0] if j["location"] else "")
        if u in seen_url or key in seen_key: continue
        comp = by_company.setdefault(norm(j["company"]), [])
        if any(SequenceMatcher(None, norm(j["title"] + j["location"]), c).ratio() > 0.93 for c in comp): continue
        comp.append(norm(j["title"] + j["location"]))
        seen_url.add(u); seen_key.add(key); kept.append(j)
    return kept

def tag(jobs, usage):
    url = os.getenv("TAG_API_URL", "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions")
    key = os.environ["TAG_API_KEY"]
    budget = int(os.getenv("TAG_BUDGET_SEC", "1200"))  # stop tagging after 20 min so the run always finishes and saves
    start, fails_in_row = time.time(), 0
    for j in jobs:  # defaults, so anything we do not reach is retried on the next run
        j["role"], j["city"], j["tagged"] = "Other", "Unknown", False
    for i in range(0, len(jobs), 10):
        if time.time() - start > budget:
            print(f"time budget hit, stopping. {len(jobs) - i} posts left for the next run", flush=True); break
        if fails_in_row >= 3:
            print("3 batches failed in a row (limit or error), stopping. Rest will retry next run", flush=True); break
        batch = jobs[i:i + 10]
        body = "\n\n".join(f'id: {j["id"]}\ntitle: {j["title"]}\ncompany: {j["company"]}\nlocation: {j["location"]}\ntext: {j["description"][:1200]}' for j in batch)
        res = {}
        for attempt in range(3):
            try:
                r = requests.post(url, headers={"Authorization": f"Bearer {key}"}, timeout=60, json={
                    "model": MODEL, "temperature": 0,
                    "messages": [{"role": "system", "content": PROMPT}, {"role": "user", "content": body}]})
                if r.status_code == 429:
                    print("rate limited, waiting 30s", flush=True); time.sleep(30); continue
                r.raise_for_status()
                d = r.json()
                txt = d["choices"][0]["message"]["content"]
                txt = txt[txt.index("["): txt.rindex("]") + 1]
                res = {x["id"]: x for x in json.loads(txt)}
                u = d.get("usage") or {}
                usage["in"] += u.get("prompt_tokens", 0); usage["out"] += u.get("completion_tokens", 0)
                usage["posts"] += len(batch)
                break
            except Exception as e:
                print("tag batch failed", attempt, str(e)[:300], flush=True); time.sleep(5)
        fails_in_row = 0 if res else fails_in_row + 1
        for j in batch:
            x = res.get(j["id"], {})
            if x:
                j["role"] = x.get("role") if x.get("role") in ROLES else "Other"
                j["city"] = x.get("city") if x.get("city") in CITIES else "Unknown"
                j["tagged"] = True
        print(f"batch {i // 10 + 1}/{(len(jobs) + 9) // 10} done, {sum(1 for j in jobs if j['tagged'])} tagged so far", flush=True)
        time.sleep(4)

def main():
    cfg = json.load(open("config.json"))
    today = dt.date.today()
    old = json.load(open("docs/jobs.json")) if os.path.exists("docs/jobs.json") else []
    old = {j["id"]: j for j in old}
    raw = sources.fetch_all(cfg); print("fetched", len(raw))
    raw = [j for j in raw if j["url"] and FRESHER.search(j["title"] + " " + j["description"][:600])]
    print("fresher-ish", len(raw))
    for j in raw: j["id"] = jid(j)
    pool = list(old.values()) + [j for j in raw if j["id"] not in old]
    pool = dedupe(pool); print("after dedupe", len(pool))
    cutoff = (today - dt.timedelta(days=cfg["max_age_days"])).isoformat()
    pool = [j for j in pool if (j.get("posted") or j.get("first_seen") or today.isoformat()) >= cutoff]
    new = [j for j in pool if "role" not in j or not j.get("tagged")]
    for j in new: j.setdefault("first_seen", today.isoformat())
    usage_path = "data/usage.json"
    usage = json.load(open(usage_path)) if os.path.exists(usage_path) else {"in": 0, "out": 0, "posts": 0}
    if new and os.getenv("TAG_API_KEY"): tag(new, usage)
    json.dump(usage, open(usage_path, "w"))
    for j in pool: j["description"] = j["description"][:400]
    pool.sort(key=lambda j: j.get("posted", ""), reverse=True)
    json.dump(pool, open("docs/jobs.json", "w"), ensure_ascii=False)
    json.dump({"updated": today.isoformat(), "count": len(pool)}, open("docs/meta.json", "w"))
    print("saved", len(pool), "| tagged this run", len(new))

if __name__ == "__main__": main()