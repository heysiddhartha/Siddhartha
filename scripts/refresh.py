import json, re, urllib.request, datetime
from pathlib import Path

KEYWORDS={
 "marketing":["marketing","growth","brand","digital marketing","performance marketing"],
 "content":["content","editorial","content strategist","content marketing"],
 "social":["social media","community","instagram","tiktok","linkedin"],
 "creator":["creator","influencer","influencer marketing","creator partnerships"],
 "sales":["sales","business development","account executive","partnerships"],
 "operations":["operations","project manager","program manager"],
 "design":["designer","design","creative","art director","video editor","motion"]
}
CITY_MAP={"kolkata":["kolkata","calcutta"],"bengaluru":["bengaluru","bangalore"],"mumbai":["mumbai"],"delhi":["delhi","gurgaon","gurugram","noida"],"hyderabad":["hyderabad"],"chennai":["chennai","madras"],"india":["india"]}

def fetch(url):
    req=urllib.request.Request(url,headers={"User-Agent":"RADAR/1.0"})
    with urllib.request.urlopen(req,timeout=30) as r:
        return json.load(r)

def cats(text):
    t=text.lower()
    return [k for k,words in KEYWORDS.items() if any(w in t for w in words)]

def location_key(location,mode=""):
    t=f"{location} {mode}".lower()
    if "remote" in t: return "remote"
    for key,words in CITY_MAP.items():
        if any(w in t for w in words): return key
    return "other"

def experience(title,text=""):
    t=f"{title} {text}".lower()
    if any(w in t for w in ["intern","fresher","entry level","entry-level","graduate","trainee","0-1 year","0 to 1"]): return "fresher"
    if any(w in t for w in ["junior","associate","1-2 year","1-3 year","1 to 3"]): return "junior"
    if any(w in t for w in ["senior","lead","manager","3+ year","3-5 year","5+ year"]): return "mid"
    return "unknown"

def score(x):
    s=len(x["categories"])*10
    if x["experience"]=="fresher": s+=10
    elif x["experience"]=="junior": s+=6
    if x["location_key"]=="india": s+=5
    if x["location_key"]=="remote": s+=3
    title=x["title"].lower()
    if any(w in title for w in ["strategist","specialist","coordinator","associate"]): s+=4
    return s

def add(rows,typ,title,company,location,mode,url,source,categories,posted="",salary="",stipend="",text=""):
    if not title or not url or not categories: return
    x={"type":typ,"title":re.sub(r"\s+"," ",title).strip(),"company":company or "Unknown company","location":location or "India","location_key":location_key(location or "India",mode),"mode":mode or "See listing","url":url,"source":source,"categories":categories,"posted_at":posted or "","salary":salary or "","stipend":stipend or ""}
    x["experience"]=experience(title,text)
    x["score"]=score(x)
    x["reasons"]=[categories[0].title()+" match"]
    if x["experience"]=="fresher": x["reasons"].append("Fresher-friendly signal")
    elif x["experience"]=="junior": x["reasons"].append("Early-career signal")
    elif x["location_key"]=="remote": x["reasons"].append("Remote")
    rows.append(x)

rows=[]

try:
    for x in fetch("https://remoteok.com/api"):
        if isinstance(x,dict) and x.get("position") and x.get("url"):
            text=" ".join([x.get("position",""),x.get("description","")," ".join(x.get("tags") or [])])
            epoch=x.get("epoch")
            posted=datetime.datetime.fromtimestamp(epoch,datetime.timezone.utc).isoformat() if epoch else ""
            add(rows,"job",x["position"],x.get("company"),x.get("location") or "Remote","Remote",x["url"],"Remote OK",cats(text),posted,text=text)
except Exception as e: print("Remote OK:",e)

try:
    for x in fetch("https://jobicy.com/api/v2/remote-jobs?count=200").get("jobs",[]):
        text=" ".join([x.get("jobTitle","")," ".join(x.get("jobIndustry") or []),x.get("jobDescription","")])
        salary=""
        if x.get("salaryMin") or x.get("salaryMax"):
            salary=f'{x.get("salaryMin") or ""}–{x.get("salaryMax") or ""} {x.get("salaryCurrency") or ""} / {x.get("salaryPeriod") or ""}'.strip(" –/")
        add(rows,"job",x.get("jobTitle",""),x.get("companyName"),x.get("jobGeo") or "Remote","Remote",x.get("url"),"Jobicy",cats(text),x.get("pubDate",""),salary,text=text)
except Exception as e: print("Jobicy:",e)

try:
    for x in fetch("https://himalayas.app/jobs/api?limit=100").get("jobs",[]):
        text=" ".join([x.get("title",""),x.get("description","")," ".join(x.get("categories") or [])])
        add(rows,"job",x.get("title",""),x.get("companyName"),x.get("location") or "Remote","Remote",x.get("url") or x.get("applicationUrl"),"Himalayas",cats(text),x.get("publishedAt") or x.get("pubDate") or "",text=text)
except Exception as e: print("Himalayas:",e)

try:
    for endpoint,typ in [("https://api.hopinjobs.com/api/jobs","job"),("https://api.hopinjobs.com/api/internships","internship")]:
        data=fetch(endpoint)
        records=data.get("jobs",data.get("internships",data if isinstance(data,list) else []))
        for x in records:
            title=x.get("title") or x.get("name") or ""
            text=" ".join(str(x.get(k,"")) for k in ["title","description","industry","role_type","job_type"])
            url=x.get("url") or x.get("application_url") or x.get("apply_url")
            add(rows,typ,title,x.get("company_name") or x.get("company"),x.get("location") or x.get("city") or "India","Remote" if x.get("remote") else x.get("job_type") or "",url,"Hopin",cats(text),x.get("posted_at") or "",str(x.get("ctc_amount") or ""),str(x.get("stipend") or ""),text)
except Exception as e: print("Hopin:",e)

now=datetime.datetime.now(datetime.timezone.utc)
seen=set(); clean=[]
for x in sorted(rows,key=lambda y:(y["score"],y.get("posted_at","")),reverse=True):
    url=x["url"]
    if not url or url in seen: continue
    raw=x.get("posted_at","")
    if raw:
        try:
            dt=datetime.datetime.fromisoformat(raw.replace("Z","+00:00"))
            if (now-dt).days>45: continue
        except Exception: pass
    seen.add(url); clean.append(x)

Path("data").mkdir(exist_ok=True)
Path("data/opportunities.json").write_text(json.dumps(clean[:250],ensure_ascii=False,indent=2),encoding="utf-8")
items=clean[:50]
rss=['<?xml version="1.0" encoding="UTF-8"?>','<rss version="2.0"><channel><title>RADAR — India Opportunities</title><link>https://heysiddhartha.github.io/Siddhartha/</link><description>Fresh jobs, internships, freelance and creator opportunities.</description>']
for x in items:
    title=x["title"].replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")
    link=x["url"].replace("&","&amp;")
    rss.append(f"<item><title>{title}</title><link>{link}</link><guid>{link}</guid><description>{x['company']} · {x['location']}</description></item>")
rss.append("</channel></rss>")
Path("feed.xml").write_text("\n".join(rss),encoding="utf-8")
print(f"RADAR refreshed: {len(clean)} opportunities")