/* Math question generators (grades 7–12, Egyptian curriculum order).
   Every distractor is the result of a named misconception, so the offline
   tutor can explain *why* that specific wrong answer happens. Text between
   backticks is rendered left-to-right as math in the UI. */
'use strict';
const { Frac, num, sup, poly, mcq, nearInt } = require('./common');

const T = {};

T.int_ops = r => {
  const a = r.int(-15, 15) || 7, b = r.int(-12, 12) || -5;
  const op = r.pick(['×', '+', '−', '÷']);
  let c, ds, d = 1;
  if (op === '×') { c = a * b; ds = [[-c, 'خطأ في الإشارة: سالب × سالب = موجب، وسالب × موجب = سالب.'], [a + b, 'جمعت العددين بدلاً من ضربهما.'], [Math.abs(a) * Math.abs(b) + 1, null]]; }
  else if (op === '+') { c = a + b; ds = [[Math.abs(a) + Math.abs(b), 'تجاهلت الإشارات وجمعت القيم المطلقة.'], [-c, 'أخذت إشارة العدد الأصغر بدلاً من الأكبر قيمةً مطلقة.'], [a - b, 'طرحت بدلاً من الجمع.']]; }
  else if (op === '−') { c = a - b; ds = [[a + b, 'نسيت أن طرح عدد سالب يساوي جمعه: a − (−b) = a + b.'], [-c, 'خطأ في الإشارة النهائية.'], [b - a, 'عكست ترتيب الطرح.']]; d = 2; }
  else { const q = r.int(-9, 9) || 3, B = r.int(2, 9) * (r.chance(.5) ? -1 : 1); const A = q * B; c = q;
    const m = mcq(r, c, [[-c, 'خطأ في الإشارة عند القسمة.'], [A * B, 'ضربت بدلاً من القسمة.'], [A - B, 'طرحت بدلاً من القسمة.']], null, { near: nearInt(c, 4) });
    return { d: 1, q: 'ناتج `(' + num(A) + ') ÷ (' + num(B) + ')` يساوي:', m, e: num(A) + ' ÷ ' + num(B) + ' = ' + num(c) + '.' }; }
  const m = mcq(r, c, ds, null, { near: nearInt(c, 6) });
  return { d, q: 'ناتج `(' + num(a) + ') ' + op + ' (' + num(b) + ')` يساوي:', m, e: '(' + num(a) + ') ' + op + ' (' + num(b) + ') = ' + num(c) + '.' };
};

T.frac_add = r => {
  const b = r.int(2, 9), d = r.int(2, 9); if (b === d) return null;
  const a = r.int(1, b - 1), c = r.int(1, d - 1);
  const x = new Frac(a, b), y = new Frac(c, d), sum = x.add(y);
  const m = mcq(r, sum, [
    [new Frac(a + c, b + d), 'جمعت البسط مع البسط والمقام مع المقام — المقامات لا تُجمع، بل نوحّدها أولاً.'],
    [new Frac(a * c, b * d), 'ضربت الكسرين بدلاً من جمعهما.'],
    [new Frac(a + c, b * d), 'وحّدت المقام لكن لم تضرب البسطين في العامل المناسب.']
  ], null, { near: rr => sum.add(new Frac(rr.int(1, 3) * (rr.chance(.5) ? 1 : -1), b * d)) });
  return { d: (b * d > 40 ? 2 : 1), q: 'ناتج `' + a + '/' + b + ' + ' + c + '/' + d + '` في أبسط صورة:', m, e: a + '/' + b + ' + ' + c + '/' + d + ' = ' + (a * d) + '/' + (b * d) + ' + ' + (c * b) + '/' + (b * d) + ' = ' + sum + '.' };
};

T.frac_mul = r => {
  const a = r.int(1, 8), b = r.int(2, 9), c = r.int(1, 8), d = r.int(2, 9);
  const div = r.chance(0.4);
  const x = new Frac(a, b), y = new Frac(c, d);
  const res = div ? x.div(y) : x.mul(y);
  const ds = div
    ? [[x.mul(y), 'ضربت مباشرة — القسمة على كسر تعني الضرب في مقلوبه.'], [new Frac(b * c, a * d), 'قلبت الكسر الأول بدلاً من الثاني.'], [x.add(y), 'جمعت بدلاً من القسمة.']]
    : [[x.add(y), 'جمعت الكسرين بدلاً من ضربهما.'], [new Frac(a * d, b * c), 'ضربت "تبادلياً" وكأنها قسمة.'], [new Frac(a * c, b + d), 'جمعت المقامين بدلاً من ضربهما.']];
  const m = mcq(r, res, ds, null, { near: rr => res.add(new Frac(rr.int(1, 3), b * d)) });
  return { d: div ? 2 : 1, q: 'ناتج `' + a + '/' + b + (div ? ' ÷ ' : ' × ') + c + '/' + d + '` في أبسط صورة:', m, e: (div ? a + '/' + b + ' × ' + d + '/' + c : a + '/' + b + ' × ' + c + '/' + d) + ' = ' + res + '.' };
};

