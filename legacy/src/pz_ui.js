
/* ---------- puzzles: hub, player, boards ---------- */
const PZS={sub:"hub",cur:null,busy:false};
const PZ_ORDER=["sudoku","crowns","sunmoon","path","calc"];
const PZ_ROT=[["sudoku","hard"],["sudoku","easy"],["sunmoon","easy"],["path","medium"],["crowns","medium"],["calc","medium"],["crowns","hard"]];
const PZ_DIFFS={sudoku:["easy","medium","hard"],crowns:["easy","medium","hard"],sunmoon:["easy","hard"],path:["easy","medium","hard"],calc:["easy","medium","hard"]};
const DLABEL={easy:"Easy",medium:"Medium",hard:"Hard"};
const PZ_SHORT={sudoku:"Fill 1–6, no repeats",crowns:"One crown per row, column and colour",sunmoon:"Balance suns and moons",path:"One line through every cell",calc:"Hit each group’s target"};
const SUN='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5" fill="var(--sun)"/><g stroke="var(--sun)" stroke-width="2" stroke-linecap="round"><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.5 1.5M17.2 17.2l1.5 1.5M5.3 18.7l1.5-1.5M17.2 6.8l1.5-1.5"/></g></svg>';
const MOON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 3.5a8.5 8.5 0 1 0 5 13.4A7 7 0 0 1 15.5 3.5z" fill="var(--moon)"/></svg>';
const CROWN='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 8l4.2 3.6L12 5l4.3 6.6L20.5 8l-1.8 10H5.3z" fill="var(--ink)" stroke="var(--ink)" stroke-width="1.2" stroke-linejoin="round"/></svg>';
const PZ_IC={
  sudoku:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><path d="M12 3.5v17M3.5 9.2h17M3.5 14.8h17"/></svg>',
  crowns:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.5 8l4.2 3.6L12 5l4.3 6.6L20.5 8l-1.8 10H5.3z"/></svg>',
  sunmoon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="9" r="3.2"/><path d="M8 3v1.2M8 13.8V15M2 9h1.2M12.8 9H14"/><path d="M18.5 12.5a4.5 4.5 0 1 0 2.5 7.4 3.7 3.7 0 0 1-2.5-7.4z" fill="currentColor"/></svg>',
  path:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 5h14v5H5v5h14v4"/><circle cx="5" cy="5" r="2" fill="currentColor"/><circle cx="19" cy="19" r="2" fill="currentColor"/></svg>',
  calc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><path d="M7.5 9h4M9.5 7v4M13.5 15h4M7.5 15l3 0"/></svg>'
};
function fmtSecs(s){ s=Math.max(0,Math.round(s||0)); return Math.floor(s/60)+":"+pad(s%60); }
function dailyPzSpec(d){
  const st=S.P.pzd[d]; if(st&&st.type) return {type:st.type,diff:st.diff,seed:PZ.hash("daily:"+d+":"+st.type+":"+st.diff)};
  const wd=new Date(d+"T00:00:00").getDay(); let type=PZ_ROT[wd][0], diff=PZ_ROT[wd][1];
  if(!((S.P.pzs[type]||{}).solved>0)) diff="easy";
  return {type,diff,seed:PZ.hash("daily:"+d+":"+type+":"+diff)};
}
function pzKey(spec,daily){ return daily?"pzd:"+today():"pzp:"+spec.type+":"+spec.diff+":"+spec.seed; }
function backRow(){ return h("button",{class:"back",type:"button",onclick:pzHub},"‹ Puzzles"); }
function pzHub(){ PZS.sub="hub"; sheetOpen=false; renderSheet(); renderPuzzles(); window.scrollTo(0,0); }
function openCase(){ PZS.sub="case"; if(S.view!=="puzzles") switchView("puzzles"); else { renderPuzzles(); window.scrollTo(0,0); } }
function extraCase(){ PZS.sub="case"; nextExtra(); }
function freshPz(p){
  const st={hints:0,done:false,secs:0,acc:0,last:Date.now(),msg:"",hinted:[]};
  if(p.type==="sudoku"){ st.g=p.givens.slice(); st.notes=new Array(36).fill(0); st.sel=-1; st.notesMode=false; }
  else if(p.type==="calc"){ st.g=new Array(p.N*p.N).fill(0); st.notes=new Array(p.N*p.N).fill(0); st.sel=-1; st.notesMode=false; }
  else if(p.type==="crowns"){ st.c=new Array(p.N*p.N).fill(0); }
  else if(p.type==="sunmoon"){ st.g=p.given.slice(); }
  else if(p.type==="path"){ st.path=[]; }
  return st;
}
function openPuzzle(spec,daily){
  if(daily&&!S.P.pzd[today()]){ S.P.pzd[today()]={type:spec.type,diff:spec.diff}; touch(); }
  PZS.sub="pz"; PZS.busy=true; PZS.cur=null; if(S.view!=="puzzles") switchView("puzzles"); else renderPuzzles(); window.scrollTo(0,0);
  setTimeout(()=>{
    let p=null, seed=spec.seed;
    for(let k=0;k<6&&!p;k++){ p=PZ.generate(spec.type,{seed:seed,diff:spec.diff}); if(!p) seed=(seed+7919)>>>0; }
    PZS.busy=false;
    if(!p){ PZS.sub="hub"; toast("Couldn’t build that puzzle. Try another."); renderPuzzles(); return; }
    spec=Object.assign({},spec,{seed});
    const key=pzKey(spec,daily); let st=lsGet("pp2.pz."+key);
    if(!st||typeof st!=="object") st=freshPz(p);
    if(daily&&(S.P.pzd[today()]||{}).result==="solved"&&!st.done){ st.done=true; st.secs=S.P.pzd[today()].secs||0; st.hints=S.P.pzd[today()].hints||0; fillSolution(p,st); }
    st.last=Date.now();
    PZS.cur={key,spec,daily,p,st};
    if(!daily) lsSet("pp2.pzcur",{spec,key});
    renderPuzzles();
  },30);
}
function savePz(){ const c=PZS.cur; if(c) lsSet("pp2.pz."+c.key,c.st); }
function tick(st){ const now=Date.now(); st.acc+=Math.min(Math.max(0,now-(st.last||now)),60000); st.last=now; }
function fillSolution(p,st){
  if(p.type==="sudoku"||p.type==="calc"){ st.g=p.solution.slice(); st.notes=st.g.map(()=>0); st.sel=-1; }
  else if(p.type==="crowns"){ st.c=new Array(p.N*p.N).fill(0); p.solution.forEach((col,r)=>st.c[r*p.N+col]=2); }
  else if(p.type==="sunmoon") st.g=p.solution.slice();
  else if(p.type==="path") st.path=p.solution.slice();
}

