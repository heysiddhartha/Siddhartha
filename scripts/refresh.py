import json, re, urllib.request, urllib.parse, datetime, xml.etree.ElementTree as ET
from pathlib import Path

KEYWORDS={
 "marketing":["marketing","growth","brand","digital marketing","performance marketing","product marketing","marketing communications"],
 "content":["content","editorial","content strategist","content marketing","content writer","content creator","content strategy"],
 "social":["social media","community","instagram","tiktok","linkedin","social strategy","social content"],
 "creator":["creator","influencer","influencer marketing","creator partnerships","content creator"],
 "sales":["sales","business development","account executive","partnerships","business development representative"],
 "operations":["operations","project manager","program manager","strategy & operations","business operations"],
 "design":["designer","design","creative","art director","video editor","motion","graphic designer"]
}
CITY_MAP={"kolkata":["kolkata","calcutta"],"bengaluru":["bengaluru","bangalore"],"mumbai":["mumbai"],"delhi":["delhi","gurgaon","gurugram","noida"],"hyderabad":["hyderabad"],"chennai":["chennai","madras"],"pune":["pune"],"india":["india"]}
STATE_MAP={"west-bengal":["west bengal","kolkata","calcutta","siliguri","howrah","durgapur"],"karnataka":["karnataka","bengaluru","bangalore","mysuru","mysore"],"maharashtra":["maharashtra","mumbai","pune","nagpur","nashik"],"delhi":["delhi","new delhi","gurgaon","gurugram","noida"],"telangana":["telangana","hyderabad"],"tamil-nadu":["tamil nadu","chennai","madras","coimbatore"],"gujarat":["gujarat","ahmedabad","surat","vadodara"],"rajasthan":["rajasthan","jaipur","udaipur","jodhpur"],"uttar-pradesh":["uttar pradesh","lucknow","noida","kanpur","agra","varanasi"],"kerala":["kerala","kochi","cochin","thiruvananthapuram"],"andhra-pradesh":["andhra pradesh","visakhapatnam","vijayawada"],"madhya-pradesh":["madhya pradesh","bhopal","indore"],"odisha":["odisha","orissa","bhubaneswar","cuttack"],"punjab":["punjab","chandigarh","ludhiana","amritsar"],"haryana":["haryana","gurgaon","gurugram","faridabad"]}

def fetch(url):
    req=urllib.request.Request(url,headers={"User-Agent":"RADAR/2.2 (+https://heysiddhartha.github.io/Siddhartha/)"})
    with urllib.request.urlopen(req,timeout=30) as r: return json.load(r)

def cats(text):
    t=text.lower()
    return [k for k,words in KEYWORDS.items() if any(w in t for w in words)]

def location_key(location,mode=""):
    t=f"{location} {mode}".lower()
    if "india" in t or any(w in t for w in ["kolkata","calcutta","bengaluru","bangalore","mumbai","delhi","gurgaon","gurugram","noida","hyderabad","chennai","madras","pune"]): return "india"
    if "remote" in t: return "remote"
    for key,words in CITY_MAP.items():
        if any(w in t for w in words): return key
    return "other"

def state_key(location):
    t=str(location or "").lower()
    for key,words in STATE_MAP.items():
        if any(w in t for w in words): return key
    return ""

def experience(title,text=""):
    t=f"{title} {text}".lower()
    if any(w in t for w in ["intern","fresher","entry level","entry-level","graduate","trainee","0-1 year","0 to 1"]): return "fresher"
    if any(w in t for w in ["junior","associate","1-2 year","1-3 year","1 to 3"]): return "junior"
    if any(w in t for w in ["senior","lead","manager","3+ year","3-5 year","5+ year"]): return "mid"
    return "unknown"

