import os, re, html, time, datetime as dt, requests

UA = {"User-Agent": "fresher-jobs-india/1.0 (student project)"}
INDIA = re.compile(r"india|bengaluru|bangalore|mumbai|delhi|gurgaon|gurugram|noida|hyderabad|pune|chennai|kolkata|ahmedabad|remote", re.I)

def clean(t):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html.unescape(t or ""))).strip()

def adzuna(cfg):
    aid, key = os.getenv("ADZUNA_APP_ID"), os.getenv("ADZUNA_APP_KEY")
    if not (aid and key):
        print("adzuna: no keys, skipping"); return []
    out = []
    for q in cfg["adzuna_queries"]:
        for p in range(1, cfg["adzuna_pages"] + 1):
            try:
                r = requests.get(f"https://api.adzuna.com/v1/api/jobs/in/search/{p}", headers=UA, timeout=30,
                    params={"app_id": aid, "app_key": key, "what": q, "results_per_page": 50,
                            "max_days_old": cfg["max_age_days"], "content-type": "application/json"})
                r.raise_for_status()
                for j in r.json().get("results", []):
                    out.append(dict(source="adzuna", title=j.get("title", ""), company=(j.get("company") or {}).get("display_name", ""),
                        location=(j.get("location") or {}).get("display_name", ""), url=j.get("redirect_url", ""),
                        description=clean(j.get("description")), posted=(j.get("created") or "")[:10]))
            except Exception as e:
                print("adzuna fail", q, p, e); break
            time.sleep(0.5)
    return out

def greenhouse(cfg):
    out = []
    for t in cfg["greenhouse"]:
        try:
            r = requests.get(f"https://boards-api.greenhouse.io/v1/boards/{t}/jobs?content=true", headers=UA, timeout=30)
            r.raise_for_status()
            for j in r.json().get("jobs", []):
                loc = (j.get("location") or {}).get("name", "")
                if not INDIA.search(loc): continue
                out.append(dict(source="greenhouse:" + t, title=j["title"], company=t, location=loc, url=j["absolute_url"],
                    description=clean(j.get("content")), posted=(j.get("updated_at") or "")[:10]))
        except Exception as e:
            print("greenhouse fail", t, e)
    return out

def lever(cfg):
    out = []
    for t in cfg["lever"]:
        try:
            r = requests.get(f"https://api.lever.co/v0/postings/{t}?mode=json", headers=UA, timeout=30)
            r.raise_for_status()
            for j in r.json():
                loc = (j.get("categories") or {}).get("location") or ""
                if not INDIA.search(loc): continue
                d = dt.datetime.utcfromtimestamp(j["createdAt"] / 1000).strftime("%Y-%m-%d") if j.get("createdAt") else ""
                out.append(dict(source="lever:" + t, title=j["text"], company=t, location=loc, url=j["hostedUrl"],
                    description=clean(j.get("descriptionPlain")), posted=d))
        except Exception as e:
            print("lever fail", t, e)
    return out

def fetch_all(cfg):
    return adzuna(cfg) + greenhouse(cfg) + lever(cfg)
