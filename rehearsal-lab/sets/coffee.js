// COFFEE CORNER + STUDIO SIGNALS — rehearsal module (Blueprint v1.1 §4.2, D2; REHEARSAL_COVERAGE Round 2).
// Stand-in shapes only: a rehearsal tool, not art direction (rule 9). Real payments are unauthorised: support is TEST MODE.
// Mount contract (same as film.js): mount(root, opts) -> { leave(), unmount(), debug() }
//   opts.bindings      initial cables, e.g. { radio: 'energy' }; bindings persist across sets (owned by the skeleton)
//   opts.onBindings(b) called whenever the cables change
//   opts.reducedMotion smaller motion amplitudes
// Invariant: change who senses what while the character stays alive (no respawn).

const SOURCES = { energy: 'ENERGY', move: 'MOVE HERE', feed: 'FEED (simulated)' };
const RECEIVERS = { radio: 'RADIO', steam: 'STEAM', monster: 'MONSTER' };
const BASE = { radio: 0.25, steam: 0.2 };       // authored baselines (DISCONNECT returns here)
const STALE_FALLBACK_S = 4;                      // a stale feed holds its last value this long, then falls back
const T_RISE = 1.2, T_THANKS = 1.6, T_SINK = 1.2, RESIDENT = 0.18;

