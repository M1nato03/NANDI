const G=require(require('path').join(__dirname,'../src/cases.js'));
for(const diff of ['easy','medium','hard']){
  let ok=0, fail=0, nulls=0, clueN=[], ipUsed=0, t0=Date.now(), stepsMin=99, problems=[];
  for(let k=0;k<300;k++){
    const C=G.generate({seed:1000+k*7919, diff});
    if(!C){ nulls++; continue; }
    const n=C.n;
    // 1. exactly one assignment fits all clues
    const cnt=G.countSolutions(C.clues,n);
    // 2. the true solution satisfies every clue
    const fits=C.clues.every(cl=>G.holds(cl,C.sol.sp,C.sol.si));
    // 3. solvable step by step (no guessing)
    const pr=G.propagate(C.clues,n,diff!=='easy');
    // 4. killer clue not stated outright
    const cu=C.culprit, direct = C.killer.k==='place' ? C.clues.some(c=>c.k==='sp+'&&c.s===cu) : C.clues.some(c=>c.k==='si+'&&c.s===cu);
    // 5. propagated grid equals the true solution
    let match=pr.solved; if(pr.solved){ for(let s=0;s<n;s++){ if(pr.G.A[s][C.sol.sp[s]]!==1||pr.G.B[s][C.sol.si[s]]!==1) match=false; } }
    if(cnt===1&&fits&&pr.solved&&!direct&&match) ok++; else { fail++; problems.push({cnt,fits,solved:pr.solved,direct,match}); }
    clueN.push(C.clues.length); stepsMin=Math.min(stepsMin,C.steps.length);
    if(C.clues.some(c=>c.k[0]==='i')) ipUsed++;
  }
  const avg=(clueN.reduce((a,b)=>a+b,0)/clueN.length).toFixed(1);
  console.log(diff.padEnd(6),'ok',ok,'fail',fail,'null',nulls,'avg clues',avg,'range',Math.min(...clueN)+'-'+Math.max(...clueN),'uses item-place clues',ipUsed,'min explanation steps',stepsMin,'ms/case',((Date.now()-t0)/300).toFixed(1));
  if(problems.length) console.log(problems.slice(0,3));
}
const C=G.daily('2026-10-03'); console.log('\nDaily '+C.diff+': '+C.title+'\n'+C.setup);
C.S.forEach(s=>console.log(' suspect:',s.n,'('+s.role+')')); console.log(' objects:',C.I.map(i=>i.n).join(', '),'| places:',C.P.map(p=>p.n).join(', '));
C.clues.forEach((c,i)=>console.log(' '+(i+1)+'. '+c.text)); console.log(' Killer: '+C.killerText);
console.log(' Answer:',C.S[C.culprit].n,'/',C.I[C.sol.si[C.culprit]].n,'/',C.P[C.sol.sp[C.culprit]].n);
console.log(' Steps:\n  - '+C.steps.join('\n  - '));
