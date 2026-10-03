import * as khwanSet from '../rehearsal-lab/sets/khwan.js';
import * as coffeeSet from '../rehearsal-lab/sets/coffee.js';
import * as interactiveSet from '../rehearsal-lab/sets/interactive.js';
import * as filmSet from '../rehearsal-lab/sets/film.js';
import * as makingSet from '../rehearsal-lab/sets/making.js';
import * as pricingSet from '../rehearsal-lab/sets/pricing.js';
import * as contactSet from '../rehearsal-lab/sets/contact.js';
import * as editionsSet from '../rehearsal-lab/sets/editions.js';
const $ = id => document.getElementById(id);
// One visit's truth, owned by the journey (memory only; nothing personal is stored on the device unless the visitor chooses).
const session={records:[],keeps:[],bindings:{},khwan:null,residues:[],lastProof:null,contactService:null,attach:null,draft:null,editions:null};
const proofs=['khwan','film','interactive','coffee'];
const routes = {
 studio:['THE STUDIO','Already making.','A shared stage. Choose an object or use the navigation.'],
 work:['WORK','What can we make?','Two services. Two different ways to take part.'],
 worlds:['WORLDS','Enter a world.','KHWAN is the first playable world in production.'],
 khwan:['KHWAN','A product with a life inside.','Can, RUSH, ribbon and lens are stand-ins. Full shake behaviour follows in Round 2.'],
 coffee:['COFFEE / SIGNALS','A small break. A living system.','The cup, stool and Radio share this corner. Free play and real support remain separate.'],
 interactive:['INTERACTIVE','Same context. New intent.','Demo camera. Capture, focus and reinterpretation follow in Round 2.'],
 film:['FILM','You choose where it ends.','A prop mug belongs to the take. The real coffee cup stays outside it.'],
 making:['MAKING','Open the moment.','Production evidence will appear here. No visitor history is fabricated.'],
 pricing:['SERVICES & PRICING','Let’s make something work.','Scope, budget range and timing will live here. Public prices are not approved yet.'],
 contact:['CONTACT','What are you imagining?','Rehearsal only. Nothing here is sent to a server.'],
 editions:['EDITIONS','Something worth keeping.','No product is available to buy in this rehearsal.'],
 about:['ABOUT','By Thanest.','High craft. Low ego. Open door.'],
 sound:['SOUND','You choose the volume.','An optional quiet rehearsal tone tests sound controls. It is not the soundtrack.'],
 accessibility:['ACCESSIBILITY','Another way in.','Every destination is a normal link. Use Tab and Enter, or reduce motion below.'],
 visit:['VISIT SHEET','What you kept.','Only what you chose to KEEP. No empty slots, no score.']
};
const objects=[['work','Archive → Work'],['worlds','Worlds object'],['khwan','Can → KHWAN'],['coffee','Cup → Coffee'],['interactive','Camera → Interactive'],['film','Slate → Film'],['making','Folder → Making'],['pricing','Note → Pricing'],['contact','Envelope → Contact'],['editions','Stall → Editions']];
const names=['maker','table','radio','hero','companion'];
// Pose values are normalized coordinates, rotation, scale. Shared nodes retain identity.
const poses={
 studio:[[.32,.37,-2,1],[.46,.68,0,1],[.74,.62,5,1],[.15,.5,-8,.65],[.63,.60,0,1]],
 khwan:[[.12,.48,0,.55],[.42,.83,0,.5],[.84,.65,0,.65],[.49,.31,-8,1.3],[.7,.3,20,1]],
 coffee:[[.1,.5,0,.65],[.46,.64,0,.65],[.68,.51,-6,1],[.43,.32,0,.85],[.79,.3,0,1]],
 film:[[.27,.39,0,1],[.5,.62,90,.8],[.85,.67,3,.7],[.66,.30,-10,.8],[.39,.62,0,.85]],
 interactive:[[.1,.5,0,.6],[.44,.71,0,1.2],[.85,.65,0,.7],[.49,.32,0,1.15],[.73,.45,0,1]],
 quiet:[[.1,.51,0,.6],[.43,.73,0,1.2],[.87,.69,0,.6],[.45,.27,0,1],[.68,.49,0,1]]
};
let route='', generation=0, opening=false, reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let current=poses.studio.map(p=>[...p]), target=current.map(p=>[...p]), soundOn=false, audio, osc, gain;
const trace=[];
const record=(type,detail)=>{trace.push({type,detail,t:performance.now()});if(trace.length>100)trace.shift();};
const card=(id,label,detail='')=>`<a class="card" href="#/${id}"><strong>${label}</strong><small>${detail}</small></a>`;
function content(id){
 const tag='<span class="tag">ROUND 2 · STAND-INS · NOT ART DIRECTION</span>';
 const map={
 studio:`<h2>My head is busy. My calendar has room.</h2><p>Objects and text links lead to the same rooms. You can leave during the opening or change destination during a transformation.</p><div class="cards">${card('work','Discover the work','Film and Interactive')}${card('contact','Start a conversation','Go straight to Contact')}</div>`,
 work:`<div class="cards">${card('film','Film / AI Film','Choose the boundary of a story')}${card('interactive','Interactive / Web App','Change intent without losing context')}${card('making','Making By Thanest','Evidence of the work')}${card('pricing','Services & Pricing','Scope and next steps')}</div><p>No invented client cases. These are rehearsal experiences.</p>`,
 worlds:`<div class="cards">${card('khwan','KHWAN','Enter the beverage world')}</div>`,
 khwan:`${tag}<div class="set-mount" id="set-mount"></div>`,
 coffee:`${tag}<div class="set-mount" id="set-mount"></div>`,
 interactive:`${tag}<div class="set-mount" id="set-mount"></div>`,
 film:`${tag}<div class="set-mount" id="set-mount"></div>`,
 making:`${tag}<div class="set-mount" id="set-mount"></div>`,
 pricing:`${tag}<div class="set-mount" id="set-mount"></div>`,
 contact:`${tag}<div class="set-mount" id="set-mount"></div>`,
 editions:`<div class="set-mount" id="set-mount"></div><p class="lab-link">Rehearsal only: <a href="../rehearsal-lab/editions.html">see the stall with labelled sample items ↗</a></p>`,
 about:`<p>A living studio by Thanest. Film / AI Film and Interactive / Web App.</p><a href="#/contact">Start a conversation</a>`,
 sound:`<p>${routes.sound[2]} Sound starts only when you choose it. Switching sets never turns it on. Hiding the tab suspends audio, not navigation or world state.</p>`,
 visit:`${session.keeps.length?`<div class="cards">${session.keeps.map((k,i)=>`<figure class="card"><img src="${k.image}" alt="Kept ${k.kind}" style="width:100%"><figcaption><small>${k.kind.replace(/-/g,' ')}</small></figcaption></figure>`).join('')}</div>`:'<p>Nothing kept yet. When a set offers KEEP, what you keep appears here.</p>'}`,
 accessibility:`<p>Keyboard: Tab moves among links and controls; Enter activates them. The first link skips to this content. There are no page-wide Space shortcuts.</p><p>Reduced motion makes stage changes immediate and uses a short opening acknowledgement. All routes remain available.</p>`
 };return map[id];
}
let mounted=null,mountedId=null;
const go=id=>{const h=`#/${id}`;if(location.hash===h)return;history.pushState({rehearsalIndex:(history.state?.rehearsalIndex||0)+1},'',h);show(id);};
const keep=r=>{session.keeps.push(r);paintVisit();};
function mountSet(id){
 const el=$('set-mount');document.body.classList.toggle('set-active',!!el);if(!el)return;
 if(proofs.includes(id))session.lastProof=id;
 const reducedMotion=reduced;
 const m={khwan:()=>khwanSet.mount(el,{reducedMotion,state:session.khwan,onKeep:keep,onRecord:r=>session.records.push(r),onResidue:r=>{session.residues.push(r);record('residue',r.id);}}),
  coffee:()=>coffeeSet.mount(el,{reducedMotion,bindings:session.bindings,onBindings:b=>{session.bindings=b;}}),
  interactive:()=>interactiveSet.mount(el,{reducedMotion,onKeep:keep}),
  film:()=>filmSet.mount(el,{reducedMotion,onKeep:keep,onRecord:r=>session.records.push(r)}),
  making:()=>makingSet.mount(el,{moments:session.records,onExit:x=>{session.attach=x.attach;go(x.to);}}),
  pricing:()=>pricingSet.mount(el,{showRanges:false,onStartBrief:x=>{session.contactService=x.service;go('contact');}}),
  contact:()=>contactSet.mount(el,{interest:session.attach?(session.attach.kind==='khwan-shot'?'KHWAN':'Film'):({khwan:'KHWAN',film:'Film',interactive:'Interactive',coffee:'Studio Signals'})[session.lastProof]||null,service:session.contactService,draft:session.draft,onDraft:d=>{session.draft=d;}}),
  editions:()=>editionsSet.mount(el,{items:[]})}[id];
 mounted=m?m():null;mountedId=id;window.__rehearsal.set=mounted;
}
function unmountSet(){if(!mounted)return;if(mountedId==='khwan')session.khwan=mounted.getState();mounted.leave?.();mounted.unmount?.();mounted=null;mountedId=null;document.body.classList.remove('set-active');}
// D4: every residue has a home, and never rewrites another proof (the Film take still runs as scripted)
function paintResidue(){const r=$('residue');const has=session.residues.some(x=>x.kind==='khwan-segment');const where={studio:[.52,.8],film:[.44,.8]}[route];
 r.hidden=!has||!where;if(!r.hidden){r.style.left=`${where[0]*100}%`;r.style.top=`${where[1]*100}%`;r.title=route==='film'?'The escaped segment rests by the chair leg':'The escaped segment rests under the Maker\'s table';}}
