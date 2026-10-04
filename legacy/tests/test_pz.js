const PZ=require(require('path').join(__dirname,'../src/puzzles.js')); const T=PZ._test;
function stats(type,diff,n){
  let ok=0, fails=[], nulls=0, times=[], extra=[];
  for(let k=0;k<n;k++){
    const seed=PZ.hash(type+diff+k); const t0=process.hrtime.bigint();
    const p=PZ.generate(type,{seed,diff}); const ms=Number(process.hrtime.bigint()-t0)/1e6; times.push(ms);
    if(!p){ nulls++; continue; }
    let unique, logic, valid;
    if(type==='sudoku'){ unique=T.sdkCount(p.givens,2)===1; logic=T.latinLogic(p.givens,6,T.latinUnits(),diff==='hard'?2:1).solved; valid=PZ.TYPES.sudoku.check(p,p.solution); extra.push(p.givens.filter(v=>v).length); }
    if(type==='crowns'){ unique=T.crownCount(p.N,p.region,2)===1; logic=T.crownLogic(p.N,p.region,diff==='easy'?1:diff==='medium'?2:3).solved; const cr=p.solution.map((c,r)=>r*p.N+c); valid=PZ.TYPES.crowns.check(p,cr); extra.push(Math.min(...[...Array(p.N).keys()].map(k=>p.region.filter(x=>x===k).length))); }
    if(type==='sunmoon'){ const cl={given:p.given,hs:p.hs,vs:p.vs}; unique=T.binCount(cl,2)===1; logic=T.binLogic(cl,diff==='easy'?1:2).solved; valid=PZ.TYPES.sunmoon.check(p,p.solution); extra.push(p.given.filter(x=>x>=0).length+'g/'+(p.hs.filter(x=>x).length+p.vs.filter(x=>x).length)+'s'); }
    if(type==='path'){ unique=T.pathCount(p.R,p.C,p.waypoints,2)===1; logic=true; valid=PZ.TYPES.path.check(p,p.solution); extra.push(p.waypoints.length); }
    if(type==='calc'){ const cg=p.cages.map(c=>Object.assign({},c,{tuples:T.cageTuples(c,p.N)})); unique=T.calcCount(p.N,cg,2)===1; logic=T.calcLogic(p.N,cg,diff==='easy'?1:2).solved; valid=PZ.TYPES.calc.check(p,p.solution); extra.push(p.cages.length); }
    if(unique&&logic&&valid) ok++; else fails.push({k,unique,logic,valid});
  }
  times.sort((a,b)=>a-b);
  console.log(type.padEnd(8),diff.padEnd(6),'ok',ok+'/'+n,'null',nulls,'median ms',times[Math.floor(n/2)].toFixed(1),'p95 ms',times[Math.floor(n*0.95)].toFixed(1),'max',times[n-1].toFixed(0),'| sample sizes:',extra.slice(0,8).join(' '));
  if(fails.length) console.log('  FAILS',fails.slice(0,4));
}
const which=process.argv[2]||'all';
for(const type of ['sudoku','crowns','sunmoon','path','calc']) if(which==='all'||which===type) for(const diff of ['easy','medium','hard']) stats(type,diff,+(process.argv[3]||40));
