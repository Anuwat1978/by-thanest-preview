// EDITIONS — rehearsal module (Blueprint v1.1 §4.7). ONE REAL OBJECT IS BETTER THAN A BEAUTIFUL EMPTY STORE.
// Real payments are unauthorised: the order flow is TEST MODE and every item here is a labelled REHEARSAL SAMPLE.
// Mount contract: mount(root, opts) -> { leave(), unmount(), debug(), getState(), setState(s) }
//   opts.items      catalogue; default = labelled rehearsal samples. Pass [] for launch truth with nothing ready.
//   opts.state      { item, options } to restore (Back keeps the item and options; the skeleton owns history)
//   opts.onState(s) called when the selection changes, so the skeleton can push it into history

export const SAMPLE_ITEMS = [
  { id: 'studio-print', status: 'ready', name: 'The Studio — archival print', type: 'Print of an artwork',
    detail: 'Giclée on cotton rag paper, 310 gsm. Signed on the back.', usage: null,
    options: { size: { A3: 120, A2: 180 }, frame: { 'No frame': 0, 'Black frame': 90 } }, delivery: 'Ships from Bangkok in 7–10 days.',
    images: ['full work', 'detail (from the high-resolution file)'], printSample: false },
  { id: 'radio-file', status: 'ready', name: 'Radio — digital file', type: 'Digital file',
    detail: '4K PNG, personal use (wallpaper, print at home). No commercial use.', usage: 'Personal use only',
    options: { size: { '4K PNG': 12 } }, delivery: 'Download link after confirmed payment.', images: ['full work'], printSample: false },
  { id: 'decision-study', status: 'in-development', name: 'Decision Study 001', type: 'Print of an artwork',
    detail: 'A designed study of one decision. Rights to every source being cleared.', usage: null,
    options: {}, delivery: null, images: ['prototype (labelled)'], printSample: false },
  { id: 'idea-x', status: 'idea', name: 'Not shown', type: '', detail: '', options: {}, images: [] },
];

