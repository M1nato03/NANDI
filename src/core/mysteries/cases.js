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
     itemQ:"Deleted from", killPlace:"The files were deleted by someone {pp}.", killItem:"The files were deleted from the {i}."},
    {key:"ball", title:"The missing match ball",
     setup:"Minutes before the last over of the hostel cricket final, the only new ball vanished from the umpire's bag.",
     suspects:[["Sahil","the wicketkeeper"],["Neha","the scorer"],["Imran","the twelfth man"],["Coach Thomas","the team coach"]],
     items:["water crate","kit bag","scorer's satchel","spare helmet"],
     places:[["at","the boundary rope","Boundary"],["in","the dressing room","Dressing room"],["at","the scorer's table","Score table"],["in","the nets","Nets"]],
     itemQ:"Hidden in", killPlace:"The ball was taken by someone {pp}.", killItem:"The ball was hidden in the {i}."},
    {key:"journal", title:"The vanished lab journal",
     setup:"The day before submissions, Kavya's chemistry lab journal disappeared from her bench.",
     suspects:[["Om","her lab partner"],["Ms. Iyer","the lab assistant"],["Rehan","the class monitor"],["Gita","the photocopy shop owner"]],
     items:["apron pocket","file folder","lunch bag","drawing tube"],
     places:[["in","the chemistry lab","Chem lab"],["in","the staff room","Staff room"],["at","the photocopy shop","Photocopy"],["in","the corridor","Corridor"]],
     itemQ:"Hidden in", killPlace:"The journal was taken by someone {pp}.", killItem:"The journal was slipped into the {i}."},
    {key:"manja", title:"The champion's manja",
     setup:"On Uttarayan morning, the rooftop champion's reel of kite string vanished before the contest began.",
     suspects:[["Jigar","the champion's rival"],["Dimple","the neighbour"],["Kanu","the kite seller"],["Mansi","the champion's sister"]],
     items:["chikki tin","water bucket","shawl","school bag"],
     places:[["on","the terrace","Terrace"],["on","the stairs","Stairs"],["at","the chai stall","Chai stall"],["in","the lane","Lane"]],
     itemQ:"Hidden in", killPlace:"The reel was taken by someone {pp}.", killItem:"The reel was hidden in the {i}."},
    {key:"sweets", title:"The Diwali sweet box",
     setup:"The box of kaju katli for the office Diwali party vanished from the pantry an hour before the party.",
     suspects:[["Rakesh","the accounts clerk"],["Shalini","the HR manager"],["Tenzin","the intern"],["Murugan","the office driver"]],
     items:["laptop bag","courier box","umbrella bag","tote bag"],
     places:[["in","the pantry","Pantry"],["at","the reception","Reception"],["in","the lift lobby","Lift lobby"],["in","the parking","Parking"]],
     itemQ:"Carried in", killPlace:"The box was taken by someone {pp}.", killItem:"The box left in the {i}."},
    {key:"coin", title:"The coin from the school museum",
     setup:"On open day, a replica gold coin vanished from the school museum's glass case.",
     suspects:[["Arnav","the student guide"],["Zoya","the art teacher"],["Pritam","the guard"],["Mrs. Kulkarni","a visiting parent"]],
     items:["brochure stack","camera bag","water flask","handbag"],
     places:[["in","the coin gallery","Coin gallery"],["at","the gift corner","Gift corner"],["at","the entrance","Entrance"],["in","the garden","Garden"]],
     itemQ:"Hidden in", killPlace:"The coin was taken by someone {pp}.", killItem:"The coin was hidden in the {i}."},
    {key:"keys", title:"The scooter keys in the rain",
     setup:"On a monsoon evening, the keys to the society's shared scooter disappeared from the key board.",
     suspects:[["Mr. D'Souza","the treasurer"],["Anjali","the tuition teacher"],["Babloo","the watchman"],["Ritu","the college student"]],
     items:["umbrella","raincoat","shoe rack","milk crate"],
     places:[["in","the lobby","Lobby"],["at","the gate","Gate"],["in","the basement","Basement"],["on","the stairs","Stairs"]],
     itemQ:"Hidden in", killPlace:"The keys were taken by someone {pp}.", killItem:"The keys were tucked into the {i}."},
    {key:"reel", title:"The last film reel",
     setup:"An hour before the film club's screening of an old classic, its final reel went missing.",
     suspects:[["Farhan","the projectionist"],["Divya","the club secretary"],["Raghav","the guest critic"],["Leela aunty","the canteen owner"]],
     items:["popcorn sack","tripod bag","poster tube","cash box"],
     places:[["in","the projection room","Projection room"],["at","the ticket table","Ticket table"],["in","the canteen","Canteen"],["behind","the screen","Backstage"]],
     itemQ:"Hidden in", killPlace:"The reel was taken by someone {pp}.", killItem:"The reel was hidden in the {i}."},
    {key:"mela", title:"The cup at the village mela",
     setup:"At the village mela, the silver cup for the bullock-cart race vanished from the judges' table.",
     suspects:[["Hari","a cart driver"],["Kamla","the tea seller"],["Sukhdev","a race judge"],["Pinky","the swing operator"]],
     items:["hay bundle","tea kettle","drum case","grain sack"],
     places:[["at","the race track","Race track"],["at","the swing ride","Swing ride"],["at","the tea stall","Tea stall"],["in","the judges' tent","Judges' tent"]],
     itemQ:"Hidden in", killPlace:"The cup was taken by someone {pp}.", killItem:"The cup was hidden in the {i}."},
    {key:"deck", title:"The blank pitch deck",
     setup:"Hours before demo day, the startup's pitch deck was replaced with a blank file.",
     suspects:[["Varun","the co-founder"],["Aisha","the designer"],["Kiran","the new hire"],["Mr. Bose","the mentor"]],
     items:["office laptop","tablet","shared phone","backup drive"],
     places:[["in","the meeting room","Meeting room"],["at","the coworking café","Café"],["in","the server corner","Server corner"],["on","the terrace","Terrace"]],
     itemQ:"Changed on", killPlace:"The file was changed by someone {pp}.", killItem:"The deck was changed on the {i}."},
    {key:"atlas", title:"The page from the old atlas",
     setup:"During exam week, a map page was cut out of the library's oldest atlas.",
     suspects:[["Ishaan","the class topper"],["Bina","the librarian"],["Karthik","a research scholar"],["Mehul","the book binder"]],
     items:["steel ruler","paper cutter","razor blade","scissors"],
     places:[["in","the reading hall","Reading hall"],["in","the rare books room","Rare books"],["at","the issue desk","Issue desk"],["in","the stacks","Stacks"]],
     itemQ:"Cut with", killPlace:"The page was cut by someone {pp}.", killItem:"The page was cut with the {i}."},
    {key:"masala", title:"The secret masala recipe",
     setup:"The handwritten recipe for a food truck's famous pav bhaji masala vanished from its tin.",
     suspects:[["Bunty","the helper"],["Sharmila","a rival vendor"],["Rohit","a food blogger"],["Anil kaka","the owner's cousin"]],
     items:["napkin pile","delivery bag","spice jar","order book"],
     places:[["at","the truck window","Truck window"],["at","the bus stop","Bus stop"],["in","the storeroom","Storeroom"],["in","the parking","Parking"]],
     itemQ:"Hidden in", killPlace:"The recipe was taken by someone {pp}.", killItem:"The recipe was hidden in the {i}."},
    {key:"tripfund", title:"The class trip money",
     setup:"The envelope of class trip money vanished from the teacher's desk the day before the Goa trip.",
     suspects:[["Aarav","the class monitor"],["Sister Mary","the class teacher"],["Pooja","the treasurer"],["Raju","the peon"]],
     items:["geometry box","lunch box","sports bag","umbrella"],
     places:[["in","the classroom","Classroom"],["in","the staff room","Staff room"],["at","the canteen","Canteen"],["on","the playground","Playground"]],
     itemQ:"Hidden in", killPlace:"The envelope was taken by someone {pp}.", killItem:"The envelope was hidden in the {i}."},
    {key:"cameratrap", title:"The camera-trap card",
     setup:"At a tiger reserve research camp, the memory card from a camera trap disappeared overnight.",
     suspects:[["Dr. Rao","the field biologist"],["Sunita","the forest guard"],["Jai","the intern"],["Mr. Malik","the jeep driver"]],
     items:["binocular case","first-aid kit","map tube","thermos"],
     places:[["at","the watchtower","Watchtower"],["in","the jeep","Jeep"],["at","the camp kitchen","Camp kitchen"],["by","the waterhole","Waterhole"]],
     itemQ:"Hidden in", killPlace:"The card was taken by someone {pp}.", killItem:"The card was hidden in the {i}."},
    {key:"sitar", title:"The snapped sitar strings",
     setup:"Before the college music finals, every string on the lead sitar was found snapped.",
     suspects:[["Ustad Salim","the guest judge"],["Megha","the tabla player"],["Pranav","a rival singer"],["Joseph","the sound engineer"]],
     items:["nail cutter","pliers","scissors","wire clipper"],
     places:[["in","the green room","Green room"],["on","the stage","Stage"],["in","the practice room","Practice room"],["at","the sound desk","Sound desk"]],
     itemQ:"Snapped with", killPlace:"The strings were snapped by someone {pp}.", killItem:"The strings were snapped with the {i}."},
    {key:"metro", title:"The laptop at the metro",
     setup:"A laptop left on the metro was handed in, then vanished from the station office.",
     suspects:[["Gurpreet","the station clerk"],["Abhinav","a passenger"],["Salma","the cleaner"],["Rohan","the security guard"]],
     items:["mop bucket","duffel bag","cardboard box","office drawer"],
     places:[["at","the ticket counter","Ticket counter"],["on","the platform","Platform"],["in","the station office","Office"],["at","the exit gate","Exit gate"]],
     itemQ:"Hidden in", killPlace:"The laptop was taken by someone {pp}.", killItem:"The laptop was hidden in the {i}."},
    {key:"cake", title:"The dented wedding cake",
     setup:"The night before delivery, someone pressed a deep dent into the bakery's three-tier wedding cake.",
     suspects:[["Tanya","the baker"],["Sameer","the delivery rider"],["Mrs. Gill","the customer's aunt"],["Lokesh","the night helper"]],
     items:["rolling pin","spatula","ladle","baking tray"],
     places:[["in","the kitchen","Kitchen"],["at","the counter","Counter"],["in","the cold room","Cold room"],["at","the back door","Back door"]],
     itemQ:"Dented with", killPlace:"The cake was dented by someone {pp}.", killItem:"The cake was dented with the {i}."},
    {key:"chessclock", title:"The slow chess clock",
     setup:"Mid-round at the city chess open, the top board's clock was set ten minutes slow.",
     suspects:[["Vishal","the top seed"],["Ananya","the arbiter"],["Kabir","a spectator"],["Mrs. Pillai","a player's mother"]],
     items:["pen tip","hair clip","coin","house key"],
     places:[["at","board one","Board one"],["at","the arbiter's desk","Arbiter's desk"],["in","the analysis room","Analysis room"],["at","the tea stall","Tea stall"]],
     itemQ:"Changed with", killPlace:"The clock was changed by someone {pp}.", killItem:"The clock was changed with the {i}."},
    {key:"canal", title:"The open canal gate",
     setup:"Overnight, someone opened the canal gate and flooded a neighbour's onion field.",
     suspects:[["Ramesh","the next farmer"],["Gauri","the farm adviser"],["Bhupen","the tractor driver"],["Sarpanch-ji","the village head"]],
     items:["spade","crowbar","sickle","tractor key"],
     places:[["at","the canal","Canal"],["at","the pump house","Pump house"],["in","the cowshed","Cowshed"],["by","the banyan tree","Banyan tree"]],
     itemQ:"Opened with", killPlace:"The gate was opened by someone {pp}.", killItem:"The gate was opened with the {i}."},
    {key:"kheer", title:"Salt in the mess kheer",
     setup:"On result day, someone swapped the sugar for salt in the hostel mess kheer.",
     suspects:[["Mohan","the head cook"],["Riya","the mess secretary"],["Faisal","a hungry senior"],["Lakshmi","the helper"]],
     items:["steel jug","tea kettle","rice sack","spice box"],
     places:[["in","the mess kitchen","Mess kitchen"],["at","the serving line","Serving line"],["in","the store room","Store room"],["at","the wash area","Wash area"]],
     itemQ:"Salt taken from", killPlace:"The swap was made by someone {pp}.", killItem:"The salt came from the {i}."},
    {key:"mural", title:"Paint on the prize mural",
     setup:"The night before judging, the hostel's prize mural was splashed with paint.",
     suspects:[["Ankit","the rival captain"],["Sneha","the mural artist"],["Deepak","the warden"],["Tara","a first-year student"]],
     items:["paint bucket","spray can","paint roller","water pistol"],
     places:[["in","the courtyard","Courtyard"],["on","the terrace","Terrace"],["in","the art room","Art room"],["at","the hostel gate","Hostel gate"]],
     itemQ:"Splashed with", killPlace:"The mural was splashed by someone {pp}.", killItem:"The mural was splashed with the {i}."},
    {key:"ferry", title:"The bag on the ferry",
     setup:"On a short ferry ride, a tourist's bag with passports vanished between the two jetties.",
     suspects:[["Sneha","the tour guide"],["Kunal","a honeymooner"],["Pradeep","the deckhand"],["Elena","a backpacker"]],
     items:["life jacket","snack basket","rope coil","cooler box"],
     places:[["on","the upper deck","Upper deck"],["at","the snack counter","Snack counter"],["in","the engine bay","Engine bay"],["at","the ramp","Ramp"]],
     itemQ:"Hidden in", killPlace:"The bag was taken by someone {pp}.", killItem:"The bag was hidden under the {i}."},
    {key:"satphone", title:"The base-camp phone",
     setup:"At a Himalayan trek's base camp, the satellite phone vanished from the mess tent.",
     suspects:[["Tashi","the trek leader"],["Nandini","the camp doctor"],["Ayaan","a vlogger"],["Puran","the porter"]],
     items:["sleeping bag","rucksack","tent-pole bag","stove box"],
     places:[["in","the mess tent","Mess tent"],["by","the stream","Stream"],["in","the gear tent","Gear tent"],["on","the ridge","Ridge"]],
     itemQ:"Hidden in", killPlace:"The phone was taken by someone {pp}.", killItem:"The phone was hidden in the {i}."},
    {key:"ballots", title:"The council ballots",
     setup:"During student council voting, a bundle of ballots vanished from the ballot box.",
     suspects:[["Harsh","a candidate"],["Mrs. Saxena","the returning officer"],["Nisha","a polling volunteer"],["Ali","the campaign manager"]],
     items:["attendance register","cloth bag","notice-board file","bottle carrier"],
     places:[["in","the polling room","Polling room"],["in","the principal's corridor","Corridor"],["at","the canteen","Canteen"],["at","the bicycle stand","Cycle stand"]],
     itemQ:"Hidden in", killPlace:"The ballots were taken by someone {pp}.", killItem:"The ballots were hidden in the {i}."}
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
  function propagate(clues,n,cross,current){
    const mk=()=>Array.from({length:n},()=>new Array(n).fill(0));
    const G={A:mk(),B:mk(),C:mk()}; // A: suspect x place, B: suspect x item, C: item x place
    const steps=[]; let bad=false, changed=true;
    if(current) for(const g of ["A","B","C"]) for(let r=0;r<n;r++) for(let c=0;c<n;c++) G[g][r][c]=current[g]?.[r*n+c]||0;
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
    // Same table as RULES.mind.caseDiffByWeekday (Sunday hard), which the app passes in; this is only the fallback.
    return dow===0?"hard":(dow===1||dow===2)?"easy":"medium";
  }
  function daily(dateStr,diff){
    return generate({seed:hash("daily:"+dateStr), diff:diff||dailyDiff(dateStr)});
  }
  return {THEMES, DIFF, generate, daily, dailyDiff, propagate, countSolutions, hash, holds};
})();
if (typeof module !== "undefined" && !Object.getOwnPropertyDescriptor(module.exports, "default")) module.exports = CaseGen;

export default CaseGen;
