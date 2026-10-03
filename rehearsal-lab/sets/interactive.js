// INTERACTIVE — rehearsal module (Blueprint v1.1 §4.3; D3). Specimen: a demo camera, labelled DEMO PRODUCT.
// Invariant: the context the visitor creates is reinterpreted by each new intent and never reset.
// Context = ORIGINAL (a semantic scene snapshot, no computer-vision pretence) + FOCUS (a known entity, or a stated demo
// intent for an empty region) + CHOICE (one mode every intent reads and can change: close-up / everyday / wide).
// Stand-in shapes only (rule 9). Mount contract: mount(root, opts) -> { leave(), unmount(), debug() }; opts.onKeep(record).

const MODES = ['close-up', 'everyday', 'wide'];
const INTENTS = { want: 'MAKE ME WANT IT', how: 'SHOW ME HOW IT WORKS', choose: 'HELP ME CHOOSE' };
const DEMO_OPTIONS = { 'close-up': 'Demo Cam S — macro lens', everyday: 'Demo Cam M — 35 mm', wide: 'Demo Cam L — 18 mm wide' };
const PARTS = ['body', 'lens', 'sensor', 'shutter', 'dial'];
// part layouts (x, y, w, h in stage units 0..1 x 0..0.5625) for each pose
const POSES = {
  assembled: { body: [.30, .22, .22, .14], lens: [.52, .25, .07, .08], sensor: [.36, .25, .03, .08], shutter: [.40, .25, .03, .08], dial: [.33, .19, .05, .03] },
  exploded:  { body: [.12, .30, .20, .13], lens: [.70, .16, .08, .09], sensor: [.40, .10, .04, .10], shutter: [.54, .10, .04, .10], dial: [.16, .12, .06, .04] },
  aligned:   { body: [.20, .40, .50, .05], lens: [.66, .22, .08, .09], sensor: [.30, .22, .04, .09], shutter: [.46, .22, .04, .09], dial: [.20, .30, .06, .04] },
  compare:   { body: [.10, .24, .16, .11], lens: [.26, .26, .05, .07], sensor: [.14, .26, .02, .07], shutter: [.17, .26, .02, .07], dial: [.12, .20, .04, .03] },
};
const poseFor = intent => intent === 'how' ? 'exploded' : intent === 'choose' ? 'compare' : 'assembled';

