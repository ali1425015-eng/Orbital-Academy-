/* Concept catalogue: every question carries one conceptTag from this list.
   `lesson` is the short rule the offline tutor falls back on, and it is also
   sent to the LLM tutor so its explanation stays inside the curriculum. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.OA = root.OA || {}).Concepts = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var SUBJECTS = {
    iq:       { ar: 'الذكاء والمنطق', en: 'IQ & Logic', icon: '🧩', track: 'learning' },
    lenglish: { ar: 'اللغة الإنجليزية', en: 'English', icon: '💬', track: 'learning' },
    lscience: { ar: 'العلوم', en: 'Science', icon: '🔬', track: 'learning' },
    lmath:    { ar: 'الرياضيات', en: 'Math', icon: '➗', track: 'learning' },
    math:    { track: 'curriculum', ar: 'الرياضيات', en: 'Math',     icon: '🧮', system: 'power',  systemAr: 'مفاعل الطاقة' },
    science: { track: 'curriculum', ar: 'العلوم والفيزياء', en: 'Science', icon: '⚛️', system: 'shield', systemAr: 'الدرع الواقي' },
    english: { track: 'curriculum', ar: 'اللغة الإنجليزية', en: 'English',  icon: '🔤', system: 'comms',  systemAr: 'الاتصالات' },
    arabic:  { track: 'curriculum', ar: 'النحو العربي', en: 'Arabic Grammar', icon: '📜', system: 'oxygen', systemAr: 'إعادة تدوير الأكسجين' }
  };

  var GRADE_AR = { 0: 'تعلّم حر (خارج المنهج)', 7: 'الصف الأول الإعدادي', 8: 'الصف الثاني الإعدادي', 9: 'الصف الثالث الإعدادي', 10: 'الصف الأول الثانوي', 11: 'الصف الثاني الثانوي', 12: 'الصف الثالث الثانوي' };
  var C = {};
  function add(tag, subject, g0, g1, ar, lesson) { C[tag] = { tag: tag, subject: subject, grades: [g0, g1], ar: ar, lesson: lesson }; }

  // ---------- Math ----------
  add('int_ops', 'math', 7, 7, 'العمليات على الأعداد الصحيحة', 'حاصل ضرب أو قسمة عددين لهما نفس الإشارة موجب، ومختلفين في الإشارة سالب. عند الجمع: نفس الإشارة نجمع ونضع الإشارة، ومختلفين نطرح ونأخذ إشارة الأكبر قيمة مطلقة.');
  add('frac_add', 'math', 7, 7, 'جمع الكسور', 'لجمع كسرين نوحّد المقامات أولاً: a/b + c/d = (ad + bc) / bd ثم نختصر. لا نجمع المقامات أبداً.');
  add('frac_mul', 'math', 7, 7, 'ضرب الكسور', 'ضرب الكسور: البسط × البسط والمقام × المقام ثم نختصر. القسمة = الضرب في مقلوب الكسر الثاني.');
  add('percent', 'math', 7, 7, 'النسبة المئوية', 'p% من N = (p ÷ 100) × N. الزيادة بنسبة p% تعني الضرب في (1 + p/100).');
  add('ratio', 'math', 7, 7, 'النسبة والتناسب', 'لتقسيم كمية بنسبة a : b نقسمها إلى (a + b) جزءاً متساوياً، ثم نأخذ a جزءاً و b جزءاً.');
  add('lin_eq', 'math', 7, 8, 'المعادلات من الدرجة الأولى', 'لحل ax + b = c ننقل b للطرف الآخر بعكس إشارتها ثم نقسم على a: x = (c − b) / a.');
  add('exponents', 'math', 8, 8, 'قوانين الأسس', 'aᵐ × aⁿ = aᵐ⁺ⁿ ، aᵐ ÷ aⁿ = aᵐ⁻ⁿ ، (aᵐ)ⁿ = aᵐⁿ. نجمع الأسس عند الضرب ولا نضربها.');
  add('sqrt_simplify', 'math', 8, 8, 'تبسيط الجذور', '√(a² × b) = a√b. نبحث عن أكبر مربع كامل يقسم العدد تحت الجذر.');
  add('pythagoras', 'math', 8, 8, 'نظرية فيثاغورس', 'في المثلث القائم: (الوتر)² = مجموع مربعي الضلعين الآخرين: c² = a² + b². الوتر ليس مجموع الضلعين.');
  add('expand_square', 'math', 8, 8, 'مربع مقدار ذي حدين', '(x + a)² = x² + 2ax + a². لا ننسى الحد الأوسط 2ax.');
  add('circle_area', 'math', 8, 8, 'مساحة الدائرة', 'مساحة الدائرة = πr² ، ومحيطها = 2πr. نستخدم نصف القطر وليس القطر.');
  add('linear_func', 'math', 8, 8, 'الدالة الخطية', 'في y = mx + c نعوّض بقيمة x ثم نضرب في الميل m ونضيف الجزء المقطوع c.');
  add('lin_ineq', 'math', 9, 9, 'المتباينات', 'عند الضرب أو القسمة في عدد سالب ينقلب اتجاه المتباينة.');
  add('systems', 'math', 9, 9, 'حل معادلتين آنياً', 'بجمع المعادلتين x + y = s و x − y = d نحصل على 2x = s + d ، أي x = (s + d)/2.');
  add('quad_factor', 'math', 9, 10, 'حل المعادلة التربيعية بالتحليل', 'إذا كانت x² − (p+q)x + pq = 0 فإن (x − p)(x − q) = 0 ، والجذران p و q (بنفس إشارتهما داخل الأقواس معكوسة).');
  add('slope', 'math', 9, 9, 'ميل الخط المستقيم', 'الميل = (y₂ − y₁) ÷ (x₂ − x₁) — التغير في y على التغير في x.');
  add('mean_median', 'math', 9, 9, 'الوسط والوسيط', 'الوسط الحسابي = مجموع القيم ÷ عددها. الوسيط = القيمة في المنتصف بعد ترتيب القيم.');
  add('probability', 'math', 9, 9, 'الاحتمال', 'الاحتمال = عدد النواتج المطلوبة ÷ عدد كل النواتج الممكنة.');
  add('trig_special', 'math', 9, 10, 'النسب المثلثية للزوايا الخاصة', 'sin30° = 1/2 ، cos60° = 1/2 ، sin45° = cos45° = √2/2 ، tan45° = 1 ، sin60° = cos30° = √3/2.');
  add('discriminant', 'math', 10, 10, 'المميز ونوع الجذور', 'المميز Δ = b² − 4ac. إذا Δ > 0 جذران حقيقيان مختلفان، Δ = 0 جذر مكرر، Δ < 0 لا توجد جذور حقيقية.');
  add('func_eval', 'math', 10, 10, 'إيجاد قيمة دالة', 'عند التعويض بعدد سالب نضعه بين قوسين: (−k)² = k² موجب دائماً.');
  add('distance', 'math', 10, 10, 'البعد بين نقطتين', 'البعد = √((x₂ − x₁)² + (y₂ − y₁)²).');
  add('vectors', 'math', 10, 10, 'معيار المتجه', 'معيار المتجه (a , b) = √(a² + b²).');
  add('arith_seq', 'math', 11, 11, 'المتتابعة الحسابية', 'الحد النوني: aₙ = a₁ + (n − 1)d. لاحظ (n − 1) وليس n.');
  add('geo_seq', 'math', 11, 11, 'المتتابعة الهندسية', 'الحد النوني: aₙ = a₁ × rⁿ⁻¹.');
  add('logs', 'math', 11, 11, 'اللوغاريتمات', 'log_b(x) = y تعني bʸ = x. log_b(xy) = log_b x + log_b y.');
  add('limits', 'math', 11, 12, 'النهايات', 'إذا ظهرت صورة 0/0 نحلل البسط ونختصر: (x² − a²)/(x − a) = x + a ، فالنهاية عند x → a تساوي 2a.');
  add('derivative', 'math', 12, 12, 'المشتقة', 'مشتقة axⁿ هي n·a·xⁿ⁻¹ ، ومشتقة الثابت صفر.');
  add('integral', 'math', 12, 12, 'التكامل المحدد', '∫ xⁿ dx = xⁿ⁺¹/(n+1). التكامل المحدد = F(b) − F(a).');

  // ---------- Science / Physics ----------
  add('speed', 'science', 7, 7, 'السرعة', 'السرعة = المسافة ÷ الزمن (v = d / t). للتحويل من km/h إلى m/s نضرب في 5/18.');
  add('density', 'science', 7, 8, 'الكثافة', 'الكثافة = الكتلة ÷ الحجم (ρ = m / V).');
  add('weight', 'science', 8, 8, 'الوزن والجاذبية', 'الوزن = الكتلة × عجلة الجاذبية (W = m g). الكتلة ثابتة أما الوزن فيتغير من كوكب لآخر.');
  add('pressure', 'science', 8, 8, 'الضغط', 'الضغط = القوة ÷ المساحة (P = F / A) ووحدته باسكال N/m².');
  add('heat', 'science', 8, 9, 'كمية الحرارة', 'Q = m c ΔT حيث ΔT هو التغير في درجة الحرارة.');
  add('newton2', 'science', 9, 10, 'قانون نيوتن الثاني', 'القوة = الكتلة × العجلة (F = m a) ، إذن a = F / m.');
  add('work_power', 'science', 9, 10, 'الشغل والقدرة', 'الشغل W = F × d ، والقدرة P = W / t.');
  add('ohm', 'science', 9, 11, 'قانون أوم', 'فرق الجهد = شدة التيار × المقاومة (V = I R).');
  add('kinetic', 'science', 10, 10, 'طاقة الحركة', 'KE = ½ m v² — السرعة مربعة ولا ننسى النصف.');
  add('potential', 'science', 10, 10, 'طاقة الوضع', 'PE = m g h.');
  add('momentum', 'science', 10, 11, 'كمية الحركة', 'كمية الحركة p = m v.');
  add('waves', 'science', 10, 11, 'الموجات', 'سرعة الموجة = التردد × الطول الموجي (v = f λ).');
  add('hooke', 'science', 10, 10, 'قانون هوك', 'القوة = ثابت المرونة × الاستطالة (F = k x).');
  add('free_fall', 'science', 10, 10, 'السقوط الحر', 'من السكون: v = g t و h = ½ g t².');
  add('resistors', 'science', 11, 12, 'توصيل المقاومات', 'توالي: R = R₁ + R₂. توازي: R = R₁R₂ ÷ (R₁ + R₂) وتكون أصغر من أصغر مقاومة.');
  add('elec_power', 'science', 11, 12, 'القدرة الكهربية', 'P = V I = I² R.');
  add('magnetic_force', 'science', 11, 12, 'القوة المغناطيسية على سلك', 'القوة المؤثرة على سلك عمودي على المجال: F = B I L ، حيث B كثافة الفيض (تسلا) و I التيار (أمبير) و L الطول (متر).');
  add('coulomb', 'science', 11, 12, 'قانون كولوم', 'F = k q₁ q₂ / r² حيث k = 9×10⁹ N·m²/C². القوة تتناسب عكسياً مع مربع المسافة، ولا تنسَ تحويل الميكروكولوم (μC) إلى كولوم ×10⁻⁶.');
  add('capacitor', 'science', 12, 12, 'المكثف', 'شحنة المكثف Q = C V ، وطاقته المخزنة W = ½ C V². الطاقة تتناسب مع مربع الجهد.');
  add('faraday', 'science', 12, 12, 'قانون فارادي للحث', 'القوة الدافعة الحثية = N × (ΔΦ ÷ Δt) بالقيمة المطلقة، حيث N عدد اللفات و ΔΦ التغير في الفيض و Δt الزمن.');
  add('space_science', 'science', 7, 12, 'علوم الفضاء', 'الجاذبية تتناسب عكسياً مع مربع المسافة، والمدارات تنتج عن توازن السرعة المماسية مع الجاذبية.');
  add('gen_science', 'science', 7, 9, 'العلوم العامة', 'راجع المفهوم الأساسي في درس العلوم المرتبط بالسؤال.');

  // ---------- English ----------
  add('present_simple', 'english', 7, 7, 'Present Simple', 'نستخدم المضارع البسيط مع العادات (every day, usually, always). مع he/she/it نضيف s للفعل.');
  add('past_simple', 'english', 7, 7, 'Past Simple', 'الماضي البسيط مع (yesterday, ago, last week, in 2010): التصريف الثاني للفعل.');
  add('present_cont', 'english', 7, 7, 'Present Continuous', 'المضارع المستمر مع (now, at the moment, Look!, Listen!): am/is/are + v-ing.');
  add('future_will', 'english', 7, 8, 'Future Simple', 'المستقبل مع (tomorrow, next week, in the future): will + المصدر.');
  add('present_perfect', 'english', 8, 9, 'Present Perfect', 'المضارع التام مع (since, for, already, just, yet, ever): have/has + التصريف الثالث.');
  add('past_cont', 'english', 8, 9, 'Past Continuous', 'الماضي المستمر لحدث كان مستمراً عندما قاطعه حدث آخر: was/were + v-ing.');
  add('passive', 'english', 9, 11, 'Passive Voice', 'المبني للمجهول: verb to be (بنفس زمن الجملة) + التصريف الثالث.');
  add('conditionals', 'english', 10, 12, 'Conditionals', 'If + مضارع ← will + مصدر (النوع الأول). If + ماضي ← would + مصدر (النوع الثاني). If + had + p.p ← would have + p.p (النوع الثالث).');
  add('irregular_verbs', 'english', 7, 8, 'Irregular Verbs', 'الأفعال الشاذة لا تأخذ ed — يجب حفظ تصريفاتها الثلاثة.');
  add('comparatives', 'english', 7, 8, 'Comparatives & Superlatives', 'الصفات القصيرة: er / the est. الطويلة: more / the most. شواذ: good-better-best, bad-worse-worst.');
  add('plurals', 'english', 7, 7, 'Plural Nouns', 'معظم الأسماء + s ، وبعدها es بعد s, sh, ch, x ، وهناك جموع شاذة مثل child → children.');
  add('relative_clauses', 'english', 10, 12, 'Relative Clauses', 'who للعاقل (فاعل)، which لغير العاقل، where للمكان، whose للملكية (يأتي بعده اسم).');
  add('modals', 'english', 10, 11, 'Modal Verbs', 'must = إلزام / استنتاج قوي، mustn\'t = ممنوع، don\'t have to = غير مضطر، should = نصيحة، can\'t = استنتاج نفي، could = قدرة في الماضي.');
  add('reported_speech', 'english', 11, 12, 'Reported Speech', 'في الكلام غير المباشر بعد فعل ماضٍ نرجع زمناً للوراء: مضارع بسيط ← ماضٍ بسيط، مستمر ← ماضٍ مستمر، will ← would، can ← could، ماضٍ بسيط/مضارع تام ← past perfect.');
  add('gerund_inf', 'english', 10, 12, 'Gerund or Infinitive', 'بعد enjoy / avoid / finish / mind / suggest / keep / practise نستخدم v-ing. بعد want / decide / hope / plan / promise / learn / manage / agree / refuse نستخدم to + مصدر.');
  add('vocab_syn', 'english', 9, 12, 'Vocabulary: Synonyms', 'المرادف كلمة لها نفس المعنى تقريباً.');
  add('vocab_ant', 'english', 9, 12, 'Vocabulary: Antonyms', 'المضاد كلمة لها المعنى العكسي.');

  // ---------- Arabic grammar (النحو) ----------
  add('jam_mudhakkar', 'arabic', 7, 8, 'جمع المذكر السالم', 'جمع المذكر السالم يُرفع بالواو، ويُنصب ويُجر بالياء.');
  add('muthanna', 'arabic', 7, 8, 'المثنى', 'المثنى يُرفع بالألف، ويُنصب ويُجر بالياء.');
  add('asmaa_khamsa', 'arabic', 8, 9, 'الأسماء الخمسة', 'الأسماء الخمسة (أب، أخ، حم، فو، ذو) تُرفع بالواو وتُنصب بالألف وتُجر بالياء بشرط الإضافة لغير ياء المتكلم.');
  add('kana', 'arabic', 8, 10, 'كان وأخواتها', 'كان وأخواتها ترفع المبتدأ ويسمى اسمها، وتنصب الخبر ويسمى خبرها.');
  add('inna', 'arabic', 8, 10, 'إنّ وأخواتها', 'إنّ وأخواتها تنصب المبتدأ ويسمى اسمها، وترفع الخبر ويسمى خبرها.');
  add('af3al_khamsa', 'arabic', 9, 10, 'الأفعال الخمسة', 'الأفعال الخمسة تُرفع بثبوت النون، وتُنصب وتُجزم بحذف النون.');
  add('jazm', 'arabic', 8, 10, 'جزم الفعل المضارع', 'المضارع صحيح الآخر يُجزم بالسكون، والمعتل الآخر بحذف حرف العلة، والأفعال الخمسة بحذف النون.');
  add('nasb_mudari3', 'arabic', 8, 10, 'نصب الفعل المضارع', 'المضارع يُنصب بالفتحة الظاهرة، وتُقدَّر الفتحة على الألف للتعذر، والأفعال الخمسة تُنصب بحذف النون.');
  add('nahw_roles', 'arabic', 10, 12, 'الوظائف النحوية', 'الحال يبين الهيئة، والتمييز يزيل الإبهام، والمفعول لأجله يبين السبب، والمفعول المطلق يؤكد الفعل أو يبين نوعه أو عدده.');

  add('istithna', 'arabic', 11, 12, 'الاستثناء', 'المستثنى بـ(إلا) بعد كلام تام مثبت منصوب وجوباً. وإذا كان الكلام ناقصاً منفياً أُعرب حسب موقعه (فاعل مرفوع، مفعول به منصوب، مجرور بحرف الجر). والمستثنى بعد (غير) مضاف إليه مجرور.');
  add('nida', 'arabic', 11, 12, 'النداء', 'المنادى المفرد العلم أو النكرة المقصودة يُبنى على الضم (يا محمدُ). والمنادى المضاف منصوب (يا طالبَ العلمِ).');
  add('mamnu3', 'arabic', 11, 12, 'الممنوع من الصرف', 'الممنوع من الصرف (مثل أحمد، فاطمة، مساجد، صحراء) لا يُنوَّن، ويُجر بالفتحة نيابة عن الكسرة، إلا إذا دخلت عليه (ال) أو أُضيف فيُجر بالكسرة.');

  // ---------- Learning track (outside the school curriculum, Arabic + English) ----------
  function addL(tag, subject, ar, en, lesson, lessonEn) { C[tag] = { tag: tag, subject: subject, grades: [0, 0], ar: ar, en: en, lesson: lesson, lessonEn: lessonEn }; }
  addL('iq_numseq', 'iq', 'المتتابعات العددية', 'Number sequences', 'ابحث عن القاعدة: فرق ثابت، أو ضرب في عدد ثابت، أو فروق تزيد، أو نمطان متبادلان.', 'Find the rule: a constant difference, a constant multiplier, growing differences, or two alternating patterns.');
  addL('iq_letters', 'iq', 'أنماط الحروف', 'Letter patterns', 'رتّب الحروف حسب موقعها في الأبجدية واحسب كم حرفاً نقفز كل مرة.', 'Turn letters into their alphabet positions and find how many letters are skipped each time.');
  addL('iq_oddone', 'iq', 'الشاذ في المجموعة', 'Odd one out', 'ابحث عن الصفة المشتركة بين ثلاثة عناصر؛ العنصر الذي لا يملكها هو الشاذ.', 'Find what three items share; the item without that property is the odd one out.');
  addL('iq_analogy', 'iq', 'التناظر', 'Analogies', 'حدد العلاقة بين الكلمتين الأوليين ثم طبّق العلاقة نفسها على الزوج الثاني.', 'Name the relationship between the first pair, then apply the same relationship to the second pair.');
  addL('iq_logic', 'iq', 'ألغاز منطقية', 'Logic puzzles', 'اقرأ اللغز ببطء، وترجم كل جملة إلى معادلة أو حقيقة بسيطة قبل الحساب.', 'Read slowly and turn each sentence into a simple fact or equation before calculating.');
  addL('iq_calendar', 'iq', 'الأيام والتواريخ', 'Days & dates', 'الأسبوع 7 أيام: باقي القسمة على 7 يحدد اليوم.', 'A week has 7 days: the remainder when dividing by 7 tells you the day.');
  addL('lm_mental', 'lmath', 'الحساب الذهني', 'Mental arithmetic', 'قسّم العدد إلى عشرات وآحاد واحسب كل جزء ثم اجمع.', 'Split numbers into tens and ones, work each part, then combine.');
  addL('lm_order', 'lmath', 'ترتيب العمليات', 'Order of operations', 'الأقواس أولاً، ثم الضرب والقسمة، ثم الجمع والطرح.', 'Brackets first, then multiplication and division, then addition and subtraction.');
  addL('lm_percent', 'lmath', 'النسب المئوية في الحياة', 'Percentages in real life', 'الخصم p% يعني دفع (100 − p)% من السعر.', 'A p% discount means paying (100 − p)% of the price.');
  addL('lm_fraction', 'lmath', 'الكسور والأعداد العشرية', 'Fractions & decimals', 'حوّل كل الأعداد لصيغة واحدة (عشرية مثلاً) قبل المقارنة.', 'Convert everything to one form (e.g. decimals) before comparing.');
  addL('lm_ratio', 'lmath', 'النسبة وأفضل سعر', 'Ratios & best buy', 'قارن سعر القطعة الواحدة: السعر ÷ عدد القطع.', 'Compare the price of one item: price ÷ number of items.');
  addL('lm_equation', 'lmath', 'المعادلات البسيطة', 'Simple equations', 'افعل العملية العكسية على الطرفين حتى يبقى x وحده.', 'Do the inverse operation on both sides until x is alone.');
  addL('lm_average', 'lmath', 'المتوسط', 'Averages', 'المتوسط = مجموع القيم ÷ عددها.', 'Mean = sum of the values ÷ how many values.');
  addL('lm_geometry', 'lmath', 'المساحة والمحيط', 'Area & perimeter', 'مساحة المستطيل = الطول × العرض، ومحيطه = 2 × (الطول + العرض).', 'Rectangle area = length × width; perimeter = 2 × (length + width).');
  addL('lm_speed', 'lmath', 'السرعة والمسافة والزمن', 'Speed, distance & time', 'المسافة = السرعة × الزمن.', 'Distance = speed × time.');
  addL('lm_powers', 'lmath', 'القوى والجذور', 'Powers & roots', 'aⁿ تعني ضرب a في نفسه n مرة، والجذر التربيعي هو العدد الذي مربعه يساوي الرقم.', 'aⁿ means a multiplied by itself n times; a square root is the number whose square gives the value.');
  addL('lm_probability', 'lmath', 'الاحتمالات', 'Chance & probability', 'الاحتمال = عدد النتائج المطلوبة ÷ عدد كل النتائج الممكنة.', 'Probability = favourable outcomes ÷ all possible outcomes.');
  addL('ls_life', 'lscience', 'علوم الحياة', 'Life science', 'الكائنات الحية تتكون من خلايا، والنبات يصنع غذاءه بالبناء الضوئي.', 'Living things are made of cells; plants make food by photosynthesis.');
  addL('ls_chem', 'lscience', 'الكيمياء', 'Chemistry', 'المادة تتكون من ذرات، والعناصر لها رموز ثابتة في الجدول الدوري.', 'Matter is made of atoms; each element has a fixed symbol in the periodic table.');
  addL('ls_phys', 'lscience', 'الفيزياء', 'Physics', 'القوة تغيّر حركة الأجسام، والطاقة لا تفنى ولا تُستحدث بل تتحول.', 'Forces change motion; energy is never created or destroyed, only converted.');
  addL('ls_space', 'lscience', 'الأرض والفضاء', 'Earth & space', 'الأرض تدور حول نفسها (ليل ونهار) وحول الشمس (سنة).', 'Earth spins on its axis (day and night) and orbits the Sun (a year).');
  addL('ls_body', 'lscience', 'جسم الإنسان', 'Human body', 'لكل جهاز في الجسم وظيفة: الدوري ينقل الدم، والتنفسي يأخذ الأكسجين.', 'Each body system has a job: circulatory moves blood, respiratory takes in oxygen.');
  addL('ls_formula', 'lscience', 'حسابات علمية', 'Science calculations', 'اكتب القانون أولاً، ثم عوّض بالأرقام بوحداتها.', 'Write the formula first, then substitute the numbers with their units.');
  addL('ls_units', 'lscience', 'الوحدات والتحويلات', 'Units & conversions', '°F = °C × 9/5 + 32 ، K = °C + 273 ، 1 km = 1000 m.', '°F = °C × 9/5 + 32, K = °C + 273, 1 km = 1000 m.');
  addL('le_tenses', 'lenglish', 'الأزمنة', 'Verb tenses', 'الكلمة الدالة على الزمن (every day, yesterday, now, tomorrow) تحدد الزمن.', 'The time word (every day, yesterday, now, tomorrow) tells you which tense to use.');
  addL('le_irregular', 'lenglish', 'الأفعال الشاذة', 'Irregular verbs', 'الأفعال الشاذة لا تأخذ ed — احفظ تصريفاتها الثلاثة.', 'Irregular verbs do not take -ed; learn their three forms.');
  addL('le_comparatives', 'lenglish', 'المقارنة والتفضيل', 'Comparatives & superlatives', 'الصفات القصيرة: -er / the -est، والطويلة: more / the most.', 'Short adjectives: -er / the -est; long ones: more / the most.');
  addL('le_vocab', 'lenglish', 'المفردات', 'Vocabulary', 'المرادف له نفس المعنى، والمضاد له المعنى العكسي.', 'A synonym means the same; an antonym means the opposite.');
  addL('le_articles', 'lenglish', 'أدوات النكرة a / an', 'Articles a / an', 'نستخدم an قبل الصوت المتحرك (an apple, an hour) و a قبل الصوت الساكن (a car, a university).', 'Use "an" before a vowel SOUND (an apple, an hour) and "a" before a consonant sound (a car, a university).');
  addL('le_plurals', 'lenglish', 'الجمع', 'Plural nouns', 'معظم الأسماء + s ، و es بعد s/sh/ch/x ، وهناك جموع شاذة (child → children).', 'Most nouns add -s; add -es after s/sh/ch/x; some are irregular (child → children).');
  addL('le_prepositions', 'lenglish', 'حروف الجر للزمن', 'Prepositions of time', 'in للشهور والسنين، on للأيام والتواريخ، at للساعات.', 'in for months and years, on for days and dates, at for clock times.');

  // English names for the school-curriculum concepts (UI in English)
  var EN = { int_ops: 'Integer operations', frac_add: 'Adding fractions', frac_mul: 'Multiplying fractions', percent: 'Percentages', ratio: 'Ratio & proportion', lin_eq: 'Linear equations',
    exponents: 'Laws of exponents', sqrt_simplify: 'Simplifying roots', pythagoras: 'Pythagoras', expand_square: 'Square of a binomial', circle_area: 'Area of a circle', linear_func: 'Linear functions',
    lin_ineq: 'Inequalities', systems: 'Simultaneous equations', quad_factor: 'Factorising quadratics', slope: 'Slope of a line', mean_median: 'Mean & median', probability: 'Probability',
    trig_special: 'Special angles', discriminant: 'Discriminant', func_eval: 'Evaluating functions', distance: 'Distance between points', vectors: 'Vector magnitude', arith_seq: 'Arithmetic sequences',
    geo_seq: 'Geometric sequences', logs: 'Logarithms', limits: 'Limits', derivative: 'Derivatives', integral: 'Definite integrals', speed: 'Speed', density: 'Density', weight: 'Weight & gravity',
    pressure: 'Pressure', heat: 'Heat energy', newton2: "Newton's second law", work_power: 'Work & power', ohm: "Ohm's law", kinetic: 'Kinetic energy', potential: 'Potential energy',
    momentum: 'Momentum', waves: 'Waves', hooke: "Hooke's law", free_fall: 'Free fall', resistors: 'Resistors', elec_power: 'Electric power', magnetic_force: 'Magnetic force on a wire',
    coulomb: "Coulomb's law", capacitor: 'Capacitors', faraday: "Faraday's law", space_science: 'Space science', gen_science: 'General science', present_simple: 'Present simple',
    past_simple: 'Past simple', present_cont: 'Present continuous', future_will: 'Future with will', present_perfect: 'Present perfect', past_cont: 'Past continuous', passive: 'Passive voice',
    conditionals: 'Conditionals', irregular_verbs: 'Irregular verbs', comparatives: 'Comparatives', plurals: 'Plurals', relative_clauses: 'Relative clauses', modals: 'Modal verbs',
    reported_speech: 'Reported speech', gerund_inf: 'Gerund or infinitive', vocab_syn: 'Synonyms', vocab_ant: 'Antonyms', jam_mudhakkar: 'Sound masculine plural', muthanna: 'The dual',
    asmaa_khamsa: 'The five nouns', kana: 'Kana and its sisters', inna: 'Inna and its sisters', af3al_khamsa: 'The five verbs', jazm: 'Jussive mood', nasb_mudari3: 'Subjunctive mood',
    nahw_roles: 'Syntactic roles', istithna: 'Exception (istithnaa)', nida: 'Vocative (nidaa)', mamnu3: 'Diptotes (mamnu3 min al-sarf)' };
  Object.keys(EN).forEach(function (k) { if (C[k]) C[k].en = EN[k]; });

  var CURRICULUM = ['math', 'science', 'english', 'arabic'], LEARNING = ['iq', 'lenglish', 'lscience', 'lmath'];
  function subjectsFor(grade, lang) { return +grade === 0 ? LEARNING : (lang === 'en' ? CURRICULUM.filter(function (s) { return s !== 'arabic'; }) : CURRICULUM); }
  function name(tag, lang) { var c = C[tag]; return c ? (lang === 'en' ? (c.en || c.ar) : c.ar) : tag; }
  /* English rules for the curriculum concepts (the Arabic ones are the 5th argument of add()). */
  var LESSON_EN = {
 "int_ops": "The product or quotient of two numbers with the same sign is positive; with different signs it is negative. When adding: same signs — add and keep the sign; different signs — subtract and keep the sign of the number with the larger absolute value.",
 "frac_add": "To add fractions, make the denominators equal first: a/b + c/d = (ad + bc) / bd, then simplify. Never add the denominators.",
 "frac_mul": "Multiplying fractions: numerator × numerator and denominator × denominator, then simplify. Dividing = multiplying by the reciprocal of the second fraction.",
 "percent": "p% of N = (p ÷ 100) × N. Increasing by p% means multiplying by (1 + p/100).",
 "ratio": "To share an amount in the ratio a : b, split it into (a + b) equal parts, then take a parts and b parts.",
 "lin_eq": "To solve ax + b = c, move b to the other side with the opposite sign, then divide by a: x = (c − b) / a.",
 "exponents": "aᵐ × aⁿ = aᵐ⁺ⁿ, aᵐ ÷ aⁿ = aᵐ⁻ⁿ, (aᵐ)ⁿ = aᵐⁿ. Add the exponents when multiplying — don't multiply them.",
 "sqrt_simplify": "√(a² × b) = a√b. Look for the largest perfect square that divides the number under the root.",
 "pythagoras": "In a right triangle: hypotenuse² = sum of the squares of the other two sides: c² = a² + b². The hypotenuse is not the sum of the sides.",
 "expand_square": "(x + a)² = x² + 2ax + a². Don't forget the middle term 2ax.",
 "circle_area": "Area of a circle = πr², circumference = 2πr. Use the radius, not the diameter.",
 "linear_func": "In y = mx + c, substitute the value of x, multiply by the slope m, then add the intercept c.",
 "lin_ineq": "When you multiply or divide by a negative number, the inequality sign flips.",
 "systems": "Adding x + y = s and x − y = d gives 2x = s + d, so x = (s + d)/2.",
 "quad_factor": "If x² − (p+q)x + pq = 0 then (x − p)(x − q) = 0, so the roots are p and q (the signs inside the brackets are the opposite of the roots).",
 "slope": "Slope = (y₂ − y₁) ÷ (x₂ − x₁) — the change in y over the change in x.",
 "mean_median": "Mean = sum of values ÷ number of values. Median = the middle value after sorting.",
 "probability": "Probability = number of favourable outcomes ÷ number of all possible outcomes.",
 "trig_special": "sin30° = 1/2, cos60° = 1/2, sin45° = cos45° = √2/2, tan45° = 1, sin60° = cos30° = √3/2.",
 "discriminant": "Discriminant Δ = b² − 4ac. If Δ > 0 two different real roots, Δ = 0 one repeated root, Δ < 0 no real roots.",
 "func_eval": "When substituting a negative number, put it in brackets: (−k)² = k² is always positive.",
 "distance": "Distance = √((x₂ − x₁)² + (y₂ − y₁)²).",
 "vectors": "The magnitude of the vector (a , b) = √(a² + b²).",
 "arith_seq": "The nth term: aₙ = a₁ + (n − 1)d. Note (n − 1), not n.",
 "geo_seq": "The nth term: aₙ = a₁ × rⁿ⁻¹.",
 "logs": "log_b(x) = y means bʸ = x. log_b(xy) = log_b x + log_b y.",
 "limits": "If you get 0/0, factor the numerator and cancel: (x² − a²)/(x − a) = x + a, so the limit as x → a is 2a.",
 "derivative": "The derivative of axⁿ is n·a·xⁿ⁻¹, and the derivative of a constant is zero.",
 "integral": "∫ xⁿ dx = xⁿ⁺¹/(n+1). Definite integral = F(b) − F(a).",
 "speed": "Speed = distance ÷ time (v = d / t). To convert km/h to m/s, multiply by 5/18.",
 "density": "Density = mass ÷ volume (ρ = m / V).",
 "weight": "Weight = mass × gravitational acceleration (W = m g). Mass is constant, but weight changes from planet to planet.",
 "pressure": "Pressure = force ÷ area (P = F / A), measured in pascals (N/m²).",
 "heat": "Q = m c ΔT, where ΔT is the change in temperature.",
 "newton2": "Force = mass × acceleration (F = m a), so a = F / m.",
 "work_power": "Work W = F × d, and power P = W / t.",
 "ohm": "Potential difference = current × resistance (V = I R).",
 "kinetic": "KE = ½ m v² — the speed is squared, and don't forget the half.",
 "potential": "PE = m g h.",
 "momentum": "Momentum p = m v.",
 "waves": "Wave speed = frequency × wavelength (v = f λ).",
 "hooke": "Force = spring constant × extension (F = k x).",
 "free_fall": "From rest: v = g t and h = ½ g t².",
 "resistors": "In series: R = R₁ + R₂. In parallel: R = R₁R₂ ÷ (R₁ + R₂), which is smaller than the smallest resistance.",
 "elec_power": "P = V I = I² R.",
 "magnetic_force": "The force on a wire perpendicular to the field: F = B I L, where B is the flux density (tesla), I the current (amps) and L the length (metres).",
 "coulomb": "F = k q₁ q₂ / r², where k = 9×10⁹ N·m²/C². The force is inversely proportional to the square of the distance; remember to convert microcoulombs (μC) to coulombs (×10⁻⁶).",
 "capacitor": "Capacitor charge Q = C V, stored energy W = ½ C V². The energy is proportional to the square of the voltage.",
 "faraday": "Induced EMF = N × (ΔΦ ÷ Δt) in absolute value, where N is the number of turns, ΔΦ the change in flux and Δt the time.",
 "space_science": "Gravity is inversely proportional to the square of the distance, and orbits result from balancing sideways speed with gravity.",
 "gen_science": "Review the basic concept in your science lesson related to the question.",
 "present_simple": "We use present simple for habits (every day, usually, always). With he/she/it we add s to the verb.",
 "past_simple": "Past simple with (yesterday, ago, last week, in 2010): the second form of the verb.",
 "present_cont": "Present continuous with (now, at the moment, Look!, Listen!): am/is/are + v-ing.",
 "future_will": "Future with (tomorrow, next week, in the future): will + base verb.",
 "present_perfect": "Present perfect with (since, for, already, just, yet, ever): have/has + past participle.",
 "past_cont": "Past continuous for an action in progress when another action interrupted it: was/were + v-ing.",
 "passive": "Passive voice: the verb to be (in the same tense as the sentence) + past participle.",
 "conditionals": "If + present → will + base verb (first conditional). If + past → would + base verb (second). If + had + p.p. → would have + p.p. (third).",
 "irregular_verbs": "Irregular verbs don't take ed — you have to learn their three forms.",
 "comparatives": "Short adjectives: er / the est. Long adjectives: more / the most. Irregular: good-better-best, bad-worse-worst.",
 "plurals": "Most nouns + s, then es after s, sh, ch, x; and there are irregular plurals such as child → children.",
 "relative_clauses": "who for people (subject), which for things, where for places, whose for possession (followed by a noun).",
 "modals": "must = obligation / strong deduction, mustn't = forbidden, don't have to = not obliged, should = advice, can't = negative deduction, could = past ability.",
 "reported_speech": "In reported speech after a past verb we step the tense back: present simple → past simple, continuous → past continuous, will → would, can → could, past simple / present perfect → past perfect.",
 "gerund_inf": "After enjoy / avoid / finish / mind / suggest / keep / practise we use v-ing. After want / decide / hope / plan / promise / learn / manage / agree / refuse we use to + base verb.",
 "vocab_syn": "A synonym is a word with almost the same meaning.",
 "vocab_ant": "An antonym is a word with the opposite meaning."
};
  Object.keys(LESSON_EN).forEach(function (t) { if (C[t]) C[t].lessonEn = LESSON_EN[t]; });
  function lesson(tag, lang) { var c = C[tag]; return c ? (lang === 'en' ? (c.lessonEn || c.lesson) : c.lesson) : ''; }
  function subjectName(s, lang) { var x = SUBJECTS[s]; return x ? x[lang === 'en' ? 'en' : 'ar'] : s; }
  var gradeEn = { 0: 'Learning (outside the curriculum)', 7: 'Grade 7 (Prep 1)', 8: 'Grade 8 (Prep 2)', 9: 'Grade 9 (Prep 3)', 10: 'Grade 10 (Sec 1)', 11: 'Grade 11 (Sec 2)', 12: 'Grade 12 (Sec 3)' };
  function gradeName(g, lang) { return lang === 'en' ? gradeEn[g] : GRADE_AR[g]; }

  function forSubject(s) { return Object.keys(C).filter(function (k) { return C[k].subject === s; }); }
  return { SUBJECTS: SUBJECTS, ALL: C, forSubject: forSubject, GRADES: [7, 8, 9, 10, 11, 12], LEARNING_GRADE: 0, CURRICULUM: CURRICULUM, LEARNING: LEARNING,
    subjectsFor: subjectsFor, name: name, lesson: lesson, subjectName: subjectName, gradeName: gradeName, gradeEn: gradeEn, gradeAr: GRADE_AR };
});
