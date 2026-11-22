/* English generators: tenses, passive, conditionals, irregular verbs,
   comparatives, plurals and vocabulary. Templates were chosen so exactly one
   option is grammatical (e.g. the past-continuous items never offer the
   simple past, which can also be acceptable after "while"). */
'use strict';
const { mcq } = require('./common');

// base, 3rd-person, past, past participle, -ing, complement, allowsContinuous
const V = [
  ['play', 'plays', 'played', 'played', 'playing', 'football'], ['watch', 'watches', 'watched', 'watched', 'watching', 'the stars'],
  ['visit', 'visits', 'visited', 'visited', 'visiting', 'the space museum'], ['study', 'studies', 'studied', 'studied', 'studying', 'physics'],
  ['write', 'writes', 'wrote', 'written', 'writing', 'a report'], ['eat', 'eats', 'ate', 'eaten', 'eating', 'breakfast'],
  ['drink', 'drinks', 'drank', 'drunk', 'drinking', 'orange juice'], ['go', 'goes', 'went', 'gone', 'going', 'to the club'],
  ['take', 'takes', 'took', 'taken', 'taking', 'photos of the Moon'], ['speak', 'speaks', 'spoke', 'spoken', 'speaking', 'English'],
  ['build', 'builds', 'built', 'built', 'building', 'a robot'], ['fly', 'flies', 'flew', 'flown', 'flying', 'a drone'],
  ['ride', 'rides', 'rode', 'ridden', 'riding', 'a bike'], ['swim', 'swims', 'swam', 'swum', 'swimming', 'in the pool'],
  ['clean', 'cleans', 'cleaned', 'cleaned', 'cleaning', 'the lab'], ['draw', 'draws', 'drew', 'drawn', 'drawing', 'a map'],
  ['make', 'makes', 'made', 'made', 'making', 'a model rocket'], ['buy', 'buys', 'bought', 'bought', 'buying', 'new books'],
  ['send', 'sends', 'sent', 'sent', 'sending', 'a message'], ['repair', 'repairs', 'repaired', 'repaired', 'repairing', 'the computer'],
  ['cook', 'cooks', 'cooked', 'cooked', 'cooking', 'dinner'], ['drive', 'drives', 'drove', 'driven', 'driving', 'to work'],
  ['teach', 'teaches', 'taught', 'taught', 'teaching', 'science'], ['sing', 'sings', 'sang', 'sung', 'singing', 'a song'],
  ['run', 'runs', 'ran', 'run', 'running', 'in the park'], ['learn', 'learns', 'learned', 'learned', 'learning', 'a new language'],
  ['feed', 'feeds', 'fed', 'fed', 'feeding', 'the cat'], ['explore', 'explores', 'explored', 'explored', 'exploring', 'the desert'],
  ['paint', 'paints', 'painted', 'painted', 'painting', 'the wall'], ['solve', 'solves', 'solved', 'solved', 'solving', 'math problems'],
  ['launch', 'launches', 'launched', 'launched', 'launching', 'a weather balloon'], ['grow', 'grows', 'grew', 'grown', 'growing', 'tomatoes'],
  ['wear', 'wears', 'wore', 'worn', 'wearing', 'a uniform'], ['read', 'reads', 'read', 'read', 'reading', 'science magazines'],
  ['help', 'helps', 'helped', 'helped', 'helping', 'the new students'], ['design', 'designs', 'designed', 'designed', 'designing', 'a website']
];
// subject, be-present, be-past, have, third-person-singular
const S = [
  ['Omar', 'is', 'was', 'has', true], ['Mona', 'is', 'was', 'has', true], ['My brother', 'is', 'was', 'has', true], ['The engineer', 'is', 'was', 'has', true],
  ['She', 'is', 'was', 'has', true], ['He', 'is', 'was', 'has', true], ['I', 'am', 'was', 'have', false], ['We', 'are', 'were', 'have', false],
  ['They', 'are', 'were', 'have', false], ['The astronauts', 'are', 'were', 'have', false], ['My friends', 'are', 'were', 'have', false], ['You', 'are', 'were', 'have', false]
];

const T = {};
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

T.present_simple = r => {
  const v = r.pick(V), s = r.pick(S);
  const adv = r.chance(0.5);
  const mk = adv ? r.pick(['usually', 'always', 'often', 'sometimes', 'never']) : r.pick(['every day', 'every weekend', 'twice a week', 'every morning', 'on Fridays']);
  const sent = adv ? s[0] + ' ' + mk + ' ___ ' + v[5] + '.' : s[0] + ' ___ ' + v[5] + ' ' + mk + '.';
  const correct = s[4] ? v[1] : v[0];
  const m = mcq(r, correct, [[s[4] ? v[0] : v[1], s[4] ? 'مع الفاعل المفرد الغائب (he/she/it) نضيف s للفعل في المضارع البسيط.' : 'لا نضيف s إلا مع الفاعل المفرد الغائب.'], [v[2], 'هذا ماضٍ بسيط، والكلمة الدالة "' + mk + '" تدل على عادة في الحاضر.'], [s[1] + ' ' + v[4], 'المضارع المستمر لحدث يحدث الآن، أما "' + mk + '" فتدل على عادة متكررة.']], x => x);
  return { d: s[4] ? 1 : 1, q: 'Choose the correct answer:\n' + sent, m, e: '"' + mk + '" تدل على عادة ← المضارع البسيط: ' + s[0] + ' ' + correct + '.', lang: 'en' };
};

T.past_simple = r => {
  const v = r.pick(V), s = r.pick(S);
  const mk = r.pick(['yesterday', 'last week', 'two days ago', 'in 2019', 'last summer', 'last night']);
  const correct = v[2];
  const ds = [[s[4] ? v[1] : v[0], 'هذا مضارع بسيط، و"' + mk + '" كلمة دالة على الماضي.'], [s[3] + ' ' + v[3], 'المضارع التام لا يُستخدم مع زمن محدد في الماضي مثل "' + mk + '".'], ['will ' + v[0], 'هذا مستقبل، والجملة تتحدث عن الماضي.']];
  const m = mcq(r, correct, ds, x => x);
  return { d: v[2].endsWith('ed') ? 1 : 2, q: 'Choose the correct answer:\n' + s[0] + ' ___ ' + v[5] + ' ' + mk + '.', m, e: '"' + mk + '" ← الماضي البسيط (التصريف الثاني): ' + v[2] + '.', lang: 'en' };
};

