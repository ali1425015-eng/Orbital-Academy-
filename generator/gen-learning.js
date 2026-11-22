/* ==========================================================================
   Learning track (outside the school curriculum) — every generator takes
   `lang` ('ar' | 'en') and writes the question, the options, the worked
   explanation and the misconception note of every wrong option in that
   language. English-subject questions are always in English; only their
   explanations follow `lang`.
   ========================================================================== */
'use strict';
const { Frac, num, sup, mcq, nearInt } = require('./common');
const ENG = require('./gen-english');

const FILL = { ar: 'قيمة قريبة لكنها ناتجة عن خطأ في الحساب — راجع خطواتك.', en: 'A near miss caused by a calculation slip — check each step.' };
const X = (lang) => (a, e) => (lang === 'ar' ? a : e);
const opt = (lang, extra) => Object.assign({ filler: FILL[lang] }, extra || {});
const seqText = (arr) => '`' + arr.map(num).join(', ') + ', ?`';

/* ============================== IQ ============================== */
const IQ = {};

IQ.iq_numseq = (r, lang) => {
  const L = X(lang), kind = r.pick(['arith', 'arith', 'geo', 'alt', 'squares', 'growing', 'fib']);
  let terms = [], next, ds, e, d = 1;
  if (kind === 'arith') {
    const a = r.int(1, 40), k = r.pick([2, 3, 4, 5, 6, 7, 8, 9, 11, 12, -3, -4, -5]);
    for (let i = 0; i < 5; i++) terms.push(a + i * k); next = a + 5 * k;
    ds = [[next + k, L('أضفت الفرق مرتين.', 'You added the difference twice.')], [next + 1, L('الفرق الثابت هو ' + num(k) + ' وليس ' + num(k + 1) + '.', 'The constant difference is ' + num(k) + ', not ' + num(k + 1) + '.')], [terms[4] * 2, L('النمط جمع ثابت وليس مضاعفة.', 'The pattern adds a constant; it does not double.')]];
    e = L('كل حد = الحد السابق ' + (k > 0 ? '+ ' + k : '− ' + (-k)) + ' ← ' + next + '.', 'Each term = previous term ' + (k > 0 ? '+ ' + k : '− ' + (-k)) + ' → ' + next + '.');
  } else if (kind === 'geo') {
    const a = r.int(1, 5), q = r.pick([2, 3]); for (let i = 0; i < 5; i++) terms.push(a * Math.pow(q, i)); next = terms[4] * q; d = 2;
    ds = [[terms[4] + (terms[4] - terms[3]), L('اعتبرت الفرق ثابتاً، لكن النسبة هي الثابتة (×' + q + ').', 'You assumed a constant difference, but the ratio (×' + q + ') is constant.')], [terms[4] * (q + 1), L('المضاعف هو ' + q + ' وليس ' + (q + 1) + '.', 'The multiplier is ' + q + ', not ' + (q + 1) + '.')], [terms[4] + q, L('أضفت ' + q + ' بدلاً من الضرب فيه.', 'You added ' + q + ' instead of multiplying by it.')]];
    e = L('كل حد = السابق × ' + q + ' ← ' + next + '.', 'Each term = previous × ' + q + ' → ' + next + '.');
  } else if (kind === 'alt') {
    const a = r.int(1, 20), p = r.int(2, 9), q = r.int(1, 9); if (p === q) return null;
    let v = a; terms.push(v); for (let i = 1; i < 6; i++) { v += (i % 2 ? p : q); terms.push(v); } next = v + p; d = 2;
    ds = [[v + q, L('النمط يتبادل: +' + p + ' ثم +' + q + '، والخطوة التالية +' + p + '.', 'The pattern alternates +' + p + ', +' + q + '; the next step is +' + p + '.')], [v + p + q, L('أضفت الخطوتين معاً.', 'You added both steps.')], [v + Math.round((p + q) / 2), L('استخدمت متوسط الخطوتين بدلاً من التبادل.', 'You used the average step instead of alternating.')]];
    e = L('تبادل +' + p + ' و +' + q + ' ← ' + v + ' + ' + p + ' = ' + next + '.', 'Alternating +' + p + ' and +' + q + ' → ' + v + ' + ' + p + ' = ' + next + '.');
  } else if (kind === 'squares') {
    const s0 = r.int(1, 8), add = r.pick([0, 0, 1, -1, 2]); for (let i = 0; i < 5; i++) terms.push((s0 + i) * (s0 + i) + add); next = (s0 + 5) * (s0 + 5) + add; d = 3;
    ds = [[terms[4] + (terms[4] - terms[3]), L('الفروق ليست ثابتة؛ إنها تزيد بمقدار 2 كل مرة (مربعات).', 'The differences are not constant; they grow by 2 each time (squares).')], [next + 2, L('خطأ في الفرق الأخير.', 'Slip in the last difference.')], [(s0 + 5) * 2 + add, L('ضاعفت العدد بدلاً من تربيعه.', 'You doubled instead of squaring.')]];
    e = L('الحدود مربعات أعداد متتالية' + (add ? (add > 0 ? ' + ' + add : ' − ' + (-add)) : '') + ': ' + (s0 + 5) + '²' + (add ? (add > 0 ? ' + ' + add : ' − ' + (-add)) : '') + ' = ' + next + '.', 'The terms are consecutive squares' + (add ? (add > 0 ? ' + ' + add : ' − ' + (-add)) : '') + ': ' + (s0 + 5) + '²' + (add ? (add > 0 ? ' + ' + add : ' − ' + (-add)) : '') + ' = ' + next + '.');
  } else if (kind === 'growing') {
    const a = r.int(1, 15), st = r.int(1, 4); let v = a, k = st; terms.push(v); for (let i = 1; i < 5; i++) { v += k; k++; terms.push(v); } next = v + k; d = 2;
    ds = [[v + k - 1, L('الفرق يزيد 1 كل مرة، فالفرق التالي ' + k + '.', 'The difference grows by 1, so the next one is ' + k + '.')], [v + k + 1, L('زدت الفرق مرتين.', 'You increased the difference twice.')], [v * 2, L('النمط ليس مضاعفة.', 'The pattern is not doubling.')]];
    e = L('الفروق ' + st + '، ' + (st + 1) + '، ' + (st + 2) + '… فالتالي +' + k + ' ← ' + next + '.', 'Differences ' + st + ', ' + (st + 1) + ', ' + (st + 2) + '… so next is +' + k + ' → ' + next + '.');
  } else {
    const a = r.int(1, 5), b = r.int(1, 6); terms = [a, b]; while (terms.length < 6) terms.push(terms[terms.length - 1] + terms[terms.length - 2]); next = terms[4] + terms[5]; d = 3;
    ds = [[terms[5] + (terms[5] - terms[4]), L('كل حد = مجموع الحدين السابقين، وليس فرقاً ثابتاً.', 'Each term is the sum of the two before it, not a constant difference.')], [terms[5] * 2, L('ليس مضاعفة؛ اجمع آخر حدين.', 'Not doubling; add the last two terms.')], [next + 1, L('خطأ في الجمع.', 'Addition slip.')]];
    e = L('كل حد = مجموع الحدين قبله: ' + terms[4] + ' + ' + terms[5] + ' = ' + next + '.', 'Each term = sum of the previous two: ' + terms[4] + ' + ' + terms[5] + ' = ' + next + '.');
  }
  const m = mcq(r, next, ds, null, opt(lang, { near: nearInt(next, 4) }));
  return { d, q: L('ما العدد التالي في المتتابعة؟\n', 'What number comes next?\n') + seqText(terms), m, e };
};

const ABC = { en: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), ar: 'أ ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي'.split(' ') };
IQ.iq_letters = (r, lang) => {
  const L = X(lang), A = ABC[lang], k = r.int(1, 4), n = 5, start = r.int(0, A.length - 1 - k * n);
  const seq = []; for (let i = 0; i < n; i++) seq.push(A[start + i * k]);
  const nx = start + n * k; if (nx >= A.length) return null;
  const ds = [];
  if (A[nx + 1]) ds.push([A[nx + 1], L('القفزة ' + k + ' حروف وليس ' + (k + 1) + '.', 'The jump is ' + k + ' letters, not ' + (k + 1) + '.')]);
  if (k > 1) ds.push([A[nx - 1], L('القفزة ' + k + ' حروف وليس ' + (k - 1) + '.', 'The jump is ' + k + ' letters, not ' + (k - 1) + '.')]);
  ds.push([A[start + (n - 1) * k + 1] || A[0], L('أخذت الحرف التالي مباشرة دون القفز.', 'You took the very next letter instead of jumping.')]);
  ds.push([A[nx + 2] || A[1], L('عددت القفزة خطأً.', 'You miscounted the jump.')]);
  const m = mcq(r, A[nx], ds, x => x, opt(lang));
  return { d: k > 2 ? 2 : 1, q: L('ما الحرف التالي؟\n', 'Which letter comes next?\n') + seq.join(lang === 'ar' ? '، ' : ', ') + (lang === 'ar' ? '، ؟' : ', ?'), m,
    e: L('نقفز ' + k + ' ' + (k === 1 ? 'حرفاً' : 'حروف') + ' كل مرة ← ' + A[nx] + '.', 'Jump ' + k + ' letter' + (k > 1 ? 's' : '') + ' each time → ' + A[nx] + '.') };
};

const CATS = [
  ['fruit', 'food', 'فاكهة', 'a fruit', [['تفاح', 'apple'], ['موز', 'banana'], ['برتقال', 'orange'], ['عنب', 'grape'], ['مانجو', 'mango'], ['كمثرى', 'pear'], ['خوخ', 'peach'], ['فراولة', 'strawberry']]],
  ['mammal', 'animal', 'حيوان ثديي', 'a mammal', [['أسد', 'lion'], ['حصان', 'horse'], ['قطة', 'cat'], ['فيل', 'elephant'], ['جمل', 'camel'], ['نمر', 'tiger'], ['أرنب', 'rabbit']]],
  ['planet', 'space', 'كوكب', 'a planet', [['عطارد', 'Mercury'], ['الزهرة', 'Venus'], ['المريخ', 'Mars'], ['المشتري', 'Jupiter'], ['زحل', 'Saturn'], ['نبتون', 'Neptune']]],
  ['color', 'color', 'لون', 'a colour', [['أحمر', 'red'], ['أزرق', 'blue'], ['أخضر', 'green'], ['أصفر', 'yellow'], ['بنفسجي', 'purple'], ['رمادي', 'grey']]],
  ['shape', 'shape', 'شكل هندسي', 'a shape', [['دائرة', 'circle'], ['مربع', 'square'], ['مثلث', 'triangle'], ['مستطيل', 'rectangle'], ['مسدس', 'hexagon']]],
  ['instrument', 'music', 'آلة موسيقية', 'a musical instrument', [['كمان', 'violin'], ['بيانو', 'piano'], ['جيتار', 'guitar'], ['طبلة', 'drum'], ['ناي', 'flute']]],
  ['vehicle', 'vehicle', 'وسيلة مواصلات', 'a vehicle', [['سيارة', 'car'], ['حافلة', 'bus'], ['قطار', 'train'], ['دراجة', 'bicycle'], ['شاحنة', 'truck']]],
  ['organ', 'body', 'عضو في جسم الإنسان', 'a body organ', [['القلب', 'heart'], ['الرئة', 'lung'], ['الكبد', 'liver'], ['الكلية', 'kidney'], ['المعدة', 'stomach']]]
];
IQ.iq_oddone = (r, lang) => {
  const L = X(lang), li = lang === 'ar' ? 0 : 1;
  if (r.chance(0.3)) {   // numbers: three primes + one odd composite (all odd, so "parity" can't single anything out)
    const primes = [3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47], comps = [9, 15, 21, 25, 27, 33, 35, 39, 45, 49];
    const ps = r.shuffle(primes).slice(0, 3), c = r.pick(comps);
    const m = mcq(r, c, ps.map(p => [p, L(p + ' عدد أولي مثل الباقين.', p + ' is prime like the others.')]), null, opt(lang));
    return { multi: true, tag: 'iq_oddone', d: 2, q: L('أي عدد لا ينتمي للمجموعة؟', 'Which number is the odd one out?'), m, e: L(c + ' ليس عدداً أولياً (يقبل القسمة على أعداد أخرى)، أما الباقي فأعداد أولية.', c + ' is not prime (it has other divisors); the others are prime.') };
  }
  const main = r.pick(CATS), other = r.pick(CATS.filter(c => c[1] !== main[1]));
  const three = r.shuffle(main[4]).slice(0, 3), odd = r.pick(other[4]);
  const m = mcq(r, odd[li], three.map(w => [w[li], L('«' + w[0] + '» ' + main[2] + ' مثل باقي الكلمات.', '"' + w[1] + '" is ' + main[3] + ' like the others.')]), x => x, opt(lang));
  return { multi: true, d: 1, q: L('أي كلمة لا تنتمي للمجموعة؟', 'Which word is the odd one out?'), m,
    e: L('«' + odd[0] + '» ' + other[2] + '، أما الباقي فـ' + main[2] + '.', '"' + odd[1] + '" is ' + other[3] + '; the others are each ' + main[3] + '.') };
};

