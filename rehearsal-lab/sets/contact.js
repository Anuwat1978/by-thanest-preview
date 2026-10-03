// CONTACT — rehearsal module (Blueprint v1.1 §4.6). Contact reduces friction; the world never stands between the client
// and the information. The server is SIMULATED and labelled; the slate claps only on a server-confirmed receipt.
// Mount contract: mount(root, opts) -> { leave(), unmount(), debug() }
//   opts.interest   optional proof name, offered as an opt-in, removable chip ("I'm interested in something like this")
//   opts.service    optional pre-selected service from Pricing ('interactive' | 'film' | 'custom')
//   opts.draft / opts.onDraft(d)  in-session draft kept by the journey across navigation (memory only)
//   opts.server     optional async (brief, key) => { ok, ref, at } | throws; default: the labelled simulated server

const DRAFT_KEY = 'bt-rehearsal-brief-draft';
const store = { get() { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch { return null; } },
  set(v) { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(v)); } catch {} }, clear() { try { localStorage.removeItem(DRAFT_KEY); } catch {} } };

// Simulated server with server-side idempotency: the same key never creates a second brief.
export function simulatedServer() {
  const seen = new Map(); let n = 0; const sim = { mode: 'confirm', delay: 700, received: [] };
  sim.send = (brief, key) => new Promise((ok, fail) => setTimeout(() => {
    if (sim.mode === 'down') return fail(new Error('not received'));
    if (!seen.has(key)) { const rec = { ref: 'BT-' + String(++n).padStart(4, '0'), at: new Date().toISOString(), brief }; seen.set(key, rec); sim.received.push(rec); }
    if (sim.mode === 'unknown') return fail(new Error('received, but the confirmation was lost')); // the worst case for duplicates
    ok({ ok: true, ...seen.get(key) });
  }, sim.delay));
  return sim;
}