T.present_cont = r => {
  const v = r.pick(V.filter(x => x[0] !== 'read')), s = r.pick(S);
  const pre = r.pick(['Look! ', 'Listen! ', '', '']), mk = pre ? '' : r.pick([' now', ' at the moment', ' right now']);
  const correct = s[1] + ' ' + v[4];
  const wrongBe = s[1] === 'is' ? 'are' : s[1] === 'are' ? 'is' : 'is';
  const m = mcq(r, correct, [[s[4] ? v[1] : v[0], 'المضارع البسيط للعادات، أما ' + (pre ? '"' + pre.trim() + '"' : '"' + mk.trim() + '"') + ' فتدل على حدث يحدث الآن.'], [wrongBe + ' ' + v[4], 'فعل be لا يتوافق مع الفاعل: ' + s[0] + ' ← ' + s[1] + '.'], [v[2], 'هذا ماضٍ بسيط.']], x => x);
  return { d: 1, q: 'Choose the correct answer:\n' + pre + s[0] + ' ___ ' + v[5] + mk + '.', m, e: 'حدث يحدث الآن ← am/is/are + v-ing: ' + correct + '.', lang: 'en' };
};

T.future_will = r => {
  const v = r.pick(V), s = r.pick(S);
  const mk = r.pick(['tomorrow', 'next week', 'next year', 'next summer', 'in the future']);
  const m = mcq(r, 'will ' + v[0], [['will ' + v[1], 'بعد will يأتي المصدر دون s.'], [v[2], 'هذا ماضٍ، و"' + mk + '" تدل على المستقبل.'], [s[3] + ' ' + v[3], 'المضارع التام لا يُستخدم مع "' + mk + '".']], x => x);
  return { d: 1, q: 'Choose the correct answer:\n' + s[0] + ' ___ ' + v[5] + ' ' + mk + '.', m, e: '"' + mk + '" ← will + المصدر: will ' + v[0] + '.', lang: 'en' };
};

T.present_perfect = r => {
  const s = r.pick(S);
  if (r.chance(0.5)) {
    const v = r.pick(V.filter(x => x[2] !== x[3]));
    const adv = r.pick(['already', 'just', 'never']);
    const m = mcq(r, v[3], [[v[2], 'بعد have/has نستخدم التصريف الثالث (' + v[3] + ') وليس الثاني.'], [v[0], 'بعد have/has لا يأتي المصدر.'], [v[4], 'v-ing تأتي بعد فعل be وليس بعد have/has في هذا الزمن.']], x => x);
    return { d: 2, q: 'Choose the correct answer:\n' + s[0] + ' ' + s[3] + ' ' + adv + ' ___ ' + v[5] + '.', m, e: 'have/has + ' + adv + ' + التصريف الثالث: ' + v[3] + '.', lang: 'en' };
  }
  const v = r.pick(V);
  const mk = r.pick(['since 2020', 'since last year', 'for three years', 'for a long time', 'since January']);
  const correct = s[3] + ' ' + v[3];
  const wrongHave = s[3] === 'has' ? 'have' : 'has';
  const m = mcq(r, correct, [[v[2], '"' + mk.split(' ')[0] + '" مع مدة مستمرة حتى الآن ← المضارع التام وليس الماضي البسيط.'], [wrongHave + ' ' + v[3], 'have/has لا تتوافق مع الفاعل ' + s[0] + '.'], [s[4] ? v[1] : v[0], 'المضارع البسيط لا يُستخدم مع since/for بهذا المعنى.']], x => x);
  return { d: 2, q: 'Choose the correct answer:\n' + s[0] + ' ___ ' + v[5] + ' ' + mk + '.', m, e: 'since/for ← have/has + التصريف الثالث: ' + correct + '.', lang: 'en' };
};

T.past_cont = r => {
  const v = r.pick(V.filter(x => x[0] !== 'read')), s = r.pick(S.filter(x => x[0] !== 'I'));
  const lead = r.pick(['At this time yesterday, ', 'At 8 o\'clock last night, ', 'When the power went out, ']);
  const correct = s[2] + ' ' + v[4];
  const wrong = (s[2] === 'was' ? 'were' : 'was') + ' ' + v[4];
  const m = mcq(r, correct, [[wrong, 'فعل be في الماضي يتوافق مع الفاعل: المفرد was والجمع/you were.'], [s[1] + ' ' + v[4], 'هذا مضارع مستمر، والجملة في الماضي.'], [s[3] + ' ' + v[3], 'المضارع التام لا يناسب حدثاً كان مستمراً في وقت محدد في الماضي.']], x => x);
  const subj = ['Omar', 'Mona'].includes(s[0]) ? s[0] : s[0].charAt(0).toLowerCase() + s[0].slice(1);
  return { d: 2, q: 'Choose the correct answer:\n' + lead + subj + ' ___ ' + v[5] + '.', m, e: 'حدث كان مستمراً في وقت محدد في الماضي ← was/were + v-ing: ' + correct + '.', lang: 'en' };
};

// object, plural?, verb index, agent
const PASS = [['The report', 0, 'write', 'the engineer'], ['These photos', 1, 'take', 'a satellite'], ['The robot', 0, 'build', 'the students'], ['The windows', 1, 'clean', 'the workers'],
  ['The rocket', 0, 'launch', 'the space agency'], ['The messages', 1, 'send', 'the crew'], ['The lab', 0, 'clean', 'the team'], ['The map', 0, 'draw', 'a young pilot'],
  ['The computers', 1, 'repair', 'the technician'], ['The tomatoes', 1, 'grow', 'the farmers'], ['The website', 0, 'design', 'my sister'], ['Dinner', 0, 'cook', 'the chef'],
  ['The new students', 1, 'help', 'their teachers'], ['The model rocket', 0, 'make', 'the club members'], ['These books', 1, 'buy', 'the school'], ['The song', 0, 'sing', 'the choir'], ['The experiment', 0, 'make', 'the students'], ['The lessons', 1, 'teach', 'our teacher'], ['The bridge', 0, 'build', 'the engineers'], ['The letters', 1, 'write', 'the pupils'],
  ['The pictures', 1, 'draw', 'the children'], ['The email', 0, 'send', 'the manager'], ['The documents', 1, 'send', 'the office'], ['The match', 0, 'watch', 'millions of fans'], ['The machine', 0, 'repair', 'a technician'], ['The seeds', 1, 'grow', 'the farmers']];
