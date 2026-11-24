import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QUESTIONS } from '../src/data/questions.js';
import { flowFor, computeResult } from '../src/logic/scoring.js';

const DEMO = { q1: 2, q2: 0, q3: 3, q3a: 3, q4: 2, q5: 2, q5a: 1, q6: 4, q7: 1, q8: 2, q9: 1, q10: 2, q11: 7, q12: 1 };

test('voorbeelduitslag uit de brief geeft 54/100, profiel B, knelpunt Close & Reporting', () => {
  const r = computeResult(DEMO);
  assert.equal(r.total, 54);
  assert.equal(r.profile, 'Werkbaar, maar arbeidsintensief');
  assert.equal(r.bottleneck.key, 'cr');
  assert.equal(r.trigger.title, 'Groei van transactievolume binnen 24 maanden');
  assert.equal(r.priority, 'Betrouwbaardere managementinformatie');
});

test('conditionele vragen verschijnen alleen bij de juiste antwoorden', () => {
  assert.ok(flowFor({ q3: 0 }).includes('q3a'));
  assert.ok(!flowFor({ q3: 5 }).includes('q3a'));
  assert.ok(flowFor({ q5: 2 }).includes('q5a'));
  assert.ok(!flowFor({ q5: 1 }).includes('q5a'));
});

test('overgeslagen conditionele vraag telt niet mee, ook als er nog een oud antwoord staat', () => {
  const a = { ...DEMO, q3: 5 }; // q3a staat nog in de antwoorden maar is niet meer zichtbaar
  const withOld = computeResult(a);
  const { q3a, ...rest } = a;
  assert.equal(withOld.total, computeResult(rest).total);
});

test('willekeurige complete paden: score altijd 0-100 en uitslag compleet', () => {
  const ids = Object.keys(QUESTIONS);
  let seed = 42;
  const rnd = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
  for (let i = 0; i < 5000; i++) {
    const a = {};
    for (const id of ids) a[id] = rnd(QUESTIONS[id].options.length);
    const r = computeResult(a);
    assert.ok(r.total >= 0 && r.total <= 100, `score ${r.total}`);
    assert.equal(r.dimensions.length, 5);
    assert.ok(r.bottleneck && r.bottleneck.echo && r.bottleneck.insight);
    assert.ok(r.impact.text && r.trigger.title && r.firstStep);
    for (const d of r.dimensions) assert.ok(d.score >= 0 && d.score <= 100);
  }
});

test('uitersten: zwakste antwoorden 0, sterkste antwoorden 100', () => {
  const worst = {}, best = {};
  for (const [id, q] of Object.entries(QUESTIONS)) {
    if (!q.v) continue;
    worst[id] = q.v.indexOf(Math.min(...q.v));
    best[id] = q.v.indexOf(Math.max(...q.v));
  }
  assert.equal(computeResult(worst).total, 0);
  assert.equal(computeResult(best).total, 100);
});
