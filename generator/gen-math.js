/* Math question generators (grades 7–12, Egyptian curriculum order).
   Every distractor is the result of a named misconception, so the offline
   tutor can explain *why* that specific wrong answer happens. Text between
   backticks is rendered left-to-right as math in the UI. */
'use strict';
const { TX, Frac, num, sup, poly, mcq, nearInt } = require('./common');

const T = {};

T.int_ops = r => {
  const a = r.int(-15, 15) || 7, b = r.int(-12, 12) || -5;
  const op = r.pick(['×', '+', '−', '÷']);
  let c, ds, d = 1;
  if (op === '×') { c = a * b; ds = [[-c, TX('خطأ في الإشارة: سالب × سالب = موجب، وسالب × موجب = سالب.')], [a + b, TX('جمعت العددين بدلاً من ضربهما.')], [Math.abs(a) * Math.abs(b) + 1, null]]; }
  else if (op === '+') { c = a + b; ds = [[Math.abs(a) + Math.abs(b), TX('تجاهلت الإشارات وجمعت القيم المطلقة.')], [-c, TX('أخذت إشارة العدد الأصغر بدلاً من الأكبر قيمةً مطلقة.')], [a - b, TX('طرحت بدلاً من الجمع.')]]; }
  else if (op === '−') { c = a - b; ds = [[a + b, TX('نسيت أن طرح عدد سالب يساوي جمعه: a − (−b) = a + b.')], [-c, TX('خطأ في الإشارة النهائية.')], [b - a, TX('عكست ترتيب الطرح.')]]; d = 2; }
  else { const q = r.int(-9, 9) || 3, B = r.int(2, 9) * (r.chance(.5) ? -1 : 1); const A = q * B; c = q;
    const m = mcq(r, c, [[-c, TX('خطأ في الإشارة عند القسمة.')], [A * B, TX('ضربت بدلاً من القسمة.')], [A - B, TX('طرحت بدلاً من القسمة.')]], null, { near: nearInt(c, 4) });
    return { d: 1, q: TX('ناتج `(') + num(A) + ') ÷ (' + num(B) + TX(')` يساوي:'), m, e: num(A) + ' ÷ ' + num(B) + ' = ' + num(c) + '.' }; }
  const m = mcq(r, c, ds, null, { near: nearInt(c, 6) });
  return { d, q: TX('ناتج `(') + num(a) + ') ' + op + ' (' + num(b) + TX(')` يساوي:'), m, e: '(' + num(a) + ') ' + op + ' (' + num(b) + ') = ' + num(c) + '.' };
};

T.frac_add = r => {
  const b = r.int(2, 9), d = r.int(2, 9); if (b === d) return null;
  const a = r.int(1, b - 1), c = r.int(1, d - 1);
  const x = new Frac(a, b), y = new Frac(c, d), sum = x.add(y);
  const m = mcq(r, sum, [
    [new Frac(a + c, b + d), TX('جمعت البسط مع البسط والمقام مع المقام — المقامات لا تُجمع، بل نوحّدها أولاً.')],
    [new Frac(a * c, b * d), TX('ضربت الكسرين بدلاً من جمعهما.')],
    [new Frac(a + c, b * d), TX('وحّدت المقام لكن لم تضرب البسطين في العامل المناسب.')]
  ], null, { near: rr => sum.add(new Frac(rr.int(1, 3) * (rr.chance(.5) ? 1 : -1), b * d)) });
  return { d: (b * d > 40 ? 2 : 1), q: TX('ناتج `') + a + '/' + b + ' + ' + c + '/' + d + TX('` في أبسط صورة:'), m, e: a + '/' + b + ' + ' + c + '/' + d + ' = ' + (a * d) + '/' + (b * d) + ' + ' + (c * b) + '/' + (b * d) + ' = ' + sum + '.' };
};

T.frac_mul = r => {
  const a = r.int(1, 8), b = r.int(2, 9), c = r.int(1, 8), d = r.int(2, 9);
  const div = r.chance(0.4);
  const x = new Frac(a, b), y = new Frac(c, d);
  const res = div ? x.div(y) : x.mul(y);
  const ds = div
    ? [[x.mul(y), TX('ضربت مباشرة — القسمة على كسر تعني الضرب في مقلوبه.')], [new Frac(b * c, a * d), TX('قلبت الكسر الأول بدلاً من الثاني.')], [x.add(y), TX('جمعت بدلاً من القسمة.')]]
    : [[x.add(y), TX('جمعت الكسرين بدلاً من ضربهما.')], [new Frac(a * d, b * c), TX('ضربت "تبادلياً" وكأنها قسمة.')], [new Frac(a * c, b + d), TX('جمعت المقامين بدلاً من ضربهما.')]];
  const m = mcq(r, res, ds, null, { near: rr => res.add(new Frac(rr.int(1, 3), b * d)) });
  return { d: div ? 2 : 1, q: TX('ناتج `') + a + '/' + b + (div ? ' ÷ ' : ' × ') + c + '/' + d + TX('` في أبسط صورة:'), m, e: (div ? a + '/' + b + ' × ' + d + '/' + c : a + '/' + b + ' × ' + c + '/' + d) + ' = ' + res + '.' };
};