export function mount(root, opts = {}) {
  const reduced = !!opts.reducedMotion, onBindings = opts.onBindings || (() => {});
  root.classList.add('coffee-set'); root.tabIndex = 0;
  root.innerHTML = `
  <style>
    .coffee-set{--ink:#1b1b1b;--paper:#f3efe6;--soft:#6b665c;--accent:#b0461f;color:var(--ink);font:14px/1.4 system-ui,sans-serif;
      display:grid;grid-template-columns:minmax(0,3fr) minmax(260px,2fr);gap:16px;outline:none}
    .coffee-set .stage{position:relative;overflow:hidden}
    .coffee-set canvas{box-sizing:border-box;width:100%;height:auto;display:block;border:1.5px solid var(--ink);background:var(--paper)}
    .coffee-set .say{min-height:1.4em;color:var(--soft);margin:6px 0 0}
    .coffee-set button{font:inherit;font-weight:600;border:1.5px solid var(--ink);background:var(--paper);color:var(--ink);padding:8px 12px;cursor:pointer;min-height:40px}
    .coffee-set button.primary{background:var(--ink);color:var(--paper)}
    .coffee-set button:disabled{opacity:.35;cursor:default}
    .coffee-set button:focus-visible{outline:3px solid #2a6df4;outline-offset:2px}
    .coffee-set .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px}
    .coffee-set .side{display:flex;flex-direction:column;gap:10px;min-width:0}
    .coffee-set .panel{position:relative;border:2px solid var(--ink);padding:10px;background:#fbf8f1;display:none}
    .coffee-set .panel.on{display:block}
    .coffee-set .tape{position:absolute;top:-10px;width:56px;height:16px;background:#e6d9a8cc;border:1px solid #c9b878}
    .coffee-set .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 28px;position:relative}
    .coffee-set .col{display:flex;flex-direction:column;gap:10px}
    .coffee-set .src,.coffee-set .rcv{border:1.5px solid var(--ink);padding:6px;display:flex;flex-direction:column;gap:6px}
    .coffee-set .src.hero{border-width:3px}
    .coffee-set .jack{min-height:32px;padding:4px 8px;font-size:12px}
    .coffee-set .jack.pending{background:var(--accent);color:#fff;border-color:var(--accent)}
    .coffee-set input[type=range]{width:100%;accent-color:var(--ink)}
    .coffee-set .pad{height:64px;border:1.5px dashed var(--ink);display:grid;place-items:center;color:var(--soft);font-size:12px;touch-action:none;user-select:none}
    .coffee-set .meter{height:6px;background:#e4ded1}.coffee-set .meter i{display:block;height:100%;background:var(--ink)}
    .coffee-set .state{font-size:12px;color:var(--soft);min-height:1.3em}
    .coffee-set svg.cables{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible}
    .coffee-set .support{border:1.5px solid var(--ink);padding:10px;display:none;background:#fff}
    .coffee-set .support.on{display:block}
    .coffee-set .hint{color:var(--soft);font-size:12px;margin:0}
    @media (max-width:760px){.coffee-set{grid-template-columns:1fr}}
  </style>
  <div class="stage">
    <canvas class="main" width="1280" height="720" aria-label="Coffee corner stage (stand-in)"></canvas>
    <p class="say" aria-live="polite"></p>
    <div class="row">
      <button class="primary coin">TRY IT — NO CHARGE (drop a coin)</button>
      <button class="menu">MENU — live data panel</button>
      <button class="real">Support Thanest (real)</button>
    </div>
  </div>
  <div class="side">
    <div class="panel" aria-label="Live data panel">
      <span class="tape" style="left:14px"></span><span class="tape" style="right:14px"></span>
      <p class="hint">Click a source jack, then a receiver jack. Click a plugged receiver to pick its cable up and move it; Esc drops it (DISCONNECT).</p>
      <div class="grid">
        <svg class="cables" aria-hidden="true"></svg>
        <div class="col">
          <div class="src hero" data-src="energy"><button class="jack" data-src="energy">● ENERGY</button>
            <input type="range" min="0" max="100" value="25" aria-label="ENERGY level"><div class="meter"><i></i></div></div>
          <div class="src" data-src="move"><button class="jack" data-src="move">● MOVE HERE</button>
            <div class="pad" aria-label="Gesture field">move your pointer / finger here</div><div class="meter"><i></i></div></div>
          <div class="src" data-src="feed"><button class="jack" data-src="feed">● FEED (simulated)</button>
            <label class="hint"><input type="checkbox" class="drop"> simulate the feed dropping</label><div class="meter"><i></i></div><div class="state feedstate"></div></div>
        </div>
        <div class="col">
          ${Object.entries(RECEIVERS).map(([k, n]) => `<div class="rcv" data-rcv="${k}"><button class="jack" data-rcv="${k}">${n} ●</button>
            <div class="row" style="margin:0"><button class="hold" data-rcv="${k}" aria-pressed="false">HOLD</button></div>
            <div class="state" data-state="${k}"></div></div>`).join('')}
        </div>
      </div>
    </div>
    <div class="support" aria-label="Real support">
      <strong>Support Thanest</strong>
      <p class="hint">TEST MODE — real payments are not live. No money is taken. Every amount gets the same complete thanks.</p>
      <div class="row"><button data-amt="3">$3</button><button data-amt="5">$5</button><button data-amt="10">$10</button><button class="close">Close</button></div>
      <div class="state supstate" aria-live="polite"></div>
    </div>
  </div>`;
  const $ = q => root.querySelector(q), $$ = q => [...root.querySelectorAll(q)];
  const ctx = $('.main').getContext('2d'), say = $('.say'), panel = $('.panel'), svg = $('svg.cables'), grid = $('.grid');
  const speak = t => { say.textContent = t; };

  const st = {
    alive: true, raf: 0, last: performance.now(), time: 0,
    src: { energy: 0.25, move: 0, feed: 0.5 },
    feed: { stale: false, staleAt: 0, last: 0.5 },
    cables: { radio: null, steam: null, monster: null },  // receiver -> source
    held: { radio: null, steam: null, monster: null },    // receiver -> frozen value while HOLD
    level: { radio: BASE.radio, steam: BASE.steam, monster: 0 },
    monster: { state: 'dormant', t: 0, from: 0 },          // dormant | rising | thanks | sinking | resident
    coinReturn: 0, pending: null, panelOpen: false,
  };
  Object.assign(st.cables, opts.bindings || {});

  const bindingsOut = () => ({ ...st.cables });
  const changed = () => { onBindings(bindingsOut()); syncUI(); };

  // ---- the signal each receiver actually gets (null = no input: authored baseline) ----
  function input(r) {
    const s = st.cables[r]; if (!s) return { v: null, why: 'DISCONNECTED — baseline' };
    if (st.held[r] != null) return { v: st.held[r], why: `HOLD ${pct(st.held[r])} (value frozen; still alive)` };
    if (s === 'feed' && st.feed.stale) {
      const age = (performance.now() - st.feed.staleAt) / 1000;
      if (age < STALE_FALLBACK_S) return { v: st.feed.last, why: `STALE — last ${pct(st.feed.last)}, ${age.toFixed(1)} s old` };
      return { v: null, why: `STALE — ${age.toFixed(0)} s old, fell back to baseline` };
    }
    return { v: st.src[s], why: `${SOURCES[s]} ${pct(st.src[s])}` };
  }
  const pct = v => Math.round(v * 100) + '%';

  // ---- coin: instant acknowledgement, then the complete shallow performance ----
  function coin(label = 'Clink — thank you!') {
    const m = st.monster;
    if (m.state === 'rising' || m.state === 'thanks') { st.coinReturn = 1; speak('The slot is covered — your coin comes back.'); return false; }
    const turningBack = m.state === 'sinking';
    m.from = st.level.monster; m.state = 'rising'; m.t = 0;           // rises from its current state, never respawns
    speak(turningBack ? 'Coin accepted — it turns back up. (Further coins bounce until it is done.)' : label);
    syncUI(); return true;
  }
  function stepMonster(dt) {
    const m = st.monster; m.t += dt;
    if (m.state === 'rising' && m.t >= T_RISE) { m.state = 'thanks'; m.t = 0; speak('THANK YOU!'); }
    else if (m.state === 'thanks' && m.t >= T_THANKS) { m.state = 'sinking'; m.t = 0; m.from = st.level.monster; }
    else if (m.state === 'sinking' && m.t >= T_SINK) { m.state = 'resident'; m.t = 0; speak('It settles back into the mug — still alive.'); syncUI(); }
    const ease = u => u * u * (3 - 2 * u), u = x => Math.min(1, m.t / x);
    if (m.state === 'rising') return m.from + (1 - m.from) * ease(u(T_RISE));
    if (m.state === 'thanks') return 1;
    if (m.state === 'sinking') return m.from + (RESIDENT - m.from) * ease(u(T_SINK));
    if (m.state === 'resident') { const i = input('monster').v; return i == null ? RESIDENT : RESIDENT + 0.75 * i; }
    return 0;
  }

  // ---- patching: plug, pick up, move, drop ----
  function clickSource(s) { st.pending = { src: s }; speak(`Carrying a cable from ${SOURCES[s]} — choose a receiver.`); syncUI(); }
  function clickReceiver(r) {
    if (r === 'monster' && st.monster.state === 'dormant') { speak('The monster only appears after a coin — drop one first.'); return; }
    if (st.pending) {
      const was = st.cables[r]; st.cables[r] = st.pending.src; st.held[r] = null;
      speak(`${SOURCES[st.pending.src]} → ${RECEIVERS[r]}${was && was !== st.pending.src ? ` (replaced ${SOURCES[was]})` : ''}.`);
      st.pending = null; changed(); return;
    }
    if (st.cables[r]) { // pick the cable up (it stays in hand until plugged or dropped)
      st.pending = { src: st.cables[r], from: r }; st.cables[r] = null; st.held[r] = null;
      speak(`Picked up the ${SOURCES[st.pending.src]} cable from ${RECEIVERS[r]} — plug it into another receiver, or Esc to drop it.`); changed();
    }
  }
  function drop() { if (!st.pending) return; speak(`Cable dropped — ${st.pending.from ? RECEIVERS[st.pending.from] + ' returns to its baseline' : 'nothing plugged'}.`); st.pending = null; syncUI(); }
  function hold(r) {
    if (!st.cables[r]) { speak(`${RECEIVERS[r]} has no input to hold.`); return; }
    st.held[r] = st.held[r] == null ? (input(r).v ?? BASE[r] ?? RESIDENT) : null; syncUI();
  }

  // ---- UI wiring ----
  $$('.jack[data-src]').forEach(b => b.onclick = () => clickSource(b.dataset.src));
  $$('.jack[data-rcv]').forEach(b => b.onclick = () => clickReceiver(b.dataset.rcv));
  $$('.hold').forEach(b => b.onclick = () => hold(b.dataset.rcv));
  $('input[type=range]').oninput = e => { st.src.energy = e.target.value / 100; };
  const pad = $('.pad'); let lastP = null;
  pad.onpointermove = e => { const p = { x: e.clientX, y: e.clientY, t: performance.now() };
    if (lastP) { const v = Math.hypot(p.x - lastP.x, p.y - lastP.y) / Math.max(8, p.t - lastP.t); st.src.move = Math.min(1, st.src.move * 0.6 + v * 0.35); } lastP = p; };
  pad.onpointerleave = () => { lastP = null; };
  $('.drop').onchange = e => { st.feed.stale = e.target.checked; if (st.feed.stale) { st.feed.staleAt = performance.now(); st.feed.last = st.src.feed; } };
  $('.coin').onclick = () => coin();
  $('.menu').onclick = () => openPanel();
  $('.real').onclick = () => $('.support').classList.toggle('on');
  $('.support .close').onclick = () => $('.support').classList.remove('on');
  $$('.support [data-amt]').forEach(b => b.onclick = () => { // the provider owns payment truth: celebrate only on (test) confirmation
    const s = $('.supstate'); s.textContent = 'Waiting for the payment provider… (TEST)';
    setTimeout(() => { if (!st.alive) return; s.textContent = `TEST confirmation for $${b.dataset.amt} — no money taken. Same complete thanks for any amount.`; coin('Thank you — truly. (TEST)'); }, 600);
  });
  const onKey = e => { if (e.key === 'Escape') drop(); };
  root.addEventListener('keydown', onKey);

  function openPanel() {
    if (st.panelOpen) return;
    st.panelOpen = true; panel.classList.add('on');
    if (!Object.values(st.cables).some(Boolean)) { st.cables.radio = 'energy'; changed(); } // D2: ENERGY arrives already wired to the real Radio
    speak('The paw tapes the panel up. ENERGY is already wired to the Radio — push it.'); syncUI();
  }
  function syncUI() {
    $$('.jack[data-src]').forEach(b => b.classList.toggle('pending', st.pending?.src === b.dataset.src));
    $$('.jack[data-rcv]').forEach(b => { const r = b.dataset.rcv; b.disabled = r === 'monster' && st.monster.state === 'dormant';
      b.title = b.disabled ? 'appears after a coin' : ''; });
    $$('.hold').forEach(b => { const r = b.dataset.rcv; b.setAttribute('aria-pressed', String(st.held[r] != null)); b.classList.toggle('primary', st.held[r] != null); });
  }

  // ---- drawing (stand-ins) ----
  function drawStage() {
    const W = 1280, H = 720, t = st.time, amp = reduced ? 0.3 : 1;
    ctx.fillStyle = '#f3efe6'; ctx.fillRect(0, 0, W, H); ctx.lineWidth = 4; ctx.strokeStyle = '#1b1b1b'; ctx.fillStyle = '#1b1b1b';
    ctx.font = '22px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lab = (s, x, y) => { ctx.save(); ctx.fillStyle = '#6b665c'; ctx.fillText(s, x, y); ctx.restore(); };
    // stool
    ctx.strokeRect(430, 470, 420, 34); ctx.beginPath(); ctx.moveTo(470, 504); ctx.lineTo(450, 650); ctx.moveTo(810, 504); ctx.lineTo(830, 650); ctx.stroke(); lab('LOW STOOL', 640, 560);
    // mug
    const mx = 560, my = 470; ctx.fillStyle = '#fff'; ctx.fillRect(mx - 60, my - 120, 120, 120); ctx.strokeRect(mx - 60, my - 120, 120, 120);
    ctx.beginPath(); ctx.arc(mx + 78, my - 60, 26, -1.3, 1.3); ctx.stroke(); lab('MUG', mx, my - 40);
    // steam: height and wiggle follow its level
    const sl = st.level.steam; ctx.save(); ctx.strokeStyle = '#8a8478'; ctx.lineWidth = 3;
    for (let k = -1; k <= 1; k++) { ctx.beginPath(); for (let y = 0; y < 60 + 220 * sl; y += 6) { const x = mx + k * 28 + Math.sin(y / 18 + t * (2 + 6 * sl) + k) * (6 + 14 * sl) * amp; y ? ctx.lineTo(x, my - 130 - y) : ctx.moveTo(x, my - 130); } ctx.stroke(); }
    ctx.restore(); lab('STEAM', mx - 110, my - 170);
    // monster: rises out of the mug; breathing never stops (alive)
    const h = st.level.monster;
    if (h > 0.01) { const breathe = Math.sin(t * 2.2) * 4 * amp, top = my - 120 - h * 260 + breathe;
      ctx.save(); ctx.fillStyle = '#d9cfbb'; ctx.beginPath(); ctx.moveTo(mx - 50, my - 118); ctx.quadraticCurveTo(mx - 70, top + 40, mx, top); ctx.quadraticCurveTo(mx + 70, top + 40, mx + 50, my - 118); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#1b1b1b'; ctx.beginPath(); ctx.arc(mx - 16, top + 40, 6, 0, 7); ctx.arc(mx + 16, top + 40, 6, 0, 7); ctx.fill(); ctx.restore();
      lab(st.monster.state === 'thanks' ? 'MONSTER — THANK YOU!' : 'MONSTER', mx, top - 22); }
    // radio leaning on the stool: bounce follows its level
    const rl = st.level.radio, bounce = Math.abs(Math.sin(t * (3 + 9 * rl))) * 40 * rl * amp, rx = 760, ry = 470 - bounce;
    ctx.save(); ctx.translate(rx, ry); ctx.rotate(-0.08); ctx.fillStyle = '#fff'; ctx.fillRect(-70, -110, 140, 110); ctx.strokeRect(-70, -110, 140, 110);
    ctx.beginPath(); ctx.arc(-25, -55, 26 + 6 * rl, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(40, -110); ctx.lineTo(70 + 30 * rl, -170 - 40 * rl); ctx.stroke(); ctx.restore();
    lab('RADIO', rx, ry - 130 - 40 * rl);
    // coin dish
    ctx.save(); ctx.fillStyle = '#e4ded1'; ctx.beginPath(); ctx.ellipse(250, 600, 90, 24, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore(); lab('PROP COIN DISH — free play', 250, 650);
    if (st.coinReturn > 0) { ctx.save(); ctx.globalAlpha = st.coinReturn; ctx.fillStyle = '#c9a227'; ctx.beginPath(); ctx.arc(250, 580 - 40 * (1 - st.coinReturn), 16, 0, 7); ctx.fill(); ctx.restore(); }
    ctx.textAlign = 'right'; lab('STAND-IN · rehearsal only · not art direction', W - 16, H - 20);
  }
  function drawCables() {
    if (!st.panelOpen) return;
    const g = grid.getBoundingClientRect(), pt = el => { const r = el.getBoundingClientRect(); return [r.left - g.left, r.top - g.top + r.height / 2, r.right - g.left]; };
    let out = '';
    for (const r of Object.keys(RECEIVERS)) {
      const s = st.cables[r]; if (!s) continue;
      const a = pt($(`.jack[data-src="${s}"]`)), b = pt($(`.jack[data-rcv="${r}"]`)), x1 = a[2], y1 = a[1], x2 = b[0], y2 = b[1];
      const stale = s === 'feed' && st.feed.stale, held = st.held[r] != null;
      out += `<path d="M${x1},${y1} C${x1 + 40},${y1 + 30} ${x2 - 40},${y2 + 30} ${x2},${y2}" fill="none" stroke="${held ? '#b0461f' : '#1b1b1b'}"
        stroke-width="${held ? 5 : 2.5}" ${stale ? 'stroke-dasharray="6 6"' : ''}/>`;
    }
    svg.innerHTML = out;
  }

  // ---- loop ----
  function tick(now) {
    if (!st.alive) return;
    const dt = Math.min(0.05, (now - st.last) / 1000); st.last = now; st.time += dt;
    st.src.move *= Math.exp(-dt * 2.5);                                        // the gesture field decays to stillness
    if (!st.feed.stale) st.src.feed = 0.5 + 0.35 * Math.sin(st.time * 0.7);   // labelled simulated feed
    st.coinReturn = Math.max(0, st.coinReturn - dt * 1.2);
    for (const r of ['radio', 'steam']) { const i = input(r).v, target = i == null ? BASE[r] : i;
      st.level[r] += (target - st.level[r]) * Math.min(1, dt * 8); }       // answers at once, relaxes (never snaps)
    const mt = stepMonster(dt); st.level.monster += (mt - st.level.monster) * Math.min(1, dt * 10);
    // meters + states
    root.querySelectorAll('.src').forEach(el => { el.querySelector('.meter i').style.width = pct(st.src[el.dataset.src]); });
    const f = $('.feedstate'); f.textContent = st.feed.stale ? `stale for ${((now - st.feed.staleAt) / 1000).toFixed(1)} s` : 'live (simulated)';
    for (const r of Object.keys(RECEIVERS)) root.querySelector(`[data-state="${r}"]`).textContent =
      r === 'monster' && st.monster.state === 'dormant' ? 'appears after a coin' : input(r).why;
    drawStage(); drawCables(); st.raf = requestAnimationFrame(tick);
  }
  syncUI(); speak('The mug pops onto the low stool; the Radio leans on it.'); st.raf = requestAnimationFrame(tick);

  return {
    leave() { st.pending = null; syncUI(); },   // bindings persist; the skeleton keeps them (onBindings)
    unmount() { st.alive = false; cancelAnimationFrame(st.raf); root.removeEventListener('keydown', onKey); root.innerHTML = ''; root.classList.remove('coffee-set'); },
    debug: () => ({ cables: { ...st.cables }, held: { ...st.held }, level: { ...st.level }, src: { ...st.src }, monster: st.monster.state,
      pending: st.pending && { ...st.pending }, panelOpen: st.panelOpen, why: Object.fromEntries(Object.keys(RECEIVERS).map(r => [r, input(r).why])) }),
    coin,
  };
}