const ANALOG = [
  [['طبيب', 'مستشفى', 'معلم'], ['doctor', 'hospital', 'teacher'], ['مدرسة', 'school'], [['طالب', 'student'], ['كتاب', 'book'], ['مستشفى', 'hospital']], ['المكان الذي يعمل فيه', 'the place where they work']],
  [['ساخن', 'بارد', 'طويل'], ['hot', 'cold', 'tall'], ['قصير', 'short'], [['كبير', 'big'], ['عالٍ', 'high'], ['عريض', 'wide']], ['المضاد', 'the opposite']],
  [['قلم', 'يكتب', 'سكين'], ['pen', 'write', 'knife'], ['يقطع', 'cut'], [['مطبخ', 'kitchen'], ['حاد', 'sharp'], ['شوكة', 'fork']], ['وظيفة الأداة', 'what the tool is used for']],
  [['جرو', 'كلب', 'قطيطة'], ['puppy', 'dog', 'kitten'], ['قطة', 'cat'], [['فأر', 'mouse'], ['أسد', 'lion'], ['حليب', 'milk']], ['الصغير والكبير من نفس الحيوان', 'the young and the adult of the same animal']],
  [['شمس', 'نهار', 'قمر'], ['sun', 'day', 'moon'], ['ليل', 'night'], [['نجمة', 'star'], ['سماء', 'sky'], ['ضوء', 'light']], ['الوقت الذي يظهر فيه', 'the time when it is seen']],
  [['عين', 'ترى', 'أذن'], ['eye', 'see', 'ear'], ['تسمع', 'hear'], [['صوت', 'sound'], ['أنف', 'nose'], ['رأس', 'head']], ['وظيفة العضو', 'what the organ does']],
  [['القاهرة', 'مصر', 'باريس'], ['Cairo', 'Egypt', 'Paris'], ['فرنسا', 'France'], [['لندن', 'London'], ['أوروبا', 'Europe'], ['إيطاليا', 'Italy']], ['العاصمة والدولة', 'capital and country']],
  [['ماء', 'سائل', 'جليد'], ['water', 'liquid', 'ice'], ['صلب', 'solid'], [['بارد', 'cold'], ['غاز', 'gas'], ['ماء', 'water']], ['حالة المادة', 'the state of matter']],
  [['إصبع اليد', 'يد', 'إصبع القدم'], ['finger', 'hand', 'toe'], ['قدم', 'foot'], [['ساق', 'leg'], ['ظفر', 'nail'], ['حذاء', 'shoe']], ['الجزء والكل', 'part and whole']],
  [['مربع', '4', 'مثلث'], ['square', '4', 'triangle'], ['3', '3'], [['4', '4'], ['5', '5'], ['6', '6']], ['عدد الأضلاع', 'the number of sides']],
  [['ترمومتر', 'حرارة', 'ساعة'], ['thermometer', 'temperature', 'clock'], ['الوقت', 'time'], [['حائط', 'wall'], ['ساعة يد', 'watch'], ['دقيقة', 'minute']], ['ما يقيسه الجهاز', 'what the instrument measures']],
  [['أسد', 'يزأر', 'كلب'], ['lion', 'roars', 'dog'], ['ينبح', 'barks'], [['يعض', 'bites'], ['قطة', 'cat'], ['ذيل', 'tail']], ['صوت الحيوان', 'the sound the animal makes']],
  [['كاتب', 'كتاب', 'رسّام'], ['author', 'book', 'painter'], ['لوحة', 'painting'], [['فرشاة', 'brush'], ['ألوان', 'colours'], ['متحف', 'museum']], ['ما يصنعه الشخص', 'what the person creates']],
  [['أسبوع', 'يوم', 'سنة'], ['week', 'day', 'year'], ['شهر', 'month'], [['ساعة', 'hour'], ['قرن', 'century'], ['أسبوع', 'week']], ['الوحدة الأصغر التي يتكون منها', 'the smaller unit it is made of']],
  [['طائر', 'عش', 'نحلة'], ['bird', 'nest', 'bee'], ['خلية', 'hive'], [['عسل', 'honey'], ['زهرة', 'flower'], ['جناح', 'wing']], ['المسكن', 'its home']],
  [['جاف', 'مبلل', 'فارغ'], ['dry', 'wet', 'empty'], ['ممتلئ', 'full'], [['خفيف', 'light'], ['مفتوح', 'open'], ['نظيف', 'clean']], ['المضاد', 'the opposite']]
];
IQ.iq_analogy = (r, lang) => {
  const L = X(lang), li = lang === 'ar' ? 0 : 1;
  if (r.chance(0.45)) {   // numeric analogies
    const k = r.pick(['x2', 'x3', 'sq', 'half', 'p5']), a = r.int(2, 12), c = r.int(2, 12); if (a === c) return null;
    const f = { x2: v => v * 2, x3: v => v * 3, sq: v => v * v, half: v => v / 2, p5: v => v + 5 }[k];
    const A = k === 'half' ? a * 2 : a, Cc = k === 'half' ? c * 2 : c;
    const ans = f(Cc), rule = { x2: L('×2', '×2'), x3: L('×3', '×3'), sq: L('التربيع', 'squaring'), half: L('القسمة على 2', 'halving'), p5: L('+5', '+5') }[k];
    const m = mcq(r, ans, [[Cc + (f(A) - A), L('أضفت الفرق نفسه بدلاً من تطبيق القاعدة (' + rule + ').', 'You added the same difference instead of applying the rule (' + rule + ').')], [ans + 1, L('خطأ حسابي.', 'Arithmetic slip.')], [Cc * 2 === ans ? Cc * 3 : Cc * 2, L('القاعدة هي ' + rule + '.', 'The rule is ' + rule + '.')]], null, opt(lang, { near: nearInt(ans, 5) }));
    return { d: k === 'sq' ? 2 : 1, q: L('إذا كان ', 'If ') + '`' + A + ' → ' + f(A) + '`' + L(' فإن ', ' then ') + '`' + Cc + ' → ?`', m, e: L('القاعدة: ' + rule + ' ← ' + Cc + ' → ' + ans + '.', 'Rule: ' + rule + ' → ' + Cc + ' → ' + ans + '.') };
  }
  const it = r.pick(ANALOG), w = it[li], ans = it[2][li], rel = it[4][li];
  const m = mcq(r, ans, it[3].map(x => [x[li], L('العلاقة هي ' + rel + '، و«' + x[0] + '» لا تحقق هذه العلاقة.', 'The relationship is ' + rel + '; "' + x[1] + '" does not fit it.')]), x => x, opt(lang));
  return { d: 1, q: L('«' + w[0] + '» بالنسبة لـ«' + w[1] + '» مثل «' + w[2] + '» بالنسبة لـ…؟', '"' + w[0] + '" is to "' + w[1] + '" as "' + w[2] + '" is to …?'), m, e: L('العلاقة: ' + rel + ' ← ' + ans + '.', 'Relationship: ' + rel + ' → ' + ans + '.') };
};

