// By Thanest — journey rehearsal, ONE STAGE (DEC-020). Every set arrives into the stage from the object that was chosen;
// the previous state leaves. The hash only records the state (Back, refresh and deep links stay real — Blueprint §2).
// Set behaviour lives in ../rehearsal-lab/sets/*.js (tested modules). Stand-ins only — not art direction (rule 9).
import * as khwanSet from '../rehearsal-lab/sets/khwan.js?v=202610041443';
import * as coffeeSet from '../rehearsal-lab/sets/coffee.js?v=202610041443';
import * as interactiveSet from '../rehearsal-lab/sets/interactive.js?v=202610041443';
import * as filmSet from '../rehearsal-lab/sets/film.js?v=202610041443';
import * as makingSet from '../rehearsal-lab/sets/making.js?v=202610041443';
import * as pricingSet from '../rehearsal-lab/sets/pricing.js?v=202610041443';
import * as contactSet from '../rehearsal-lab/sets/contact.js?v=202610041443';
import * as editionsSet from '../rehearsal-lab/sets/editions.js?v=202610041443';
const $ = id => document.getElementById(id);

// One visit's truth, owned by the journey (memory only; nothing personal is stored on the device unless the visitor chooses).
const session = { records: [], keeps: [], bindings: {}, khwan: null, residues: [], lastProof: null, contactService: null, attach: null, draft: null };
const proofs = ['khwan', 'film', 'interactive', 'coffee'];
const names = { studio: 'The studio', work: 'Work', worlds: 'Worlds', khwan: 'KHWAN', coffee: 'Coffee corner', interactive: 'Interactive', film: 'Film set',
  making: 'Making By Thanest', pricing: 'Services & Pricing', contact: 'Contact', editions: 'Editions', about: 'About', sound: 'Sound', accessibility: 'Accessibility', visit: 'Visit Sheet' };
// Information routes get no ceremony (Blueprint: ceremony decreases as intent becomes clearer).
const quiet = ['pricing', 'contact', 'editions', 'about', 'sound', 'accessibility', 'visit', 'work', 'worlds', 'making'];
// Studio doors float around the Maker (the Maker page itself keeps its own head/lid play). [route, label, x, y | portrait x, y]
const doors = [
  ['making', 'Archive folder → Making', .22, .30, .28, .70],
  ['coffee', 'Mug → Coffee', .18, .44, .72, .70],
  ['pricing', 'Notes → Services & Pricing', .22, .58, .28, .77],
  ['contact', 'Paper plane → Contact', .18, .72, .72, .77],
  ['khwan', 'KHWAN can', .78, .30, .28, .84],
  ['film', 'Slate → Film', .82, .44, .72, .84],
  ['interactive', 'Camera → Interactive', .78, .58, .28, .91],
  ['editions', 'Price tag → Editions', .82, .72, .72, .91],
];
const residueHome = { studio: [.53, .70], film: [.50, .90] }; // under the Maker's table; by the chair leg
const residueHomePortrait = { studio: [.55, .63] };

let route = '', generation = 0, opening = false, reduced = matchMedia('(prefers-reduced-motion: reduce)').matches, soundOn = false, audio, osc, gain;
let mounted = null, mountedId = null, layer = null;
const trace = []; const record = (type, detail) => { trace.push({ type, detail, t: performance.now() }); if (trace.length > 100) trace.shift(); };
const say = t => { $('beat').textContent = t; };
const portrait = () => innerHeight > innerWidth * 1.1;