def add(rows,typ,title,company,location,mode,url,source,posted="",salary="",stipend="",text="",employment_type="",applicants=None,industry="",function=""):
    if not title or not url: return
    title_clean=re.sub(r"\s+"," ",str(title)).strip()
    blob=f"{title_clean} {text} {industry} {function}"
    categories=cats(blob)
    if not categories: return
    loc=location or "India"
    x={"type":typ,"title":title_clean,"company":company or "Unknown company","location":loc,"state_key":state_key(loc),"location_key":location_key(loc,mode),"mode":mode or "See listing","url":url,"source":source,"categories":categories,"posted_at":posted or "","salary":salary or "","stipend":stipend or "","employment_type":employment_type or "","applicants":applicants,"industry":industry or "","function":function or ""}
    x["experience"]=experience(title_clean,blob)
    s=len(categories)*10
    if x["experience"]=="fresher": s+=10
    elif x["experience"]=="junior": s+=6
    if x["location_key"]=="india": s+=12
    elif x["location_key"]=="remote": s+=3
    if any(w in title_clean.lower() for w in ["strategist","specialist","coordinator","associate","executive"]): s+=4
    x["score"]=s
    x["reasons"]=[categories[0].title()+" match"]
    if x["experience"]=="fresher": x["reasons"].append("Fresher-friendly signal")
    elif x["experience"]=="junior": x["reasons"].append("Early-career signal")
    if x["location_key"]=="india": x["reasons"].append("India signal")
    if x["location_key"]=="remote": x["reasons"].append("Remote")
    rows.append(x)

sources={}
rows=[]

def run_source(name,fn):
    try:
        before=len(rows); fn(); sources[name]={"status":"ok","items":len(rows)-before}
    except Exception as e:
        sources[name]={"status":"error","items":0,"error":str(e)[:180]}
        print(name+":",e)

def remoteok():
    for x in fetch("https://remoteok.com/api"):
        if isinstance(x,dict) and x.get("position") and x.get("url"):
            text=" ".join([x.get("position",""),x.get("description","")," ".join(x.get("tags") or [])])
            epoch=x.get("epoch")
            posted=datetime.datetime.fromtimestamp(epoch,datetime.timezone.utc).isoformat() if epoch else ""
            add(rows,"job",x["position"],x.get("company"),x.get("location") or "Remote","Remote",x["url"],"Remote OK",posted,text=text,employment_type=x.get("type") or "")

def jobicy():
    for x in fetch("https://jobicy.com/api/v2/remote-jobs?count=200").get("jobs",[]):
        text=" ".join([x.get("jobTitle","")," ".join(x.get("jobIndustry") or []),x.get("jobDescription","")])
        salary=""
        if x.get("salaryMin") or x.get("salaryMax"):
            salary=f'{x.get("salaryMin") or ""}–{x.get("salaryMax") or ""} {x.get("salaryCurrency") or ""} / {x.get("salaryPeriod") or ""}'.strip(" –/")
        geo=x.get("jobGeo") or "Remote"
        mode="Remote" if "remote" in str(geo).lower() else "See listing"
        add(rows,"job",x.get("jobTitle",""),x.get("companyName"),geo,mode,x.get("url"),"Jobicy",x.get("pubDate",""),salary,text=text,employment_type=x.get("jobType") or x.get("jobTypeText") or "")

def himalayas():
    queries=["marketing","content","social media","sales","operations","design","business development","creator"]
    seen=set()
    for q in queries:
        url="https://himalayas.app/jobs/api/search?"+urllib.parse.urlencode({"q":q,"country":"IN","exclude_worldwide":"true","sort":"recent","page":1})
        for x in fetch(url).get("jobs",[]):
            key=x.get("guid") or x.get("applicationLink")
            if key in seen: continue
            seen.add(key)
            locs=x.get("locationRestrictions") or []
            names=[]
            for v in locs:
                if isinstance(v,dict):
                    code=str(v.get("countryCode") or v.get("code") or "").upper()
                    if code=="IN": names.append("India")
                    elif v.get("name"): names.append(str(v.get("name")))
                elif v: names.append(str(v))
            location="India"
            category_data=" ".join(map(str,x.get("category") or []))
            parent_data=" ".join(map(str,x.get("parentCategories") or []))
            text=" ".join([x.get("title",""),x.get("excerpt",""),x.get("description",""),category_data,parent_data])
            salary=""
            if x.get("minSalary") or x.get("maxSalary"):
                salary=f'{x.get("minSalary") or ""}–{x.get("maxSalary") or ""} {x.get("currency") or ""} / {x.get("salaryPeriod") or ""}'.strip(" –/")
            pub=x.get("pubDate")
            if isinstance(pub,(int,float)):
                pub=datetime.datetime.fromtimestamp(pub/1000 if pub>20000000000 else pub,datetime.timezone.utc).isoformat()
            add(rows,"job",x.get("title",""),x.get("companyName"),location,"Remote",x.get("applicationLink") or x.get("guid"),"Himalayas",str(pub or ""),salary,text=text,employment_type=x.get("employmentType") or x.get("jobType") or "",function=category_data)

