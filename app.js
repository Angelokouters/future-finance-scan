// Finance Growth & Control Quickscan — applicatie (vanilla JS, geen build nodig).
import { QUESTIONS, TOTAL_QUESTIONS } from './questions.js';
import { DISCLAIMER } from './content.js';
import { flowFor, computeResult } from './scoring.js';
import { track } from './analytics.js';
import { submitLead, requestReview, sendResultEmail } from './api.js';

const STORAGE_KEY = 'fgc-quickscan-v1';
const FREEMAIL = ['gmail.com', 'hotmail.com', 'hotmail.nl', 'outlook.com', 'live.nl', 'live.com', 'yahoo.com', 'icloud.com', 'ziggo.nl', 'kpnmail.nl', 'planet.nl', 'xs4all.nl'];
const ROLES = ['CFO', 'Finance Director', 'Head of Finance', 'Group Controller', 'Finance Manager', 'Andere rol'];
const EMPTY_LEAD = { voornaam: '', email: '', bedrijf: '', functie: '' };

// Voorbeeldantwoorden (brief hoofdstuk 9). Uitkomst: 54/100. Alleen voor ?demo=…
const DEMO_ANSWERS = { q1: 2, q2: 0, q3: 3, q3a: 3, q4: 2, q5: 2, q5a: 1, q6: 4, q7: 1, q8: 2, q9: 1, q10: 2, q11: 7, q12: 1 };
const DEMO_LEAD = { voornaam: 'Sanne', email: 's.devries@voorbeeldgroep.nl', bedrijf: 'Voorbeeld Groep', functie: 'Finance Director' };

const app = document.getElementById('app');
let timers = [];

let state = {
  screen: 'landing',   // landing | intro | flow | lead | loading | result | email
  cur: null,           // huidige vraag-id of 'pause'
  answers: {},
  lead: { ...EMPTY_LEAD },
  errors: {},
  loadStep: 0,
  modal: false,
  booking: { day: null, time: null, tel: '' },
  bookError: null,
  booked: false,
  copied: false,
  stored: null,
  shared: false        // uitslag geopend via gedeelde link
};