const TRICKS = [
  ['لدى مزارع 17 خروفاً، هربت كلها إلا 9. كم خروفاً بقي؟', 'A farmer has 17 sheep. All but 9 run away. How many are left?', '9', [['8', '17 − 9 = 8 خطأ: «كلها إلا 9» تعني بقي 9.', '17 − 9 = 8 is wrong: "all but 9" means 9 remain.'], ['17', 'هرب معظمها.', 'Most of them ran away.'], ['0', 'لم تهرب كلها.', 'Not all of them ran away.']], ['«هربت كلها إلا 9» ← الباقي 9.', '"All but 9 ran away" → 9 are left.'], 2],
  ['كم شهراً في السنة فيه 28 يوماً؟', 'How many months of the year have 28 days?', '12', [['1', 'فبراير وحده له 28 يوماً «فقط»، لكن كل الشهور فيها 28 يوماً على الأقل.', 'Only February has exactly 28, but every month has at least 28 days.'], ['2', 'ليس هذا المقصود.', 'That is not what is asked.'], ['0', 'كل الشهور تحتوي 28 يوماً على الأقل.', 'Every month contains at least 28 days.']], ['كل الشهور الـ12 تحتوي على 28 يوماً على الأقل.', 'All 12 months have at least 28 days.'], 1],
  ['في سباق تجاوزتَ العدّاء الذي في المركز الثاني. في أي مركز أنت الآن؟', 'In a race you overtake the runner in second place. What position are you in now?', L2('الثاني', 'Second'), [[L2('الأول', 'First'), 'أخذت مكان الثاني فقط، والأول ما زال أمامك.', 'You took second place; the leader is still ahead.'], [L2('الثالث', 'Third'), 'أنت تقدمت ولم تتأخر.', 'You moved up, not down.'], [L2('الأخير', 'Last'), 'لا علاقة لذلك بالسؤال.', 'That does not follow.']], ['تجاوزت الثاني فأصبحت في مكانه: الثاني.', 'You passed the runner in 2nd, so you are now 2nd.'], 2],
  ['5 آلات تصنع 5 قطع في 5 دقائق. كم دقيقة تحتاج 100 آلة لصنع 100 قطعة؟', '5 machines make 5 parts in 5 minutes. How many minutes do 100 machines need to make 100 parts?', '5', [['100', 'كل آلة تصنع قطعة في 5 دقائق مهما زاد العدد.', 'Each machine makes one part in 5 minutes, whatever the number.'], ['20', 'ليست نسبة مباشرة.', 'It is not a direct proportion.'], ['1', 'كل آلة تحتاج 5 دقائق لقطعتها.', 'Each machine still needs 5 minutes for its part.']], ['كل آلة تصنع قطعة في 5 دقائق، فـ100 آلة تصنع 100 قطعة في 5 دقائق.', 'One machine makes one part in 5 minutes, so 100 machines make 100 parts in 5 minutes.'], 3],
  ['زنبقة ماء تتضاعف مساحتها كل يوم، وتغطي البحيرة كلها في 48 يوماً. متى تغطي نصفها؟', 'A water lily doubles in size every day and covers the whole lake in 48 days. When does it cover half the lake?', '47', [['24', 'النمو مضاعفة وليس خطياً.', 'Growth is doubling, not linear.'], ['46', 'في اليوم 46 تغطي الربع.', 'On day 46 it covers a quarter.'], ['12', 'ليست قسمة على 4.', 'Not a division by 4.']], ['تتضاعف يومياً، فقبل التغطية الكاملة بيوم كانت تغطي النصف: اليوم 47.', 'It doubles daily, so one day before full cover it covered half: day 47.'], 3],
  ['قالب طوب وزنه 1 كيلوجرام ونصف قالب. كم وزن القالب؟', 'A brick weighs 1 kg plus half a brick. How much does the brick weigh?', '2 kg', [['1.5 kg', 'نصف القالب ليس نصف كيلوجرام.', 'Half a brick is not half a kilogram.'], ['1 kg', 'نسيت نصف القالب.', 'You forgot the half brick.'], ['3 kg', 'خطأ في الحل.', 'Calculation slip.']], ['القالب = 1 + نصف القالب ← نصف القالب = 1 kg ← القالب = 2 kg.', 'Brick = 1 + ½ brick → ½ brick = 1 kg → brick = 2 kg.'], 2]
];
function L2(a, e) { return [a, e]; }
const DAYS = { ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'], en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] };
IQ.iq_logic = (r, lang) => {
  const L = X(lang), li = lang === 'ar' ? 0 : 1, kind = r.pick(['trick', 'age', 'age', 'workers', 'hand', 'rate', 'rate']);
  if (kind === 'trick') {
    const t = r.pick(TRICKS), pickL = v => Array.isArray(v) ? v[li] : v;
    const m = mcq(r, pickL(t[2]), t[3].map(x => [pickL(x[0]), x[1 + li]]), x => x, opt(lang));
    return { d: t[5], q: t[li], m, e: t[4][li] };
  }
  if (kind === 'age') {
    const mo = r.int(4, 15), k = r.int(2, 4), S = mo * (k + 1);
    const m = mcq(r, mo, [[mo * k, L('هذا عمر سارة وليس منى.', 'That is Sara\'s age, not Mona\'s.')], [S / 2, L('قسمت المجموع على 2 مع أن الأعمار غير متساوية.', 'You split the total in half, but the ages are not equal.')], [Math.round(S / k), L('قسمت على ' + k + ' بدلاً من ' + (k + 1) + ' (عدد الأجزاء).', 'You divided by ' + k + ' instead of ' + (k + 1) + ' (number of parts).')]], null, opt(lang, { near: nearInt(mo, 3) }));
    return { d: 2, q: L('عمر سارة ' + k + ' أضعاف عمر منى، ومجموع عمريهما ' + S + ' سنة. كم عمر منى؟', 'Sara is ' + k + ' times as old as Mona. Together they are ' + S + ' years old. How old is Mona?'), m, e: L('منى = جزء، سارة = ' + k + ' أجزاء ← ' + (k + 1) + ' أجزاء = ' + S + ' ← منى = ' + mo + '.', 'Mona = 1 part, Sara = ' + k + ' parts → ' + (k + 1) + ' parts = ' + S + ' → Mona = ' + mo + '.') };
  }
  if (kind === 'workers') {
    const w = r.pick([2, 3, 4, 6]), dd = r.pick([6, 8, 12, 9]), w2 = w * r.pick([2, 3]); const ans = w * dd / w2; if (!Number.isInteger(ans)) return null;
    const m = mcq(r, ans, [[dd * w2 / w, L('زيادة العمال تقلل الأيام (تناسب عكسي).', 'More workers means fewer days (inverse proportion).')], [dd, L('عدد العمال تغيّر فيتغير الزمن.', 'The number of workers changed, so the time changes.')], [dd - (w2 - w), L('ليس طرحاً؛ إنه تناسب عكسي.', 'Not subtraction; it is inverse proportion.')]], null, opt(lang, { near: nearInt(ans, 3) }));
    return { d: 2, q: L(w + ' عمال يبنون سوراً في ' + dd + ' أيام. كم يوماً يحتاج ' + w2 + ' عمال (بنفس السرعة)؟', w + ' workers build a wall in ' + dd + ' days. How many days do ' + w2 + ' workers need (same speed)?'), m, e: L('العمل الكلي = ' + w + ' × ' + dd + ' = ' + (w * dd) + ' يوم-عامل ← ÷ ' + w2 + ' = ' + ans + '.', 'Total work = ' + w + ' × ' + dd + ' = ' + (w * dd) + ' worker-days → ÷ ' + w2 + ' = ' + ans + '.') };
  }
  if (kind === 'hand') {
    const n = r.int(4, 12), ans = n * (n - 1) / 2;
    const m = mcq(r, ans, [[n * (n - 1), L('عددت كل مصافحة مرتين.', 'You counted every handshake twice.')], [n * n, L('لا يصافح الشخص نفسه، وكل مصافحة تُعد مرة.', 'Nobody shakes their own hand, and each handshake counts once.')], [n - 1, L('هذا عدد مصافحات شخص واحد فقط.', 'That is the number for one person only.')]], null, opt(lang, { near: nearInt(ans, 4) }));
    return { d: 3, q: L('في اجتماع به ' + n + ' أشخاص، صافح كل شخص كل الآخرين مرة واحدة. كم مصافحة حدثت؟', 'At a meeting of ' + n + ' people, everyone shakes hands with everyone else once. How many handshakes?'), m, e: L('n(n − 1) ÷ 2 = ' + n + ' × ' + (n - 1) + ' ÷ 2 = ' + ans + '.', 'n(n − 1) ÷ 2 = ' + n + ' × ' + (n - 1) + ' ÷ 2 = ' + ans + '.') };
  }
  const n1 = r.int(2, 6), unit = r.int(2, 9), n2 = r.int(7, 15), ans = unit * n2;
  const m = mcq(r, ans, [[n1 * unit + n2, L('جمعت بدلاً من إيجاد سعر القطعة الواحدة.', 'You added instead of finding the price of one.')], [unit * n1 * n2, L('ضربت في عدد الأقلام مرتين.', 'You multiplied by the number of pens twice.')], [n2 * n1, L('استخدمت عدد الأقلام بدلاً من السعر.', 'You used the number of pens instead of the price.')]], null, opt(lang, { near: nearInt(ans, 6) }));
  return { d: 1, q: L('ثمن ' + n1 + ' أقلام هو ' + (n1 * unit) + ' جنيهاً. ما ثمن ' + n2 + ' قلماً؟', n1 + ' pens cost ' + (n1 * unit) + ' pounds. How much do ' + n2 + ' pens cost?'), m, e: L('سعر القلم = ' + (n1 * unit) + ' ÷ ' + n1 + ' = ' + unit + ' ← × ' + n2 + ' = ' + ans + '.', 'One pen = ' + (n1 * unit) + ' ÷ ' + n1 + ' = ' + unit + ' → × ' + n2 + ' = ' + ans + '.') };
};

IQ.iq_calendar = (r, lang) => {
  const L = X(lang), D = DAYS[lang], t = r.int(0, 6), n = r.int(3, 60), ans = D[(t + n) % 7];
  const ds = [[D[(t + n + 1) % 7], L('زدت يوماً — ابدأ العد من اليوم التالي.', 'One day too many — start counting from the next day.')], [D[(t + n + 6) % 7], L('نقصت يوماً.', 'One day short.')], [D[(t + (n % 10)) % 7], L('استخدمت آحاد العدد فقط بدلاً من باقي القسمة على 7.', 'You used the last digit instead of the remainder after dividing by 7.')], [D[t], L('هذا اليوم نفسه، وهو صحيح فقط لو كان العدد مضاعفاً لـ7.', 'That is the same day — only right when the number is a multiple of 7.')]];
  const m = mcq(r, ans, ds, x => x, opt(lang));
  return { d: n > 14 ? 2 : 1, q: L('إذا كان اليوم ' + D[t] + '، فأي يوم سيكون بعد ' + n + ' يوماً؟', 'If today is ' + D[t] + ', what day will it be in ' + n + ' days?'), m, e: L(n + ' ÷ 7 باقيه ' + (n % 7) + ' ← نتقدم ' + (n % 7) + ' أيام من ' + D[t] + ' ← ' + ans + '.', n + ' ÷ 7 leaves remainder ' + (n % 7) + ' → move ' + (n % 7) + ' days from ' + D[t] + ' → ' + ans + '.') };
};

/* ============================== Math (general) ============================== */
const LM = {};
LM.lm_mental = (r, lang) => {
  const L = X(lang), k = r.pick(['mul', 'mul', 'add', 'sub', 'div']);
  if (k === 'mul') { const a = r.int(12, 99), b = r.int(3, 9), c = a * b; const m = mcq(r, c, [[(a % 10) * b + Math.floor(a / 10) * 10, L('ضربت الآحاد وأضفت العشرات دون ضربها في ' + b + '.', 'You multiplied the ones but forgot to multiply the tens by ' + b + '.')], [c + 10, L('خطأ في الحمل (الباقي).', 'Carrying slip.')], [a + b, L('جمعت بدلاً من الضرب.', 'You added instead of multiplying.')]], null, opt(lang, { near: nearInt(c, 12) }));
    return { d: 1, q: L('احسب ذهنياً: ', 'Mental maths: ') + '`' + a + ' × ' + b + '`', m, e: '`' + Math.floor(a / 10) * 10 + ' × ' + b + ' + ' + (a % 10) + ' × ' + b + ' = ' + (Math.floor(a / 10) * 10 * b) + ' + ' + ((a % 10) * b) + ' = ' + c + '`' }; }
  if (k === 'add') { const a = r.int(120, 899), b = r.int(110, 899), c = a + b; const m = mcq(r, c, [[c - 100, L('نسيت حمل 1 للمئات.', 'You forgot to carry 1 to the hundreds.')], [c - 10, L('نسيت حمل 1 للعشرات.', 'You forgot to carry 1 to the tens.')], [c + 100, L('خطأ في المئات.', 'Slip in the hundreds.')]], null, opt(lang, { near: nearInt(c, 20) }));
    return { d: 1, q: L('احسب ذهنياً: ', 'Mental maths: ') + '`' + a + ' + ' + b + '`', m, e: '`' + a + ' + ' + b + ' = ' + c + '`' }; }
  if (k === 'sub') { const b = r.int(105, 480), a = b + r.int(105, 480), c = a - b; const m = mcq(r, c, [[c + 10, L('خطأ في الاستلاف من العشرات.', 'Borrowing slip in the tens.')], [c + 100, L('خطأ في الاستلاف من المئات.', 'Borrowing slip in the hundreds.')], [a + b, L('جمعت بدلاً من الطرح.', 'You added instead of subtracting.')]], null, opt(lang, { near: nearInt(c, 20) }));
    return { d: 1, q: L('احسب ذهنياً: ', 'Mental maths: ') + '`' + a + ' − ' + b + '`', m, e: '`' + a + ' − ' + b + ' = ' + c + '`' }; }
  const b = r.int(3, 12), c = r.int(6, 40), a = b * c; const m = mcq(r, c, [[a - b, L('طرحت بدلاً من القسمة.', 'You subtracted instead of dividing.')], [c + 1, L('خطأ في القسمة.', 'Division slip.')], [Math.floor(a / (b + 1)), L('قسمت على عدد خاطئ.', 'You divided by the wrong number.')]], null, opt(lang, { near: nearInt(c, 4) }));
  return { d: 1, q: L('احسب ذهنياً: ', 'Mental maths: ') + '`' + a + ' ÷ ' + b + '`', m, e: '`' + b + ' × ' + c + ' = ' + a + ' ⇒ ' + a + ' ÷ ' + b + ' = ' + c + '`' };
};
LM.lm_order = (r, lang) => {
  const L = X(lang), a = r.int(2, 20), b = r.int(2, 9), c = r.int(2, 9), k = r.int(0, 3);
  let expr, val, ltr, d = 1;
  if (k === 0) { expr = a + ' + ' + b + ' × ' + c; val = a + b * c; ltr = (a + b) * c; }
  else if (k === 1) { expr = '(' + a + ' + ' + b + ') × ' + c; val = (a + b) * c; ltr = a + b * c; d = 1; }
  else if (k === 2) { const x = b * c * r.int(1, 4); expr = a + ' + ' + x + ' ÷ ' + b; val = a + x / b; ltr = (a + x) / b; if (!Number.isInteger(ltr)) ltr = val + b; }
  else { expr = a * c + ' − ' + b + ' × ' + c; val = a * c - b * c; ltr = (a * c - b) * c; d = 2; }
  const m = mcq(r, val, [[ltr, L('حسبت من اليسار لليمين؛ الضرب والقسمة قبل الجمع والطرح (إلا داخل الأقواس).', 'You worked left to right; multiplication/division come before addition/subtraction (unless in brackets).')], [val + c, L('خطأ حسابي بعد الترتيب.', 'Arithmetic slip after ordering.')], [val - 1, L('خطأ حسابي.', 'Arithmetic slip.')]], null, opt(lang, { near: nearInt(val, 6) }));
  return { d, q: L('ما قيمة: ', 'Evaluate: ') + '`' + expr + '`', m, e: L('الأقواس ثم الضرب/القسمة ثم الجمع/الطرح ← ', 'Brackets, then ×/÷, then +/− → ') + '`' + expr + ' = ' + val + '`' };
};
LM.lm_percent = (r, lang) => {
  const L = X(lang), p = r.pick([10, 15, 20, 25, 30, 40, 50]), P = r.int(4, 60) * 20, cur = L('جنيه', 'EGP');
  if (r.chance(0.6)) {
    const fin = P * (100 - p) / 100;
    const m = mcq(r, fin, [[P * p / 100, L('هذه قيمة الخصم وليست السعر بعد الخصم.', 'That is the discount amount, not the final price.')], [P - p, L('طرحت النسبة كرقم من السعر.', 'You subtracted the percentage as a number.')], [P * (100 + p) / 100, L('أضفت النسبة بدلاً من خصمها.', 'You added the percentage instead of taking it off.')]], v => num(v) + ' ' + cur, opt(lang, { near: nearInt(fin, 20) }));
    return { d: 1, q: L('حذاء سعره ' + P + ' ' + cur + ' وعليه خصم ' + p + '%. كم ستدفع؟', 'Shoes cost ' + P + ' ' + cur + ' with a ' + p + '% discount. How much do you pay?'), m, e: '`' + P + ' × ' + (100 - p) + '% = ' + num(fin) + '`' };
  }
  const part = P * p / 100;
  const m = mcq(r, p, [[Math.round(P / part), L('قسمت المقلوب.', 'You divided the wrong way round.')], [p * 2, L('خطأ في الحساب.', 'Calculation slip.')], [100 - p, L('هذه النسبة الباقية.', 'That is the remaining percentage.')]], v => v + '%', opt(lang, { near: nearInt(p, 5) }));
  return { d: 2, q: L('حصلت على ' + num(part) + ' من ' + P + ' درجة. ما نسبتك المئوية؟', 'You scored ' + num(part) + ' out of ' + P + '. What is your percentage?'), m, e: '`' + num(part) + ' ÷ ' + P + ' × 100 = ' + p + '%`' };
};
LM.lm_fraction = (r, lang) => {
  const L = X(lang), items = [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 8], [3, 8], [5, 8], [7, 8], [7, 10], [9, 10], [1, 10], [3, 10], [1, 20], [3, 20], [7, 20], [9, 20], [11, 20], [1, 25], [4, 25], [6, 25], [1, 40], [3, 40], [1, 16], [3, 16]];
  if (r.chance(0.5)) {
    const [a, b] = r.pick(items), dec = a / b;
    const m = mcq(r, a + '/' + b, [[(Math.round(dec * 10) + '/' + 10 === a + '/' + b ? (a + 1) + '/' + b : Math.round(dec * 100) + '/' + 10), L('العشري ' + dec + ' يساوي ' + Math.round(dec * 100) + '/100 وليس /10.', dec + ' equals ' + Math.round(dec * 100) + '/100, not /10.')], [b + '/' + a, L('قلبت الكسر.', 'You flipped the fraction.')], [a + '/' + (b + 1), L('المقام غير صحيح.', 'Wrong denominator.')]], x => x, opt(lang));
    return { d: 1, q: L('أي كسر يساوي العدد العشري ', 'Which fraction equals ') + '`' + dec + '`' + L('؟', '?'), m, e: '`' + dec + ' = ' + Math.round(dec * 1000) + '/1000 = ' + a + '/' + b + '`' };
  }
  const pick = r.shuffle(items).slice(0, 3), vals = pick.map(([a, b]) => a / b); const pct = r.int(5, 95); if (vals.some(v => Math.abs(v * 100 - pct) < 3)) return null;
  const forms = [[pick[0][0] + '/' + pick[0][1], vals[0]], [String(vals[1]), vals[1]], [pick[2][0] + '/' + pick[2][1], vals[2]], [pct + '%', pct / 100]];
  if (new Set(forms.map(f => f[1])).size < 4) return null;
  const best = forms.reduce((a, b) => (b[1] > a[1] ? b : a));
  const m = mcq(r, best[0], forms.filter(f => f !== best).map(f => [f[0], L(f[0] + ' = ' + f[1] + ' وهو أصغر من ' + best[1] + '.', f[0] + ' = ' + f[1] + ', which is less than ' + best[1] + '.')]), x => x, opt(lang));
  return { multi: true, d: 2, q: L('أي قيمة هي الأكبر؟', 'Which value is the largest?'), m, e: L('حوّل الكل لأعداد عشرية: ', 'Convert all to decimals: ') + forms.map(f => f[0] + ' = ' + f[1]).join(' ، ') + '.' };
};
LM.lm_ratio = (r, lang) => {
  const L = X(lang), cur = L('جنيه', 'EGP'), n1 = r.pick([2, 3, 4, 5, 6]), n2 = r.pick([8, 10, 12, 15, 20]), u1 = r.int(4, 12), u2 = r.int(4, 12);
  const p1 = n1 * u1, p2 = n2 * u2, A = L('العبوة الصغيرة', 'The small pack'), B = L('العبوة الكبيرة', 'The big pack'), S = L('السعر واحد للقطعة', 'Same price per item'), N = L('لا يمكن المعرفة', 'Impossible to tell');
  const best = u1 < u2 ? A : u2 < u1 ? B : S;
  const ds = [A, B, S, N].filter(x => x !== best).map(x => [x, L('قارن سعر القطعة: ' + p1 + '÷' + n1 + ' = ' + u1 + ' مقابل ' + p2 + '÷' + n2 + ' = ' + u2 + '.', 'Compare price per item: ' + p1 + '÷' + n1 + ' = ' + u1 + ' vs ' + p2 + '÷' + n2 + ' = ' + u2 + '.')]);
  const m = mcq(r, best, ds, x => x, opt(lang));
  return { d: 2, q: L('عبوة صغيرة فيها ' + n1 + ' أقلام بسعر ' + p1 + ' ' + cur + '، وعبوة كبيرة فيها ' + n2 + ' قلماً بسعر ' + p2 + ' ' + cur + '. أيهما أوفر؟', 'A small pack of ' + n1 + ' pens costs ' + p1 + ' ' + cur + '; a big pack of ' + n2 + ' pens costs ' + p2 + ' ' + cur + '. Which is better value?'), m, e: L('سعر القلم: ' + u1 + ' مقابل ' + u2 + ' ← ', 'Price per pen: ' + u1 + ' vs ' + u2 + ' → ') + best + '.' };
};
LM.lm_equation = (r, lang) => {
  const L = X(lang), x = r.int(2, 30), k = r.int(0, 3), a = r.int(2, 12);
  let eq, ds, d = 1;
  if (k === 0) { eq = 'x + ' + a + ' = ' + (x + a); ds = [[x + 2 * a, L('أضفت ' + a + ' بدلاً من طرحه.', 'You added ' + a + ' instead of subtracting it.')], [x + a, L('هذا الطرف الأيمن نفسه.', 'That is just the right-hand side.')]]; }
  else if (k === 1) { eq = a + 'x = ' + (a * x); ds = [[a * x * a, L('ضربت بدلاً من القسمة.', 'You multiplied instead of dividing.')], [a * x - a, L('طرحت بدلاً من القسمة.', 'You subtracted instead of dividing.')]]; }
  else if (k === 2) { eq = 'x ÷ ' + a + ' = ' + x; const X2 = x * a; ds = [[x, L('هذا ناتج القسمة وليس x.', 'That is the quotient, not x.')], [x + a, L('جمعت بدلاً من الضرب.', 'You added instead of multiplying.')]]; const m = mcq(r, X2, ds, v => 'x = ' + num(v), opt(lang, { near: nearInt(X2, 6) })); return { d: 1, q: L('حل المعادلة: ', 'Solve: ') + '`' + eq + '`', m, e: '`x = ' + x + ' × ' + a + ' = ' + X2 + '`' }; }
  else { const b = r.int(1, 15); eq = a + 'x + ' + b + ' = ' + (a * x + b); ds = [[(a * x + 2 * b) / a, L('أضفت ' + b + ' بدلاً من طرحه.', 'You added ' + b + ' instead of subtracting it.')], [a * x + b - b * a, L('خطأ في ترتيب الخطوات.', 'Steps done in the wrong order.')]]; d = 2; }
  ds.push([x + 1, L('خطأ حسابي.', 'Arithmetic slip.')]);
  const m = mcq(r, x, ds, v => 'x = ' + num(v), opt(lang, { near: nearInt(x, 4) }));
  return { d, q: L('حل المعادلة: ', 'Solve: ') + '`' + eq + '`', m, e: L('نعزل x بالعملية العكسية ← ', 'Isolate x with inverse operations → ') + '`x = ' + x + '`' };
};
LM.lm_average = (r, lang) => {
  const L = X(lang), n = r.pick([3, 4, 5]), M = r.int(50, 90), vals = []; for (let i = 0; i < n - 1; i++) vals.push(M + r.int(-12, 12)); vals.push(M * n - vals.reduce((a, b) => a + b, 0));
  if (vals[n - 1] < 0 || vals[n - 1] > 100) return null;
  if (r.chance(0.5)) {
    const m = mcq(r, M, [[vals.reduce((a, b) => a + b, 0), L('هذا المجموع؛ اقسم على عدد القيم.', 'That is the sum; divide by how many values.')], [Math.round(vals.reduce((a, b) => a + b, 0) / (n - 1)), L('قسمت على عدد خاطئ.', 'You divided by the wrong count.')], [Math.round((Math.max(...vals) + Math.min(...vals)) / 2), L('هذا منتصف المدى وليس المتوسط.', 'That is the mid-range, not the mean.')]], null, opt(lang, { near: nearInt(M, 3) }));
    return { d: 1, q: L('درجات علي: ', 'Ali\'s scores: ') + '`' + vals.join(', ') + '`' + L('. ما متوسطها؟', '. What is the mean?'), m, e: '`(' + vals.join(' + ') + ') ÷ ' + n + ' = ' + M + '`' };
  }
  const known = vals.slice(0, n - 1), need = vals[n - 1];
  const m = mcq(r, need, [[M, L('الدرجة المطلوبة ليست المتوسط نفسه.', 'The needed score is not the average itself.')], [need + (M - need) * 0 + n, L('خطأ في الحساب.', 'Calculation slip.')], [M * n - known.reduce((a, b) => a + b, 0) - M, L('طرحت المتوسط مرة زائدة.', 'You subtracted the average once too many.')]], null, opt(lang, { near: nearInt(need, 5) }));
  return { d: 3, q: L('درجات علي في ' + (n - 1) + ' اختبارات: ', 'Ali scored ') + '`' + known.join(', ') + '`' + L('. كم يحتاج في الاختبار التالي ليصبح متوسطه ' + M + '؟', ' in ' + (n - 1) + ' tests. What does he need in the next test to average ' + M + '?'), m, e: '`' + M + ' × ' + n + ' − (' + known.join(' + ') + ') = ' + need + '`' };
};
LM.lm_geometry = (r, lang) => {
  const L = X(lang), a = r.int(3, 25), b = r.int(2, 20); if (a === b) return null;
  if (r.chance(0.5)) { const A = a * b; const m = mcq(r, A, [[2 * (a + b), L('هذا المحيط وليس المساحة.', 'That is the perimeter, not the area.')], [a + b, L('جمعت بدلاً من الضرب.', 'You added instead of multiplying.')], [A * 2, L('ضاعفت المساحة.', 'You doubled the area.')]], v => num(v) + ' cm²', opt(lang, { near: nearInt(A, 8) }));
    return { d: 1, q: L('مستطيل طوله ' + a + ' cm وعرضه ' + b + ' cm. ما مساحته؟', 'A rectangle is ' + a + ' cm long and ' + b + ' cm wide. What is its area?'), m, e: '`' + a + ' × ' + b + ' = ' + A + ' cm²`' }; }
  const P = 2 * (a + b); const m = mcq(r, P, [[a * b, L('هذه المساحة وليس المحيط.', 'That is the area, not the perimeter.')], [a + b, L('نسيت الضرب في 2 (أربعة أضلاع).', 'You forgot to double it (four sides).')], [4 * a, L('اعتبرته مربعاً.', 'You treated it as a square.')]], v => num(v) + ' cm', opt(lang, { near: nearInt(P, 6) }));
  return { d: 1, q: L('حديقة مستطيلة طولها ' + a + ' m وعرضها ' + b + ' m. كم متراً من السور نحتاج حولها؟', 'A rectangular garden is ' + a + ' m by ' + b + ' m. How many metres of fence go around it?').replace(/ cm/g, ' m'), m: { ...m, options: m.options.map(o => o.replace(' cm', ' m')) }, e: '`2 × (' + a + ' + ' + b + ') = ' + P + ' m`' };
};
LM.lm_speed = (r, lang) => {
  const L = X(lang), v = r.pick([40, 50, 60, 70, 80, 90, 100, 120]), tq = r.pick([0.5, 1, 1.5, 2, 2.5, 3, 4]), dist = v * tq;
  const tTxt = L(tq === 0.5 ? 'نصف ساعة' : tq + ' ساعة', tq === 0.5 ? 'half an hour' : tq + ' hours');
  if (r.chance(0.5)) { const m = mcq(r, dist, [[v / tq, L('قسمت بدلاً من الضرب.', 'You divided instead of multiplying.')], [v + tq, L('جمعت بدلاً من الضرب.', 'You added instead of multiplying.')], [v * Math.ceil(tq), L('قرّبت الزمن.', 'You rounded the time.')]], x => num(x) + ' km', opt(lang, { near: nearInt(dist, 15) }));
    return { d: 1, q: L('سيارة تسير بسرعة ' + v + ' km/h لمدة ' + tTxt + '. كم كيلومتراً تقطع؟', 'A car travels at ' + v + ' km/h for ' + tTxt + '. How far does it go?'), m, e: '`' + v + ' × ' + tq + ' = ' + dist + ' km`' }; }
  const mins = tq * 60; const m = mcq(r, mins, [[tq * 100, L('الساعة 60 دقيقة وليست 100.', 'An hour is 60 minutes, not 100.')], [dist / 10, L('خطأ في الوحدات.', 'Unit slip.')], [mins + 30, L('خطأ في الحساب.', 'Calculation slip.')]], x => num(x) + L(' دقيقة', ' min'), opt(lang, { near: nearInt(mins, 15) }));
  return { d: 2, q: L('قطار يقطع ' + dist + ' km بسرعة ' + v + ' km/h. كم دقيقة تستغرق الرحلة؟', 'A train covers ' + dist + ' km at ' + v + ' km/h. How many minutes does it take?'), m, e: '`' + dist + ' ÷ ' + v + ' = ' + tq + ' h = ' + mins + ' min`' };
};
LM.lm_powers = (r, lang) => {
  const L = X(lang), k = r.int(0, 2);
  if (k === 0) { const b = r.pick([2, 3, 5, 10]), n = r.int(2, b === 2 ? 10 : b === 10 ? 6 : 4), v = Math.pow(b, n); const m = mcq(r, v, [[b * n, L('ضربت الأساس في الأس؛ القوة تعني ضرباً متكرراً.', 'You multiplied base × exponent; a power means repeated multiplication.')], [Math.pow(b, n - 1), L('ضربت مرة أقل من المطلوب.', 'One multiplication too few.')], [Math.pow(n, b), L('بدلت الأساس والأس.', 'You swapped base and exponent.')]], null, opt(lang, { near: nearInt(v, 5) }));
    return { d: n > 4 ? 2 : 1, q: L('ما قيمة ', 'What is ') + '`' + b + sup(n) + '`' + L('؟', '?'), m, e: '`' + b + sup(n) + ' = ' + Array(n).fill(b).join(' × ') + ' = ' + v + '`' }; }
  const s = r.int(4, 25), v = s * s; const m = mcq(r, s, [[v / 2, L('قسمت على 2؛ الجذر هو العدد الذي مربعه ' + v + '.', 'You halved it; the root is the number whose square is ' + v + '.')], [s + 1, L('قريب لكن ' + (s + 1) + '² = ' + (s + 1) * (s + 1) + '.', 'Close, but ' + (s + 1) + '² = ' + (s + 1) * (s + 1) + '.')], [s - 1, L('قريب لكن ' + (s - 1) + '² = ' + (s - 1) * (s - 1) + '.', 'Close, but ' + (s - 1) + '² = ' + (s - 1) * (s - 1) + '.')]], null, opt(lang));
  return { d: s > 15 ? 2 : 1, q: L('ما قيمة ', 'What is ') + '`√' + v + '`' + L('؟', '?'), m, e: '`' + s + ' × ' + s + ' = ' + v + ' ⇒ √' + v + ' = ' + s + '`' };
};
LM.lm_probability = (r, lang) => {
  const L = X(lang), items = [
    [L('رميت حجر نرد. ما احتمال ظهور عدد زوجي؟', 'You roll a die. What is the probability of an even number?'), new Frac(1, 2), [[new Frac(1, 6), L('هناك 3 أعداد زوجية وليس واحداً.', 'There are 3 even numbers, not one.')], [new Frac(2, 6), L('عددت عددين زوجيين فقط.', 'You counted only two even numbers.')], [new Frac(1, 3), L('خطأ في العد.', 'Counting slip.')]], L('{2، 4، 6} ← 3 من 6 = 1/2', '{2, 4, 6} → 3 out of 6 = 1/2'), 1],
    [L('رميت حجر نرد. ما احتمال ظهور عدد أكبر من 4؟', 'You roll a die. What is the probability of a number greater than 4?'), new Frac(1, 3), [[new Frac(1, 2), L('الأعداد الأكبر من 4 هي 5 و6 فقط.', 'Only 5 and 6 are greater than 4.')], [new Frac(1, 6), L('هناك عددان وليس عدداً واحداً.', 'There are two numbers, not one.')], [new Frac(2, 3), L('هذا احتمال 4 أو أقل.', 'That is the chance of 4 or less.')]], L('{5، 6} ← 2 من 6 = 1/3', '{5, 6} → 2 out of 6 = 1/3'), 1],
    [L('رميت عملة مرتين. ما احتمال ظهور صورة في المرتين؟', 'You toss a coin twice. What is the probability of heads both times?'), new Frac(1, 4), [[new Frac(1, 2), L('هذا احتمال رمية واحدة.', 'That is for a single toss.')], [new Frac(1, 3), L('النتائج الممكنة 4 وليست 3.', 'There are 4 outcomes, not 3.')], [new Frac(2, 4), L('حالة واحدة فقط من 4 تحقق المطلوب.', 'Only one of the 4 outcomes works.')]], L('½ × ½ = ¼', '½ × ½ = ¼'), 2],
    [L('رميت حجري نرد. ما احتمال أن يكون المجموع 7؟', 'You roll two dice. What is the probability the total is 7?'), new Frac(1, 6), [[new Frac(1, 12), L('هناك 6 طرق للحصول على 7 من 36.', 'There are 6 ways to make 7 out of 36.')], [new Frac(7, 36), L('عدد الطرق 6 وليس 7.', 'There are 6 ways, not 7.')], [new Frac(1, 11), L('النتائج 36 وليست 11 مجموعاً متساوي الاحتمال.', 'There are 36 equally likely outcomes, not 11 sums.')]], L('(1,6)(2,5)(3,4)(4,3)(5,2)(6,1) ← 6/36 = 1/6', '(1,6)(2,5)(3,4)(4,3)(5,2)(6,1) → 6/36 = 1/6'), 3]
  ];
  if (r.chance(0.5)) { const it = r.pick(items); const m = mcq(r, it[1], it[2], null, opt(lang)); return { d: it[4], q: it[0], m, e: it[3] }; }
  const R = r.int(1, 9), B = r.int(1, 9), G = r.int(1, 9), tot = R + B + G, c = new Frac(R, tot);
  const m = mcq(r, c, [[new Frac(R, B + G), L('قسمت على الباقي بدلاً من العدد الكلي.', 'You divided by the others instead of the total.')], [new Frac(B + G, tot), L('هذا احتمال ألا تكون حمراء.', 'That is the chance it is NOT red.')], [new Frac(1, tot), L('هذا احتمال كرة واحدة بعينها.', 'That is the chance of one particular ball.')]], null, opt(lang, { near: rr => new Frac(rr.int(1, tot - 1), tot) }));
  return { d: 1, q: L('كيس فيه ' + R + ' كرات حمراء و' + B + ' زرقاء و' + G + ' خضراء. ما احتمال سحب كرة حمراء؟', 'A bag has ' + R + ' red, ' + B + ' blue and ' + G + ' green balls. What is the probability of picking red?'), m, e: '`' + R + ' ÷ ' + tot + ' = ' + c + '`' };
};