T.percent = r => {
  const p = r.pick([5, 10, 12, 15, 20, 25, 30, 40, 50, 60, 75]);
  const N = r.int(2, 40) * (p % 4 === 0 ? 25 : 20);
  if (r.chance(0.6)) {
    const c = p * N / 100; if (!Number.isInteger(c)) return null;
    const ctx = r.pick(['من خزان وقود سعته `' + N + '` لتراً، استهلكت المركبة `' + p + '%`. كم لتراً استهلكت؟', 'ما قيمة `' + p + '%` من العدد `' + N + '`؟', 'محطة فضاء بها `' + N + '` لوحاً شمسياً، تعطل `' + p + '%` منها. كم لوحاً تعطل؟']);
    const m = mcq(r, c, [[N / p, 'قسمت العدد على النسبة بدلاً من ضربه فيها ثم القسمة على 100.'], [N - c, 'حسبت الجزء المتبقي وليس الجزء المطلوب.'], [p * N / 10, 'قسمت على 10 بدلاً من 100.']], null, { near: nearInt(c, 8) });
    return { d: 1, q: ctx, m, e: p + '% × ' + N + ' = ' + p + '/100 × ' + N + ' = ' + num(c) + '.' };
  }
  const c = N * (100 + p) / 100; if (!Number.isInteger(c)) return null;
  const m = mcq(r, c, [[N + p, 'أضفت النسبة كرقم وليس كنسبة مئوية من السعر.'], [p * N / 100, 'حسبت مقدار الزيادة فقط ونسيت إضافته للسعر الأصلي.'], [N * (100 - p) / 100, 'حسبت نقصاناً بدلاً من زيادة.']], null, { near: nearInt(c, 10) });
  return { d: 2, q: 'سعر جهاز `' + N + '` جنيهاً، زاد بنسبة `' + p + '%`. السعر الجديد:', m, e: N + ' × (1 + ' + p + '/100) = ' + num(c) + '.' };
};

T.ratio = r => {
  const a = r.int(1, 7), b = r.int(1, 7); if (a === b) return null;
  const k = r.int(2, 15), N = k * (a + b), big = Math.max(a, b) * k, small = Math.min(a, b) * k;
  const m = mcq(r, big, [[small, 'حسبت الجزء الأصغر وليس الأكبر.'], [N / 2, 'قسمت الكمية بالتساوي متجاهلاً النسبة.'], [Math.max(a, b) * N / Math.min(a, b) / (a + b) | 0, null], [N - a, null]], null, { near: nearInt(big, 6) });
  return { d: 1, q: 'قُسِّم `' + N + '` كجم من الإمدادات بين وحدتين بنسبة `' + a + ' : ' + b + '`. ما نصيب الوحدة ذات النصيب الأكبر؟', m, e: 'عدد الأجزاء ' + (a + b) + '، الجزء الواحد = ' + N + ' ÷ ' + (a + b) + ' = ' + k + '، النصيب الأكبر = ' + Math.max(a, b) + ' × ' + k + ' = ' + big + '.' };
};

T.lin_eq = r => {
  const x = r.int(-10, 12), a = r.pick([2, 3, 4, 5, 6, 7, 8, -2, -3, -4]), b = r.int(-20, 20) || 5, c = a * x + b;
  const m = mcq(r, x, [[(c + b) / a, 'نقلت b للطرف الآخر دون أن تعكس إشارتها.'], [(c - b) * a, 'ضربت في a بدلاً من القسمة عليها.'], [c / a - b, 'قسمت على a قبل نقل b بشكل خاطئ.'], [-x, 'خطأ في الإشارة.']], null, { near: nearInt(x, 4) });
  return { d: Math.abs(a) > 4 || b < 0 ? 2 : 1, q: 'حل المعادلة `' + poly([[a, 'x'], [b, '']]) + ' = ' + num(c) + '`:', m: m && { ...m, options: m.options.map(o => 'x = ' + o) }, e: poly([[a, 'x']]) + ' = ' + num(c) + ' − (' + num(b) + ') = ' + num(c - b) + ' ⇒ x = ' + num(x) + '.' };
};

T.exponents = r => {
  const base = r.pick([2, 3, 5, 7, 'x', 'a']), m1 = r.int(2, 9), n1 = r.int(2, 6);
  const kind = r.pick(['mul', 'div', 'pow']);
  let c, q, ds;
  if (kind === 'mul') { c = m1 + n1; q = '`' + base + sup(m1) + ' × ' + base + sup(n1) + ' = ' + base + '^?`'; ds = [[m1 * n1, 'ضربت الأسس — عند ضرب القوى ذات الأساس الواحد نجمع الأسس.'], [m1 - n1, 'طرحت الأسس — الطرح يكون عند القسمة.'], [m1 + n1 + 1, null]]; }
  else if (kind === 'div') { if (m1 <= n1) return null; c = m1 - n1; q = '`' + base + sup(m1) + ' ÷ ' + base + sup(n1) + ' = ' + base + '^?`'; ds = [[m1 + n1, 'جمعت الأسس — عند القسمة نطرح الأسس.'], [m1 / n1 | 0 || 1, 'قسمت الأسس بدلاً من طرحها.'], [n1 - m1, 'طرحت بترتيب معكوس.']]; }
  else { c = m1 * n1; q = '`(' + base + sup(m1) + ')' + sup(n1) + ' = ' + base + '^?`'; ds = [[m1 + n1, 'جمعت الأسس — قوة القوة نضرب فيها الأسس.'], [Math.pow(m1, n1), 'رفعت الأس للقوة بدلاً من ضربه.'], [c + 1, null]]; }
  const m = mcq(r, c, ds, null, { near: nearInt(c, 3) });
  return { d: kind === 'pow' ? 2 : 1, q: 'أوجد قيمة الأس المجهول: ' + q, m, e: 'قانون الأسس يعطي الأس ' + c + '.' };
};