T.percent = r => {
  const p = r.pick([5, 10, 12, 15, 20, 25, 30, 40, 50, 60, 75]);
  const N = r.int(2, 40) * (p % 4 === 0 ? 25 : 20);
  if (r.chance(0.6)) {
    const c = p * N / 100; if (!Number.isInteger(c)) return null;
    const ctx = r.pick([TX('من خزان وقود سعته `') + N + TX('` لتراً، استهلكت المركبة `') + p + TX('%`. كم لتراً استهلكت؟'), TX('ما قيمة `') + p + TX('%` من العدد `') + N + TX('`؟'), TX('محطة فضاء بها `') + N + TX('` لوحاً شمسياً، تعطل `') + p + TX('%` منها. كم لوحاً تعطل؟')]);
    const m = mcq(r, c, [[N / p, TX('قسمت العدد على النسبة بدلاً من ضربه فيها ثم القسمة على 100.')], [N - c, TX('حسبت الجزء المتبقي وليس الجزء المطلوب.')], [p * N / 10, TX('قسمت على 10 بدلاً من 100.')]], null, { near: nearInt(c, 8) });
    return { d: 1, q: ctx, m, e: p + '% × ' + N + ' = ' + p + '/100 × ' + N + ' = ' + num(c) + '.' };
  }
  const c = N * (100 + p) / 100; if (!Number.isInteger(c)) return null;
  const m = mcq(r, c, [[N + p, TX('أضفت النسبة كرقم وليس كنسبة مئوية من السعر.')], [p * N / 100, TX('حسبت مقدار الزيادة فقط ونسيت إضافته للسعر الأصلي.')], [N * (100 - p) / 100, TX('حسبت نقصاناً بدلاً من زيادة.')]], null, { near: nearInt(c, 10) });
  return { d: 2, q: TX('سعر جهاز `') + N + TX('` جنيهاً، زاد بنسبة `') + p + TX('%`. السعر الجديد:'), m, e: N + ' × (1 + ' + p + '/100) = ' + num(c) + '.' };
};

T.ratio = r => {
  const a = r.int(1, 7), b = r.int(1, 7); if (a === b) return null;
  const k = r.int(2, 15), N = k * (a + b), big = Math.max(a, b) * k, small = Math.min(a, b) * k;
  const m = mcq(r, big, [[small, TX('حسبت الجزء الأصغر وليس الأكبر.')], [N / 2, TX('قسمت الكمية بالتساوي متجاهلاً النسبة.')], [Math.max(a, b) * N / Math.min(a, b) / (a + b) | 0, null], [N - a, null]], null, { near: nearInt(big, 6) });
  return { d: 1, q: TX('قُسِّم `') + N + TX('` كجم من الإمدادات بين وحدتين بنسبة `') + a + ' : ' + b + TX('`. ما نصيب الوحدة ذات النصيب الأكبر؟'), m, e: TX('عدد الأجزاء ') + (a + b) + TX('، الجزء الواحد = ') + N + ' ÷ ' + (a + b) + ' = ' + k + TX('، النصيب الأكبر = ') + Math.max(a, b) + ' × ' + k + ' = ' + big + '.' };
};

T.lin_eq = r => {
  const x = r.int(-10, 12), a = r.pick([2, 3, 4, 5, 6, 7, 8, -2, -3, -4]), b = r.int(-20, 20) || 5, c = a * x + b;
  const m = mcq(r, x, [[(c + b) / a, TX('نقلت b للطرف الآخر دون أن تعكس إشارتها.')], [(c - b) * a, TX('ضربت في a بدلاً من القسمة عليها.')], [c / a - b, TX('قسمت على a قبل نقل b بشكل خاطئ.')], [-x, TX('خطأ في الإشارة.')]], null, { near: nearInt(x, 4) });
  return { d: Math.abs(a) > 4 || b < 0 ? 2 : 1, q: TX('حل المعادلة `') + poly([[a, 'x'], [b, '']]) + ' = ' + num(c) + '`:', m: m && { ...m, options: m.options.map(o => 'x = ' + o) }, e: poly([[a, 'x']]) + ' = ' + num(c) + ' − (' + num(b) + ') = ' + num(c - b) + ' ⇒ x = ' + num(x) + '.' };
};

T.exponents = r => {
  const base = r.pick([2, 3, 5, 7, 'x', 'a']), m1 = r.int(2, 9), n1 = r.int(2, 6);
  const kind = r.pick(['mul', 'div', 'pow']);
  let c, q, ds;
  if (kind === 'mul') { c = m1 + n1; q = '`' + base + sup(m1) + ' × ' + base + sup(n1) + ' = ' + base + '^?`'; ds = [[m1 * n1, TX('ضربت الأسس — عند ضرب القوى ذات الأساس الواحد نجمع الأسس.')], [m1 - n1, TX('طرحت الأسس — الطرح يكون عند القسمة.')], [m1 + n1 + 1, null]]; }
  else if (kind === 'div') { if (m1 <= n1) return null; c = m1 - n1; q = '`' + base + sup(m1) + ' ÷ ' + base + sup(n1) + ' = ' + base + '^?`'; ds = [[m1 + n1, TX('جمعت الأسس — عند القسمة نطرح الأسس.')], [m1 / n1 | 0 || 1, TX('قسمت الأسس بدلاً من طرحها.')], [n1 - m1, TX('طرحت بترتيب معكوس.')]]; }
  else { c = m1 * n1; q = '`(' + base + sup(m1) + ')' + sup(n1) + ' = ' + base + '^?`'; ds = [[m1 + n1, TX('جمعت الأسس — قوة القوة نضرب فيها الأسس.')], [Math.pow(m1, n1), TX('رفعت الأس للقوة بدلاً من ضربه.')], [c + 1, null]]; }
  const m = mcq(r, c, ds, null, { near: nearInt(c, 3) });
  return { d: kind === 'pow' ? 2 : 1, q: TX('أوجد قيمة الأس المجهول: ') + q, m, e: TX('قانون الأسس يعطي الأس ') + c + '.' };
};