/* ============================== Science (general) ============================== */
// [concept, difficulty, qAr, qEn, [correctAr, correctEn], [[wrongAr, wrongEn, noteAr, noteEn] x3], explAr, explEn]
const FACTS = [
  ['ls_life', 1, 'ما العملية التي يصنع بها النبات غذاءه؟', 'How do plants make their own food?', ['البناء الضوئي', 'Photosynthesis'], [['التنفس', 'Respiration', 'التنفس يكسّر الغذاء لإطلاق الطاقة.', 'Respiration breaks food down to release energy.'], ['النتح', 'Transpiration', 'النتح خروج بخار الماء من الأوراق.', 'Transpiration is water vapour leaving the leaves.'], ['الهضم', 'Digestion', 'النبات لا يهضم غذاءه.', 'Plants do not digest food.']], 'النبات يستخدم ضوء الشمس وثاني أكسيد الكربون والماء لصنع الجلوكوز.', 'Plants use sunlight, carbon dioxide and water to make glucose.'],
  ['ls_life', 1, 'الوحدة الأساسية لبناء الكائن الحي هي:', 'The basic unit of all living things is the:', ['الخلية', 'cell'], [['النسيج', 'tissue', 'النسيج مجموعة من الخلايا.', 'A tissue is a group of cells.'], ['العضو', 'organ', 'العضو يتكون من أنسجة.', 'An organ is made of tissues.'], ['الذرة', 'atom', 'الذرة وحدة المادة وليست وحدة الحياة.', 'Atoms build matter, not life.']], 'كل الكائنات الحية تتكون من خلية أو أكثر.', 'Every living thing is made of one or more cells.'],
  ['ls_life', 1, 'أي جزء من الخلية النباتية يقوم بالبناء الضوئي؟', 'Which part of a plant cell carries out photosynthesis?', ['البلاستيدات الخضراء', 'Chloroplast'], [['الميتوكوندريا', 'Mitochondria', 'الميتوكوندريا للتنفس الخلوي.', 'Mitochondria do cellular respiration.'], ['النواة', 'Nucleus', 'النواة تتحكم في الخلية.', 'The nucleus controls the cell.'], ['الجدار الخلوي', 'Cell wall', 'الجدار للدعم والشكل.', 'The wall gives support and shape.']], 'البلاستيدات الخضراء تحتوي الكلوروفيل.', 'Chloroplasts contain chlorophyll.'],
  ['ls_life', 2, 'أي مما يلي من الثدييات؟', 'Which of these is a mammal?', ['الحوت', 'Whale'], [['القرش', 'Shark', 'القرش سمكة.', 'A shark is a fish.'], ['التمساح', 'Crocodile', 'التمساح من الزواحف.', 'A crocodile is a reptile.'], ['البطريق', 'Penguin', 'البطريق طائر.', 'A penguin is a bird.']], 'الحوت يتنفس بالرئتين ويرضع صغاره، فهو ثديي.', 'Whales breathe air and feed their young milk, so they are mammals.'],
  ['ls_life', 2, 'ما الذي يحمل الصفات الوراثية في الخلية؟', 'What carries genetic information in a cell?', ['DNA', 'DNA'], [['الكلوروفيل', 'Chlorophyll', 'الكلوروفيل صبغة خضراء للبناء الضوئي.', 'Chlorophyll is a green pigment for photosynthesis.'], ['الهيموجلوبين', 'Haemoglobin', 'الهيموجلوبين يحمل الأكسجين في الدم.', 'Haemoglobin carries oxygen in blood.'], ['الأنسولين', 'Insulin', 'الأنسولين هرمون يضبط السكر.', 'Insulin is a hormone that controls sugar.']], 'الحمض النووي DNA يحمل التعليمات الوراثية.', 'DNA holds the genetic instructions.'],
  ['ls_life', 1, 'أي غاز ينتجه النبات أثناء البناء الضوئي؟', 'Which gas do plants release during photosynthesis?', ['الأكسجين', 'Oxygen'], [['ثاني أكسيد الكربون', 'Carbon dioxide', 'النبات يستهلكه في البناء الضوئي.', 'Plants take it in for photosynthesis.'], ['النيتروجين', 'Nitrogen', 'لا ينتج في البناء الضوئي.', 'It is not produced by photosynthesis.'], ['الهيدروجين', 'Hydrogen', 'لا ينطلق كغاز في البناء الضوئي.', 'It is not released as a gas.']], 'البناء الضوئي يطلق الأكسجين.', 'Photosynthesis releases oxygen.'],
  ['ls_chem', 1, 'ما الرمز الكيميائي للماء؟', 'What is the chemical formula of water?', ['H₂O', 'H₂O'], [['CO₂', 'CO₂', 'CO₂ ثاني أكسيد الكربون.', 'CO₂ is carbon dioxide.'], ['O₂', 'O₂', 'O₂ غاز الأكسجين.', 'O₂ is oxygen gas.'], ['NaCl', 'NaCl', 'NaCl ملح الطعام.', 'NaCl is table salt.']], 'جزيء الماء: ذرتا هيدروجين وذرة أكسجين.', 'A water molecule has two hydrogen atoms and one oxygen atom.'],
  ['ls_chem', 1, 'ما رمز عنصر الذهب؟', 'What is the chemical symbol for gold?', ['Au', 'Au'], [['Ag', 'Ag', 'Ag رمز الفضة.', 'Ag is silver.'], ['Go', 'Go', 'لا يوجد عنصر بهذا الرمز.', 'There is no such element.'], ['Gd', 'Gd', 'Gd رمز الجادولينيوم.', 'Gd is gadolinium.']], 'رمز الذهب Au من اسمه اللاتيني Aurum.', 'Gold is Au, from the Latin "aurum".'],
  ['ls_chem', 1, 'ما رمز عنصر الحديد؟', 'What is the chemical symbol for iron?', ['Fe', 'Fe'], [['Ir', 'Ir', 'Ir رمز الإيريديوم.', 'Ir is iridium.'], ['I', 'I', 'I رمز اليود.', 'I is iodine.'], ['F', 'F', 'F رمز الفلور.', 'F is fluorine.']], 'رمز الحديد Fe من اسمه اللاتيني Ferrum.', 'Iron is Fe, from the Latin "ferrum".'],
  ['ls_chem', 2, 'الماء النقي عند 25°C رقمه الهيدروجيني (pH) تقريباً:', 'Pure water at 25°C has a pH of about:', ['7', '7'], [['0', '0', 'pH 0 حمض قوي جداً.', 'pH 0 is a very strong acid.'], ['14', '14', 'pH 14 قاعدة قوية جداً.', 'pH 14 is a very strong base.'], ['1', '1', 'pH 1 حمضي.', 'pH 1 is acidic.']], 'الماء النقي متعادل pH = 7.', 'Pure water is neutral: pH 7.'],
  ['ls_chem', 2, 'العدد الذري لعنصر يساوي عدد:', 'An element\'s atomic number equals the number of:', ['البروتونات', 'protons'], [['النيوترونات', 'neutrons', 'عدد النيوترونات قد يختلف بين نظائر العنصر.', 'Neutron numbers vary between isotopes.'], ['الإلكترونات والنيوترونات', 'electrons and neutrons', 'ليس هذا تعريف العدد الذري.', 'That is not the definition.'], ['الجزيئات', 'molecules', 'الجزيئات تتكون من ذرات.', 'Molecules are made of atoms.']], 'العدد الذري = عدد البروتونات في النواة.', 'Atomic number = number of protons in the nucleus.'],
  ['ls_chem', 1, 'تحوّل المادة من الصلب إلى الغاز مباشرة يسمى:', 'Changing directly from solid to gas is called:', ['التسامي', 'sublimation'], [['التبخر', 'evaporation', 'التبخر من السائل إلى الغاز.', 'Evaporation is liquid to gas.'], ['الانصهار', 'melting', 'الانصهار من الصلب إلى السائل.', 'Melting is solid to liquid.'], ['التكثف', 'condensation', 'التكثف من الغاز إلى السائل.', 'Condensation is gas to liquid.']], 'مثال التسامي: الثلج الجاف (CO₂ الصلب).', 'Example: dry ice (solid CO₂) sublimes.'],
  ['ls_chem', 2, 'أي مما يلي تغير كيميائي؟', 'Which of these is a chemical change?', ['صدأ الحديد', 'Iron rusting'], [['انصهار الجليد', 'Ice melting', 'تغير فيزيائي في الحالة فقط.', 'Only a change of state (physical).'], ['ذوبان السكر', 'Sugar dissolving', 'تغير فيزيائي يمكن عكسه.', 'A reversible physical change.'], ['تمزيق ورقة', 'Tearing paper', 'تغير في الشكل فقط.', 'Only a change of shape.']], 'الصدأ يكوّن مادة جديدة (أكسيد الحديد).', 'Rusting makes a new substance (iron oxide).'],
  ['ls_phys', 1, 'ما وحدة قياس القوة؟', 'What is the unit of force?', ['النيوتن', 'newton'], [['الجول', 'joule', 'الجول وحدة الطاقة.', 'The joule measures energy.'], ['الواط', 'watt', 'الواط وحدة القدرة.', 'The watt measures power.'], ['الباسكال', 'pascal', 'الباسكال وحدة الضغط.', 'The pascal measures pressure.']], 'القوة تقاس بالنيوتن (N).', 'Force is measured in newtons (N).'],
  ['ls_phys', 1, 'لماذا لا ينتقل الصوت في الفضاء؟', 'Why can sound not travel through space?', ['لأنه يحتاج وسطاً مادياً', 'It needs a medium (matter) to travel through'], [['لأن الفضاء بارد جداً', 'Space is too cold', 'البرودة ليست السبب.', 'Cold is not the reason.'], ['لأن الجاذبية تمنعه', 'Gravity stops it', 'الجاذبية لا تمنع الصوت.', 'Gravity does not block sound.'], ['لأنه أسرع من الضوء', 'It is faster than light', 'الصوت أبطأ بكثير من الضوء.', 'Sound is much slower than light.']], 'الصوت موجة ميكانيكية تحتاج جزيئات تهتز.', 'Sound is a mechanical wave that needs particles to vibrate.'],
  ['ls_phys', 1, 'أي مما يلي يجذبه المغناطيس؟', 'Which of these does a magnet attract?', ['مسمار حديد', 'An iron nail'], [['قطعة ألومنيوم', 'Aluminium foil', 'الألومنيوم لا ينجذب للمغناطيس العادي.', 'Aluminium is not attracted by ordinary magnets.'], ['عملة نحاسية', 'A copper coin', 'النحاس غير مغناطيسي.', 'Copper is not magnetic.'], ['قطعة خشب', 'A piece of wood', 'الخشب غير مغناطيسي.', 'Wood is not magnetic.']], 'الحديد والنيكل والكوبالت مواد مغناطيسية.', 'Iron, nickel and cobalt are magnetic.'],
  ['ls_phys', 2, 'الطاقة المخزنة في البطارية هي طاقة:', 'The energy stored in a battery is:', ['كيميائية', 'chemical energy'], [['حركية', 'kinetic energy', 'الطاقة الحركية طاقة الأجسام المتحركة.', 'Kinetic energy is energy of motion.'], ['نووية', 'nuclear energy', 'البطاريات العادية لا تستخدم تفاعلات نووية.', 'Ordinary batteries are not nuclear.'], ['صوتية', 'sound energy', 'لا تخزن البطارية صوتاً.', 'Batteries do not store sound.']], 'البطارية تحوّل الطاقة الكيميائية إلى كهربية.', 'A battery turns chemical energy into electrical energy.'],
  ['ls_phys', 2, 'رمي جسمان (ثقيل وخفيف) من نفس الارتفاع في الفراغ. أيهما يصل أولاً؟', 'A heavy and a light object are dropped from the same height in a vacuum. Which lands first?', ['يصلان معاً', 'They land together'], [['الثقيل', 'The heavy one', 'في الفراغ لا توجد مقاومة هواء؛ العجلة واحدة.', 'With no air resistance, both have the same acceleration.'], ['الخفيف', 'The light one', 'لا، العجلة واحدة.', 'No — the acceleration is the same.'], ['لا يسقطان', 'Neither falls', 'الجاذبية موجودة في الفراغ.', 'Gravity still acts in a vacuum.']], 'كل الأجسام تسقط بنفس العجلة عند غياب مقاومة الهواء.', 'All objects fall with the same acceleration without air resistance.'],
  ['ls_space', 1, 'أقرب كوكب إلى الشمس هو:', 'The planet closest to the Sun is:', ['عطارد', 'Mercury'], [['الزهرة', 'Venus', 'الزهرة الثاني.', 'Venus is second.'], ['المريخ', 'Mars', 'المريخ الرابع.', 'Mars is fourth.'], ['الأرض', 'Earth', 'الأرض الثالثة.', 'Earth is third.']], 'الترتيب: عطارد، الزهرة، الأرض، المريخ…', 'Order: Mercury, Venus, Earth, Mars…'],
  ['ls_space', 1, 'أكبر كواكب المجموعة الشمسية:', 'The largest planet in the Solar System is:', ['المشتري', 'Jupiter'], [['زحل', 'Saturn', 'زحل ثاني أكبر كوكب.', 'Saturn is the second largest.'], ['الأرض', 'Earth', 'الأرض صغيرة نسبياً.', 'Earth is relatively small.'], ['نبتون', 'Neptune', 'نبتون أصغر بكثير.', 'Neptune is much smaller.']], 'المشتري عملاق غازي هو الأكبر.', 'Jupiter, a gas giant, is the largest.'],
  ['ls_space', 1, 'سبب تعاقب الليل والنهار:', 'Day and night happen because:', ['دوران الأرض حول نفسها', 'Earth spins on its axis'], [['دوران الأرض حول الشمس', 'Earth orbits the Sun', 'هذا يسبب السنة.', 'That causes the year.'], ['دوران القمر حول الأرض', 'The Moon orbits Earth', 'هذا يسبب أطوار القمر.', 'That causes the Moon\'s phases.'], ['تغير بُعد الشمس', 'The Sun\'s distance changes', 'المسافة ليست السبب.', 'Distance is not the cause.']], 'الأرض تدور حول محورها مرة كل 24 ساعة تقريباً.', 'Earth spins once about every 24 hours.'],
  ['ls_space', 2, 'يبدو القمر مضيئاً لأنه:', 'The Moon shines because it:', ['يعكس ضوء الشمس', 'reflects sunlight'], [['ينتج ضوءه بنفسه', 'makes its own light', 'القمر ليس نجماً.', 'The Moon is not a star.'], ['فيه براكين نشطة', 'has active volcanoes', 'لا توجد براكين نشطة عليه.', 'It has no active volcanoes.'], ['يعكس ضوء الأرض فقط', 'reflects only Earth\'s light', 'ضوء الأرض المنعكس ضعيف جداً.', 'Earthshine is very faint.']], 'القمر جسم معتم يعكس ضوء الشمس.', 'The Moon is dark rock reflecting sunlight.'],
  ['ls_space', 2, 'لماذا يطفو رواد الفضاء داخل المحطة الفضائية؟', 'Why do astronauts float inside the space station?', ['لأنهم في سقوط حر مستمر حول الأرض', 'They are in continuous free fall around Earth'], [['لا جاذبية في المدار', 'There is no gravity in orbit', 'الجاذبية هناك حوالي 90% منها على الأرض.', 'Gravity there is about 90% of that on Earth.'], ['الهواء يرفعهم', 'The air lifts them', 'الهواء لا يلغي الوزن.', 'Air does not cancel weight.'], ['المحطة بعيدة جداً عن الأرض', 'The station is very far from Earth', 'المحطة على ارتفاع 400 km فقط تقريباً.', 'The station is only about 400 km up.']], 'المحطة وما فيها يسقطون معاً حول الأرض.', 'The station and everything in it fall around Earth together.'],
  ['ls_space', 1, 'كم تستغرق الأرض لتدور حول الشمس دورة كاملة؟', 'How long does Earth take to orbit the Sun once?', ['سنة تقريباً (365 يوماً)', 'About a year (365 days)'], [['يوم واحد', 'One day', 'اليوم هو دوران الأرض حول نفسها.', 'A day is one spin of Earth.'], ['شهر واحد', 'One month', 'الشهر مرتبط بالقمر.', 'A month relates to the Moon.'], ['أسبوع', 'One week', 'لا علاقة للأسبوع بالمدار.', 'A week is unrelated to the orbit.']], 'دورة الأرض حول الشمس ≈ 365.25 يوماً.', 'Earth\'s orbit takes about 365.25 days.'],
  ['ls_body', 1, 'العضو الذي يضخ الدم في الجسم:', 'Which organ pumps blood around the body?', ['القلب', 'The heart'], [['الرئتان', 'The lungs', 'الرئتان للتنفس.', 'The lungs are for breathing.'], ['الكبد', 'The liver', 'الكبد ينظف الدم ويخزن الغذاء.', 'The liver cleans blood and stores food.'], ['المعدة', 'The stomach', 'المعدة تهضم الطعام.', 'The stomach digests food.']], 'القلب عضلة تضخ الدم.', 'The heart is a muscle that pumps blood.'],
  ['ls_body', 1, 'كم عظمة في جسم الإنسان البالغ تقريباً؟', 'About how many bones does an adult human have?', ['206', '206'], [['106', '106', 'العدد أكبر من ذلك.', 'The number is higher.'], ['306', '306', 'العدد أقل من ذلك.', 'The number is lower.'], ['26', '26', 'هذا عدد عظام القدم تقريباً.', 'That is roughly the bones in one foot.']], 'البالغ لديه 206 عظمة.', 'An adult has 206 bones.'],
  ['ls_body', 2, 'أين يبدأ هضم النشويات؟', 'Where does the digestion of starch begin?', ['في الفم', 'In the mouth'], [['في المعدة', 'In the stomach', 'اللعاب يبدأ هضم النشا قبل المعدة.', 'Saliva starts starch digestion before the stomach.'], ['في الأمعاء الغليظة', 'In the large intestine', 'الأمعاء الغليظة تمتص الماء.', 'The large intestine absorbs water.'], ['في الكبد', 'In the liver', 'الكبد لا يهضم الطعام مباشرة.', 'The liver does not digest food directly.']], 'إنزيم الأميليز في اللعاب يبدأ هضم النشا.', 'Amylase in saliva starts digesting starch.'],
  ['ls_body', 1, 'أي جهاز ينقل الأكسجين إلى خلايا الجسم؟', 'Which system carries oxygen to the body\'s cells?', ['الجهاز الدوري', 'The circulatory system'], [['الجهاز الهضمي', 'The digestive system', 'الهضمي يحلل الطعام.', 'It breaks down food.'], ['الجهاز العصبي', 'The nervous system', 'العصبي ينقل الإشارات.', 'It carries signals.'], ['الجهاز الهيكلي', 'The skeletal system', 'الهيكلي يدعم الجسم.', 'It supports the body.']], 'الدم يحمل الأكسجين من الرئتين للخلايا.', 'Blood carries oxygen from the lungs to the cells.'],
  ['ls_body', 2, 'ما وظيفة خلايا الدم البيضاء؟', 'What do white blood cells do?', ['محاربة الجراثيم', 'Fight germs'], [['نقل الأكسجين', 'Carry oxygen', 'هذه وظيفة خلايا الدم الحمراء.', 'Red blood cells do that.'], ['تجلط الدم', 'Clot the blood', 'هذه وظيفة الصفائح الدموية.', 'Platelets do that.'], ['هضم الطعام', 'Digest food', 'ليست وظيفة الدم.', 'That is not a blood job.']], 'خلايا الدم البيضاء جزء من جهاز المناعة.', 'White blood cells are part of the immune system.']
];
const LS = {};
LS.facts = (r, lang) => {
  const i = r.int(0, FACTS.length - 1), f = FACTS[i], li = lang === 'ar' ? 0 : 1;
  const m = mcq(r, f[4][li], f[5].map(w => [w[li], w[2 + li]]), x => x, opt(lang));
  return { tag: f[0], d: f[1], q: f[2 + li], m, e: f[6 + li], key: 'fact' + i };
};
LS.ls_formula = (r, lang) => {
  const L = X(lang), k = r.int(0, 4);
  if (k === 0) { const v = r.int(2, 30), t = r.int(2, 20), d = v * t; const m = mcq(r, v, [[d * t, L('ضربت بدلاً من القسمة.', 'You multiplied instead of dividing.')], [Math.round(t / d * 100) / 100, L('قسمت الزمن على المسافة.', 'You divided time by distance.')], [d - t, L('طرحت بدلاً من القسمة.', 'You subtracted instead of dividing.')]], x => num(x) + ' m/s', opt(lang, { near: nearInt(v, 4) }));
    return { d: 1, q: L('عدّاء قطع ' + d + ' m في ' + t + ' s. ما سرعته؟', 'A runner covers ' + d + ' m in ' + t + ' s. What is the speed?'), m, e: '`v = d ÷ t = ' + d + ' ÷ ' + t + ' = ' + v + ' m/s`' }; }
  if (k === 1) { const mass = r.int(2, 80), a = r.int(1, 10), F = mass * a; const m = mcq(r, F, [[mass + a, L('جمعت بدلاً من الضرب.', 'You added instead of multiplying.')], [Math.round(mass / a * 100) / 100, L('قسمت بدلاً من الضرب.', 'You divided instead of multiplying.')], [F * 2, L('خطأ حسابي.', 'Arithmetic slip.')]], x => num(x) + ' N', opt(lang, { near: nearInt(F, 10) }));
    return { d: 2, q: L('ما القوة اللازمة لإكساب جسم كتلته ' + mass + ' kg عجلة ' + a + ' m/s²؟', 'What force gives a ' + mass + ' kg object an acceleration of ' + a + ' m/s²?'), m, e: '`F = m a = ' + mass + ' × ' + a + ' = ' + F + ' N`' }; }
  if (k === 2) { const rho = r.pick([500, 800, 1000, 2700, 7800]), V = r.pick([0.1, 0.2, 0.5, 1, 2]), mass = Math.round(rho * V * 100) / 100; const m = mcq(r, rho, [[Math.round(mass * V * 100) / 100, L('ضربت الكتلة في الحجم.', 'You multiplied mass by volume.')], [Math.round(V / mass * 10000) / 10000, L('قسمت الحجم على الكتلة.', 'You divided volume by mass.')], [rho * 10, L('خطأ في الفاصلة العشرية.', 'Decimal point slip.')]], x => num(x) + ' kg/m³', opt(lang, { near: nearInt(rho, 100) }));
    return { d: 2, q: L('جسم كتلته ' + num(mass) + ' kg وحجمه ' + V + ' m³. ما كثافته؟', 'An object has mass ' + num(mass) + ' kg and volume ' + V + ' m³. What is its density?'), m, e: '`ρ = m ÷ V = ' + num(mass) + ' ÷ ' + V + ' = ' + rho + ' kg/m³`' }; }
  if (k === 3) { const P = [['القمر', 'the Moon', 1.6], ['المريخ', 'Mars', 3.7], ['الأرض', 'Earth', 10]][r.int(0, 2)], mass = r.int(20, 90), W = Math.round(mass * P[2] * 10) / 10; const m = mcq(r, W, [[mass, L('هذه الكتلة وليست الوزن.', 'That is the mass, not the weight.')], [Math.round(mass / P[2] * 10) / 10, L('قسمت على g بدلاً من الضرب.', 'You divided by g instead of multiplying.')], [P[2] === 10 ? Math.round(mass * 1.6 * 10) / 10 : mass * 10, L('استخدمت جاذبية جسم آخر.', 'You used another body\'s gravity.')]], x => num(x) + ' N', opt(lang, { near: nearInt(W, 10) }));
    return { d: 2, q: L('رائد فضاء كتلته ' + mass + ' kg على ' + P[0] + ' (g = ' + P[2] + ' m/s²). كم وزنه؟', 'An astronaut of mass ' + mass + ' kg is on ' + P[1] + ' (g = ' + P[2] + ' m/s²). What is their weight?'), m, e: '`W = m g = ' + mass + ' × ' + P[2] + ' = ' + W + ' N`' }; }
  const I = r.pick([0.5, 1, 2, 3, 4, 5]), R = r.int(2, 40), V = Math.round(I * R * 100) / 100; const m = mcq(r, V, [[Math.round(I / R * 1000) / 1000, L('قسمت التيار على المقاومة.', 'You divided current by resistance.')], [Math.round(R / I * 100) / 100, L('قسمت المقاومة على التيار.', 'You divided resistance by current.')], [I + R, L('جمعت بدلاً من الضرب.', 'You added instead of multiplying.')]], x => num(x) + ' V', opt(lang, { near: nearInt(V, 6) }));
  return { d: 2, q: L('تيار ' + I + ' A يمر في مقاومة ' + R + ' Ω. ما فرق الجهد؟', 'A current of ' + I + ' A flows through ' + R + ' Ω. What is the voltage?'), m, e: '`V = I R = ' + I + ' × ' + R + ' = ' + V + ' V`' };
};
LS.ls_units = (r, lang) => {
  const L = X(lang), k = r.int(0, 3);
  if (k === 0) { const C = r.int(-4, 20) * 5, F = C * 9 / 5 + 32; const m = mcq(r, F, [[C * 5 / 9 + 32, L('استخدمت 5/9 بدلاً من 9/5.', 'You used 5/9 instead of 9/5.')], [C * 9 / 5, L('نسيت إضافة 32.', 'You forgot to add 32.')], [C + 32, L('نسيت الضرب في 9/5.', 'You forgot to multiply by 9/5.')]], x => num(Math.round(x * 10) / 10) + ' °F', opt(lang, { near: nearInt(F, 9) }));
    return { d: 2, q: L('حوّل ' + C + ' °C إلى فهرنهايت.', 'Convert ' + C + ' °C to Fahrenheit.'), m, e: '`' + C + ' × 9/5 + 32 = ' + num(F) + ' °F`' }; }
  if (k === 1) { const C = r.int(-50, 120), K = C + 273; const m = mcq(r, K, [[C - 273, L('طرحت 273 بدلاً من إضافتها.', 'You subtracted 273 instead of adding it.')], [C + 373, L('الإضافة 273 وليس 373.', 'Add 273, not 373.')], [C * 273, L('نجمع ولا نضرب.', 'Add, do not multiply.')]], x => num(x) + ' K', opt(lang, { near: nearInt(K, 10) }));
    return { d: 1, q: L('حوّل ' + C + ' °C إلى كلفن.', 'Convert ' + C + ' °C to kelvin.'), m, e: '`K = °C + 273 = ' + K + ' K`' }; }
  if (k === 2) { const km = r.pick([0.25, 0.5, 1.2, 2, 3.5, 4, 7.5, 12]), mtr = km * 1000; const m = mcq(r, mtr, [[km * 100, L('الكيلومتر 1000 متر وليس 100.', 'A kilometre is 1000 m, not 100.')], [km / 1000, L('قسمت بدلاً من الضرب.', 'You divided instead of multiplying.')], [km * 10000, L('صفر زائد.', 'One zero too many.')]], x => num(x) + ' m', opt(lang));
    return { d: 1, q: L('كم متراً في ' + km + ' km؟', 'How many metres are in ' + km + ' km?'), m, e: '`' + km + ' × 1000 = ' + mtr + ' m`' }; }
  const h = r.pick([0.25, 0.5, 0.75, 1.5, 2, 2.5, 3]), mins = h * 60; const m = mcq(r, mins, [[h * 100, L('الساعة 60 دقيقة وليست 100.', 'An hour is 60 minutes, not 100.')], [h * 30, L('نصف القيمة الصحيحة.', 'Half the correct value.')], [h * 3600, L('هذه بالثواني.', 'That is in seconds.')]], x => num(x) + L(' دقيقة', ' min'), opt(lang));
  return { d: 1, q: L('كم دقيقة في ' + h + ' ساعة؟', 'How many minutes are in ' + h + ' hours?'), m, e: '`' + h + ' × 60 = ' + mins + '`' };
};

