
/* ---------- diagrams (one picture per lesson) ---------- */
const SVGNS="http://www.w3.org/2000/svg";
function put(el,...k){ el.append(...k.flat().filter(x=>x!=null&&x!==false)); return el; }
function svgEl(tag,attrs){ const e=document.createElementNS(SVGNS,tag); for(const k in attrs) e.setAttribute(k,attrs[k]); return e; }
function diagram(p){
  const box=h("figure",{class:"dg dg-"+p.k,"aria-label":"Diagram"});
  if(p.k==="split"){
    const blob=(side,t,sub)=>h("div",{class:"blob"+(p.hi===side?" on":"")},h("b",{text:t}),sub?h("span",{text:sub}):null);
    box.append(blob("l",p.l,p.ls),h("span",{class:"vs",text:"vs"}),blob("r",p.r,p.rs));
  } else if(p.k==="chain"){
    p.steps.forEach((t,i)=>{ if(i) box.append(h("span",{class:"arr","aria-hidden":"true",text:"↓"})); box.append(h("div",{class:"node"+(i===p.hi?" on":"")},h("span",{class:"num",text:String(i+1)}),h("span",{text:t}))); });
  } else if(p.k==="three"){
    box.append(h("div",{class:"roof",text:p.top}),h("div",{class:"cols"},p.items.map(t=>h("div",{class:"col"},h("span",{text:t})))),h("div",{class:"base"}));
  } else if(p.k==="thirds"){
    box.append(h("div",{class:"pie","aria-hidden":"true"}),h("ul",{class:"legend3"},p.items.map((t,i)=>h("li",null,h("i",{class:"sw s"+i}),h("span",{text:t+" · ⅓"})))));
  } else if(p.k==="stairs"){
    const n=p.steps.length;
    if(p.label) box.append(h("p",{class:"dglabel",text:p.label}));
    box.append(h("div",{class:"bars"},p.steps.map((s,i)=>{ const f=p.desc?(1-i/(n))*0.85+0.15:(i+1)/n; return h("div",{class:"barc"},h("span",{class:"val",text:s[1]}),h("div",{class:"bar"+(i===(p.desc?n-1:n-1)?" on":""),style:"height:"+Math.round(f*100)+"%"}),h("span",{class:"lab",text:s[0]})); })));
  } else if(p.k==="meter"){
    if(p.label) box.append(h("p",{class:"dglabel",text:p.label}));
    box.append(h("div",{class:"zones"},p.zones.map((z,i)=>h("div",{class:"zone"+(i===p.hi?" on":"")},h("span",{text:z})))));
    box.append(h("div",{class:"marker",style:"left:"+((p.hi+0.5)/p.zones.length*100)+"%","aria-hidden":"true"}));
  } else if(p.k==="ring"){
    const half=Math.ceil(p.outer.length/2);
    const chips=list=>h("div",{class:"chipsrow"},list.map(t=>h("span",{class:"och",text:t})));
    box.append(chips(p.outer.slice(0,half)),h("div",{class:"center"+(p.shell?" shelled":"")},h("b",{text:p.center}),p.shell?h("small",{text:p.shell}):null),chips(p.outer.slice(half)));
  } else if(p.k==="cycle"){
    const n=p.nodes, node=i=>h("div",{class:"cn"+(i===p.hi?" on":"")},h("span",{text:n[i]}));
    box.append(h("div",{class:"cyc"},node(0),h("span",{class:"ca",text:"→"}),node(1),h("span",{class:"ca up",text:"↑"}),h("span"),h("span",{class:"ca",text:"↓"}),node(3),h("span",{class:"ca",text:"←"}),node(2)));
  } else if(p.k==="curves"){
    const svg=svgEl("svg",{viewBox:"0 0 320 150",class:"curves","aria-hidden":"true"});
    svg.append(svgEl("line",{x1:30,y1:130,x2:310,y2:130,stroke:"var(--line)","stroke-width":2}),svgEl("line",{x1:30,y1:12,x2:30,y2:130,stroke:"var(--line)","stroke-width":2}));
    svg.append(svgEl("path",{d:"M34 112 C 110 120, 150 90, 200 60 S 280 22, 306 20",fill:"none",stroke:"var(--good)","stroke-width":4,"stroke-linecap":"round"}));
    svg.append(svgEl("path",{d:"M34 22 C 110 16, 150 44, 200 76 S 280 118, 306 120",fill:"none",stroke:"var(--bad)","stroke-width":4,"stroke-linecap":"round","stroke-dasharray":"9 6"}));
    const tx=(x,y,t,a)=>{ const e=svgEl("text",{x,y,"font-size":12,fill:"var(--muted)","text-anchor":a||"start","font-family":"IBM Plex Mono, monospace"}); e.textContent=t; return e; };
    svg.append(tx(36,146,"start"),tx(306,146,"end","end"),tx(38,12,"↑ feels good"));
    box.append(svg,h("ul",{class:"legend2"},h("li",null,h("i",{class:"sw good"}),h("span",{text:p.a+": poison first, nectar later"})),h("li",null,h("i",{class:"sw bad"}),h("span",{text:p.b+": nectar first, poison later"}))));
  } else if(p.k==="wave"){
    const svg=svgEl("svg",{viewBox:"0 0 320 130",class:"wave","aria-hidden":"true"});
    svg.append(svgEl("line",{x1:10,y1:65,x2:310,y2:65,stroke:"var(--ink)","stroke-width":2,"stroke-dasharray":"6 5"}));
    svg.append(svgEl("path",{d:"M10 65 C 40 10, 70 10, 100 65 S 160 120, 190 65 S 250 10, 280 65 S 305 95, 310 85",fill:"none",stroke:"var(--accent)","stroke-width":4,"stroke-linecap":"round"}));
    const tx=(x,y,t,a)=>{ const e=svgEl("text",{x,y,"font-size":12,fill:"var(--muted)","text-anchor":a||"middle","font-family":"IBM Plex Mono, monospace"}); e.textContent=t; return e; };
    svg.append(tx(55,14,p.top),tx(145,126,p.bot),tx(306,58,p.line,"end"));
    box.append(svg,h("p",{class:"dglabel",text:p.cap}));
  } else if(p.k==="balance"){
    const svg=svgEl("svg",{viewBox:"0 0 320 110",class:"balance","aria-hidden":"true"});
    svg.append(svgEl("polygon",{points:"160,60 140,100 180,100",fill:"var(--sunk)",stroke:"var(--ink)","stroke-width":2}));
    svg.append(svgEl("line",{x1:40,y1:58,x2:280,y2:58,stroke:"var(--ink)","stroke-width":4,"stroke-linecap":"round"}));
    svg.append(svgEl("path",{d:"M40 58 L20 88 H60 Z",fill:"var(--accent-soft)",stroke:"var(--accent)","stroke-width":2}),svgEl("path",{d:"M280 58 L260 88 H300 Z",fill:"var(--accent-soft)",stroke:"var(--accent)","stroke-width":2}));
    const tx=(x,y,t)=>{ const e=svgEl("text",{x,y,"font-size":14,"font-weight":700,fill:"var(--ink)","text-anchor":"middle","font-family":"Bricolage Grotesque, system-ui, sans-serif"}); e.textContent=t; return e; };
    svg.append(tx(40,46,p.l),tx(280,46,p.r));
    box.append(svg,h("p",{class:"dglabel",text:p.mid}));
  }
  return box;
}