/* ----- rule-based conflicts (never compared with the stored answer) ----- */
function latinUnitsFor(p){
  const N=p.N, units=[];
  for(let r=0;r<N;r++) units.push([...Array(N).keys()].map(c=>r*N+c));
  for(let c=0;c<N;c++) units.push([...Array(N).keys()].map(r=>r*N+c));
  if(p.type==="sudoku") for(let br=0;br<N;br+=p.br) for(let bc=0;bc<N;bc+=p.bc){ const u=[]; for(let r=br;r<br+p.br;r++) for(let c=bc;c<bc+p.bc;c++) u.push(r*N+c); units.push(u); }
  return units;
}
function latinConflicts(p,g){
  const bad=new Set();
  for(const u of latinUnitsFor(p)){ const seen={}; for(const i of u){ const v=g[i]; if(!v) continue; (seen[v]=seen[v]||[]).push(i); } for(const v in seen) if(seen[v].length>1) seen[v].forEach(i=>bad.add(i)); }
  return bad;
}
function cageOk(cg,g){
  const v=cg.cells.map(i=>g[i]); if(v.some(x=>!x)) return null;
  if(cg.op==="") return v[0]===cg.target; if(cg.op==="+") return v.reduce((s,x)=>s+x,0)===cg.target; if(cg.op==="×") return v.reduce((s,x)=>s*x,1)===cg.target;
  if(cg.op==="−") return Math.abs(v[0]-v[1])===cg.target; return Math.max(...v)/Math.min(...v)===cg.target;
}
function crownConflicts(p,c){
  const N=p.N, cr=[]; c.forEach((v,i)=>{ if(v===2) cr.push(i); }); const bad=new Set();
  for(const a of cr) for(const b of cr){ if(a>=b) continue; const ar=Math.floor(a/N), ac=a%N, br=Math.floor(b/N), bc=b%N;
    if(ar===br||ac===bc||p.region[a]===p.region[b]||(Math.abs(ar-br)<=1&&Math.abs(ac-bc)<=1)){ bad.add(a); bad.add(b); } }
  return bad;
}
function smConflicts(p,g){
  const bad=new Set();
  for(let k=0;k<6;k++){
    const lines=[[0,1,2,3,4,5].map(q=>k*6+q),[0,1,2,3,4,5].map(q=>q*6+k)];
    for(const L of lines){
      for(const val of [0,1]){ const cells=L.filter(i=>g[i]===val); if(cells.length>3) cells.forEach(i=>bad.add(i)); }
      for(let q=0;q+2<6;q++){ const a=g[L[q]], b=g[L[q+1]], c=g[L[q+2]]; if(a>=0&&a===b&&b===c){ bad.add(L[q]); bad.add(L[q+1]); bad.add(L[q+2]); } }
    }
  }
  for(let r=0;r<6;r++) for(let c=0;c<5;c++){ const s=p.hs[r*5+c], a=g[r*6+c], b=g[r*6+c+1]; if(s&&a>=0&&b>=0&&(s===1)!==(a===b)){ bad.add(r*6+c); bad.add(r*6+c+1); } }
  for(let r=0;r<5;r++) for(let c=0;c<6;c++){ const s=p.vs[r*6+c], a=g[r*6+c], b=g[(r+1)*6+c]; if(s&&a>=0&&b>=0&&(s===1)!==(a===b)){ bad.add(r*6+c); bad.add((r+1)*6+c); } }
  return bad;
}