function paintDoors() {
  $('objects').innerHTML = doors.map(([id, label, x, y, px, py], i) => {
    const X = portrait() ? px : x, Y = portrait() ? py : y;
    return `<a href="#/${id}" data-door="${id}" aria-label="${label}" style="left:${X * 100}%;top:${Y * 100}%;--i:${i}">${portrait() ? label.split('→').pop().replace('Services & ', '').trim() : label}</a>`;
  }).join('');
}
// The studio's opening is the Maker page's own (ink loader → lid → lands on the head). Doors arrive after it lands.
function watchLanding(token) {
  const f = $('maker'), t0 = performance.now();
  const check = () => {
    if (token !== generation && route !== 'studio') return;
    let landed = false; try { const i = f.contentWindow.__intro; landed = !!i && !i.active; } catch {}
    if (landed || performance.now() - t0 > 20000) { // fallback only if the studio never reports (e.g. a failed load)
      document.body.classList.add('doors-in'); if (opening) { opening = false; say('The studio is already at work. Choose something around him, or MENU.'); record('opening-complete', 'studio'); }
      return;
    }
    requestAnimationFrame(check);
  };
  check();
}

// ---------------- info states (quiet: information leads) ----------------
function infoHTML(id) {
  const door = (r, t) => `<a href="#/${r}">${t}</a>`;
  return {
    work: `<h2>Work</h2><p>Two services, two ways to take part. No invented client cases.</p><div class="doors">${door('film', 'Film / AI Film')}${door('interactive', 'Interactive / Web App')}${door('making', 'Making By Thanest')}${door('pricing', 'Services & Pricing')}</div>`,
    worlds: `<h2>Worlds</h2><p>KHWAN — a world you can enter and play.</p><div class="doors">${door('khwan', 'Enter KHWAN')}</div>`,
    about: `<h2>By Thanest</h2><p>My head is busy. My calendar has room.</p><p>High craft. Low ego. Open door.</p><div class="doors">${door('contact', 'Start a conversation')}</div>`,
    sound: `<h2>Sound</h2><p>Sound starts only when you choose it (MENU → Sound). Switching sets never turns it on. Hiding the tab pauses audio, not the world.</p>`,
    accessibility: `<h2>Accessibility</h2><p>Every destination is a normal link in MENU. Tab and Enter work everywhere; there is no page-wide Space shortcut. Reduce motion makes changes immediate.</p>`,
    visit: `<h2>Visit Sheet</h2>${session.keeps.length ? `<div class="kept">${session.keeps.map(k => `<figure><img src="${k.image}" alt="Kept ${k.kind}"><figcaption><small>${k.kind.replace(/-/g, ' ')}</small></figcaption></figure>`).join('')}</div>` : '<p>Nothing kept yet. When a set offers KEEP, what you keep appears here.</p>'}`,
    'not-found': `<h2>That room is not here.</h2><div class="doors">${door('studio', 'Back to the studio')}</div>`,
  }[id];
}

// ---------------- set modules ----------------
const keep = r => { session.keeps.push(r); paintVisit(); };
function mountInto(el, id) {
  if (proofs.includes(id)) session.lastProof = id;
  const reducedMotion = reduced;
  const m = {
    khwan: () => khwanSet.mount(el, { reducedMotion, state: session.khwan, onKeep: keep, onRecord: r => session.records.push(r), onResidue: r => { session.residues.push(r); record('residue', r.id); } }),
    coffee: () => coffeeSet.mount(el, { reducedMotion, bindings: session.bindings, onBindings: b => { session.bindings = b; } }),
    interactive: () => interactiveSet.mount(el, { reducedMotion, onKeep: keep }),
    film: () => filmSet.mount(el, { reducedMotion, onKeep: keep, onRecord: r => session.records.push(r) }),
    making: () => makingSet.mount(el, { moments: session.records, onExit: x => { session.attach = x.attach; go(x.to); } }),
    pricing: () => pricingSet.mount(el, { showRanges: false, onStartBrief: x => { session.contactService = x.service; go('contact'); } }),
    contact: () => contactSet.mount(el, { interest: session.attach ? (session.attach.kind === 'khwan-shot' ? 'KHWAN' : 'Film') : ({ khwan: 'KHWAN', film: 'Film', interactive: 'Interactive', coffee: 'Studio Signals' })[session.lastProof] || null,
      service: session.contactService, draft: session.draft, onDraft: d => { session.draft = d; } }),
    editions: () => editionsSet.mount(el, { items: [] }),
  }[id];
  return m ? m() : null;
}
function unmountSet() {
  if (!mounted) return;
  if (mountedId === 'khwan') session.khwan = mounted.getState();
  mounted.leave?.(); mounted.unmount?.(); mounted = null; mountedId = null;
}