/* ---------- learn: courses and lesson player ---------- */
const LSTEPS=["guess","reveal","source","story","transfer","why","plan","done"];
let LS=null;
function lessonById(id){ for(const c of COURSES){ const i=c.lessons.findIndex(x=>x.id===id); if(i>=0) return {c,L:c.lessons[i],i}; } return null; }
function nextLesson(c){ return c.lessons.find(L=>!S.P.learn.done[L.id])||null; }
function doneToday(c){ return S.P.learn.last[c.id]===today(); }
function lessonAvailable(c){ return !!nextLesson(c)&&!doneToday(c); }
function nDone(c){ return c.lessons.filter(L=>S.P.learn.done[L.id]).length; }
function saveLessonLocal(){ lsSet("pp2.lesson",LS); }
function startLesson(cid,lid,review){
  const saved=lsGet("pp2.lesson");
  if(saved&&saved.id===lid&&!!saved.review===!!review&&saved.step<LSTEPS.length-1){ LS=saved; }
  else {
    const f=lessonById(lid); if(!f) return;
    const ord=n=>shuffle([...Array(n).keys()]);
    LS={course:cid,id:lid,review:!!review,step:0,og:ord(f.L.o.length),ot:ord(f.L.tr.o.length),ow:ord(f.L.wy.o.length),pick:{},conf:null,plan:{i:null,t:null,ci:"",ct:""},iast:{},started:today(),finished:false};
  }
  LS.lesson=true; saveLessonLocal(); renderLearn(); window.scrollTo(0,0);
}
function exitLesson(){ if(LS&&LS.finished) lsSet("pp2.lesson",null); LS=null; renderLearn(); renderSeg(); window.scrollTo(0,0); }
function lessonGo(step){ LS.step=step; saveLessonLocal(); if(LSTEPS[step]==="done") finishLesson(); renderLearn(); window.scrollTo({top:0,behavior:"auto"}); }
function finishLesson(){
  if(LS.finished) return; LS.finished=true;
  const f=lessonById(LS.id); if(!f) return;
  if(!LS.review){
    const L=f.L, ok=k=>{ const ord=LS["o"+k], pk=LS.pick[k]; const src=k==="g"?L:k==="t"?L.tr:L.wy; return pk!=null&&ord[pk]===src.a; };
    S.P.learn.done[L.id]={at:today(),g:ok("g"),c:LS.conf,t:ok("t"),w:ok("w")};
    S.P.learn.last[f.c.id]=today(); dayRec().lessons=(dayRec().lessons||0)+1;
    addLessonCards(f.c,f.L,f.i);
  }
  touch(); saveLessonLocal(); renderChips();
}
async function addLessonCards(c,L,idx){
  for(let k=0;k<L.cards.length;k++){
    const id=c.id+"-"+L.id+"-"+(k+1); if(S.cards.some(x=>x.id===id)) continue;
    const doc={front:L.cards[k][0],back:L.cards[k][1],track:c.id,lawName:c.short+" · "+L.t,order:idx*2+k,box:0,due:addDays(today(),1),reviews:0,created:today()};
    S.cards.push(Object.assign({id},doc));
    if(S.mode==="live"){ try{ await db.doc("cards/"+id).set(doc); }catch(e){ logErr("lessonCard",e); toastOnce("A new card didn’t save. It’ll retry next lesson."); } }
  }
}
function pendingPlan(){
  const t=today(), min=addDays(t,-3);
  const list=S.P.learn.plans.filter(p=>!p.fired&&p.made<t&&p.made>=min);
  return list.length?list[list.length-1]:null;
}
function answerPlan(p,val){
  p.fired=val; p.checked=today(); touch();
  toast(val==="yes"?"Nice. That’s the whole point of the lesson.":val==="partly"?"Partly counts. Small plans that fire beat big ones.":val==="no"?"Noted. A miss is data: make the next plan smaller or the cue clearer.":"Fair. It’ll come up another day.");
  renderLearn(); renderMe();
}
function planText(i,t){ return "If "+i+", then I will "+t+"."; }
function checkinCard(p){
  const f=lessonById(p.lesson), when=p.made===addDays(today(),-1)?"Yesterday’s plan":"Your plan from "+fmtDay(p.made);
  const b=(label,val)=>h("button",{class:"choice",type:"button",onclick:()=>answerPlan(p,val)},label);
  return h("div",{class:"cbox checkin"},h("span",{class:"eyebrow",text:when+(f?" · "+f.c.short+": "+f.L.t:"")}),h("p",{class:"text big",text:planText(p.i,p.t)}),h("p",{class:"q",text:"Did it fire?"}),
    h("div",{class:"choices"},b("Yes","yes"),b("Partly","partly"),b("No","no"),b("Didn’t come up","na")));
}
function lastSleepLine(){
  let best=null; for(const c of COURSES) for(const L of c.lessons){ const d=S.P.learn.done[L.id]; if(d&&(!best||d.at>=best.at)) best={at:d.at,L}; }
  return best?best.L.sl:"The best thing you can learn tonight is that the phone can wait till morning.";
}
function courseCard(c){
  const n=nDone(c), total=c.lessons.length, nx=nextLesson(c), late=isLate(), lessonsDone=c.lessons.filter(L=>S.P.learn.done[L.id]);
  const card=h("div",{class:"cbox lcourse "+c.cls},h("div",{class:"case-meta"},h("span",{class:"tpill"},c.short),h("span",{class:"eyebrow",text:n+" of "+total+" done"})),h("h2",{text:c.name}));
  if(n===0) put(card,h("p",{class:"small",text:c.blurb}));
  put(card,h("div",{class:"pbar"},h("i",{style:"width:"+Math.round(n/total*100)+"%"})));
  const saved=lsGet("pp2.lesson"), resume=saved&&saved.course===c.id&&!saved.review&&!saved.finished&&!S.P.learn.done[saved.id]&&saved.step>0;
  if(!nx) put(card,h("p",{class:"text",text:"Course complete. Every lesson’s cards are in your deck."}));
  else {
    const ix=c.lessons.indexOf(nx);
    put(card,h("div",{class:"nextl"},h("span",{class:"eyebrow",text:(nx.bonus?"Bonus":"Lesson "+(ix+1))+" · about 3 minutes"}),h("b",{text:nx.t})));
    if(resume) put(card,btn("Continue lesson",()=>startLesson(c.id,saved.id,false)));
    else if(doneToday(c)) put(card,h("p",{class:"small muted",text:"Done for today. This one unlocks tomorrow morning."}));
    else if(late) put(card,h("p",{class:"small muted",text:"Night mode: new lessons wait for the morning."}));
    else put(card,btn("Start lesson",()=>startLesson(c.id,nx.id,false)));
  }
  if(lessonsDone.length){
    const list=h("div",{class:"pastl"},lessonsDone.map(L=>h("button",{type:"button",class:"pastb",onclick:()=>startLesson(c.id,L.id,true)},h("span",{text:L.t}),h("small",{text:"Review"}))));
    put(card,h("details",{class:"howto"},h("summary",{text:"Past lessons ("+lessonsDone.length+")"}),list));
  }
  put(card,h("p",{class:"small muted",text:c.note}));
  return card;
}
function renderLearnHome(){
  const v=$("v-learn"), parts=[];
  const pp=pendingPlan(); if(pp) parts.push(checkinCard(pp));
  if(isLate()) parts.push(h("div",{class:"cbox night"},h("span",{class:"eyebrow",text:"It’s "+clock()+" · night mode"}),h("p",{class:"small muted",text:"No new lessons after 12:30. One thought to sleep on:"}),h("p",{class:"text big",text:lastSleepLine()})));
  else parts.push(h("div",{class:"lhead"},h("h2",{text:"Learn"}),h("p",{class:"small muted",text:"One lesson per course per day, about 3 minutes each. Each one adds 2 cards to your deck."})));
  COURSES.forEach(c=>parts.push(courseCard(c)));
  v.replaceChildren(...parts); setActions([]); renderSeg();
}
function optList(src,ord,key,onPick,reveal){
  const box=h("div",{class:"opts"}), picked=LS.pick[key];
  ord.forEach((oi,pos)=>{
    let cls="opt";
    if(reveal&&picked!=null){ if(oi===src.a) cls+=" right"; else if(pos===picked) cls+=" wrong"; else cls+=" dim"; }
    else if(pos===picked) cls+=" sel";
    box.append(h("button",{class:cls,type:"button",disabled:reveal&&picked!=null,"aria-label":"Option "+"ABCD"[pos]+": "+src.o[oi],onclick:()=>onPick(pos)},h("span",{class:"key",text:"ABCD"[pos]}),h("span",{text:src.o[oi]})));
  });
  return box;
}
function verseCard(v){
  const open=!!LS.iast[v.ref];
  const c=h("div",{class:"verse"},h("span",{class:"eyebrow",text:"Gita "+v.ref+" · "+v.who}),h("p",{class:"roman",text:v.s}),h("p",{class:"mean",text:v.m}));
  if(v.n) c.append(h("p",{class:"small muted",text:v.n}));
  c.append(h("button",{class:"hintbtn",type:"button","aria-expanded":String(open),onclick:()=>{ LS.iast[v.ref]=!open; saveLessonLocal(); renderLearn(); }},open?"Hide exact pronunciation":"Exact pronunciation (IAST)"));
  if(open) c.append(h("p",{class:"iast",text:v.i}));
  return c;
}
const GRADE_CLS=g=>/^Strong/.test(g)?"strong":/Contradicted|No evidence|Unsafe/.test(g)?"bad":/Weak|untested/i.test(g)?"weak":"mid";
function renderLessonStep(){
  const f=lessonById(LS.id); if(!f){ LS=null; return renderLearnHome(); }
  const {c,L,i}=f, step=LSTEPS[LS.step], v=$("v-learn");
  const top=h("div",{class:"lesson-top"},h("button",{class:"back",type:"button",onclick:exitLesson,"aria-label":"Leave lesson"},"‹ Learn"),h("span",{class:"eyebrow",text:c.short+" · "+(L.bonus?"Bonus":"Lesson "+(i+1))+(LS.review?" · review":"")}));
  const card=h("article",{class:"card lesson "+c.cls+(reduced?"":" enter")});
  let actions=[];
  if(step==="guess"){
    put(card,h("h2",{class:"ltitle",text:L.t}),h("p",{class:"scene-box",text:L.scene}),h("p",{class:"q",text:L.q}));
    put(card,optList(L,LS.og,"g",pos=>{ LS.pick.g=pos; saveLessonLocal(); renderLearn(); const cf=document.querySelector(".conf"); if(cf) cf.scrollIntoView({behavior:reduced?"auto":"smooth",block:"nearest"}); },false));
    if(LS.pick.g!=null){
      const cb=(label,val)=>h("button",{class:"choice",type:"button",onclick:()=>{ LS.conf=val; lessonGo(1); }},label);
      put(card,h("div",{class:"conf"},h("span",{class:"eyebrow",text:"How sure are you?"}),h("div",{class:"choices"},cb("Sure","sure"),cb("Think so","think"),cb("Guessing","guess"))));
    } else put(card,h("p",{class:"think",text:"Guess first, even if you’re not sure. Guessing before you learn makes it stick."}));
  }
  else if(step==="reveal"){
    const ok=LS.og[LS.pick.g]===L.a;
    const fb=h("div",{class:"fb "+(ok?"ok":"no")},h("span",{class:"verdict",text:ok?"You called it.":"Not quite."}));
    if(!ok) fb.append(h("p",null,h("b",{text:"Answer: "}),L.o[L.a]));
    if(!ok&&LS.conf==="sure") fb.append(h("p",{class:"small",text:"Surprised? Confident misses are the ones you remember best."}));
    if(ok&&LS.conf==="guess") fb.append(h("p",{class:"small",text:"Good instinct. Here’s why it works."}));
    put(card,fb,h("p",{class:"text",text:L.rv}),diagram(L.pic));
    actions=[btn("Continue",()=>lessonGo(2))];
  }
  else if(step==="source"){
    put(card,h("div",{class:"term"},h("span",{class:"eyebrow",text:"Name it"}),h("b",{text:L.term.w}),h("span",{text:L.term.g})));
    if(L.v){ L.v.forEach(x=>put(card,verseCard(x))); if(L.par) put(card,h("div",{class:"par"},h("span",{class:"eyebrow",text:"Modern parallel"}),h("p",{text:L.par}),h("p",{class:"small muted",text:"Ancient insight, modern parallel: not the same thing, but pointing the same way."}))); }
    else {
      const src=h("div",{class:"verse"},h("span",{class:"eyebrow",text:"Charaka Samhita · "+L.src.ref}));
      if(L.src.s) src.append(h("p",{class:"roman",text:L.src.s}));
      src.append(h("p",{class:"mean",text:L.src.line})); if(L.src.n) src.append(h("p",{class:"small muted",text:L.src.n}));
      put(card,src,h("div",{class:"grade "+GRADE_CLS(L.grade.g)},h("span",{class:"eyebrow",text:"Evidence grade"}),h("b",{text:L.grade.g}),L.grade.n?h("span",{class:"small",text:L.grade.n}):null),
        h("div",{class:"par"},h("span",{class:"eyebrow",text:"What research says"}),h("p",{text:L.sci})),h("p",{class:"small muted",text:"Educational, not medical advice."}));
    }
    actions=[btn("Continue",()=>lessonGo(3))];
  }
  else if(step==="story"){
    put(card,h("span",{class:"eyebrow",text:c.id==="gita"?"The story":"The context"}),...L.st.map(t=>h("p",{class:"text story",text:t})),h("div",{class:"key-clue rule"},h("b",{text:"The rule"}),L.rule));
    actions=[btn("Continue",()=>lessonGo(4))];
  }
  else if(step==="transfer"||step==="why"){
    const src=step==="transfer"?L.tr:L.wy, key=step==="transfer"?"t":"w", ord=LS["o"+key], done=LS.pick[key]!=null;
    put(card,h("span",{class:"eyebrow",text:step==="transfer"?"Try it somewhere new":"Why does it work?"}));
    if(step==="transfer") put(card,h("p",{class:"scene-box",text:src.s}));
    put(card,h("p",{class:"q",text:src.q}),optList(src,ord,key,pos=>{ if(LS.pick[key]!=null) return; LS.pick[key]=pos; saveLessonLocal(); renderLearn(); const fb=document.querySelector(".lesson .fb"); if(fb) setTimeout(()=>fb.scrollIntoView({behavior:reduced?"auto":"smooth",block:"nearest"}),40); },true));
    if(done){ const ok=ord[LS.pick[key]]===src.a; put(card,h("div",{class:"fb "+(ok?"ok":"no")},h("span",{class:"verdict",text:ok?pickWord(["Right.","Exactly.","Sharp."],LS.id+key):"Not quite."}),!ok?h("p",null,h("b",{text:"Answer: "}),src.o[src.a]):null,h("p",{text:step==="transfer"?src.w:src.f}))); actions=[btn("Continue",()=>lessonGo(LS.step+1))]; }
  }
  else if(step==="plan"){
    const P_=LS.plan, ifV=P_.i==="own"?P_.ci.trim():P_.i!=null?L.pl.i[P_.i]:"", thV=P_.t==="own"?P_.ct.trim():P_.t!=null?L.pl.t[P_.t]:"";
    const chipRow=(list,key,ownKey)=>h("div",{class:"choices col"},list.map((x,ix)=>h("button",{class:"choice",type:"button","aria-pressed":String(P_[key]===ix),onclick:()=>{ P_[key]=ix; saveLessonLocal(); renderLearn(); }},x)),
      h("button",{class:"choice",type:"button","aria-pressed":String(P_[key]==="own"),onclick:()=>{ P_[key]="own"; saveLessonLocal(); renderLearn(); const inp=document.getElementById("own-"+key); if(inp) inp.focus(); }},"Write my own"));
    const own=(key,ownKey,ph)=>P_[key]==="own"?h("input",{class:"ownin",id:"own-"+key,type:"text",maxlength:"120",placeholder:ph,value:P_[ownKey],oninput:e=>{ P_[ownKey]=e.target.value; saveLessonLocal(); const pv=document.querySelector(".planpv"); const a=P_.i==="own"?P_.ci.trim():P_.i!=null?L.pl.i[P_.i]:"", b=P_.t==="own"?P_.ct.trim():P_.t!=null?L.pl.t[P_.t]:""; if(pv) pv.textContent=a&&b?planText(a,b):"Pick one of each."; const sb=document.getElementById("saveplan"); if(sb) sb.disabled=!(a&&b); }}):null;
    put(card,h("span",{class:"eyebrow",text:"Use it today"}),h("h3",{class:"q",text:"Make one if-then plan"}),h("p",{class:"small muted",text:"Plans tied to a specific moment are far more likely to happen than good intentions."}),
      h("p",{class:"plabel",text:"If…"}),chipRow(L.pl.i,"i","ci"),own("i","ci","e.g. I open Instagram after 11 pm"),
      h("p",{class:"plabel",text:"…then I will"}),chipRow(L.pl.t,"t","ct"),own("t","ct","e.g. put the phone on charge across the room"),
      h("p",{class:"planpv",text:ifV&&thV?planText(ifV,thV):"Pick one of each."}));
    const save=()=>{ const a=P_.i==="own"?P_.ci.trim():P_.i!=null?L.pl.i[P_.i]:"", b=P_.t==="own"?P_.ct.trim():P_.t!=null?L.pl.t[P_.t]:""; if(!a||!b) return;
      S.P.learn.plans.push({lesson:L.id,i:a,t:b,made:today(),fired:null}); LS.planSaved=true; touch(); lessonGo(7); };
    const sb=btn("Save plan",save,"",!(ifV&&thV)); sb.id="saveplan";
    actions=[btn("Skip",()=>{ LS.planSaved=false; lessonGo(7); },"ghost"),sb];
  }
  else if(step==="done"){
    const n=nDone(c), total=c.lessons.length, nx=nextLesson(c), other=COURSES.find(x=>x.id!==c.id&&lessonAvailable(x));
    const parts=[h("div",{class:"end-top"},h("div",{class:"bigcheck","aria-hidden":"true",text:"✓"}),h("h2",{text:LS.review?"Review done.":"Lesson done."}))];
    if(!LS.review) parts.push(h("div",{class:"note"},h("b",{text:"2 cards added to your deck. "}),"First review tomorrow, then spaced out so they stick."));
    if(LS.planSaved) parts.push(h("div",{class:"note"},h("b",{text:"Plan saved. "}),"Tomorrow I’ll ask whether it fired."));
    parts.push(h("div",{class:"prog"},h("span",{class:"eyebrow",text:c.name+" · "+n+" of "+total}),h("div",{class:"pbar"},h("i",{style:"width:"+Math.round(n/total*100)+"%"}))));
    if(!LS.review) parts.push(h("p",{class:"small",text:nx?"Tomorrow: "+(nx.bonus?"Bonus":"Lesson "+(c.lessons.indexOf(nx)+1))+", “"+nx.t+"”.":"That was the last lesson in this course."}));
    if(isLate()) parts.push(h("div",{class:"note"},h("b",{text:"It’s "+clock()+". "}),L.sl));
    put(card,...parts);
    actions=[btn("Done",exitLesson)];
    if(other&&!isLate()&&!LS.review) actions.unshift(btn(other.short+" lesson",()=>{ lsSet("pp2.lesson",null); LS=null; startLesson(other.id,nextLesson(other).id,false); },"ghost"));
  }
  v.replaceChildren(top,card); setActions(actions); renderSeg();
}
function renderLearn(){
  const v=$("v-learn"); if(S.view!=="learn") return;
  if(!ready()){ v.replaceChildren(h("div",{class:"skel"})); return; }
  if(LS&&LS.lesson) renderLessonStep(); else renderLearnHome();
}