/* ----- winning ----- */
function pzComplete(p,st){
  if(p.type==="sudoku"||p.type==="calc") return st.g.every(v=>v>0);
  if(p.type==="crowns") return st.c.filter(v=>v===2).length===p.N;
  if(p.type==="sunmoon") return st.g.every(v=>v>=0);
  return st.path.length===p.R*p.C;
}
function pzCheck(p,st){
  const T=PZ.TYPES[p.type];
  if(p.type==="crowns"){ const cr=[]; st.c.forEach((v,i)=>{ if(v===2) cr.push(i); }); return T.check(p,cr); }
  if(p.type==="path") return T.check(p,st.path);
  return T.check(p,st.g);
}
function afterMove(){
  const c=PZS.cur, p=c.p, st=c.st; tick(st); st.msg="";
  if(pzComplete(p,st)){
    if(pzCheck(p,st)) return pzSolved();
    st.msg=p.type==="path"?"Every cell is covered, but the numbers aren’t visited in order.":"Board full, but something breaks a rule. Look for the red.";
  }
  savePz(); renderPuzzles();
}
function pzSolved(){
  const c=PZS.cur, p=c.p, st=c.st; st.done=true; st.secs=Math.round(st.acc/1000); st.sel=-1;
  const rec=S.P.pzs[p.type]||(S.P.pzs[p.type]={solved:0,best:{}}); rec.solved=(rec.solved||0)+1; rec.best=rec.best||{};
  st.best=!(rec.best[p.diff]>0)||st.secs<rec.best[p.diff]; if(st.hints===0&&st.best) rec.best[p.diff]=st.secs;
  if(c.daily) S.P.pzd[today()]=Object.assign(S.P.pzd[today()]||{},{type:p.type,diff:p.diff,result:"solved",secs:st.secs,hints:st.hints});
  dayRec().puzzles=(dayRec().puzzles||0)+1;
  if(!c.daily) lsSet("pp2.pzcur",null);
  touch(); savePz(); renderPuzzles(); renderChips();
}

