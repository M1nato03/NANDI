/* ---------- Puzzles: generators with one answer, checked by a counter and a human-style solver ---------- */
const PZ = (function(){
  "use strict";
  function rng(seed){ let a=seed>>>0; return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
  function hash(str){ let h=2166136261; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
  function shuf(a,r){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
  const pc=m=>{ let k=0; while(m){ m&=m-1; k++; } return k; };
  const bitVal=b=>31-Math.clz32(b)+1;

  /* ================= Latin-square family: shared units ================= */
  function latinUnits(N,br,bc){
    const units=[], rows=[], cols=[], boxes=[];
    for(let r=0;r<N;r++){ const u=[]; for(let c=0;c<N;c++) u.push(r*N+c); rows.push(u); }
    for(let c=0;c<N;c++){ const u=[]; for(let r=0;r<N;r++) u.push(r*N+c); cols.push(u); }
    if(br){ for(let b=0;b<N;b++){ const u=[], r0=Math.floor(b/(N/bc))*br, c0=(b%(N/bc))*bc; for(let r=0;r<br;r++) for(let c=0;c<bc;c++) u.push((r0+r)*N+c0+c); boxes.push(u); } }
    units.push(...rows,...cols,...boxes);
    const peers=Array.from({length:N*N},()=>new Set());
    for(const u of units) for(const i of u) for(const j of u) if(i!==j) peers[i].add(j);
    return {units,rows,cols,boxes,peers:peers.map(s=>[...s])};
  }

  /* ================= Mini Sudoku 6x6 ================= */
  const SDK={N:6,br:2,bc:3}; let SDKU=null;
  function sdkFill(r){
    const {N,br,bc}=SDK, digits=shuf([1,2,3,4,5,6],r);
    const bands=shuf([0,1,2],r), rowsOrder=[]; for(const b of bands) for(const k of shuf([0,1],r)) rowsOrder.push(b*br+k);
    const stacks=shuf([0,1],r), colsOrder=[]; for(const s of stacks) for(const k of shuf([0,1,2],r)) colsOrder.push(s*bc+k);
    const g=new Array(N*N);
    for(let r0=0;r0<N;r0++) for(let c0=0;c0<N;c0++){ const rr=rowsOrder[r0], cc=colsOrder[c0]; g[r0*N+c0]=digits[(bc*(rr%br)+Math.floor(rr/br)+cc)%N]; }
    return g;
  }
  function sdkCount(grid,limit){
    const {N}=SDK, U=SDKU; const g=grid.slice(); const FULL=(1<<N)-1; let count=0;
    const cand=i=>{ let m=FULL; for(const p of U.peers[i]) if(g[p]) m&=~(1<<(g[p]-1)); return m; };
    (function rec(){
      let best=-1,bm=0,bk=99;
      for(let i=0;i<N*N;i++) if(!g[i]){ const m=cand(i), k=pc(m); if(!k) return; if(k<bk){ best=i; bm=m; bk=k; if(k===1) break; } }
      if(best<0){ count++; return; }
      for(let m=bm;m;){ const b=m&-m; m^=b; g[best]=bitVal(b); rec(); g[best]=0; if(count>=limit) return; }
    })();
    return count;
  }
  /* logic: level 1 = naked + hidden singles, level 2 = + locked candidates */
  function latinLogic(grid,N,U,maxLevel,extra){
    const g=grid.slice(), FULL=(1<<N)-1, cand=new Array(N*N).fill(0); let used=0, steps=0, bad=false;
    for(let i=0;i<N*N;i++) if(!g[i]){ let m=FULL; for(const p of U.peers[i]) if(g[p]) m&=~(1<<(g[p]-1)); cand[i]=m; }
    if(extra&&extra.init) extra.init(g,cand);
    const place=(i,d)=>{ g[i]=d; cand[i]=0; const b=1<<(d-1); for(const p of U.peers[i]) if(!g[p]) cand[p]&=~b; steps++; };
    for(let guard=0;guard<500;guard++){
      let progress=false;
      for(let i=0;i<N*N;i++) if(!g[i]){ if(!cand[i]){ bad=true; break; } if(pc(cand[i])===1){ place(i,bitVal(cand[i])); progress=true; used=Math.max(used,1); } }
      if(bad) break; if(progress) continue;
      for(const u of U.units){ for(let d=1;d<=N;d++){ const b=1<<(d-1); if(u.some(i=>g[i]===d)) continue; const spots=u.filter(i=>!g[i]&&(cand[i]&b)); if(spots.length===0){ bad=true; break; } if(spots.length===1){ place(spots[0],d); progress=true; used=Math.max(used,1); } } if(bad) break; }
      if(bad) break; if(progress) continue;
      if(extra&&extra.step&&extra.step(g,cand)){ used=Math.max(used,extra.level||1); continue; }
      if(maxLevel>=2&&U.boxes.length){
        for(const box of U.boxes){ for(let d=1;d<=N;d++){ const b=1<<(d-1); const spots=box.filter(i=>!g[i]&&(cand[i]&b)); if(spots.length<2) continue;
          const rs=new Set(spots.map(i=>Math.floor(i/N))), cs=new Set(spots.map(i=>i%N));
          if(rs.size===1){ const r=[...rs][0]; for(let c=0;c<N;c++){ const i=r*N+c; if(!box.includes(i)&&!g[i]&&(cand[i]&b)){ cand[i]&=~b; progress=true; } } }
          if(cs.size===1){ const c=[...cs][0]; for(let r=0;r<N;r++){ const i=r*N+c; if(!box.includes(i)&&!g[i]&&(cand[i]&b)){ cand[i]&=~b; progress=true; } } } } }
        for(const line of U.rows.concat(U.cols)){ for(let d=1;d<=N;d++){ const b=1<<(d-1); const spots=line.filter(i=>!g[i]&&(cand[i]&b)); if(spots.length<2) continue;
          const bx=new Set(spots.map(i=>U.boxes.findIndex(B=>B.includes(i)))); if(bx.size===1){ const box=U.boxes[[...bx][0]]; for(const i of box) if(!line.includes(i)&&!g[i]&&(cand[i]&b)){ cand[i]&=~b; progress=true; } } } }
        if(progress){ used=Math.max(used,2); continue; }
      }
      break;
    }
    const solved=!bad&&g.every(v=>v>0);
    return {solved,used,grid:g};
  }
  function sudoku(opts){
    if(!SDKU) SDKU=latinUnits(SDK.N,SDK.br,SDK.bc);
    const diff=opts.diff||"easy", r=rng(opts.seed);
    const minGivens=diff==="easy"?16:0, level=diff==="hard"?2:1;
    for(let attempt=0;attempt<60;attempt++){
      const sol=sdkFill(r), g=sol.slice(); let givens=36;
      for(const i of shuf([...Array(36).keys()],r)){
        if(givens<=minGivens) break;
        const v=g[i]; g[i]=0;
        if(latinLogic(g,6,SDKU,level).solved && sdkCount(g,2)===1) givens--; else g[i]=v;
      }
      if(diff==="hard" && attempt<40 && latinLogic(g,6,SDKU,1).solved) continue;
      return {type:"sudoku",diff,seed:opts.seed>>>0,N:6,br:2,bc:3,givens:g,solution:sol};
    }
    return null;
  }

  /* ================= Calcudoku ================= */
  function calcOps(cells,vals,r){
    const n=cells.length;
    if(n===1) return {op:"",target:vals[0]};
    if(n===2){ const a=Math.max(vals[0],vals[1]), b=Math.min(vals[0],vals[1]); const x=r();
      if(a%b===0&&a!==b&&x<0.55) return {op:"÷",target:a/b};
      if(x<0.8) return {op:"−",target:a-b};
      return x<0.9?{op:"+",target:a+b}:{op:"×",target:a*b}; }
    const prod=vals.reduce((p,v)=>p*v,1), sum=vals.reduce((s,v)=>s+v,0);
    return (r()<0.4&&prod<=240)?{op:"×",target:prod}:{op:"+",target:sum};
  }
  function cageTuples(cage,N){
    const out=[], k=cage.cells.length, cur=new Array(k);
    const rowOf=i=>Math.floor(i/N), colOf=i=>i%N;
    (function rec(j){
      if(j===k){ const v=cur; let ok=false;
        if(cage.op==="") ok=v[0]===cage.target;
        else if(cage.op==="+") ok=v.reduce((s,x)=>s+x,0)===cage.target;
        else if(cage.op==="×") ok=v.reduce((s,x)=>s*x,1)===cage.target;
        else if(cage.op==="−") ok=Math.abs(v[0]-v[1])===cage.target;
        else if(cage.op==="÷") ok=Math.max(v[0],v[1])/Math.min(v[0],v[1])===cage.target;
        if(ok) out.push(v.slice()); return; }
      for(let d=1;d<=N;d++){ let clash=false; for(let t=0;t<j;t++) if(cur[t]===d&&(rowOf(cage.cells[t])===rowOf(cage.cells[j])||colOf(cage.cells[t])===colOf(cage.cells[j]))){ clash=true; break; } if(clash) continue; cur[j]=d; rec(j+1); }
    })(0);
    return out;
  }
  function calcCount(N,cages,limit,collect){
    const U=latinUnits(N), cageOf=new Array(N*N), posIn=new Array(N*N);
    cages.forEach((cg,ci)=>cg.cells.forEach((cell,p)=>{ cageOf[cell]=ci; posIn[cell]=p; }));
    const g=new Array(N*N).fill(0); let count=0; const sols=[];
    function domain(i){
      let m=(1<<N)-1; for(const p of U.peers[i]) if(g[p]) m&=~(1<<(g[p]-1));
      const cg=cages[cageOf[i]]; let cm=0;
      for(const t of cg.tuples){ let ok=true; for(let q=0;q<t.length;q++){ const cell=cg.cells[q]; if(g[cell]&&g[cell]!==t[q]){ ok=false; break; } } if(ok) cm|=1<<(t[posIn[i]]-1); }
      return m&cm;
    }
    (function rec(){
      let best=-1,bm=0,bk=99;
      for(let i=0;i<N*N;i++) if(!g[i]){ const m=domain(i), k=pc(m); if(!k) return; if(k<bk){ best=i; bm=m; bk=k; if(k===1) break; } }
      if(best<0){ count++; if(collect) sols.push(g.slice()); return; }
      for(let m=bm;m;){ const b=m&-m; m^=b; g[best]=bitVal(b); rec(); g[best]=0; if(count>=limit) return; }
    })();
    return collect?{count,sols}:count;
  }
  function calcLogic(N,cages,maxLevel){
    const U=latinUnits(N), cageOf=new Array(N*N), posIn=new Array(N*N);
    cages.forEach((cg,ci)=>cg.cells.forEach((cell,p)=>{ cageOf[cell]=ci; posIn[cell]=p; }));
    const extra={level:1,
      init(g,cand){ cages.forEach(cg=>{ cg.cells.forEach((cell,p)=>{ let m=0; for(const t of cg.tuples) m|=1<<(t[p]-1); cand[cell]&=m; }); }); },
      step(g,cand){ // cage-tuple elimination against current candidates
        let progress=false;
        cages.forEach(cg=>{ const live=cg.tuples.filter(t=>t.every((v,q)=>{ const cell=cg.cells[q]; return g[cell]?g[cell]===v:(cand[cell]&(1<<(v-1))); }));
          cg.cells.forEach((cell,q)=>{ if(g[cell]) return; let m=0; for(const t of live) m|=1<<(t[q]-1); if((cand[cell]&m)!==cand[cell]){ cand[cell]&=m; progress=true; } }); });
        if(progress) return true;
        if(maxLevel>=2){ // naked pairs in rows and columns
          for(const line of U.rows.concat(U.cols)){ const open=line.filter(i=>!g[i]&&pc(cand[i])===2);
            for(let a=0;a<open.length;a++) for(let b=a+1;b<open.length;b++) if(cand[open[a]]===cand[open[b]]){ const m=cand[open[a]]; for(const i of line) if(i!==open[a]&&i!==open[b]&&!g[i]&&(cand[i]&m)){ cand[i]&=~m; progress=true; } } }
          if(progress){ extra.level=2; return true; }
        }
        return false; } };
    const res=latinLogic(new Array(N*N).fill(0),N,U,1,extra);
    return res;
  }
  function calcudoku(opts){
    const diff=opts.diff||"easy", N=diff==="easy"?4:diff==="medium"?5:6, r=rng(opts.seed);
    const level=diff==="easy"?1:2;
    for(let attempt=0;attempt<80;attempt++){
      const rows=shuf([...Array(N).keys()],r), cols=shuf([...Array(N).keys()],r), syms=shuf([...Array(N).keys()].map(x=>x+1),r);
      const sol=new Array(N*N); for(let i=0;i<N;i++) for(let j=0;j<N;j++) sol[i*N+j]=syms[(rows[i]+cols[j])%N];
      // grow cages
      const owner=new Array(N*N).fill(-1), cages=[]; let singles=0;
      for(const start of shuf([...Array(N*N).keys()],r)){
        if(owner[start]>=0) continue;
        const x=r(); let size=x<0.12?1:x<0.6?2:x<0.92?3:4; if(size===1&&singles>=(N>=5?2:1)) size=2;
        const cells=[start]; owner[start]=cages.length;
        while(cells.length<size){ const opts2=[]; for(const c of cells){ const rr=Math.floor(c/N), cc=c%N; [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dr,dc])=>{ const nr=rr+dr, nc=cc+dc; if(nr>=0&&nr<N&&nc>=0&&nc<N&&owner[nr*N+nc]<0) opts2.push(nr*N+nc); }); } if(!opts2.length) break; const pick=opts2[Math.floor(r()*opts2.length)]; owner[pick]=cages.length; cells.push(pick); }
        if(cells.length===1) singles++;
        cages.push({cells});
      }
      cages.forEach(cg=>{ Object.assign(cg,calcOps(cg.cells,cg.cells.map(c=>sol[c]),r)); cg.tuples=cageTuples(cg,N); });
      let ok=false;
      for(let fix=0;fix<25;fix++){
        const res=calcCount(N,cages,2,true);
        if(res.count===1){ ok=true; break; }
        const rival=res.sols.find(s=>s.some((v,i)=>v!==sol[i])); if(!rival) break;
        const cell=rival.findIndex((v,i)=>v!==sol[i]); const ci=cages.findIndex(cg=>cg.cells.includes(cell)); const cg=cages[ci];
        if(cg.cells.length>1&&r()<0.5){ // split the cage
          const keep=cg.cells.filter(c=>c!==cell); cg.cells=keep; Object.assign(cg,calcOps(keep,keep.map(c=>sol[c]),r)); cg.tuples=cageTuples(cg,N);
          const nc={cells:[cell]}; Object.assign(nc,calcOps(nc.cells,[sol[cell]],r)); nc.tuples=cageTuples(nc,N); cages.push(nc);
          // keep cages connected: if the remaining cage split apart, re-cut into connected parts
          const parts=[]; const left=new Set(cg.cells);
          while(left.size){ const s=[...left][0], comp=[s]; left.delete(s); for(let q=0;q<comp.length;q++){ const c=comp[q], rr=Math.floor(c/N), cc=c%N; for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){ const n2=(rr+dr)*N+cc+dc; if(rr+dr>=0&&rr+dr<N&&cc+dc>=0&&cc+dc<N&&left.has(n2)){ left.delete(n2); comp.push(n2); } } } parts.push(comp); }
          if(parts.length>1){ cg.cells=parts[0]; Object.assign(cg,calcOps(cg.cells,cg.cells.map(c=>sol[c]),r)); cg.tuples=cageTuples(cg,N); for(let q=1;q<parts.length;q++){ const pc2={cells:parts[q]}; Object.assign(pc2,calcOps(pc2.cells,pc2.cells.map(c=>sol[c]),r)); pc2.tuples=cageTuples(pc2,N); cages.push(pc2); } }
        } else { Object.assign(cg,calcOps(cg.cells,cg.cells.map(c=>sol[c]),r)); cg.tuples=cageTuples(cg,N); }
      }
      if(!ok) continue;
      const lg=calcLogic(N,cages,level); if(!lg.solved) continue;
      return {type:"calc",diff,seed:opts.seed>>>0,N,cages:cages.map(cg=>({cells:cg.cells.slice(),op:cg.op,target:cg.target})),solution:sol};
    }
    return null;
  }

  /* ================= Crowns (one crown per row, column and region; crowns never touch) ================= */
  function crownCount(N,region,limit,collect){
    let count=0; const colU=new Uint8Array(N), regU=new Uint8Array(N), pos=new Int8Array(N), sols=[];
    (function rec(r){
      if(r===N){ count++; if(collect) sols.push(Array.from(pos)); return; }
      for(let c=0;c<N;c++){ const g=region[r*N+c]; if(colU[c]||regU[g]||(r&&Math.abs(pos[r-1]-c)<=1)) continue; colU[c]=regU[g]=1; pos[r]=c; rec(r+1); colU[c]=regU[g]=0; if(count>=limit) return; }
    })(0);
    return collect?{count,sols}:count;
  }
  function crownLogic(N,region,maxLevel){
    const st=new Int8Array(N*N); // 0 unknown, 1 crown, -1 out
    let used=0, bad=false;
    const regionCells=[]; for(let k=0;k<N;k++) regionCells.push([]); for(let i=0;i<N*N;i++) regionCells[region[i]].push(i);
    const rowCells=k=>{ const a=[]; for(let c=0;c<N;c++) a.push(k*N+c); return a; }, colCells=k=>{ const a=[]; for(let r=0;r<N;r++) a.push(r*N+k); return a; };
    const units=[]; for(let k=0;k<N;k++){ units.push(rowCells(k)); units.push(colCells(k)); units.push(regionCells[k]); }
    function killFor(i){ const r=Math.floor(i/N), c=i%N, out=new Set(); for(let k=0;k<N;k++){ out.add(r*N+k); out.add(k*N+c); } for(const j of regionCells[region[i]]) out.add(j); for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){ const rr=r+dr, cc=c+dc; if(rr>=0&&rr<N&&cc>=0&&cc<N) out.add(rr*N+cc); } out.delete(i); return out; }
    const place=i=>{ st[i]=1; for(const j of killFor(i)){ if(st[j]===1){ bad=true; } else st[j]=-1; } };
    const emptiesAUnit=i=>{ const kill=killFor(i); for(const u of units){ if(u.includes(i)) continue; if(u.some(j=>st[j]===1)) continue; if(!u.some(j=>st[j]===0&&!kill.has(j))) return true; } return false; };
    for(let guard=0;guard<400&&!bad;guard++){
      let progress=false;
      for(const u of units){ if(u.some(j=>st[j]===1)) continue; const open=u.filter(j=>st[j]===0); if(!open.length){ bad=true; break; } if(open.length===1){ place(open[0]); progress=true; used=Math.max(used,1); } }
      if(bad||progress) continue;
      // region confined to one row/col, and row/col confined to one region
      for(let k=0;k<N;k++){
        const open=regionCells[k].filter(j=>st[j]===0); if(!open.length||regionCells[k].some(j=>st[j]===1)) continue;
        const rs=new Set(open.map(j=>Math.floor(j/N))), cs=new Set(open.map(j=>j%N));
        if(rs.size===1){ const rr=[...rs][0]; for(let c=0;c<N;c++){ const j=rr*N+c; if(st[j]===0&&region[j]!==k){ st[j]=-1; progress=true; } } }
        if(cs.size===1){ const cc=[...cs][0]; for(let rr=0;rr<N;rr++){ const j=rr*N+cc; if(st[j]===0&&region[j]!==k){ st[j]=-1; progress=true; } } }
      }
      for(let k=0;k<N;k++) for(const line of [rowCells(k),colCells(k)]){ if(line.some(j=>st[j]===1)) continue; const open=line.filter(j=>st[j]===0); const rg=new Set(open.map(j=>region[j])); if(rg.size===1){ const g2=[...rg][0]; for(const j of regionCells[g2]) if(st[j]===0&&!line.includes(j)){ st[j]=-1; progress=true; } } }
      if(progress){ used=Math.max(used,1); continue; }
      if(maxLevel>=2){
        // pigeonhole: k regions confined to k rows (or columns)
        const openRegions=[]; for(let k=0;k<N;k++) if(!regionCells[k].some(j=>st[j]===1)) openRegions.push(k);
        const subsets=(arr,k)=>{ const out=[]; (function rec(s,acc){ if(acc.length===k){ out.push(acc.slice()); return; } for(let q=s;q<arr.length;q++){ acc.push(arr[q]); rec(q+1,acc); acc.pop(); } })(0,[]); return out; };
        outer: for(let k=2;k<openRegions.length;k++){
          for(const set of subsets(openRegions,k)){
            const cells=[].concat(...set.map(g2=>regionCells[g2].filter(j=>st[j]===0)));
            for(const axis of [0,1]){ const lines=new Set(cells.map(j=>axis?j%N:Math.floor(j/N))); if(lines.size===k){ for(const L of lines) for(let q=0;q<N;q++){ const j=axis?q*N+L:L*N+q; if(st[j]===0&&!set.includes(region[j])){ st[j]=-1; progress=true; } } if(progress) break outer; } }
          }
        }
        if(progress){ used=Math.max(used,2); continue; }
        // a cell whose crown would leave some row, column or region with no room
        for(let i=0;i<N*N;i++) if(st[i]===0&&emptiesAUnit(i)){ st[i]=-1; progress=true; }
        if(progress){ used=Math.max(used,2); continue; }
      }
      if(maxLevel>=3){
        // one-step lookahead: place, fill forced singles, look for a dead unit
        for(let i=0;i<N*N&&!progress;i++){ if(st[i]!==0) continue;
          const save=st.slice(); const saveBad=bad; place(i);
          for(let g3=0;g3<20&&!bad;g3++){ let p2=false; for(const u of units){ if(u.some(j=>st[j]===1)) continue; const open=u.filter(j=>st[j]===0); if(!open.length){ bad=true; break; } if(open.length===1){ place(open[0]); p2=true; } } if(!p2) break; }
          const dead=bad; st.set(save); bad=saveBad;
          if(dead){ st[i]=-1; progress=true; }
        }
        if(progress){ used=Math.max(used,3); continue; }
      }
      break;
    }
    let crowns=0; for(let i=0;i<N*N;i++) if(st[i]===1) crowns++;
    return {solved:!bad&&crowns===N,used,st};
  }
  function regionConnected(N,region,k){ const cells=[]; for(let i=0;i<N*N;i++) if(region[i]===k) cells.push(i); if(!cells.length) return false; const seen=new Set([cells[0]]), q=[cells[0]]; while(q.length){ const c=q.pop(), r=Math.floor(c/N), cc=c%N; for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nr=r+dr, nc=cc+dc; if(nr<0||nr>=N||nc<0||nc>=N) continue; const j=nr*N+nc; if(region[j]===k&&!seen.has(j)){ seen.add(j); q.push(j); } } } return seen.size===cells.length; }
  function crowns(opts){
    const diff=opts.diff||"easy", N=diff==="easy"?6:diff==="medium"?7:8, r=rng(opts.seed), level=diff==="easy"?1:diff==="medium"?2:3;
    for(let attempt=0;attempt<300;attempt++){
      // plant a permutation with neighbouring rows at least 2 columns apart
      const perm=new Array(N); const usedC=new Uint8Array(N);
      if(!(function rec(row){ if(row===N) return true; for(const c of shuf([...Array(N).keys()],r)){ if(usedC[c]||(row&&Math.abs(perm[row-1]-c)<2)) continue; usedC[c]=1; perm[row]=c; if(rec(row+1)) return true; usedC[c]=0; } return false; })(0)) continue;
      // grow regions from each crown
      const region=new Int8Array(N*N).fill(-1), front=[], w=[];
      for(let k=0;k<N;k++){ const i=k*N+perm[k]; region[i]=k; front.push([i]); w.push(0.35+r()*1.8); }
      let left=N*N-N;
      while(left>0){
        let tot=0; for(let k=0;k<N;k++) if(front[k].length) tot+=w[k]; let x=r()*tot, k=0; for(;k<N;k++){ if(!front[k].length) continue; x-=w[k]; if(x<=0) break; } if(k>=N) k=front.findIndex(f=>f.length);
        const f=front[k], idx=Math.floor(r()*f.length), c=f[idx]; const rr=Math.floor(c/N), cc=c%N; let grew=false;
        for(const [dr,dc] of shuf([[1,0],[-1,0],[0,1],[0,-1]],r)){ const nr=rr+dr, nc=cc+dc; if(nr<0||nr>=N||nc<0||nc>=N) continue; const j=nr*N+nc; if(region[j]<0){ region[j]=k; f.push(j); left--; grew=true; break; } }
        if(!grew) f.splice(idx,1);
      }
      // repair until unique
      let ok=false;
      for(let fix=0;fix<80;fix++){
        const res=crownCount(N,region,2,true);
        if(res.count===1){ ok=true; break; }
        const rival=res.sols.find(s=>s.some((c,i)=>c!==perm[i])); if(!rival) break;
        const rows=shuf([...Array(N).keys()].filter(i=>rival[i]!==perm[i]),r); let moved=false;
        for(const row of rows){ const q=row*N+rival[row], old=region[q];
          const nbr=[]; const qr=row, qc=rival[row]; for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nr=qr+dr, nc=qc+dc; if(nr>=0&&nr<N&&nc>=0&&nc<N&&region[nr*N+nc]!==old) nbr.push(region[nr*N+nc]); }
          for(const nk of shuf(nbr,r)){ region[q]=nk; if(regionConnected(N,region,old)){ moved=true; break; } region[q]=old; }
          if(moved) break; }
        if(!moved) break;
      }
      if(!ok) continue;
      const lg=crownLogic(N,region,level); if(!lg.solved) continue;
      if(attempt<200&&level>1&&crownLogic(N,region,level-1).solved) continue;
      return {type:"crowns",diff,seed:opts.seed>>>0,N,region:Array.from(region),solution:perm.slice()};
    }
    return null;
  }

  /* ================= Sun & Moon (binary 6x6 with = and × signs) ================= */
  const LINES=(function(){ const out=[]; for(let m=0;m<64;m++){ const v=[]; for(let i=0;i<6;i++) v.push((m>>i)&1); if(v.reduce((s,x)=>s+x,0)!==3) continue; let ok=true; for(let i=0;i+2<6;i++) if(v[i]===v[i+1]&&v[i+1]===v[i+2]) ok=false; if(ok) out.push(v); } return out; })();
  /* clues: given[36] (-1 none, 0 sun, 1 moon); hs[r*5+c] sign between (r,c)-(r,c+1); vs[r*6+c] sign between (r,c)-(r+1,c): 0 none, 1 '=', 2 '×' */
  function binLogic(cl,level){
    const g=cl.given.slice(); let bad=false, used=0;
    const lineCells=(k,axis)=>{ const a=[]; for(let q=0;q<6;q++) a.push(axis?q*6+k:k*6+q); return a; };
    const lineSigns=(k,axis)=>{ const a=[]; for(let q=0;q<5;q++) a.push(axis?cl.vs[q*6+k]:cl.hs[k*5+q]); return a; };
    for(let guard=0;guard<200&&!bad;guard++){
      let progress=false;
      for(let axis=0;axis<2;axis++) for(let k=0;k<6;k++){
        const cells=lineCells(k,axis), signs=lineSigns(k,axis), v=cells.map(i=>g[i]);
        if(level>=2){
          const fits=LINES.filter(p=>p.every((x,q)=>v[q]<0||v[q]===x)&&signs.every((s,q)=>!s||(s===1?p[q]===p[q+1]:p[q]!==p[q+1])));
          if(!fits.length){ bad=true; break; }
          for(let q=0;q<6;q++) if(v[q]<0&&fits.every(p=>p[q]===fits[0][q])){ g[cells[q]]=fits[0][q]; progress=true; used=Math.max(used,2); }
        } else {
          const set=(q,x)=>{ if(v[q]<0){ v[q]=x; g[cells[q]]=x; progress=true; used=Math.max(used,1); } else if(v[q]!==x) bad=true; };
          for(let q=0;q<5;q++){ const s=signs[q]; if(!s) continue; if(v[q]>=0&&v[q+1]<0) set(q+1,s===1?v[q]:1-v[q]); else if(v[q+1]>=0&&v[q]<0) set(q,s===1?v[q+1]:1-v[q+1]); }
          for(let q=0;q<5;q++) if(v[q]>=0&&v[q]===v[q+1]){ if(q>0) set(q-1,1-v[q]); if(q+2<6) set(q+2,1-v[q]); }
          for(let q=0;q+2<6;q++) if(v[q]>=0&&v[q]===v[q+2]) set(q+1,1-v[q]);
          for(const x of [0,1]) if(v.filter(y=>y===x).length===3) for(let q=0;q<6;q++) if(v[q]<0) set(q,1-x);
        }
      }
      if(!progress) break;
    }
    const solved=!bad&&g.every(x=>x>=0);
    return {solved,used,grid:g};
  }
  function binCount(cl,limit){
    let count=0; const rows=[];
    const rowFits=r=>LINES.filter(p=>p.every((x,q)=>cl.given[r*6+q]<0||cl.given[r*6+q]===x)&&[0,1,2,3,4].every(q=>{ const s=cl.hs[r*5+q]; return !s||(s===1?p[q]===p[q+1]:p[q]!==p[q+1]); }));
    const fitsCache=[0,1,2,3,4,5].map(rowFits);
    (function rec(r){
      if(r===6){ count++; return; }
      for(const p of fitsCache[r]){
        let ok=true;
        for(let c=0;c<6&&ok;c++){
          if(r>0){ const s=cl.vs[(r-1)*6+c]; if(s&&(s===1?rows[r-1][c]!==p[c]:rows[r-1][c]===p[c])) ok=false; }
          if(r>=2&&rows[r-1][c]===p[c]&&rows[r-2][c]===p[c]) ok=false;
          let ones=p[c]; for(let q=0;q<r;q++) ones+=rows[q][c]; const zeros=(r+1)-ones; if(ones>3||zeros>3) ok=false;
        }
        if(!ok) continue; rows.push(p); rec(r+1); rows.pop(); if(count>=limit) return;
      }
    })(0);
    return count;
  }
  function sunmoon(opts){
    const diff=opts.diff||"easy", r=rng(opts.seed), level=diff==="easy"?1:2;
    for(let attempt=0;attempt<80;attempt++){
      const rows=[];
      const okSoFar=()=>{ const R=rows.length; for(let c=0;c<6;c++){ let ones=0; for(let q=0;q<R;q++) ones+=rows[q][c]; if(ones>3||R-ones>3) return false; if(R>=3&&rows[R-1][c]===rows[R-2][c]&&rows[R-2][c]===rows[R-3][c]) return false; } return true; };
      if(!(function rec(){ if(rows.length===6) return true; for(const p of shuf(LINES,r)){ rows.push(p); if(okSoFar()&&rec()) return true; rows.pop(); } return false; })()) continue;
      const sol=[].concat(...rows);
      const cl={given:sol.slice(), hs:new Array(30).fill(0), vs:new Array(30).fill(0)};
      for(let rr=0;rr<6;rr++) for(let c=0;c<5;c++) cl.hs[rr*5+c]=sol[rr*6+c]===sol[rr*6+c+1]?1:2;
      for(let rr=0;rr<5;rr++) for(let c=0;c<6;c++) cl.vs[rr*6+c]=sol[rr*6+c]===sol[(rr+1)*6+c]?1:2;
      const pool=shuf([].concat([...Array(36).keys()].map(i=>["g",i]),[...Array(30).keys()].map(i=>["h",i]),[...Array(30).keys()].map(i=>["v",i])),r);
      for(const [kind,i] of pool){
        const arr=kind==="g"?cl.given:kind==="h"?cl.hs:cl.vs; const old=arr[i]; arr[i]=kind==="g"?-1:0;
        if(!binLogic(cl,level).solved) arr[i]=old;
      }
      if(binCount(cl,2)!==1) continue;
      if(diff!=="easy"&&attempt<60&&binLogic(cl,1).solved) continue;
      const givens=cl.given.filter(x=>x>=0).length; if(givens<2) continue;
      return {type:"sunmoon",diff,seed:opts.seed>>>0,given:cl.given,hs:cl.hs,vs:cl.vs,solution:sol};
    }
    return null;
  }

  /* ================= Number Path (one line through every cell, 1 → K in order) ================= */
  function pathCount(R,C,wp,limit,collect){
    const N=R*C, num=new Int16Array(N).fill(0); let K=0; wp.forEach((cell,k)=>{ num[cell]=k+1; K=k+1; });
    const visited=new Uint8Array(N), path=[]; let count=0; const sols=[];
    const nb=i=>{ const r=Math.floor(i/C), c=i%C, a=[]; if(r>0) a.push(i-C); if(r<R-1) a.push(i+C); if(c>0) a.push(i-1); if(c<C-1) a.push(i+1); return a; };
    const NB=[...Array(N).keys()].map(nb);
    function prune(head,depth,nextK){
      // unvisited cells must stay connected to the head, and no cell may become a dead end
      const left=N-depth; if(left===0) return false;
      let start=-1; for(const j of NB[head]) if(!visited[j]){ start=j; break; } if(start<0) return true;
      const seen=new Uint8Array(N); const q=[start]; seen[start]=1; let n=1;
      while(q.length){ const c=q.pop(); for(const j of NB[c]) if(!visited[j]&&!seen[j]){ seen[j]=1; n++; q.push(j); } }
      if(n!==left) return true;
      for(let i=0;i<N;i++){ if(visited[i]) continue; let free=0; for(const j of NB[i]) if(!visited[j]||j===head) free++; if(num[i]===K?free<1:free<2) return true; }
      return false;
    }
    (function rec(head,depth,nextK){
      if(depth===N){ if(num[head]===K){ count++; if(collect) sols.push(path.slice()); } return; }
      if(prune(head,depth,nextK)) return;
      for(const j of NB[head]){ if(visited[j]) continue; if(num[j]&&num[j]!==nextK) continue; if(num[j]===K&&depth+1!==N) continue;
        visited[j]=1; path.push(j); rec(j,depth+1,num[j]?nextK+1:nextK); path.pop(); visited[j]=0; if(count>=limit) return; }
    })((visited[wp[0]]=1,path.push(wp[0]),wp[0]),1,2);
    return collect?{count,sols}:count;
  }
  function numberPath(opts){
    const diff=opts.diff||"easy", R=diff==="easy"?5:6, C=R, N=R*C, r=rng(opts.seed);
    const minWp=diff==="easy"?Math.round(N/3.2):diff==="medium"?Math.round(N/4.5):Math.round(N/6);
    for(let attempt=0;attempt<40;attempt++){
      // random Hamiltonian path: snake, then many backbite moves
      let path=[]; for(let rr=0;rr<R;rr++){ const row=[]; for(let c=0;c<C;c++) row.push(rr*C+c); if(rr%2) row.reverse(); path.push(...row); }
      const adj=(a,b)=>{ const ar=Math.floor(a/C), ac=a%C, br2=Math.floor(b/C), bc2=b%C; return Math.abs(ar-br2)+Math.abs(ac-bc2)===1; };
      for(let m=0;m<N*30;m++){
        if(r()<0.5) path.reverse();
        const end=path[0], nbrs=[]; const er=Math.floor(end/C), ec=end%C; [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dr,dc])=>{ const nr=er+dr, nc=ec+dc; if(nr>=0&&nr<R&&nc>=0&&nc<C) nbrs.push(nr*C+nc); });
        const x=nbrs[Math.floor(r()*nbrs.length)]; const j=path.indexOf(x); if(j<=1) continue;
        path=path.slice(0,j).reverse().concat(path.slice(j));
      }
      let broken=false; for(let q=0;q+1<N;q++) if(!adj(path[q],path[q+1])) broken=true; if(broken) continue;
      // waypoints: start, end, and evenly spread stops
      const idx=new Set([0,N-1]); const gap=Math.max(2,Math.floor(N/minWp)); for(let q=gap;q<N-1;q+=gap) idx.add(q+Math.floor(r()*Math.min(2,gap-1)));
      const wpOf=()=>[...idx].sort((a,b)=>a-b).map(q=>path[q]);
      let ok=false;
      for(let fix=0;fix<40;fix++){
        const res=pathCount(R,C,wpOf(),2,true);
        if(res.count===1){ ok=true; break; }
        const rival=res.sols.find(s=>s.some((v,q)=>v!==path[q])); if(!rival) break;
        const q=rival.findIndex((v,q2)=>v!==path[q2]); idx.add(Math.min(N-2,Math.max(1,q)));
      }
      if(!ok) continue;
      for(const q of shuf([...idx].filter(q=>q!==0&&q!==N-1),r)){ if(idx.size<=minWp) break; idx.delete(q); if(pathCount(R,C,wpOf(),2)!==1) idx.add(q); }
      return {type:"path",diff,seed:opts.seed>>>0,R,C,waypoints:wpOf(),solution:path.slice()};
    }
    return null;
  }

  /* ================= rule checks for the player's grid (never compare to the stored answer) ================= */
  function checkSudoku(p,g){ if(g.some(v=>!v)) return false; if(!SDKU) SDKU=latinUnits(6,2,3); return SDKU.units.every(u=>new Set(u.map(i=>g[i])).size===6) && p.givens.every((v,i)=>!v||g[i]===v); }
  function checkCalc(p,g){ const N=p.N; if(g.some(v=>!v)) return false; const U=latinUnits(N); if(!U.units.every(u=>new Set(u.map(i=>g[i])).size===N)) return false;
    return p.cages.every(cg=>{ const v=cg.cells.map(i=>g[i]); if(cg.op==="") return v[0]===cg.target; if(cg.op==="+") return v.reduce((s,x)=>s+x,0)===cg.target; if(cg.op==="×") return v.reduce((s,x)=>s*x,1)===cg.target; if(cg.op==="−") return Math.abs(v[0]-v[1])===cg.target; return Math.max(...v)/Math.min(...v)===cg.target; }); }
  function checkCrowns(p,cr){ const N=p.N; if(cr.length!==N) return false; const rows=new Set(), cols=new Set(), regs=new Set(); for(const i of cr){ rows.add(Math.floor(i/N)); cols.add(i%N); regs.add(p.region[i]); } if(rows.size!==N||cols.size!==N||regs.size!==N) return false; for(const a of cr) for(const b of cr) if(a!==b&&Math.abs(Math.floor(a/N)-Math.floor(b/N))<=1&&Math.abs(a%N-b%N)<=1) return false; return true; }
  function checkSunmoon(p,g){ if(g.some(x=>x<0)) return false; for(let k=0;k<6;k++){ const row=[0,1,2,3,4,5].map(q=>g[k*6+q]), col=[0,1,2,3,4,5].map(q=>g[q*6+k]); for(const l of [row,col]){ if(l.filter(x=>x===1).length!==3) return false; for(let q=0;q+2<6;q++) if(l[q]===l[q+1]&&l[q+1]===l[q+2]) return false; } }
    for(let r=0;r<6;r++) for(let c=0;c<5;c++){ const s=p.hs[r*5+c]; if(s&&(s===1)!==(g[r*6+c]===g[r*6+c+1])) return false; }
    for(let r=0;r<5;r++) for(let c=0;c<6;c++){ const s=p.vs[r*6+c]; if(s&&(s===1)!==(g[r*6+c]===g[(r+1)*6+c])) return false; }
    return p.given.every((x,i)=>x<0||g[i]===x); }
  function checkPath(p,path){ const N=p.R*p.C; if(path.length!==N||new Set(path).size!==N) return false; for(let q=0;q+1<N;q++){ const a=path[q], b=path[q+1]; if(Math.abs(Math.floor(a/p.C)-Math.floor(b/p.C))+Math.abs(a%p.C-b%p.C)!==1) return false; }
    let k=0; for(const cell of path){ const w=p.waypoints.indexOf(cell); if(w>=0){ if(w!==k) return false; k++; } } return k===p.waypoints.length&&path[0]===p.waypoints[0]&&path[N-1]===p.waypoints[p.waypoints.length-1]; }

  const TYPES={
    sudoku:{name:"Mini Sudoku",gen:sudoku,rule:"Fill the grid so every row, column and 2×3 box has 1–6 exactly once.",check:checkSudoku},
    crowns:{name:"Crowns",gen:crowns,rule:"Place one crown in every row, every column and every colour. Crowns can’t touch, not even diagonally.",check:checkCrowns},
    sunmoon:{name:"Sun & Moon",gen:sunmoon,rule:"Fill every cell with a sun or a moon. Each row and column has 3 of each, never 3 of the same in a row. = means the two cells match; × means they differ.",check:checkSunmoon},
    path:{name:"Number Path",gen:numberPath,rule:"Draw one line from 1 through every number in order, passing through every cell exactly once.",check:checkPath},
    calc:{name:"Calcudoku",gen:calcudoku,rule:"Each row and column has every number once. Each outlined group must make its target with its operation (+ − × ÷).",check:checkCalc}
  };
  function generate(type,opts){ const t=TYPES[type]; return t?t.gen(opts):null; }
  return {TYPES,generate,hash,rng,
    _test:{sdkCount,latinLogic,latinUnits:()=>SDKU||(SDKU=latinUnits(6,2,3)),crownCount,crownLogic,binCount,binLogic,pathCount,calcCount,calcLogic,cageTuples,LINES}};
})();
if (typeof module !== "undefined") module.exports = PZ;