/* ---------- helpers ---------- */

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const ICON = {
  arrowRight: (c = 'currentColor') => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  arrowLeft: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>`,
  check: (c = '#FFFFFF', size = 12) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`,
  close: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>`
};

function setState(patch, opts = {}) {
  state = { ...state, ...patch };
  persist();
  render(opts);
}

function persist() {
  if (state.shared) return;
  try {
    if (state.screen === 'flow' || state.screen === 'lead') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers: state.answers, cur: state.cur }));
    }
  } catch (e) { /* opslag niet beschikbaar: scan werkt zonder */ }
}

function clearStored() { try { localStorage.removeItem(STORAGE_KEY); } catch (e) {} }
function clearTimers() { timers.forEach(clearTimeout); timers = []; }
function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

function go(patch) {
  setState(patch, { focus: true });
  window.scrollTo(0, 0);
}

/* ---------- navigatie ---------- */

function next() {
  const flow = flowFor(state.answers);
  const i = flow.indexOf(state.cur);
  if (i < flow.length - 1) {
    const id = flow[i + 1];
    if (QUESTIONS[id]?.sub) track('conditional_question_viewed', { question: id });
    go({ cur: id });
  } else {
    track('lead_form_viewed');
    go({ screen: 'lead', errors: {} });
  }
}

function prev() {
  if (state.screen === 'lead') return go({ screen: 'flow', cur: 'q12' });
  const flow = flowFor(state.answers);
  const i = flow.indexOf(state.cur);
  if (i > 0) go({ cur: flow[i - 1] });
  else go({ screen: 'intro' });
}

function choose(qid, index) {
  clearTimers();
  const answers = { ...state.answers, [qid]: index };
  track('question_answered', { question: qid, answer: index });
  setState({ answers });
  later(next, 260); // korte pauze zodat de keuze zichtbaar is
}

/* ---------- formulier ---------- */

function validateLead(l) {
  const e = {};
  const email = l.email.trim().toLowerCase();
  if (!l.voornaam.trim()) e.voornaam = 'Vul uw voornaam in.';
  if (!email) e.email = 'Vul uw zakelijke e-mailadres in.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) e.email = 'Dit e-mailadres lijkt niet volledig. Controleer de schrijfwijze.';
  else if (FREEMAIL.includes(email.split('@')[1])) e.email = 'Gebruik uw zakelijke e-mailadres.';
  if (!l.bedrijf.trim()) e.bedrijf = 'Vul de bedrijfsnaam in.';
  if (!l.functie) e.functie = 'Kies uw functie of rol.';
  return e;
}

function readLeadFromForm() {
  const f = app.querySelector('#lead-form');
  if (!f) return state.lead;
  return {
    voornaam: f.voornaam.value,
    email: f.email.value,
    bedrijf: f.bedrijf.value,
    functie: f.functie.value
  };
}

async function onSubmitLead() {
  const lead = readLeadFromForm();
  const errors = validateLead(lead);
  if (Object.keys(errors).length) {
    setState({ lead, errors });
    const first = app.querySelector('[aria-invalid="true"]');
    if (first) first.focus();
    return;
  }
  const result = computeResult(state.answers);
  go({ screen: 'loading', loadStep: 0, lead, errors: {} });
  // Antwoorden + lead naar backend; backend berekent de interne opportunityscore.
  submitLead({ lead, answers: state.answers, publicScore: result.total }).catch(() => {});
  track('lead_submitted');
  later(() => setState({ loadStep: 1 }), 900);
  later(() => setState({ loadStep: 2 }), 1800);
  later(() => {
    clearStored();
    go({ screen: 'result' });
    track('result_viewed', { band: result.band, lowest: result.bottleneck?.key });
  }, 2700);
}

function onConfirmBooking() {
  const tel = app.querySelector('#f-tel')?.value ?? state.booking.tel;
  const booking = { ...state.booking, tel };
  const digits = tel.replace(/[^0-9]/g, '');
  if (booking.day == null || !booking.time) return setState({ booking, bookError: { msg: 'Kies een dag en een tijd.' } });
  if (digits.length < 10) {
    setState({ booking, bookError: { msg: 'Vul een geldig telefoonnummer in.', tel: true } });
    app.querySelector('#f-tel')?.focus();
    return;
  }
  requestReview({ lead: state.lead, slot: { day: reviewDays()[booking.day].iso, time: booking.time }, tel }).catch(() => {});
  track('review_booked');
  setState({ booking, booked: true, bookError: null });
}

/* ---------- afspraakdagen: eerstvolgende drie werkdagen ---------- */

const TIMES = ['9.30', '11.00', '14.00', '16.00'];
function reviewDays() {
  const out = [];
  const d = new Date();
  while (out.length < 3) {
    d.setDate(d.getDate() + 1);
    const wd = d.getDay();
    if (wd === 0 || wd === 6) continue;
    out.push({
      iso: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', ''),
      full: d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })
    });
  }
  return out;
}

/* ---------- deelbare link (bevat alleen antwoorden, geen persoonsgegevens) ---------- */

function shareUrl() {
  const enc = btoa(JSON.stringify(state.answers));
  return `${location.origin}${location.pathname}#r=${encodeURIComponent(enc)}`;
}