/* ----- hints: fix one wrong thing, else give one safe move ----- */
function pzHint(){
  const c=PZS.cur, p=c.p, st=c.st; if(st.done) return;
  if(p.type==="sudoku"||p.type==="calc"){
    const N=p.N, given=i=>p.type==="sudoku"&&p.givens[i]>0;
    let target=st.g.findIndex((v,i)=>v>0&&!given(i)&&v!==p.solution[i]);
    if(target<0){
      const units=latinUnitsFor(p), peers=i=>{ const s=new Set(); units.forEach(u=>{ if(u.includes(i)) u.forEach(j=>s.add(j)); }); s.delete(i); return [...s]; };
      let best=99; st.g.forEach((v,i)=>{ if(v) return; const used=new Set(peers(i).map(j=>st.g[j]).filter(Boolean)); const n=N-used.size; if(n<best){ best=n; target=i; } });
    }
    if(target<0) return;
    const was=st.g[target]; st.g[target]=p.solution[target]; st.notes[target]=0; st.sel=target; if(!st.hinted.includes(target)) st.hinted.push(target);
    st.hints++; afterMove(); if(!st.done){ st.msg=was?"Fixed one cell that didn’t fit.":"Filled the cell with the fewest options."; savePz(); renderPuzzles(); }
    return;
  }
  if(p.type==="sunmoon"){
    let target=st.g.findIndex((v,i)=>v>=0&&p.given[i]<0&&v!==p.solution[i]);
    if(target<0){ let best=-1; for(let i=0;i<36;i++){ if(st.g[i]>=0) continue; const r=Math.floor(i/6), cc=i%6; let n=0; for(let q=0;q<6;q++){ if(st.g[r*6+q]>=0) n++; if(st.g[q*6+cc]>=0) n++; } if(n>best){ best=n; target=i; } } }
    if(target<0) return;
    const was=st.g[target]; st.g[target]=p.solution[target]; if(!st.hinted.includes(target)) st.hinted.push(target);
    st.hints++; afterMove(); if(!st.done){ st.msg=was>=0?"Flipped one cell that was wrong.":"Filled one cell for you."; savePz(); renderPuzzles(); }
    return;
  }
  if(p.type==="crowns"){
    const N=p.N, sol=new Set(p.solution.map((col,r)=>r*N+col));
    const wrong=st.c.findIndex((v,i)=>v===2&&!sol.has(i));
    st.hints++;
    if(wrong>=0){ st.c[wrong]=1; afterMove(); if(!st.done){ st.msg="Removed a crown that can’t be right."; savePz(); renderPuzzles(); } return; }
    const sizes={}; p.region.forEach(r=>sizes[r]=(sizes[r]||0)+1);
    const rows=[...Array(N).keys()].filter(r=>st.c[r*N+p.solution[r]]!==2).sort((a,b)=>sizes[p.region[a*N+p.solution[a]]]-sizes[p.region[b*N+p.solution[b]]]);
    if(!rows.length) return; const cell=rows[0]*N+p.solution[rows[0]]; st.c[cell]=2; if(!st.hinted.includes(cell)) st.hinted.push(cell);
    afterMove(); if(!st.done){ st.msg="Placed one crown, in the smallest colour that was still open."; savePz(); renderPuzzles(); }
    return;
  }
  if(p.type==="path"){
    const sol=p.solution; let k=0; while(k<st.path.length&&st.path[k]===sol[k]) k++;
    const wpIdx=p.waypoints.map(w=>sol.indexOf(w)).sort((a,b)=>a-b);
    const nextW=wpIdx.find(x=>x>=Math.max(k,1))||sol.length-1;
    st.path=sol.slice(0,nextW+1); st.hints++;
    afterMove(); if(!st.done){ st.msg=k<st.path.length&&k<sol.length&&k>0?"Kept the correct part of your line and drew it to the next number.":"Drew the line to the next number."; savePz(); renderPuzzles(); }
  }
}
function pzRestart(){ const c=PZS.cur; if(!c||c.st.done) return; const f=freshPz(c.p); f.acc=c.st.acc; f.hints=c.st.hints; c.st=f; savePz(); renderPuzzles(); }

