// FILM set — rehearsal module (Blueprint v1.1 §4.4; REHEARSAL_COVERAGE Round 2).
// Stand-in shapes only: a rehearsal tool, not art direction (rule 9).
// Mount contract, so the journey skeleton can host it: mount(root, opts) -> { leave(), unmount(), debug() }
//   opts.onKeep(record)  receives KEEP records ({ kind, take, cut, image })
//   opts.reducedMotion   skips the reset curtain animation
//   opts.onRecord(rec)   receives a session record for each finished take (Making reads these; nothing personal)
// The performance is a pure function of time t, so the CUT frame, the monitor and synced playback all draw from one
// source, and every take is the same performance.

const TAKE_LEN = 8.0;                 // seconds; a take that is never cut runs out here
const RESET_MS = 700;                 // curtain while the set resets (it never replays the rest of the take)
export const BEATS = [                       // [start s, what the audience can learn from here on]
  [0.0, 'the mug creeps toward the edge'],
  [2.6, 'a hand from under the table takes it'],
  [4.2, 'a sharpened pencil is passed up'],
  [5.8, 'the saucer is slid down'],
  [7.4, 'everything settles'],
];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const ease = u => u * u * (3 - 2 * u);

// Pose of every prop at time t, in stage units (0..1 wide, 0..0.5625 tall; table top at y = TOP).
const TOP = 0.36, EDGE = 0.74;
function pose(t) {
  // the mug creeps in small nudges (a stepped ease) from 0.50 to the edge
  const creep = seg(t, 0, 2.6), nudges = Math.floor(creep * 5) / 5 + ease((creep * 5) % 1) / 5;
  let mug = { x: 0.50 + (EDGE - 0.035 - 0.50) * Math.min(1, nudges), y: TOP, on: true };
  // the hand rises from under the table at the edge, takes the mug and goes back down with it
  const up1 = ease(seg(t, 2.6, 3.1)), down1 = ease(seg(t, 3.4, 4.0));
  let hand = { x: EDGE - 0.02, y: TOP + 0.10 - 0.12 * up1 + 0.14 * down1, show: t >= 2.6 && t < 4.0, holds: null };
  if (t >= 3.1) { hand.holds = 'mug'; mug = { x: hand.x - 0.015, y: hand.y - 0.012, on: false }; }
  // the same hand comes back up with a sharpened pencil and lays it on the table
  const up2 = ease(seg(t, 4.2, 4.8)), lay = ease(seg(t, 4.8, 5.3)), down2 = ease(seg(t, 5.3, 5.8));
  let pencil = { x: EDGE - 0.02, y: TOP + 0.12, on: false, show: false };
  if (t >= 4.2 && t < 5.8) {
    hand = { x: EDGE - 0.02 - 0.08 * lay * (1 - down2), y: TOP + 0.10 - 0.12 * up2 + 0.14 * down2, show: true, holds: lay < 1 ? 'pencil' : null };
    pencil = lay < 1 ? { x: hand.x, y: hand.y - 0.02, on: false, show: true } : { x: EDGE - 0.10, y: TOP - 0.006, on: true, show: true };
  } else if (t >= 5.8) pencil = { x: EDGE - 0.10, y: TOP - 0.006, on: true, show: true };
  // the saucer is slid down off the edge by the hand
  const reach = ease(seg(t, 5.8, 6.3)), slide = ease(seg(t, 6.3, 7.1)), drop = ease(seg(t, 7.1, 7.4));
  let saucer = { x: 0.60, y: TOP - 0.004, show: true };
  if (t >= 5.8) {
    hand = { x: EDGE - 0.02 - 0.12 * reach * (1 - slide), y: TOP - 0.03 * reach * (1 - drop) + 0.12 * drop, show: t < 7.4, holds: null };
    saucer = { x: 0.60 + (EDGE - 0.60) * slide, y: TOP - 0.004 + 0.12 * drop, show: t < 7.4 };
  }
  return { mug, hand, pencil, saucer };
}

