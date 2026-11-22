/* Helpers shared by all question generators. */
'use strict';

function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a || 1; }

class Frac {
  constructor(n, d = 1) {
    if (d === 0) throw new Error('zero denominator');
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d); this.n = n / g; this.d = d / g;
  }
  add(o) { return new Frac(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { return new Frac(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { return new Frac(this.n * o.n, this.d * o.d); }
  div(o) { return new Frac(this.n * o.d, this.d * o.n); }
  eq(o) { return this.n === o.n && this.d === o.d; }
  val() { return this.n / this.d; }
  toString() { return this.d === 1 ? num(this.n) : (this.n < 0 ? '−' : '') + Math.abs(this.n) + '/' + this.d; }
}

/* Display numbers with a real minus sign and trimmed decimals. */
function num(x) {
  if (typeof x !== 'number') return String(x);
  let s = Number.isInteger(x) ? String(Math.abs(x)) : String(+Math.abs(x).toFixed(3));
  return (x < 0 ? '−' : '') + s;
}
const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻', '−': '⁻', 'n': 'ⁿ' };
function sup(x) { return String(x).split('').map(c => SUP[c] || c).join(''); }

/* Signed term for building expressions: term(3,'x',true) → "+ 3x" */
function term(c, v, notFirst) {
  if (c === 0) return '';
  const sign = c < 0 ? '−' : (notFirst ? '+' : '');
  const a = Math.abs(c);
  const coef = (a === 1 && v) ? '' : String(a);
  return (notFirst ? ' ' + sign + ' ' : sign) + coef + (v || '');
}
function poly(terms) { // [[coef,'x²'],[coef,'x'],[coef,'']]
  let out = '', first = true;
  terms.forEach(([c, v]) => { if (c === 0) return; out += term(c, v, !first); first = false; });
  return out || '0';
}

const FILLER_NOTE = 'هذه قيمة قريبة لكنها ناتجة عن خطأ في الحساب — راجع الخطوات واحدة واحدة.';

/* Build a 4-option MCQ.
   correct: value; ds: [[value, note], ...] distractors; key(v): string used
   for uniqueness (defaults to fmt). Missing options are filled with
   near-miss numbers when `near` is given. Returns null if it can't make 4. */
function mcq(rng, correct, ds, fmt, opts) {
  opts = opts || {};
  fmt = fmt || (v => (v instanceof Frac ? v.toString() : num(v)));
  const seen = new Set([fmt(correct)]);
  const out = [{ t: fmt(correct), note: null, ok: true }];
  for (const [v, note] of ds) {
    if (v === null || v === undefined || (typeof v === 'number' && !isFinite(v))) continue;
    const s = fmt(v);
    if (seen.has(s)) continue;
    seen.add(s); out.push({ t: s, note: note || opts.filler || FILLER_NOTE, ok: false });
    if (out.length === 4) break;
  }
  let guard = 0;
  while (out.length < 4 && opts.near && guard++ < 50) {
    const v = opts.near(rng);
    const s = fmt(v);
    if (seen.has(s)) continue;
    seen.add(s); out.push({ t: s, note: opts.filler || FILLER_NOTE, ok: false });
  }
  if (out.length < 4) return null;
  const sh = rng.shuffle(out);
  return { options: sh.map(o => o.t), correctOptionIndex: sh.findIndex(o => o.ok), optionNotes: sh.map(o => o.note) };
}

function nearInt(c, spread) { return r => c + (r.chance(0.5) ? 1 : -1) * r.int(1, spread || 5); }

module.exports = { gcd, Frac, num, sup, term, poly, mcq, nearInt, FILLER_NOTE };