T.passive = r => {
  const [obj, pl, vb, ag] = r.pick(PASS); const v = V.find(x => x[0] === vb);
  const k = r.int(0, 2);
  const mk = ['yesterday', 'every day', 'tomorrow'][k];
  const be = k === 0 ? (pl ? 'were' : 'was') : k === 1 ? (pl ? 'are' : 'is') : 'will be';
  const correct = be + ' ' + v[3];
  const ds = [[k === 0 ? v[2] : k === 1 ? (pl ? v[0] : v[1]) : 'will ' + v[0], 'هذا مبني للمعلوم — الفاعل الحقيقي جاء بعد by، فالجملة مبنية للمجهول.'],
    [k === 2 ? 'will ' + v[3] : (k === 0 ? (pl ? 'was' : 'were') : (pl ? 'is' : 'are')) + ' ' + v[3], k === 2 ? 'المبني للمجهول في المستقبل: will be + التصريف الثالث.' : 'فعل be لا يتوافق مع المفعول المفرد/الجمع.'],
    [be + ' ' + v[4], 'بعد be في المبني للمجهول نستخدم التصريف الثالث وليس v-ing.']];
  const m = mcq(r, correct, ds, x => x);
  return { d: k === 2 ? 3 : 2, q: 'Choose the correct answer:\n' + obj + ' ___ by ' + ag + ' ' + mk + '.', m, e: 'المبني للمجهول: be (' + be + ') + التصريف الثالث (' + v[3] + ').', lang: 'en' };
};

// if-subject, present, past, pp, if-complement, main-subject, main base, main pp, main complement
const COND = [['you', 'study', 'studied', 'studied', 'hard', 'you', 'pass', 'passed', 'the exam'], ['we', 'leave', 'left', 'left', 'early', 'we', 'catch', 'caught', 'the bus'],
  ['it', 'rains', 'rained', 'rained', 'tomorrow', 'they', 'stay', 'stayed', 'at home'], ['she', 'practises', 'practised', 'practised', 'every day', 'she', 'win', 'won', 'the race'],
  ['the crew', 'fixes', 'fixed', 'fixed', 'the oxygen pump', 'the mission', 'continue', 'continued', 'safely'], ['he', 'saves', 'saved', 'saved', 'enough money', 'he', 'buy', 'bought', 'a telescope'],
  ['I', 'find', 'found', 'found', 'the key', 'I', 'open', 'opened', 'the door'], ['they', 'water', 'watered', 'watered', 'the plants', 'the plants', 'grow', 'grown', 'well'],
  ['you', 'heat', 'heated', 'heated', 'ice', 'it', 'melt', 'melted', 'quickly'], ['we', 'take', 'took', 'taken', 'a taxi', 'we', 'arrive', 'arrived', 'on time'],
  ['the pilot', 'sees', 'saw', 'seen', 'the signal', 'he', 'land', 'landed', 'the plane'], ['you', 'ask', 'asked', 'asked', 'the teacher', 'she', 'help', 'helped', 'you'],
  ['the students', 'review', 'reviewed', 'reviewed', 'the lesson', 'they', 'understand', 'understood', 'it better'], ['we', 'recycle', 'recycled', 'recycled', 'paper', 'we', 'save', 'saved', 'many trees'],
  ['the scientist', 'tests', 'tested', 'tested', 'the sample', 'she', 'find', 'found', 'the answer'], ['you', 'press', 'pressed', 'pressed', 'this button', 'the door', 'open', 'opened', 'automatically'],
  ['the team', 'trains', 'trained', 'trained', 'harder', 'the team', 'win', 'won', 'the cup'], ['he', 'reads', 'read', 'read', 'the instructions', 'he', 'avoid', 'avoided', 'mistakes'],
  ['we', 'plant', 'planted', 'planted', 'more trees', 'the air', 'become', 'became', 'cleaner'], ['the company', 'invests', 'invested', 'invested', 'in research', 'it', 'develop', 'developed', 'new products']];
T.conditionals = r => {
  const c = r.pick(COND), k = r.int(1, 3);
  const ifv = k === 1 ? c[1] : k === 2 ? (c[2] === 'was' ? 'were' : c[2]) : 'had ' + c[3];
  const forms = { 1: 'will ' + c[6], 2: 'would ' + c[6], 3: 'would have ' + c[7] };
  const notes = { 1: 'If + مضارع بسيط ← will + مصدر (النوع الأول).', 2: 'If + ماضٍ بسيط ← would + مصدر (النوع الثاني).', 3: 'If + had + p.p ← would have + p.p (النوع الثالث).' };
  const ds = [1, 2, 3].filter(x => x !== k).map(x => [forms[x], 'هذه صيغة النوع ' + (x === 1 ? 'الأول' : x === 2 ? 'الثاني' : 'الثالث') + '. لاحظ زمن فعل if: ' + notes[k]]);
  ds.push([k === 3 ? 'had ' + c[7] : c[7], 'الجملة الرئيسية في الشرط تحتاج will/would.']);
  const m = mcq(r, forms[k], ds, x => x);
  return { d: k === 1 ? 2 : 3, q: 'Choose the correct answer:\nIf ' + c[0] + ' ' + ifv + ' ' + c[4] + ', ' + c[5] + ' ___ ' + c[8] + '.', m, e: notes[k], lang: 'en' };
};

const IRR = [['begin', 'began', 'begun'], ['break', 'broke', 'broken'], ['bring', 'brought', 'brought'], ['catch', 'caught', 'caught'], ['choose', 'chose', 'chosen'],
  ['come', 'came', 'come'], ['do', 'did', 'done'], ['drink', 'drank', 'drunk'], ['drive', 'drove', 'driven'], ['eat', 'ate', 'eaten'], ['fall', 'fell', 'fallen'],
  ['feel', 'felt', 'felt'], ['find', 'found', 'found'], ['fly', 'flew', 'flown'], ['forget', 'forgot', 'forgotten'], ['give', 'gave', 'given'], ['go', 'went', 'gone'],
  ['grow', 'grew', 'grown'], ['hear', 'heard', 'heard'], ['keep', 'kept', 'kept'], ['know', 'knew', 'known'], ['leave', 'left', 'left'], ['lose', 'lost', 'lost'],
  ['make', 'made', 'made'], ['meet', 'met', 'met'], ['pay', 'paid', 'paid'], ['ride', 'rode', 'ridden'], ['ring', 'rang', 'rung'], ['rise', 'rose', 'risen'],
  ['run', 'ran', 'run'], ['say', 'said', 'said'], ['see', 'saw', 'seen'], ['sell', 'sold', 'sold'], ['send', 'sent', 'sent'], ['sing', 'sang', 'sung'],
  ['sit', 'sat', 'sat'], ['sleep', 'slept', 'slept'], ['speak', 'spoke', 'spoken'], ['steal', 'stole', 'stolen'], ['swim', 'swam', 'swum'], ['take', 'took', 'taken'],
  ['teach', 'taught', 'taught'], ['tell', 'told', 'told'], ['think', 'thought', 'thought'], ['throw', 'threw', 'thrown'], ['understand', 'understood', 'understood'],
  ['wake', 'woke', 'woken'], ['wear', 'wore', 'worn'], ['win', 'won', 'won'], ['write', 'wrote', 'written'], ['build', 'built', 'built'], ['buy', 'bought', 'bought'],
  ['draw', 'drew', 'drawn'], ['get', 'got', 'got'], ['hide', 'hid', 'hidden'], ['shake', 'shook', 'shaken'], ['spend', 'spent', 'spent'], ['stand', 'stood', 'stood']];
