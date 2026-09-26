import React,{useEffect,useMemo,useState} from "react";
import {createRoot} from "react-dom/client";
import {motion,AnimatePresence} from "framer-motion";
import "./styles.css";

const roleCats=["all","marketing","content","social","creator","sales","operations","design"];
const roleLabels={all:"All roles",marketing:"Marketing",content:"Content",social:"Social Media",creator:"Creator",sales:"Sales / BD",operations:"Operations",design:"Design / Creative"};
const cities=["all","india","kolkata","bengaluru","mumbai","delhi","hyderabad","chennai","pune","remote"];
const cityLabels={all:"Anywhere",india:"India",kolkata:"Kolkata",bengaluru:"Bengaluru",mumbai:"Mumbai",delhi:"Delhi NCR",hyderabad:"Hyderabad",chennai:"Chennai",pune:"Pune",remote:"Remote"};
const experience=["all","internship","entry","associate","mid","director"];
const employment=["all","full-time","part-time","contract","temporary","internship","volunteer"];
const arrangements=["all","remote","hybrid","on-site"];
const postedOptions=[["all","Any time"],["1","Past 24 hours"],["7","Past week"],["30","Past month"]];
const industries=["all","Marketing","Technology","Media","Finance","Retail","Travel","Healthcare","Education","Other"];

function age(x){const d=x.posted_at||x.date;if(!d)return 999;const n=(Date.now()-new Date(d).getTime())/86400000;return Number.isFinite(n)?Math.max(0,n):999}
function ageText(a){return a<1?"TODAY":a<2?"1D AGO":a<30?Math.floor(a)+"D AGO":">30D"}
function expMatch(x,v){if(v==="all")return true;const e=(x.experience||"").toLowerCase();if(v==="internship")return e==="fresher"&&/intern/i.test((x.title||"")+" "+(x.type||""));if(v==="entry")return e==="fresher";if(v==="associate")return e==="junior";if(v==="mid")return e==="mid";if(v==="director")return /director|head|vp|vice president|chief/i.test(x.title||"");return true}
function normMode(x){const s=((x.mode||"")+" "+(x.work_model||"")).toLowerCase();if(s.includes("hybrid"))return "hybrid";if(s.includes("remote"))return "remote";if(s.includes("on-site")||s.includes("onsite"))return "on-site";return ""}
function salaryNumber(s){const m=String(s||"").replace(/,/g,"").match(/(d+(?:.d+)?)/);return m?Number(m[1]):null}