// ---------------- state changes on the one stage ----------------
function originOf(id) { // the set grows out of the object that was chosen (or the stage centre)
  const a = document.querySelector(`[data-door="${id}"]`); if (!a || route !== 'studio') return ['50%', '50%'];
  const r = a.getBoundingClientRect(); return [`${(r.left + r.width / 2) / innerWidth * 100}%`, `${(r.top + r.height / 2) / innerHeight * 100}%`];
}
function show(id, { initial = false } = {}) {
  const prev = route; unmountSet(); generation++; const token = generation; opening = false;
  if (!names[id] && id !== 'studio') id = 'not-found';
  const [ox, oy] = originOf(id);
  route = id; document.title = `${names[id] || 'Not here'} — By Thanest rehearsal`;
  // the previous set leaves (it is never stacked as a page)
  if (layer) { const old = layer; old.classList.add('leave'); setTimeout(() => old.remove(), reduced ? 0 : 500); layer = null; }
  [...$('sets').children].forEach(c => { if (!c.classList.contains('leave')) c.remove(); });
  const inSet = id !== 'studio';
  document.body.classList.toggle('in-set', inSet);
  $('back').hidden = !inSet; $('objects').hidden = inSet;
  if (inSet) {
    layer = document.createElement('section'); layer.className = 'set-layer'; layer.setAttribute('aria-label', names[id] || 'Not here');
    layer.style.setProperty('--ox', ox); layer.style.setProperty('--oy', oy);
    const immediate = initial || reduced || quiet.includes(id);
    if (immediate) layer.classList.add('instant'); else layer.classList.add('enter');
    layer.innerHTML = `<div class="set-frame">${infoHTML(id) ? `<div class="info">${infoHTML(id)}</div>` : `<p class="tagline">${names[id].toUpperCase()} · STAND-INS · NOT ART DIRECTION</p><div class="set-mount" id="set-mount"></div>`}</div>`;
    $('sets').appendChild(layer);
    const el = layer.querySelector('#set-mount'); if (el) { mounted = mountInto(el, id); mountedId = id; }
    if (!immediate) requestAnimationFrame(() => requestAnimationFrame(() => { if (token === generation) layer?.classList.remove('enter'); }));
    say(immediate ? `${names[id] || 'Not here'}.` : `The studio rebuilds itself into the ${names[id].toLowerCase()} — you can change your mind now.`);
    if (!initial) layer.focus?.({ preventScroll: true });
  } else {
    const f = $('maker'); if (!f.src) { f.src = f.dataset.src; if (!initial) { opening = true; say('Loading the studio…'); watchLanding(token); } } // the live studio loads only when it is first needed
    say(prev && prev !== 'studio' ? 'Back in the studio — it reassembles from what is true now.' : 'The studio is already at work. Choose something in it, or MENU.');
  }
  window.__rehearsal.set = mounted;
  record('route', id); paintResidue(); paintNav();
  if (initial && id === 'studio') {
    opening = true; record('opening-start', reduced ? 'reduced' : 'full');
    say('Loading the studio…'); watchLanding(token);
  } else if (id === 'studio' && !opening) document.body.classList.add('doors-in');
}
// D4: every residue has a home and never rewrites another proof (the Film take still runs as scripted)
function paintResidue() {
  const r = $('residue'), has = session.residues.some(x => x.kind === 'khwan-segment'), where = (portrait() && residueHomePortrait[route]) || residueHome[route];
  r.hidden = !has || !where; if (r.hidden) return;
  r.style.left = `${where[0] * 100}%`; r.style.top = `${where[1] * 100}%`;
  r.title = route === 'film' ? 'The escaped segment rests by the chair leg' : "The escaped segment rests under the Maker's table";
  if (route === 'film') { // the Film set is drawn by its module: show the segment's home in the set's own corner
    const s = layer?.querySelector('.set-frame'); if (s && !s.querySelector('.residue')) s.insertAdjacentHTML('afterbegin', '<div class="residue" style="position:relative;transform:none;width:28px;margin:0 0 6px" title="The escaped segment rests by the chair leg">SEG</div>');
    r.hidden = true;
  }
}
function paintNav() { document.querySelectorAll('.sh-menu nav a').forEach(a => a.hash === `#/${route}` ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')); }
function paintVisit() { $('visit-link').textContent = `Visit Sheet (${session.keeps.length})`; }
function setMenu(open) { $('menu').hidden = !open; $('menu-btn').setAttribute('aria-expanded', String(open)); $('menu-btn').textContent = open ? 'CLOSE' : 'MENU'; }

// ---------------- routing: the URL records the state ----------------
function parseRoute() { const key = location.hash.replace(/^#\/?/, '').replace(/\/$/, ''); return key || 'studio'; }
const go = id => { const h = `#/${id}`; if (location.hash === h) return; history.pushState({ rehearsalIndex: (history.state?.rehearsalIndex || 0) + 1 }, '', h); show(id); };
history.replaceState({ ...history.state, rehearsalIndex: history.state?.rehearsalIndex || 0 }, '');
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#/"]'); if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
  e.preventDefault(); setMenu(false); if (location.hash === a.hash || (a.hash === '#/studio' && route === 'studio')) return;
  history.pushState({ rehearsalIndex: (history.state?.rehearsalIndex || 0) + 1 }, '', a.hash); show(parseRoute());
});
addEventListener('popstate', () => show(parseRoute()));
addEventListener('hashchange', () => { if (parseRoute() !== route) show(parseRoute()); });
$('back').onclick = () => { if (history.state?.rehearsalIndex > 0) history.back(); else go('studio'); };
$('menu-btn').onclick = () => setMenu($('menu').hidden);
addEventListener('keydown', e => { if (e.key === 'Escape' && !$('menu').hidden) { setMenu(false); $('menu-btn').focus(); } });
addEventListener('resize', () => { paintDoors(); paintResidue(); });

// ---------------- sound + reduced motion ----------------
async function applySound() { if (!soundOn || document.hidden) { if (audio) await audio.suspend(); return; } if (!audio) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) throw Error('Audio is not supported'); audio = new AC(); osc = audio.createOscillator(); gain = audio.createGain(); osc.frequency.value = 146.83; gain.gain.value = .012; osc.connect(gain).connect(audio.destination); osc.start(); } await audio.resume(); }
function paintSound() { $('sound').textContent = soundOn ? 'Sound on' : 'Sound off'; $('sound').setAttribute('aria-pressed', String(soundOn)); }
$('sound').onclick = async () => { soundOn = !soundOn; paintSound(); try { await applySound(); } catch { soundOn = false; paintSound(); say('Audio is unavailable. Everything else still works.'); } };
document.addEventListener('visibilitychange', () => applySound().catch(() => {}));
function setReduced(v) { reduced = v; $('reduce').checked = v; document.body.classList.toggle('reduced', v); record('reduced-motion', v); }
$('reduce').onchange = e => setReduced(e.target.checked);
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', e => setReduced(e.matches));

window.__rehearsal = { set: null, session, get state() { return { route, opening, reduced, soundOn, audioState: audio?.state || 'not-created', trace: [...trace] }; } };
setReduced(reduced); paintDoors(); paintVisit(); show(parseRoute(), { initial: true });