function regEd(b) { if (b.endsWith('e')) return b + 'd'; if (/[^aeiou]y$/.test(b)) return b.slice(0, -1) + 'ied'; return b + 'ed'; }
function ing(b) { if (b.endsWith('ie')) return b.slice(0, -2) + 'ying'; if (b.endsWith('e') && !b.endsWith('ee')) return b.slice(0, -1) + 'ing'; if (/^[^aeiou]*[aeiou][bdgmnprt]$/.test(b)) return b + b.slice(-1) + 'ing'; return b + 'ing'; }
T.irregular_verbs = r => {
  const [b, p, pp] = r.pick(IRR), askPP = r.chance(0.5);
  const correct = askPP ? pp : p;
  const ds = [[regEd(b), 'الفعل "' + b + '" شاذ ولا يأخذ ed.']];
  if (p !== pp) ds.push([askPP ? p : pp, askPP ? 'هذا التصريف الثاني (الماضي)، والمطلوب التصريف الثالث.' : 'هذا التصريف الثالث (past participle)، والمطلوب الماضي البسيط.']);
  ds.push([ing(b), 'هذه صيغة v-ing وليست تصريفاً للماضي.']);
  ds.push([b + 's', 'هذه صيغة المضارع مع he/she/it.']);
  const m = mcq(r, correct, ds, x => x);
  return { d: p === pp ? 1 : 2, q: 'The ' + (askPP ? 'past participle' : 'past simple') + ' of "' + b + '" is:', m, e: b + ' – ' + p + ' – ' + pp + '.', lang: 'en' };
};

// adj, comparative, superlative, type (short/long/irregular/double/y), noun, place
const ADJ = [['big', 'bigger', 'biggest', 'double', 'planet', 'in the solar system'], ['hot', 'hotter', 'hottest', 'double', 'planet', 'in the solar system'],
  ['small', 'smaller', 'smallest', 'short', 'moon', 'in the solar system'], ['fast', 'faster', 'fastest', 'short', 'rocket', 'in the museum'],
  ['tall', 'taller', 'tallest', 'short', 'building', 'in the city'], ['old', 'older', 'oldest', 'short', 'telescope', 'in the observatory'],
  ['heavy', 'heavier', 'heaviest', 'y', 'satellite', 'in orbit'], ['easy', 'easier', 'easiest', 'y', 'question', 'in the test'],
  ['happy', 'happier', 'happiest', 'y', 'student', 'in the class'], ['busy', 'busier', 'busiest', 'y', 'airport', 'in the country'],
  ['expensive', 'more expensive', 'most expensive', 'long', 'camera', 'in the shop'], ['beautiful', 'more beautiful', 'most beautiful', 'long', 'garden', 'in the city'],
  ['important', 'more important', 'most important', 'long', 'mission', 'this year'], ['interesting', 'more interesting', 'most interesting', 'long', 'book', 'in the library'],
  ['dangerous', 'more dangerous', 'most dangerous', 'long', 'road', 'in the area'], ['comfortable', 'more comfortable', 'most comfortable', 'long', 'seat', 'in the spaceship'],
  ['good', 'better', 'best', 'irr', 'player', 'in the team'], ['bad', 'worse', 'worst', 'irr', 'storm', 'this year'], ['far', 'farther', 'farthest', 'irr', 'planet', 'from the Sun'],
  ['cold', 'colder', 'coldest', 'short', 'planet', 'in the solar system'], ['bright', 'brighter', 'brightest', 'short', 'star', 'in the sky'], ['thin', 'thinner', 'thinnest', 'double', 'book', 'on the shelf']];
T.comparatives = r => {
  const [a, c, s, t, n, place] = r.pick(ADJ), sup = r.chance(0.5);
  const naiveC = t === 'long' ? a + 'er' : 'more ' + a, naiveS = t === 'long' ? a + 'est' : 'most ' + a;
  const noteNaive = t === 'long' ? 'الصفات الطويلة تأخذ more/most ولا تأخذ er/est.' : t === 'irr' ? 'الصفة "' + a + '" شاذة: ' + a + ' – ' + c + ' – ' + s + '.' : 'الصفات القصيرة تأخذ er/est ولا تأخذ more/most.';
  if (!sup) {
    const m = mcq(r, c, [[naiveC, noteNaive], [s, 'هذه صيغة التفضيل العليا (superlative)، ووجود "than" يعني مقارنة بين اثنين.'], [a, 'مع "than" نستخدم صيغة المقارنة.']], x => x);
    return { d: t === 'irr' || t === 'double' ? 2 : 1, q: 'Choose the correct answer:\nThis ' + n + ' is ___ than that one.', m, e: 'than ← صيغة المقارنة: ' + c + '.', lang: 'en' };
  }
  const m = mcq(r, s, [[naiveS, noteNaive], [c, 'هذه صيغة المقارنة، و"the ... ' + place + '" تدل على التفضيل الأعلى.'], [a, 'نحتاج صيغة التفضيل العليا مع the.']], x => x);
  return { d: t === 'irr' || t === 'double' ? 2 : 1, q: 'Choose the correct answer:\nIt is the ___ ' + n + ' ' + place + '.', m, e: 'the + superlative: the ' + s + '.', lang: 'en' };
};