function App(){
 const [jobs,setJobs]=useState([]),[loading,setLoading]=useState(true),[saved,setSaved]=useState(()=>new Set(JSON.parse(localStorage.getItem("radar-saved")||"[]"))),[selected,setSelected]=useState(null);
 const [q,setQ]=useState(""),[role,setRole]=useState("all"),[loc,setLoc]=useState("india"),[posted,setPosted]=useState("all"),[company,setCompany]=useState(""),[exp,setExp]=useState("all"),[type,setType]=useState("all"),[remote,setRemote]=useState("all"),[industry,setIndustry]=useState("all"),[functionFilter,setFunctionFilter]=useState("all"),[title,setTitle]=useState(""),[easy,setEasy]=useState(false),[linkedin,setLinkedin]=useState(false),[network,setNetwork]=useState(false),[under10,setUnder10]=useState(false),[salary,setSalary]=useState(""),[sort,setSort]=useState("recent"),[showMore,setShowMore]=useState(false);

 useEffect(()=>{fetch("./data/opportunities.json?"+Date.now()).then(r=>r.json()).then(x=>setJobs(Array.isArray(x)?x:[])).catch(()=>setJobs([])).finally(()=>setLoading(false))},[]);
 useEffect(()=>localStorage.setItem("radar-saved",JSON.stringify([...saved])),[saved]);

 const indiaCount=useMemo(()=>jobs.filter(x=>{const s=((x.location_key||"")+" "+(x.location||"")).toLowerCase();return /india|kolkata|bengaluru|bangalore|mumbai|delhi|gurgaon|gurugram|noida|hyderabad|chennai|pune|kerala/.test(s)}).length,[jobs]);
 const sourceCount=new Set(jobs.map(x=>x.source).filter(Boolean)).size;

 const view=useMemo(()=>{
  const a=jobs.filter(x=>{
   const cats=x.categories||[], hay=[x.title,x.company,x.location,x.industry,x.function,cats.join(" "),x.source].join(" ").toLowerCase();
   if(role!=="all"&&!cats.includes(role))return false;
   const ls=((x.location_key||"")+" "+(x.location||"")).toLowerCase();
   if(loc==="india"&&!/india|kolkata|bengaluru|bangalore|mumbai|delhi|gurgaon|gurugram|noida|hyderabad|chennai|pune|kerala/.test(ls))return false;
   if(loc!=="all"&&loc!=="india"&&!ls.includes(loc==="delhi"?"delhi":loc))return false;
   if(posted!=="all"&&age(x)>Number(posted))return false;
   if(company&&!String(x.company||"").toLowerCase().includes(company.toLowerCase()))return false;
   if(!expMatch(x,exp))return false;
   if(type!=="all"&&!String(x.employment_type||"").toLowerCase().includes(type))return false;
   if(remote!=="all"&&normMode(x)!==remote)return false;
   if(industry!=="all"&&!String(x.industry||"").toLowerCase().includes(industry.toLowerCase()))return false;
   if(functionFilter!=="all"&&!cats.includes(functionFilter))return false;
   if(title&&!String(x.title||"").toLowerCase().includes(title.toLowerCase()))return false;
   if(easy&&x.apply_method!=="easy_apply")return false;
   if(linkedin&&x.apply_method!=="linkedin")return false;
   if(network&&!x.in_network)return false;
   if(under10&&!(Number.isFinite(Number(x.applicants))&&Number(x.applicants)<10))return false;
   if(salary&&salaryNumber(x.salary)<Number(salary))return false;
   return !q||hay.includes(q.toLowerCase());
  });
  return a.sort((a,b)=>sort==="score"?(b.score||0)-(a.score||0):age(a)-age(b));
 },[jobs,q,role,loc,posted,company,exp,type,remote,industry,functionFilter,title,easy,linkedin,network,under10,salary,sort]);

 const reset=()=>{setQ("");setRole("all");setLoc("india");setPosted("all");setCompany("");setExp("all");setType("all");setRemote("all");setIndustry("all");setFunctionFilter("all");setTitle("");setEasy(false);setLinkedin(false);setNetwork(false);setUnder10(false);setSalary("");setSort("recent")};
 const toggleSave=x=>setSaved(s=>{const n=new Set(s),id=x.url||x.title;n.has(id)?n.delete(id):n.add(id);return n});

 return <div className="app"><div className="ambient"/><Web/>
  <header className="nav glass"><div className="brand"><span className="logo-ring">R</span><strong>RADAR</strong><small>OPPORTUNITY OS</small></div><div className="nav-center"><span className="live-dot"/>LIVE INDEX <b>{jobs.length}</b><span className="source-pill">{sourceCount} SOURCES</span></div><button className="saved-btn" onClick={()=>document.getElementById("feed")?.scrollIntoView({behavior:"smooth"})}>SAVED <b>{saved.size}</b></button></header>

  <main>
   <section className="hero">
    <div className="hero-left">
      <div className="eyebrow"><span>01</span> DISCOVER / FILTER / APPLY</div>
      <h1>FIND THE<br/><em>OPENING.</em></h1>
      <p className="hero-lead">A sharper layer between you and the job boards. Search the signal, cut the noise, and open the original listing.</p>
      <div className="hero-search glass"><span>⌕</span><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Try “content strategist in Kolkata”"/><button onClick={()=>document.getElementById("feed")?.scrollIntoView({behavior:"smooth"})}>SEARCH</button></div>
      <div className="hero-meta"><span><b>{indiaCount}</b> India signals</span><span><b>{jobs.length}</b> indexed</span><span><b>{sourceCount}</b> public sources</span></div>
    </div>
    <div className="command glass">
      <div className="command-top"><span>RADAR COMMAND</span><i>SCAN 360°</i></div>
      <div className="radar-stage"><div className="radar-grid"/><div className="radar-sweep"/><div className="radar-core"><b>{view.length}</b><small>MATCHES</small></div><i className="blip b1"/><i className="blip b2"/><i className="blip b3"/><i className="blip b4"/></div>
      <div className="command-foot"><span>LOCATION <b>INDIA</b></span><span>FRESHNESS <b>{posted==="all"?"ANY":posted+"D"}</b></span><span>STATUS <b>ONLINE</b></span></div>
    </div>
   </section>

   <section id="feed" className="feed-layout">
    <aside className="filter-panel glass">
      <div className="filter-head"><div><span>ALL FILTERS</span><b>{view.length} matches</b></div><button onClick={reset}>RESET</button></div>
      <Filter title="Search"><input className="field" value={q} onChange={e=>setQ(e.target.value)} placeholder="Keywords, skills, company"/></Filter>
      <Filter title="Location"><div className="select-list">{cities.map(v=><button key={v} className={loc===v?"active":""} onClick={()=>setLoc(v)}>{cityLabels[v]}</button>)}</div></Filter>
      <Filter title="Date posted"><div className="select-list">{postedOptions.map(([v,l])=><button key={v} className={posted===v?"active":""} onClick={()=>setPosted(v)}>{l}</button>)}</div></Filter>
      <Filter title="Experience level"><div className="select-list">{experience.map(v=><button key={v} className={exp===v?"active":""} onClick={()=>setExp(v)}>{v==="all"?"Any":v.replace("-", " ")}</button>)}</div></Filter>
      <Filter title="Employment type"><div className="select-list">{employment.map(v=><button key={v} className={type===v?"active":""} onClick={()=>setType(v)}>{v==="all"?"Any":v}</button>)}</div></Filter>
      <Filter title="Remote"><div className="select-list">{arrangements.map(v=><button key={v} className={remote===v?"active":""} onClick={()=>setRemote(v)}>{v==="all"?"Any":v}</button>)}</div></Filter>
      <button className="more-toggle" onClick={()=>setShowMore(!showMore)}>{showMore?"HIDE":"MORE"} FILTERS <span>{showMore?"−":"+"}</span></button>
      <AnimatePresence>{showMore&&<motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="more-box">
        <Filter title="Company"><input className="field" value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company name"/></Filter>
        <Filter title="Job title"><input className="field" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Exact title"/></Filter>
        <Filter title="Function"><div className="select-list">{roleCats.map(v=><button key={v} className={functionFilter===v?"active":""} onClick={()=>setFunctionFilter(v)}>{roleLabels[v]}</button>)}</div></Filter>
        <Filter title="Industry"><div className="select-list">{industries.map(v=><button key={v} className={industry===v?"active":""} onClick={()=>setIndustry(v)}>{v==="all"?"Any":v}</button>)}</div></Filter>
        <Filter title="Salary minimum"><input className="field" type="number" min="0" value={salary} onChange={e=>setSalary(e.target.value)} placeholder="e.g. 30000"/></Filter>
        <div className="toggles"><Toggle label="Easy Apply" value={easy} set={setEasy}/><Toggle label="LinkedIn Apply" value={linkedin} set={setLinkedin}/><Toggle label="In my network" value={network} set={setNetwork}/><Toggle label="Under 10 applicants" value={under10} set={setUnder10}/></div>
        <p className="coverage-note">These LinkedIn-style filters are wired to source metadata when that metadata exists. RADAR never invents applicant counts, network status, or LinkedIn application status.</p>
      </motion.div>}</AnimatePresence>
      <div className="filter-foot"><b>{indiaCount}</b><span>India signals currently indexed</span></div>
    </aside>

    <section className="results">
      <div className="results-head"><div><div className="eyebrow"><span>02</span> LIVE OPPORTUNITY STREAM</div><h2>{loading?"SCANNING":view.length}<small> RESULTS</small></h2></div><div className="sort glass"><span>SORT</span><select value={sort} onChange={e=>setSort(e.target.value)}><option value="recent">Most recent</option><option value="score">Most relevant</option></select></div></div>
      <div className="active-row"><span><i className="live-dot"/> INDIA MODE</span><span>{posted==="all"?"ANY TIME":posted+" DAY WINDOW"}</span><span>{sourceCount} SOURCES</span><button onClick={()=>setLoc("all")}>SEARCH EVERYWHERE ↗</button></div>
      {view.length===0&&!loading?<div className="empty glass"><div className="empty-orb">⌁</div><h3>NO MATCHES IN THIS NET</h3><p>Broaden a filter or switch Location to Anywhere. India currently has {indiaCount} indexed signal{indiaCount===1?"":"s"}.</p><button onClick={reset}>RESET FILTERS</button></div>:<div className="job-grid">{view.map((x,i)=><Job key={x.url||i} x={x} i={i} saved={saved.has(x.url||x.title)} onSave={()=>toggleSave(x)} onOpen={()=>setSelected(x)}/>)}</div>}
    </section>
   </section>
  </main>

  <AnimatePresence>{selected&&<Detail x={selected} saved={saved.has(selected.url||selected.title)} onSave={()=>toggleSave(selected)} onClose={()=>setSelected(null)}/>}</AnimatePresence>
 </div>
}
function Filter({title,children}){return <div className="filter-group"><h3>{title}</h3>{children}</div>}
function Toggle({label,value,set}){return <button className={"toggle "+(value?"on":"")} onClick={()=>set(!value)}><span>{label}</span><i/></button>}
function Job({x,i,saved,onSave,onOpen}){const mode=normMode(x);return <motion.article className="job-card glass" initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{delay:Math.min(i,15)*.025}} whileHover={{y:-5}}><div className="card-top"><span>{x.source||"PUBLIC SOURCE"}</span><button onClick={onSave}>{saved?"★":"☆"}</button></div><div className="company-line"><div className="company-mark">{(x.company||"?").slice(0,1)}</div><div><h3>{x.title}</h3><p>{x.company}</p></div></div><div className="facts"><span>⌖ {x.location||"India"}</span><span>◷ {ageText(age(x))}</span>{mode&&<span>◉ {mode}</span>}</div><div className="chips">{(x.categories||[]).slice(0,3).map(c=><i key={c}>{c}</i>)}</div><div className="card-bottom"><span>RADAR <b>{x.score||0}</b></span><button onClick={onOpen}>VIEW SIGNAL ↗</button></div></motion.article>}
function Detail({x,saved,onSave,onClose}){return <motion.div className="overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><motion.aside className="drawer glass" initial={{x:"100%"}} animate={{x:0}} exit={{x:"100%"}}><button className="close" onClick={onClose}>×</button><div className="eyebrow"><span>03</span> {x.source||"PUBLIC SOURCE"}</div><h2>{x.title}</h2><h3>{x.company}</h3><div className="detail-grid"><span>LOCATION<b>{x.location||"India"}</b></span><span>EXPERIENCE<b>{x.experience||"Unknown"}</b></span><span>TYPE<b>{x.employment_type||"Not supplied"}</b></span><span>PAY<b>{x.salary||x.stipend||"Not listed"}</b></span></div><p>{(x.reasons||[]).join(" · ")||"Relevant opportunity detected by RADAR."}</p><div className="signal-score"><b>{x.score||0}</b><span>RADAR<br/>SIGNAL</span></div><div className="drawer-actions"><a href={x.url} target="_blank" rel="noreferrer">OPEN ORIGINAL ↗</a><button onClick={onSave}>{saved?"REMOVE SAVE":"SAVE SIGNAL"}</button></div></motion.aside></motion.div>}
function Web(){return <div className="web-bg"><svg viewBox="0 0 1440 900" preserveAspectRatio="none"><path d="M0 180L360 0M0 520L720 0M250 900L1440 0M860 900L1440 460M1160 900L1440 690"/><circle cx="930" cy="260" r="250"/><circle cx="930" cy="260" r="170"/><circle cx="930" cy="260" r="90"/></svg></div>}
createRoot(document.getElementById("root")).render(<App/>);