/* ============================== English (explanations in lang) ============================== */
const D = ENG.__data, LE = {};
LE.le_tenses = (r, lang) => {
  const L = X(lang), v = r.pick(D.V), s = r.pick(D.S), k = r.pick(['ps', 'past', 'fut', 'cont']);
  let mk, correct, ds;
  if (k === 'ps') { mk = r.pick(['every day', 'every weekend', 'on Fridays']); correct = s[4] ? v[1] : v[0];
    ds = [[s[4] ? v[0] : v[1], s[4] ? L('مع he/she/it نضيف s.', 'With he/she/it, add -s.') : L('لا نضيف s إلا مع he/she/it.', 'Only add -s with he/she/it.')], [v[2], L('هذا ماضٍ، والجملة عن عادة.', 'That is past; the sentence is about a habit.')], [s[1] + ' ' + v[4], L('المستمر لحدث الآن وليس لعادة.', 'Continuous is for now, not for habits.')]]; }
  else if (k === 'past') { mk = r.pick(['yesterday', 'last week', 'two days ago']); correct = v[2];
    ds = [[s[4] ? v[1] : v[0], L('"' + mk + '" تدل على الماضي.', '"' + mk + '" signals the past.')], ['will ' + v[0], L('هذا مستقبل.', 'That is future.')], [s[3] + ' ' + v[3], L('المضارع التام لا يأتي مع زمن ماضٍ محدد.', 'Present perfect is not used with a finished past time.')]]; }
  else if (k === 'fut') { mk = r.pick(['tomorrow', 'next week', 'next year']); correct = 'will ' + v[0];
    ds = [['will ' + v[1], L('بعد will يأتي المصدر بلا s.', 'After "will" use the base form without -s.')], [v[2], L('هذا ماضٍ.', 'That is past.')], [s[4] ? v[1] : v[0], L('"' + mk + '" تدل على المستقبل.', '"' + mk + '" signals the future.')]]; }
  else { if (v[0] === 'read') return null; mk = r.pick(['now', 'right now', 'at the moment']); correct = s[1] + ' ' + v[4];
    ds = [[s[4] ? v[1] : v[0], L('"' + mk + '" تعني الآن ← المستمر.', '"' + mk + '" means now → continuous.')], [v[2], L('هذا ماضٍ.', 'That is past.')], [(s[1] === 'is' ? 'are' : 'is') + ' ' + v[4], L('فعل be لا يتوافق مع الفاعل.', 'The verb "be" does not agree with the subject.')]]; }
  const m = mcq(r, correct, ds, x => x, opt(lang));
  return { d: k === 'cont' || k === 'ps' ? 1 : 2, q: 'Choose the correct answer:\n' + s[0] + ' ___ ' + v[5] + ' ' + mk + '.', m, e: L('الكلمة الدالة "' + mk + '" ← ' + correct + '.', 'Time word "' + mk + '" → ' + correct + '.'), lang: 'en' };
};
LE.le_irregular = (r, lang) => {
  const L = X(lang), [b, p, pp] = r.pick(D.IRR), askPP = r.chance(0.5), correct = askPP ? pp : p;
  const ed = b.endsWith('e') ? b + 'd' : b + 'ed';
  const ds = [[ed, L('"' + b + '" فعل شاذ لا يأخذ ed.', '"' + b + '" is irregular; it does not take -ed.')], [b + 's', L('هذه صيغة المضارع مع he/she/it.', 'That is the present form with he/she/it.')]];
  if (p !== pp) ds.push([askPP ? p : pp, askPP ? L('هذا التصريف الثاني، والمطلوب الثالث.', 'That is the past simple; we need the past participle.') : L('هذا التصريف الثالث، والمطلوب الماضي البسيط.', 'That is the past participle; we need the past simple.')]);
  ds.push([b + 'ing', L('هذه صيغة v-ing.', 'That is the -ing form.')]);
  const m = mcq(r, correct, ds, x => x, opt(lang));
  return { d: p === pp ? 1 : 2, q: 'The ' + (askPP ? 'past participle' : 'past simple') + ' of "' + b + '" is:', m, e: b + ' – ' + p + ' – ' + pp, lang: 'en' };
};
LE.le_comparatives = (r, lang) => {
  const L = X(lang), [a, c, s, t, n, place] = r.pick(D.ADJ), sup2 = r.chance(0.5);
  const naive = t === 'long' ? (sup2 ? a + 'est' : a + 'er') : (sup2 ? 'most ' + a : 'more ' + a);
  const note = t === 'long' ? L('الصفة الطويلة تأخذ more/most.', 'Long adjectives take more/most.') : t === 'irr' ? L('صفة شاذة: ' + a + ' – ' + c + ' – ' + s + '.', 'Irregular: ' + a + ' – ' + c + ' – ' + s + '.') : L('الصفة القصيرة تأخذ -er/-est.', 'Short adjectives take -er/-est.');
  const correct = sup2 ? s : c;
  const m = mcq(r, correct, [[naive, note], [sup2 ? c : s, sup2 ? L('مع the … نستخدم صيغة التفضيل العليا.', 'With "the …" use the superlative.') : L('مع than نستخدم صيغة المقارنة.', 'With "than" use the comparative.')], [a, L('نحتاج صيغة مقارنة أو تفضيل.', 'We need a comparative or superlative form.')]], x => x, opt(lang));
  return { d: t === 'irr' ? 2 : 1, q: 'Choose the correct answer:\n' + (sup2 ? 'It is the ___ ' + n + ' ' + place + '.' : 'This ' + n + ' is ___ than that one.'), m, e: (sup2 ? 'the ' + s : c + ' than'), lang: 'en' };
};
LE.le_vocab = (r, lang) => {
  const L = X(lang), e = r.pick(D.VOC.filter(x => x[2] || x[3])), [w, ar, syn, ant] = e, kind = syn && (!ant || r.chance(0.5)) ? 'syn' : 'ant';
  const correct = kind === 'syn' ? syn : ant, others = r.shuffle(D.VOC.filter(x => x[0] !== w && x[2] !== syn && x[0] !== correct)).slice(0, 6).map(x => x[0]);
  const ds = []; const opp = kind === 'syn' ? ant : syn;
  if (opp) ds.push([opp, kind === 'syn' ? L('"' + opp + '" عكس "' + w + '".', '"' + opp + '" is the opposite of "' + w + '".') : L('"' + opp + '" مرادف لـ"' + w + '".', '"' + opp + '" means the same as "' + w + '".')]);
  others.forEach(o => ds.push([o, L('"' + o + '" لا علاقة لها بمعنى "' + w + '" (' + ar + ').', '"' + o + '" is unrelated to the meaning of "' + w + '".')]));
  const m = mcq(r, correct, ds, x => x, opt(lang));
  return { d: 2, q: 'Choose the ' + (kind === 'syn' ? 'synonym' : 'opposite') + ' of "' + w + '":', m, e: '"' + w + '" → ' + correct, lang: 'en' };
};
const NOUNS_A = [['apple', 'an'], ['egg', 'an'], ['orange', 'an'], ['umbrella', 'an'], ['idea', 'an'], ['elephant', 'an'], ['island', 'an'], ['engineer', 'an'], ['hour', 'an', 'h'], ['honest man', 'an', 'h'],
  ['car', 'a'], ['book', 'a'], ['dog', 'a'], ['house', 'a'], ['teacher', 'a'], ['rocket', 'a'], ['planet', 'a'], ['university', 'a', 'u'], ['uniform', 'a', 'u'], ['European country', 'a', 'u'], ['one-way street', 'a', 'o']];