export function mount(root, opts = {}) {
  const sim = opts.server ? null : simulatedServer(), send = opts.server || sim.send;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  root.classList.add('contact-set');
  root.innerHTML = `
  <style>
    .contact-set{--ink:#1b1b1b;--soft:#6b665c;color:var(--ink);font:15px/1.5 system-ui,sans-serif;max-width:760px}
    .contact-set h2{font-size:22px;margin:0 0 4px}
    .contact-set .sim{display:inline-block;border:1.5px solid #b0461f;color:#b0461f;font-size:12px;font-weight:700;padding:2px 8px;margin:4px 0 12px}
    .contact-set form{display:grid;gap:12px}
    .contact-set label{display:grid;gap:4px;font-weight:600}
    .contact-set .opt{font-weight:400;color:var(--soft)}
    .contact-set input[type=text],.contact-set input[type=email],.contact-set textarea,.contact-set select{font:inherit;border:1.5px solid var(--ink);padding:8px;background:#fff;color:var(--ink);box-sizing:border-box;width:100%}
    .contact-set fieldset{border:1.5px solid var(--ink);padding:8px 12px;display:flex;gap:14px;flex-wrap:wrap}
    .contact-set fieldset label{display:flex;gap:6px;font-weight:400}
    .contact-set button{font:inherit;font-weight:600;border:1.5px solid var(--ink);background:#f3efe6;color:var(--ink);padding:8px 14px;cursor:pointer;min-height:40px}
    .contact-set button.primary{background:var(--ink);color:#f3efe6}
    .contact-set button:disabled{opacity:.4;cursor:default}
    .contact-set .chip{display:inline-flex;gap:8px;align-items:center;border:1.5px solid var(--ink);border-radius:20px;padding:4px 6px 4px 12px}
    .contact-set .chip button{min-height:28px;padding:2px 8px}
    .contact-set .review{border:2px solid var(--ink);padding:12px;background:#fbf8f1;display:none}
    .contact-set .review.on{display:block}
    .contact-set .review dl{display:grid;grid-template-columns:max-content 1fr;gap:2px 12px;margin:0}
    .contact-set .review dt{color:var(--soft)} .contact-set .review dd{margin:0;white-space:pre-wrap}
    .contact-set .slate{border:2px solid var(--ink);padding:8px 12px;font-weight:700;margin-top:10px;transition:transform .2s}
    .contact-set .slate[data-s=raised]{transform:rotate(-4deg)}
    .contact-set .slate[data-s=clapped]{background:var(--ink);color:#f3efe6}
    .contact-set .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
    .contact-set .err{color:#b0461f;font-weight:600}
    .contact-set .note{color:var(--soft);font-size:13px}
    .contact-set [hidden]{display:none!important}
    .contact-set .simbar{border:1.5px dashed var(--soft);padding:6px 10px;font-size:13px;color:var(--soft)}
  </style>
  <h2>Start a brief</h2>
  <span class="sim">REHEARSAL — the server is SIMULATED; nothing is sent to Thanest</span>
  <p class="note">I personally review every brief. I aim to reply within 2 business days. (Bangkok, Mon–Fri.)</p>
  <form novalidate>
    <label>Name <input type="text" name="name" autocomplete="name" required></label>
    <label>Email <input type="email" name="email" autocomplete="email" required></label>
    <fieldset><legend>What is it?</legend>
      ${['Interactive', 'Film', 'Both', 'Not sure yet'].map(v => `<label><input type="radio" name="kind" value="${v}"> ${v}</label>`).join('')}</fieldset>
    <label>The problem or idea <textarea name="idea" rows="4" required></textarea></label>
    <label>Budget <span class="opt">(“not sure” is fine)</span>
      <select name="budget"><option>Not sure</option><option>Under $15k</option><option>$15–30k</option><option>$30–60k</option><option>$60k+</option></select></label>
    <label>Timing <span class="opt">(“not sure” is fine)</span>
      <select name="timing"><option>Not sure</option><option>Within a month</option><option>1–3 months</option><option>Later</option></select></label>
    <label>Reference <span class="opt">(optional link)</span> <input type="text" name="ref"></label>
    <div class="chips"></div>
    <label style="display:flex;gap:8px;font-weight:400"><input type="checkbox" name="keep"> Keep my draft on this device</label>
    <p class="err" aria-live="assertive"></p>
    <div class="row"><button type="submit" class="primary">REVIEW BRIEF</button><button type="button" class="clear">Clear draft</button></div>
  </form>
  <div class="review" aria-label="Review brief"><strong>REVIEW BRIEF</strong><dl></dl>
    <div class="row" style="margin-top:10px"><button class="primary send">SEND</button><button class="edit">Edit</button></div>
    <div class="slate" data-s="down" aria-live="polite">SLATE — ready</div>
    <div class="row fallback" hidden style="margin-top:8px"><button class="retry">Check / retry</button><button class="copy">Copy brief</button>
      <a class="mail" href="#">Email it instead</a></div>
  </div>
  <div class="simbar" style="margin-top:12px">Simulated server (rehearsal control):
    <label style="display:inline-flex;gap:4px"><input type="radio" name="simmode" value="confirm" checked> confirms receipt</label>
    <label style="display:inline-flex;gap:4px"><input type="radio" name="simmode" value="unknown"> receives, confirmation lost</label>
    <label style="display:inline-flex;gap:4px"><input type="radio" name="simmode" value="down"> unreachable</label></div>`;
  const $ = q => root.querySelector(q), form = $('form'), review = $('.review'), slate = $('.slate'), err = $('.err');
  const st = { phase: 'edit', key: null, sending: false, receipt: null, chip: opts.interest ? { name: opts.interest, on: false } : null };

  // opt-in chip: nothing about the visit is added silently
  const renderChip = () => {
    const c = $('.chips'); if (!st.chip) { c.innerHTML = ''; return; }
    c.innerHTML = st.chip.on ? `<span class="chip">I'm interested in something like this: ${esc(st.chip.name)} <button type="button" class="rm" aria-label="Remove">×</button></span>`
      : `<button type="button" class="add">+ Add "I'm interested in something like this: ${esc(st.chip.name)}"</button>`;
    c.querySelector('.rm, .add').onclick = () => { st.chip.on = !st.chip.on; renderChip(); };
  };
  const data = () => { const f = new FormData(form); return { name: f.get('name') || '', email: f.get('email') || '', kind: f.get('kind') || '',
    idea: f.get('idea') || '', budget: f.get('budget'), timing: f.get('timing'), ref: f.get('ref') || '', interest: st.chip?.on ? st.chip.name : '' }; };
  const fill = d => { for (const [k, v] of Object.entries(d || {})) { const el = form.elements[k]; if (!el || k === 'interest') continue;
    if (el instanceof RadioNodeList) [...el].forEach(r => r.checked = r.value === v); else el.value = v; } };
  // draft: "keep draft on this device" is explicit and clearable
  const saved = store.get(); if (saved) { fill(saved); form.elements.keep.checked = true; } else if (opts.draft) fill(opts.draft); // in-session draft (memory only)
  if (opts.service && !saved) { const m = { interactive: 'Interactive', film: 'Film' }[opts.service]; if (m) fill({ kind: m }); }
  form.oninput = () => { opts.onDraft?.(data()); if (form.elements.keep.checked) store.set(data()); else store.clear(); };
  $('.clear').onclick = () => { store.clear(); form.reset(); renderChip(); err.textContent = ''; };
  renderChip();

  form.onsubmit = e => {
    e.preventDefault(); const d = data(), miss = [];
    if (!d.name.trim()) miss.push('name'); if (!/^\S+@\S+\.\S+$/.test(d.email)) miss.push('a valid email'); if (!d.idea.trim()) miss.push('the problem or idea');
    if (miss.length) { err.textContent = 'Please add ' + miss.join(', ') + '.'; return; }
    err.textContent = ''; st.phase = 'review'; st.key = st.key || (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()));
    review.querySelector('dl').innerHTML = [['Name', d.name], ['Email', d.email], ['What', d.kind || '—'], ['Idea', d.idea], ['Budget', d.budget], ['Timing', d.timing],
      ['Reference', d.ref || '—'], ...(d.interest ? [['Interested in', d.interest]] : [])].map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('');
    review.classList.add('on'); setSlate('down', 'SLATE — ready'); $('.fallback').hidden = true; review.querySelector('.send').focus();
  };
  $('.edit').onclick = () => { if (st.sending) return; review.classList.remove('on'); st.phase = 'edit'; };
  // any edit after review makes a new brief (new idempotency key); resending the same brief reuses its key
  form.addEventListener('input', () => { if (st.phase !== 'sent') st.key = null; });
  const setSlate = (s, txt) => { slate.dataset.s = s; slate.textContent = txt; };

  async function doSend() {
    if (st.sending || st.phase === 'sent') return;            // double-press: no second submission
    st.sending = true; review.querySelector('.send').disabled = true; $('.edit').disabled = true;
    setSlate('raised', 'SLATE — sending… (not received yet)');   // raised, no clap
    try {
      const r = await send(data(), st.key);
      st.receipt = r; st.phase = 'sent'; store.clear(); opts.onDraft?.(null);
      setSlate('clapped', `CLAP — BRIEF RECEIVED · ref ${r.ref} · ${new Date(r.at).toLocaleString()} — received by the server (not yet read; Thanest reviews every brief himself).`);
      $('.fallback').hidden = true;
    } catch {
      setSlate('down', "We can't confirm delivery yet. Your draft is still here."); // no clap on unknown
      $('.fallback').hidden = false; review.querySelector('.send').disabled = false; $('.edit').disabled = false;
      const d = data(); $('.mail').href = `mailto:?subject=${encodeURIComponent('Brief from ' + d.name)}&body=${encodeURIComponent(JSON.stringify(d, null, 2))}`;
    } finally { st.sending = false; }
  }
  review.querySelector('.send').onclick = doSend; $('.retry').onclick = doSend;
  $('.copy').onclick = () => { try { navigator.clipboard.writeText(JSON.stringify(data(), null, 2)); setSlate('down', 'Copied.'); } catch {} };
  root.querySelectorAll('[name=simmode]').forEach(r => r.onchange = () => { if (sim) sim.mode = r.value; });
  if (!sim) $('.simbar').remove();

  return { leave() {}, unmount() { root.innerHTML = ''; root.classList.remove('contact-set'); },
    debug: () => ({ phase: st.phase, sending: st.sending, slate: slate.dataset.s, receipt: st.receipt, received: sim ? sim.received.length : null, draft: store.get() }) };
}