T.sqrt_simplify = r => {
  const a = r.int(2, 9), b = r.pick([2, 3, 5, 6, 7, 10, 11]);
  const n = a * a * b;
  const m = mcq(r, a + '√' + b, [[b + '√' + a, 'بدّلت بين العدد خارج الجذر والعدد داخله.'], [(a * a) + '√' + b, 'أخرجت المربع الكامل دون أخذ جذره.'], [(a + 1) + '√' + b, 'اخترت مربعاً كاملاً خاطئاً.'], [(2 * a) + '√' + b, null]], v => v);
  return { d: n > 150 ? 2 : 1, q: 'الصورة المبسطة للمقدار `√' + n + '` هي:', m, e: '√' + n + ' = √(' + (a * a) + ' × ' + b + ') = ' + a + '√' + b + '.' };
};

const TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20], [7, 24, 25], [20, 21, 29], [9, 40, 41], [15, 20, 25], [10, 24, 26], [12, 35, 37]];
T.pythagoras = r => {
  const [a, b, c] = r.pick(TRIPLES);
  if (r.chance(0.5)) {
    const m = mcq(r, c, [[a + b, 'جمعت الضلعين مباشرة — نجمع مربعيهما ثم نأخذ الجذر.'], [a * a + b * b, 'نسيت أخذ الجذر التربيعي في النهاية.'], [b - a, null]], null, { near: nearInt(c, 3) });
    return { d: 1, q: 'مثلث قائم الزاوية طولا ضلعي القائمة `' + a + '` سم و`' + b + '` سم. طول الوتر:', m, e: 'c = √(' + a + '² + ' + b + '²) = √' + (a * a + b * b) + ' = ' + c + ' سم.' };
  }
  const m = mcq(r, b, [[Math.round(Math.sqrt(c * c + a * a) * 10) / 10, 'جمعت مربعي الوتر والضلع — لإيجاد ضلع نطرح: b² = c² − a².'], [c - a, 'طرحت الأطوال مباشرة بدلاً من طرح المربعات.'], [c * c - a * a, 'نسيت أخذ الجذر التربيعي.']], null, { near: nearInt(b, 3) });
  return { d: 2, q: 'مثلث قائم الزاوية طول وتره `' + c + '` سم وطول أحد ضلعي القائمة `' + a + '` سم. طول الضلع الآخر:', m, e: 'b = √(' + c + '² − ' + a + '²) = √' + (c * c - a * a) + ' = ' + b + ' سم.' };
};

T.expand_square = r => {
  const a = r.int(1, 12) * (r.chance(.5) ? 1 : -1), v = r.pick(['x', 'y', 'a']);
  const sq = v + '²';
  const right = poly([[1, sq], [2 * a, v], [a * a, '']]);
  const m = mcq(r, right, [[poly([[1, sq], [a * a, '']]), 'نسيت الحد الأوسط 2ab — مربع المجموع ليس مجموع المربعات.'], [poly([[1, sq], [a, v], [a * a, '']]), 'نسيت ضرب الحد الأوسط في 2.'], [poly([[1, sq], [2 * a, v], [-a * a, '']]), 'مربع أي عدد موجب دائماً، فالحد الأخير يكون +' + (a * a) + '.'], [poly([[1, sq], [-2 * a, v], [a * a, '']]), 'خطأ في إشارة الحد الأوسط.']], x => x);
  return { d: Math.abs(a) > 6 ? 2 : 1, q: 'مفكوك المقدار `(' + poly([[1, v], [a, '']]) + ')²` هو:', m: m && { ...m, optionsLtr: true }, e: '(' + v + ' ' + (a < 0 ? '−' : '+') + ' ' + Math.abs(a) + ')² = ' + right + '.' };
};