const PL = [['child', 'children'], ['man', 'men'], ['woman', 'women'], ['tooth', 'teeth'], ['foot', 'feet'], ['mouse', 'mice'], ['box', 'boxes'], ['bus', 'buses'],
  ['watch', 'watches'], ['baby', 'babies'], ['city', 'cities'], ['knife', 'knives'], ['leaf', 'leaves'], ['wolf', 'wolves'], ['potato', 'potatoes'], ['tomato', 'tomatoes'],
  ['story', 'stories'], ['key', 'keys'], ['boy', 'boys'], ['toy', 'toys'], ['glass', 'glasses'], ['dish', 'dishes'], ['sheep', 'sheep'], ['fish', 'fish'],
  ['person', 'people'], ['goose', 'geese'], ['day', 'days'], ['life', 'lives'], ['half', 'halves'], ['hero', 'heroes'], ['country', 'countries'], ['brush', 'brushes'],
  ['church', 'churches'], ['shelf', 'shelves'], ['family', 'families'], ['wish', 'wishes'], ['fox', 'foxes'], ['star', 'stars'], ['planet', 'planets'], ['class', 'classes']];
T.plurals = r => {
  const [s, p] = r.pick(PL);
  const ds = [[s + 's', 'جمع "' + s + '" لا يُكوَّن بإضافة s فقط.'], [s + 'es', 'إضافة es تكون بعد s, sh, ch, x, o.'], [s.endsWith('y') ? s.slice(0, -1) + 'ies' : s.endsWith('f') ? s.slice(0, -1) + 'ves' : s.endsWith('fe') ? s.slice(0, -2) + 'ves' : s + 'ren', 'قاعدة التحويل لا تنطبق على هذه الكلمة.'], [s.endsWith('y') ? s + 'es' : s + 'ses', 'تهجئة غير صحيحة للجمع.']];
  const m = mcq(r, p, ds, x => x);
  return { d: (p === s + 's') ? 1 : 2, q: 'The plural of "' + s + '" is:', m, e: s + ' → ' + p + '.', lang: 'en' };
};

// word, arabic, synonym, antonym (null = none)
const VOC = [['huge', 'ضخم', 'enormous', 'tiny'], ['rapid', 'سريع', 'quick', 'slow'], ['begin', 'يبدأ', 'start', 'finish'], ['difficult', 'صعب', 'hard', 'easy'],
  ['brave', 'شجاع', 'courageous', 'cowardly'], ['ancient', 'قديم جداً', 'old', 'modern'], ['happy', 'سعيد', 'glad', 'sad'], ['clever', 'ذكي', 'intelligent', 'stupid'],
  ['wealthy', 'ثري', 'rich', 'poor'], ['purchase', 'يشتري', 'buy', 'sell'], ['silent', 'صامت', 'quiet', 'noisy'], ['assist', 'يساعد', 'help', 'hinder'],
  ['reduce', 'يقلل', 'decrease', 'increase'], ['permit', 'يسمح', 'allow', 'forbid'], ['famous', 'مشهور', 'well-known', 'unknown'], ['strong', 'قوي', 'powerful', 'weak'],
  ['correct', 'صحيح', 'right', 'wrong'], ['arrive', 'يصل', 'reach', 'leave'], ['gather', 'يجمع', 'collect', 'scatter'], ['obvious', 'واضح', 'clear', 'hidden'],
  ['precious', 'ثمين', 'valuable', 'worthless'], ['recall', 'يتذكر', 'remember', 'forget'], ['tidy', 'مرتب', 'neat', 'messy'], ['expand', 'يتمدد', 'enlarge', 'shrink'],
  ['ill', 'مريض', 'sick', 'healthy'], ['vanish', 'يختفي', 'disappear', 'appear'], ['shout', 'يصرخ', 'yell', 'whisper'], ['dangerous', 'خطير', 'risky', 'safe'],
  ['cheap', 'رخيص', 'inexpensive', 'expensive'], ['empty', 'فارغ', 'vacant', 'full'], ['near', 'قريب', 'close', 'far'], ['wide', 'واسع', 'broad', 'narrow'],
  ['polite', 'مهذب', 'courteous', 'rude'], ['honest', 'أمين', 'truthful', 'dishonest'], ['victory', 'انتصار', 'triumph', 'defeat'], ['attack', 'يهاجم', 'assault', 'defend'],
  ['important', 'مهم', 'significant', 'trivial'], ['boring', 'ممل', 'dull', 'exciting'], ['beautiful', 'جميل', 'pretty', 'ugly'], ['shy', 'خجول', 'timid', 'confident'],
  ['hate', 'يكره', 'detest', 'love'], ['tired', 'متعب', 'exhausted', 'energetic'], ['lazy', 'كسول', 'idle', 'hardworking'], ['raise', 'يرفع', 'lift', 'lower'],
  ['enter', 'يدخل', null, 'exit'], ['accept', 'يقبل', null, 'refuse'], ['succeed', 'ينجح', null, 'fail'], ['maximum', 'الحد الأقصى', 'highest', 'minimum'],
  ['inside', 'داخل', null, 'outside'], ['fix', 'يصلح', 'repair', 'break'], ['light', 'خفيف', null, 'heavy'], ['public', 'عام', null, 'private'],
  ['agree', 'يوافق', null, 'disagree'], ['deep', 'عميق', null, 'shallow'], ['rough', 'خشن', null, 'smooth'], ['permanent', 'دائم', 'lasting', 'temporary'],
  ['journey', 'رحلة', 'trip', null], ['observe', 'يلاحظ', 'watch', null], ['discover', 'يكتشف', 'find', null],
  ['protect', 'يحمي', 'guard', null], ['error', 'خطأ', 'mistake', null]];
