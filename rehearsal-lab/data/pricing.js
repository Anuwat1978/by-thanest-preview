// Pricing data in one file, so numbers change without a redesign (Blueprint §4.6).
// REHEARSAL VALUES ONLY: Blueprint Appendix A working hypothesis (NON-LOCKING). Final public prices are Aoh's pre-launch decision.
export const PRICING_STATUS = 'WORKING HYPOTHESIS — not final public prices';
export const UPDATED = '2026-10-03';
export const SERVICES = [
  { id: 'interactive', name: 'Interactive / Web App', proof: 'Interactive', tiers: [
    { name: 'Focused interactive experience', range: '$15–25k', time: '4–7 weeks',
      suits: 'One idea that has to be felt, not read: a launch moment, a product demo, a playable story.',
      get: 'Concept, art direction, performance and the shipped experience on web and mobile.',
      moves: 'Number of states and characters; live data; how much new art is drawn.' },
    { name: 'Product or campaign launch experience', range: '$30–60k', time: '8–12 weeks',
      suits: 'A launch that needs a world, several scenes and a clear path to buy or sign up.',
      get: 'Everything above, plus multiple scenes, content system and launch support.',
      moves: 'Scene count, integrations, localisation, review rounds.' },
    { name: 'Application / live data / larger system', range: '$60–120k+', time: 'scoped after the brief',
      suits: 'A living product: real application state, live inputs, long-term use.',
      get: 'A scoped plan first, then the build in phases.',
      moves: 'Data sources, accounts, back-end, maintenance.' },
  ] },
  { id: 'film', name: 'Film / AI Film', proof: 'Film', tiers: [
    { name: 'Hero film, 15–30 s', range: '$10–18k', time: '3–5 weeks',
      suits: 'One film that carries the idea: a launch, a brand moment, a product hero.',
      get: 'Script and boards, authored performance, AI-assisted production under Aoh’s decisions, final master.',
      moves: 'Length, number of characters and set-ups, sound and music.' },
    { name: 'Campaign film, 30–60 s + agreed cutdowns', range: '$20–40k', time: '5–8 weeks',
      suits: 'A campaign that needs a main film and versions for each channel.',
      get: 'Everything above plus the agreed cutdowns and formats.',
      moves: 'Number of cutdowns, formats, revision rounds.' },
    { name: 'Series / larger / combined', range: 'scoped after the brief', time: 'scoped after the brief',
      suits: 'Several films, or film combined with an interactive experience.',
      get: 'A scoped plan, then production in phases.',
      moves: 'Everything above, multiplied; shared assets lower the cost per piece.' },
  ] },
];
export const TERMS = 'Projects are paid in agreed stages. Any significant third-party costs are discussed before approval.';
export const PAW_NOTE = 'Need something custom or unusual? Talk to Thanest here.';
