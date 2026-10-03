// KHWAN — rough slice, rehearsal module (Blueprint v1.1 §4.1, D1; REHEARSAL_COVERAGE Round 2).
// Stand-in shapes only (rule 9). The point is behaviour and rhythm:
//   entrance → living hold → grab and shake → tidy / adapt / premonition → CLUE → POP (lid commits) → REVEAL → DECISION → B
//   → re-cap (≠ reset) → living hold with scars.
// D1: RUSH copes with what is actually in front of him and visibly re-plans; B is built from the causal material
// (shake direction, frost, which segment was saved / lost), never from difference the visitor did not cause.
// Every change is written to a causal trace (cause: visitor | rush | world), the Runtime Truth HISTORY / CAUSE idea.
// Mount contract: mount(root, opts) -> { leave(), unmount(), debug(), getState() }
//   opts.state       resume by phase, no replay of the entrance (from getState())
//   opts.onKeep(r)   KEEP THIS SHOT → Visit Sheet      opts.onRecord(r)  session record for Making
//   opts.onResidue(r) an escaped segment and its home   opts.reducedMotion

const BAND = { adapt: 0.4, danger: 0.7, clue: 0.85 };
const T = { entrance: 2.4, pop: 0.45, reveal: 0.8, decision: 0.8, abortCheck: 0.8, abort: 1.0, nothingWait: 0.6, nothing: 1.3, recapWait: 3.2, recap: 1.3 };

