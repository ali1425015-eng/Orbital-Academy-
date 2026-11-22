/* Validates every question in data/questions.json.
   1) structure: 4 unique non-empty options, valid answer index, notes for
      every wrong option, known concept, grade inside the concept's range.
   2) independent re-computation: for many numeric templates the answer is
      re-derived from the question TEXT with a separate parser, so a bug in
      a generator's arithmetic would be caught here. */
'use strict';
const path = require('path');
const Concepts = require('../js/shared/concepts.js');
const bank = require(path.join(__dirname, '..', 'data', 'questions.json'));

let fail = 0, checked = 0;
const errors = [];
function bad(q, msg) { fail++; if (errors.length < 25) errors.push(q.questionId + ' [' + q.conceptTag + '] ' + msg + '\n   ' + q.questionText + '\n   ' + q.options.join(' | ')); }
const toNum = s => parseFloat(String(s).replace(/−/g, '-').replace(/[^\d.\-/]/g, ''));
function frac(s) { s = String(s).replace(/−/g, '-').trim(); if (s.includes('/')) { const [a, b] = s.split('/').map(Number); return a / b; } return Number(s); }
const nums = t => (t.match(/`[^`]*`/g) || []).map(x => x.slice(1, -1));
const close = (a, b) => Math.abs(a - b) < 1e-6 * Math.max(1, Math.abs(b));

const ids = new Set();
for (const q of bank) {
  if (ids.has(q.questionId)) bad(q, 'duplicate id'); ids.add(q.questionId);
  if (!Array.isArray(q.options) || q.options.length !== 4) { bad(q, 'needs 4 options'); continue; }
  if (new Set(q.options).size !== 4) bad(q, 'duplicate options');
  if (q.options.some(o => !String(o).trim())) bad(q, 'empty option');
  if (!(q.correctOptionIndex >= 0 && q.correctOptionIndex < 4)) bad(q, 'bad answer index');
  if (!q.questionText || !q.explanation) bad(q, 'missing text/explanation');
  q.optionNotes.forEach((n, i) => { if (i !== q.correctOptionIndex && !n) bad(q, 'wrong option without misconception note'); });
  const c = Concepts.ALL[q.conceptTag];
  if (!c) bad(q, 'unknown concept'); else if (q.gradeLevel < c.grades[0] || q.gradeLevel > c.grades[1]) bad(q, 'grade outside concept range');
  if (c && c.subject !== q.subject) bad(q, 'subject mismatch');
  if (/\{[A-Za-z]+\}/.test(q.questionText + q.options.join(''))) bad(q, 'unfilled template placeholder');
  if (/NaN|undefined|Infinity|null/.test(q.questionText + q.options.join(''))) bad(q, 'NaN/undefined in text');

  // ---------- independent answer checks ----------
  const A = q.options[q.correctOptionIndex], n = nums(q.questionText), t = q.questionText;
  let expect = null;
  try {
    switch (q.conceptTag) {
      case 'int_ops': { const m = n[0].match(/\((−?\d+)\) (.) \((−?\d+)\)/); const a = toNum(m[1]), b = toNum(m[3]);
        expect = m[2] === '×' ? a * b : m[2] === '+' ? a + b : m[2] === '−' ? a - b : a / b; break; }
      case 'frac_add': case 'frac_mul': { const m = n[0].match(/(\d+)\/(\d+) (.) (\d+)\/(\d+)/); const x = m[1] / m[2], y = m[4] / m[5];
        expect = m[3] === '+' ? x + y : m[3] === '×' ? x * y : x / y; if (!close(frac(A), expect)) bad(q, 'fraction answer ' + A + ' ≠ ' + expect); expect = null; break; }
      case 'lin_eq': { const m = n[0].replace(/−/g, '-').replace(/ /g, '').match(/^(-?\d*)x([+-]\d+)?=(-?\d+)$/);
        const a = m[1] === '' ? 1 : m[1] === '-' ? -1 : +m[1], b = m[2] ? +m[2] : 0; expect = (+m[3] - b) / a; if (!close(toNum(A.replace('x =', '')), expect)) bad(q, 'lin_eq ' + A + ' ≠ ' + expect); expect = null; break; }
      case 'pythagoras': { const v = n.map(toNum); expect = t.includes('طول وتره') ? Math.sqrt(v[0] ** 2 - v[1] ** 2) : Math.sqrt(v[0] ** 2 + v[1] ** 2); break; }
      case 'speed': if (t.includes('km/h')) expect = toNum(n[0]) * 5 / 18; else expect = toNum(n[0]) / toNum(n[1]); break;
      case 'newton2': if (t.includes('عجلة المركبة')) expect = toNum(n[0]) / toNum(n[1]); else expect = toNum(n[0]) * toNum(n[1]); break;
      case 'kinetic': expect = 0.5 * toNum(n[0]) * toNum(n[1]) ** 2; break;
      case 'momentum': expect = toNum(n[0]) * toNum(n[1]); break;
      case 'weight': expect = toNum(n[0]) * toNum(n[1].split('=')[1]); break;
      case 'potential': expect = toNum(n[0]) * toNum(n[1]) * toNum(n[2].split('=')[1]); break;
      case 'heat': expect = toNum(n[0]) * 4200 * (toNum(n[3]) - toNum(n[2])); break;
      case 'pressure': expect = toNum(n[0]) / toNum(n[1]); break;
      case 'hooke': expect = toNum(n[0]) * toNum(n[1]); break;
      case 'ohm': if (t.includes('فرق الجهد بين')) expect = toNum(n[0]) * toNum(n[1]); else if (t.includes('شدة التيار')) expect = toNum(n[0]) / toNum(n[1]); else expect = toNum(n[1]) / toNum(n[0]); break;
      case 'resistors': if (t.includes('التوالي')) { expect = n[0].split('و').map(toNum).reduce((a, b) => a + b, 0); } else { const a = toNum(n[0]), b = toNum(n[1]); expect = a * b / (a + b); } break;
      case 'distance': { const p = n.map(s => s.replace(/[()−]/g, m => m === '−' ? '-' : '').split(',').map(Number)); expect = Math.hypot(p[1][0] - p[0][0], p[1][1] - p[0][1]); break; }
      case 'vectors': { const p = n[0].replace(/−/g, '-').match(/\((-?\d+), (-?\d+)\)/); expect = Math.hypot(+p[1], +p[2]); break; }
      case 'percent': if (t.includes('زاد بنسبة')) expect = toNum(n[0]) * (1 + toNum(n[1]) / 100); else { const v = n.map(toNum); expect = t.startsWith('ما قيمة') ? v[0] * v[1] / 100 : v[0] * v[1] / 100; } break;
      case 'geo_seq': { const v = n.map(toNum); expect = v[0] * Math.pow(v[1], v[2] - 1); break; }
      case 'arith_seq': { const v = n.map(toNum); expect = t.includes('مجموع') ? v[0] / 2 * (2 * v[1] + (v[0] - 1) * v[2]) : v[0] + (v[2] - 1) * v[1]; break; }
      case 'magnetic_force': expect = toNum(n[0]) * toNum(n[1]) * toNum(n[2]); break;   // L, I, B in text order
      case 'faraday': expect = toNum(n[0]) * toNum(n[1]) / toNum(n[2]); break;
      case 'capacitor': { const C = toNum(n[0]), V = toNum(n[1]); expect = t.includes('الطاقة') ? C * V * V / 2 : C * V; break; }
      case 'coulomb': expect = 9e9 * toNum(n[0]) * 1e-6 * toNum(n[1]) * 1e-6 / (toNum(n[2]) ** 2); break;
      case 'mean_median': { const v = n[0].split('،').map(toNum); if (t.includes('الوسط الحسابي')) expect = v.reduce((a, b) => a + b, 0) / v.length; else expect = v.slice().sort((a, b) => a - b)[(v.length - 1) / 2]; break; }
    }
  } catch (e) { bad(q, 'checker could not parse: ' + e.message); }
  if (expect !== null) { checked++; if (!close(toNum(A), +expect.toPrecision(5))) bad(q, 'answer ' + A + ' ≠ recomputed ' + expect); }
}
console.log('Validated ' + bank.length + ' questions; independently re-computed ' + checked + ' answers.');
if (fail) { console.log('FAILURES: ' + fail); errors.forEach(e => console.log(' - ' + e)); process.exit(1); }
console.log('All bank checks passed ✔');