T.sqrt_simplify = r => {
  const a = r.int(2, 9), b = r.pick([2, 3, 5, 6, 7, 10, 11]);
  const n = a * a * b;
  const m = mcq(r, a + '√' + b, [[b + '√' + a, TX('بدّلت بين العدد خارج الجذر والعدد داخله.')], [(a * a) + '√' + b, TX('أخرجت المربع الكامل دون أخذ جذره.')], [(a + 1) + '√' + b, TX('اخترت مربعاً كاملاً خاطئاً.')], [(2 * a) + '√' + b, null]], v => v);
  return { d: n > 150 ? 2 : 1, q: TX('الصورة المبسطة للمقدار `√') + n + TX('` هي:'), m, e: '√' + n + ' = √(' + (a * a) + ' × ' + b + ') = ' + a + '√' + b + '.' };
};

const TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20], [7, 24, 25], [20, 21, 29], [9, 40, 41], [15, 20, 25], [10, 24, 26], [12, 35, 37]];
T.pythagoras = r => {
  const [a, b, c] = r.pick(TRIPLES);
  if (r.chance(0.5)) {
    const m = mcq(r, c, [[a + b, TX('جمعت الضلعين مباشرة — نجمع مربعيهما ثم نأخذ الجذر.')], [a * a + b * b, TX('نسيت أخذ الجذر التربيعي في النهاية.')], [b - a, null]], null, { near: nearInt(c, 3) });
    return { d: 1, q: TX('مثلث قائم الزاوية طولا ضلعي القائمة `') + a + TX('` سم و`') + b + TX('` سم. طول الوتر:'), m, e: 'c = √(' + a + '² + ' + b + '²) = √' + (a * a + b * b) + ' = ' + c + TX(' سم.') };
  }
  const m = mcq(r, b, [[Math.round(Math.sqrt(c * c + a * a) * 10) / 10, TX('جمعت مربعي الوتر والضلع — لإيجاد ضلع نطرح: b² = c² − a².')], [c - a, TX('طرحت الأطوال مباشرة بدلاً من طرح المربعات.')], [c * c - a * a, TX('نسيت أخذ الجذر التربيعي.')]], null, { near: nearInt(b, 3) });
  return { d: 2, q: TX('مثلث قائم الزاوية طول وتره `') + c + TX('` سم وطول أحد ضلعي القائمة `') + a + TX('` سم. طول الضلع الآخر:'), m, e: 'b = √(' + c + '² − ' + a + '²) = √' + (c * c - a * a) + ' = ' + b + TX(' سم.') };
};

T.expand_square = r => {
  const a = r.int(1, 12) * (r.chance(.5) ? 1 : -1), v = r.pick(['x', 'y', 'a']);
  const sq = v + '²';
  const right = poly([[1, sq], [2 * a, v], [a * a, '']]);
  const m = mcq(r, right, [[poly([[1, sq], [a * a, '']]), TX('نسيت الحد الأوسط 2ab — مربع المجموع ليس مجموع المربعات.')], [poly([[1, sq], [a, v], [a * a, '']]), TX('نسيت ضرب الحد الأوسط في 2.')], [poly([[1, sq], [2 * a, v], [-a * a, '']]), TX('مربع أي عدد موجب دائماً، فالحد الأخير يكون +') + (a * a) + '.'], [poly([[1, sq], [-2 * a, v], [a * a, '']]), TX('خطأ في إشارة الحد الأوسط.')]], x => x);
  return { d: Math.abs(a) > 6 ? 2 : 1, q: TX('مفكوك المقدار `(') + poly([[1, v], [a, '']]) + TX(')²` هو:'), m: m && { ...m, optionsLtr: true }, e: '(' + v + ' ' + (a < 0 ? '−' : '+') + ' ' + Math.abs(a) + ')² = ' + right + '.' };
};

T.circle_area = r => {
  const rad = r.int(2, 15), useD = r.chance(0.4);
  const c = rad * rad;
  const fmt = v => (v === 1 ? '' : v) + 'π';
  const ds = useD ? [[4 * c, TX('استخدمت القطر بدلاً من نصف القطر.')], [2 * rad, TX('حسبت المحيط ÷ 2 بدلاً من المساحة.')], [4 * rad, TX('حسبت المحيط (2πr) بدلاً من المساحة.')]]
    : [[2 * rad, TX('حسبت المحيط 2πr بدلاً من المساحة πr².')], [rad, TX('نسيت تربيع نصف القطر.')], [4 * c, TX('ضاعفت نصف القطر قبل التربيع.')]];
  const m = mcq(r, c, ds, v => fmt(v) + TX(' سم²'), { near: nearInt(c, 5) });
  return { d: useD ? 2 : 1, q: TX('نافذة رصد دائرية ') + (useD ? TX('طول قطرها `') + 2 * rad + TX('` سم') : TX('طول نصف قطرها `') + rad + TX('` سم')) + TX('. مساحتها بدلالة π:'), m, e: TX('المساحة = π × ') + rad + '² = ' + c + TX('π سم².') };
};