function paintVisit(){const a=$('visit-link');if(a)a.textContent=`Visit Sheet (${session.keeps.length})`;}
function parseRoute(){const key=location.hash.replace(/^#\/?/,'').replace(/\/$/,'');return key||'studio';}
function show(id,{initial=false}={}){
 unmountSet();generation++;const token=generation;opening=false;
 if(!routes[id]){route='not-found';$('eyebrow').textContent='UNKNOWN DESTINATION';$('title').textContent='That room is not here.';$('panel').innerHTML='<p>This link is not a rehearsal route.</p><a href="#/studio">Return to Studio</a>';$('objects').hidden=true;$('beat').textContent='Navigation remains available.';paintResidue();return;}
 route=id;document.title=`${routes[id][0]} — By Thanest rehearsal`;
 $('eyebrow').textContent=routes[id][0];$('title').textContent=routes[id][1];$('stage-note').textContent=routes[id][2];$('panel').innerHTML=content(id);
 mountSet(id);
 $('objects').hidden=id!=='studio';
 const labels={studio:['WORK TABLE','ARCHIVE','CUP'],khwan:['STAGE','CAN','RIBBON'],coffee:['STOOL','CUP','PANEL'],film:['CHAIR','SLATE','PROP CUP'],interactive:['DISPLAY','CAMERA','PHOTO']};
 const l=labels[id]||['DESK',routes[id][0],'NOTES'];$('table').textContent=l[0];$('hero').textContent=l[1];$('companion').textContent=l[2];
 target=(poses[id]||poses.quiet).map(p=>[...p]);
 const immediate=initial||reduced||['pricing','contact','editions','about','sound','accessibility'].includes(id);
 if(immediate)current=target.map(p=>[...p]);
 $('beat').textContent=immediate?'Ready. Choose where to go next.':'The same stage is rearranging. You can change destination now.';
 record('route',id);paintResidue();
 document.querySelectorAll('nav a').forEach(a=>{if(a.hash===`#/${id}`)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 if(initial&&id==='studio'){
  opening=true;record('opening-start',reduced?'reduced':'full');
  if(!reduced){current=target.map((p,i)=>[p[0],1.25+i*.12,p[2]+35,p[3]*.2]);$('beat').textContent='Opening: the table arrives, the Maker assembles. Navigation is already open.';}
  else $('beat').textContent='Opening: the studio is assembled. Reduced motion is on.';
  setTimeout(()=>{if(token!==generation)return;opening=false;$('beat').textContent='The studio is already at work. Choose an object or a link.';record('opening-complete',id);},reduced?180:1800);
 }
 if(!initial)$('content').focus({preventScroll:true});
}
let last=performance.now();
function tick(now){const dt=Math.min((now-last)/1000,.05);last=now;const blend=reduced?1:1-Math.exp(-dt*7);const w=$('stage').clientWidth,h=$('stage').clientHeight;let moving=false;
 names.forEach((name,i)=>{current[i]=current[i].map((v,j)=>{const gap=target[i][j]-v;if(Math.abs(gap)>.002)moving=true;return v+gap*blend;});const [x,y,r,s]=current[i];const el=$(name);const mobile=w<600;const scale=s*(mobile?.72:1);el.style.transform=`translate(${x*w-el.offsetWidth/2}px,${y*h-el.offsetHeight/2}px) rotate(${r}deg) scale(${scale})`;});
 if(!moving&&!opening&&$('beat').textContent.startsWith('The same stage'))$('beat').textContent='Ready. The stage is settled; navigation stays open.';
 requestAnimationFrame(tick);
}
async function applySound(){if(!soundOn||document.hidden){if(audio)await audio.suspend();return;}if(!audio){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw Error('Audio is not supported');audio=new AC();osc=audio.createOscillator();gain=audio.createGain();osc.frequency.value=146.83;gain.gain.value=.012;osc.connect(gain).connect(audio.destination);osc.start();}await audio.resume();}
function paintSound(){$('sound').textContent=soundOn?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(soundOn));}
$('sound').onclick=async()=>{soundOn=!soundOn;paintSound();try{await applySound();}catch{soundOn=false;paintSound();$('beat').textContent='Audio is unavailable. All routes still work.';}};
document.addEventListener('visibilitychange',()=>applySound().catch(()=>{}));
function setReduced(value){reduced=value;$('reduce').checked=value;if(value)current=target.map(p=>[...p]);record('reduced-motion',value);}
$('reduce').checked=reduced;$('reduce').onchange=e=>setReduced(e.target.checked);
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>setReduced(e.matches));
$('back').onclick=()=>{if(history.state?.rehearsalIndex>0)history.back();else location.hash='/studio';};
let historyIndex=history.state?.rehearsalIndex||0;
history.replaceState({...history.state,rehearsalIndex:historyIndex},'');
document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#/"]');if(!a||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();if(location.hash===a.hash)return;historyIndex=(history.state?.rehearsalIndex||0)+1;history.pushState({rehearsalIndex:historyIndex},'',a.hash);show(parseRoute());});
window.addEventListener('popstate',()=>show(parseRoute()));
window.addEventListener('hashchange',()=>{if(parseRoute()!==route)show(parseRoute());});
$('objects').innerHTML=objects.map(([id,label])=>`<a href="#/${id}">${label}</a>`).join('');
window.__rehearsal={set:null,session,get state(){return {route,opening,reduced,soundOn,audioState:audio?.state||'not-created',trace:[...trace],current:current.map(p=>[...p]),target:target.map(p=>[...p])};}};
show(parseRoute(),{initial:true});requestAnimationFrame(tick);