/* ----- boards ----- */
function cellBorders(N,i,groupOf){
  const r=Math.floor(i/N), c=i%N, g=groupOf(i), cls=[];
  if(r>0&&groupOf(i-N)!==g) cls.push("bt"); if(r<N-1&&groupOf(i+N)!==g) cls.push("bb");
  if(c>0&&groupOf(i-1)!==g) cls.push("bl"); if(c<N-1&&groupOf(i+1)!==g) cls.push("br");
  return cls.join(" ");
}
function latinBoard(){
  const c=PZS.cur, p=c.p, st=c.st, N=p.N, bad=latinConflicts(p,st.g);
  const groupOf=p.type==="sudoku"?(i=>Math.floor(Math.floor(i/N)/p.br)*10+Math.floor((i%N)/p.bc)):(()=>{ const m=new Array(N*N); p.cages.forEach((cg,k)=>cg.cells.forEach(x=>m[x]=k)); return i=>m[i]; })();
  const labels={}, badCage=new Set();
  if(p.type==="calc") p.cages.forEach(cg=>{ const first=Math.min(...cg.cells); labels[first]=cg.target+(cg.op||""); if(cageOk(cg,st.g)===false) badCage.add(first); });
  const sel=st.sel, sr=sel>=0?Math.floor(sel/N):-1, sc=sel>=0?sel%N:-1, sg=sel>=0?groupOf(sel):null, sv=sel>=0?st.g[sel]:0;
  const grid=h("div",{class:"pzgrid latin n"+N,style:"grid-template-columns:repeat("+N+",1fr)",role:"grid","aria-label":PZ.TYPES[p.type].name+" board"});
  for(let i=0;i<N*N;i++){
    const r=Math.floor(i/N), col=i%N, given=p.type==="sudoku"&&p.givens[i]>0, v=st.g[i];
    let cls="pc "+cellBorders(N,i,groupOf);
    if(given) cls+=" given"; if(i===sel) cls+=" sel"; else if(sel>=0&&(r===sr||col===sc||(p.type==="sudoku"&&groupOf(i)===sg))) cls+=" peer";
    if(v&&sv&&v===sv&&i!==sel) cls+=" same"; if(bad.has(i)) cls+=" err"; if(st.hinted.includes(i)) cls+=" hinted";
    const kids=[];
    if(labels[i]!=null) kids.push(h("span",{class:"cl"+(badCage.has(i)?" bad":""),text:labels[i]}));
    if(v) kids.push(h("span",{class:"v",text:String(v)}));
    else if(st.notes[i]){ const nb=h("span",{class:"notes n"+N}); for(let d=1;d<=N;d++) nb.append(h("i",{text:(st.notes[i]>>d)&1?String(d):""})); kids.push(nb); }
    grid.append(h("button",{class:cls,type:"button","data-i":String(i),"aria-label":"Row "+(r+1)+", column "+(col+1)+(v?": "+v:": empty")+(labels[i]?", group "+labels[i]:""),disabled:st.done,onclick:()=>{ if(given) { st.sel=i; } else st.sel=(st.sel===i?-1:i); savePz(); renderPuzzles(); }},...kids));
  }
  return grid;
}
function latinInput(d){
  const c=PZS.cur, p=c.p, st=c.st, i=st.sel; if(st.done||i<0) return;
  if(p.type==="sudoku"&&p.givens[i]>0) return;
  if(d===0){ st.g[i]=0; st.notes[i]=0; afterMove(); return; }
  if(st.notesMode&&!st.g[i]){ st.notes[i]^=(1<<d); savePz(); renderPuzzles(); return; }
  st.g[i]=st.g[i]===d?0:d; st.notes[i]=0;
  if(st.g[i]){ const N=p.N; latinUnitsFor(p).forEach(u=>{ if(u.includes(i)) u.forEach(j=>{ st.notes[j]&=~(1<<d); }); }); }
  afterMove();
}
function latinPad(){
  const c=PZS.cur, p=c.p, st=c.st, N=p.N;
  const pad_=h("div",{class:"numpad n"+N});
  for(let d=1;d<=N;d++) pad_.append(h("button",{type:"button",class:"nk",onclick:()=>latinInput(d),"aria-label":"Enter "+d},String(d)));
  const tools=h("div",{class:"tools pztools"},
    h("button",{type:"button","aria-pressed":String(!!st.notesMode),class:st.notesMode?"on":"",onclick:()=>{ st.notesMode=!st.notesMode; savePz(); renderPuzzles(); }},st.notesMode?"Notes: on":"Notes: off"),
    h("button",{type:"button",onclick:()=>latinInput(0)},"Erase"),
    h("button",{type:"button",onclick:pzHint},"Hint"),
    h("button",{type:"button",onclick:pzRestart},"Restart"));
  return h("div",{class:"pzctl"},st.sel<0?h("p",{class:"small muted",text:"Tap a cell, then a number."}):null,pad_,tools);
}
function crownsBoard(){
  const c=PZS.cur, p=c.p, st=c.st, N=p.N, bad=crownConflicts(p,st.c);
  const grid=h("div",{class:"pzgrid crowns",style:"grid-template-columns:repeat("+N+",1fr)",role:"grid","aria-label":"Crowns board"});
  for(let i=0;i<N*N;i++){
    const v=st.c[i], r=Math.floor(i/N), col=i%N;
    const cls="pc rg "+cellBorders(N,i,j=>p.region[j])+(bad.has(i)?" err":"")+(st.hinted.includes(i)&&v===2?" hinted":"");
    grid.append(h("button",{class:cls,type:"button",style:"background:var(--r"+p.region[i]+")","aria-label":"Row "+(r+1)+", column "+(col+1)+": "+(v===2?"crown":v===1?"marked no":"empty"),disabled:st.done,
      onclick:()=>{ st.c[i]=(v+1)%3; afterMove(); }},v===2?h("span",{class:"ic crown",html:CROWN}):v===1?h("span",{class:"xm",text:"×"}):null));
  }
  return grid;
}
function crownsCtl(){
  const st=PZS.cur.st;
  return h("div",{class:"pzctl"},h("p",{class:"small muted",text:"Tap once for × (no crown here), twice for a crown, a third time to clear."}),
    h("div",{class:"tools pztools"},h("button",{type:"button",onclick:pzHint},"Hint"),h("button",{type:"button",onclick:pzRestart},"Restart")));
}
function sunmoonBoard(){
  const c=PZS.cur, p=c.p, st=c.st, bad=smConflicts(p,st.g);
  const wrap=h("div",{class:"smwrap"});
  const grid=h("div",{class:"pzgrid sunmoon",style:"grid-template-columns:repeat(6,1fr)",role:"grid","aria-label":"Sun and Moon board"});
  for(let i=0;i<36;i++){
    const v=st.g[i], given=p.given[i]>=0, r=Math.floor(i/6), col=i%6;
    grid.append(h("button",{class:"pc"+(given?" given":"")+(bad.has(i)?" err":"")+(st.hinted.includes(i)?" hinted":""),type:"button","aria-label":"Row "+(r+1)+", column "+(col+1)+": "+(v===1?"sun":v===0?"moon":"empty")+(given?" (given)":""),disabled:st.done||given,
      onclick:()=>{ st.g[i]=v<0?1:v===1?0:-1; afterMove(); }},v===1?h("span",{class:"ic sm",html:SUN}):v===0?h("span",{class:"ic sm",html:MOON}):null));
  }
  wrap.append(grid);
  for(let r=0;r<6;r++) for(let cc=0;cc<5;cc++){ const s=p.hs[r*5+cc]; if(s) wrap.append(h("span",{class:"sign","aria-hidden":"true",style:"left:"+((cc+1)/6*100)+"%;top:"+((r+0.5)/6*100)+"%",text:s===1?"=":"×"})); }
  for(let r=0;r<5;r++) for(let cc=0;cc<6;cc++){ const s=p.vs[r*6+cc]; if(s) wrap.append(h("span",{class:"sign","aria-hidden":"true",style:"left:"+((cc+0.5)/6*100)+"%;top:"+((r+1)/6*100)+"%",text:s===1?"=":"×"})); }
  return wrap;
}
function sunmoonCtl(){
  return h("div",{class:"pzctl"},h("p",{class:"small muted",text:"Tap once for a sun, twice for a moon, a third time to clear."}),
    h("div",{class:"tools pztools"},h("button",{type:"button",onclick:pzHint},"Hint"),h("button",{type:"button",onclick:pzRestart},"Restart")));
}
/* Number Path: drag (or tap) from 1. The board element stays put while drawing so pointer capture survives. */
let PATHDRAG=null;
function pathBoard(){
  const c=PZS.cur, p=c.p, st=c.st, R=p.R, C=p.C;
  const wrap=h("div",{class:"pathwrap",style:"aspect-ratio:"+C+"/"+R});
  const grid=h("div",{class:"pzgrid path",style:"grid-template-columns:repeat("+C+",1fr)"});
  const cells=[];
  for(let i=0;i<R*C;i++){ const w=p.waypoints.indexOf(i); const cell=h("div",{class:"pc pcell","data-i":String(i)},w>=0?h("span",{class:"wp",text:String(w+1)}):null); cells.push(cell); grid.append(cell); }
  const svg=svgEl("svg",{viewBox:"0 0 "+(C*100)+" "+(R*100),class:"pathsvg","aria-hidden":"true",preserveAspectRatio:"none"});
  const line=svgEl("polyline",{fill:"none",stroke:"var(--path)","stroke-width":"38","stroke-linecap":"round","stroke-linejoin":"round",points:""}); svg.append(line);
  wrap.append(grid,svg);
  const paint=()=>{
    const on=new Set(st.path), head=st.path[st.path.length-1];
    cells.forEach((el,i)=>{ el.className="pc pcell"+(on.has(i)?" on":"")+(i===head?" head":"")+(p.waypoints.includes(i)?" wpc":""); });
    line.setAttribute("points",st.path.map(i=>((i%C)*100+50)+","+(Math.floor(i/C)*100+50)).join(" "));
    const nxt=p.waypoints.filter(w=>on.has(w)).length; const m=wrap.parentNode&&wrap.parentNode.querySelector(".pathmsg");
    if(m) m.textContent=st.done?"":st.path.length?("Covered "+st.path.length+" of "+(R*C)+" cells · next number: "+(nxt<p.waypoints.length?nxt+1:"–")):"Start on 1 and drag through every cell.";
  };
  const cellAt=(x,y)=>{ const b=grid.getBoundingClientRect(); const cc=Math.floor((x-b.left)/b.width*C), rr=Math.floor((y-b.top)/b.height*R); return (cc<0||rr<0||cc>=C||rr>=R)?-1:rr*C+cc; };
  const adj=(a,b)=>Math.abs(Math.floor(a/C)-Math.floor(b/C))+Math.abs(a%C-b%C)===1;
  const allowed=i=>{ const w=p.waypoints.indexOf(i); if(w<0) return true; const nxt=p.waypoints.filter(x=>st.path.includes(x)).length; if(w!==nxt) return false; if(w===p.waypoints.length-1&&st.path.length!==R*C-1) return false; return true; };
  const step=i=>{
    if(i<0) return false; const L=st.path.length, last=st.path[L-1];
    if(L>=2&&i===st.path[L-2]){ st.path.pop(); return true; }
    if(L&&i!==last&&adj(last,i)&&!st.path.includes(i)&&allowed(i)){ st.path.push(i); return true; }
    return false;
  };
  const down=ev=>{
    if(st.done) return; const i=cellAt(ev.clientX,ev.clientY); if(i<0) return;
    const at=st.path.indexOf(i);
    if(at>=0) st.path=st.path.slice(0,at+1);
    else if(!st.path.length||i===p.waypoints[0]){ if(i!==p.waypoints[0]){ flashMsg("Start on 1."); return; } st.path=[i]; }
    else if(!step(i)){ flashMsg("Draw from the end of your line."); return; }
    PATHDRAG={id:ev.pointerId}; try{ wrap.setPointerCapture(ev.pointerId); }catch(e){} ev.preventDefault(); paint();
  };
  const move=ev=>{ if(!PATHDRAG||PATHDRAG.id!==ev.pointerId) return; const i=cellAt(ev.clientX,ev.clientY); if(step(i)) paint(); };
  const up=ev=>{ if(!PATHDRAG) return; PATHDRAG=null; afterMove(); };
  wrap.addEventListener("pointerdown",down); wrap.addEventListener("pointermove",move); wrap.addEventListener("pointerup",up); wrap.addEventListener("pointercancel",up);
  setTimeout(paint,0);
  return wrap;
}
function flashMsg(t){ const m=document.querySelector(".pathmsg"); if(m){ m.textContent=t; m.classList.add("warn"); setTimeout(()=>m.classList.remove("warn"),900); } }
function pathCtl(){
  const st=PZS.cur.st;
  return h("div",{class:"pzctl"},h("p",{class:"small muted pathmsg",text:""}),
    h("div",{class:"tools pztools"},h("button",{type:"button",onclick:()=>{ if(st.path.length>1){ st.path.pop(); afterMove(); } }},"Undo"),h("button",{type:"button",onclick:pzHint},"Hint"),h("button",{type:"button",onclick:pzRestart},"Restart")));
}