T.linear_func = r => {
  const mm = r.int(-6, 6) || 2, c = r.int(-10, 10), x = r.int(-6, 6);
  const y = mm * x + c;
  const m = mcq(r, y, [[mm + c * x, TX('بدّلت بين الميل والجزء المقطوع.')], [mm * x - c, TX('خطأ في إشارة الجزء المقطوع.')], [-(mm * x) + c, TX('خطأ في إشارة حاصل الضرب.')]], null, { near: nearInt(y, 5) });
  return { d: x < 0 && mm < 0 ? 2 : 1, q: TX('إذا كانت `y = ') + poly([[mm, 'x'], [c, '']]) + TX('` فإن قيمة y عندما `x = ') + num(x) + TX('` تساوي:'), m, e: 'y = ' + num(mm) + ' × (' + num(x) + ') + (' + num(c) + ') = ' + num(y) + '.' };
};

T.lin_ineq = r => {
  const a = r.pick([2, 3, 4, 5, -2, -3, -4, -5]), t = r.int(-8, 8); if (t === 0) return null;
  const b = r.int(-10, 10), c = a * t + b, sym = r.pick(['<', '>']);
  // ax + b sym c  →  x sym' t  (flip if a < 0)
  const flip = a < 0;
  const solSym = flip ? (sym === '<' ? '>' : '<') : sym;
  const opp = solSym === '<' ? '>' : '<';
  const right = 'x ' + solSym + ' ' + num(t);
  const m = mcq(r, right, [['x ' + opp + ' ' + num(t), flip ? TX('نسيت قلب اتجاه المتباينة عند القسمة على عدد سالب.') : TX('قلبت اتجاه المتباينة دون داعٍ — القسمة هنا على عدد موجب.')], ['x ' + solSym + ' ' + num(-t), TX('خطأ في إشارة الناتج.')], ['x ' + opp + ' ' + num(-t), TX('خطأ في الإشارة وفي اتجاه المتباينة معاً.')]], v => v);
  return { d: flip ? 2 : 1, q: TX('مجموعة حل المتباينة `') + poly([[a, 'x'], [b, '']]) + ' ' + sym + ' ' + num(c) + '`:', m, e: poly([[a, 'x']]) + ' ' + sym + ' ' + num(c - b) + TX(' ⇒ بالقسمة على ') + num(a) + (flip ? TX(' (سالب فينقلب الاتجاه)') : '') + ': ' + right + '.' };
};

T.systems = r => {
  const x = r.int(-6, 12), y = r.int(-6, 12); if (x === y) return null;
  if (r.chance(0.55)) {
    const s = x + y, d = x - y;
    const m = mcq(r, x, [[y, TX('هذه قيمة y وليست x.')], [s + d, TX('جمعت المعادلتين لكن نسيت القسمة على 2.')], [(s - d) / 2 === x ? x + 1 : (s - d) / 2, TX('طرحت المعادلتين فحصلت على y وليس x.')]], null, { near: nearInt(x, 4) });
    return { d: 1, q: TX('إذا كان `x + y = ') + num(s) + TX('` و `x − y = ') + num(d) + TX('` فإن قيمة x:'), m, e: TX('بالجمع: 2x = ') + num(s + d) + ' ⇒ x = ' + num(x) + '.' };
  }
  const a = r.int(2, 4), b = r.int(1, 3), c = r.int(1, 3);
  const e1 = a * x + b * y, e2 = c * x - b * y;
  const m = mcq(r, x, [[y, TX('هذه قيمة y وليست x.')], [e1 + e2, TX('نسيت القسمة على معامل x بعد الحذف.')], [-x, TX('خطأ في الإشارة.')]], null, { near: nearInt(x, 4) });
  return { d: 3, q: TX('حل النظام: `') + poly([[a, 'x'], [b, 'y']]) + ' = ' + num(e1) + TX('` ، `') + poly([[c, 'x'], [-b, 'y']]) + ' = ' + num(e2) + TX('`. قيمة x:'), m, e: TX('بجمع المعادلتين يُحذف y: ') + (a + c) + 'x = ' + num(e1 + e2) + ' ⇒ x = ' + num(x) + '.' };
};

T.quad_factor = r => {
  const p = r.int(-9, 9), q = r.int(-9, 9); if (p === 0 || q === 0 || p === q) return null;
  const B = -(p + q), C = p * q;
  const fmt = s => { const [u, v] = s.slice().sort((a, b) => a - b); return 'x = ' + num(u) + TX(' أو x = ') + num(v); };
  const m = mcq(r, [p, q], [[[-p, -q], TX('أخذت الأعداد من داخل الأقواس بنفس إشارتها — إذا (x − p) = 0 فإن x = p.')], [[p, -q], TX('خطأ في إشارة أحد الجذرين.')], [[-p, q], TX('خطأ في إشارة أحد الجذرين.')], [[B, C], TX('كتبت المعاملات وليس الجذور.')]], fmt);
  return { d: Math.abs(C) > 30 ? 3 : 2, q: TX('جذرا المعادلة `') + poly([[1, 'x²'], [B, 'x'], [C, '']]) + TX(' = 0` هما:'), m: m && { ...m, optionsLtr: true }, e: poly([[1, 'x²'], [B, 'x'], [C, '']]) + ' = (x ' + (p < 0 ? '+ ' + (-p) : '− ' + p) + ')(x ' + (q < 0 ? '+ ' + (-q) : '− ' + q) + ') ⇒ x = ' + num(p) + TX(' أو x = ') + num(q) + '.' };
};