function readSharedAnswers() {
  const m = location.hash.match(/^#r=(.+)$/);
  if (!m) return null;
  try {
    const a = JSON.parse(atob(decodeURIComponent(m[1])));
    // Alleen geldige vraag-id's en indexen accepteren
    const clean = {};
    for (const [k, v] of Object.entries(a)) {
      if (QUESTIONS[k] && Number.isInteger(v) && v >= 0 && v < QUESTIONS[k].options.length) clean[k] = v;
    }
    return Object.keys(clean).length ? clean : null;
  } catch (e) { return null; }
}

/* ---------- views ---------- */

function header() {
  const inFlow = state.screen === 'flow' || state.screen === 'lead';
  let nr = 0, label = '';
  if (state.screen === 'flow') {
    if (state.cur === 'pause') { nr = 6; label = 'Halverwege'; }
    else { nr = QUESTIONS[state.cur].nr; label = `Vraag ${nr} van ${TOTAL_QUESTIONS}`; }
  } else if (state.screen === 'lead') { nr = TOTAL_QUESTIONS; label = 'Laatste stap'; }
  const pct = Math.round((nr / TOTAL_QUESTIONS) * 100);
  return `
  <header class="header">
    <div class="header__inner">
      <div class="brand">
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="14" width="5" height="8" rx="1" fill="#000"/><rect x="9.5" y="9" width="5" height="13" rx="1" fill="#000"/><rect x="17" y="3" width="5" height="19" rx="1" fill="var(--accent)"/></svg>
        <span>Finance Growth &amp; Control Quickscan</span>
      </div>
      ${inFlow ? `<span class="progress-label">${label}</span>` : ''}
    </div>
    ${inFlow ? `<div class="progress" role="progressbar" aria-label="Voortgang" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><div class="progress__bar" style="width:${pct}%"></div></div>` : ''}
  </header>`;
}

function viewLanding() {
  const item = (n, t, d) => `<div class="numbered"><span class="numbered__nr">${n}</span><div><p class="numbered__title">${t}</p><p class="numbered__text">${d}</p></div></div>`;
  return `
  <section class="screen screen--wide">
    <div class="landing">
      <div class="landing__main">
        <p class="kicker">Voor CFO's en finance leaders</p>
        <h1 class="h1" tabindex="-1" data-focus>Wat remt groei en grip in uw Finance-organisatie?</h1>
        <p class="lead">Ontdek binnen 4 minuten welke financiële processen groei, grip en betrouwbare besluitvorming mogelijk in de weg staan.</p>
        <div class="chips">
          <span class="chip">Ongeveer 4 minuten</span>
          <span class="chip">12 vragen</span>
          <span class="chip">Direct uw uitslag</span>
        </div>
        <div class="actions">
          <button type="button" class="btn btn--primary" data-action="start" style="flex:0 1 auto">Start de quickscan ${ICON.arrowRight('#FFFFFF')}</button>
          ${state.stored ? `<button type="button" class="btn btn--secondary" data-action="resume">Verder waar u was</button>` : ''}
        </div>
        <p class="small" style="font-size:14px;line-height:20px">Geen verkoopgesprek nodig. U ziet uw uitslag direct na de laatste vraag.</p>
      </div>
      <aside class="landing__aside">
        <p class="h3">Wat u krijgt</p>
        ${item(1, 'Uw score op vijf dimensies', 'Afsluiting en rapportage, betrouwbaarheid van cijfers, efficiency, continuïteit en schaalbaarheid.')}
        ${item(2, 'Uw eerste aandachtspunt', 'Het onderdeel dat snelheid, betrouwbaarheid of groei nu het meest beperkt.')}
        ${item(3, 'Een concrete eerste stap', 'Een processtap die u direct kunt zetten. Zonder productadvies.')}
        <p class="small divider-note">${DISCLAIMER}</p>
      </aside>
    </div>
  </section>`;
}

function viewIntro() {
  const info = (t, d) => `<div class="info">${ICON.check('#000', 22)}<div><p class="info__title">${t}</p><p class="info__text">${d}</p></div></div>`;
  return `
  <section class="screen screen--narrow">
    <h2 class="h2" tabindex="-1" data-focus>Voordat u begint</h2>
    <div style="display:flex;flex-direction:column;gap:12px">
      ${info('Er is geen goed of fout antwoord', 'Kies wat de huidige situatie het best beschrijft, niet de gewenste situatie.')}
      ${info('Eén vraag per scherm', 'Na uw keuze gaat u automatisch door. Met Vorige past u een antwoord aan.')}
      ${info('Anoniem tot aan de uitslag', 'Uw antwoorden blijven op dit apparaat. U kunt stoppen en later verdergaan.')}
    </div>
    <div class="actions">
      <button type="button" class="btn btn--primary" data-action="begin">Begin met vraag 1</button>
      <button type="button" class="btn btn--link" data-action="landing">Terug</button>
    </div>
  </section>`;
}

function viewQuestion() {
  const id = state.cur;
  const q = QUESTIONS[id];
  const selected = state.answers[id];
  const kicker = q.sub ? `Vraag ${q.nr} · aanvulling` : `Vraag ${q.nr} van ${TOTAL_QUESTIONS}`;
  return `
  <section class="screen screen--question">
    <p class="kicker">${kicker}</p>
    <h2 class="h2" id="vraagtitel" tabindex="-1" data-focus>${esc(q.title)}</h2>
    ${q.help ? `<p class="text muted" style="margin-top:-8px;font-size:15px;line-height:22px">${esc(q.help)}</p>` : ''}
    <div class="options" role="group" aria-labelledby="vraagtitel">
      ${q.options.map((o, i) => `
        <button type="button" class="option" aria-pressed="${selected === i}" data-action="choose" data-q="${id}" data-i="${i}">
          <span class="option__dot">${selected === i ? ICON.check() : ''}</span><span>${esc(o)}</span>
        </button>`).join('')}
    </div>
    <div class="nav">
      <button type="button" class="btn btn--back" data-action="prev">${ICON.arrowLeft} Vorige</button>
      ${selected != null ? `<button type="button" class="btn btn--secondary" style="min-height:44px" data-action="next">Volgende ${ICON.arrowRight()}</button>` : ''}
    </div>
  </section>`;
}

function viewPause() {
  return `
  <section class="screen screen--narrow">
    <svg width="64" height="64" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="16" fill="none" stroke="#D6D3CE" stroke-width="5"/><path d="M20 4a16 16 0 010 32" fill="none" stroke="#000" stroke-width="5"/></svg>
    <h2 class="h2" tabindex="-1" data-focus>U bent halverwege</h2>
    <p class="lead" style="font-size:17px;line-height:26px">De eerste vragen gingen over afsluiting, rapportage en dagelijks werk. De laatste zes gaan over continuïteit, groei en wat dit betekent voor de organisatie. Nog ongeveer 2 minuten.</p>
    <div class="info" style="flex-direction:column;gap:8px">
      <p style="font-size:14px;line-height:20px;font-weight:700">Juist deze vragen maken uw uitslag persoonlijk</p>
      <p style="font-size:14px;line-height:20px" class="muted">Op basis daarvan koppelen we uw grootste knelpunt aan zakelijke impact en een concrete eerste stap.</p>
    </div>
    <div class="actions">
      <button type="button" class="btn btn--primary" data-action="next">Verder met vraag 7</button>
      <button type="button" class="btn btn--link" data-action="prev">Vorige vraag</button>
    </div>
  </section>`;
}

function viewLead() {
  const l = state.lead, e = state.errors;
  const field = (name, label, type, auto) => `
    <div class="field">
      <label for="f-${name}">${label}</label>
      <input id="f-${name}" name="${name}" type="${type}" autocomplete="${auto}" value="${esc(l[name])}" aria-invalid="${!!e[name]}" ${e[name] ? `aria-describedby="e-${name}"` : ''}>
      ${e[name] ? `<span class="field__error" id="e-${name}">${esc(e[name])}</span>` : ''}
    </div>`;
  return `
  <section class="screen screen--narrow" style="max-width:560px">
    <div style="display:flex;flex-direction:column;gap:10px">
      <p class="kicker">Laatste stap</p>
      <h2 class="h2" tabindex="-1" data-focus>Uw uitslag staat klaar</h2>
      <p class="text muted">Vul vier gegevens in om uw persoonlijke uitslag te bekijken. U ontvangt ook een samenvatting per e-mail.</p>
    </div>
    ${Object.keys(e).length ? `<div class="alert" role="alert">Controleer de gemarkeerde velden.</div>` : ''}
    <form id="lead-form" novalidate style="display:flex;flex-direction:column;gap:16px">
      ${field('voornaam', 'Voornaam', 'text', 'given-name')}
      ${field('email', 'Zakelijk e-mailadres', 'email', 'email')}
      ${field('bedrijf', 'Bedrijfsnaam', 'text', 'organization')}
      <div class="field">
        <label for="f-functie">Functie of rol</label>
        <select id="f-functie" name="functie" aria-invalid="${!!e.functie}" ${e.functie ? 'aria-describedby="e-functie"' : ''}>
          <option value="">Maak een keuze</option>
          ${ROLES.map((r) => `<option value="${esc(r)}" ${l.functie === r ? 'selected' : ''}>${esc(r)}</option>`).join('')}
        </select>
        ${e.functie ? `<span class="field__error" id="e-functie">${esc(e.functie)}</span>` : ''}
      </div>
      <div class="notice">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/></svg>
        <p>We gebruiken uw gegevens om u uw persoonlijke uitslag te sturen. Contact volgt alleen als u daar zelf voor kiest. U kunt zich altijd afmelden.</p>
      </div>
      <div class="actions">
        <button type="submit" class="btn btn--primary">Bekijk mijn uitslag</button>
        <button type="button" class="btn btn--link" data-action="prev">Vorige vraag</button>
      </div>
    </form>
  </section>`;
}

function viewLoading() {
  const labels = ['Antwoorden analyseren', 'Prioriteiten bepalen', 'Advies samenstellen'];
  return `
  <section class="screen screen--narrow" style="max-width:480px;padding-top:24px">
    <h2 class="h2" tabindex="-1" data-focus>Uw uitslag wordt samengesteld</h2>
    <div class="steps" role="status">
      ${labels.map((l, i) => {
        const cls = i < state.loadStep ? 'step--done' : i === state.loadStep ? 'step--active' : '';
        return `<div class="step ${cls}"><span class="step__icon">${i < state.loadStep ? ICON.check('#FFFFFF', 14) : ''}</span><span>${l}</span></div>`;
      }).join('')}
    </div>
  </section>`;
}

function viewResult(r) {
  const circumference = 326.73;
  const dash = ((r.total / 100) * circumference).toFixed(1);
  const company = state.lead.bedrijf ? ` · ${esc(state.lead.bedrijf)}` : '';
  return `
  <section class="screen screen--wide" style="gap:24px">
    <div style="display:flex;flex-direction:column;gap:6px">
      <p class="kicker">Uw persoonlijke uitslag</p>
      <h1 class="h2" tabindex="-1" data-focus>Finance Growth &amp; Control Score${company}</h1>
    </div>

    <div class="row">
      <div class="score-panel">
        <div class="score-head">
          <div class="ring">
            <svg width="132" height="132" viewBox="0 0 132 132" role="img" aria-label="Score ${r.total} van 100">
              <circle cx="66" cy="66" r="52" fill="none" stroke="#D6D3CE" stroke-width="12"/>
              <circle cx="66" cy="66" r="52" fill="none" stroke="#000" stroke-width="12" stroke-linecap="round" stroke-dasharray="${dash} ${circumference}" transform="rotate(-90 66 66)"/>
            </svg>
            <div class="ring__value" aria-hidden="true"><span class="ring__number">${r.total}</span><span class="small">van 100</span></div>
          </div>
          <div style="flex:1 1 160px;min-width:0;display:flex;flex-direction:column;gap:6px">
            <span class="small">Profiel · score ${r.band}</span>
            <span class="profile-name">${esc(r.profile)}</span>
          </div>
        </div>
        <p class="text">${esc(r.message)}</p>
        <p class="small">${DISCLAIMER}</p>
      </div>

      <div class="dims">
        <h2 class="h3">Score per dimensie</h2>
        ${r.dimensions.map((d) => `
          <div class="dim ${d.isLowest ? 'dim--lowest' : ''}">
            <div class="dim__head"><div><b>${esc(d.name)}</b><span class="muted" style="font-size:13px"> · ${esc(d.nl)}</span></div><b>${d.score}</b></div>
            <div class="dim__track"><div class="dim__bar" style="width:${Math.max(d.score, 2)}%"></div></div>
            ${d.isLowest ? '<span class="tag">Eerste aandachtspunt</span>' : ''}
          </div>`).join('')}
      </div>
    </div>

    <div class="cards">
      ${r.bottleneck ? `
      <article class="card">
        <p class="kicker">Uw grootste knelpunt</p>
        <h3 class="h3">${esc(r.bottleneck.title)}</h3>
        <p class="card__echo">${esc(r.bottleneck.echo)}</p>
        <p class="card__text">${esc(r.bottleneck.insight)}</p>
      </article>` : ''}
      <article class="card">
        <p class="kicker">Zakelijke impact</p>
        <h3 class="h3">${esc(r.impact.title)}</h3>
        <p class="card__text">${esc(r.impact.text)}</p>
      </article>
      <article class="card">
        <p class="kicker">Relevante ontwikkeling</p>
        <h3 class="h3">${esc(r.trigger.title)}</h3>
        <p class="card__text">${esc(r.trigger.text)}</p>
        ${r.priority ? `<div class="card__sub"><p class="small">Uw persoonlijke prioriteit</p><p style="font-size:15px;line-height:22px;font-weight:700">${esc(r.priority)}</p></div>` : ''}
      </article>
    </div>

    ${r.firstStep ? `
    <article class="first-step">
      <div class="first-step__icon">${ICON.arrowRight('#000')}</div>
      <div class="first-step__body">
        <p class="kicker">Aanbevolen eerste stap</p>
        <p class="first-step__text">${esc(r.firstStep)}</p>
      </div>
    </article>` : ''}

    <div class="cta">
      <div class="cta__text">
        <h2 class="h3">Laat uw uitslag in 20 minuten duiden</h2>
        <p class="card__text">${esc(r.cta)} Kosteloos, onafhankelijk en zonder productdemo.</p>
      </div>
      <div class="cta__actions">
        <button type="button" class="btn btn--primary" data-action="open-booking">Plan een persoonlijke score-review</button>
        ${state.lead.email ? `<button type="button" class="btn btn--secondary" data-action="mail">Mail mij de uitslag, zonder gesprek</button>` : ''}
        <button type="button" class="btn btn--link" data-action="copy">${state.copied ? 'Link gekopieerd' : 'Kopieer link naar uitslag'}</button>
      </div>
    </div>

    <div style="display:flex;justify-content:center">
      <button type="button" class="btn btn--link" data-action="restart" style="font-size:14px">Scan opnieuw invullen</button>
    </div>
  </section>`;
}

function viewEmail(r) {
  const l = state.lead;
  return `
  <section class="screen screen--question" style="gap:20px">
    <div class="status" role="status">${ICON.check('#000', 20)}<p>Uw uitslag is verstuurd naar ${esc(l.email)}. Hieronder ziet u de e-mail.</p></div>
    <div class="mail">
      <div class="mail__head">
        <div><span class="muted">Van: </span>Finance Growth &amp; Control Quickscan</div>
        <div><span class="muted">Aan: </span>${esc(l.email)}</div>
        <div class="mail__subject">Uw Finance Growth &amp; Control Score: ${r.total}/100</div>
      </div>
      <div class="mail__body">
        <p>Beste ${esc(l.voornaam)},</p>
        <p>Bedankt voor het invullen van de quickscan. Hieronder vindt u de samenvatting van uw uitslag.</p>
        <div class="mail__score"><span style="font-size:36px;line-height:40px;font-weight:800">${r.total}</span><div><p class="small">van 100 · profiel</p><p style="font-weight:700">${esc(r.profile)}</p></div></div>
        ${r.bottleneck ? `<div><p style="font-weight:700">Uw grootste knelpunt</p><p>${esc(r.bottleneck.title)}. ${esc(r.bottleneck.echo)}</p></div>` : ''}
        <div><p style="font-weight:700">Zakelijke impact</p><p>${esc(r.impact.text)}</p></div>
        <div><p style="font-weight:700">Aanbevolen eerste stap</p><p>${esc(r.firstStep)}</p></div>
        <button type="button" class="btn btn--primary" style="align-self:flex-start;min-height:48px" data-action="open-booking">Plan een persoonlijke score-review</button>
        <p class="mail__foot">U ontvangt deze e-mail omdat u de Finance Growth &amp; Control Quickscan heeft ingevuld. De score is indicatief en geen audit of officieel advies. Afmelden kan altijd.</p>
      </div>
    </div>
    <button type="button" class="btn btn--back" style="align-self:flex-start" data-action="back-result">${ICON.arrowLeft} Terug naar uitslag</button>
  </section>`;
}

function viewModal() {
  const b = state.booking, be = state.bookError || {};
  const days = reviewDays();
  const title = state.booked ? 'Uw score-review staat gepland' : 'Plan een persoonlijke score-review';
  const body = state.booked ? `
    <div class="notice">${ICON.check('#000', 22)}<p style="font-size:15px;line-height:22px">Op ${esc(days[b.day].full)} om ${esc(b.time)} uur. U ontvangt een agenda-uitnodiging op ${esc(state.lead.email)}.</p></div>
    <button type="button" class="btn btn--secondary" data-action="close-booking">Sluiten</button>` : `
    <p class="small" style="font-weight:700">20 minuten · online · kosteloos</p>
    <p class="card__text">Een finance-specialist bespreekt uw uitslag met u en helpt bepalen welke twee verbeterpunten de meeste businessimpact hebben. Geen productdemo.</p>
    <div style="display:flex;flex-direction:column;gap:8px">
      <p style="margin:0;font-size:14px;font-weight:700" id="lbl-dag">Kies een dag</p>
      <div class="pills" role="group" aria-labelledby="lbl-dag">${days.map((d, i) => `<button type="button" class="pill" aria-pressed="${b.day === i}" data-action="day" data-i="${i}">${esc(d.label)}</button>`).join('')}</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px">
      <p style="margin:0;font-size:14px;font-weight:700" id="lbl-tijd">Kies een tijd</p>
      <div class="pills" role="group" aria-labelledby="lbl-tijd">${TIMES.map((t) => `<button type="button" class="pill" aria-pressed="${b.time === t}" data-action="time" data-t="${t}">${t} uur</button>`).join('')}</div>
    </div>
    <div class="field">
      <label for="f-tel">Telefoonnummer</label>
      <input id="f-tel" type="tel" autocomplete="tel" value="${esc(b.tel)}" aria-invalid="${!!be.tel}" aria-describedby="h-tel">
      <span class="field__hint" id="h-tel">Alleen voor dit gesprek. We bellen u op het gekozen moment.</span>
    </div>
    ${be.msg ? `<p class="field__error" role="alert" style="margin:0">${esc(be.msg)}</p>` : ''}
    <button type="button" class="btn btn--primary" data-action="confirm-booking">Bevestig score-review</button>`;
  return `
  <div class="overlay" data-action="overlay">
    <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="modaltitel">
      <div class="dialog__head">
        <h2 class="h3" id="modaltitel" style="font-size:22px;line-height:28px;font-weight:800" tabindex="-1" data-modal-focus>${title}</h2>
        <button type="button" class="icon-btn" aria-label="Sluiten" data-action="close-booking">${ICON.close}</button>
      </div>
      ${body}
    </div>
  </div>`;
}

/* ---------- render ---------- */

function render(opts = {}) {
  // Waarden in open invoervelden bewaren bij her-renderen
  const lf = app.querySelector('#lead-form');
  if (lf && state.screen === 'lead' && !opts.focus) state.lead = readLeadFromForm();
  const tel = app.querySelector('#f-tel');
  if (tel) state.booking = { ...state.booking, tel: tel.value };

  let body = '';
  const needsResult = ['result', 'email'].includes(state.screen) || state.modal;
  const r = needsResult ? computeResult(state.answers) : null;
  switch (state.screen) {
    case 'landing': body = viewLanding(); break;
    case 'intro': body = viewIntro(); break;
    case 'flow': body = state.cur === 'pause' ? viewPause() : viewQuestion(); break;
    case 'lead': body = viewLead(); break;
    case 'loading': body = viewLoading(); break;
    case 'result': body = viewResult(r); break;
    case 'email': body = viewEmail(r); break;
  }
  app.innerHTML = `
  <div class="page">
    ${header()}
    <main class="main" id="main">${body}</main>
    <footer class="footer"><p>Finance Growth &amp; Control Quickscan · Indicatieve score, geen audit of officieel advies · <a href="#privacy" style="color:inherit">Privacy</a></p></footer>
    ${state.modal ? viewModal() : ''}
  </div>`;

  if (state.modal) app.querySelector('[data-modal-focus]')?.focus();
  else if (opts.focus) app.querySelector('[data-focus]')?.focus();
}

/* ---------- events ---------- */

app.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;
  if (a === 'overlay' && ev.target !== el) return; // alleen klik op achtergrond sluit
  switch (a) {
    case 'start': track('quickscan_started'); go({ screen: 'intro' }); break;
    case 'landing': go({ screen: 'landing' }); break;
    case 'begin': go({ screen: 'flow', cur: 'q1' }); break;
    case 'resume': go({ screen: 'flow', answers: state.stored.answers || {}, cur: state.stored.cur || 'q1' }); break;
    case 'choose': choose(el.dataset.q, Number(el.dataset.i)); break;
    case 'next': clearTimers(); next(); break;
    case 'prev': clearTimers(); prev(); break;
    case 'open-booking': track('review_cta_clicked'); setState({ modal: true, booked: false, bookError: null }); break;
    case 'close-booking': case 'overlay': setState({ modal: false }); break;
    case 'day': setState({ booking: { ...state.booking, day: Number(el.dataset.i) }, bookError: null }); break;
    case 'time': setState({ booking: { ...state.booking, time: el.dataset.t }, bookError: null }); break;
    case 'confirm-booking': onConfirmBooking(); break;
    case 'mail':
      sendResultEmail({ lead: state.lead, answers: state.answers }).catch(() => {});
      track('result_emailed');
      go({ screen: 'email' });
      break;
    case 'back-result': go({ screen: 'result' }); break;
    case 'copy':
      try { navigator.clipboard.writeText(shareUrl()); } catch (e) {}
      setState({ copied: true });
      break;
    case 'restart':
      clearStored(); clearTimers();
      history.replaceState(null, '', location.pathname);
      go({ screen: 'landing', cur: null, answers: {}, lead: { ...EMPTY_LEAD }, errors: {}, modal: false, booked: false, copied: false, stored: null, shared: false });
      break;
  }
});