const AR_OF = {}; VOC.forEach(([w, ar, s, a]) => { AR_OF[w] = AR_OF[w] || ar; });
T.vocab = r => {
  const e = r.pick(VOC), [w, ar, syn, ant] = e;
  const kind = r.pick(['syn', 'ant', 'mean'].filter(k => (k !== 'syn' || syn) && (k !== 'ant' || ant)));
  const others = VOC.filter(x => x[0] !== w && x[1] !== ar && x[2] !== syn);
  if (kind === 'mean') {
    const pool = r.shuffle(others).filter(x => x[1] !== ar).slice(0, 6);
    const m = mcq(r, ar, pool.map(x => [x[1], '«' + x[1] + '» هي معنى كلمة "' + x[0] + '".']), x => x);
    return { tag: 'vocab_syn', d: 1, q: 'The meaning of "' + w + '" is:', m, e: '"' + w + '" = ' + ar + '.', lang: 'en' };
  }
  const correct = kind === 'syn' ? syn : ant;
  const pool = r.shuffle(others).slice(0, 8).map(x => x[0]).filter(x => x !== correct && x !== w && x !== syn && x !== ant);
  const opp = kind === 'syn' ? ant : syn;
  const ds = [];
  if (opp) ds.push([opp, kind === 'syn' ? '"' + opp + '" عكس "' + w + '" وليست مرادفاً لها.' : '"' + opp + '" مرادف لـ "' + w + '" وليست عكسها.']);
  pool.forEach(p => ds.push([p, '"' + p + '" تعني «' + AR_OF[p] + '» ولا علاقة لها بمعنى "' + w + '" (' + ar + ').']));
  const m = mcq(r, correct, ds, x => x);
  return { tag: kind === 'syn' ? 'vocab_syn' : 'vocab_ant', d: 2, q: 'Choose the ' + (kind === 'syn' ? 'synonym' : 'opposite') + ' of "' + w + '":', m, e: '"' + w + '" (' + ar + ') — ' + (kind === 'syn' ? 'synonym' : 'opposite') + ': ' + correct + '.', lang: 'en' };
};


/* ---- grade 10-12 grammar ---- */
const REL_P = ['woman', 'man', 'student', 'scientist', 'pilot', 'engineer', 'girl', 'boy'];
const REL_PP = ['lives next door is very kind', 'works at the observatory is my neighbour', 'taught us physics last year is retiring', 'won the science fair is in my class', 'helped me yesterday was very polite', 'is standing at the door is my teacher'];
const REL_T = ['book', 'robot', 'telescope', 'rocket', 'laptop', 'camera', 'map', 'machine'];
const REL_TP = ['I borrowed from the library was very useful', 'is on the table belongs to me', 'we saw at the museum was amazing', 'you gave me works perfectly', 'broke yesterday was expensive', 'she is holding is very old'];
const REL_PL = ['school', 'city', 'village', 'hotel', 'laboratory', 'stadium', 'museum'];
const REL_PLP = ['I studied last year is very old', 'we met is close to the park', 'my father works is far from here', 'the match took place is huge'];
const REL_W = ['man', 'woman', 'student', 'boy', 'girl', 'pilot'];
const REL_WI = ['car', 'house', 'phone', 'laptop', 'bike', 'bag'];
T.relative_clauses = r => {
  const k = r.pick(['who', 'which', 'where', 'whose']);
  let q, ans;
  if (k === 'who') q = 'The ' + r.pick(REL_P) + ' ___ ' + r.pick(REL_PP) + '.';
  else if (k === 'which') q = 'The ' + r.pick(REL_T) + ' ___ ' + r.pick(REL_TP) + '.';
  else if (k === 'where') q = 'The ' + r.pick(REL_PL) + ' ___ ' + r.pick(REL_PLP) + '.';
  else q = 'The ' + r.pick(REL_W) + ' ___ ' + r.pick(REL_WI) + ' was stolen is very upset.';
  const why = { who: 'who تُستخدم للعاقل (شخص) ويأتي بعدها فعل.', which: 'which تُستخدم لغير العاقل (شيء).', where: 'where تُستخدم للمكان.', whose: 'whose تدل على الملكية ويأتي بعدها اسم.' };
  const ds = ['who', 'which', 'where', 'whose'].filter(x => x !== k).map(x => [x, '"' + x + '" لا تناسب هنا. ' + why[k].replace(/^\w+ /, k + ' ')]);
  const m = mcq(r, k, ds, x => x);
  return { d: k === 'whose' ? 2 : 1, q: 'Choose the correct relative pronoun:\n' + q, m, e: why[k], lang: 'en' };
};

