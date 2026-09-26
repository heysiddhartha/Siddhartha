import React,{useEffect,useMemo,useState} from "react";
import {createRoot} from "react-dom/client";
import {motion,AnimatePresence} from "framer-motion";
import "./styles.css";

const CATS=["all","marketing","content","social","creator","sales","operations","design"];
const catLabel={all:"Everything",marketing:"Marketing",content:"Content",social:"Social",creator:"Creator",sales:"Sales",operations:"Operations",design:"Creative"};
const locs=["all","india","kolkata","bengaluru","mumbai","delhi","hyderabad","chennai","remote"];
const labelLoc={all:"Anywhere",india:"India",kolkata:"Kolkata",bengaluru:"Bengaluru",mumbai:"Mumbai",delhi:"Delhi NCR",hyderabad:"Hyderabad",chennai:"Chennai",remote:"Remote"};

function age(x){const d=x.posted_at||x.date;if(!d)return 999;const n=(Date.now()-new Date(d).getTime())/86400000;return Number.isFinite(n)?Math.max(0,n):999}
function ageText(a){return a<=1?"TODAY":a<=3?Math.max(1,Math.floor(a))+"D AGO":a<30?Math.floor(a)+"D AGO":"OLDER"}
function App(){
 const [jobs,setJobs]=useState([]),[cat,setCat]=useState("all"),[loc,setLoc]=useState("india"),[exp,setExp]=useState("all"),[fresh,setFresh]=useState("all"),[q,setQ]=useState(""),[sort,setSort]=useState("fresh"),[saved,setSaved]=useState(()=>new Set(JSON.parse(localStorage.getItem("radar-saved")||"[]"))),[selected,setSelected]=useState(null),[loading,setLoading]=useState(true);
 useEffect(()=>{fetch("./data/opportunities.json?"+Date.now()).then(r=>r.json()).then(x=>setJobs(Array.isArray(x)?x:[])).catch(()=>setJobs([])).finally(()=>setLoading(false))},[]);
 useEffect(()=>localStorage.setItem("radar-saved",JSON.stringify([...saved])),[saved]);
 const view=useMemo(()=>{let a=jobs.filter(x=>{
   if(cat!=="all"&&!(x.categories||[]).includes(cat))return false;
   const lk=(x.location_key||"").toLowerCase(),ll=(x.location||"").toLowerCase();
   if(loc==="india"&&!((lk.includes("india"))||ll.includes("india")||ll.includes("bengaluru")||ll.includes("kolkata")||ll.includes("mumbai")||ll.includes("delhi")||ll.includes("hyderabad")||ll.includes("chennai")||ll.includes("pune")||ll.includes("kerala")||ll.includes("bangalore")))return false;
   if(loc!=="all"&&loc!=="india"&&!lk.includes(loc))return false;
   if(exp!=="all"&&x.experience!==exp)return false;
   if(fresh!=="all"&&age(x)>+fresh)return false;
   const hay=[x.title,x.company,x.location,(x.categories||[]).join(" "),x.source].join(" ").toLowerCase();
   return !q||hay.includes(q.toLowerCase());
 });return a.sort((a,b)=>sort==="score"?(b.score||0)-(a.score||0):age(a)-age(b))},[jobs,cat,loc,exp,fresh,q,sort]);
 const indiaCount=jobs.filter(x=>{const s=((x.location_key||"")+" "+(x.location||"")).toLowerCase();return /india|kolkata|bengaluru|mumbai|delhi|hyderabad|chennai|pune|kerala|bangalore/.test(s)}).length;
 const toggleSave=(x)=>setSaved(s=>{const n=new Set(s),id=x.url||x.title;n.has(id)?n.delete(id):n.add(id);return n});
 const clear=()=>{setCat("all");setLoc("india");setExp("all");setFresh("all");setQ("")};
 return <div className="app">
  <div className="city-glow"/><WebLines/>
  <header className="nav"><div className="brand"><span className="spider-mark">✦</span><span>RADAR</span><small>/ WEB MODE</small></div><div className="nav-status"><i/> FEED ONLINE <b>{jobs.length}</b></div><button className="saved-btn">SAVED <b>{saved.size}</b></button></header>
  <main>
   <section className="hero">
    <div className="hero-copy"><div className="kicker">OPPORTUNITY INTELLIGENCE / INDIA</div><h1>YOUR NEXT<br/><em>MOVE.</em></h1><p>Fresh jobs. Less noise. One web-slinging feed built to get you from scrolling to applying.</p><div className="hero-buttons"><a href="#feed">ENTER THE FEED <span>↓</span></a><button onClick={()=>view[0]&&setSelected(view[Math.floor(Math.random()*view.length)])}>RANDOM SIGNAL ↗</button></div></div>
    <div className="spider-orb"><div className="orb-web"/><div className="orb-core">R<span>+</span></div><div className="orb-label">SPIDER<br/>SENSE <b>ACTIVE</b></div><div className="orb-dot d1"/><div className="orb-dot d2"/><div className="orb-dot d3"/></div>
   </section>
   <section id="feed" className="workspace">
    <aside className="filters"><div className="filter-title"><span>WEB FILTER</span><button onClick={clear}>RESET</button></div><h3>ROLE / DISCIPLINE</h3><div className="chips">{CATS.map(c=><button key={c} className={cat===c?"on":""} onClick={()=>setCat(c)}>{catLabel[c]}</button>)}</div><h3>LOCATION</h3><div className="select-grid">{locs.map(l=><button key={l} className={loc===l?"on":""} onClick={()=>setLoc(l)}>{labelLoc[l]}</button>)}</div><h3>EXPERIENCE</h3><div className="select-grid"><button className={exp==="all"?"on":""} onClick={()=>setExp("all")}>Any</button><button className={exp==="fresher"?"on":""} onClick={()=>setExp("fresher")}>0–1 YR</button><button className={exp==="junior"?"on":""} onClick={()=>setExp("junior")}>1–3 YR</button><button className={exp==="mid"?"on":""} onClick={()=>setExp("mid")}>3+ YR</button></div><h3>FRESHNESS</h3><div className="select-grid"><button className={fresh==="all"?"on":""} onClick={()=>setFresh("all")}>ANY</button><button className={fresh==="1"?"on":""} onClick={()=>setFresh("1")}>24H</button><button className={fresh==="3"?"on":""} onClick={()=>setFresh("3")}>3D</button><button className={fresh==="7"?"on":""} onClick={()=>setFresh("7")}>7D</button></div><div className="filter-stat"><b>{indiaCount}</b><span>India signals indexed</span></div></aside>
    <section className="results"><div className="results-top"><div><div className="kicker red">LIVE FEED / INDIA</div><h2>{loading?"SCANNING":view.length}<small> OPPORTUNITIES</small></h2></div><div className="search"><span>⌕</span><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search company, role, skill..."/><select value={sort} onChange={e=>setSort(e.target.value)}><option value="fresh">NEWEST</option><option value="score">RADAR SCORE</option></select></div></div>
    <div className="signal-bar"><span><i/> LIVE SCAN</span><span>INDIA: {indiaCount}</span><span>PUBLIC SOURCES: {new Set(jobs.map(x=>x.source).filter(Boolean)).size}</span></div>
    {view.length===0&&!loading?<div className="empty"><div className="empty-web">⌁</div><h3>NO SIGNAL IN THIS NET.</h3><p>Try India-wide, remove a filter, or wait for the next source refresh.</p><button onClick={clear}>EXPAND TO INDIA</button></div>:<div className="job-grid">{view.map((x,i)=><Job key={x.url||i} x={x} i={i} saved={saved.has(x.url||x.title)} onSave={()=>toggleSave(x)} onOpen={()=>setSelected(x)}/>)}</div>}
    </section>
   </section>
   <section className="bottom-strip"><div><b>01 / FRESHNESS</b><span>New signals rise first.</span></div><div><b>02 / FIT</b><span>Role signals shape the score.</span></div><div><b>03 / NOISE</b><span>Duplicates get cut.</span></div><div><b>04 / WEB</b><span>Sources refresh themselves.</span></div></section>
  </main>
  <AnimatePresence>{selected&&<Detail x={selected} saved={saved.has(selected.url||selected.title)} onSave={()=>toggleSave(selected)} onClose={()=>setSelected(null)}/>}</AnimatePresence>
 </div>
}
function Job({x,i,saved,onSave,onOpen}){return <motion.article className="job-card" initial={{opacity:0,y:24,rotateX:8}} animate={{opacity:1,y:0,rotateX:0}} transition={{delay:Math.min(i,12)*.035,duration:.45}} whileHover={{y:-7,rotateX:-1,rotateY:1}}><div className="job-head"><span>{(x.type||"JOB").toUpperCase()}</span><span>{ageText(age(x))}</span><button onClick={onSave}>{saved?"★":"☆"}</button></div><div className="job-id"><div className="company-badge">{(x.company||"?").slice(0,1)}</div><div><h3>{x.title}</h3><p>{x.company}</p><small>{x.location||"India"} {x.mode&&"· "+x.mode}</small></div></div><div className="tags">{(x.categories||[]).slice(0,3).map(c=><i key={c}>{c}</i>)}</div><div className="job-foot"><b>RADAR {x.score||0}</b><button onClick={onOpen}>VIEW SIGNAL ↗</button></div></motion.article>}
function Detail({x,saved,onSave,onClose}){return <motion.div className="overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><motion.aside className="drawer" initial={{x:"100%"}} animate={{x:0}} exit={{x:"100%"}} transition={{type:"spring",stiffness:280,damping:28}}><button className="close" onClick={onClose}>×</button><div className="kicker red">RADAR SIGNAL / {x.source||"PUBLIC SOURCE"}</div><h2>{x.title}</h2><h3>{x.company}</h3><div className="detail-facts"><span>{x.location||"India"}</span><span>{x.experience||"LEVEL UNKNOWN"}</span><span>{x.salary||x.stipend||"COMPENSATION NOT LISTED"}</span></div><p>{(x.reasons||[]).join(" · ")||"Relevant opportunity detected by RADAR."}</p><div className="score"><b>{x.score||0}</b><span>RADAR<br/>SIGNAL</span></div><div className="drawer-actions"><a href={x.url} target="_blank" rel="noreferrer">OPEN ORIGINAL ↗</a><button onClick={onSave}>{saved?"REMOVE SAVE":"SAVE SIGNAL"}</button></div></motion.aside></motion.div>}
function WebLines(){return <div className="web-bg"><svg viewBox="0 0 1440 900" preserveAspectRatio="none"><path d="M0 140L260 0M0 420L520 0M0 780L920 0M400 900L1440 0M880 900L1440 360M1180 900L1440 640"/><circle cx="620" cy="360" r="300"/><circle cx="620" cy="360" r="210"/><circle cx="620" cy="360" r="120"/></svg></div>}
createRoot(document.getElementById("root")).render(<App/>);