export function mount(root, opts = {}) {
  const items = (opts.items ?? SAMPLE_ITEMS).filter(i => i.status !== 'idea'); // ideas are not shown
  const sample = !opts.items, onState = opts.onState || (() => {});
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const st = { item: null, options: {}, order: 'none', quoted: null, alive: true };
  root.classList.add('editions-set');
  const css = `<style>
    .editions-set{--ink:#1b1b1b;--soft:#6b665c;color:var(--ink);font:15px/1.5 system-ui,sans-serif;max-width:980px}
    .editions-set .tag{display:inline-block;border:1.5px solid #b0461f;color:#b0461f;font-size:12px;font-weight:700;padding:2px 8px}
    .editions-set .stall{display:flex;gap:14px;flex-wrap:wrap;border-bottom:4px solid var(--ink);padding:12px 0}
    .editions-set .card{border:2px solid var(--ink);background:#fbf8f1;padding:10px;width:200px;cursor:pointer;text-align:left;font:inherit;color:inherit}
    .editions-set .card .ph{height:110px;background:#e4ded1;display:grid;place-items:center;color:var(--soft);font-size:12px;margin-bottom:6px}
    .editions-set .st{font-size:12px;font-weight:700}
    .editions-set .item{border:2px solid var(--ink);padding:14px;margin-top:14px;background:#fbf8f1}
    .editions-set .imgs{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}
    .editions-set .imgs div{width:150px;height:100px;background:#e4ded1;display:grid;place-items:center;font-size:12px;color:var(--soft);text-align:center;padding:4px;box-sizing:border-box}
    .editions-set dl{display:grid;grid-template-columns:max-content 1fr;gap:2px 12px} .editions-set dt{color:var(--soft)} .editions-set dd{margin:0}
    .editions-set button{font:inherit;font-weight:600;border:1.5px solid var(--ink);background:#f3efe6;color:var(--ink);padding:8px 14px;cursor:pointer;min-height:40px}
    .editions-set button.primary{background:var(--ink);color:#f3efe6} .editions-set button:disabled{opacity:.4;cursor:default}
    .editions-set select{font:inherit;border:1.5px solid var(--ink);padding:6px;background:#fff}
    .editions-set .row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:8px}
    .editions-set .flow{display:flex;gap:6px;flex-wrap:wrap;font-size:12px;margin-top:10px}
    .editions-set .flow span{border:1.5px solid var(--soft);padding:2px 8px;color:var(--soft)} .editions-set .flow span.on{border-color:var(--ink);color:var(--ink);font-weight:700}
    .editions-set .warn{color:#b0461f;font-weight:600}
  </style>`;
  const price = () => { const it = st.item; if (!it) return 0; return Object.entries(it.options).reduce((sum, [k, m]) => sum + (m[st.options[k]] ?? 0), 0); };
  function render() {
    if (!items.length) { // launch truth with nothing ready: a short, direct page, no empty shelves
      root.innerHTML = css + `<h2>Editions</h2><p>Nothing is ready to own yet. The first editions are being made from the worlds' own images.</p>
        <p>Follow Thanest for the first one, or <a href="#contact">talk to Thanest</a>.</p>`; return;
    }
    const it = st.item;
    root.innerHTML = css + `<h2 style="margin:0">Editions</h2>
      ${sample ? '<span class="tag">REHEARSAL SAMPLE items — not real stock, not for sale</span>' : ''}
      <div class="stall" aria-label="The stall (sized to the real stock)">${items.map(i => `<button class="card" data-id="${i.id}" aria-pressed="${it?.id === i.id}">
        <div class="ph">${i.status === 'in-development' ? 'PROTOTYPE (labelled)' : 'image stand-in'}</div>
        <div><strong>${esc(i.name)}</strong></div><div class="st">${i.status === 'ready' ? 'READY' : 'IN DEVELOPMENT'}</div></button>`).join('')}</div>
      ${it ? `<div class="item" aria-live="polite"><h3 style="margin:0">${esc(it.name)}</h3>
        <dl><dt>Product type</dt><dd>${esc(it.type)}</dd><dt>Details</dt><dd>${esc(it.detail)}</dd>${it.usage ? `<dt>Usage</dt><dd>${esc(it.usage)}</dd>` : ''}
        <dt>Status</dt><dd>${it.status === 'ready' ? 'Ready' : 'IN DEVELOPMENT — not for sale yet'}</dd>
        ${it.status === 'ready' ? `<dt>Price</dt><dd class="price">$${price()}</dd><dt>Delivery</dt><dd>${esc(it.delivery)}</dd>` : ''}</dl>
        <div class="imgs">${it.images.map(x => `<div>${esc(x)}</div>`).join('')}<div>${it.printSample ? 'photo of a real print sample' : 'real print sample photo: not yet (none exists)'}</div></div>
        ${it.status === 'ready' ? `<div class="row">${Object.entries(it.options).map(([k, m]) => `<label>${k} <select data-opt="${k}">${Object.keys(m).map(o =>
          `<option ${st.options[k] === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></label>`).join('')}</div>
        <div class="row"><button class="primary order" ${st.order === 'paying' || st.order === 'confirmed' ? 'disabled' : ''}>Order (TEST MODE)</button><span class="ordermsg" aria-live="polite"></span></div>
        <div class="flow" aria-label="Order states">${['selected', 'payment', 'order confirmed', 'shipped'].map((s, i) =>
          `<span class="${['selected', 'paying', 'confirmed', 'shipped'].indexOf(st.order === 'none' ? 'selected' : st.order) >= i ? 'on' : ''}">${s}</span>`).join('')}</div>` : ''}
      </div>` : ''}`;
    root.querySelectorAll('.card').forEach(c => c.onclick = () => select(c.dataset.id));
    root.querySelectorAll('select[data-opt]').forEach(s => s.onchange = () => { st.options[s.dataset.opt] = s.value; st.quoted = price(); onState(getState()); render(); });
    root.querySelector('.order')?.addEventListener('click', order);
  }
  function select(id, options, seenPrice, silent) {
    const it = items.find(i => i.id === id); if (!it) return;
    st.item = it; st.order = 'none';
    st.options = options || Object.fromEntries(Object.entries(it.options).map(([k, m]) => [k, Object.keys(m)[0]]));
    st.quoted = seenPrice ?? price();               // the price the visitor last saw for this item and options
    if (!silent) onState(getState()); render();
  }
  function order() {
    const msg = () => root.querySelector('.ordermsg'), p = price();
    if (st.quoted !== p) { // a price that changed since the visitor saw it is flagged before confirming
      msg().innerHTML = `<span class="warn">The price changed from $${st.quoted} to $${p}. Press Order again to continue.</span>`; st.quoted = p; return;
    }
    st.quoted = p; st.order = 'paying'; render();
    msg().textContent = 'Waiting for the payment provider… (TEST MODE — no money taken)';
    setTimeout(() => { if (!st.alive || !st.item) return; st.order = 'confirmed'; render();
      root.querySelector('.ordermsg').textContent = `TEST order confirmed by the (simulated) provider — $${p}. Not shipped: shipping is a separate state.`; }, 700);
  }
  const getState = () => ({ item: st.item?.id || null, options: { ...st.options }, seenPrice: st.quoted });
  function setState(s) { if (s?.item) select(s.item, s.options, s.seenPrice, true); else { st.item = null; render(); } }
  if (opts.state) setState(opts.state); else render();
  return { leave() {}, unmount() { st.alive = false; root.innerHTML = ''; root.classList.remove('editions-set'); },
    getState, setState, debug: () => ({ ...getState(), order: st.order, price: price(), shown: items.map(i => i.id) }) };
}