T.slope = r => {
  const x1 = r.int(-6, 6), y1 = r.int(-6, 6), x2 = r.int(-6, 6), y2 = r.int(-6, 6);
  if (x1 === x2 || y1 === y2) return null;
  const s = new Frac(y2 - y1, x2 - x1);
  const ds = [[new Frac(x2 - x1, y2 - y1), TX('قسمت التغير في x على التغير في y — الميل = Δy ÷ Δx.')], [new Frac(-(y2 - y1), x2 - x1), TX('طرحت بترتيب مختلف في البسط والمقام فانعكست الإشارة.')]];
  if (x1 + x2 !== 0) ds.push([new Frac(y2 + y1, x2 + x1), TX('جمعت الإحداثيات بدلاً من طرحها.')]);
  const m = mcq(r, s, ds, null, { near: rr => s.add(new Frac(rr.int(1, 3), 1)) });
  return { d: s.d === 1 ? 1 : 2, q: TX('ميل المستقيم المار بالنقطتين `(') + num(x1) + ', ' + num(y1) + TX(')` و `(') + num(x2) + ', ' + num(y2) + ')`:', m, e: '(' + num(y2) + ' − ' + (y1 < 0 ? '(' + num(y1) + ')' : y1) + ') ÷ (' + num(x2) + ' − ' + (x1 < 0 ? '(' + num(x1) + ')' : x1) + ') = ' + num(y2 - y1) + '/' + num(x2 - x1) + ' = ' + s + '.' };
};

T.mean_median = r => {
  const n = r.pick([5, 7]);
  const vals = []; for (let i = 0; i < n; i++) vals.push(r.int(2, 30));
  const sorted = vals.slice().sort((a, b) => a - b), med = sorted[(n - 1) / 2];
  if (r.chance(0.5)) {
    const sum = vals.reduce((a, b) => a + b, 0);
    if (sum % n) { vals[n - 1] += n - (sum % n); }
    const s2 = vals.reduce((a, b) => a + b, 0), mean = s2 / n;
    const med2 = vals.slice().sort((a, b) => a - b)[(n - 1) / 2];
    const m = mcq(r, mean, [[med2, TX('هذا هو الوسيط وليس الوسط الحسابي.')], [Math.round(s2 / (n - 1) * 10) / 10, TX('قسمت على عدد خاطئ من القيم.')], [vals[(n - 1) / 2], TX('أخذت القيمة الوسطى دون حساب المتوسط.')]], null, { near: nearInt(mean, 3) });
    return { d: 1, q: TX('قراءات حساس الحرارة: `') + vals.join(TX(' ، ')) + TX('`. الوسط الحسابي لها:'), m, e: TX('المجموع ') + s2 + ' ÷ ' + n + ' = ' + mean + '.' };
  }
  const unsortedMid = vals[(n - 1) / 2];
  const m = mcq(r, med, [[unsortedMid, TX('أخذت القيمة الوسطى قبل ترتيب البيانات.')], [Math.round(vals.reduce((a, b) => a + b, 0) / n * 10) / 10, TX('حسبت الوسط الحسابي وليس الوسيط.')], [sorted[(n - 1) / 2 + 1], TX('اخترت قيمة مجاورة للوسيط.')]], null, { near: nearInt(med, 3) });
  return { d: 2, q: TX('وسيط القيم: `') + vals.join(TX(' ، ')) + TX('` هو:'), m, e: TX('بعد الترتيب: ') + sorted.join(TX(' ، ')) + TX(' ← القيمة في المنتصف = ') + med + '.' };
};

T.probability = r => {
  const R = r.int(1, 9), B = r.int(1, 9), G = r.int(1, 9), tot = R + B + G;
  const colors = [[TX('الحمراء'), R], [TX('الزرقاء'), B], [TX('الخضراء'), G]];
  const [name, k] = r.pick(colors);
  const c = new Frac(k, tot);
  const m = mcq(r, c, [[k === tot - k ? new Frac(k, tot + 1) : new Frac(k, tot - k), TX('قسمت على عدد الكرات الأخرى بدلاً من العدد الكلي.')], [new Frac(tot - k, tot), TX('حسبت احتمال عدم الحدوث (المكمّل).')], [new Frac(1, tot), TX('هذا احتمال سحب كرة معينة واحدة فقط.')]], null, { near: rr => new Frac(rr.int(1, tot - 1), tot) });
  return { d: 1, q: TX('صندوق عينات به `') + R + TX('` كرات حمراء و`') + B + TX('` زرقاء و`') + G + TX('` خضراء. سُحبت كرة عشوائياً، احتمال أن تكون ') + name + ':', m, e: TX('الاحتمال = ') + k + ' ÷ ' + tot + ' = ' + c + '.' };
};