T.circle_area = r => {
  const rad = r.int(2, 15), useD = r.chance(0.4);
  const c = rad * rad;
  const fmt = v => (v === 1 ? '' : v) + 'π';
  const ds = useD ? [[4 * c, 'استخدمت القطر بدلاً من نصف القطر.'], [2 * rad, 'حسبت المحيط ÷ 2 بدلاً من المساحة.'], [4 * rad, 'حسبت المحيط (2πr) بدلاً من المساحة.']]
    : [[2 * rad, 'حسبت المحيط 2πr بدلاً من المساحة πr².'], [rad, 'نسيت تربيع نصف القطر.'], [4 * c, 'ضاعفت نصف القطر قبل التربيع.']];
  const m = mcq(r, c, ds, v => fmt(v) + ' سم²', { near: nearInt(c, 5) });
  return { d: useD ? 2 : 1, q: 'نافذة رصد دائرية ' + (useD ? 'طول قطرها `' + 2 * rad + '` سم' : 'طول نصف قطرها `' + rad + '` سم') + '. مساحتها بدلالة π:', m, e: 'المساحة = π × ' + rad + '² = ' + c + 'π سم².' };
};

T.linear_func = r => {
  const mm = r.int(-6, 6) || 2, c = r.int(-10, 10), x = r.int(-6, 6);
  const y = mm * x + c;
  const m = mcq(r, y, [[mm + c * x, 'بدّلت بين الميل والجزء المقطوع.'], [mm * x - c, 'خطأ في إشارة الجزء المقطوع.'], [-(mm * x) + c, 'خطأ في إشارة حاصل الضرب.']], null, { near: nearInt(y, 5) });
  return { d: x < 0 && mm < 0 ? 2 : 1, q: 'إذا كانت `y = ' + poly([[mm, 'x'], [c, '']]) + '` فإن قيمة y عندما `x = ' + num(x) + '` تساوي:', m, e: 'y = ' + num(mm) + ' × (' + num(x) + ') + (' + num(c) + ') = ' + num(y) + '.' };
};

T.lin_ineq = r => {
  const a = r.pick([2, 3, 4, 5, -2, -3, -4, -5]), t = r.int(-8, 8); if (t === 0) return null;
  const b = r.int(-10, 10), c = a * t + b, sym = r.pick(['<', '>']);
  // ax + b sym c  →  x sym' t  (flip if a < 0)
  const flip = a < 0;
  const solSym = flip ? (sym === '<' ? '>' : '<') : sym;
  const opp = solSym === '<' ? '>' : '<';
  const right = 'x ' + solSym + ' ' + num(t);
  const m = mcq(r, right, [['x ' + opp + ' ' + num(t), flip ? 'نسيت قلب اتجاه المتباينة عند القسمة على عدد سالب.' : 'قلبت اتجاه المتباينة دون داعٍ — القسمة هنا على عدد موجب.'], ['x ' + solSym + ' ' + num(-t), 'خطأ في إشارة الناتج.'], ['x ' + opp + ' ' + num(-t), 'خطأ في الإشارة وفي اتجاه المتباينة معاً.']], v => v);
  return { d: flip ? 2 : 1, q: 'مجموعة حل المتباينة `' + poly([[a, 'x'], [b, '']]) + ' ' + sym + ' ' + num(c) + '`:', m, e: poly([[a, 'x']]) + ' ' + sym + ' ' + num(c - b) + ' ⇒ بالقسمة على ' + num(a) + (flip ? ' (سالب فينقلب الاتجاه)' : '') + ': ' + right + '.' };
};

T.systems = r => {
  const x = r.int(-6, 12), y = r.int(-6, 12); if (x === y) return null;
  if (r.chance(0.55)) {
    const s = x + y, d = x - y;
    const m = mcq(r, x, [[y, 'هذه قيمة y وليست x.'], [s + d, 'جمعت المعادلتين لكن نسيت القسمة على 2.'], [(s - d) / 2 === x ? x + 1 : (s - d) / 2, 'طرحت المعادلتين فحصلت على y وليس x.']], null, { near: nearInt(x, 4) });
    return { d: 1, q: 'إذا كان `x + y = ' + num(s) + '` و `x − y = ' + num(d) + '` فإن قيمة x:', m, e: 'بالجمع: 2x = ' + num(s + d) + ' ⇒ x = ' + num(x) + '.' };
  }
  const a = r.int(2, 4), b = r.int(1, 3), c = r.int(1, 3);
  const e1 = a * x + b * y, e2 = c * x - b * y;
  const m = mcq(r, x, [[y, 'هذه قيمة y وليست x.'], [e1 + e2, 'نسيت القسمة على معامل x بعد الحذف.'], [-x, 'خطأ في الإشارة.']], null, { near: nearInt(x, 4) });
  return { d: 3, q: 'حل النظام: `' + poly([[a, 'x'], [b, 'y']]) + ' = ' + num(e1) + '` ، `' + poly([[c, 'x'], [-b, 'y']]) + ' = ' + num(e2) + '`. قيمة x:', m, e: 'بجمع المعادلتين يُحذف y: ' + (a + c) + 'x = ' + num(e1 + e2) + ' ⇒ x = ' + num(x) + '.' };
};

