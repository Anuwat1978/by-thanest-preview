// SERVICES & PRICING — rehearsal module (Blueprint v1.1 §4.6). Information leads; no ceremony, no new sound or gags.
// Mount contract: mount(root, opts) -> { leave(), unmount(), debug() }
//   opts.onStartBrief({ service })  hands over to Contact (the skeleton routes it)
import { SERVICES, TERMS, PAW_NOTE, PRICING_STATUS, UPDATED } from '../data/pricing.js';

export function mount(root, opts = {}) {
  const start = opts.onStartBrief || (() => {}), showRanges = opts.showRanges !== false; // public preview: ranges hidden until Aoh approves numbers
  const rangeOf = t => showRanges ? `${t.range} · ${t.time}` : 'Budget range and timing: awaiting approval';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  root.classList.add('pricing-set');
  root.innerHTML = `
  <style>
    .pricing-set{--ink:#1b1b1b;--soft:#6b665c;color:var(--ink);font:15px/1.5 system-ui,sans-serif}
    .pricing-set h2{font-size:22px;margin:0 0 4px}
    .pricing-set .status{display:inline-block;border:1.5px solid #b0461f;color:#b0461f;font-size:12px;font-weight:700;padding:2px 8px;margin:4px 0 12px}
    .pricing-set .cols{display:grid;grid-template-columns:1fr 1fr;gap:20px}
    .pricing-set section{border:2px solid var(--ink);padding:14px;background:#fbf8f1}
    .pricing-set h3{margin:0 0 8px;font-size:18px}
    .pricing-set article{border-top:1.5px solid var(--ink);padding:10px 0}
    .pricing-set .head{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;font-weight:700}
    .pricing-set dl{display:grid;grid-template-columns:max-content 1fr;gap:2px 10px;margin:6px 0 0;font-size:14px}
    .pricing-set dt{color:var(--soft)} .pricing-set dd{margin:0}
    .pricing-set button{font:inherit;font-weight:600;border:1.5px solid var(--ink);background:#f3efe6;color:var(--ink);padding:8px 14px;cursor:pointer;min-height:40px}
    .pricing-set button.primary{background:var(--ink);color:#f3efe6}
    .pricing-set .paw{margin-top:16px;border:1.5px dashed var(--ink);padding:10px 12px;display:flex;gap:12px;align-items:center;flex-wrap:wrap}
    .pricing-set .paw b{font-size:12px;color:var(--soft)}
    .pricing-set .terms{color:var(--soft);font-size:13px}
    .pricing-set .print-head{display:none}
    @media (max-width:760px){.pricing-set .cols{grid-template-columns:1fr}}
    @media print{.pricing-set button,.pricing-set .paw{display:none}.pricing-set .print-head{display:block}.pricing-set section{break-inside:avoid}}
  </style>
  <p class="print-head"><strong>By Thanest — Budget guide.</strong> Not a project quotation. Updated ${esc(UPDATED)}.</p>
  <h2>Ways to work together</h2>
  <span class="status">${showRanges ? esc(PRICING_STATUS) + ' (rehearsal)' : 'Rehearsal — public prices not approved yet'}</span>
  <div class="cols">${SERVICES.map(s => `<section aria-labelledby="sv-${s.id}"><h3 id="sv-${s.id}">${esc(s.name)}</h3>
    ${s.tiers.map(t => `<article><div class="head"><span>${esc(t.name)}</span><span>${esc(rangeOf(t))}</span></div>
      <dl><dt>Who it suits</dt><dd>${esc(t.suits)}</dd><dt>What you get</dt><dd>${esc(t.get)}</dd><dt>What moves the budget</dt><dd>${esc(t.moves)}</dd></dl></article>`).join('')}
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button class="primary" data-brief="${s.id}">START A BRIEF</button>
      <span class="terms" style="align-self:center">See it working: the ${esc(s.proof)} proof.</span></div></section>`).join('')}</div>
  <p class="terms">${esc(TERMS)} Schedules start from the agreed start date with all inputs received.</p>
  <div class="paw" role="note"><b>PAW (stand-in)</b><span>${esc(PAW_NOTE)}</span><button data-brief="custom">Talk to Thanest</button>
    <button class="print">Print budget guide</button></div>`;
  root.querySelectorAll('[data-brief]').forEach(b => b.onclick = () => start({ service: b.dataset.brief }));
  root.querySelector('.print').onclick = () => window.print();
  return { leave() {}, unmount() { root.innerHTML = ''; root.classList.remove('pricing-set'); }, debug: () => ({ services: SERVICES.length }) };
}