const TRIG = [
  { t: 'sin 30°', v: new Frac(1, 2), w: new Frac(3, 4), sq: false }, { t: 'cos 60°', v: new Frac(1, 2), w: new Frac(3, 4), sq: false },
  { t: 'tan 45°', v: new Frac(1), w: new Frac(1, 2), sq: false }, { t: 'sin 90°', v: new Frac(1), w: new Frac(0), sq: false },
  { t: 'cos 0°', v: new Frac(1), w: new Frac(0), sq: false }, { t: 'cos 90°', v: new Frac(0), w: new Frac(1), sq: false },
  { t: 'sin² 45°', v: new Frac(1, 2), w: new Frac(1), sq: true }, { t: 'cos² 30°', v: new Frac(3, 4), w: new Frac(1, 4), sq: true },
  { t: 'sin² 60°', v: new Frac(3, 4), w: new Frac(1, 4), sq: true }, { t: 'tan² 60°', v: new Frac(3), w: new Frac(1, 3), sq: true },
  { t: 'tan² 30°', v: new Frac(1, 3), w: new Frac(3), sq: true }, { t: 'cos² 45°', v: new Frac(1, 2), w: new Frac(1), sq: true },
  { t: 'sin² 30°', v: new Frac(1, 4), w: new Frac(3, 4), sq: true }, { t: 'cos² 60°', v: new Frac(1, 4), w: new Frac(3, 4), sq: true }
];
T.trig_special = r => {
  const A = r.pick(TRIG), B = r.pick(TRIG); if (A === B) return null;
  const a = r.int(1, 4), op = r.pick(['+', '−']);
  const val = op === '+' ? new Frac(a).mul(A.v).add(B.v) : new Frac(a).mul(A.v).sub(B.v);
  const conf1 = op === '+' ? new Frac(a).mul(A.w).add(B.v) : new Frac(a).mul(A.w).sub(B.v);
  const conf2 = op === '+' ? new Frac(a).mul(A.v).add(B.w) : new Frac(a).mul(A.v).sub(B.w);
  const conf3 = op === '+' ? A.v.add(B.v) : A.v.sub(B.v);
  const m = mcq(r, val, [[conf1, TX('خلطت بين قيمة ') + A.t + TX(' وقيمة نسبة مثلثية أخرى.')], [conf2, TX('قيمة ') + B.t + TX(' غير صحيحة — راجع جدول الزوايا الخاصة.')], [a === 1 ? val.add(new Frac(1, 2)) : conf3, a === 1 ? null : TX('نسيت ضرب ') + A.t + TX(' في المعامل ') + a + '.']], null, { near: rr => val.add(new Frac(rr.int(1, 4), 2)) });
  return { d: A.sq || B.sq ? 2 : 1, q: TX('قيمة المقدار `') + (a > 1 ? a + ' ' : '') + A.t + ' ' + op + ' ' + B.t + TX('` تساوي:'), m, e: A.t + ' = ' + A.v + TX(' ، ') + B.t + ' = ' + B.v + TX(' ⇒ الناتج = ') + val + '.' };
};

T.discriminant = r => {
  const a = r.int(1, 4) * (r.chance(.8) ? 1 : -1), b = r.int(-9, 9), c = r.int(-9, 9);
  const D = b * b - 4 * a * c;
  if (r.chance(0.5)) {
    const m = mcq(r, D, [[b * b + 4 * a * c, TX('خطأ في الإشارة: Δ = b² − 4ac.')], [b - 4 * a * c, TX('نسيت تربيع b.')], [b * b - 2 * a * c, TX('استخدمت 2ac بدلاً من 4ac.')]], null, { near: nearInt(D, 6) });
    return { d: 2, q: TX('قيمة المميز للمعادلة `') + poly([[a, 'x²'], [b, 'x'], [c, '']]) + ' = 0`:', m, e: 'Δ = (' + num(b) + ')² − 4 × ' + num(a) + ' × ' + num(c) + ' = ' + num(D) + '.' };
  }
  const opts = [TX('جذران حقيقيان مختلفان'), TX('جذر حقيقي مكرر (جذران متساويان)'), TX('لا توجد جذور حقيقية'), TX('ثلاثة جذور حقيقية')];
  const ci = D > 0 ? 0 : D === 0 ? 1 : 2;
  const notes = ['', '', '', TX('المعادلة التربيعية لها جذران على الأكثر.')];
  const ds = opts.map((o, i) => [o, i === ci ? null : (notes[i] || TX('إشارة المميز Δ = ') + num(D) + TX(' تحدد نوع الجذور: موجب ← جذران مختلفان، صفر ← مكرر، سالب ← لا جذور حقيقية.'))]).filter((_, i) => i !== ci);
  const m = mcq(r, opts[ci], ds, v => v);
  return { d: 2, q: TX('نوع جذري المعادلة `') + poly([[a, 'x²'], [b, 'x'], [c, '']]) + ' = 0`:', m, e: 'Δ = ' + num(D) + (D > 0 ? ' > 0' : D === 0 ? ' = 0' : ' < 0') + ' ⇒ ' + opts[ci] + '.' };
};

T.func_eval = r => {
  const a = r.int(-4, 4) || 1, b = r.int(-8, 8), c = r.int(-9, 9), k = r.int(-5, 5) || -2;
  const v = a * k * k + b * k + c;
  const m = mcq(r, v, [[-a * k * k + b * k + c, TX('عوضت بالعدد السالب دون أقواس: (−k)² موجبة دائماً.')], [a * 2 * k + b * k + c, TX('حسبت 2k بدلاً من k².')], [a * k * k - b * k + c, TX('خطأ في إشارة الحد الأوسط.')]], null, { near: nearInt(v, 5) });
  return { d: k < 0 ? 2 : 1, q: TX('إذا كانت `f(x) = ') + poly([[a, 'x²'], [b, 'x'], [c, '']]) + TX('` فإن `f(') + num(k) + TX(')` تساوي:'), m, e: 'f(' + num(k) + ') = ' + num(a) + '(' + num(k) + ')² + ' + num(b) + '(' + num(k) + ') + ' + num(c) + ' = ' + num(v) + '.' };
};