// Draw the stage at time t onto a 2D context of any size (the stage, the monitors and KEEP all use this).
export function drawFrame(ctx, t, opt = {}) {
  const W = ctx.canvas.width, H = ctx.canvas.height, s = W;
  const X = v => v * s, Y = v => v * s;
  const ink = '#1b1b1b', paper = '#f3efe6', mid = '#bdb7aa';
  ctx.save(); ctx.fillStyle = paper; ctx.fillRect(0, 0, W, H);
  ctx.lineWidth = Math.max(1.5, W / 320); ctx.strokeStyle = ink; ctx.fillStyle = ink;
  ctx.font = `${Math.max(9, W / 70)}px system-ui, sans-serif`; ctx.textBaseline = 'middle';
  const label = (txt, x, y, al = 'center') => { ctx.save(); ctx.textAlign = al; ctx.fillStyle = '#6b665c'; ctx.fillText(txt, x, y); ctx.restore(); };
  const p = pose(t);
  // Maker stand-in: box head + body, writing at the left of the table
  ctx.strokeRect(X(0.24), Y(0.12), X(0.12), Y(0.10)); label('MAKER', X(0.30), Y(0.17));
  ctx.strokeRect(X(0.26), Y(0.22), X(0.08), Y(0.14));
  // the hand is drawn before the table front, so whatever is below the table top stays hidden
  if (p.hand.show) {
    ctx.save(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(X(p.hand.x), Y(p.hand.y), X(0.018), Y(0.014), 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = ink; ctx.fillRect(X(p.hand.x) - X(0.006), Y(p.hand.y) + Y(0.012), X(0.012), Y(0.2)); ctx.restore();
    if (p.hand.y < TOP) label('HAND', X(p.hand.x) + X(0.03), Y(p.hand.y) - Y(0.02), 'left');
  }
  const mugShape = m => { ctx.save(); ctx.fillStyle = '#fff'; ctx.fillRect(X(m.x - 0.018), Y(m.y - 0.045), X(0.036), Y(0.045)); ctx.strokeRect(X(m.x - 0.018), Y(m.y - 0.045), X(0.036), Y(0.045));
    ctx.beginPath(); ctx.arc(X(m.x + 0.024), Y(m.y - 0.024), X(0.009), -1.4, 1.4); ctx.stroke(); ctx.restore(); };
  if (p.saucer.show) { ctx.save(); ctx.fillStyle = mid; ctx.fillRect(X(p.saucer.x - 0.03), Y(p.saucer.y - 0.006), X(0.06), Y(0.008)); ctx.restore();
    if (p.saucer.y < TOP + 0.01) label('SAUCER', X(p.saucer.x), Y(p.saucer.y + 0.025)); }
  mugShape(p.mug); if (p.mug.y < TOP + 0.001) label('PROP MUG', X(p.mug.x), Y(p.mug.y - 0.065));
  if (p.pencil.show) { ctx.save(); ctx.lineWidth *= 1.6; ctx.beginPath(); ctx.moveTo(X(p.pencil.x - 0.04), Y(p.pencil.y)); ctx.lineTo(X(p.pencil.x + 0.03), Y(p.pencil.y)); ctx.stroke(); ctx.restore();
    if (p.pencil.on) label('PENCIL (sharpened)', X(p.pencil.x), Y(p.pencil.y - 0.02)); }
  // table: top line + front (covers everything under the table)
  ctx.save(); ctx.fillStyle = '#e4ded1'; ctx.fillRect(X(0.18), Y(TOP), X(EDGE - 0.18), H - Y(TOP)); ctx.restore();
  ctx.beginPath(); ctx.moveTo(X(0.18), Y(TOP)); ctx.lineTo(X(EDGE), Y(TOP)); ctx.stroke();
  label('TABLE', X(0.46), Y(TOP + 0.05));
  if (opt.stamp !== false) label('STAND-IN · rehearsal only · not art direction', X(0.985), Y(0.54), 'right');
  ctx.restore();
}

export function mount(root, opts = {}) {
  const onKeep = opts.onKeep || (() => {}), onRecord = opts.onRecord || (() => {}), reduced = !!opts.reducedMotion;
  root.classList.add('film-set'); root.tabIndex = 0;
  root.innerHTML = `
  <style>
    .film-set{--ink:#1b1b1b;--paper:#f3efe6;--soft:#6b665c;display:grid;grid-template-columns:minmax(0,3fr) minmax(220px,1fr);gap:16px;
      color:var(--ink);font:14px/1.4 system-ui,sans-serif;outline:none}
    .film-set canvas{box-sizing:border-box;width:100%;height:auto;display:block;border:1.5px solid var(--ink);background:var(--paper)}
    .film-set .stage{position:relative;overflow:hidden}
    .film-set .curtain{position:absolute;inset:0;background:var(--ink);color:var(--paper);display:grid;place-items:center;
      font-weight:600;letter-spacing:.08em;opacity:0;pointer-events:none;transition:opacity .15s}
    .film-set .curtain.on{opacity:1}
    .film-set .radio{position:absolute;right:8px;top:8px;border:1.5px solid var(--ink);background:var(--paper);padding:2px 8px;
      font-size:12px;transition:transform .35s}
    .film-set .radio.offstage{transform:translateX(140%)}
    .film-set .say{min-height:1.4em;color:var(--soft);margin:6px 0 0}
    .film-set .panel{display:flex;flex-direction:column;gap:10px}
    .film-set .slate{border:2px solid var(--ink);padding:6px 10px;font-weight:700;display:flex;justify-content:space-between}
    .film-set .row{display:flex;gap:8px;flex-wrap:wrap}
    .film-set button{font:inherit;font-weight:600;border:1.5px solid var(--ink);background:var(--paper);color:var(--ink);
      padding:8px 14px;cursor:pointer;min-height:40px}
    .film-set button.primary{background:var(--ink);color:var(--paper)}
    .film-set button:disabled{opacity:.35;cursor:default}
    .film-set button:focus-visible{outline:3px solid #2a6df4;outline-offset:2px}
    .film-set .takes{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px;max-height:160px;overflow:auto}
    .film-set .takes label{display:flex;gap:6px;align-items:center;cursor:pointer}
    .film-set .monitors{display:grid;grid-template-columns:1fr 1fr;gap:6px}
    .film-set .monitors canvas:only-child{grid-column:1/-1}
    .film-set .hint{color:var(--soft);font-size:12px}
    @media (max-width:720px){.film-set{grid-template-columns:1fr}}
  </style>
  <div class="stage">
    <canvas class="main" width="1280" height="720" aria-label="Film set stage (stand-in)"></canvas>
    <div class="curtain" aria-hidden="true">RESETTING…</div>
    <div class="radio" aria-hidden="true">RADIO</div>
    <p class="say" aria-live="polite"></p>
  </div>
  <div class="panel">
    <div class="slate" aria-live="polite"><span>SCENE 1</span><span class="takeNo">TAKE 1</span></div>
    <div class="row"><button class="primary act">ACTION</button><button class="cut">CUT</button></div>
    <p class="hint">You choose where the shot ends. Space = ACTION / CUT while the set has focus.</p>
    <div class="monitors"><canvas class="mon" width="480" height="270" aria-label="Monitor"></canvas></div>
    <ul class="takes" aria-label="Takes"></ul>
    <div class="row"><button class="play" disabled>PLAY</button><button class="both" disabled>PLAY BOTH</button><button class="keep" disabled>KEEP</button></div>
  </div>`;
  const $ = q => root.querySelector(q);
  const main = $('.main').getContext('2d'), curtain = $('.curtain'), radio = $('.radio'), say = $('.say');
  const monitors = $('.monitors'), takesEl = $('.takes'), takeNoEl = $('.takeNo');
  const bAct = $('.act'), bCut = $('.cut'), bPlay = $('.play'), bBoth = $('.both'), bKeep = $('.keep');

  const st = { mode: 'idle', t: 0, t0: 0, nextTake: 1, takes: [], selected: [], play: null, raf: 0, resetTimer: 0, alive: true };
  let monCtxs = [$('.mon').getContext('2d')];

  const speak = txt => { say.textContent = txt; };
  const setMonitors = n => {
    while (monitors.children.length < n) { const c = document.createElement('canvas'); c.width = 480; c.height = 270; c.className = 'mon'; c.setAttribute('aria-label', 'Monitor ' + (monitors.children.length + 1)); monitors.appendChild(c); }
    while (monitors.children.length > n) monitors.lastChild.remove();
    monCtxs = [...monitors.children].map(c => c.getContext('2d'));
  };
  const showFinal = () => { // the monitor shows the chosen final frame(s); playback only on PLAY
    const sel = st.selected.map(n => st.takes.find(k => k.n === n)).filter(Boolean);
    setMonitors(Math.max(1, sel.length));
    if (!sel.length) monCtxs[0].clearRect(0, 0, 480, 270);
    sel.forEach((k, i) => drawFrame(monCtxs[i], k.cut, { stamp: false }));
  };
  const renderTakes = () => {
    takesEl.innerHTML = st.takes.map(k => `<li><label><input type="checkbox" value="${k.n}" ${st.selected.includes(k.n) ? 'checked' : ''}>
      TAKE ${k.n} — cut at ${k.cut.toFixed(2)} s${k.ranOut ? ' (ran out)' : ''}</label></li>`).join('');
    takesEl.querySelectorAll('input').forEach(i => i.onchange = () => {
      const n = +i.value;
      if (i.checked) { st.selected = [...st.selected.filter(x => x !== n), n].slice(-2); } else st.selected = st.selected.filter(x => x !== n);
      stopPlayback(); renderTakes(); showFinal(); sync();
    });
  };
  const sync = () => {
    takeNoEl.textContent = 'TAKE ' + st.nextTake;
    bAct.disabled = st.mode === 'resetting';
    bCut.setAttribute('aria-pressed', 'false');
    bPlay.disabled = st.selected.length !== 1 || st.mode === 'rolling';
    bBoth.disabled = st.selected.length !== 2 || st.mode === 'rolling';
    bKeep.disabled = st.selected.length !== 1;
    radio.classList.toggle('offstage', st.mode === 'rolling'); // the Radio stays out of the main view during ACTION
  };

  function stopPlayback() { if (st.play) { st.play = null; showFinal(); } }
  function action() {
    if (!st.alive) return;
    if (st.play) { stopPlayback(); speak('Playback stopped.'); sync(); return; } // ACTION during playback stops it
    if (st.mode !== 'idle') return;
    st.mode = 'rolling'; st.t = 0; st.t0 = performance.now(); st.rolling = st.nextTake;
    speak(`Rolling — take ${st.nextTake}.`); sync();
  }
  function endTake(cutAt, ranOut) {
    const k = { n: st.rolling, cut: cutAt, ranOut };
    st.takes.push(k); st.nextTake++; st.selected = [k.n];
    onRecord({ kind: 'film-take', take: k.n, cut: +cutAt.toFixed(3), ranOut, at: Date.now() });
    st.mode = 'resetting'; renderTakes(); showFinal();
    speak(ranOut ? `Take ${k.n}: the shot ran out.` : `Cut. Take ${k.n} ends at ${cutAt.toFixed(2)} s.`);
    // the reset never spoils hidden information: the set returns to its start under cover, with no replay of the rest
    curtain.classList.toggle('on', !reduced);
    st.resetTimer = setTimeout(() => { st.mode = 'idle'; st.t = 0; curtain.classList.remove('on'); draw(); sync(); }, reduced ? 0 : RESET_MS);
    sync();
  }
  function cut() {
    if (!st.alive) return;
    if (st.mode === 'rolling') { endTake(st.t, false); return; }   // CUT on any frame ends the shot exactly there
    if (st.mode === 'idle') speak('Nothing is rolling — no take.'); // CUT while stopped: no take, a short reaction
  }
  function play(both) {
    if (st.mode === 'rolling') return;
    const sel = st.selected.map(n => st.takes.find(k => k.n === n)).filter(Boolean);
    if (sel.length !== (both ? 2 : 1)) return;
    setMonitors(sel.length);
    st.play = { takes: sel, t0: performance.now() };
    speak(both ? `Takes ${sel[0].n} and ${sel[1].n} in sync.` : `Playing take ${sel[0].n}.`); sync();
  }
  function keep() {
    const k = st.takes.find(x => x.n === st.selected[0]); if (!k) return;
    const c = document.createElement('canvas'); c.width = 1280; c.height = 720; drawFrame(c.getContext('2d'), k.cut);
    onKeep({ kind: 'film-final-frame', take: k.n, cut: +k.cut.toFixed(3), image: c.toDataURL('image/png') }); // an image, not a video
    speak(`Kept take ${k.n}'s final frame.`);
  }
  const draw = () => drawFrame(main, st.mode === 'rolling' ? st.t : 0);
  function tick(now) {
    if (!st.alive) return;
    if (st.mode === 'rolling') {
      st.t = (now - st.t0) / 1000;
      if (st.t >= TAKE_LEN) endTake(TAKE_LEN, true);
    }
    if (st.play) {
      const pt = (now - st.play.t0) / 1000;
      st.play.takes.forEach((k, i) => drawFrame(monCtxs[i], Math.min(pt, k.cut), { stamp: false }));
      if (pt >= Math.max(...st.play.takes.map(k => k.cut))) { st.play = null; sync(); }
    }
    draw(); st.raf = requestAnimationFrame(tick);
  }

  bAct.onclick = action; bCut.onclick = cut; bPlay.onclick = () => play(false); bBoth.onclick = () => play(true); bKeep.onclick = keep;
  // Space is scoped to the Film controls: only while focus is inside this set and not in a text field
  const onKey = e => {
    if (e.code !== 'Space' || e.repeat) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
    e.preventDefault(); st.mode === 'rolling' ? cut() : action();
  };
  root.addEventListener('keydown', onKey);
  sync(); draw(); showFinal(); st.raf = requestAnimationFrame(tick);

  return {
    // leaving mid-take abandons it: no take is recorded and nothing is revealed
    leave() { if (st.mode === 'rolling') { st.mode = 'idle'; st.t = 0; speak('Take abandoned.'); } stopPlayback(); sync(); draw(); },
    unmount() { this.leave(); st.alive = false; cancelAnimationFrame(st.raf); clearTimeout(st.resetTimer); root.removeEventListener('keydown', onKey); root.innerHTML = ''; root.classList.remove('film-set'); },
    debug: () => ({ mode: st.mode, t: st.t, nextTake: st.nextTake, takes: st.takes.map(k => ({ ...k })), selected: [...st.selected], playing: !!st.play, beats: BEATS }),
  };
}