/* ----- views ----- */
function pzResult(){
  const c=PZS.cur, p=c.p, st=c.st, name=PZ.TYPES[p.type].name, rec=S.P.pzs[p.type]||{};
  const share="Prime Pocket · "+name+" ("+DLABEL[p.diff]+") · "+fmtSecs(st.secs)+" · "+(st.hints?st.hints+" hint"+(st.hints===1?"":"s"):"no hints");
  const box=h("div",{class:"cbox"},h("h2",{text:"Solved."}),
    h("div",{class:"fb ok"},h("div",{class:"meta"},h("span",{text:"Time "+fmtSecs(st.secs)}),h("span",{text:st.hints?st.hints+(st.hints===1?" hint":" hints"):"no hints"}),rec.best&&rec.best[p.diff]?h("span",{text:"Best "+DLABEL[p.diff].toLowerCase()+" "+fmtSecs(rec.best[p.diff])}):null,h("span",{text:name+" solved: "+(rec.solved||1)}))));
  if(st.best&&st.hints===0&&(rec.solved||0)>1) box.append(h("p",{class:"small",text:"New best time for "+DLABEL[p.diff].toLowerCase()+"."}));
  if(isLate()) box.append(h("div",{class:"note"},h("b",{text:"It’s "+clock()+". "}),"Good place to stop. The puzzle will be here tomorrow; sleep is where today’s learning gets stored."));
  const copy=h("button",{class:"hintbtn",type:"button",onclick:async()=>{ try{ await navigator.clipboard.writeText(share); toast("Copied: "+share); }catch(e){ toast(share); } }},"Copy result");
  const nextP=()=>openPuzzle({type:p.type,diff:p.diff,seed:(Math.random()*4294967295)>>>0},false);
  box.append(copy,h("div",{style:"display:grid;gap:8px"},btn(c.daily?"Practise more "+name:"Next "+name+" ("+DLABEL[p.diff].toLowerCase()+")",nextP),btn("Back to puzzles",pzHub,"ghost")));
  return box;
}
function renderPuzzle(){
  const v=$("v-puzzles");
  if(PZS.busy||!PZS.cur){ v.replaceChildren(backRow(),h("div",{class:"cbox"},h("p",{class:"muted",text:"Building your puzzle…"}),h("div",{class:"skel",style:"height:260px"}))); setActions([]); return; }
  const c=PZS.cur, p=c.p, st=c.st, T=PZ.TYPES[p.type], first=!((S.P.pzs[p.type]||{}).solved>0);
  const head_=h("div",{class:"cbox pzhead"},h("div",{class:"case-meta"},h("span",{class:"eyebrow",text:c.daily?"Puzzle of the day · "+fmtDay(today()):"Practice"}),h("span",{class:"pill "+p.diff,text:DLABEL[p.diff]}),st.done?h("span",{class:"pill done",text:"Solved"}):null),
    h("h2",{text:T.name}));
  const how=h("details",{class:"howto"},h("summary",{text:"How to play"}),h("p",{text:T.rule}),p.type==="calc"?h("p",{class:"small",text:"Example: a group marked 6× with two cells could be 2 and 3, or 1 and 6. A single cell with no sign is just that number."}):null);
  if(first&&!st.done) how.open=true;
  head_.append(how);
  let board, ctl;
  if(p.type==="sudoku"||p.type==="calc"){ board=latinBoard(); ctl=st.done?null:latinPad(); }
  else if(p.type==="crowns"){ board=crownsBoard(); ctl=st.done?null:crownsCtl(); }
  else if(p.type==="sunmoon"){ board=sunmoonBoard(); ctl=st.done?null:sunmoonCtl(); }
  else { board=pathBoard(); ctl=st.done?null:pathCtl(); }
  const boardBox=h("div",{class:"cbox pzboard t-"+p.type},board,ctl,st.msg?h("p",{class:"small pzmsg",text:st.msg}):null);
  v.replaceChildren(...[backRow(),head_,boardBox,st.done?pzResult():null].filter(Boolean));
  setActions([]);
}
function pzStatusText(type){ const r=S.P.pzs[type]||{}; if(!r.solved) return "New"; const b=r.best||{}; const bs=["easy","medium","hard"].filter(d=>b[d]>0).map(d=>DLABEL[d][0]+" "+fmtSecs(b[d])).join(" · "); return "Solved "+r.solved+(bs?" · best "+bs:""); }
function renderHub(){
  const v=$("v-puzzles"), t=today(), cs=S.P.cases["daily:"+t]||{}, dspec=dailyPzSpec(t), dres=S.P.pzd[t]||{};
  const caseDiff=cs.diff||((S.P.casesDone||0)<3?"easy":CaseGen.dailyDiff(t));
  const tile=(ic,title,sub,status,doneFlag,fn)=>h("button",{class:"ptile"+(doneFlag?" done":""),type:"button",onclick:fn},h("span",{class:"pic",html:ic}),h("span",{class:"pt"},h("b",{text:title}),h("small",{text:sub})),h("span",{class:"pill "+(doneFlag?"done":"new"),text:status}));
  const today_=h("div",{class:"cbox"},h("div",{class:"case-meta"},h("span",{class:"eyebrow",text:"Today · "+fmtDay(t)}),h("span",{class:"small muted",text:"New ones at 5 am"})),
    tile(IC.mystery,"Case of the day","Logic-grid mystery · "+DLABEL[caseDiff],cs.result==="solved"?"Solved":cs.result?"Revealed":"Play",!!cs.result,()=>{ PZS.sub="case"; CS=null; lsSet("pp2.extra",null); if(S.view!=="puzzles") switchView("puzzles"); else { renderPuzzles(); window.scrollTo(0,0); } }),
    tile(PZ_IC[dspec.type],"Puzzle of the day",PZ.TYPES[dspec.type].name+" · "+DLABEL[dspec.diff],dres.result==="solved"?"Solved "+fmtSecs(dres.secs):"Play",dres.result==="solved",()=>openPuzzle(dspec,true)));
  const parts=[h("div",{class:"lhead"},h("h2",{text:"Puzzles"}),h("p",{class:"small muted",text:"Two daily puzzles, plus unlimited practice. Every board has exactly one answer you can reach by logic, no guessing."})),today_];
  const cur=lsGet("pp2.pzcur");
  if(cur&&cur.spec&&PZ.TYPES[cur.spec.type]){ const st=lsGet("pp2.pz."+cur.key); if(st&&!st.done) parts.push(h("div",{class:"cbox resume"},h("span",{class:"eyebrow",text:"In progress"}),btn("Continue "+PZ.TYPES[cur.spec.type].name+" ("+DLABEL[cur.spec.diff].toLowerCase()+")",()=>openPuzzle(cur.spec,false),"ghost"))); }
  const prac=h("div",{class:"cbox"},h("span",{class:"eyebrow",text:"Practice"}));
  PZ_ORDER.forEach(type=>{
    prac.append(h("div",{class:"prow"},h("span",{class:"pic",html:PZ_IC[type]}),h("div",{class:"pt"},h("b",{text:PZ.TYPES[type].name}),h("small",{text:PZ_SHORT[type]+" · "+pzStatusText(type)})),
      h("div",{class:"dbtns"},PZ_DIFFS[type].map(d=>h("button",{type:"button",class:"dbtn "+d,"aria-label":PZ.TYPES[type].name+", "+DLABEL[d],onclick:()=>openPuzzle({type,diff:d,seed:(Math.random()*4294967295)>>>0},false)},DLABEL[d])))));
  });
  parts.push(prac,h("div",{class:"cbox"},h("span",{class:"eyebrow",text:"More mysteries"}),btn("Play an extra case",extraCase,"ghost")));
  v.replaceChildren(...parts); setActions([]);
}
function renderPuzzles(){
  const v=$("v-puzzles"); if(S.view!=="puzzles") return;
  if(!ready()){ v.replaceChildren(h("div",{class:"skel"})); return; }
  if(PZS.sub==="case") return renderCases();
  sheetOpen=false; renderSheet();
  if(PZS.sub==="pz") return renderPuzzle();
  renderHub();
}