T.quad_factor = r => {
  const p = r.int(-9, 9), q = r.int(-9, 9); if (p === 0 || q === 0 || p === q) return null;
  const B = -(p + q), C = p * q;
  const fmt = s => { const [u, v] = s.slice().sort((a, b) => a - b); return 'x = ' + num(u) + ' أو x = ' + num(v); };
  const m = mcq(r, [p, q], [[[-p, -q], 'أخذت الأعداد من داخل الأقواس بنفس إشارتها — إذا (x − p) = 0 فإن x = p.'], [[p, -q], 'خطأ في إشارة أحد الجذرين.'], [[-p, q], 'خطأ في إشارة أحد الجذرين.'], [[B, C], 'كتبت المعاملات وليس الجذور.']], fmt);
  return { d: Math.abs(C) > 30 ? 3 : 2, q: 'جذرا المعادلة `' + poly([[1, 'x²'], [B, 'x'], [C, '']]) + ' = 0` هما:', m: m && { ...m, optionsLtr: true }, e: poly([[1, 'x²'], [B, 'x'], [C, '']]) + ' = (x ' + (p < 0 ? '+ ' + (-p) : '− ' + p) + ')(x ' + (q < 0 ? '+ ' + (-q) : '− ' + q) + ') ⇒ x = ' + num(p) + ' أو x = ' + num(q) + '.' };
};

T.slope = r => {
  const x1 = r.int(-6, 6), y1 = r.int(-6, 6), x2 = r.int(-6, 6), y2 = r.int(-6, 6);
  if (x1 === x2 || y1 === y2) return null;
  const s = new Frac(y2 - y1, x2 - x1);
  const ds = [[new Frac(x2 - x1, y2 - y1), 'قسمت التغير في x على التغير في y — الميل = Δy ÷ Δx.'], [new Frac(-(y2 - y1), x2 - x1), 'طرحت بترتيب مختلف في البسط والمقام فانعكست الإشارة.']];
  if (x1 + x2 !== 0) ds.push([new Frac(y2 + y1, x2 + x1), 'جمعت الإحداثيات بدلاً من طرحها.']);
  const m = mcq(r, s, ds, null, { near: rr => s.add(new Frac(rr.int(1, 3), 1)) });
  return { d: s.d === 1 ? 1 : 2, q: 'ميل المستقيم المار بالنقطتين `(' + num(x1) + ', ' + num(y1) + ')` و `(' + num(x2) + ', ' + num(y2) + ')`:', m, e: '(' + num(y2) + ' − ' + (y1 < 0 ? '(' + num(y1) + ')' : y1) + ') ÷ (' + num(x2) + ' − ' + (x1 < 0 ? '(' + num(x1) + ')' : x1) + ') = ' + num(y2 - y1) + '/' + num(x2 - x1) + ' = ' + s + '.' };
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
    const m = mcq(r, mean, [[med2, 'هذا هو الوسيط وليس الوسط الحسابي.'], [Math.round(s2 / (n - 1) * 10) / 10, 'قسمت على عدد خاطئ من القيم.'], [vals[(n - 1) / 2], 'أخذت القيمة الوسطى دون حساب المتوسط.']], null, { near: nearInt(mean, 3) });
    return { d: 1, q: 'قراءات حساس الحرارة: `' + vals.join(' ، ') + '`. الوسط الحسابي لها:', m, e: 'المجموع ' + s2 + ' ÷ ' + n + ' = ' + mean + '.' };
  }
  const unsortedMid = vals[(n - 1) / 2];
  const m = mcq(r, med, [[unsortedMid, 'أخذت القيمة الوسطى قبل ترتيب البيانات.'], [Math.round(vals.reduce((a, b) => a + b, 0) / n * 10) / 10, 'حسبت الوسط الحسابي وليس الوسيط.'], [sorted[(n - 1) / 2 + 1], 'اخترت قيمة مجاورة للوسيط.']], null, { near: nearInt(med, 3) });
  return { d: 2, q: 'وسيط القيم: `' + vals.join(' ، ') + '` هو:', m, e: 'بعد الترتيب: ' + sorted.join(' ، ') + ' ← القيمة في المنتصف = ' + med + '.' };
};

T.probability = r => {
  const R = r.int(1, 9), B = r.int(1, 9), G = r.int(1, 9), tot = R + B + G;
  const colors = [['الحمراء', R], ['الزرقاء', B], ['الخضراء', G]];
  const [name, k] = r.pick(colors);
  const c = new Frac(k, tot);
  const m = mcq(r, c, [[k === tot - k ? new Frac(k, tot + 1) : new Frac(k, tot - k), 'قسمت على عدد الكرات الأخرى بدلاً من العدد الكلي.'], [new Frac(tot - k, tot), 'حسبت احتمال عدم الحدوث (المكمّل).'], [new Frac(1, tot), 'هذا احتمال سحب كرة معينة واحدة فقط.']], null, { near: rr => new Frac(rr.int(1, tot - 1), tot) });
  return { d: 1, q: 'صندوق عينات به `' + R + '` كرات حمراء و`' + B + '` زرقاء و`' + G + '` خضراء. سُحبت كرة عشوائياً، احتمال أن تكون ' + name + ':', m, e: 'الاحتمال = ' + k + ' ÷ ' + tot + ' = ' + c + '.' };
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
  const m = mcq(r, val, [[conf1, 'خلطت بين قيمة ' + A.t + ' وقيمة نسبة مثلثية أخرى.'], [conf2, 'قيمة ' + B.t + ' غير صحيحة — راجع جدول الزوايا الخاصة.'], [a === 1 ? val.add(new Frac(1, 2)) : conf3, a === 1 ? null : 'نسيت ضرب ' + A.t + ' في المعامل ' + a + '.']], null, { near: rr => val.add(new Frac(rr.int(1, 4), 2)) });
  return { d: A.sq || B.sq ? 2 : 1, q: 'قيمة المقدار `' + (a > 1 ? a + ' ' : '') + A.t + ' ' + op + ' ' + B.t + '` تساوي:', m, e: A.t + ' = ' + A.v + ' ، ' + B.t + ' = ' + B.v + ' ⇒ الناتج = ' + val + '.' };
};