app.addEventListener('submit', (ev) => {
  if (ev.target.id === 'lead-form') { ev.preventDefault(); onSubmitLead(); }
});

document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape' && state.modal) setState({ modal: false });
});

// Afhaken meten: laatste vraag bij verlaten van de pagina
window.addEventListener('pagehide', () => {
  if (state.screen === 'flow' || state.screen === 'lead') track('quickscan_abandoned', { last: state.cur || state.screen });
});

/* ---------- start ---------- */

function init() {
  // Review-modus: ?demo=landing|intro|q1..q12|q3a|q5a|tussen|gegevens|laden|uitslag|afspraak|email
  const demo = new URLSearchParams(location.search).get('demo');
  if (demo) {
    const s = { lead: { ...DEMO_LEAD }, answers: { ...DEMO_ANSWERS }, shared: true };
    const map = {
      landing: { screen: 'landing', answers: {} },
      intro: { screen: 'intro', answers: {} },
      tussen: { screen: 'flow', cur: 'pause' },
      gegevens: { screen: 'lead', lead: { ...EMPTY_LEAD } },
      laden: { screen: 'loading', loadStep: 1 },
      uitslag: { screen: 'result' },
      afspraak: { screen: 'result', modal: true },
      email: { screen: 'email' }
    };
    if (QUESTIONS[demo]) {
      const flow = ['q1', 'q2', 'q3', 'q3a', 'q4', 'q5', 'q5a', 'q6', 'q7', 'q8', 'q9', 'q10', 'q11', 'q12'];
      const before = flow.slice(0, flow.indexOf(demo));
      const answers = {};
      before.forEach((k) => { answers[k] = DEMO_ANSWERS[k]; });
      Object.assign(state, s, { screen: 'flow', cur: demo, answers, lead: { ...EMPTY_LEAD } });
    } else {
      Object.assign(state, s, map[demo] || map.uitslag);
    }
    render();
    return;
  }

  // Gedeelde uitslag-link
  const shared = readSharedAnswers();
  if (shared) {
    Object.assign(state, { screen: 'result', answers: shared, shared: true });
    render();
    return;
  }

  // Tussentijds opgeslagen antwoorden
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const st = raw ? JSON.parse(raw) : null;
    if (st && st.answers && Object.keys(st.answers).length) state.stored = st;
  } catch (e) {}

  track('quickscan_viewed');
  render();
}

init();