T.distance = r => {
  const [a, b, c] = r.pick(TRIPLES);
  const x1 = r.int(-8, 8), y1 = r.int(-8, 8), sx = r.chance(.5) ? 1 : -1, sy = r.chance(.5) ? 1 : -1;
  const x2 = x1 + sx * a, y2 = y1 + sy * b;
  const m = mcq(r, c, [[a + b, TX('جمعت فرقي الإحداثيات دون تربيع.')], [a * a + b * b, TX('نسيت أخذ الجذر التربيعي.')], [Math.abs((x2 + x1)) + Math.abs(y2 + y1) || c + 2, TX('جمعت الإحداثيات بدلاً من طرحها.')]], null, { near: nearInt(c, 3) });
  return { d: 2, q: TX('المسافة بين القاعدة `(') + num(x1) + ', ' + num(y1) + TX(')` والمسبار `(') + num(x2) + ', ' + num(y2) + TX(')` بالوحدات:'), m, e: '√(' + a + '² + ' + b + '²) = √' + (a * a + b * b) + ' = ' + c + '.' };
};

T.vectors = r => {
  const [a, b, c] = r.pick(TRIPLES); const sa = r.chance(.5) ? -1 : 1, sb = r.chance(.5) ? -1 : 1;
  const m = mcq(r, c, [[a + b, TX('جمعت المركبتين — المعيار هو الجذر التربيعي لمجموع مربعيهما.')], [a * a + b * b, TX('نسيت الجذر التربيعي.')], [Math.abs(sa * a + sb * b) || c + 1, TX('جمعت المركبتين بإشارتيهما.')]], null, { near: nearInt(c, 3) });
  return { d: 1, q: TX('معيار متجه سرعة المركبة `v = (') + num(sa * a) + ', ' + num(sb * b) + ')`:', m, e: '‖v‖ = √(' + a + '² + ' + b + '²) = ' + c + '.' };
};

T.arith_seq = r => {
  const a1 = r.int(-10, 20), d = r.int(-6, 9) || 3, n = r.int(8, 40);
  if (r.chance(0.7)) {
    const an = a1 + (n - 1) * d;
    const m = mcq(r, an, [[a1 + n * d, TX('استخدمت n بدلاً من (n − 1).')], [a1 * n + d, TX('خلطت بين الحد الأول والأساس في القانون.')], [n * d, TX('نسيت إضافة الحد الأول.')]], null, { near: nearInt(an, 6) });
    return { d: 2, q: TX('متتابعة حسابية حدها الأول `') + num(a1) + TX('` وأساسها `') + num(d) + TX('`. الحد رقم `') + n + TX('` يساوي:'), m, e: 'aₙ = ' + num(a1) + ' + (' + n + ' − 1)(' + num(d) + ') = ' + num(an) + '.' };
  }
  const n2 = r.int(5, 20), S = n2 * (2 * a1 + (n2 - 1) * d) / 2;
  const m = mcq(r, S, [[n2 * (2 * a1 + n2 * d) / 2, TX('استخدمت n بدلاً من (n − 1) في قانون المجموع.')], [n2 * (a1 + (n2 - 1) * d), TX('نسيت القسمة على 2.')], [a1 + (n2 - 1) * d, TX('حسبت الحد الأخير وليس المجموع.')]], null, { near: nearInt(S, 10) });
  return { d: 3, q: TX('مجموع أول `') + n2 + TX('` حداً من متتابعة حسابية حدها الأول `') + num(a1) + TX('` وأساسها `') + num(d) + '`:', m, e: 'Sₙ = n/2 (2a₁ + (n − 1)d) = ' + n2 + '/2 × (' + num(2 * a1) + ' + ' + num((n2 - 1) * d) + ') = ' + num(S) + '.' };
};

T.geo_seq = r => {
  const a1 = r.pick([1, 2, 3, 5]), q = r.pick([2, 3, -2]), n = r.int(3, 7);
  const an = a1 * Math.pow(q, n - 1);
  const m = mcq(r, an, [[a1 * Math.pow(q, n), TX('استخدمت الأس n بدلاً من (n − 1).')], [a1 * q * (n - 1), TX('ضربت في (n − 1) بدلاً من الرفع للقوة.')], [Math.pow(a1 * q, n - 1), TX('رفعت حاصل ضرب الحد الأول في الأساس للقوة.')]], null, { near: nearInt(an, 8) });
  return { d: 2, q: TX('متتابعة هندسية حدها الأول `') + a1 + TX('` وأساسها `') + num(q) + TX('`. الحد رقم `') + n + '`:', m, e: 'aₙ = ' + a1 + ' × (' + num(q) + ')' + sup(n - 1) + ' = ' + num(an) + '.' };
};