const MOD = [
  ['You ___ smoke in the hospital. It is forbidden.', "mustn't", [["don't have to", 'don\'t have to تعني "غير مضطر" وليس "ممنوع".'], ['can', 'can تعني القدرة أو السماح، والمقصود هنا المنع.'], ['might', 'might تعبر عن احتمال وليس منعاً.']], 'ممنوع ← mustn\'t.', 1],
  ['Students ___ run in the corridors. The school rules do not allow it.', "mustn't", [["don't have to", 'don\'t have to = ليس ضرورياً، لكنه هنا ممنوع.'], ['may', 'may للسماح أو الاحتمال.'], ['could', 'could للقدرة في الماضي أو الاقتراح.']], 'القواعد تمنع ← mustn\'t.', 1],
  ['Tomorrow is a holiday, so we ___ go to school.', "don't have to", [["mustn't", 'mustn\'t = ممنوع، والمقصود غير مضطرين.'], ['must', 'must = إلزام وهذا عكس المعنى.'], ['should', 'should = نصيحة، والسياق يدل على عدم الضرورة.']], 'العطلة تعني عدم الضرورة ← don\'t have to.', 1],
  ['You ___ bring a pen. The school will give you one.', "don't have to", [["mustn't", 'mustn\'t = ممنوع، والمقصود عدم الضرورة.'], ['must', 'must = إلزام، لكن المدرسة ستعطيك قلماً.'], ['can\'t', 'can\'t = لا يمكن، وليس هذا المعنى.']], 'غير ضروري ← don\'t have to.', 1],
  ["I'm sure he ___ be at home. I saw his car outside.", 'must', [["can't", 'can\'t للاستنتاج النفي (متأكد أنه ليس هناك).'], ["mustn't", 'mustn\'t للمنع وليس للاستنتاج.'], ['should', 'should للنصيحة.']], 'استنتاج قوي إيجابي ← must.', 2],
  ["He is in London this week, so he ___ be at the party tonight.", "can't", [['must', 'must استنتاج إيجابي، والدليل هنا ينفي وجوده.'], ['should', 'should للنصيحة.'], ['may', 'may احتمال ضعيف وليس نفياً قاطعاً.']], 'استنتاج نفي قوي ← can\'t.', 2],
  ['When I was five, I ___ swim.', 'could', [['can', 'can للحاضر، والجملة في الماضي (when I was five).'], ['must', 'must للإلزام.'], ['will', 'will للمستقبل.']], 'قدرة في الماضي ← could.', 1],
  ['When she was young, she ___ run very fast.', 'could', [['can', 'can للحاضر.'], ['should', 'should للنصيحة.'], ['must', 'must للإلزام.']], 'قدرة في الماضي ← could.', 1],
  ['You look very tired. You ___ go to bed early.', 'should', [["shouldn't", 'shouldn\'t عكس النصيحة المطلوبة.'], ["mustn't", 'mustn\'t للمنع.'], ["can't", 'can\'t للاستنتاج النفي.']], 'نصيحة ← should.', 1],
  ['It is bad for your health, so you ___ eat so much sugar.', "shouldn't", [['should', 'should نصيحة بفعل الشيء، والمقصود النصح بتركه.'], ['must', 'must للإلزام.'], ['can', 'can للقدرة.']], 'نصيحة بالامتناع ← shouldn\'t.', 1],
  ['Visitors ___ touch the paintings in the museum. It is against the rules.', "mustn't", [["don't have to", 'don\'t have to = ليس ضرورياً، لكنه هنا ممنوع.'], ['can', 'can لا تعبر عن المنع هنا.'], ['should', 'should نصيحة وليست منعاً.']], 'ممنوع ← mustn\'t.', 1],
  ['The ticket is free, so you ___ pay anything.', "don't have to", [["mustn't", 'mustn\'t = ممنوع، والمقصود عدم الضرورة.'], ['must', 'must = إلزام.'], ['can\'t', 'can\'t = لا يمكنك.']], 'مجاني ← don\'t have to.', 1],
  ["The lab lights are off and the door is locked. Nobody ___ be inside.", "can't", [['must', 'must استنتاج إيجابي والدليل ينفي وجود أحد.'], ['should', 'should للنصيحة.'], ['could', 'could احتمال وليس نفياً قاطعاً.']], 'استنتاج نفي ← can\'t.', 2],
  ['She has been studying all night. She ___ be very tired.', 'must', [["can't", 'can\'t استنتاج نفي.'], ["mustn't", 'mustn\'t للمنع.'], ["shouldn't", 'shouldn\'t نصيحة بالامتناع.']], 'استنتاج قوي ← must.', 2],
  ['You ___ wear a seat belt. It is the law.', 'must', [["mustn't", 'mustn\'t تعني ممنوع، والمقصود إلزام.'], ["don't have to", 'don\'t have to = غير ضروري، لكنه قانون.'], ['can', 'can لا تعبر عن الإلزام.']], 'قانون ← must.', 1],
  ['Our grandfather ___ ride a horse when he was young, but now he cannot.', 'could', [['can', 'can للحاضر.'], ['must', 'must للإلزام.'], ['should', 'should للنصيحة.']], 'قدرة في الماضي ← could.', 1],
  ['You ___ drink more water. It is good for you.', 'should', [["shouldn't", 'shouldn\'t عكس النصيحة.'], ["mustn't", 'mustn\'t للمنع.'], ["can't", 'can\'t استنتاج نفي.']], 'نصيحة ← should.', 1],
  ['___ I come in, sir?', 'May', [['Must', 'must للإلزام.'], ['Should', 'should للنصيحة.'], ['Mustn\'t', 'mustn\'t للمنع.']], 'طلب إذن مهذب ← May.', 1],
  ['___ I borrow your pen, please?', 'May', [['Must', 'must للإلزام ولا يُستخدم في طلب الإذن.'], ['Should', 'should للنصيحة.'], ['Would', 'would لا تأتي بهذا الشكل مع I في طلب الإذن.']], 'طلب إذن مهذب ← May.', 1]
];
T.modals = r => {
  const [q, a, ds, e, d] = r.pick(MOD);
  const m = mcq(r, a, ds, x => x);
  return { d, q: 'Choose the correct answer:\n' + q, m, e, lang: 'en' };
};

