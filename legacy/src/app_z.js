/* ---------- navigation, boot ---------- */
function rerender(){
  if(S.view==="play"){ if(D&&D.completed) renderEnd(); else if(!D||S.resting||!D.entries.length) renderPlay(); }
  else if(S.view==="puzzles"){ if(PZS.sub!=="pz") renderPuzzles(); }
  else if(S.view==="learn"){ if(!(LS&&LS.lesson)) renderLearn(); }
  else renderMe();
  renderChips();
}
const VIEWS=["play","learn","puzzles","me"];
function switchView(v){
  S.view=v; if(!(v==="puzzles"&&PZS.sub==="case")){ sheetOpen=false; renderSheet(); }
  VIEWS.forEach(x=>{ $("v-"+x).hidden=x!==v; $("tab-"+x).setAttribute("aria-selected",String(x===v)); });
  setActions([]);
  if(v==="play") renderPlay(); else if(v==="puzzles") renderPuzzles(); else if(v==="learn") renderLearn(); else renderMe();
  renderSeg(); renderChips(); if(v==="play") renderActions();
  window.scrollTo(0,0);
}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>{
  const v=b.dataset.v;
  if(v===S.view&&v==="puzzles"&&PZS.sub!=="hub"){ pzHub(); return; }
  if(v===S.view&&v==="learn"&&LS&&LS.lesson){ exitLesson(); return; }
  switchView(v);
}));
let ty=null, tx=null;
$("v-play").addEventListener("touchstart",ev=>{ const t=ev.touches[0]; ty=t.clientY; tx=t.clientX; },{passive:true});
$("v-play").addEventListener("touchend",ev=>{ if(ty==null) return; const t=ev.changedTouches[0], dy=t.clientY-ty, dx=t.clientX-tx; ty=null;
  const atBottom=window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-6;
  if(D&&D.phase==="fb"&&dy<-80&&Math.abs(dx)<60&&atBottom) next(); },{passive:true});
document.addEventListener("keydown",ev=>{
  if(ev.altKey||ev.ctrlKey||ev.metaKey) return;
  if(S.view==="puzzles"&&PZS.sub==="pz"&&PZS.cur&&!PZS.cur.st.done&&(PZS.cur.p.type==="sudoku"||PZS.cur.p.type==="calc")&&!(ev.target&&ev.target.tagName==="INPUT")){
    const c=PZS.cur, N=c.p.N, st=c.st;
    if(new RegExp("^[1-"+N+"]$").test(ev.key)){ ev.preventDefault(); latinInput(+ev.key); return; }
    if(ev.key==="Backspace"||ev.key==="Delete"||ev.key==="0"){ ev.preventDefault(); latinInput(0); return; }
    const mv={ArrowUp:-N,ArrowDown:N,ArrowLeft:-1,ArrowRight:1}[ev.key];
    if(mv){ ev.preventDefault(); let i=st.sel<0?0:st.sel+mv; if(i<0||i>=N*N) return; if((ev.key==="ArrowLeft"||ev.key==="ArrowRight")&&Math.floor(i/N)!==Math.floor((st.sel<0?0:st.sel)/N)) return; st.sel=i; savePz(); renderPuzzles(); const b=document.querySelector('.pzgrid [data-i="'+i+'"]'); if(b) b.focus({preventScroll:true}); }
    return;
  }
  if(S.view!=="play"||!D) return;
  if(D.phase==="q"&&/^[1-4]$/.test(ev.key)){ const i=+ev.key-1; if(cur()&&cur().opts&&i<cur().opts.length){ ev.preventDefault(); answer(i); } }
  else if(ev.key==="Enter"&&document.activeElement===document.body){ if(D.phase==="front") reveal(); else if(D.phase==="fb") next(); }
});
function maybeReady(){ if(S.cardsLoaded&&S.pLoaded&&!S.ready) afterLoad(); }
function afterLoad(){
  S.ready=true;
  try{ for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k&&k.indexOf("pp2.case.daily:")===0&&k.slice(15)<addDays(today(),-7)) localStorage.removeItem(k); } }catch(e){}
  freezeCheck(); switchView(S.view);
}
function genFromDoc(d){ const x=d.data()||{}; const it=Object.assign({},x,{id:"g-"+d.id}); if(it.t==="spot"){ if(!Array.isArray(x.msgs)) return null; it.msgs=x.msgs.map(m=>Array.isArray(m)?m:[m.w,m.x]); } if(it.t==="scenario"&&!Array.isArray(it.opts)) return null; return (it.t==="scenario"||it.t==="spot")?it:null; }
async function boot(){
  switchView("play");
  if(!window.claude||typeof window.claude.use!=="function"){
    S.mode="preview"; S.cards=PREVIEW_CARDS.map(c=>Object.assign({},c,{due:today()})); S.P=normalize(null); S.cardsLoaded=S.pLoaded=true;
    setStatus("Preview with example cards. Your real cards and progress load on the published page."); afterLoad(); return;
  }
  try{ db=await window.claude.use("db"); }catch(e){ db=null; }
  try{ sample=await window.claude.use("sample"); }catch(e){ sample=null; }
  if(!db){ S.mode="off"; S.cards=PREVIEW_CARDS.map(c=>Object.assign({},c,{due:today()})); S.P=normalize(null); S.cardsLoaded=S.pLoaded=true;
    setStatus("Practice mode: your saved progress can’t load in this view. Open Prime Pocket from your artifacts to save."); afterLoad(); return; }
  S.mode="live";
  db.collection("cards").onSnapshot(snap=>{ S.cards=snap.docs.map(d=>Object.assign({id:d.id},d.data())); if(!S.cardsLoaded){ S.cardsLoaded=true; maybeReady(); } else if(S.view==="me") renderMe(); },
    e=>{ logErr("cardsSub",e); setStatus("Your cards stopped syncing. Reload the page."); if(!S.cardsLoaded){ S.cardsLoaded=true; maybeReady(); } });
  db.collection("content").onSnapshot(snap=>{ S.gen=snap.docs.map(genFromDoc).filter(Boolean); if(S.ready&&S.view!=="play") rerender(); }, e=>logErr("contentSub",e));
  db.doc("progress/main").onSnapshot(snap=>{
    const remote=snap.exists?snap.data():null;
    if(!S.pLoaded){ S.P=normalize(remote); S.pLoaded=true; maybeReady(); }
    else if(!dirty&&!saving&&remote){ S.P=normalize(remote); renderChips(); if(S.view==="me") renderMe(); else if(S.view==="learn"&&!(LS&&LS.lesson)) renderLearn(); }
  }, e=>{ logErr("progressSub",e); setStatus("Progress stopped syncing. Reload the page."); if(!S.pLoaded){ S.pLoaded=true; maybeReady(); } });
}
if(window.__PP_TEST) window.__pp={S,PZS,get LS(){ return LS; },startLesson,openPuzzle,COURSES,today,latinInput,pzHub};
boot();
})();