export function mount(root, opts = {}) {
  const reduced = !!opts.reducedMotion, onKeep = opts.onKeep || (() => {}), onRecord = opts.onRecord || (() => {}), onResidue = opts.onResidue || (() => {});
  root.classList.add('khwan-set'); root.tabIndex = 0;
  root.innerHTML = `
  <style>
    .khwan-set{--ink:#1b1b1b;--soft:#6b665c;--accent:#d8641c;color:var(--ink);font:14px/1.45 system-ui,sans-serif;outline:none}
    .khwan-set .wrap{position:relative}
    .khwan-set canvas{box-sizing:border-box;width:100%;height:auto;display:block;border:1.5px solid var(--ink);background:#f3efe6;touch-action:none;cursor:grab}
    .khwan-set canvas.grab{cursor:grabbing}
    .khwan-set .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px}
    .khwan-set button,.khwan-set .chip{font:inherit;font-weight:600;border:1.5px solid var(--ink);background:#f3efe6;color:var(--ink);padding:7px 12px;cursor:pointer;min-height:38px}
    .khwan-set .chip{cursor:grab;user-select:none;touch-action:none;background:#dff1ff}
    .khwan-set button:disabled{opacity:.35;cursor:default}
    .khwan-set .say{min-height:1.4em;margin:6px 0 0;font-weight:600}
    .khwan-set .note{color:var(--soft);font-size:12px}
    .khwan-set .lensbox{border:2px dashed var(--ink);padding:8px;margin-top:8px;display:none}
    .khwan-set .lensbox.on{display:block}
  </style>
  <div class="wrap"><canvas width="1280" height="720" aria-label="KHWAN stage: grab the can and shake it (stand-in)"></canvas></div>
  <p class="say" aria-live="polite"></p>
  <div class="row">
    <span class="chip cold" aria-label="Cold ribbon: drag it across the can">❄ COLD RIBBON — drag across the can</span>
    <button class="coldkb">Run the cold ribbon (keyboard)</button>
    <button class="lens" hidden>LENS (the paw brought it)</button>
    <button class="keep" disabled>KEEP THIS SHOT</button>
  </div>
  <div class="lensbox" aria-live="polite"></div>
  <p class="note">Keyboard: focus the stage and press ← → alternately to shake. Stand-ins — not art direction. The pressure bar is a rehearsal readout only.</p>`;
  const cv = root.querySelector('canvas'), ctx = cv.getContext('2d'), say = root.querySelector('.say'), lensBox = root.querySelector('.lensbox');
  const $ = q => root.querySelector(q);

  const st = {
    alive: true, raf: 0, last: performance.now(), time: 0,
    phase: 'entrance', pt: 0,            // phase time
    p: 0, energy: 0, still: 0,            // pressure, recent shake energy, seconds since the last shake impulse
    dirSum: 0, violent: 0,                // shake direction memory, violence
    grabbing: false, down: null, lastMove: null, lastVx: 0,
    frost: 0, lidOpen: false, version: 1, idle: 0, hinted: false, lensGiven: false, lensOn: false,
    segments: [{ id: 'left', home: 'can' }, { id: 'middle', home: 'can' }, { id: 'right', home: 'can' }],
    ribbonSide: 0,                         // which side the ribbon was pulled to at the clue (-1 left, 1 right)
    bGrip: 0, B: null, lastB: null, trace: [], keepCount: 0,
  };
  const trace = (cause, what) => { st.trace.push({ t: +st.time.toFixed(2), cause, what }); if (st.trace.length > 200) st.trace.shift(); };
  const speak = t => { say.textContent = t; };
  const go = (phase, line) => { st.phase = phase; st.pt = 0; st.armed = false; if (line) speak(line); syncUI(); };

  if (opts.state) { // re-entry by phase, no replay
    Object.assign(st, { frost: opts.state.frost || 0, version: opts.state.version || 1, lastB: opts.state.lastB || null, lensGiven: !!opts.state.lensGiven });
    if (opts.state.segments) st.segments = opts.state.segments.map(s => ({ ...s }));
    st.phase = 'hold'; speak('KHWAN — Pack Shot A, living hold. Grab the can and shake it.'); trace('world', 'resumed by phase (no replay)');
  } else { speak('RUSH carries the can in…'); trace('rush', 'entrance'); }

  // ---------- input: grab and shake (a click is not a shake) ----------
  const canRect = () => ({ x: 560, y: 210, w: 160, h: 300 });
  const toCanvas = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * 1280 / r.width, y: (e.clientY - r.top) * 720 / r.height }; };
  const onCan = p => { const c = canRect(); return p.x > c.x - 40 && p.x < c.x + c.w + 40 && p.y > c.y - 60 && p.y < c.y + c.h + 40; };
  function impulse(vx, src) { // a direction reversal with speed = one shake impulse
    const k = Math.min(1, Math.abs(vx) / 2.5);
    st.energy = Math.min(1.5, st.energy + 0.35 * k); st.still = 0; st.idle = 0; st.dirSum = st.dirSum * 0.8 + Math.sign(vx) * k;
    st.violent = Math.max(st.violent, k);
    if (st.phase === 'hold' || st.phase === 'clue' || st.phase === 'abort') st.p = Math.min(1, st.p + 0.075 * k * (st.phase === 'clue' ? 1.4 : 1));
    if (st.phase === 'B') shakeDuringB();
    if (st.phase === 'abort') { go('hold', 'You started again — RUSH grabs back on.'); trace('visitor', 'shook again during the abort check'); }
  }
  cv.addEventListener('pointerdown', e => {
    const p = toCanvas(e); if (!onCan(p)) return;
    cv.setPointerCapture(e.pointerId); st.grabbing = true; cv.classList.add('grab');
    st.down = { ...p, t: performance.now(), moved: 0 }; st.lastMove = { ...p, t: performance.now() }; st.lastVx = 0;
  });
  cv.addEventListener('pointermove', e => {
    if (!st.grabbing) return; const p = toCanvas(e), now = performance.now(), dt = Math.max(8, now - st.lastMove.t);
    const vx = (p.x - st.lastMove.x) / dt; st.down.moved += Math.hypot(p.x - st.lastMove.x, p.y - st.lastMove.y);
    if (Math.sign(vx) !== Math.sign(st.lastVx) && Math.abs(vx - st.lastVx) > 0.6) impulse(vx, 'pointer');
    st.lastVx = vx; st.lastMove = { ...p, t: now };
  });
  const release = e => {
    if (!st.grabbing) return; st.grabbing = false; cv.classList.remove('grab');
    if (st.down && st.down.moved < 8 && performance.now() - st.down.t < 350) { // a click is not a shake
      speak(st.phase === 'hold' ? 'RUSH gives a small nod. (Grab the can and shake it.)' : 'Noted.'); trace('visitor', 'click (acknowledged, not a shake)');
    }
  };
  cv.addEventListener('pointerup', release); cv.addEventListener('pointercancel', release);
  let lastKey = 0;
  root.addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return; e.preventDefault();
    const d = e.key === 'ArrowLeft' ? -1 : 1; if (d !== lastKey) impulse(d * 2.2, 'key'); lastKey = d;
  });

  // ---------- cold ribbon: changes coping, never pressure ----------
  function applyCold(via) {
    st.frost = Math.min(1, st.frost + 0.5); trace('visitor', `cold ribbon (${via}) → frost ${st.frost.toFixed(1)}`);
    speak(st.phase === 'B' ? 'Frost on the can — RUSH works it into the shot.' : 'Frost blooms on the can. RUSH wipes his gloves — same pressure, colder grip.');
  }
  const chip = $('.cold');
  chip.addEventListener('pointerdown', e => { chip.setPointerCapture(e.pointerId); chip.dataset.drag = '1'; });
  chip.addEventListener('pointerup', e => { if (!chip.dataset.drag) return; delete chip.dataset.drag;
    const r = cv.getBoundingClientRect(); if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom && onCan(toCanvas(e))) applyCold('drag'); });
  $('.coldkb').onclick = () => applyCold('keyboard');
  $('.lens').onclick = () => { st.lensOn = !st.lensOn; lensBox.classList.toggle('on', st.lensOn); };
  $('.keep').onclick = () => {
    const shot = st.B || st.lastB; if (!shot) return;
    const c = document.createElement('canvas'); c.width = 1280; c.height = 720; drawScene(c.getContext('2d'), true);
    st.keepCount++; onKeep({ kind: 'khwan-pack-shot-b', scars: { ...shot.scars }, image: c.toDataURL('image/png') });
    speak('KEPT — your shot goes to the Visit Sheet.'); trace('visitor', 'KEEP THIS SHOT');
  };

  // ---------- B: built from causal material (D1) ----------
  function composeB() {
    const dir = st.ribbonSide || (st.dirSum >= 0 ? 1 : -1);
    const inCan = st.segments.filter(s => s.home === 'can');
    const saved = inCan.find(s => s.id === (dir < 0 ? 'left' : 'right')) || inCan[0] || null; // the segment nearest the taut ribbon
    const scars = { direction: dir < 0 ? 'left' : 'right', frost: +st.frost.toFixed(1), saved: saved?.id || 'none', lost: st.segments.filter(s => s.home !== 'can').map(s => s.id) };
    const plan = [`the ribbon pulled ${scars.direction} becomes his line`, `the can counterweights to the ${dir < 0 ? 'right' : 'left'}`,
      saved ? `he saves the ${saved.id} segment` : 'no segment left — he features the ribbon alone', st.frost > 0 ? 'the frost becomes the light on the can' : 'no frost'];
    trace('rush', 'decision: ' + plan.join('; '));
    return { dir, scars, plan, grip: 'steadying' };
  }
  function shakeDuringB() {
    st.bGrip++;
    if (st.bGrip === 1) { st.B.grip = 're-gripped'; st.B.plan.push('the steadying hand changes job: it re-grips the can'); speak('You shook again — RUSH re-grips; the props stay where they were.'); trace('rush', 're-grip during B (cause: visitor shake)'); }
    else if (st.bGrip === 2) { // let one element go: only items already there
      const free = st.segments.find(s => s.home === 'can' && s.id !== st.B.scars.saved);
      if (free) { free.home = 'escaped'; st.B.scars.lost = [...st.B.scars.lost, free.id]; st.B.plan.push(`he lets the ${free.id} segment go to keep the shot`);
        speak(`RUSH chooses to let the ${free.id} segment go. It rolls away.`); trace('rush', `lets ${free.id} segment go (cause: visitor shake during B)`);
        onResidue({ kind: 'khwan-segment', id: free.id, home: 'under-the-maker-table' }); }
      else { speak('Nothing left to let go — RUSH just holds tighter.'); }
    }
  }

  // ---------- phase machine ----------
  function step(dt) {
    st.pt += dt; st.time += dt;
    st.energy = Math.max(0, st.energy - dt * 0.9); st.still += dt; st.idle += dt;
    const shaking = st.still < 0.35;
    switch (st.phase) {
      case 'entrance': if (st.pt >= (reduced ? 0.3 : T.entrance)) { go('hold', 'SHOW → SETTLE → Pack Shot A. It lives.'); trace('rush', 'settles Pack Shot A'); } break;
      case 'hold': {
        if (!shaking) st.p = Math.max(0, st.p - dt * 0.12);
        if (!st.hinted && st.idle > 5) { st.hinted = true; speak('TRY SHAKING IT.'); }
        if (!st.lensGiven && st.idle > 9) { st.lensGiven = true; syncUI(); speak('A paw slides a LENS in from off-frame — then leaves.'); trace('world', 'the paw brings the lens (once)'); }
        if (st.p >= BAND.clue) { st.ribbonSide = st.dirSum >= 0 ? 1 : -1; go('clue', 'CLUE — the ribbon being pulled back changes course.'); trace('rush', `clue: ribbon pulled ${st.ribbonSide < 0 ? 'left' : 'right'} (cause: visitor shake direction)`); break; }
        if (shaking && st.p >= BAND.danger) st.armed = true;
        if (st.armed && !shaking) { st.armed = false; go('abort', 'You stopped in the danger band. RUSH checks you really stopped…'); trace('visitor', 'stopped in the danger band'); }
        break; }
      case 'abort':
        st.armed = false;
        if (st.pt >= T.abortCheck + T.abort) { st.p = 0.3; go('hold', 'He lets go. Pack Shot A again — nothing reversed, nothing popped.'); trace('rush', 'abort complete'); }
        break;
      case 'clue':
        if (st.p >= 1) { st.lidOpen = true; st.p = 0; go('pop', 'POP — the lid first. The opening is committed.'); trace('world', 'lid opens — committed'); }
        else if (st.still > T.nothingWait) { go('nothing', 'You stopped after the clue — RUSH braced for nothing.'); trace('visitor', 'stopped after the clue, before the lid'); }
        break;
      case 'nothing': if (st.pt >= T.nothing) { st.p = 0.35; go('hold', 'He rebuilds Pack Shot A.'); trace('rush', 'rebuilds A (ready for nothing)'); } break;
      case 'pop': if (st.pt >= (reduced ? 0.1 : T.pop)) go('reveal', 'REVEAL — RUSH emerges holding that ribbon.'); break;
      case 'reveal': if (st.pt >= (reduced ? 0.1 : st.violent > 0.85 ? T.reveal / 2 : T.reveal)) { st.B = composeB();
        go('decision', st.violent > 0.85 ? 'DECISION — compressed into one gesture (violent shake).' : 'DECISION — he redirects it into a new shot.'); } break;
      case 'decision': if (st.pt >= (reduced ? 0.1 : st.violent > 0.85 ? T.decision / 2 : T.decision)) {
        go('B', `Pack Shot B — scars: pulled ${st.B.scars.direction}${st.B.scars.frost ? ', frost' : ''}, saved ${st.B.scars.saved}.`);
        onRecord({ kind: 'khwan-shot', version: st.version, scars: { ...st.B.scars }, plan: [...st.B.plan], at: Date.now() }); } break;
      case 'B': if (st.still > T.recapWait) { go('recap', 'RUSH re-stages the shot and visibly re-caps the can.'); trace('rush', 're-cap'); } break;
      case 'recap': if (st.pt >= (reduced ? 0.2 : T.recap)) { st.lastB = st.B; st.B = null; st.lidOpen = false; st.p = 0.2; st.violent = 0; st.bGrip = 0; st.version++;
        go('hold', 'Re-capped — not reset: frost, scars and pose stay. His acting remembers you.'); trace('rush', 'living hold with scars'); } break;
    }
    if (st.lensOn) lensBox.textContent = `LENS — inside: phase ${st.phase.toUpperCase()}; pressure ${(st.p * 100) | 0}%; ` + (st.B ? 'plan: ' + st.B.plan.join('; ') : st.p > BAND.danger ? 'RUSH senses it coming (premonition).' : st.p > BAND.adapt ? 'RUSH adapts: braces the segments.' : 'RUSH tidies the shot.');
  }
  function syncUI() { $('.lens').hidden = !st.lensGiven; $('.keep').disabled = !(st.B || st.lastB); }

  // ---------- drawing (stand-ins) ----------
  function drawScene(c, still) {
    const t = st.time, amp = reduced ? 0.25 : 1, colour = st.phase === 'entrance' ? Math.min(1, st.pt / T.entrance) : 1;
    c.fillStyle = '#f3efe6'; c.fillRect(0, 0, 1280, 720);
    c.save(); c.globalAlpha = 0.1 + 0.3 * colour; c.fillStyle = '#ffd6a8'; c.beginPath(); c.arc(640, 360, 330, 0, 7); c.fill(); c.restore();
    c.lineWidth = 4; c.strokeStyle = '#1b1b1b'; c.font = '20px system-ui,sans-serif'; c.textAlign = 'center';
    const lab = (s, x, y) => { c.save(); c.fillStyle = '#6b665c'; c.fillText(s, x, y); c.restore(); };
    // shake offset follows energy (the grip answers at once)
    const sx = st.grabbing || st.energy > 0.05 ? Math.sin(t * 40) * 14 * Math.min(1, st.energy) * amp : 0;
    const B = st.phase === 'B' || st.phase === 'decision' ? st.B : null;
    const tilt = B ? B.dir * -0.12 : 0, cx = 640 + (B ? B.dir * -60 : 0) + sx, cy = 360 + Math.sin(t * 1.4) * 6 * amp;
    const ent = st.phase === 'entrance' ? Math.min(1, st.pt / T.entrance) : 1;
    // can (floats, no base)
    c.save(); c.translate(cx + (1 - ent) * -700, cy); c.rotate(tilt + (1 - ent) * -1.2);
    c.fillStyle = colour < 1 ? `rgba(200,200,200,1)` : '#ffffff'; c.fillRect(-80, -150, 160, 300); c.strokeRect(-80, -150, 160, 300);
    if (st.frost > 0) { c.save(); c.globalAlpha = 0.25 + 0.45 * st.frost; c.fillStyle = '#cfeaff'; c.fillRect(-80, -150, 160, 300); c.restore(); }
    c.fillStyle = '#1b1b1b'; c.fillText('KHWAN', 0, 10);
    const lidUp = st.lidOpen ? Math.min(1, (st.phase === 'pop' ? st.pt / T.pop : 1)) : 0;
    c.save(); c.translate(0, -160 - lidUp * 120); c.rotate(lidUp * 0.6); c.fillStyle = '#e8e2d4'; c.fillRect(-84, -12, 168, 18); c.strokeRect(-84, -12, 168, 18); c.restore();
    c.restore();
    lab(st.lidOpen ? 'LID (open — committed)' : 'LID', cx, cy - 190 - lidUp * 120);
    // segments: in the can's orbit, or escaped (rest at their home off-stage)
    st.segments.forEach((s, i) => {
      if (s.home !== 'can') return;
      const ang = t * 0.8 + i * 2.1, saved = B && B.scars.saved === s.id;
      const x = saved ? cx + B.dir * 140 : cx + Math.cos(ang) * 190 * amp + (i - 1) * 10, y = saved ? cy - 120 : cy + Math.sin(ang) * 80 * amp + Math.sin(t * 4 + i) * 10 * amp * Math.min(1, st.energy + 0.2);
      c.save(); c.fillStyle = colour < 1 ? '#ccc' : '#ffb35c'; c.beginPath(); c.arc(x, y, 26, 0, 7); c.fill(); c.stroke(); c.restore(); lab(saved ? `SEGMENT (${s.id}, saved)` : 'SEGMENT', x, y + 48);
    });
    // ribbon: its course shows the clue; in B it is RUSH's line
    c.save(); c.strokeStyle = '#d8641c'; c.lineWidth = 6; c.beginPath();
    const side = (st.phase === 'clue' || st.lidOpen || B) ? (st.ribbonSide || 1) : Math.sin(t * 0.7);
    c.moveTo(cx - 160, cy + 120); c.bezierCurveTo(cx - 40, cy - 60 * side, cx + 80, cy + 60 * side, cx + 170 * (B ? B.dir : 1), cy - 140); c.stroke(); c.restore();
    lab('RIBBON', cx + 170 * (B ? B.dir : 1), cy - 160);
    // RUSH: stand-in figure; position and pose label tell the beat
    const inside = st.phase === 'entrance' && ent > 0.7 || ['hold', 'abort', 'clue', 'nothing'].includes(st.phase);
    const rx = st.phase === 'entrance' ? 120 + ent * 400 : inside ? cx + 30 : cx + (B ? B.dir * 210 : 120), ry = inside ? cy - 40 : cy - 210;
    c.save(); c.globalAlpha = inside ? 0.55 : 1; c.beginPath(); c.arc(rx, ry, 22, 0, 7); c.stroke(); c.beginPath(); c.moveTo(rx, ry + 22); c.lineTo(rx, ry + 80); c.stroke(); c.restore();
    const pose = { entrance: ent < 0.7 ? 'carries the can in' : 'dives in', hold: st.p > BAND.danger ? 'premonition — notices first' : st.p > BAND.adapt ? 'adapts' : 'tidies', abort: 'checks you stopped', clue: 'pulls back', nothing: 'braced for nothing', pop: 'POP', reveal: 'emerges with the ribbon', decision: 'redirects', B: B ? B.grip : '', recap: 're-caps' }[st.phase];
    lab(`RUSH — ${pose}`, rx, ry - 34);
    if (!still) { // rehearsal readout only
      c.fillStyle = '#e4ded1'; c.fillRect(40, 660, 300, 14); c.fillStyle = st.p > BAND.danger ? '#d8641c' : '#1b1b1b'; c.fillRect(40, 660, 300 * st.p, 14);
      c.textAlign = 'left'; lab(`pressure (rehearsal readout) — ${st.phase.toUpperCase()}`, 40, 650);
    }
    c.textAlign = 'right'; lab('STAND-IN · rehearsal only · not art direction', 1264, 700);
  }
  function tick(now) {
    if (!st.alive) return; const dt = Math.min(0.05, (now - st.last) / 1000); st.last = now;
    step(dt); drawScene(ctx, false); st.raf = requestAnimationFrame(tick);
  }
  syncUI(); st.raf = requestAnimationFrame(tick);
  const getState = () => ({ frost: st.frost, version: st.version, lastB: st.lastB || st.B, lensGiven: st.lensGiven, segments: st.segments.map(s => ({ ...s })) });
  return {
    leave() { st.grabbing = false; st.energy = 0; },   // leaving ends the shaking intent
    unmount() { st.alive = false; cancelAnimationFrame(st.raf); root.innerHTML = ''; root.classList.remove('khwan-set'); },
    getState,
    debug: () => ({ phase: st.phase, p: +st.p.toFixed(3), lidOpen: st.lidOpen, frost: st.frost, version: st.version, B: st.B && { ...st.B, plan: [...st.B.plan] },
      lastB: st.lastB && { scars: st.lastB.scars }, segments: st.segments.map(s => ({ ...s })), lensGiven: st.lensGiven, trace: st.trace.map(x => ({ ...x })) }),
    _impulse: (vx = 2.4) => impulse(vx, 'test'), // test hook: one shake impulse
  };
}
