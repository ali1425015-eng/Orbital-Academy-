#!/usr/bin/env node
/* Builds the whole question bank, deterministically (fixed seed).
   Outputs:
     data/questions.json                 master bank (full schema) → seeded into SQLite
     data/bank/<subject>-g<grade>.js   per-grade chunks for offline/static mode
     data/bank/index.js           counts per subject/grade/concept
   Usage: node generator/build-bank.js [scale]   (scale 1 ≈ 15k questions) */
'use strict';
const fs = require('fs');
const path = require('path');
const RNG = require('../js/shared/rng.js');
const Concepts = require('../js/shared/concepts.js');
const math = require('./gen-math');
const sci = require('./gen-science');
const eng = require('./gen-english');
const ara = require('./gen-arabic');
const { mcq } = require('./common');

const ROOT = path.join(__dirname, '..');
const scale = parseFloat(process.argv[2] || '1');
const rng = new RNG('orbital-academy-bank-v1');

const PLAN = []; // [subject, tag, generatorFn, targetCount]
const BOOST = { derivative: 420, integral: 380, limits: 400, arith_seq: 400, logs: 200, geo_seq: 200, resistors: 380, elec_power: 380 };
Object.keys(math).forEach(t => PLAN.push(['math', t, math[t], BOOST[t] || 230]));
Object.keys(sci.T).forEach(t => PLAN.push(['science', t, sci.T[t], BOOST[t] || 210]));
['present_simple', 'past_simple', 'present_cont', 'future_will', 'present_perfect', 'past_cont', 'passive', 'conditionals', 'irregular_verbs', 'comparatives', 'plurals', 'relative_clauses', 'modals', 'reported_speech', 'gerund_inf']
  .forEach(t => PLAN.push(['english', t, eng[t], t === 'plurals' ? 120 : t === 'irregular_verbs' ? 200 : t === 'modals' ? 150 : (t === 'present_perfect' || t === 'past_cont' || t === 'passive' || t === 'conditionals') ? 420 : 260]));
PLAN.push(['english', 'vocab', eng.vocab, 600]);
PLAN.push(['arabic', 'nahw_roles', ara.rolesGen, 600]);
Object.keys(ara.T).forEach(t => PLAN.push(['arabic', t, ara.T[t], 260]));

const DIFF_LABEL = { 1: 'Easy', 2: 'Medium', 3: 'Hard' };
const all = [];
const seenText = new Set();
const stats = {};
let rejected = 0;

function gradeFor(tag, d) {
  const c = Concepts.ALL[tag]; if (!c) throw new Error('unknown concept ' + tag);
  const [g0, g1] = c.grades; if (g0 === g1) return g0;
  const base = g0 + Math.round(((d - 1) / 2) * (g1 - g0));
  return Math.max(g0, Math.min(g1, base + (rng.chance(0.3) ? (rng.chance(.5) ? 1 : -1) : 0)));
}

function push(subject, tag, raw) {
  if (!raw || !raw.m) { rejected++; return false; }
  const conceptTag = raw.tag || tag;
  const key = subject + '|' + raw.q + '|' + raw.m.options.slice().sort().join('|');
  const textKey = subject + '|' + raw.q;
  if (seenText.has(textKey) && seenText.has(key)) { rejected++; return false; }
  if (seenText.has(textKey) && !/Choose|The (past|plural|meaning)|اختر|ما علامة|ما إعراب|أي الجمل|في أي جملة/.test(raw.q)) { rejected++; return false; }
  if (seenText.has(key)) { rejected++; return false; }
  seenText.add(textKey); seenText.add(key);
  const d = raw.d || 2;
  const grade = raw.g || gradeFor(conceptTag, d);
  const q = {
    questionId: '', gradeLevel: grade, subject, difficulty: d, difficultyLabel: DIFF_LABEL[d],
    questionText: raw.q, options: raw.m.options, correctOptionIndex: raw.m.correctOptionIndex,
    conceptTag, explanation: raw.e, optionNotes: raw.m.optionNotes, lang: raw.lang || 'ar', source: 'gen:' + subject + '.' + tag
  };
  all.push(q);
  stats[subject] = (stats[subject] || 0) + 1;
  return true;
}

for (const [subject, tag, fn, target] of PLAN) {
  const want = Math.round(target * scale);
  let made = 0, tries = 0;
  while (made < want && tries < want * 12) { tries++; let raw = null; try { raw = fn(rng); } catch (e) { raw = null; } if (push(subject, tag, raw)) made++; }
}
// curated science
for (const c of sci.curated()) {
  const m = mcq(rng, c.correct, c.ds, x => x);
  push('science', c.tag, { g: c.g, d: c.d, q: c.q, m, e: c.e, tag: c.tag });
}
// curated Arabic roles (each sentence twice with different option sets is not useful → once)
for (const it of ara.rolesCurated()) push('arabic', 'nahw_roles', Object.assign(ara.roleQuestion(rng, it), { tag: 'nahw_roles' }));

// ids
const counters = {};
all.forEach(q => {
  const k = q.subject + q.gradeLevel; counters[k] = (counters[k] || 0) + 1;
  q.questionId = q.subject.slice(0, 3).toUpperCase() + '-' + q.gradeLevel + '-' + String(counters[k]).padStart(5, '0');
});

// ---- write outputs ----
fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'data', 'questions.json'), JSON.stringify(all));
const bankDir = path.join(ROOT, 'data', 'bank');
fs.mkdirSync(bankDir, { recursive: true });
fs.readdirSync(bankDir).forEach(f => fs.unlinkSync(path.join(bankDir, f)));
const index = { generated: new Date().toISOString().slice(0, 10), total: all.length, bySubject: {}, byGrade: {}, byConcept: {}, chunks: {} };
const groups = {};
all.forEach(q => {
  const k = q.subject + '-g' + q.gradeLevel;
  (groups[k] = groups[k] || []).push([q.questionId, q.gradeLevel, q.difficulty, q.conceptTag, q.questionText, q.options, q.correctOptionIndex, q.explanation, q.optionNotes, q.lang]);
  index.bySubject[q.subject] = (index.bySubject[q.subject] || 0) + 1;
  index.byGrade[q.gradeLevel] = (index.byGrade[q.gradeLevel] || 0) + 1;
  index.byConcept[q.conceptTag] = (index.byConcept[q.conceptTag] || 0) + 1;
});
Object.keys(groups).forEach(k => {
  index.chunks[k] = groups[k].length;
  fs.writeFileSync(path.join(bankDir, k + '.js'), 'OA_BANK_LOAD(' + JSON.stringify(k) + ',' + JSON.stringify(groups[k]) + ');\n');
});
fs.writeFileSync(path.join(bankDir, 'index.js'), 'window.OA_BANK_INDEX=' + JSON.stringify(index) + ';\n');

const bytes = fs.statSync(path.join(ROOT, 'data', 'questions.json')).size;
console.log('Question bank built: ' + all.length + ' questions (' + (bytes / 1e6).toFixed(1) + ' MB), rejected/duplicates: ' + rejected);
console.log('  by subject:', JSON.stringify(index.bySubject));
console.log('  by grade:  ', JSON.stringify(index.byGrade));
console.log('  concepts:  ', Object.keys(index.byConcept).length);
