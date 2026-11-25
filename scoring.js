// Scorelogica en advieslogica. Pure functies zonder DOM, zodat ze los te testen
// zijn (npm test) en later ongewijzigd naar een backend kunnen.

import { QUESTIONS, ORDER } from './questions.js';
import {
  DIMENSIONS,
  Q9_TO_DIMENSION,
  PROFILES,
  INSIGHT,
  ECHO,
  ECHO_QUESTION,
  IMPACT,
  DECISION,
  FIRST_STEP
} from './content.js';

/** Schermvolgorde voor de huidige antwoorden (conditionele vragen in of uit). */
export function flowFor(answers) {
  return ORDER.filter((id) => {
    const q = QUESTIONS[id];
    return !q || !q.showIf || q.showIf(answers);
  });
}

/** Score 0-100 per dimensie: ((gemiddelde - 1) / 4) * 100. Overgeslagen vragen tellen niet mee. */
export function dimensionScores(answers) {
  const flow = flowFor(answers);
  const result = [];
  for (const d of DIMENSIONS) {
    const values = d.questions
      .filter((id) => flow.includes(id) && answers[id] != null && QUESTIONS[id].v)
      .map((id) => QUESTIONS[id].v[answers[id]]);
    if (!values.length) continue;
    const avg = values.reduce((s, x) => s + x, 0) / values.length;
    const score = Math.max(0, Math.min(100, ((avg - 1) / 4) * 100));
    result.push({ key: d.key, name: d.name, nl: d.nl, weight: d.weight, raw: score, score: Math.round(score) });
  }
  return result;
}

/** Totale score = gewogen gemiddelde van de beschikbare dimensies, afgerond. */
export function totalScore(dims) {
  const wsum = dims.reduce((s, d) => s + d.weight, 0);
  if (!wsum) return 0;
  return Math.round(dims.reduce((s, d) => s + d.raw * d.weight, 0) / wsum);
}

/** Laagste dimensie; bij gelijke stand wint de dimensie die bij vraag 9 hoort. */
export function lowestDimension(dims, answers) {
  const tie = answers.q9 != null ? Q9_TO_DIMENSION[answers.q9] : null;
  let low = null;
  for (const d of dims) {
    if (!low || d.raw < low.raw - 0.01) low = d;
    else if (Math.abs(d.raw - low.raw) <= 0.01 && d.key === tie) low = d;
  }
  return low;
}

export function profileFor(total) {
  let p = PROFILES[0];
  for (const x of PROFILES) if (total >= x.min) p = x;
  return p;
}

/** Volledige persoonlijke uitslag op basis van de antwoorden. */
export function computeResult(answers) {
  const a = answers || {};
  const dims = dimensionScores(a);
  const total = totalScore(dims);
  const low = lowestDimension(dims, a);
  const profile = profileFor(total);

  const echoIdx = low ? a[ECHO_QUESTION[low.key]] : null;
  const impact = a.q9 != null ? IMPACT[a.q9] : IMPACT[6];
  let impactText = impact[1];
  if (a.q10 != null && a.q10 < 6) impactText += ` Op basis van uw antwoorden raakt dit vooral ${DECISION[a.q10]}.`;

  let trigger;
  if (a.q11 != null && a.q11 < 7) {
    trigger = {
      title: QUESTIONS.q11.options[a.q11],
      text: 'U noemt dit als belangrijkste aanleiding om processen of systemen opnieuw te bekijken. Dat maakt het een logisch moment om de knelpunten hierboven te adresseren.'
    };
  } else if (a.q2 != null && a.q2 < 6) {
    trigger = {
      title: `${QUESTIONS.q2.options[a.q2]} binnen 24 maanden`,
      text: 'Deze ontwikkeling vergroot de druk op de huidige werkwijze. Wat nu werkbaar is, kan bij meer volume of complexiteit knellen.'
    };
  } else {
    trigger = {
      title: 'Gerichte optimalisatie',
      text: 'U voorziet geen grote verandering. De focus ligt daarom op optimalisatie in uw eigen tempo, niet op urgentie.'
    };
  }

  return {
    total,
    profile: profile.name,
    band: profile.band,
    message: profile.message,
    cta: profile.cta,
    dimensions: dims.map((d) => ({ key: d.key, name: d.name, nl: d.nl, score: d.score, isLowest: !!low && d.key === low.key })),
    bottleneck: low ? {
      key: low.key,
      title: `${low.name} · ${low.score}/100`,
      echo: echoIdx != null ? ECHO[low.key][echoIdx] : '',
      insight: INSIGHT[low.key]
    } : null,
    impact: { title: impact[0], text: impactText },
    trigger,
    priority: a.q12 != null ? QUESTIONS.q12.options[a.q12] : '',
    firstStep: a.q12 != null ? FIRST_STEP[a.q12] : ''
  };
}
