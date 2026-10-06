/* ---------- Case files: Murdle-style deduction grids, generated and verified in code ---------- */
const CaseGen = (function(){
  const THEMES = [
    {key:"trophy", title:"The vanishing trophy",
     setup:"An hour before the prize ceremony, the hackathon trophy disappeared from the stage.",
     suspects:[["Rohan","team lead"],["Meera","designer"],["Kabir","rival coder"],["Isha","volunteer"]],
     items:["laptop bag","guitar case","tiffin box","cricket kit bag"],
     places:[["in","the CAD lab","CAD lab"],["in","the canteen","Canteen"],["in","the library","Library"],["in","the auditorium","Auditorium"]],
     itemQ:"Carried in", killPlace:"The trophy was hidden {pp}.", killItem:"The trophy was carried off in the {i}."},
    {key:"garba", title:"Silence at the garba",
     setup:"Halfway through Navratri garba in your society, someone cut the speaker cable and the music died.",
     suspects:[["Bhavesh","society secretary"],["Pooja","dance teacher"],["Nirav","DJ's helper"],["Hetal ben","snack stall owner"]],
     items:["scissors","wire cutter","kitchen knife","paper cutter"],
     places:[["at","the DJ booth","DJ booth"],["at","the snack stall","Snack stall"],["in","the parking lot","Parking"],["in","the society office","Office"]],
     itemQ:"Cut with", killPlace:"The cable was cut by someone {pp}.", killItem:"The cable was cut with the {i}."},
    {key:"haveli", title:"Poison at the haveli",
     setup:"Seth Dhanraj collapsed at his birthday dinner in an old Udaipur haveli. The doctor says poison. Four guests had the chance.",
     suspects:[["Vikram","the nephew"],["Lata","the singer"],["Munim-ji","the accountant"],["Bhola","the cook"]],
     items:["chai cup","kheer bowl","silver glass","paan box"],
     places:[["in","the courtyard","Courtyard"],["in","the library","Library"],["on","the rooftop","Rooftop"],["in","the kitchen","Kitchen"]],
     itemQ:"Poison in", killPlace:"The poison was added by someone {pp}.", killItem:"The poison was in the {i}."},
    {key:"leak", title:"The leaked strategy",
     setup:"Someone leaked the trading club's strategy file to a rival club the night before the inter-college contest.",
     suspects:[["Aditya","club treasurer"],["Sana","quant lead"],["Yash","new member"],["Priya","club president"]],
     items:["pen drive","spare phone","printout","hard disk"],
     places:[["in","the club room","Club room"],["in","the common room","Common room"],["at","the café","Café"],["in","the library","Library"]],
     itemQ:"Leaked on", killPlace:"The file was copied by someone {pp}.", killItem:"The file left the club on the {i}."},
    {key:"wedding", title:"The missing envelope box",
     setup:"During the pheras at your cousin's wedding, the box of gift envelopes vanished.",
     suspects:[["Paresh uncle","the bride's uncle"],["Sunny","the DJ"],["Komal","the cousin"],["Mahesh","the caterer"]],
     items:["shawl","shopping bag","backpack","gift hamper"],
     places:[["at","the mandap","Mandap"],["at","the buffet","Buffet"],["in","the parking","Parking"],["in","the bride's room","Bride's room"]],
     itemQ:"Hidden in", killPlace:"The box was taken by someone {pp}.", killItem:"The box was hidden under the {i}."},
    {key:"train", title:"Night train wallet",
     setup:"On the overnight Karnavati Express, a passenger's wallet vanished somewhere between Vadodara and Surat.",
     suspects:[["Dev","the student"],["Farida","the doctor"],["Gopal","the salesman"],["Tanvi","the backpacker"]],
     items:["newspaper","blanket","tiffin bag","laptop sleeve"],
     places:[["in","coach B2","Coach B2"],["in","the pantry car","Pantry car"],["at","the door","Door"],["in","coach A1","Coach A1"]],
     itemQ:"Hidden in", killPlace:"The wallet was lifted by someone {pp}.", killItem:"The wallet was hidden in the {i}."},
    {key:"fest", title:"The deleted posters",
     setup:"The night before printing, every poster file for the college fest was deleted from the shared drive.",
     suspects:[["Nikhil","design head"],["Riya","volunteer"],["Arjun","sponsorship lead"],["Anaya","social media lead"]],
     items:["borrowed laptop","tablet","phone","pen drive"],
     places:[["in","the design room","Design room"],["in","the hostel","Hostel"],["in","the canteen","Canteen"],["at","the print shop","Print shop"]],
     itemQ:"Deleted from", killPlace:"The files were deleted by someone {pp}.", killItem:"The files were deleted from the {i}."}
  ];
  const DIFF = {easy:{n:3, D:950, label:"Easy"}, medium:{n:3, D:1150, label:"Medium"}, hard:{n:4, D:1350, label:"Hard"}};
  const WEIGHTS = {
    easy:   {"sp+":2,"si+":2,"sp-":3,"si-":3,"or":1},
    medium: {"sp+":0.7,"si+":0.7,"sp-":3,"si-":3,"ip+":2,"ip-":3,"or":2,"ori":1},
    hard:   {"sp+":0.6,"si+":0.6,"sp-":3,"si-":3,"ip+":2,"ip-":3,"or":2,"ori":1.5}
  };

  function rng(seed){ let a=seed>>>0; return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
  function hash(str){ let h=2166136261; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
  function shuffle(a,r){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
  function perms(n){ const out=[]; const p=[...Array(n).keys()]; (function go(k){ if(k===n){out.push(p.slice());return;} for(let i=k;i<n;i++){ [p[k],p[i]]=[p[i],p[k]]; go(k+1); [p[k],p[i]]=[p[i],p[k]]; } })(0); return out; }
  const PERMS={3:perms(3),4:perms(4)};

  function holds(cl,sp,si){
    switch(cl.k){
      case "sp+": return sp[cl.s]===cl.p;
      case "sp-": return sp[cl.s]!==cl.p;
      case "si+": return si[cl.s]===cl.i;
      case "si-": return si[cl.s]!==cl.i;
      case "ip+": return sp[si.indexOf(cl.i)]===cl.p;
      case "ip-": return sp[si.indexOf(cl.i)]!==cl.p;
      case "or":  return sp[cl.a]===cl.p || sp[cl.b]===cl.p;
      case "ori": return si[cl.a]===cl.i || si[cl.b]===cl.i;
    }
    return false;
  }
  function countSolutions(clues,n){
    let c=0; for(const sp of PERMS[n]) for(const si of PERMS[n]){ if(clues.every(cl=>holds(cl,sp,si))){ c++; if(c>1) return c; } } return c;
  }

  /* Human-style solver: only sound one-step deductions. Returns the steps it used. */
  function propagate(clues,n,cross){
    const mk=()=>Array.from({length:n},()=>new Array(n).fill(0));
    const G={A:mk(),B:mk(),C:mk()}; // A: suspect x place, B: suspect x item, C: item x place
    const steps=[]; let bad=false, changed=true;
    function set(g,r,c,v,why){ const cur=G[g][r][c]; if(cur===v) return; if(cur!==0){ bad=true; return; } G[g][r][c]=v; steps.push({g,r,c,v,why}); changed=true; }
    clues.forEach((cl,ix)=>{
      const w={rule:"clue",clue:ix};
      if(cl.k==="sp+") set("A",cl.s,cl.p,1,w); else if(cl.k==="sp-") set("A",cl.s,cl.p,-1,w);
      else if(cl.k==="si+") set("B",cl.s,cl.i,1,w); else if(cl.k==="si-") set("B",cl.s,cl.i,-1,w);
      else if(cl.k==="ip+") set("C",cl.i,cl.p,1,w); else if(cl.k==="ip-") set("C",cl.i,cl.p,-1,w);
      else if(cl.k==="or"){ for(let s=0;s<n;s++) if(s!==cl.a&&s!==cl.b) set("A",s,cl.p,-1,w); }
      else if(cl.k==="ori"){ for(let s=0;s<n;s++) if(s!==cl.a&&s!==cl.b) set("B",s,cl.i,-1,w); }
    });
    let guard=0;
    while(changed && !bad && guard++<200){
      changed=false;
      clues.forEach((cl,ix)=>{
        if(cl.k==="or"){ if(G.A[cl.a][cl.p]===-1) set("A",cl.b,cl.p,1,{rule:"or",clue:ix,other:cl.a}); if(G.A[cl.b][cl.p]===-1) set("A",cl.a,cl.p,1,{rule:"or",clue:ix,other:cl.b}); }
        if(cl.k==="ori"){ if(G.B[cl.a][cl.i]===-1) set("B",cl.b,cl.i,1,{rule:"or",clue:ix,other:cl.a}); if(G.B[cl.b][cl.i]===-1) set("B",cl.a,cl.i,1,{rule:"or",clue:ix,other:cl.b}); }
      });
      for(const g of ["A","B","C"]){
        const M=G[g];
        for(let r=0;r<n;r++) for(let c=0;c<n;c++) if(M[r][c]===1){
          for(let k=0;k<n;k++){ if(k!==c) set(g,r,k,-1,{rule:"one",from:[g,r,c]}); if(k!==r) set(g,k,c,-1,{rule:"one",from:[g,r,c]}); }
        }
        for(let r=0;r<n;r++){ const row=M[r]; if(row.includes(1)) continue; const open=row.map((v,c)=>v===0?c:-1).filter(c=>c>=0); if(open.length===1) set(g,r,open[0],1,{rule:"onlyRow"}); }
        for(let c=0;c<n;c++){ const col=M.map(row=>row[c]); if(col.includes(1)) continue; const open=col.map((v,r)=>v===0?r:-1).filter(r=>r>=0); if(open.length===1) set(g,open[0],c,1,{rule:"onlyCol"}); }
      }
      if(cross){
        const {A,B,C}=G;
        for(let s=0;s<n;s++) for(let i=0;i<n;i++) for(let p=0;p<n;p++){
          if(B[s][i]===1&&C[i][p]===1) set("A",s,p,1,{rule:"chain",s,i,p});
          if(B[s][i]===1&&C[i][p]===-1) set("A",s,p,-1,{rule:"chainNo",s,i,p});
          if(B[s][i]===1&&A[s][p]===1) set("C",i,p,1,{rule:"chainC",s,i,p});
          if(B[s][i]===1&&A[s][p]===-1) set("C",i,p,-1,{rule:"chainCNo",s,i,p});
          if(A[s][p]===1&&C[i][p]===1) set("B",s,i,1,{rule:"chainB",s,i,p});
          if(A[s][p]===1&&C[i][p]===-1) set("B",s,i,-1,{rule:"chainBNo",s,i,p});
          if(A[s][p]===1&&B[s][i]===-1) set("C",i,p,-1,{rule:"chainCNo2",s,i,p});
          if(C[i][p]===1&&A[s][p]===-1) set("B",s,i,-1,{rule:"chainBNo2",s,i,p});
          if(C[i][p]===1&&B[s][i]===-1) set("A",s,p,-1,{rule:"chainNo2",s,i,p});
        }
      }
    }
    const solved=!bad && ["A","B"].every(g=>G[g].every(row=>row.every(v=>v!==0)));
    return {solved,bad,steps,G};
  }

  function capFirst(s){ return s.charAt(0).toUpperCase()+s.slice(1); }
  function clueText(cl,C){
    const S=i=>C.S[i].n, I=i=>C.I[i].n, PP=i=>C.P[i].p+" "+C.P[i].n;
    switch(cl.k){
      case "sp+": return S(cl.s)+" was "+PP(cl.p)+".";
      case "sp-": return S(cl.s)+" was not "+PP(cl.p)+".";
      case "si+": return S(cl.s)+" had the "+I(cl.i)+".";
      case "si-": return S(cl.s)+" did not have the "+I(cl.i)+".";
      case "ip+": return "Whoever had the "+I(cl.i)+" was "+PP(cl.p)+".";
      case "ip-": return "Whoever had the "+I(cl.i)+" was not "+PP(cl.p)+".";
      case "or":  return "Either "+S(cl.a)+" or "+S(cl.b)+" was "+PP(cl.p)+".";
      case "ori": return "Either "+S(cl.a)+" or "+S(cl.b)+" had the "+I(cl.i)+".";
    }
    return "";
  }

  function explain(C){
    const res=propagate(C.clues,C.n,true); const out=[]; const seen=new Set();
    const S=i=>C.S[i].n, I=i=>C.I[i].n, PP=i=>C.P[i].p+" "+C.P[i].n;
    for(const st of res.steps){
      if(st.v!==1) continue;
      const key=st.g+st.r+":"+st.c; if(seen.has(key)) continue; seen.add(key);
      const w=st.why; let line="";
      if(st.g==="A"){
        const s=st.r,p=st.c;
        if(w.rule==="clue") line=S(s)+" was "+PP(p)+" (clue "+(w.clue+1)+").";
        else if(w.rule==="or") line="Clue "+(w.clue+1)+" says "+S(w.other)+" or "+S(s)+"; "+S(w.other)+" is ruled out, so "+S(s)+" was "+PP(p)+".";
        else if(w.rule==="onlyRow") line=S(s)+" was "+PP(p)+": every other place is ruled out.";
        else if(w.rule==="onlyCol") line="Everyone else is ruled out for "+C.P[p].n+", so "+S(s)+" was there.";
        else if(w.rule==="chain") line=S(s)+" had the "+I(w.i)+", and whoever had it was "+PP(p)+", so "+S(s)+" was "+PP(p)+".";
        else line=S(s)+" was "+PP(p)+".";
      } else if(st.g==="B"){
        const s=st.r,i=st.c;
        if(w.rule==="clue") line=S(s)+" had the "+I(i)+" (clue "+(w.clue+1)+").";
        else if(w.rule==="or") line="Clue "+(w.clue+1)+" says "+S(w.other)+" or "+S(s)+"; "+S(w.other)+" is ruled out, so "+S(s)+" had the "+I(i)+".";
        else if(w.rule==="onlyRow") line=S(s)+" had the "+I(i)+": every other object is ruled out.";
        else if(w.rule==="onlyCol") line="Nobody else could have the "+I(i)+", so "+S(s)+" had it.";
        else if(w.rule==="chainB") line=S(s)+" was "+PP(w.p)+", and whoever had the "+I(i)+" was there, so "+S(s)+" had it.";
        else line=S(s)+" had the "+I(i)+".";
      } else if(st.g==="C"){
        const i=st.r,p=st.c;
        if(w.rule==="clue") continue; // the clue already says it
        if(w.rule==="onlyRow") line="The "+I(i)+" must have been "+PP(p)+": every other place is ruled out for it.";
        else if(w.rule==="onlyCol") line="Only the "+I(i)+" is left for "+C.P[p].n+".";
        else if(w.rule==="chainC") line=S(w.s)+" had the "+I(i)+" and was "+PP(p)+", so the "+I(i)+" was there.";
        else continue;
      } else continue;
      out.push(line);
    }
    return out;
  }

  function generate(opts){
    const diff=opts.diff||"easy", cfg=DIFF[diff], n=cfg.n;
    const r=rng(opts.seed>>>0);
    for(let attempt=0; attempt<400; attempt++){
      const th=opts.theme? THEMES.find(t=>t.key===opts.theme) : THEMES[Math.floor(r()*THEMES.length)];
      const sIdx=shuffle([0,1,2,3],r).slice(0,n), iIdx=shuffle([0,1,2,3],r).slice(0,n), pIdx=shuffle([0,1,2,3],r).slice(0,n);
      const C={seed:opts.seed>>>0, diff, D:cfg.D, n, theme:th.key, title:th.title, setup:th.setup, itemQ:th.itemQ,
        S:sIdx.map(k=>({n:th.suspects[k][0], role:th.suspects[k][1]})),
        I:iIdx.map(k=>({n:th.items[k]})),
        P:pIdx.map(k=>({p:th.places[k][0], n:th.places[k][1], s:th.places[k][2]}))};
      const sp=shuffle([...Array(n).keys()],r), si=shuffle([...Array(n).keys()],r);
      // every true fact
      const facts=[];
      for(let s=0;s<n;s++) for(let p=0;p<n;p++) facts.push(sp[s]===p?{k:"sp+",s,p}:{k:"sp-",s,p});
      for(let s=0;s<n;s++) for(let i=0;i<n;i++) facts.push(si[s]===i?{k:"si+",s,i}:{k:"si-",s,i});
      for(let i=0;i<n;i++) for(let p=0;p<n;p++){ const s=si.indexOf(i); facts.push(sp[s]===p?{k:"ip+",i,p}:{k:"ip-",i,p}); }
      for(let p=0;p<n;p++){ const s=sp.indexOf(p); const others=[...Array(n).keys()].filter(x=>x!==s); const o=others[Math.floor(r()*others.length)]; facts.push(r()<0.5?{k:"or",a:s,b:o,p}:{k:"or",a:o,b:s,p}); }
      for(let i=0;i<n;i++){ const s=si.indexOf(i); const others=[...Array(n).keys()].filter(x=>x!==s); const o=others[Math.floor(r()*others.length)]; facts.push(r()<0.5?{k:"ori",a:s,b:o,i}:{k:"ori",a:o,b:s,i}); }
      const W=WEIGHTS[diff];
      const cand=facts.filter(f=>W[f.k]).map(f=>({f,key:-Math.log(r())/W[f.k]})).sort((x,y)=>x.key-y.key).map(x=>x.f);
      const cross=diff!=="easy";
      let clues=[];
      for(const f of cand){ clues.push(f); if(propagate(clues,n,cross).solved) break; }
      if(!propagate(clues,n,cross).solved) continue;
      // remove clues that aren't needed
      for(const f of shuffle(clues,r)){ const t=clues.filter(x=>x!==f); if(propagate(t,n,cross).solved) clues=t; }
      if(countSolutions(clues,n)!==1) continue;
      if(diff!=="easy" && attempt<300 && propagate(clues,n,false).solved) continue; // make the third grid matter
      if(clues.length<3 || clues.length>(n===3?7:10)) continue;
      // the killer clue: names one of the culprit's place or object, never something a clue already states outright
      const culprit=Math.floor(r()*n);
      const directPlace=clues.some(c=>c.k==="sp+"&&c.s===culprit), directItem=clues.some(c=>c.k==="si+"&&c.s===culprit);
      let killer=null;
      const order=r()<0.5?["place","item"]:["item","place"];
      for(const k of order){ if(k==="place"&&!directPlace){ killer={k:"place",idx:sp[culprit]}; break; } if(k==="item"&&!directItem){ killer={k:"item",idx:si[culprit]}; break; } }
      if(!killer) continue;
      C.sol={sp,si}; C.culprit=culprit; C.killer=killer;
      C.clues=shuffle(clues,r).map(c=>Object.assign({},c));
      C.clues.forEach(c=>c.text=clueText(c,C));
      const PPk=C.P[sp[culprit]];
      C.killerText=killer.k==="place" ? th.killPlace.replace("{pp}",PPk.p+" "+PPk.n) : th.killItem.replace("{i}",C.I[si[culprit]].n);
      C.steps=explain(C);
      return C;
    }
    return null;
  }

  function dailyDiff(dateStr){
    const dow=new Date(dateStr+"T00:00:00").getDay(); // 0 Sun .. 6 Sat
    return dow===6?"hard":(dow===1||dow===2)?"easy":"medium";
  }
  function daily(dateStr,diff){
    return generate({seed:hash("daily:"+dateStr), diff:diff||dailyDiff(dateStr)});
  }
  return {THEMES, DIFF, generate, daily, dailyDiff, propagate, countSolutions, hash, holds};
})();
if (typeof module !== "undefined") module.exports = CaseGen;

export default CaseGen;