def hopin():
    for endpoint,typ in [("https://api.hopinjobs.com/api/jobs","job"),("https://api.hopinjobs.com/api/internships","internship")]:
        data=fetch(endpoint); records=data.get("jobs",data.get("internships",data if isinstance(data,list) else []))
        for x in records:
            if x.get("is_active") is False: continue
            title=x.get("title") or x.get("name") or ""
            text=" ".join(str(x.get(k,"")) for k in ["title","description","industry","role_type","job_type"])
            url=x.get("url") or x.get("application_url") or x.get("apply_url")
            mode="Remote" if x.get("remote") else x.get("job_type") or ""
            add(rows,typ,title,x.get("company_name") or x.get("company"),x.get("location") or x.get("city") or "India",mode,url,"Hopin",x.get("posted_at") or "",str(x.get("ctc_amount") or ""),str(x.get("stipend") or ""),text,employment_type=x.get("employment_type") or x.get("job_type") or "")

def yubhub():
    # YubHub's current public search endpoint is unauthenticated and returns enriched job records.
    queries=["marketing India","content India","social media India","sales India","operations India","design India","marketing Kolkata","marketing Bengaluru","marketing Mumbai","content Kolkata","social media Bengaluru"]
    seen=set()
    for q in queries:
        url="https://api.yubhub.co/search?"+urllib.parse.urlencode({"q":q,"page":1,"perPage":100})
        data=fetch(url)
        records=data.get("jobs",data.get("results",data.get("data",[]))) if isinstance(data,dict) else (data if isinstance(data,list) else [])
        for x in records:
            if not isinstance(x,dict): continue
            title=x.get("title") or x.get("name") or ""
            company=x.get("company") or x.get("company_name") or ""
            if isinstance(company,dict): company=company.get("name","")
            loc=x.get("location") or x.get("jobLocation") or ""
            if isinstance(loc,dict):
                a=loc.get("address") or {}
                loc=", ".join([str(a.get(k)) for k in ["addressLocality","addressRegion","addressCountry"] if a.get(k)])
            urlx=x.get("url") or x.get("apply_url") or x.get("application_url") or x.get("applicationLink") or ""
            if not title or not urlx or urlx in seen: continue
            seen.add(urlx)
            posted=x.get("datePosted") or x.get("date_posted") or x.get("posted_at") or x.get("discovered_at") or ""
            if isinstance(posted,(int,float)):
                posted=datetime.datetime.fromtimestamp(posted/1000 if posted>20000000000 else posted,datetime.timezone.utc).isoformat()
            salary=""
            lo=x.get("salary_min") or x.get("salaryMin")
            hi=x.get("salary_max") or x.get("salaryMax")
            cur=x.get("salary_currency") or x.get("salaryCurrency") or ""
            if lo or hi: salary=f"{lo or ''}–{hi or ''} {cur}".strip(" –")
            mode=x.get("work_arrangement") or x.get("workArrangement") or x.get("jobLocationType") or ""
            category=x.get("category") or x.get("function") or ""
            skills=x.get("skills") or x.get("skills_required") or ""
            textblob=" ".join([title,str(x.get("description") or ""),q,str(skills),str(category)])
            add(rows,"job",title,company,loc or ("India" if "india" in q.lower() else "Remote"),mode,urlx,"YubHub",posted,salary,text=textblob,employment_type=x.get("employment_type") or x.get("employmentType") or "",industry=x.get("industry") or "",function=category)