T.discriminant = r => {
  const a = r.int(1, 4) * (r.chance(.8) ? 1 : -1), b = r.int(-9, 9), c = r.int(-9, 9);
  const D = b * b - 4 * a * c;
  if (r.chance(0.5)) {
    const m = mcq(r, D, [[b * b + 4 * a * c, 'خطأ في الإشارة: Δ = b² − 4ac.'], [b - 4 * a * c, 'نسيت تربيع b.'], [b * b - 2 * a * c, 'استخدمت 2ac بدلاً من 4ac.']], null, { near: nearInt(D, 6) });
    return { d: 2, q: 'قيمة المميز للمعادلة `' + poly([[a, 'x²'], [b, 'x'], [c, '']]) + ' = 0`:', m, e: 'Δ = (' + num(b) + ')² − 4 × ' + num(a) + ' × ' + num(c) + ' = ' + num(D) + '.' };
  }
  const opts = ['جذران حقيقيان مختلفان', 'جذر حقيقي مكرر (جذران متساويان)', 'لا توجد جذور حقيقية', 'ثلاثة جذور حقيقية'];
  const ci = D > 0 ? 0 : D === 0 ? 1 : 2;
  const notes = ['', '', '', 'المعادلة التربيعية لها جذران على الأكثر.'];
  const ds = opts.map((o, i) => [o, i === ci ? null : (notes[i] || 'إشارة المميز Δ = ' + num(D) + ' تحدد نوع الجذور: موجب ← جذران مختلفان، صفر ← مكرر، سالب ← لا جذور حقيقية.')]).filter((_, i) => i !== ci);
  const m = mcq(r, opts[ci], ds, v => v);
  return { d: 2, q: 'نوع جذري المعادلة `' + poly([[a, 'x²'], [b, 'x'], [c, '']]) + ' = 0`:', m, e: 'Δ = ' + num(D) + (D > 0 ? ' > 0' : D === 0 ? ' = 0' : ' < 0') + ' ⇒ ' + opts[ci] + '.' };
};

T.func_eval = r => {
  const a = r.int(-4, 4) || 1, b = r.int(-8, 8), c = r.int(-9, 9), k = r.int(-5, 5) || -2;
  const v = a * k * k + b * k + c;
  const m = mcq(r, v, [[-a * k * k + b * k + c, 'عوضت بالعدد السالب دون أقواس: (−k)² موجبة دائماً.'], [a * 2 * k + b * k + c, 'حسبت 2k بدلاً من k².'], [a * k * k - b * k + c, 'خطأ في إشارة الحد الأوسط.']], null, { near: nearInt(v, 5) });
  return { d: k < 0 ? 2 : 1, q: 'إذا كانت `f(x) = ' + poly([[a, 'x²'], [b, 'x'], [c, '']]) + '` فإن `f(' + num(k) + ')` تساوي:', m, e: 'f(' + num(k) + ') = ' + num(a) + '(' + num(k) + ')² + ' + num(b) + '(' + num(k) + ') + ' + num(c) + ' = ' + num(v) + '.' };
};

T.distance = r => {
  const [a, b, c] = r.pick(TRIPLES);
  const x1 = r.int(-8, 8), y1 = r.int(-8, 8), sx = r.chance(.5) ? 1 : -1, sy = r.chance(.5) ? 1 : -1;
  const x2 = x1 + sx * a, y2 = y1 + sy * b;
  const m = mcq(r, c, [[a + b, 'جمعت فرقي الإحداثيات دون تربيع.'], [a * a + b * b, 'نسيت أخذ الجذر التربيعي.'], [Math.abs((x2 + x1)) + Math.abs(y2 + y1) || c + 2, 'جمعت الإحداثيات بدلاً من طرحها.']], null, { near: nearInt(c, 3) });
  return { d: 2, q: 'المسافة بين القاعدة `(' + num(x1) + ', ' + num(y1) + ')` والمسبار `(' + num(x2) + ', ' + num(y2) + ')` بالوحدات:', m, e: '√(' + a + '² + ' + b + '²) = √' + (a * a + b * b) + ' = ' + c + '.' };
};

