(function(){
"use strict";
const TRACKER="https://claude.ai/artifact/Y5zL6whvqonXZ7eUuZQD6z";
const $=id=>document.getElementById(id);
const reduced=!!(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches);
function h(tag,attrs,...kids){
  const el=document.createElement(tag);
  if(attrs) for(const k in attrs){ const v=attrs[k]; if(v==null||v===false) continue;
    if(k==="class") el.className=v; else if(k==="text") el.textContent=v; else if(k==="html") el.innerHTML=v;
    else if(k.slice(0,2)==="on") el.addEventListener(k.slice(2),v); else el.setAttribute(k,v===true?"":v); }
  for(const c of kids.flat()){ if(c==null||c===false) continue; el.append(c.nodeType?c:document.createTextNode(String(c))); }
  return el;
}
const IC={
  recall:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="2.5"/><path d="M8 10h8M8 14h5" stroke-linecap="round"/></svg>',
  people:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="9" cy="9" r="3.2"/><path d="M3.5 19c.8-3 3-4.6 5.5-4.6s4.7 1.6 5.5 4.6"/><circle cx="17" cy="8.5" r="2.3"/><path d="M16.3 13.4c2.2.2 3.7 1.5 4.3 3.6"/></svg>',
  spot:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5z"/><circle cx="9" cy="10" r=".7" fill="currentColor"/><circle cx="12" cy="10" r=".7" fill="currentColor"/><circle cx="15" cy="10" r=".7" fill="currentColor"/></svg>',
  mystery:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/></svg>',
  teaser:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="9" cy="9" r="1.2" fill="currentColor"/><circle cx="15" cy="15" r="1.2" fill="currentColor"/><circle cx="15" cy="9" r="1.2" fill="currentColor"/><circle cx="9" cy="15" r="1.2" fill="currentColor"/></svg>',
  flag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M6 21V4M6 4h11l-2.5 4L17 12H6"/></svg>',
  flame:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.6 2.5c.6 3.3 5.4 5.5 5.4 10.6A6 6 0 0 1 12 19a6 6 0 0 1-6-5.9c0-2.4 1.1-4 2.4-5.3.2 1.9 1.1 3 2.3 3.4-.1-3.4.6-6.2 1.9-8.7z"/></svg>'
};
const icon=n=>h("span",{class:"ic",html:IC[n]});
const TM={recall:{label:"Recall",cls:"t-recall",ic:"recall"},scenario:{label:"Scenario",cls:"t-people",ic:"people"},spot:{label:"Spot it",cls:"t-spot",ic:"spot"},mystery:{label:"Mystery",cls:"t-mystery",ic:"mystery"},teaser:{label:"Teaser",cls:"t-teaser",ic:"teaser"}};
const ITEMS_BY_ID={}; ITEMS.forEach(it=>ITEMS_BY_ID[it.id]=it);
const LAW_NOTES={
  4:"Saying less. Silence makes people fill the gap and reveal things; hold back information, not warmth. Reversal: total silence with a senior can look insecure, so say one clear line.",
  12:"Gifts, favours or an early secret used to lower someone's guard, followed by an ask. The test is how they react to a no (sulking or \"after everything I did\" means it was a trade).",
  14:"Friendly, casual questions in relaxed settings that pull out plans, capabilities and weak spots. The tell is one-way flow: they ask a lot and dodge questions back. Counter: the bounce (warm, general answer plus a question back).",
  19:"Know the type before you joke, correct or trust: proud (never correct in public), insecure (seeks reassurance; be clear and kind), suspicious (sees hidden motives; stay neutral), long memory (calm now, remembers exact words; repair slips privately), unbothered (be direct).",
  40:"Free offers carry a hidden price: an obligation, your attention, your data, or a later upsell. Ask who's paying. Paying your own way keeps you free."
};
const PREVIEW_CARDS=[
  {id:"l4-7",law:4,lawName:"Always say less than necessary",order:7,front:"Law 4 holds back ___, not ___.",back:"Information, not warmth. You can be fully friendly and still not hand over plans, marks or feelings on day one.",box:0},
  {id:"l12-6",law:12,lawName:"Selective honesty and generosity",order:6,front:"Law 12 · What's the real test of someone's generosity?",back:"How they handle your no. Same warmth: probably genuine. Sulking or “after everything I did”: the gifts were a down payment.",box:0},
  {id:"l14-8",law:14,lawName:"Pose as a friend, work as a spy",order:8,front:"What is the bounce?",back:"Answer warmly but generally, then return the question: “Still deciding. What's your team picking?”",box:0}
];

/* ---------- dates, random ---------- */
const pad=n=>String(n).padStart(2,"0");
const ymd=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
function today(){ const d=new Date(); if(d.getHours()<5) d.setDate(d.getDate()-1); return ymd(d); }
function addDays(s,n){ const d=new Date(s+"T00:00:00"); d.setDate(d.getDate()+n); return ymd(d); }
function fmtDay(s){ try{ return new Date(s+"T00:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"}); }catch(e){ return s; } }
function clock(){ const d=new Date(); let hr=d.getHours()%12; if(hr===0) hr=12; return hr+":"+pad(d.getMinutes())+(d.getHours()<12?" am":" pm"); }
function isLate(){ const d=new Date(), hr=d.getHours(), m=d.getMinutes(); return (hr===0&&m>=30)||(hr>=1&&hr<5); }
function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function hashStr(s){ let x=0; for(let i=0;i<s.length;i++) x=(x*31+s.charCodeAt(i))>>>0; return x; }
const pickWord=(list,key)=>list[hashStr(key)%list.length];
const capFirst=s=>s.charAt(0).toUpperCase()+s.slice(1);
function lsGet(k){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):null; }catch(e){ return null; } }
function lsSet(k,v){ try{ if(v==null) localStorage.removeItem(k); else localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }

/* ---------- state ---------- */
function defaults(){ return {v:2, ratings:{people:1000,detective:1000}, nAns:{people:0,detective:0}, items:{}, days:{}, rhist:{}, freezes:1, frozen:[], freezeCheck:"", lastEarn:0, freezeNote:"", flags:[], hidden:{}, cases:{}, casesDone:0, decks:0, errors:[], learn:{done:{},last:{},plans:[]}, pzs:{}, pzd:{}}; }
function normalize(p){
  const d=defaults(), o=Object.assign(d,p||{});
  o.ratings=Object.assign({people:1000,detective:1000},(p&&p.ratings)||{});
  o.nAns=Object.assign({people:0,detective:0},(p&&p.nAns)||{});
  for(const k of ["items","days","rhist","hidden","cases","pzs","pzd"]) if(!o[k]||typeof o[k]!=="object"||Array.isArray(o[k])) o[k]={};
  if(!o.learn||typeof o.learn!=="object") o.learn={};
  for(const k of ["done","last"]) if(!o.learn[k]||typeof o.learn[k]!=="object"||Array.isArray(o.learn[k])) o.learn[k]={};
  if(!Array.isArray(o.learn.plans)) o.learn.plans=[];
  for(const k of ["frozen","flags","errors"]) if(!Array.isArray(o[k])) o[k]=[];
  delete o.updatedAt;
  return JSON.parse(JSON.stringify(o));
}
const S={mode:"loading", ready:false, cards:[], gen:[], P:defaults(), cardsLoaded:false, pLoaded:false, view:"play", resting:false};
let db=null, sample=null, dirty=false, saving=false, saveAgain=false, saveT=null;
const ready=()=>S.ready;

/* ---------- saving ---------- */
function prune(P){
  const keep=(obj,n)=>{ const ks=Object.keys(obj).sort(); while(ks.length>n) delete obj[ks.shift()]; };
  keep(P.days,150); keep(P.rhist,120); keep(P.pzd,90);
  if(P.learn.plans.length>60) P.learn.plans=P.learn.plans.slice(-60);
  if(P.frozen.length>60) P.frozen=P.frozen.slice(-60);
  if(P.flags.length>80) P.flags=P.flags.slice(-80);
  if(P.errors.length>10) P.errors=P.errors.slice(-10);
}
function logErr(where,e){ S.P.errors.push({at:new Date().toISOString(),where,code:String((e&&e.code)||(e&&e.message)||e).slice(0,80)}); }
function touch(){ dirty=true; clearTimeout(saveT); saveT=setTimeout(save,1200); }
async function save(){
  if(S.mode!=="live"){ dirty=false; return; }
  if(saving){ saveAgain=true; return; }
  saving=true; saveAgain=false; prune(S.P);
  const body=JSON.parse(JSON.stringify(S.P)); body.updatedAt=new Date().toISOString();
  try{ await db.doc("progress/main").set(body); if(!saveAgain) dirty=false; }
  catch(e){ logErr("save",e); toastOnce("Couldn’t save just now. Retrying."); setTimeout(()=>{ if(dirty) save(); },8000); }
  finally{ saving=false; if(saveAgain){ saveAgain=false; save(); } }
}
let toastT=null, lastToast=0;
function toast(msg){ const t=$("toast"); t.textContent=msg; t.hidden=false; clearTimeout(toastT); toastT=setTimeout(()=>{t.hidden=true;},2600); }
function toastOnce(msg){ if(Date.now()-lastToast<10000) return; lastToast=Date.now(); toast(msg); }
function setStatus(msg){ $("status").textContent=msg||""; $("status").hidden=!msg; }

/* ---------- ratings, schedule, streak ---------- */
function rate(skill,D,score){
  const P=S.P, R=P.ratings[skill], E=1/(1+Math.pow(10,(D-R)/400)), n=P.nAns[skill]||0, K=n<20?40:24;
  P.ratings[skill]=Math.max(400,Math.min(2400,Math.round(R+K*(score-E)))); P.nAns[skill]=n+1;
  P.rhist[today()]={p:P.ratings.people,d:P.ratings.detective};
  return P.ratings[skill]-R;
}
const IT_INT=[0,21,45,90,180], CARD_INT=[0,1,3,7,14,30,60];
function schedule(id,t,ok){
  const st=S.P.items[id]||{n:0,c:0,b:0}; st.n++; if(ok) st.c++; st.last=today();
  if(t==="mystery"){ st.b=99; st.due="9999-12-31"; }
  else if(ok){ st.b=Math.min((st.b||0)+1,4); st.due=addDays(today(),IT_INT[st.b]); }
  else { st.b=0; st.due=addDays(today(),t==="teaser"?3:2); }
  S.P.items[id]=st;
}
function dayRec(){ const t=today(); return S.P.days[t]||(S.P.days[t]={decks:0,answered:0,correct:0,cards:0,cases:0,lessons:0,puzzles:0}); }
function played(x){ return !!(x&&((x.decks||0)>0||(x.cases||0)>0||(x.lessons||0)>0||(x.puzzles||0)>0||x.legacy)); }
function active(d){ return played(S.P.days[d]) || S.P.frozen.includes(d); }
function streak(){ let d=today(); if(!active(d)) d=addDays(d,-1); let n=0; while(active(d)&&n<2000){ n++; d=addDays(d,-1); } return n; }
function freezeCheck(){
  const P=S.P, t=today(); if(P.freezeCheck===t) return; P.freezeCheck=t; P.freezeNote="";
  if(!active(addDays(t,-1))){
    const gap=[]; let d=addDays(t,-1);
    while(!active(d)&&gap.length<3){ gap.push(d); d=addDays(d,-1); }
    if(active(d)&&gap.length>0&&gap.length<=P.freezes){ P.frozen.push(...gap); P.freezes-=gap.length; P.freezeNote="A streak freeze covered "+(gap.length===1?"yesterday":gap.length+" missed days")+", so your streak is safe."; }
  }
  touch();
}
function learnedLaws(){ const s=new Set(S.cards.map(c=>c.law).filter(l=>LAWS[l])); if(!s.size) Object.keys(LAWS).forEach(k=>s.add(+k)); return [...s].sort((a,b)=>a-b); }
const pool=()=>ITEMS.concat(S.gen);
const findItem=id=>ITEMS_BY_ID[id]||S.gen.find(g=>g.id===id)||null;
const skillOf=t=>(t==="scenario"||t==="spot")?"people":"detective";

/* ---------- decks ---------- */
let D=null;
function buildEntry(it){
  const e={k:"item",id:it.id,t:it.t};
  if(it.t==="spot"){
    let correct, others;
    if(it.kind==="type"){ correct=it.type; others=TYPES.filter(x=>x!==it.type&&!(it.avoid||[]).includes(x)); }
    else { correct=TACTICS[it.law]; const laws=learnedLaws().filter(l=>TACTICS[l]&&l!==it.law); others=(laws.length>=3?laws:Object.keys(TACTICS).map(Number).filter(l=>l!==it.law)).map(l=>TACTICS[l]); }
    e.opts=shuffle([correct].concat(shuffle(others).slice(0,3))); e.a=e.opts.indexOf(correct);
  } else if(it.t==="scenario"){ const ord=shuffle(it.opts.map((_,i)=>i)); e.opts=ord.map(i=>it.opts[i]); e.a=ord.indexOf(it.a); }
  else { e.opts=it.opts.slice(); e.a=it.a; }
  return e;
}
function buildDeck(){
  const t=today(), P=S.P, laws=learnedLaws(), entries=[];
  const due=S.cards.filter(c=>!P.hidden["card:"+c.id]&&(c.due||"")<=t).sort((a,b)=>(a.due||"")<(b.due||"")?-1:(a.due||"")>(b.due||"")?1:((a.law-b.law)||((a.order||0)-(b.order||0))));
  const nRecall=Math.min(due.length>12?4:3,due.length);
  due.slice(0,nRecall).forEach(c=>entries.push({k:"card",id:c.id,t:"recall"}));
  const items=pool().filter(it=>!P.hidden[it.id]&&(!it.law||laws.includes(it.law)));
  const used=new Set();
  const pick=(type,count)=>{
    const R=P.ratings[skillOf(type)], cands=items.filter(it=>it.t===type&&!used.has(it.id));
    const unseen=cands.filter(it=>!P.items[it.id]).map(it=>({it,s:Math.abs((it.d||1000)-R)+Math.random()*160})).sort((a,b)=>a.s-b.s).map(x=>x.it);
    const again=cands.filter(it=>{ const st=P.items[it.id]; return st&&st.b<90&&(st.due||"")<=t; }).sort((a,b)=>P.items[a.id].due<P.items[b.id].due?-1:1);
    const got=unseen.concat(again).slice(0,count); got.forEach(it=>used.add(it.id)); return got;
  };
  const want={scenario:2,spot:2,mystery:1,teaser:nRecall>3?1:2}, chosen=[];
  let short=Math.max(0,3-nRecall);
  for(const type in want){ const got=pick(type,want[type]); chosen.push(...got); short+=want[type]-got.length; }
  for(let g=0; short>0&&g<12; g++){ let added=false; for(const type of ["spot","scenario","teaser","mystery"]){ if(short<=0) break; const more=pick(type,1); if(more.length){ chosen.push(more[0]); short--; added=true; } } if(!added) break; }
  if(short>0){ const seen=items.filter(it=>!used.has(it.id)&&it.t!=="mystery"&&P.items[it.id]).sort((a,b)=>(P.items[a.id].last||"")<(P.items[b.id].last||"")?-1:1).slice(0,short); seen.forEach(it=>{ used.add(it.id); chosen.push(it); }); }
  chosen.forEach(it=>entries.push(buildEntry(it)));
  const rest=shuffle(entries), out=[];
  let fi=rest.findIndex(e=>e.t==="recall"); if(fi<0) fi=rest.findIndex(e=>e.t==="teaser");
  if(fi>=0) out.push(rest.splice(fi,1)[0]);
  while(rest.length){ const prev=out.length?out[out.length-1].t:null; let i=rest.findIndex(e=>e.t!==prev&&!(out.length<2&&e.t==="mystery")); if(i<0) i=0; out.push(rest.splice(i,1)[0]); }
  return out;
}
const cur=()=>D.entries[D.idx];
function startCard(){ const e=cur(); if(!e) return; D.phase=e.t==="recall"?"front":"q"; D.hint=false; D.picked=null; D.flagOpen=false; D.anim=true; }
function newDeck(){ S.resting=false; D={date:today(),entries:buildDeck(),idx:0,results:[],combo:0,best:0,deltas:{people:0,detective:0},reasked:{},completed:false,earned:false}; if(D.entries.length) startCard(); saveDeckLocal(); }
function saveDeckLocal(){ lsSet("pp2.deck",D&&!D.completed?D:null); }
function restoreDeck(){
  const d=lsGet("pp2.deck"); if(!d||d.date!==today()||!Array.isArray(d.entries)||d.completed) return false;
  if(d.results.length>d.idx) d.idx=d.results.length;
  const valid=e=>e.k==="card"?S.cards.some(c=>c.id===e.id):!!findItem(e.id);
  d.entries=d.entries.slice(0,d.idx).concat(d.entries.slice(d.idx).filter(valid));
  if(d.idx>=d.entries.length) return false;
  D=d; startCard(); return true;
}
function answer(i){
  if(!D||D.phase!=="q") return; const e=cur(), it=findItem(e.id); if(!it) return;
  const ok=i===e.a; D.picked=i; D.phase="fb";
  const skill=skillOf(e.t), score=ok?(D.hint?0.6:1):0;
  e.delta=rate(skill,it.d||1000,score); e.skill=skill; D.deltas[skill]+=e.delta;
  schedule(it.id,e.t,ok);
  const r=dayRec(); r.answered++; if(ok) r.correct++;
  D.results.push({id:e.id,t:e.t,ok,picked:i,hint:D.hint});
  D.combo=ok?D.combo+1:0; D.best=Math.max(D.best,D.combo);
  touch(); saveDeckLocal(); renderPlay(true); renderChips();
}
function reveal(){ if(D&&D.phase==="front"){ D.phase="back"; renderPlay(); } }
async function grade(ok){
  if(!D||D.phase!=="back") return; const e=cur(); const c=S.cards.find(x=>x.id===e.id);
  D.results.push({id:e.id,t:"recall",ok}); D.combo=ok?D.combo+1:0; D.best=Math.max(D.best,D.combo);
  if(!ok&&!D.reasked[e.id]&&D.entries.length<13){ D.reasked[e.id]=1; D.entries.push({k:"card",id:e.id,t:"recall",again:true}); }
  next();
  if(c){ let bx=c.box||0; bx=ok?Math.min(bx+1,6):0; const patch={box:bx,due:ok?addDays(today(),CARD_INT[bx]):today(),reviews:(c.reviews||0)+1,last:today()}; Object.assign(c,patch); dayRec().cards++; touch();
    if(S.mode==="live"){ try{ await db.doc("cards/"+c.id).update(patch); }catch(err){ logErr("card",err); toastOnce("That card didn’t save. It’ll come up again."); } } }
}
function next(){ if(!D) return; D.idx++; if(D.idx>=D.entries.length) completeDeck(); else startCard(); saveDeckLocal(); renderPlay(); window.scrollTo({top:0,behavior:"auto"}); }
function completeDeck(){
  if(!D||D.completed) return; D.completed=true; dayRec().decks++; S.P.decks=(S.P.decks||0)+1;
  const s=streak(); if(s>0&&s%7===0&&S.P.lastEarn!==s&&S.P.freezes<2){ S.P.freezes++; S.P.lastEarn=s; D.earned=true; }
  touch(); lsSet("pp2.deck",null); renderChips();
}
function flagItem(key,type){
  S.P.hidden[key]=true; S.P.flags.push({id:key,t:type,at:new Date().toISOString()}); touch(); toast("Hidden. Claude will see your flag.");
  if(D&&(D.phase==="q"||D.phase==="front")){ D.entries.splice(D.idx,1); if(D.idx>=D.entries.length) completeDeck(); else startCard(); saveDeckLocal(); }
  else if(D) D.flagOpen=false;
  renderPlay();
}

/* ---------- play view ---------- */
function btn(label,fn,cls,disabled){ return h("button",{class:"btn"+(cls?" "+cls:""),type:"button",disabled:!!disabled,onclick:fn},label); }
function setActions(list){ const bar=$("actionbar"); if(!list.length){ bar.hidden=true; $("actions").replaceChildren(); return; } $("actions").replaceChildren(...list); bar.hidden=false; }
function renderActions(){
  if(S.view!=="play"||!D||S.resting||D.idx>=D.entries.length) return setActions([]);
  const e=cur();
  if(e.t==="recall") return setActions(D.phase==="front"?[btn("Reveal answer",reveal)]:[btn("Missed it",()=>grade(false),"miss"),btn("Got it",()=>grade(true),"got")]);
  if(D.phase==="fb") return setActions([btn(D.idx===D.entries.length-1?"Finish deck":"Next",next)]);
  setActions([]);
}
function renderSeg(){
  const seg=$("seg");
  if(S.view==="learn"&&LS&&LS.lesson){ seg.hidden=false; seg.replaceChildren(...LSTEPS.map((x,i)=>h("i",{class:i<LS.step?"ok":i===LS.step?"now":""}))); return; }
  if(S.view!=="play"||!D||S.resting||!D.entries.length){ seg.replaceChildren(); seg.hidden=true; return; }
  seg.hidden=false;
  seg.replaceChildren(...D.entries.map((e,i)=>{ const r=D.results[i]; return h("i",{class:r?(r.ok?"ok":"no"):(i===D.idx&&!D.completed?"now":"")}); }));
}
function renderChips(){
  const c=$("chips"); const s=ready()?streak():0;
  const kids=[h("span",{class:"chip"+(s>0?" hot":""),title:"Streak"},icon("flame"),String(s))];
  if(S.view==="play"&&D&&!D.completed&&D.combo>=3) kids.unshift(h("span",{class:"combo",text:D.combo+" in a row"}));
  c.replaceChildren(...kids);
  const dot=$("pzDot"); if(dot) dot.hidden=!(ready()&&(!(S.P.cases["daily:"+today()]||{}).result||!(S.P.pzd[today()]||{}).result));
  const ld=$("learnDot"); if(ld) ld.hidden=!(ready()&&!isLate()&&COURSES.some(c=>lessonAvailable(c)));
}
function head(type,law,key,tag){
  const m=TM[type];
  return h("div",{class:"card-head"},h("span",{class:"tpill"},icon(m.ic),m.label),law?h("span",{class:"lawtag",text:"Law "+law}):tag?h("span",{class:"lawtag",text:tag}):null,
    h("button",{class:"flag",type:"button","aria-label":"Flag this card",title:"Flag this card",onclick:()=>{D.flagOpen=!D.flagOpen; renderPlay();}},icon("flag")));
}
function flagBox(key,type){ return h("div",{class:"flagbox"},h("span",{text:"Confusing or wrong? Hide it and tell Claude."}),h("button",{type:"button",onclick:()=>flagItem(key,type),text:"Hide it"}),h("button",{type:"button",onclick:()=>{D.flagOpen=false;renderPlay();},text:"Cancel"})); }
function chat(it,showTell){
  const box=h("div",{class:"msgs"});
  it.msgs.forEach((m,i)=>{ const w=m[0], x=m[1];
    if(w==="d"){ box.append(h("span",{class:"day",text:x})); return; }
    const tell=showTell&&i===it.tell;
    box.append(h("div",{class:"bub "+(w==="m"?"m":"t")+(tell?" tell":"")},x));
    if(tell) box.append(h("span",{class:"telltag "+(w==="m"?"m":"t"),text:"The tell"}));
  });
  return h("div",{class:"phone"},h("div",{class:"phone-head"},h("span",{class:"avatar",text:(it.who||"?").trim().charAt(0).toUpperCase()}),h("div",null,h("b",{text:it.who}),h("small",{text:it.sub||""}))),box);
}
function recallCard(e,c){
  const card=h("article",{class:"card t-recall"},head("recall",c.law,"card:"+c.id,c.track==="gita"?"Gita":c.track==="charaka"?"Charaka":null));
  if(D.flagOpen) card.append(flagBox("card:"+c.id,"recall"));
  card.append(h("p",{class:"eyebrow",text:c.lawName||(LAWS[c.law]||{}).name||""}),h("p",{class:"prompt",text:c.front}));
  if(D.phase==="front") card.append(h("p",{class:"think",text:e.again?"Second try: you missed this one earlier. Say it in your head, then reveal.":"Say your answer in your head, then reveal."}));
  else card.append(h("div",{class:"answer",text:c.back}),h("p",{class:"think",text:"Be honest: did you have it before you looked?"}));
  return card;
}
function feedback(e,it){
  const res=D.results[D.idx], ok=!!(res&&res.ok);
  const fb=h("div",{class:"fb "+(ok?"ok":"no")},h("span",{class:"verdict",text:ok?pickWord(["Right.","Exactly.","Sharp.","Nailed it.","Correct."],e.id):pickWord(["Not quite.","Close, but no.","Not this time."],e.id)}));
  if(!ok) fb.append(h("p",null,h("b",{text:"Answer: "}),e.opts[e.a]));
  fb.append(h("p",{text:it.why}));
  const meta=h("div",{class:"meta"});
  if(it.law&&LAWS[it.law]) meta.append(h("span",{text:"Law "+it.law+" · "+LAWS[it.law].short}));
  if(e.delta!=null) meta.append(h("span",{text:(e.skill==="people"?"People reader ":"Detective ")+(e.delta>=0?"+":"")+e.delta}));
  if(res&&res.hint) meta.append(h("span",{text:"hint used"}));
  fb.append(meta);
  return fb;
}
function itemCard(e,it){
  const card=h("article",{class:"card "+TM[e.t].cls},head(e.t,it.law,it.id));
  if(D.flagOpen) card.append(flagBox(it.id,e.t));
  if(e.t==="scenario") card.append(h("p",{class:"scene",text:it.scene||""}),h("p",{class:"text",text:it.text}),h("p",{class:"q",text:it.q||"Best move?"}));
  else if(e.t==="spot") card.append(chat(it,D.phase==="fb"),h("p",{class:"q",text:it.kind==="type"?"What type is "+it.who+"?":"What move is this?"}));
  else if(e.t==="mystery") card.append(h("h2",{text:it.title}),h("p",{class:"text",text:it.text}),h("ol",{class:"clues"},(it.clues||[]).map(x=>h("li",null,h("span",{text:x})))),h("p",{class:"q",text:it.q}));
  else card.append(h("p",{class:"text big",text:it.text}));
  if((e.t==="mystery"||e.t==="teaser")&&it.hint){
    if(D.hint) card.append(h("p",{class:"hint"},h("b",{text:"Hint: "}),it.hint));
    else if(D.phase==="q") card.append(h("button",{class:"hintbtn",type:"button",onclick:()=>{D.hint=true; renderPlay();},text:"Need a hint?"}));
  }
  const two=e.t==="teaser"&&e.opts.every(o=>o.length<=14);
  const opts=h("div",{class:"opts"+(two?" grid2":"")});
  e.opts.forEach((o,i)=>{
    let cls="opt"; if(D.phase==="fb"){ if(i===e.a) cls+=" right"; else if(i===D.picked) cls+=" wrong"; else cls+=" dim"; }
    opts.append(h("button",{class:cls,type:"button",disabled:D.phase==="fb","aria-label":"Option "+"ABCD"[i]+": "+o,onclick:()=>answer(i)},h("span",{class:"key",text:"ABCD"[i]}),h("span",{text:o})));
  });
  card.append(opts);
  if(D.phase==="fb") card.append(feedback(e,it));
  return card;
}
function renderPlay(toFeedback){
  const v=$("v-play");
  if(S.view!=="play") return;
  if(!ready()){ v.replaceChildren(h("div",{class:"skel","aria-label":"Loading"})); setActions([]); renderSeg(); return; }
  if(S.resting){ renderRest(); return; }
  if(!D){ if(!restoreDeck()) newDeck(); }
  if(!D.entries.length){ renderEmpty(); return; }
  if(D.idx>=D.entries.length){ renderEnd(); return; }
  const e=cur(); let node;
  if(e.k==="card"){ const c=S.cards.find(x=>x.id===e.id); if(!c){ D.entries.splice(D.idx,1); return renderPlay(); } node=recallCard(e,c); }
  else { const it=findItem(e.id); if(!it){ D.entries.splice(D.idx,1); return renderPlay(); } node=itemCard(e,it); }
  if(D.anim&&!reduced){ node.classList.add("enter"); } D.anim=false;
  v.replaceChildren(node); renderSeg(); renderActions(); renderChips();
  if(toFeedback){ const fb=v.querySelector(".fb"); if(fb) setTimeout(()=>fb.scrollIntoView({behavior:reduced?"auto":"smooth",block:"nearest"}),40); }
}
function ring(right,total){
  const r=52, c=2*Math.PI*r, f=total?right/total:0, NS="http://www.w3.org/2000/svg";
  const svg=document.createElementNS(NS,"svg"); svg.setAttribute("viewBox","0 0 132 132"); svg.setAttribute("aria-hidden","true");
  const mk=(stroke,dash)=>{ const ci=document.createElementNS(NS,"circle"); ci.setAttribute("cx","66"); ci.setAttribute("cy","66"); ci.setAttribute("r",String(r)); ci.setAttribute("fill","none"); ci.setAttribute("stroke",stroke); ci.setAttribute("stroke-width","11"); ci.setAttribute("stroke-linecap","round"); if(dash!=null){ ci.setAttribute("stroke-dasharray",c.toFixed(1)); ci.setAttribute("stroke-dashoffset",(c*(1-dash)).toFixed(1)); } return ci; };
  svg.append(mk("var(--sunk)"),mk("var(--good)",f));
  return h("div",{class:"ring"},svg,h("div",{class:"num"},h("div",null,right+"/"+total,h("small",{text:"right"}))));
}
function rateTile(label,value,delta){ const cls=delta>0?"up":delta<0?"down":"flat"; return h("div",{class:"rate"},h("span",{class:"eyebrow",text:label}),h("b",{text:String(value)}),h("span",{class:"delta "+cls,text:(delta>0?"+":"")+delta+" this deck"})); }
function missReview(misses){
  const box=h("div",{class:"misses"});
  misses.forEach(({e})=>{
    if(e.k==="card"){ const c=S.cards.find(x=>x.id===e.id); if(c) box.append(h("div",{class:"miss"},h("b",{text:c.front}),h("span",{text:c.back}))); return; }
    const it=findItem(e.id); if(!it) return;
    const qtext=it.t==="spot"?(it.who+": "+(it.msgs[it.tell]||["",""])[1]):it.t==="mystery"?it.title:(it.text.length>120?it.text.slice(0,117)+"…":it.text);
    box.append(h("div",{class:"miss"},h("b",{text:qtext}),h("span",null,"Answer: ",e.opts[e.a]),h("span",{class:"muted",text:it.why})));
  });
  return h("details",{class:"review"},h("summary",{text:"Review your misses ("+misses.length+")"}),box);
}
function startNewDeck(){ D=null; newDeck(); renderPlay(); window.scrollTo(0,0); }
function caseLabel(){ return (S.P.cases["daily:"+today()]||{}).result?"Play an extra case":"Today’s case"; }
function renderEnd(){
  completeDeck();
  const total=D.results.length, right=D.results.filter(r=>r.ok).length, R=S.P.ratings, s=streak(), late=isLate();
  const parts=[h("div",{class:"end-top"},ring(right,total),h("h2",{text:right===total?"Perfect deck.":right>=total*0.7?"Deck done.":"Deck done. The misses are where the learning is."}),h("p",{class:"muted small",text:"Best run: "+D.best+" in a row"}))];
  parts.push(h("div",{class:"ratings"},rateTile("People reader",R.people,D.deltas.people),rateTile("Detective",R.detective,D.deltas.detective)));
  parts.push(h("div",{class:"note"},h("b",{text:"Day "+s+" streak. "}),D.earned?"You earned a streak freeze. ":"",S.P.freezes===1?"1 freeze saved.":S.P.freezes+" freezes saved."));
  if(late) parts.push(h("div",{class:"note"},h("b",{text:"It’s "+clock()+". "}),"Lights out by 12:30 is part of the plan. Your next deck will be here tomorrow."));
  parts.push(h("div",{style:"display:grid;gap:8px"},
    late?btn("Done for tonight",doneForNow):btn("Next deck",startNewDeck),
    btn(caseLabel(),openCase,"ghost"),
    late?btn("One more deck",startNewDeck,"ghost"):btn("Done for now",doneForNow,"ghost")));
  const misses=D.results.map((r,i)=>({r,e:D.entries[i]})).filter(x=>x.r&&!x.r.ok&&x.e);
  if(misses.length) parts.push(missReview(misses));
  if(unseenCount()<6) parts.push(genControls());
  $("v-play").replaceChildren(h("div",{class:"end"+(reduced?"":" enter")},...parts)); setActions([]); renderSeg(); renderChips();
}
function doneForNow(){ S.resting=true; D=null; renderPlay(); window.scrollTo(0,0); }
function renderRest(){
  const s=streak();
  $("v-play").replaceChildren(h("div",{class:"end"},h("div",{class:"end-top"},h("div",{class:"big",text:String(s)}),h("p",{class:"muted",text:s===1?"day streak":"day streak"}),h("h2",{text:isLate()?"Good call. Sleep is when today’s cards get stored.":"Nice work. See you next time."})),
    h("div",{style:"display:grid;gap:8px"},btn("Start a deck",startNewDeck),btn(caseLabel(),openCase,"ghost"))));
  setActions([]); renderSeg(); renderChips();
}
function renderEmpty(){
  $("v-play").replaceChildren(h("div",{class:"end"},h("div",{class:"end-top"},h("h2",{text:"You’ve played every card for now."}),h("p",{class:"muted",text:"Cards you missed come back in a couple of days. Meanwhile, try a case or make new challenges."})),
    btn("Play a case",openCase),genControls()));
  setActions([]); renderSeg();
}

/* ---------- cases ---------- */
let CS=null, giveUpArmed=false;
function dailyKey(){ return "daily:"+today(); }
function freshCaseState(n){ const mk=()=>Array.from({length:n},()=>new Array(n).fill(0)); return {A:mk(),B:mk(),C:mk(),struck:[],pick:{s:null,i:null,p:null},tries:0,hints:0,start:Date.now(),done:false,solved:false,gmsg:"",amsg:"",err:null}; }
function loadCase(key){
  let C;
  if(key.indexOf("daily:")===0){
    if(!S.P.cases[key]){ S.P.cases[key]={diff:(S.P.casesDone||0)<3?"easy":CaseGen.dailyDiff(today()),started:new Date().toISOString()}; touch(); }
    C=CaseGen.daily(key.slice(6),S.P.cases[key].diff);
  } else { const parts=key.split(":"); C=CaseGen.generate({seed:+parts[1],diff:parts[2]}); }
  if(!C){ toast("Couldn’t build that case. Here’s another."); return loadCase("x:"+((Math.random()*4294967295)>>>0)+":easy"); }
  let st=lsGet("pp2.case."+key);
  if(!st||!st.A||st.A.length!==C.n) st=freshCaseState(C.n);
  const res=S.P.cases[key];
  if(res&&res.result&&!st.done){ st.done=true; st.solved=res.result==="solved"; }
  if(st.done){ for(const g of ["A","B","C"]) st[g]=solM(C,g); }
  CS={key,C,st}; giveUpArmed=false;
}
function saveCaseLocal(){ if(CS) lsSet("pp2.case."+CS.key,CS.st); }
function solM(C,g){ const n=C.n, sp=C.sol.sp, si=C.sol.si, M=[]; for(let r=0;r<n;r++){ M.push([]); for(let c=0;c<n;c++){ const yes=g==="A"?sp[r]===c:g==="B"?si[r]===c:sp[si.indexOf(r)]===c; M[r].push(yes?1:-1); } } return M; }
function recomputeAuto(){
  const st=CS.st, n=CS.C.n;
  for(const g of ["A","B","C"]){ const M=st[g];
    for(let r=0;r<n;r++) for(let c=0;c<n;c++) if(M[r][c]===-2) M[r][c]=0;
    for(let r=0;r<n;r++) for(let c=0;c<n;c++) if(M[r][c]===1) for(let k=0;k<n;k++){ if(k!==c&&M[r][k]===0) M[r][k]=-2; if(k!==r&&M[k][c]===0) M[k][c]=-2; }
  }
}
function tapCell(g,r,c){ const st=CS.st; if(st.done) return; const v=st[g][r][c]; st[g][r][c]=v===0?-1:(v===-1||v===-2)?1:0; recomputeAuto(); st.err=null; st.gmsg=""; saveCaseLocal(); renderCases(); const b=document.querySelector('[data-cell="'+g+r+"-"+c+'"]'); if(b) b.focus({preventScroll:true}); }
function toggleStrike(ix){ const st=CS.st; const i=st.struck.indexOf(ix); if(i>=0) st.struck.splice(i,1); else st.struck.push(ix); saveCaseLocal(); renderCases(); }
function checkGrid(){
  const st=CS.st, C=CS.C, n=C.n, err={}; let wrong=0, marked=0;
  for(const g of ["A","B","C"]){ const sol=solM(C,g); for(let r=0;r<n;r++) for(let c=0;c<n;c++){ const v=st[g][r][c]; if(v===0) continue; marked++; if((v===1)!==(sol[r][c]===1)){ err[g+r+"-"+c]=1; wrong++; } } }
  if(marked) st.hints++;
  st.err=err; st.gmsg=marked===0?"Mark some boxes first, then check.":wrong===0?"Every mark so far is right. Keep going.":(wrong===1?"1 mark is wrong":wrong+" marks are wrong")+", outlined in red. (Counts as a hint.)";
  saveCaseLocal(); renderCases();
}
function clearGrid(){ const n=CS.C.n, f=freshCaseState(n); Object.assign(CS.st,{A:f.A,B:f.B,C:f.C,err:null,gmsg:"Grid cleared."}); saveCaseLocal(); renderCases(); }
function grid(g,title,rows,cols){
  const st=CS.st, n=CS.C.n, M=st[g];
  const lg=h("div",{class:"lg",style:"grid-template-columns:minmax(78px,1.25fr) repeat("+n+",minmax(0,1fr))"},h("span"));
  cols.forEach(c=>lg.append(h("span",{class:"ch",text:c})));
  rows.forEach((r,ri)=>{
    lg.append(h("span",{class:"rh",text:r}));
    const yesInRow=M[ri].filter(v=>v===1).length;
    cols.forEach((c,ci)=>{
      const v=M[ri][ci], err=st.err&&st.err[g+ri+"-"+ci];
      const yesInCol=M.map(row=>row[ci]).filter(x=>x===1).length;
      const clash=v===1&&(yesInRow>1||yesInCol>1);
      const cls="cell"+(v===1?" v":v===-1?" x":v===-2?" ax":"")+(err?" err":"")+(clash?" clash":"");
      lg.append(h("button",{class:cls,type:"button","data-cell":g+ri+"-"+ci,"aria-label":r+", "+c+": "+(v===1?"yes":v<0?"no":"blank"),disabled:st.done,onclick:()=>tapCell(g,ri,ci)},v===1?"✓":v<0?"✗":""));
    });
  });
  return h("div",{class:"gridwrap"},h("h3",{text:title}),lg);
}
function accusePanel(){
  const C=CS.C, st=CS.st;
  const row=(label,list,key)=>h("div",{class:"row"},h("span",{text:label}),h("div",{class:"choices"},list.map((t,ix)=>h("button",{class:"choice",type:"button","aria-pressed":String(st.pick[key]===ix),onclick:()=>{ st.pick[key]=ix; saveCaseLocal(); renderCases(); }},t))));
  const ok=st.pick.s!=null&&st.pick.i!=null&&st.pick.p!=null;
  const box=h("div",{class:"cbox accuse"},h("h3",{text:"Name the culprit"}),row("Who",C.S.map(s=>s.n),"s"),row(C.itemQ,C.I.map(i=>i.n),"i"),row("Where",C.P.map(p=>p.s),"p"),btn(ok?"Accuse":"Pick one of each",accuse,"",!ok));
  if(st.tries>0&&st.amsg) box.append(h("p",{class:"small",text:st.amsg}));
  box.append(h("button",{class:"hintbtn",type:"button",onclick:()=>{ if(giveUpArmed){ finishCase(false); } else { giveUpArmed=true; renderCases(); } },text:giveUpArmed?"Tap again to see the solution":"Show the solution"}));
  return box;
}
function accuse(){
  const C=CS.C, st=CS.st, cu=C.culprit, want={s:cu,i:C.sol.si[cu],p:C.sol.sp[cu]};
  const wrongN=["s","i","p"].filter(k=>st.pick[k]!==want[k]).length;
  if(wrongN===0) return finishCase(true);
  st.tries++;
  if(st.tries>=2) return finishCase(false);
  st.amsg="Not quite: "+(wrongN===1?"1 of your 3 picks is wrong.":wrongN+" of your 3 picks are wrong.")+" One more try. Re-check the key clue against your grid.";
  saveCaseLocal(); renderCases(); toast("Not quite. One more try.");
}
function finishCase(solved){
  const C=CS.C, st=CS.st, key=CS.key;
  st.done=true; st.solved=solved; st.secs=Math.round((Date.now()-st.start)/1000);
  const score=solved?((st.tries===0&&st.hints===0)?1:0.7):0;
  st.delta=rate("detective",C.D,score);
  S.P.cases[key]=Object.assign(S.P.cases[key]||{},{result:solved?"solved":"revealed",diff:C.diff,tries:st.tries,hints:st.hints,secs:st.secs,at:new Date().toISOString()});
  if(solved) S.P.casesDone=(S.P.casesDone||0)+1;
  dayRec().cases++;
  for(const g of ["A","B","C"]) st[g]=solM(C,g);
  st.err=null; st.gmsg=""; touch(); saveCaseLocal(); renderCases(); renderChips(); window.scrollTo({top:document.body.scrollHeight,behavior:reduced?"auto":"smooth"});
}
function caseResult(){
  const C=CS.C, st=CS.st, cu=C.culprit, P_=C.P[C.sol.sp[cu]], I_=C.I[C.sol.si[cu]];
  const mins=Math.floor((st.secs||0)/60), secs=(st.secs||0)%60;
  const box=h("div",{class:"cbox"},h("h2",{text:st.solved?"Case closed.":"Case unsolved."}),
    h("p",{class:"text"},h("b",{text:C.S[cu].n}),", with the "+I_.n+", "+P_.p+" "+P_.n+"."),
    h("div",{class:"fb "+(st.solved?"ok":"no")},h("div",{class:"meta"},h("span",{text:"Time "+mins+":"+pad(secs)}),h("span",{text:st.hints?(st.hints+" grid "+(st.hints===1?"check":"checks")):"no hints"}),h("span",{text:st.tries?"2nd try":"1st try"}),st.delta!=null?h("span",{text:"Detective "+(st.delta>=0?"+":"")+st.delta}):null)));
  const tb=h("table",{class:"soltable"},h("thead",null,h("tr",null,h("th",{text:"Suspect"}),h("th",{text:"Where"}),h("th",{text:C.itemQ}))));
  const body=h("tbody"); C.S.forEach((s,i)=>body.append(h("tr",{class:i===cu?"culprit":""},h("td",{text:s.n}),h("td",{text:C.P[C.sol.sp[i]].s}),h("td",{text:capFirst(C.I[C.sol.si[i]].n)}))));
  tb.append(body); box.append(tb);
  const finalLine=C.killer.k==="place" ? "Key clue: "+C.killerText+" "+C.S[cu].n+" was "+P_.p+" "+P_.n+", so it was "+C.S[cu].n+", with the "+I_.n+"." : "Key clue: "+C.killerText+" "+C.S[cu].n+" had the "+I_.n+", so it was "+C.S[cu].n+", "+P_.p+" "+P_.n+".";
  const det=h("details",{class:"howto"},h("summary",{text:"How to solve it, step by step"}),h("ol",{class:"steps"},C.steps.map(t=>h("li",{text:t})),h("li",null,h("b",{text:finalLine}))));
  if(!st.solved) det.open=true;
  box.append(det, h("div",{style:"display:grid;gap:8px"},btn("Next case",nextExtra),btn("Back to puzzles",pzHub,"ghost")));
  return box;
}
function nextExtra(){
  const R=S.P.ratings.detective, diff=(S.P.casesDone||0)<3?"easy":R<1050?"easy":R<1250?"medium":"hard";
  const key="x:"+((Math.random()*4294967295)>>>0)+":"+diff; lsSet("pp2.extra",key); loadCase(key); renderCases(); window.scrollTo(0,0);
}
function renderCases(){
  const v=$("v-puzzles"); if(S.view!=="puzzles"||PZS.sub!=="case") return;
  if(!ready()){ v.replaceChildren(h("div",{class:"skel"})); return; }
  if(!CS){ const dk=dailyKey(); const ex=lsGet("pp2.extra"); if((S.P.cases[dk]||{}).result&&ex&&!(S.P.cases[ex]||{}).result) loadCase(ex); else loadCase(dk); }
  const C=CS.C, st=CS.st, isDaily=CS.key.indexOf("daily:")===0;
  const top=h("div",{class:"cbox"},
    h("div",{class:"case-meta"},h("span",{class:"eyebrow",text:isDaily?"Case of the day · "+fmtDay(today()):"Extra case"}),h("span",{class:"pill "+C.diff,text:CaseGen.DIFF[C.diff].label}),st.done&&st.solved?h("span",{class:"pill done",text:"Solved"}):null),
    h("h2",{text:C.title}),h("p",{class:"text",text:C.setup}),
    h("div",{class:"suspects"},C.S.map(s=>h("div",{class:"sus"},h("span",{class:"avatar",text:s.n.charAt(0)}),h("div",null,h("b",{text:s.n}),h("small",{text:s.role}))))),
    h("div",{class:"inv"},h("p",null,h("span",{text:"Objects: "}),C.I.map(i=>i.n).join(", ")),h("p",null,h("span",{text:"Places: "}),C.P.map(p=>p.n).join(", "))));
  const how=h("details",{class:"howto"},h("summary",{text:"How to play"}),
    h("p",{text:"Each suspect was in exactly one place and had exactly one object. No two suspects share a place or an object."}),
    h("p",{text:"Tap a box once for ✗ (no), twice for ✓ (yes), a third time to clear. A ✓ greys out the rest of its row and column for you."}),
    h("p",{text:"Fill the grids from the clues. Then the key clue tells you which suspect did it."}));
  if((S.P.casesDone||0)<3&&!st.done) how.open=true;
  top.append(how);
  const ol=h("ol",{class:"cluelist"});
  C.clues.forEach((c,ix)=>ol.append(h("li",{class:st.struck.includes(ix)?"struck":""},h("button",{type:"button",onclick:()=>toggleStrike(ix),"aria-pressed":String(st.struck.includes(ix))},h("span",{text:c.text})))));
  const clues=h("div",{class:"cbox"},h("h3",{text:"Clues"}),h("p",{class:"small muted",text:"Tap a clue to cross it off once you’ve used it."}),ol,h("div",{class:"key-clue"},h("b",{text:"Key clue"}),C.killerText));
  const grids=h("div",{class:"cbox"});
  grids.append(grid("A","Who was where?",C.S.map(s=>s.n),C.P.map(p=>p.s)));
  grids.append(grid("B","Who had what?",C.S.map(s=>s.n),C.I.map(i=>capFirst(i.n))));
  if(C.clues.some(c=>c.k==="ip+"||c.k==="ip-")) grids.append(grid("C","Which object was where?",C.I.map(i=>capFirst(i.n)),C.P.map(p=>p.s)));
  if(!st.done){ grids.append(h("div",{class:"tools"},h("button",{type:"button",onclick:checkGrid,text:"Check my grid"}),h("button",{type:"button",onclick:clearGrid,text:"Clear grid"}))); if(st.gmsg) grids.append(h("p",{class:"small",text:st.gmsg})); }
  v.replaceChildren(backRow(),top,clues,grids,st.done?caseResult():accusePanel());
  if(st.done){ sheetOpen=false; renderSheet(); setActions([]); }
  else { renderSheet(); setActions([btn(sheetOpen?"Hide clues":"Show clues while marking",()=>{ sheetOpen=!sheetOpen; renderCases(); },"ghost")]); }
}
let sheetOpen=false;
function renderSheet(){
  const sh=$("sheet"); if(!sheetOpen||S.view!=="puzzles"||PZS.sub!=="case"||!CS){ sh.hidden=true; sh.replaceChildren(); return; }
  const st=CS.st, C=CS.C;
  const ol=h("ol",{class:"cluelist"}); C.clues.forEach((c,ix)=>ol.append(h("li",{class:st.struck.includes(ix)?"struck":""},h("button",{type:"button",onclick:()=>toggleStrike(ix),"aria-pressed":String(st.struck.includes(ix))},h("span",{text:c.text})))));
  sh.replaceChildren(h("div",{class:"in"},ol,h("div",{class:"key-clue"},h("b",{text:"Key clue"}),C.killerText)));
  sh.hidden=false;
}

/* ---------- me ---------- */
function spark(skill){
  const key=skill==="people"?"p":"d", ks=Object.keys(S.P.rhist).sort().slice(-30), vals=ks.map(k=>S.P.rhist[k][key]).filter(x=>typeof x==="number");
  const NS="http://www.w3.org/2000/svg", svg=document.createElementNS(NS,"svg"); svg.setAttribute("viewBox","0 0 160 44"); svg.setAttribute("class","spark"); svg.setAttribute("preserveAspectRatio","none"); svg.setAttribute("aria-hidden","true");
  const all=[1000].concat(vals), lo=Math.min(...all)-20, hi=Math.max(...all)+20;
  const y=v=>40-(v-lo)/(hi-lo)*36, x=i=>vals.length<2?80:4+i*(152/(vals.length-1));
  const base=document.createElementNS(NS,"line"); base.setAttribute("x1","0"); base.setAttribute("x2","160"); base.setAttribute("y1",y(1000).toFixed(1)); base.setAttribute("y2",y(1000).toFixed(1)); base.setAttribute("stroke","var(--line)"); base.setAttribute("stroke-dasharray","3 3"); svg.append(base);
  if(vals.length>1){ const pl=document.createElementNS(NS,"polyline"); pl.setAttribute("points",vals.map((v,i)=>x(i).toFixed(1)+","+y(v).toFixed(1)).join(" ")); pl.setAttribute("fill","none"); pl.setAttribute("stroke",skill==="people"?"var(--c-people)":"var(--c-mystery)"); pl.setAttribute("stroke-width","2"); svg.append(pl); }
  if(vals.length){ const ci=document.createElementNS(NS,"circle"); ci.setAttribute("cx",x(vals.length-1).toFixed(1)); ci.setAttribute("cy",y(vals[vals.length-1]).toFixed(1)); ci.setAttribute("r","3.5"); ci.setAttribute("fill",skill==="people"?"var(--c-people)":"var(--c-mystery)"); svg.append(ci); }
  return svg;
}
function unseenCount(){ const P=S.P, laws=learnedLaws(); return pool().filter(it=>(it.t==="scenario"||it.t==="spot")&&!P.items[it.id]&&!P.hidden[it.id]&&(!it.law||laws.includes(it.law))).length; }
const GEN={busy:false,msg:""};
function genControls(){
  const n=unseenCount(), box=h("div",{class:"genbox"},h("p",{text:n+" unplayed scenario and chat "+(n===1?"card":"cards")+" left."}));
  if(!sample||S.mode!=="live"){ box.append(h("p",{class:"small muted",text:"New cards need Claude, which isn’t available in this view."})); return box; }
  if(GEN.busy){ box.append(h("p",{class:"small",text:"Writing 6 new challenges… usually 30 to 60 seconds."})); return box; }
  if(GEN.msg) box.append(h("p",{class:"small",text:GEN.msg}));
  box.append(btn("Make 6 new challenges",generateFresh,"ghost"),h("p",{class:"small muted",text:"Claude writes them from the laws you’ve learned, using your Claude usage."}));
  return box;
}
function renderMe(){
  const v=$("v-me"); if(S.view!=="me") return;
  if(!ready()){ v.replaceChildren(h("div",{class:"skel"})); return; }
  const P=S.P, s=streak();
  const dots=h("div",{class:"dots"});
  for(let i=13;i>=0;i--){ const d=addDays(today(),-i), on=played(P.days[d]), fz=P.frozen.includes(d); dots.append(h("i",{class:on?"on":fz?"fz":"",title:fmtDay(d)})); }
  const c1=h("div",{class:"mcard"},h("span",{class:"eyebrow",text:"Streak"}),h("div",{class:"big",text:String(s)}),h("p",{class:"muted small",text:(s===1?"day":"days")+" in a row · any deck, lesson, case or puzzle keeps it going"}),dots,
    h("div",{class:"legend"},h("span",null,h("i",{style:"background:var(--c-people)"}),"Played"),h("span",null,h("i",{style:"background:var(--c-spot)"}),"Freeze used"),h("span",{text:"Freezes saved: "+P.freezes+" of 2"})));
  if(P.freezeNote) c1.append(h("p",{class:"small",text:P.freezeNote}));
  const tile=(label,skill)=>h("div",{class:"rate"},h("span",{class:"eyebrow",text:label}),h("b",{text:String(P.ratings[skill])}),spark(skill));
  const c2=h("div",{class:"mcard"},h("span",{class:"eyebrow",text:"Ratings"}),h("p",{class:"small muted",text:"Like a chess rating: everyone starts at 1000, and your next cards are pitched near your level."}),h("div",{class:"ratings"},tile("People reader","people"),tile("Detective","detective")));
  const c3=h("div",{class:"mcard"},h("span",{class:"eyebrow",text:"By law"}));
  learnedLaws().forEach(l=>{
    let n=0,c=0; pool().filter(it=>it.law===l).forEach(it=>{ const st=P.items[it.id]; if(st){ n+=st.n; c+=st.c; } });
    const cards=S.cards.filter(cd=>cd.law===l), mastered=cards.filter(cd=>(cd.box||0)>=3).length;
    c3.append(h("div",{class:"lawrow"},h("b",{text:"Law "+l+" · "+LAWS[l].short}),h("span",{class:"muted small",text:n?c+"/"+n+" right":"not played yet"}),h("div",{class:"bar"},h("i",{style:"width:"+(n?Math.round(c/n*100):0)+"%"})),
      h("span",{class:"muted small",text:"Cards mastered"}),h("span",{class:"muted small",text:mastered+"/"+cards.length}),h("div",{class:"bar"},h("i",{class:"rc",style:"width:"+(cards.length?Math.round(mastered/cards.length*100):0)+"%"}))));
  });
  c3.append(h("p",{class:"small muted",text:"A card counts as mastered after 3 right in a row."}));
  let answered=0; Object.values(P.days).forEach(d=>{ answered+=d.answered||0; });
  const solved=Object.values(P.cases).filter(x=>x.result==="solved").length;
  const t=(n,l)=>h("div",null,h("b",{text:String(n)}),h("span",{text:l}));
  const nLess=Object.keys(P.learn.done).length, nPz=Object.values(P.pzs).reduce((a,x)=>a+(x.solved||0),0);
  const plans=P.learn.plans.filter(x=>x.fired), fired=plans.filter(x=>x.fired==="yes"||x.fired==="partly").length;
  const c4=h("div",{class:"mcard"},h("span",{class:"eyebrow",text:"Totals"}),h("div",{class:"totals"},t(P.decks||0,"decks"),t(answered,"challenges"),t(solved,"cases solved")),
    h("div",{class:"totals"},t(nLess,"lessons"),t(nPz,"puzzles solved"),t(plans.length?fired+"/"+plans.length:"–","plans that fired")));
  const cc=h("div",{class:"mcard"},h("span",{class:"eyebrow",text:"Courses"}));
  COURSES.forEach(co=>{ const n=co.lessons.filter(L=>P.learn.done[L.id]).length; cc.append(h("div",{class:"lawrow "+co.cls},h("b",{text:co.name}),h("span",{class:"muted small",text:n+"/"+co.lessons.length}),h("div",{class:"pbar"},h("i",{style:"width:"+Math.round(n/co.lessons.length*100)+"%"})))); });
  const c5=h("div",{class:"mcard"},h("span",{class:"eyebrow",text:"Fresh challenges"}),genControls());
  if(P.flags.length) c5.append(h("p",{class:"small muted",text:P.flags.length+" flagged "+(P.flags.length===1?"card is":"cards are")+" hidden. Claude reviews them."}));
  c5.append(h("p",{class:"small"},h("a",{href:TRACKER,target:"_blank",rel:"noopener",text:"Open your Prime Rebuild tracker"})));
  v.replaceChildren(h("div",{class:"mgrid"},c1,c4,cc,c2,c3,c5)); setActions([]);
}

/* ---------- fresh challenges from Claude ---------- */
function s_(v,max){ return typeof v==="string"&&v.trim().length>0&&v.length<=max?v.trim():null; }
function validateGen(x,laws){
  if(!x||typeof x!=="object") return null; const law=Number(x.law), why=s_(x.why,800); if(!laws.includes(law)||!why) return null;
  const base={law,d:1050,why,gen:true,created:new Date().toISOString()};
  if(x.t==="scenario"){
    const text=s_(x.text,900), q=s_(x.q,180), scene=s_(x.scene,48)||""; if(!text||!q||!Array.isArray(x.opts)) return null;
    const opts=x.opts.map(o=>s_(o,260)); if(opts.length<3||opts.length>4||opts.some(o=>!o)||new Set(opts).size!==opts.length) return null;
    const a=Number(x.a); if(!Number.isInteger(a)||a<0||a>=opts.length) return null;
    return Object.assign(base,{t:"scenario",scene,text,q,opts,a});
  }
  if(x.t==="spot"){
    const kind=x.kind==="type"?"type":"move"; if(kind==="type"&&(law!==19||!TYPES.includes(x.type))) return null; if(kind==="move"&&!TACTICS[law]) return null;
    const who=s_(x.who,32), sub=s_(x.sub||"",48)||""; if(!who||!Array.isArray(x.msgs)) return null;
    const msgs=x.msgs.map(m=>Array.isArray(m)&&["t","m","d"].includes(m[0])&&s_(m[1],240)?{w:m[0],x:m[1].trim()}:null);
    if(msgs.length<3||msgs.length>7||msgs.some(m=>!m)) return null;
    const tell=Number(x.tell); if(!Number.isInteger(tell)||tell<0||tell>=msgs.length||msgs[tell].w==="d") return null;
    const o=Object.assign(base,{t:"spot",kind,who,sub,msgs,tell}); if(kind==="type") o.type=x.type; return o;
  }
  return null;
}
function genPrompt(laws){
  const moveLaws=laws.filter(l=>TACTICS[l]), has19=laws.includes(19);
  const recent=S.gen.slice(-24).map(g=>g.t==="spot"?"chat with "+g.who:"scenario: "+(g.scene||"")+" "+(g.text||"").slice(0,50)).join("; ");
  return [
    "You write practice cards for Jenil, a 20-year-old mechanical engineering student in Ahmedabad, India. His family lives in Rajkot; he lives in a hostel, trades stocks with an algo, does hackathons and is in a trading club. He studies Robert Greene's laws to read people's intentions and protect himself. He plays these cards on his phone instead of scrolling reels.",
    "Write 6 cards: 3 of type \"scenario\" and 3 of type \"spot\". Use ONLY these laws:\n"+laws.map(l=>"- Law "+l+" ("+LAWS[l].name+"): "+LAW_NOTES[l]).join("\n"),
    "Rules: realistic situations from his life (hostel, college, family functions, internships, money, WhatsApp). Indian first names. Plain, simple English. Exactly one option must be clearly best; wrong options should be tempting but clearly worse once explained. Check that before answering. Nothing romantic or sexual, nothing cruel.",
    "scenario format: {\"t\":\"scenario\",\"law\":number,\"scene\":\"place label, max 4 words\",\"text\":\"40 to 80 words\",\"q\":\"short question\",\"opts\":[3 or 4 options, each under 25 words],\"a\":index of the best option,\"why\":\"2 or 3 sentences: why it's best and why the most tempting wrong option fails\"}",
    "spot format: a short chat screenshot. "+(moveLaws.length?"For laws "+moveLaws.join(", ")+": {\"t\":\"spot\",\"kind\":\"move\",\"law\":number,...}. ":"")+(has19?"For law 19: {\"t\":\"spot\",\"kind\":\"type\",\"law\":19,\"type\":one of \"Proud\",\"Insecure\",\"Suspicious\",\"Long memory\",\"Unbothered\",...}. ":"")+"Fields: \"who\":\"first name\",\"sub\":\"relation, max 4 words\",\"msgs\":[[\"t\" or \"m\" or \"d\",\"text\"], ...] with 3 to 6 entries (\"t\" = the other person, \"m\" = Jenil, \"d\" = a short divider like \"Next day\"),\"tell\": index in msgs of the message that gives the move away (never a divider),\"why\":\"2 sentences naming the tell and Jenil's best response, including one line he could say\".",
    recent?"Don't repeat these earlier cards: "+recent+".":"",
    "Reply with only a JSON array of the 6 cards."
  ].filter(Boolean).join("\n\n");
}
function genErr(e){
  const c=e&&e.code;
  if(["not_granted","sampling_disabled","not_declared","capability_disabled","capability_removed"].includes(c)){ sample=null; return "This page wasn’t allowed to use Claude, so it can’t make new cards here."; }
  if(c==="rate_limited") return "Too many requests right now. Try again in a while.";
  if(c==="session_expired") return "Sign in to Claude again, then try.";
  if(c==="invalid_json") return "The new cards came out garbled. Try again.";
  return "Couldn’t make new cards just now. Try again.";
}
async function generateFresh(){
  if(GEN.busy||!sample||S.mode!=="live") return;
  GEN.busy=true; GEN.msg=""; rerender();
  try{
    const laws=learnedLaws(), out=await sample.json(genPrompt(laws),{cache:false});
    const list=Array.isArray(out)?out:(out&&Array.isArray(out.cards)?out.cards:[]);
    const good=list.map(x=>validateGen(x,laws)).filter(Boolean).slice(0,6);
    if(!good.length) throw {code:"invalid_json"};
    for(const it of good) await db.collection("content").add(it);
    GEN.msg=good.length+" new challenges added. They’ll show up in your next decks.";
  }catch(e){ GEN.msg=genErr(e); logErr("generate",e); touch(); }
  finally{ GEN.busy=false; rerender(); }
}