def jobisite_india():
    raw=urllib.request.urlopen(urllib.request.Request("https://ws.jobisite.com/cntryrss.jsp?country=India",headers={"User-Agent":"RADAR/2.2"}),timeout=25).read()
    root=ET.fromstring(raw)
    for item in root.findall(".//item"):
        title=(item.findtext("title") or "").strip()
        link=(item.findtext("link") or "").strip()
        desc=re.sub(r"<[^>]+>"," ",item.findtext("description") or "")
        pub=item.findtext("pubDate") or ""
        if title and link:
            add(rows,"job",title,"Jobisite","India","See listing",link,"Jobisite",pub,text=f"{title} {desc}")

def jobvetta():
    import os
    key=os.getenv("JOBVETTA_API_KEY","").strip()
    if not key:
        raise RuntimeError("JOBVETTA_API_KEY not configured")
    queries=["marketing","content","social media","sales","operations","design","business development"]
    seen=set()
    for q in queries:
        url="https://api.jobvetta.com/v1/jobs?"+urllib.parse.urlencode({"q":q,"days":30,"limit":50})
        req=urllib.request.Request(url,headers={"User-Agent":"RADAR/2.2","Authorization":"Bearer "+key})
        with urllib.request.urlopen(req,timeout=25) as r: data=json.load(r)
        for x in data.get("jobs",[]):
            jid=x.get("job_id") or x.get("url")
            if jid in seen: continue
            seen.add(jid)
            loc=x.get("location") or "India"
            posted=x.get("created_at")
            if isinstance(posted,(int,float)): posted=datetime.datetime.fromtimestamp(posted,datetime.timezone.utc).isoformat()
            salary=""
            if x.get("salary_min") or x.get("salary_max"): salary=f'{x.get("salary_min") or ""}–{x.get("salary_max") or ""} {x.get("salary_currency") or ""}'.strip(" –")
            text=" ".join([x.get("title",""),x.get("description","")," ".join(x.get("skills_required") or [])])
            add(rows,"job",x.get("title",""),x.get("company"),loc,x.get("work_model") or "",x.get("url"),"Jobvetta",posted,salary,text=text,employment_type=x.get("employment_type") or "",industry=x.get("industry") or "")

for name,fn in [("Remote OK",remoteok),("Jobicy",jobicy),("Himalayas India",himalayas),("Hopin",hopin),("YubHub",yubhub),("Jobisite India",jobisite_india),("Jobvetta India",jobvetta)]: run_source(name,fn)

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
db=Path("data/opportunities.json")
if len(clean)>=10 or not db.exists():
    db.write_text(json.dumps(clean[:400],ensure_ascii=False,indent=2),encoding="utf-8")
else:
    print(f"Safety hold: only {len(clean)} usable records; keeping previous database.")

items=clean[:100]
rss=['<?xml version="1.0" encoding="UTF-8"?>','<rss version="2.0"><channel><title>RADAR — India Opportunities</title><link>https://heysiddhartha.github.io/Siddhartha/</link><description>Fresh jobs and career opportunities.</description>']
for x in items:
    title=x["title"].replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")
    link=x["url"].replace("&","&amp;")
    rss.append(f"<item><title>{title}</title><link>{link}</link><guid>{link}</guid><description>{x['company']} · {x['location']}</description></item>")
rss.append("</channel></rss>")
Path("feed.xml").write_text("
".join(rss),encoding="utf-8")
health={"updated_at":now.isoformat(),"total_fetched":len(rows),"total_clean":len(clean),"published":min(len(clean),400),"sources":sources}
Path("data/health.json").write_text(json.dumps(health,ensure_ascii=False,indent=2),encoding="utf-8")
print(f"RADAR refreshed: {len(clean)} opportunities")