LE.le_articles = (r, lang) => {
  const L = X(lang), [n, art, ex] = r.pick(NOUNS_A), frame = r.pick(['I saw ___ ' + n + '.', 'She has ___ ' + n + '.', 'There is ___ ' + n + ' here.', 'It was ___ ' + n + '.']);
  const why = ex === 'h' ? L('حرف h هنا صامت فتبدأ الكلمة بصوت متحرك ← an.', 'The "h" is silent, so the word starts with a vowel sound → an.') : ex === 'u' ? L('تُنطق بصوت "يو" (ساكن) ← a.', 'It starts with a "you" sound (a consonant sound) → a.') : ex === 'o' ? L('تُنطق "وان" بصوت ساكن ← a.', '"One" starts with a "w" sound → a.') : art === 'an' ? L('تبدأ بصوت متحرك ← an.', 'It starts with a vowel sound → an.') : L('تبدأ بصوت ساكن ← a.', 'It starts with a consonant sound → a.');
  const m = mcq(r, art, [[art === 'a' ? 'an' : 'a', why], ['the', L('نتحدث عن شيء غير محدد لأول مرة.', 'We mean any one, mentioned for the first time.')], ['—', L('الاسم المفرد المعدود يحتاج أداة.', 'A singular countable noun needs an article.')]], x => x, opt(lang));
  return { d: ex ? 3 : 1, q: 'Choose the correct article:\n' + frame, m, e: why, lang: 'en' };
};
LE.le_plurals = (r, lang) => {
  const L = X(lang), [s, p] = r.pick(D.PL);
  const ds = [[s + 's', L('جمع "' + s + '" لا يكون بإضافة s فقط.', 'The plural of "' + s + '" is not just +s.')], [s + 'es', L('es بعد s, sh, ch, x, o فقط.', '-es only after s, sh, ch, x, o.')], [s.endsWith('y') ? s.slice(0, -1) + 'ies' : s + 'ren', L('القاعدة لا تنطبق هنا.', 'That rule does not apply here.')], [s.endsWith('y') ? s + 'es' : s + 'ses', L('تهجئة غير صحيحة.', 'Wrong spelling.')]];
  const m = mcq(r, p, ds, x => x, opt(lang));
  return { d: p === s + 's' ? 1 : 2, q: 'The plural of "' + s + '" is:', m, e: s + ' → ' + p, lang: 'en' };
};
const PREP = [['in', ['July', 'March', '2020', '1998', 'the morning', 'summer', 'the evening', 'winter']], ['on', ['Monday', 'Friday', 'my birthday', '5 May', 'the weekend', 'New Year\'s Day']], ['at', ['5 o\'clock', 'noon', 'night', 'midnight', '7:30', 'the end of the lesson']]];
LE.le_prepositions = (r, lang) => {
  const L = X(lang), [p, list] = r.pick(PREP), t = r.pick(list), s = r.pick(['The match starts', 'We travel', 'She was born', 'The shop opens', 'I will call you']);
  if (s === 'She was born' && /o'clock|noon|night|7:30|end/.test(t)) return null;
  const rule = { in: L('in للشهور والسنين والفصول وأجزاء اليوم.', '"in" for months, years, seasons and parts of the day.'), on: L('on للأيام والتواريخ.', '"on" for days and dates.'), at: L('at للساعات وnight وnoon.', '"at" for clock times, noon and night.') };
  const m = mcq(r, p, ['in', 'on', 'at'].filter(x => x !== p).map(x => [x, rule[p]]).concat([['by', L('by تعني "قبل أو عند"، والمطلوب حرف الجر الأساسي للزمن.', '"by" means "not later than"; we need the basic time preposition.')]]), x => x, opt(lang));
  return { d: 1, q: 'Choose the correct preposition:\n' + s + ' ___ ' + t + '.', m, e: rule[p], lang: 'en' };
};

module.exports = {
  plan: [
    ['iq', 'iq_numseq', IQ.iq_numseq, 260], ['iq', 'iq_letters', IQ.iq_letters, 140], ['iq', 'iq_oddone', IQ.iq_oddone, 260], ['iq', 'iq_analogy', IQ.iq_analogy, 200],
    ['iq', 'iq_logic', IQ.iq_logic, 260], ['iq', 'iq_calendar', IQ.iq_calendar, 150],
    ['lmath', 'lm_mental', LM.lm_mental, 160], ['lmath', 'lm_order', LM.lm_order, 140], ['lmath', 'lm_percent', LM.lm_percent, 120], ['lmath', 'lm_fraction', LM.lm_fraction, 110],
    ['lmath', 'lm_ratio', LM.lm_ratio, 100], ['lmath', 'lm_equation', LM.lm_equation, 140], ['lmath', 'lm_average', LM.lm_average, 110], ['lmath', 'lm_geometry', LM.lm_geometry, 110],
    ['lmath', 'lm_speed', LM.lm_speed, 90], ['lmath', 'lm_powers', LM.lm_powers, 100], ['lmath', 'lm_probability', LM.lm_probability, 90],
    ['lscience', 'facts', LS.facts, FACTS.length * 3], ['lscience', 'ls_formula', LS.ls_formula, 420], ['lscience', 'ls_units', LS.ls_units, 260],
    ['lenglish', 'le_tenses', LE.le_tenses, 320], ['lenglish', 'le_irregular', LE.le_irregular, 110], ['lenglish', 'le_comparatives', LE.le_comparatives, 44], ['lenglish', 'le_vocab', LE.le_vocab, 160],
    ['lenglish', 'le_articles', LE.le_articles, 60], ['lenglish', 'le_plurals', LE.le_plurals, 40], ['lenglish', 'le_prepositions', LE.le_prepositions, 120]
  ],
  FACTS
};