T.vectors = r => {
  const [a, b, c] = r.pick(TRIPLES); const sa = r.chance(.5) ? -1 : 1, sb = r.chance(.5) ? -1 : 1;
  const m = mcq(r, c, [[a + b, 'جمعت المركبتين — المعيار هو الجذر التربيعي لمجموع مربعيهما.'], [a * a + b * b, 'نسيت الجذر التربيعي.'], [Math.abs(sa * a + sb * b) || c + 1, 'جمعت المركبتين بإشارتيهما.']], null, { near: nearInt(c, 3) });
  return { d: 1, q: 'معيار متجه سرعة المركبة `v = (' + num(sa * a) + ', ' + num(sb * b) + ')`:', m, e: '‖v‖ = √(' + a + '² + ' + b + '²) = ' + c + '.' };
};

T.arith_seq = r => {
  const a1 = r.int(-10, 20), d = r.int(-6, 9) || 3, n = r.int(8, 40);
  if (r.chance(0.7)) {
    const an = a1 + (n - 1) * d;
    const m = mcq(r, an, [[a1 + n * d, 'استخدمت n بدلاً من (n − 1).'], [a1 * n + d, 'خلطت بين الحد الأول والأساس في القانون.'], [n * d, 'نسيت إضافة الحد الأول.']], null, { near: nearInt(an, 6) });
    return { d: 2, q: 'متتابعة حسابية حدها الأول `' + num(a1) + '` وأساسها `' + num(d) + '`. الحد رقم `' + n + '` يساوي:', m, e: 'aₙ = ' + num(a1) + ' + (' + n + ' − 1)(' + num(d) + ') = ' + num(an) + '.' };
  }
  const n2 = r.int(5, 20), S = n2 * (2 * a1 + (n2 - 1) * d) / 2;
  const m = mcq(r, S, [[n2 * (2 * a1 + n2 * d) / 2, 'استخدمت n بدلاً من (n − 1) في قانون المجموع.'], [n2 * (a1 + (n2 - 1) * d), 'نسيت القسمة على 2.'], [a1 + (n2 - 1) * d, 'حسبت الحد الأخير وليس المجموع.']], null, { near: nearInt(S, 10) });
  return { d: 3, q: 'مجموع أول `' + n2 + '` حداً من متتابعة حسابية حدها الأول `' + num(a1) + '` وأساسها `' + num(d) + '`:', m, e: 'Sₙ = n/2 (2a₁ + (n − 1)d) = ' + n2 + '/2 × (' + num(2 * a1) + ' + ' + num((n2 - 1) * d) + ') = ' + num(S) + '.' };
};

T.geo_seq = r => {
  const a1 = r.pick([1, 2, 3, 5]), q = r.pick([2, 3, -2]), n = r.int(3, 7);
  const an = a1 * Math.pow(q, n - 1);
  const m = mcq(r, an, [[a1 * Math.pow(q, n), 'استخدمت الأس n بدلاً من (n − 1).'], [a1 * q * (n - 1), 'ضربت في (n − 1) بدلاً من الرفع للقوة.'], [Math.pow(a1 * q, n - 1), 'رفعت حاصل ضرب الحد الأول في الأساس للقوة.']], null, { near: nearInt(an, 8) });
  return { d: 2, q: 'متتابعة هندسية حدها الأول `' + a1 + '` وأساسها `' + num(q) + '`. الحد رقم `' + n + '`:', m, e: 'aₙ = ' + a1 + ' × (' + num(q) + ')' + sup(n - 1) + ' = ' + num(an) + '.' };
};