const RS_SUBJ = [['Omar', 'he', 'his'], ['Mona', 'she', 'her'], ['My brother', 'he', 'his'], ['The teacher', 'she', 'her'], ['The engineer', 'he', 'his'], ['Salma', 'she', 'her']];
// [direct speech, correct reported verb phrase, [wrong, note] x3]   ({p} = his/her)
const NOSHIFT = 'لم يتم إرجاع الزمن خطوة للوراء بعد فعل التقرير الماضي (said).';
const RS_ITEMS = [
  ['"I like physics."', 'liked physics', [['likes physics', NOSHIFT], ['had liked physics', 'had liked = past perfect لا تناسب مضارعاً بسيطاً.'], ['will like physics', 'will للمستقبل.']], 'المضارع البسيط ← الماضي البسيط', 2],
  ['"I study every night."', 'studied every night', [['studies every night', NOSHIFT], ['had studied every night', 'past perfect لا تناسب مضارعاً بسيطاً.'], ['was studying every night', 'المستمر لا يناسب عادة متكررة.']], 'المضارع البسيط ← الماضي البسيط', 2],
  ['"I live near the school."', 'lived near the school', [['lives near the school', NOSHIFT], ['had lived near the school', 'past perfect لا تناسب مضارعاً بسيطاً.'], ['will live near the school', 'will للمستقبل.']], 'المضارع البسيط ← الماضي البسيط', 2],
  ['"I need a new laptop."', 'needed a new laptop', [['needs a new laptop', NOSHIFT], ['had needed a new laptop', 'past perfect لا تناسب مضارعاً بسيطاً.'], ['will need a new laptop', 'will للمستقبل.']], 'المضارع البسيط ← الماضي البسيط', 2],
  ['"I am reading a science book."', 'was reading a science book', [['is reading a science book', NOSHIFT], ['has read a science book', 'المضارع التام لا يناسب المستمر.'], ['reads a science book', NOSHIFT]], 'المضارع المستمر ← الماضي المستمر', 3],
  ['"I am working on a project."', 'was working on a project', [['is working on a project', NOSHIFT], ['had worked on a project', 'past perfect تغيّر المعنى من مستمر إلى منتهٍ.'], ['works on a project', NOSHIFT]], 'المضارع المستمر ← الماضي المستمر', 3],
  ['"I will visit the museum."', 'would visit the museum', [['will visit the museum', 'will تصبح would بعد فعل ماضٍ.'], ['would to visit the museum', 'بعد would يأتي المصدر بدون to.'], ['visited the museum', 'would ضرورية للتعبير عن المستقبل في الماضي.']], 'will ← would', 2],
  ['"I will send the report."', 'would send the report', [['will send the report', 'will تصبح would بعد فعل ماضٍ.'], ['would sent the report', 'بعد would يأتي المصدر وليس الماضي.'], ['sent the report', 'would ضرورية للتعبير عن المستقبل في الماضي.']], 'will ← would', 2],
  ['"I can solve this problem."', 'could solve that problem', [['can solve this problem', 'can تصبح could و this تصبح that.'], ['could solve this problem', 'this تصبح that في الكلام غير المباشر.'], ['can solve that problem', 'can تصبح could.']], 'can ← could', 3],
  ['"I can speak three languages."', 'could speak three languages', [['can speak three languages', 'can تصبح could.'], ['would speak three languages', 'would ليست ماضي can.'], ['could spoke three languages', 'بعد could يأتي المصدر.']], 'can ← could', 2],
  ['"I have finished my homework."', 'had finished {p} homework', [['has finished {p} homework', NOSHIFT], ['finished {p} homework', 'نحتاج past perfect (had + p.p) وليس الماضي البسيط.'], ['will have finished {p} homework', 'will have للمستقبل التام.']], 'المضارع التام ← past perfect', 3],
  ['"I have never seen the sea."', 'had never seen the sea', [['has never seen the sea', NOSHIFT], ['never saw the sea', 'نحتاج past perfect (had + p.p).'], ['will never see the sea', 'will للمستقبل.']], 'المضارع التام ← past perfect', 3],
  ['"I play chess every week."', 'played chess every week', [['plays chess every week', NOSHIFT], ['had played chess every week', 'past perfect لا تناسب مضارعاً بسيطاً.'], ['will play chess every week', 'will للمستقبل.']], 'المضارع البسيط ← الماضي البسيط', 2],
  ['"I enjoy science lessons."', 'enjoyed science lessons', [['enjoys science lessons', NOSHIFT], ['had enjoyed science lessons', 'past perfect لا تناسب مضارعاً بسيطاً.'], ['will enjoy science lessons', 'will للمستقبل.']], 'المضارع البسيط ← الماضي البسيط', 2],
  ['"I am studying for the exam."', 'was studying for the exam', [['is studying for the exam', NOSHIFT], ['had studied for the exam', 'past perfect تغيّر المعنى.'], ['studies for the exam', NOSHIFT]], 'المضارع المستمر ← الماضي المستمر', 3],
  ['"I will join the science club."', 'would join the science club', [['will join the science club', 'will تصبح would بعد فعل ماضٍ.'], ['would joined the science club', 'بعد would يأتي المصدر.'], ['joined the science club', 'would ضرورية للتعبير عن المستقبل في الماضي.']], 'will ← would', 2],
  ['"I have lost my keys."', 'had lost {p} keys', [['has lost {p} keys', NOSHIFT], ['lost {p} keys', 'نحتاج past perfect (had + p.p).'], ['will have lost {p} keys', 'will have للمستقبل التام.']], 'المضارع التام ← past perfect', 3],
  ['"I can see the stars clearly."', 'could see the stars clearly', [['can see the stars clearly', 'can تصبح could.'], ['would see the stars clearly', 'would ليست ماضي can.'], ['could saw the stars clearly', 'بعد could يأتي المصدر.']], 'can ← could', 2],
  ['"I visited the lab yesterday."', 'had visited the lab the day before', [['visited the lab yesterday', 'الماضي البسيط يصبح past perfect، و yesterday تصبح the day before.'], ['had visited the lab yesterday', 'yesterday تتحول إلى the day before.'], ['visited the lab the day before', 'الفعل يحتاج had + p.p أيضاً.']], 'الماضي البسيط ← past perfect', 3]
];
T.reported_speech = r => {
  const [sj, pr, pos] = r.pick(RS_SUBJ), it = r.pick(RS_ITEMS), f = x => x.replace('{p}', pos);
  const m = mcq(r, f(it[1]), it[2].map(([t, n]) => [f(t), n]), x => x);
  return { d: it[4], q: 'Choose the correct answer:\n' + sj + ' said, ' + it[0] + '\n→ ' + sj + ' said that ' + pr + ' ___.', m, e: it[3] + ' ← ' + f(it[1]) + '.', lang: 'en' };
};

const GER = [['enjoy', 'enjoys'], ['avoid', 'avoids'], ['finish', 'finishes'], ['mind', 'minds'], ['suggest', 'suggests'], ['keep', 'keeps'], ['practise', 'practises'], ['imagine', 'imagines']];
const INF = [['want', 'wants'], ['decide', 'decides'], ['hope', 'hopes'], ['plan', 'plans'], ['promise', 'promises'], ['learn', 'learns'], ['manage', 'manages'], ['agree', 'agrees'], ['refuse', 'refuses']];
const ACT = [['play', 'playing', 'chess'], ['study', 'studying', 'physics'], ['read', 'reading', 'science books'], ['write', 'writing', 'reports'], ['swim', 'swimming', 'every day'], ['build', 'building', 'robots'],
  ['solve', 'solving', 'problems'], ['watch', 'watching', 'documentaries'], ['visit', 'visiting', 'museums'], ['draw', 'drawing', 'maps'], ['cook', 'cooking', 'dinner'], ['speak', 'speaking', 'English']];
T.gerund_inf = r => {
  const g = r.chance(0.5), [b3, t3] = r.pick(g ? GER : INF), [base, ing, obj] = r.pick(ACT), s = r.pick(RS_SUBJ)[0];
  const form = r.chance(0.5);
  const verb = form ? t3 : b3, subj = form ? s : r.pick(['I', 'We', 'They', 'You']);
  const correct = g ? ing : 'to ' + base;
  const past = base.endsWith('e') ? base + 'd' : (/[^aeiou]y$/.test(base) ? base.slice(0, -1) + 'ied' : base + 'ed');
  const ds = g ? [['to ' + base, 'بعد ' + b3 + ' نستخدم v-ing وليس to + مصدر.'], [base, 'بعد ' + b3 + ' لا يأتي المصدر مجرداً، بل v-ing.'], ['to ' + ing, 'to لا تأتي مع v-ing هنا.']]
    : [[ing, 'بعد ' + b3 + ' نستخدم to + مصدر وليس v-ing.'], [base, 'بعد ' + b3 + ' نحتاج to قبل المصدر.'], [past, 'لا نستخدم الماضي بعد ' + b3 + '.']];
  const m = mcq(r, correct, ds, x => x);
  return { d: 1, q: 'Choose the correct answer:\n' + subj + ' ' + verb + ' ___ ' + obj + '.', m, e: g ? b3 + ' + v-ing: ' + ing + '.' : b3 + ' + to + مصدر: to ' + base + '.', lang: 'en' };
};

Object.defineProperty(T, '__data', { value: { V, S, IRR, ADJ, PL, VOC }, enumerable: false });
module.exports = T;
