# step 1: python eval/hand_check.py sample   -> makes eval/hand_check.csv with 50 random posts
# step 2: fill my_role / my_city columns by hand
# step 3: python eval/hand_check.py score    -> accuracy + cost per 1,000 posts
import sys, csv, json, random, os
P = "eval/hand_check.csv"
if sys.argv[1] == "sample":
    jobs = json.load(open("docs/jobs.json")); random.seed(7); s = random.sample(jobs, 50)
    w = csv.writer(open(P, "w", newline="", encoding="utf-8"))
    w.writerow(["id", "title", "company", "location", "url", "llm_role", "llm_city", "my_role", "my_city"])
    for j in s: w.writerow([j["id"], j["title"], j["company"], j["location"], j["url"], j["role"], j["city"], "", ""])
else:
    rows = [r for r in csv.DictReader(open(P, encoding="utf-8")) if r["my_role"]]
    n = len(rows); rr = sum(r["llm_role"] == r["my_role"] for r in rows); cc = sum(r["llm_city"] == r["my_city"] for r in rows)
    both = sum(r["llm_role"] == r["my_role"] and r["llm_city"] == r["my_city"] for r in rows)
    print(f"checked {n}: role {rr/n:.0%}, city {cc/n:.0%}, both right {both/n:.0%}")
    u = json.load(open("data/usage.json")); pin = float(os.getenv("INPUT_PER_MTOK", 0)); pout = float(os.getenv("OUTPUT_PER_MTOK", 0))
    cost = (u["in"] * pin + u["out"] * pout) / 1e6
    print(f"posts tagged {u['posts']}, tokens in {u['in']} out {u['out']}, cost per 1,000 posts = ${cost / max(u['posts'],1) * 1000:.3f}")
