const fs=require('fs'); eval(fs.readFileSync(require('path').join(__dirname,'../src/lessons_gita.js'),'utf8')+fs.readFileSync(require('path').join(__dirname,'../src/lessons_charaka.js'),'utf8')+';global.COURSES=COURSES;');
const KINDS={split:['l','ls','r','rs'],chain:['steps'],three:['top','items'],thirds:['items'],stairs:['steps'],meter:['zones','hi'],ring:['center','outer'],cycle:['nodes'],curves:['a','b'],wave:['top','bot'],balance:['l','r','mid']};
let errs=0, n=0; const ids=new Set();
const mcq=(x,where,keys)=>{ if(!Array.isArray(x.o)||x.o.length<3) return err(where+' opts'); if(new Set(x.o).size!==x.o.length) err(where+' dup opts'); if(!(Number.isInteger(x.a)&&x.a>=0&&x.a<x.o.length)) err(where+' bad a'); for(const k of keys) if(typeof x[k]!=='string'||!x[k].trim()) err(where+' missing '+k); };
function err(m){ errs++; console.log('ERR',cur,m); }
let cur='';
for(const C of COURSES){ for(const L of C.lessons){ n++; cur=L.id; if(ids.has(L.id)) err('dup id'); ids.add(L.id);
  for(const k of ['t','scene','q','rv','rule','sl']) if(typeof L[k]!=='string'||!L[k].trim()) err('missing '+k);
  mcq(L,'guess',['q']); mcq(L.tr,'transfer',['s','q','w']); mcq(L.wy,'why',['q','f']);
  if(!L.pic||!KINDS[L.pic.k]) err('pic kind'); else for(const k of KINDS[L.pic.k]) if(L.pic[k]==null) err('pic missing '+k);
  if(!L.term||!L.term.w||!L.term.g) err('term');
  if(C.id==='gita'){ if(!Array.isArray(L.v)||!L.v.length) err('verses'); else L.v.forEach(v=>{ for(const k of ['ref','who','s','i','m']) if(!v[k]) err('verse '+v.ref+' missing '+k); }); }
  else { if(!L.src||!L.src.ref||!L.src.line) err('src'); if(!L.grade||!L.grade.g) err('grade'); if(!L.sci) err('sci'); }
  if(!Array.isArray(L.st)||L.st.length!==2) err('story');
  if(!L.pl||L.pl.i.length<2||L.pl.t.length<2) err('plan');
  if(!Array.isArray(L.cards)||L.cards.length!==2||L.cards.some(c=>!c[0]||!c[1])) err('cards');
  const txt=JSON.stringify(L); if(/\byou should\b/i.test(txt)) console.log('note: "you should" in',L.id);
}}
console.log('lessons',n,'errors',errs);
const dist={}; for(const C of COURSES) for(const L of C.lessons){ dist['g'+L.a]=(dist['g'+L.a]||0)+1; dist['t'+L.tr.a]=(dist['t'+L.tr.a]||0)+1; } console.log(dist);
const len=s=>s.length; let maxScene=0; for(const C of COURSES) for(const L of C.lessons) maxScene=Math.max(maxScene,len(L.scene)); console.log('max scene chars',maxScene);