T.logs = r => {
  const b = r.pick([2, 3, 5, 10]);
  const maxK = { 2: 10, 3: 6, 5: 4, 10: 5 }[b];
  const k = r.int(1, maxK), x = Math.pow(b, k);
  if (r.chance(0.6)) {
    const m = mcq(r, k, [[x / b, TX('قسمت العدد على الأساس بدلاً من إيجاد الأس.')], [k + 1, TX('عددت الأس خطأً.')], [b * k, null]], null, { near: nearInt(k, 2) });
    return { d: 1, q: TX('قيمة `log') + sub(b) + '(' + x + ')`:', m, e: b + sup(k) + ' = ' + x + ' ⇒ log' + sub(b) + '(' + x + ') = ' + k + '.' };
  }
  let u = r.int(1, k - 1 || 1); if (u >= k) u = 0;
  const p = Math.pow(b, u) * r.pick([1]), qv = x / p;
  if (!Number.isInteger(qv) || p === 1) return null;
  const m = mcq(r, k, [[Math.log(p + qv) / Math.log(b) % 1 === 0 ? Math.log(p + qv) / Math.log(b) : k + 2, TX('جمعت العددين داخل اللوغاريتم — مجموع اللوغاريتمين = لوغاريتم حاصل الضرب.')], [k - 1, null], [p * qv / b, TX('قسمت على الأساس بدلاً من أخذ اللوغاريتم.')]], null, { near: nearInt(k, 2) });
  return { d: 2, q: TX('قيمة `log') + sub(b) + '(' + p + ') + log' + sub(b) + '(' + qv + ')`:', m, e: 'log' + sub(b) + '(' + p + ' × ' + qv + ') = log' + sub(b) + '(' + x + ') = ' + k + '.' };
};
function sub(n) { const S = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' }; return String(n).split('').map(c => S[c]).join(''); }

T.limits = r => {
  if (r.chance(0.6)) {
    const a = r.int(-9, 9) || 4;
    const m = mcq(r, 2 * a, [[0, TX('عوضت مباشرة في البسط فقط — هنا تظهر الصورة 0/0 ويجب التحليل أولاً.')], [a, TX('بعد الاختصار نسيت أن x + a عند x = a تساوي 2a.')], [a * a, TX('خلطت بين x² و a.')]], null, { near: nearInt(2 * a, 4) });
    return { d: 3, q: TX('قيمة `lim (x → ') + num(a) + ') (x² − ' + (a * a) + ') / (x ' + (a < 0 ? '+ ' + (-a) : '− ' + a) + ')`:', m, e: '(x² − ' + (a * a) + ')/(x ' + (a < 0 ? '+ ' + (-a) : '− ' + a) + ') = x ' + (a < 0 ? '− ' + (-a) : '+ ' + a) + TX(' ⇒ النهاية = ') + num(2 * a) + '.' };
  }
  const p = r.int(-3, 4) || 1, q = r.int(-6, 6), c = r.int(-9, 9), a = r.int(-4, 4);
  const v = p * a * a + q * a + c;
  const m = mcq(r, v, [[-p * a * a + q * a + c, TX('خطأ في تربيع العدد السالب.')], [p * a + q * a + c, TX('لم تربّع قيمة x في الحد الأول.')], [c, TX('اعتبرت النهاية تساوي الحد الثابت فقط.')]], null, { near: nearInt(v, 4) });
  return { d: 2, q: TX('قيمة `lim (x → ') + num(a) + ') (' + poly([[p, 'x²'], [q, 'x'], [c, '']]) + ')`:', m, e: TX('دالة كثيرة حدود متصلة، نعوض مباشرة: ') + num(v) + '.' };
};

T.derivative = r => {
  const a = r.int(1, 6) * (r.chance(.8) ? 1 : -1), n = r.int(2, 4), b = r.int(-8, 8), c = r.int(-9, 9), k = r.int(-3, 3);
  const f1 = a * n * Math.pow(k, n - 1) + b;
  const m = mcq(r, f1, [[a * n * Math.pow(k, n) + b * k, TX('ضربت في الأس لكن لم تنقص الأس بمقدار 1.')], [a * Math.pow(k, n - 1) + b, TX('أنقصت الأس لكن نسيت الضرب في الأس القديم.')], [a * n * Math.pow(k, n - 1) + b + c, TX('مشتقة الثابت = صفر، لا تضفه.')], [a * Math.pow(k, n) + b * k + c, TX('عوضت في الدالة الأصلية f وليس في المشتقة.')]], null, { near: nearInt(f1, 6) });
  return { d: n > 2 || k < 0 ? 3 : 2, q: TX('إذا كانت `f(x) = ') + poly([[a, 'x' + sup(n)], [b, 'x'], [c, '']]) + TX('` فإن `f′(') + num(k) + TX(')` تساوي:'), m, e: 'f′(x) = ' + poly([[a * n, n - 1 === 1 ? 'x' : 'x' + sup(n - 1)], [b, '']]) + ' ⇒ f′(' + num(k) + ') = ' + num(f1) + '.' };
};

T.integral = r => {
  if (r.chance(0.5)) {
    const a = r.int(1, 5) * 2, b = r.int(-6, 6), k = r.int(1, 6);
    const v = a * k * k / 2 + b * k;
    const m = mcq(r, v, [[a * k * k + b * k, TX('نسيت القسمة على (n + 1) = 2.')], [a * k + b, TX('عوضت في الدالة نفسها بدلاً من دالتها الأصلية.')], [a * k * k / 2, TX('نسيت تكامل الحد الثابت.')]], null, { near: nearInt(v, 5) });
    return { d: 2, q: TX('قيمة `∫₀') + sup(k) + ' (' + poly([[a, 'x'], [b, '']]) + ') dx`:', m, e: '[' + poly([[a / 2, 'x²'], [b, 'x']]) + ']₀' + sup(k) + ' = ' + num(v) + '.' };
  }
  const lo = r.int(0, 2), hi = r.int(lo + 1, 4);
  const v = Math.pow(hi, 3) - Math.pow(lo, 3);
  const m = mcq(r, v, [[Math.pow(hi, 3), TX('نسيت طرح قيمة الحد الأدنى F(a).')], [3 * (Math.pow(hi, 3) - Math.pow(lo, 3)), TX('لم تقسم على (n + 1) = 3.')], [3 * hi * hi - 3 * lo * lo, TX('عوضت في الدالة المكاملة وليس في دالتها الأصلية.')]], null, { near: nearInt(v, 6) });
  return { d: 3, q: TX('قيمة `∫') + sub(lo) + sup(hi) + ' 3x² dx`:', m, e: TX('[x³] من ') + lo + TX(' إلى ') + hi + ' = ' + Math.pow(hi, 3) + ' − ' + Math.pow(lo, 3) + ' = ' + v + '.' };
};

module.exports = T;