T.logs = r => {
  const b = r.pick([2, 3, 5, 10]);
  const maxK = { 2: 10, 3: 6, 5: 4, 10: 5 }[b];
  const k = r.int(1, maxK), x = Math.pow(b, k);
  if (r.chance(0.6)) {
    const m = mcq(r, k, [[x / b, 'قسمت العدد على الأساس بدلاً من إيجاد الأس.'], [k + 1, 'عددت الأس خطأً.'], [b * k, null]], null, { near: nearInt(k, 2) });
    return { d: 1, q: 'قيمة `log' + sub(b) + '(' + x + ')`:', m, e: b + sup(k) + ' = ' + x + ' ⇒ log' + sub(b) + '(' + x + ') = ' + k + '.' };
  }
  let u = r.int(1, k - 1 || 1); if (u >= k) u = 0;
  const p = Math.pow(b, u) * r.pick([1]), qv = x / p;
  if (!Number.isInteger(qv) || p === 1) return null;
  const m = mcq(r, k, [[Math.log(p + qv) / Math.log(b) % 1 === 0 ? Math.log(p + qv) / Math.log(b) : k + 2, 'جمعت العددين داخل اللوغاريتم — مجموع اللوغاريتمين = لوغاريتم حاصل الضرب.'], [k - 1, null], [p * qv / b, 'قسمت على الأساس بدلاً من أخذ اللوغاريتم.']], null, { near: nearInt(k, 2) });
  return { d: 2, q: 'قيمة `log' + sub(b) + '(' + p + ') + log' + sub(b) + '(' + qv + ')`:', m, e: 'log' + sub(b) + '(' + p + ' × ' + qv + ') = log' + sub(b) + '(' + x + ') = ' + k + '.' };
};
function sub(n) { const S = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' }; return String(n).split('').map(c => S[c]).join(''); }

T.limits = r => {
  if (r.chance(0.6)) {
    const a = r.int(-9, 9) || 4;
    const m = mcq(r, 2 * a, [[0, 'عوضت مباشرة في البسط فقط — هنا تظهر الصورة 0/0 ويجب التحليل أولاً.'], [a, 'بعد الاختصار نسيت أن x + a عند x = a تساوي 2a.'], [a * a, 'خلطت بين x² و a.']], null, { near: nearInt(2 * a, 4) });
    return { d: 3, q: 'قيمة `lim (x → ' + num(a) + ') (x² − ' + (a * a) + ') / (x ' + (a < 0 ? '+ ' + (-a) : '− ' + a) + ')`:', m, e: '(x² − ' + (a * a) + ')/(x ' + (a < 0 ? '+ ' + (-a) : '− ' + a) + ') = x ' + (a < 0 ? '− ' + (-a) : '+ ' + a) + ' ⇒ النهاية = ' + num(2 * a) + '.' };
  }
  const p = r.int(-3, 4) || 1, q = r.int(-6, 6), c = r.int(-9, 9), a = r.int(-4, 4);
  const v = p * a * a + q * a + c;
  const m = mcq(r, v, [[-p * a * a + q * a + c, 'خطأ في تربيع العدد السالب.'], [p * a + q * a + c, 'لم تربّع قيمة x في الحد الأول.'], [c, 'اعتبرت النهاية تساوي الحد الثابت فقط.']], null, { near: nearInt(v, 4) });
  return { d: 2, q: 'قيمة `lim (x → ' + num(a) + ') (' + poly([[p, 'x²'], [q, 'x'], [c, '']]) + ')`:', m, e: 'دالة كثيرة حدود متصلة، نعوض مباشرة: ' + num(v) + '.' };
};

T.derivative = r => {
  const a = r.int(1, 6) * (r.chance(.8) ? 1 : -1), n = r.int(2, 4), b = r.int(-8, 8), c = r.int(-9, 9), k = r.int(-3, 3);
  const f1 = a * n * Math.pow(k, n - 1) + b;
  const m = mcq(r, f1, [[a * n * Math.pow(k, n) + b * k, 'ضربت في الأس لكن لم تنقص الأس بمقدار 1.'], [a * Math.pow(k, n - 1) + b, 'أنقصت الأس لكن نسيت الضرب في الأس القديم.'], [a * n * Math.pow(k, n - 1) + b + c, 'مشتقة الثابت = صفر، لا تضفه.'], [a * Math.pow(k, n) + b * k + c, 'عوضت في الدالة الأصلية f وليس في المشتقة.']], null, { near: nearInt(f1, 6) });
  return { d: n > 2 || k < 0 ? 3 : 2, q: 'إذا كانت `f(x) = ' + poly([[a, 'x' + sup(n)], [b, 'x'], [c, '']]) + '` فإن `f′(' + num(k) + ')` تساوي:', m, e: 'f′(x) = ' + poly([[a * n, n - 1 === 1 ? 'x' : 'x' + sup(n - 1)], [b, '']]) + ' ⇒ f′(' + num(k) + ') = ' + num(f1) + '.' };
};

T.integral = r => {
  if (r.chance(0.5)) {
    const a = r.int(1, 5) * 2, b = r.int(-6, 6), k = r.int(1, 6);
    const v = a * k * k / 2 + b * k;
    const m = mcq(r, v, [[a * k * k + b * k, 'نسيت القسمة على (n + 1) = 2.'], [a * k + b, 'عوضت في الدالة نفسها بدلاً من دالتها الأصلية.'], [a * k * k / 2, 'نسيت تكامل الحد الثابت.']], null, { near: nearInt(v, 5) });
    return { d: 2, q: 'قيمة `∫₀' + sup(k) + ' (' + poly([[a, 'x'], [b, '']]) + ') dx`:', m, e: '[' + poly([[a / 2, 'x²'], [b, 'x']]) + ']₀' + sup(k) + ' = ' + num(v) + '.' };
  }
  const lo = r.int(0, 2), hi = r.int(lo + 1, 4);
  const v = Math.pow(hi, 3) - Math.pow(lo, 3);
  const m = mcq(r, v, [[Math.pow(hi, 3), 'نسيت طرح قيمة الحد الأدنى F(a).'], [3 * (Math.pow(hi, 3) - Math.pow(lo, 3)), 'لم تقسم على (n + 1) = 3.'], [3 * hi * hi - 3 * lo * lo, 'عوضت في الدالة المكاملة وليس في دالتها الأصلية.']], null, { near: nearInt(v, 6) });
  return { d: 3, q: 'قيمة `∫' + sub(lo) + sup(hi) + ' 3x² dx`:', m, e: '[x³] من ' + lo + ' إلى ' + hi + ' = ' + Math.pow(hi, 3) + ' − ' + Math.pow(lo, 3) + ' = ' + v + '.' };
};

module.exports = T;