export function mount(root, opts = {}) {
  const onKeep = opts.onKeep || (() => {}), reduced = !!opts.reducedMotion;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  root.classList.add('interactive-set'); root.tabIndex = 0;
  root.innerHTML = `
  <style>
    .interactive-set{--ink:#1b1b1b;--soft:#6b665c;--accent:#b0461f;color:var(--ink);font:14px/1.45 system-ui,sans-serif;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px;outline:none}
    .interactive-set canvas{box-sizing:border-box;width:100%;height:auto;display:block;border:1.5px solid var(--ink);background:#f3efe6}
    .interactive-set .orig{cursor:crosshair}
    .interactive-set button{font:inherit;font-weight:600;border:1.5px solid var(--ink);background:#f3efe6;color:var(--ink);padding:7px 12px;cursor:pointer;min-height:38px}
    .interactive-set button.primary,.interactive-set button[aria-pressed=true]{background:var(--ink);color:#f3efe6}
    .interactive-set button:focus-visible{outline:3px solid #2a6df4;outline-offset:2px}
    .interactive-set .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0}
    .interactive-set .tag{display:inline-block;border:1.5px solid var(--accent);color:var(--accent);font-size:11px;font-weight:700;padding:1px 6px}
    .interactive-set .say{color:var(--soft);min-height:1.4em;margin:4px 0}
    .interactive-set .sim{border:2px dashed var(--ink);padding:8px;margin-top:6px}
    .interactive-set table{border-collapse:collapse;width:100%;font-size:13px} .interactive-set td,.interactive-set th{border:1px solid var(--ink);padding:4px 6px;text-align:left}
    .interactive-set tr.rec{background:#efe7d4}
    .interactive-set .flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;transition:opacity .25s}
    @media (max-width:760px){.interactive-set{grid-template-columns:1fr}}
  </style>
  <div><div style="position:relative"><canvas class="stage" width="1280" height="720" aria-label="Demo camera and live scene (stand-in)"></canvas><div class="flash"></div></div>
    <div class="row"><button class="primary shutter">SHUTTER</button><span class="tag">DEMO PRODUCT</span><span class="tag">STAND-IN — not art direction</span></div>
    <p class="say" aria-live="polite"></p></div>
  <div>
    <div class="row caps" aria-label="Captures"></div>
    <div><strong class="origTitle">ORIGINAL</strong> <span class="tag origTag"></span> <span class="hint" style="color:var(--soft);font-size:12px">tap what it is about (FOCUS)</span></div>
    <canvas class="orig" width="640" height="360" aria-label="Original photo — tap to set focus"></canvas>
    <div class="row intents" role="tablist">${Object.entries(INTENTS).map(([k, v]) => `<button role="tab" data-intent="${k}">${v}</button>`).join('')}</div>
    <div class="sim" aria-live="polite"></div>
    <div class="row"><button class="keep">KEEP this capture</button></div>
  </div>`;
  const $ = q => root.querySelector(q), stage = $('.stage').getContext('2d'), origCtx = $('.orig').getContext('2d'), sim = $('.sim'), say = $('.say');
  const speak = t => { say.textContent = t; };

  // the live scene the camera points at: known entities that drift a little (so a second capture differs)
  const scene = [{ id: 'cup', name: 'cup', x: .30, y: .52, w: .10, h: .14 }, { id: 'plant', name: 'plant', x: .58, y: .38, w: .12, h: .28 }, { id: 'book', name: 'book', x: .74, y: .58, w: .14, h: .06 }];
  const st = { alive: true, raf: 0, time: 0, last: performance.now(), intent: 'want', mode: 'everyday',
    parts: JSON.parse(JSON.stringify(POSES.assembled)), poseName: 'assembled', pendingShot: null, flashT: 0,
    photos: [], cur: -1 };
  // SAMPLE photo makes every intent work at once (labelled SAMPLE)
  st.photos.push({ label: 'SAMPLE', sample: true, entities: scene.map(e => ({ ...e })), focus: 'plant' }); st.cur = 0;
  const photo = () => st.photos[st.cur];
  const entityOf = p => p && typeof p.focus === 'string' ? p.entities.find(e => e.id === p.focus) : null;
  const focusName = p => !p?.focus ? null : typeof p.focus === 'string' ? entityOf(p)?.name : `${p.focus.demo} (stated demo intent — empty region)`;

  function drawPhoto(ctx, p, o = {}) {
    const W = ctx.canvas.width, H = ctx.canvas.height; ctx.save(); ctx.fillStyle = '#f7f3ea'; ctx.fillRect(0, 0, W, H);
    if (o.crop) { const z = o.crop.z, cx = o.crop.cx * W, cy = o.crop.cy * H; ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-cx, -cy); }
    ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, H * .66); ctx.lineTo(W, H * .66); ctx.stroke();
    ctx.font = `${Math.round(W / 40)}px system-ui,sans-serif`; ctx.textAlign = 'center';
    for (const e of p.entities) { const x = e.x * W, y = e.y * H, w = e.w * W, h = e.h * H;
      ctx.fillStyle = '#fff'; ctx.fillRect(x - w / 2, y - h / 2, w, h); ctx.strokeRect(x - w / 2, y - h / 2, w, h);
      ctx.fillStyle = '#6b665c'; ctx.fillText(e.name.toUpperCase(), x, y + 4);
      if (o.mark && p.focus === e.id) { ctx.save(); ctx.strokeStyle = '#b0461f'; ctx.lineWidth = 4; ctx.strokeRect(x - w / 2 - 8, y - h / 2 - 8, w + 16, h + 16); ctx.restore(); } }
    if (o.mark && p.focus && typeof p.focus === 'object') { ctx.save(); ctx.strokeStyle = '#b0461f'; ctx.setLineDash([8, 6]); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(p.focus.x * W, p.focus.y * H, W * .06, 0, 7); ctx.stroke(); ctx.restore(); }
    ctx.restore();
    if (o.label) { ctx.save(); ctx.font = `bold ${Math.round(W / 45)}px system-ui,sans-serif`; ctx.fillStyle = '#b0461f'; ctx.textAlign = 'left'; ctx.fillText(o.label, 10, 24); ctx.restore(); }
  }
  // ---- intent panels: each reinterprets the same ORIGINAL + FOCUS + CHOICE and offers different actions ----
  function renderSim() {
    const p = photo(), fname = focusName(p);
    root.querySelectorAll('[data-intent]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.intent === st.intent)));
    if (!p.focus) { sim.innerHTML = `<strong>Target to reconfirm.</strong> This is a new capture — tap what it is about in the ORIGINAL. (Your intent, ${INTENTS[st.intent]}, carries over.)`; return; }
    if (st.intent === 'want') {
      sim.innerHTML = `<span class="tag">SIMULATION</span> <strong>Frame the hero</strong><canvas class="hero" width="640" height="360" style="margin-top:6px"></canvas>
        <p style="margin:4px 0">Emphasis: <strong>your ${esc(fname)}</strong>, ${st.mode} framing — your choice and your image are the hero.</p>
        <div class="row">${MODES.map(m => `<button data-mode="${m}" aria-pressed="${m === st.mode}">${m}</button>`).join('')}</div>`;
      const e = entityOf(p), f = e ? { cx: e.x, cy: e.y } : { cx: p.focus.x, cy: p.focus.y }, z = { 'close-up': 2.6, everyday: 1.7, wide: 1.1 }[st.mode];
      drawPhoto(sim.querySelector('.hero').getContext('2d'), p, { crop: { ...f, z }, label: 'SIMULATION — the original is unchanged' });
    } else if (st.intent === 'how') {
      sim.innerHTML = `<span class="tag">SIMULATION</span> <strong>Turn the controls</strong>
        <p style="margin:4px 0">The exploded camera (left) shows the light path. Your <strong>${esc(fname)}</strong> sits at ${Math.round((entityOf(p)?.x ?? p.focus.x) * 100)}% across the frame;
        the dial sets how the lens treats it.</p>
        <div class="row" aria-label="Dial">${MODES.map(m => `<button data-mode="${m}" aria-pressed="${m === st.mode}">dial: ${m}</button>`).join('')}</div>
        <p style="margin:0;color:var(--soft)">${{ 'close-up': 'Macro: the lens moves out; only your subject stays sharp.', everyday: 'Standard: what your eye sees.', wide: 'Wide: more of the room around your subject.' }[st.mode]}</p>`;
    } else {
      const rec = st.mode;
      sim.innerHTML = `<span class="tag">DEMO OPTIONS — not real products</span> <strong>Compare</strong>
        <table><tr><th>Option</th><th>For your ${esc(fname)}</th><th></th></tr>${MODES.map(m => `<tr class="${m === rec ? 'rec' : ''}"><td>${DEMO_OPTIONS[m]}</td>
        <td>${m === 'close-up' ? 'fills the frame with it' : m === 'everyday' ? 'shows it as you saw it' : 'keeps the room around it'}</td>
        <td><button data-mode="${m}" aria-pressed="${m === rec}">${m === rec ? 'your choice' : 'choose'}</button></td></tr>`).join('')}</table>`;
    }
    sim.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { st.mode = b.dataset.mode; renderSim(); });
  }
  function renderCaps() {
    $('.caps').innerHTML = st.photos.map((p, i) => `<button data-cap="${i}" aria-pressed="${i === st.cur}">${p.sample ? 'SAMPLE' : 'ORIGINAL ' + p.label}</button>`).join('');
    $('.caps').querySelectorAll('[data-cap]').forEach(b => b.onclick = () => { st.cur = +b.dataset.cap; renderAll(); speak(`Back to ${b.textContent} — its layers are kept.`); });
    $('.origTitle').textContent = photo().sample ? 'SAMPLE PHOTO' : 'ORIGINAL ' + photo().label; $('.origTag').textContent = photo().sample ? 'SAMPLE' : 'ORIGINAL — never overwritten';
  }
  const renderAll = () => { renderCaps(); drawPhoto(origCtx, photo(), { mark: true }); renderSim(); };

  // ---- actions ----
  function setIntent(k) {
    st.intent = k; st.poseName = poseFor(k); // latest intent wins; parts re-task from wherever they are now
    speak(`${INTENTS[k]} — same photo, same focus, same choice, read differently.`); renderSim();
  }
  function shutter() {
    if (st.pendingShot) return;
    const exploded = partsDistance(POSES.assembled) > 0.05 && st.poseName === 'exploded';
    if (exploded) { st.poseName = 'aligned'; st.pendingShot = { at: st.time + (reduced ? 0 : 0.45), back: 'exploded' }; speak('The parts align into the light path…'); }
    else st.pendingShot = { at: st.time, back: null };
  }
  function capture() {
    const n = st.photos.filter(p => !p.sample).length, label = String.fromCharCode(65 + n);
    st.photos.push({ label, sample: false, entities: scene.map(e => ({ ...e })), focus: null }); // B carries no focus from A
    st.cur = st.photos.length - 1; st.flashT = 1; $('.flash').style.opacity = reduced ? 0.4 : 1;
    setTimeout(() => { $('.flash').style.opacity = 0; }, 120);
    speak(`FLASH — ORIGINAL ${label}. ${n ? 'New capture: reconfirm the target.' : 'Tap what it is about.'}`); renderAll();
  }
  $('.orig').onclick = e => {
    const r = e.currentTarget.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height, p = photo();
    const hit = p.entities.find(en => Math.abs(x - en.x) < en.w / 2 + .02 && Math.abs(y - en.y) < en.h / 2 + .02);
    p.focus = hit ? hit.id : { demo: y < .66 ? 'background wall' : 'table surface', x, y };
    speak(`FOCUS: ${focusName(p)}.`); renderAll();
  };
  root.querySelectorAll('[data-intent]').forEach(b => b.onclick = () => setIntent(b.dataset.intent));
  $('.shutter').onclick = shutter;
  $('.keep').onclick = () => { const c = document.createElement('canvas'); c.width = 1280; c.height = 720; drawPhoto(c.getContext('2d'), photo(), { mark: true });
    onKeep({ kind: 'interactive-capture', label: photo().label, focus: focusName(photo()), mode: st.mode, intent: st.intent, image: c.toDataURL('image/png') }); speak('Kept.'); };

  // ---- stage loop ----
  function partsDistance(target) { let d = 0; for (const k of PARTS) for (let i = 0; i < 4; i++) d = Math.max(d, Math.abs(st.parts[k][i] - target[k][i])); return d; }
  function drawStage() {
    const W = 1280, s = W; stage.fillStyle = '#f3efe6'; stage.fillRect(0, 0, W, 720); stage.lineWidth = 3; stage.strokeStyle = '#1b1b1b';
    stage.font = '20px system-ui,sans-serif'; stage.textAlign = 'center';
    // live scene (what the camera points at), with the Thought Crowd stand-ins reacting to the flash
    const sx = 860, sy = 370, sw = 380, sh = 200; stage.strokeRect(sx, sy, sw, sh); stage.fillStyle = '#6b665c'; stage.fillText('LIVE SCENE', sx + sw / 2, sy - 10);
    for (const e of scene) { stage.strokeRect(sx + (e.x - e.w / 2) * sw, sy + (e.y - e.h / 2) * sh, e.w * sw, e.h * sh); }
    for (let i = 0; i < 3; i++) { const cx = sx + 60 + i * 130, cy = sy + sh + 50, blink = st.flashT > 0.3;
      stage.beginPath(); stage.arc(cx, cy, 26, 0, 7); stage.stroke(); stage.fillStyle = '#1b1b1b';
      if (blink) { stage.fillRect(cx - 12, cy - 4, 8, 3); stage.fillRect(cx + 4, cy - 4, 8, 3); } else { stage.beginPath(); stage.arc(cx - 8, cy - 4, 3, 0, 7); stage.arc(cx + 8, cy - 4, 3, 0, 7); stage.fill(); } }
    stage.fillStyle = '#6b665c'; stage.fillText('THOUGHT CROWD (stand-in)', sx + sw / 2, sy + sh + 100);
    // camera parts
    for (const k of PARTS) { const [x, y, w, h] = st.parts[k]; stage.fillStyle = '#fff'; stage.fillRect(x * s, y * s, w * s, h * s); stage.strokeRect(x * s, y * s, w * s, h * s);
      if (st.poseName !== 'assembled') { stage.fillStyle = '#6b665c'; stage.fillText(k.toUpperCase(), (x + w / 2) * s, (y + h) * s + 22); } }
    if (st.poseName === 'aligned' || st.poseName === 'exploded') { stage.save(); stage.strokeStyle = '#d9a400'; stage.setLineDash([10, 8]);
      stage.beginPath(); stage.moveTo(.12 * s, .265 * s); stage.lineTo(.80 * s, .265 * s); stage.stroke(); stage.restore(); }
    stage.fillStyle = '#b0461f'; stage.textAlign = 'left'; stage.fillText('DEMO CAMERA — ' + INTENTS[st.intent], 20, 40);
  }
  function tick(now) {
    if (!st.alive) return;
    const dt = Math.min(0.05, (now - st.last) / 1000); st.last = now; st.time += dt; st.flashT = Math.max(0, st.flashT - dt * 1.5);
    const target = POSES[st.poseName], k = reduced ? 1 : Math.min(1, dt * 7);
    for (const p of PARTS) for (let i = 0; i < 4; i++) st.parts[p][i] += (target[p][i] - st.parts[p][i]) * k;
    scene[0].x = .30 + Math.sin(st.time * .4) * .05; scene[1].y = .38 + Math.sin(st.time * .9) * .02; // the scene lives
    if (st.pendingShot && st.time >= st.pendingShot.at) { const back = st.pendingShot.back; st.pendingShot = null; capture(); if (back) st.poseName = back; }
    drawStage(); st.raf = requestAnimationFrame(tick);
  }
  renderAll(); speak('A SAMPLE photo is loaded so every intent works at once. Try it — or press the shutter.'); st.raf = requestAnimationFrame(tick);
  return {
    leave() { st.pendingShot = null; },
    unmount() { st.alive = false; cancelAnimationFrame(st.raf); root.innerHTML = ''; root.classList.remove('interactive-set'); },
    debug: () => ({ intent: st.intent, mode: st.mode, pose: st.poseName, cur: st.cur, photos: st.photos.map(p => ({ label: p.label, sample: p.sample, focus: p.focus })),
      partsOff: +partsDistance(POSES[st.poseName]).toFixed(3), lensX: +st.parts.lens[0].toFixed(3) }),
  };
}
