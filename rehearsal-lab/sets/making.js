// MAKING BY THANEST — rehearsal module (Blueprint v1.1 §4.5). OPEN THE MOMENT: what you saw → what was authored
// (DECISION → EVIDENCE → EFFECT) → where you entered (minimum evidence) → optional rehearsal that never rewrites history.
// Reads the session records the sets emit (today: Film takes). Nothing personal; nothing invented after the fact.
// In this rehearsal the "evidence" is the stand-in timeline and is labelled as such (it is not production evidence).
// Mount contract: mount(root, opts) -> { leave(), unmount(), debug() }
//   opts.moments   session records, newest last (e.g. { kind:'film-take', take, cut })
//   opts.onExit({ to: 'pricing' | 'contact', attach })  attach is the moment only if the visitor opted in
import { BEATS, drawFrame } from './film.js';

export function mount(root, opts = {}) {
  const lastAny = (opts.moments || []).filter(m => m.kind === 'film-take' || m.kind === 'khwan-shot').pop();
  if (lastAny?.kind === 'khwan-shot') return mountKhwan(root, lastAny, opts);
  const takes = (opts.moments || []).filter(m => m.kind === 'film-take');
  const real = takes[takes.length - 1], m = real || { kind: 'film-take', take: 1, cut: 3.0, sample: true };
  const onExit = opts.onExit || (() => {});
  const st = { revealed: false, rehearse: null, raf: 0, alive: true };
  const seen = BEATS.filter(([t]) => t < m.cut), hidden = BEATS.filter(([t]) => t >= m.cut);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  root.classList.add('making-set');
  root.innerHTML = `
  <style>
    .making-set{--ink:#1b1b1b;--soft:#6b665c;color:var(--ink);font:15px/1.5 system-ui,sans-serif;max-width:900px}
    .making-set h2{font-size:22px;margin:0} .making-set h3{font-size:15px;letter-spacing:.06em;margin:18px 0 6px}
    .making-set .tag{display:inline-block;border:1.5px solid #b0461f;color:#b0461f;font-size:11px;font-weight:700;padding:1px 6px}
    .making-set canvas{box-sizing:border-box;width:100%;max-width:560px;height:auto;border:1.5px solid var(--ink);display:block}
    .making-set ol{margin:4px 0;padding-left:20px} .making-set li.hid{color:var(--soft)}
    .making-set .chain{display:grid;grid-template-columns:max-content 1fr;gap:4px 12px}
    .making-set .chain b{font-size:12px;letter-spacing:.06em}
    .making-set button{font:inherit;font-weight:600;border:1.5px solid var(--ink);background:#f3efe6;color:var(--ink);padding:8px 14px;cursor:pointer;min-height:40px}
    .making-set .fold{border:2px dashed var(--ink);padding:10px;margin-top:8px}
    .making-set .reh{border:2px solid var(--ink);padding:10px;margin-top:8px;background:#fbf8f1}
    .making-set .cols{display:grid;grid-template-columns:1fr 1fr;gap:12px} @media (max-width:640px){.making-set .cols{grid-template-columns:1fr}}
    .making-set input[type=range]{width:100%}
    .making-set .note{color:var(--soft);font-size:13px}
  </style>
  <p class="note">MAKER (stand-in) opens the archive — then steps back. In Making, the work performs.</p>
  <h2>Open the moment</h2>
  <h3>1 · WHAT YOU SAW ${m.sample ? '<span class="tag">SAMPLE MOMENT</span>' : ''}</h3>
  <canvas class="saw" width="960" height="540" aria-label="Replay of the moment"></canvas>
  <p>${m.sample ? 'No played moment in this visit yet, so this is a <strong>sample</strong> take. Play the Film set and come back — it will be yours.'
    : `Your take ${m.take}, cut at ${m.cut.toFixed(2)} s.`} <button class="replay">Replay</button></p>
  <h3>2 · WHAT WAS AUTHORED</h3>
  <div class="chain">
    <b>DECISION</b><span>The take is the <strong>same performance every time</strong>. Only the cut decides what the audience learns.</span>
    <b>EVIDENCE</b><span>The authored timeline <span class="tag">REHEARSAL STAND-IN — not production evidence</span>
      <ol class="beats">${seen.map(([t, d]) => `<li>${t.toFixed(1)} s — ${esc(d)}</li>`).join('')}${hidden.length ? '<li class="hid more">… (after the cut — folded)</li>' : ''}</ol></span>
    <b>EFFECT</b><span class="effect">With a cut at ${m.cut.toFixed(2)} s, the audience knows: ${seen.map(([, d]) => esc(d)).join('; ') || 'nothing yet'}.</span>
  </div>
  <h3>3 · WHERE YOU ENTERED</h3>
  <p class="entered">${m.sample ? 'Sample: a cut pressed at 3.00 s.' : `You pressed CUT at ${m.cut.toFixed(2)} s on take ${m.take}.`} That is all this moment needs to explain.</p>
  ${hidden.length ? `<div class="fold"><strong>THERE'S MORE AFTER YOUR CUT — REVEAL IT?</strong> <button class="reveal">Reveal</button></div>` : ''}
  <h3>4 · REHEARSE THIS MOMENT <span class="note">(optional)</span></h3>
  <div class="reh"><div class="cols"><div><strong>WHAT HAPPENED</strong><p class="happened">Cut at ${m.cut.toFixed(2)} s.</p></div>
    <div><strong>REHEARSAL</strong> <span class="tag">sandbox — never rewrites what happened</span>
      <input type="range" class="slider" min="0.2" max="${(Math.floor(m.cut * 100) / 100).toFixed(2)}" step="0.01" value="${(Math.floor(m.cut * 100) / 100).toFixed(2)}" aria-label="Rehearsal cut time">
      <p class="rehout"></p><p class="note slidernote">Until you reveal what comes after your cut, the rehearsal can only cut earlier.</p></div></div></div>
  <h3>What this enables</h3>
  <p>The same authored performance, cut to tell a different truth — for your film. <button class="svc">Film / AI Film service</button></p>
  <p><label><input type="checkbox" class="attach"> Attach this moment to my brief</label> <button class="brief">Start a brief</button></p>`;
  const $ = q => root.querySelector(q), saw = $('.saw').getContext('2d');
  const rehText = c => { const k = BEATS.filter(([t]) => t < c).map(([, d]) => d); $('.rehout').textContent = `Cut at ${(+c).toFixed(2)} s → the audience would know: ${k.join('; ') || 'nothing yet'}.`; };
  function replay() { // brief replay of exactly what was seen (never past the cut)
    cancelAnimationFrame(st.raf); const t0 = performance.now();
    const step = now => { if (!st.alive) return; const t = Math.min(m.cut, (now - t0) / 1000); drawFrame(saw, t); if (t < m.cut) st.raf = requestAnimationFrame(step); };
    st.raf = requestAnimationFrame(step);
  }
  $('.replay').onclick = replay;
  $('.reveal')?.addEventListener('click', () => {
    st.revealed = true; $('.fold').innerHTML = `<strong>After your cut</strong> (revealed by your choice):<ol>${hidden.map(([t, d]) => `<li>${t.toFixed(1)} s — ${esc(d)}</li>`).join('')}</ol>`;
    $('.slider').max = '8'; $('.slidernote').textContent = 'The whole take is open to rehearse now.';
  });
  $('.slider').oninput = e => { st.rehearse = +e.target.value; rehText(e.target.value); };
  $('.svc').onclick = () => onExit({ to: 'pricing', attach: null });
  $('.brief').onclick = () => onExit({ to: 'contact', attach: $('.attach').checked ? { ...m } : null }); // opt-in only
  rehText(m.cut); drawFrame(saw, m.cut);
  return { leave() { cancelAnimationFrame(st.raf); }, unmount() { st.alive = false; cancelAnimationFrame(st.raf); root.innerHTML = ''; root.classList.remove('making-set'); },
    debug: () => ({ moment: { ...m }, revealed: st.revealed, rehearse: st.rehearse, hiddenCount: hidden.length }) };
}

// KHWAN moment: the visitor's own Pack Shot B, opened. Only causes that were recorded are shown.
function mountKhwan(root, m, opts) {
  const onExit = opts.onExit || (() => {});
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  root.classList.add('making-set');
  root.innerHTML = `
  <style>
    .making-set{--ink:#1b1b1b;--soft:#6b665c;color:var(--ink);font:15px/1.5 system-ui,sans-serif;max-width:900px}
    .making-set h2{font-size:22px;margin:0} .making-set h3{font-size:15px;letter-spacing:.06em;margin:18px 0 6px}
    .making-set .tag{display:inline-block;border:1.5px solid #b0461f;color:#b0461f;font-size:11px;font-weight:700;padding:1px 6px}
    .making-set .chain{display:grid;grid-template-columns:max-content 1fr;gap:4px 12px} .making-set .chain b{font-size:12px;letter-spacing:.06em}
    .making-set button{font:inherit;font-weight:600;border:1.5px solid var(--ink);background:#f3efe6;color:var(--ink);padding:8px 14px;cursor:pointer;min-height:40px}
    .making-set .note{color:var(--soft);font-size:13px}
  </style>
  <p class="note">MAKER (stand-in) opens the archive — then steps back. In Making, the work performs.</p>
  <h2>Open the moment</h2>
  <h3>1 · WHAT YOU SAW</h3><p>Your KHWAN Pack Shot B (shot ${m.version}): pulled ${esc(m.scars.direction)}${m.scars.frost ? ', with frost' : ''}, the ${esc(m.scars.saved)} segment saved${m.scars.lost?.length ? `, the ${esc(m.scars.lost.join(', '))} segment let go` : ''}.</p>
  <h3>2 · WHAT WAS AUTHORED</h3>
  <div class="chain"><b>DECISION</b><span>RUSH never respawns the shot. He copes with what is in front of him and changes plan.</span>
    <b>EVIDENCE</b><span>His plan for your shot <span class="tag">REHEARSAL STAND-IN — not production evidence</span><ol>${m.plan.map(p => `<li>${esc(p)}</li>`).join('')}</ol></span>
    <b>EFFECT</b><span>A Pack Shot B that only your shake could have produced: its scars are the causes you gave it.</span></div>
  <h3>3 · WHERE YOU ENTERED</h3><p class="entered">Your shake leaned ${esc(m.scars.direction)}${m.scars.frost ? '; you ran the cold ribbon across the can' : ''}. That is all this moment needs to explain.</p>
  <h3>What this enables</h3>
  <p>A product with a life inside, that answers people — for your launch. <button class="svc">Interactive / Web App service</button></p>
  <p><label><input type="checkbox" class="attach"> Attach this moment to my brief</label> <button class="brief">Start a brief</button></p>`;
  root.querySelector('.svc').onclick = () => onExit({ to: 'pricing', attach: null });
  root.querySelector('.brief').onclick = () => onExit({ to: 'contact', attach: root.querySelector('.attach').checked ? { ...m } : null });
  return { leave() {}, unmount() { root.innerHTML = ''; root.classList.remove('making-set'); }, debug: () => ({ moment: { ...m }, kind: 'khwan' }) };
}
