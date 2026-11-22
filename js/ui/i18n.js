/* Interface language (Arabic / English). Every visible string of the app is here.
   OA.t('key', {var: value}) → text in the current language; OA.I18N.set('en') flips the whole app (dir + lang). */
(function (OA) {
  var D = {
    ar: {
      appName: 'Orbital Academy', tagline: 'تعلّم من منهجك… وأنقذ مركبتك الفضائية',
      heroTitle: 'المذاكرة بقت مهمة فضائية', heroSub: 'أجب عن أسئلة مادتك لتصلح أعطال المركبة. ذكاء اصطناعي يكيّف الصعوبة على مستواك ويحمي تركيزك.',
      feat1: 'أكثر من 23 ألف سؤال من المنهج ومن خارجه', feat2: 'مدرس ذكي يشرح سبب كل خطأ', feat3: 'مهام قصيرة تحافظ على تركيزك',
      topAcademy: 'أفضل القادة', beFirst: 'كن أول قائد في القائمة 🚀',
      signIn: 'تسجيل الدخول', signUp: 'إنشاء حساب', welcomeBack: 'أهلاً بعودتك 👋', createTitle: 'ابدأ رحلتك التعليمية',
      welcomeSub: 'سجّل الدخول لتكمل مهمتك', createSub: 'حساب مجاني — أقل من دقيقة',
      username: 'اسم المستخدم', usernamePh: 'مثال: nour_ali', password: 'كلمة المرور', grade: 'الصف الدراسي', gradePh: 'اختر الصف أو وضع التعلّم الحر',
      learningOpt: '🌍 تعلّم حر — خارج المنهج (IQ، إنجليزي، علوم، رياضيات)', schoolGroup: 'المنهج الدراسي', learningGroup: 'خارج المنهج',
      accountType: 'نوع الحساب', student: 'طالب', teacher: 'معلم', classCode: 'كود الفصل', optional: 'اختياري', avatar: 'صورتك',
      doSignIn: 'دخول', doSignUp: 'إنشاء الحساب', orContinue: 'أو', google: 'المتابعة بحساب Google',
      noAccount: 'ليس لديك حساب؟', haveAccount: 'لديك حساب بالفعل؟', online: 'متصل بالخادم', offline: 'وضع غير متصل — البيانات على هذا الجهاز',
      questionsCount: '{n} سؤال', googleHint: 'تسجيل Google غير مفعّل على هذا الخادم. استخدم اسم المستخدم وكلمة المرور.',
      navHome: 'الرئيسية', navBoard: 'المتصدرون', navProgress: 'تقدمي', navSettings: 'الإعدادات', navTeacher: 'لوحة المعلم', logout: 'تسجيل الخروج', language: 'اللغة',
      hi: 'أهلاً، {name} 👋', level: 'المستوى {n}', streakDays: '{n} يوم متتالي', xp: 'XP',
      bannerTitle: 'جاهز لمهمة جديدة؟', bannerSub: 'اختر المادة مرة واحدة، ثم أصلح أعطال المركبة بالإجابة عن أسئلتها.',
      step1: 'اختر المادة', step2: 'مدة المهمة', byTime: 'بالوقت', byCount: 'بعدد الأسئلة', minutes: '{n} دقائق', minute3: '3 دقائق', questionsN: '{n} سؤالاً',
      startMission: 'ابدأ المهمة', missionNote: 'كل الأسئلة من {grade} — والصعوبة تتكيف مع مستواك.', missionNoteL: 'الأسئلة باللغة {lang} — والصعوبة تتكيف مع مستواك.',
      mastery: 'الإتقان', notStarted: 'لم تبدأ بعد', pickSubject: 'اختر المادة أولاً',
      dailyGoal: 'هدف اليوم', dailyOf: '{a} من {b} سؤالاً', focusScore: 'متوسط التركيز', focusHint: 'يقيسه الذكاء الاصطناعي من زمن الإجابة والتنقل بين التطبيقات',
      reviews: 'مراجعات', reviewsDue: '{n} سؤال مستحق للمراجعة', noReviews: 'لا مراجعات مستحقة', badges: 'الأوسمة', topGrade: 'الأفضل في {grade}', seeAll: 'عرض الكل',
      yourRank: 'ترتيبك #{r} من {t}', noPlayers: 'لا يوجد لاعبون بعد', tip: 'نصيحة',
      tips: ['الطلعات القصيرة (3–5 دقائق) تحافظ على تركيزك أعلى من جلسة طويلة.', 'التخمين السريع لا يمنح نقاطاً — اقرأ السؤال كاملاً.', 'إذا غادرت التطبيق أثناء المهمة تتوقف المركبة.', 'الأسئلة التي أخطأت فيها تعود لك لاحقاً للمراجعة.', 'المدرس الذكي يشرح سبب الخطأ، ويمكنك سؤاله قبل الإجابة دون أن يكشف الحل.'],
      exit: 'خروج', pause: 'إيقاف مؤقت', timeLeft: 'الوقت المتبقي', questionOf: 'سؤال {a} من {b}', combo: 'سلسلة', accuracy: 'الدقة', focus: 'التركيز',
      ship: 'حالة المركبة', oxygen: 'الأكسجين', power: 'الطاقة', shield: 'الدرع', comms: 'الاتصالات',
      crisisTitle: '{c}!', crisisSub: 'نظام {s} معطّل — أجب {n} لإصلاحه.', oneQ: 'عن سؤال', twoQ: 'عن سؤالين',
      fixed: 'تم إصلاح العطل!', fixedSub: 'الأنظمة مستقرة… جارِ المسح بحثاً عن أعطال جديدة', partial: 'إصلاح جزئي', partialSub: 'النظام ما زال ضعيفاً — استعد للعطل القادم',
      easy: 'سهل', medium: 'متوسط', hard: 'صعب', fifty: 'حذف إجابتين', hint: 'تلميح القاعدة', askTutor: 'اسأل المدرس', halfXp: '½ XP', costPower: '−15 طاقة', keys: 'المفاتيح: 1–4 للإجابة · H تلميح · T المدرس',
      rule: 'القاعدة', copilot: 'المساعد الذكي', predicted: 'فرصة إجابتك صحيحاً', zoneEasy: 'سهل عليك', zoneFlow: 'منطقة التعلّم المثالية', zoneOk: 'تحدٍّ مناسب', zoneHard: 'تحدٍّ صعب',
      conceptMastery: 'إتقانك لـ «{c}»', focusState: 'حالة التركيز', focusGood: 'تركيز جيد', focusRisk: 'خطر تشتت', modelNote: 'نموذج تعلم آلي (انحدار لوجستي) · AUC {a}',
      log: 'سجل المهمة', rapid: 'تمهّل يا قائد — رصد النظام تخميناً سريعاً، والتخمين لا يمنح نقاطاً.', newBadge: 'وسام جديد: {b}', levelUp: 'ترقية! وصلت للمستوى {n}',
      timeUp: 'انتهى الوقت', confirmExit: 'إنهاء المهمة الآن؟ ستحتفظ بالنقاط التي جمعتها.', paused: 'المهمة متوقفة', pausedSub: 'المركبة في وضع الانتظار.', resume: 'استئناف',
      welcomeBackShip: 'مرحباً بعودتك', awaySub: 'توقفت المركبة أثناء غيابك. التنقل بين التطبيقات يخفض التركيز — أنهِ المهمة القصيرة ثم استرح.', backToMission: 'العودة للمهمة',
      focusBreak: 'استراحة تركيز قصيرة 🧘', focusBreakSub: 'لاحظ المساعد علامات تشتت. تنفّس مع الدائرة: شهيق حين تكبر… وزفير حين تصغر.', inhale: 'شهيق', exhale: 'زفير', backIn: 'تعود المهمة خلال {n} ث', continueNow: 'متابعة الآن',
      tutorTitle: 'المدرس الذكي', yourAnswer: 'إجابتك', correctAnswer: 'الصحيحة', timedOut: 'انتهى الوقت', analysing: 'يحلّل المدرس إجابتك…', localTutor: 'شرح المنهج (محلي)',
      askPlaceholder: 'اسأل المدرس عن هذه النقطة…', send: 'إرسال', continueMission: 'متابعة المهمة', tapToSkip: 'اضغط على النص لإظهاره كاملاً',
      chatTitle: 'اسأل المدرس الذكي', chatSub: 'اسأل عن الفكرة أو القاعدة — لن أكشف الإجابة قبل أن تحاول 😉', chatHello: 'أهلاً يا قائد! ما الذي يحيّرك في هذا السؤال؟',
      sugg1: 'اشرح لي القاعدة', sugg2: 'ما الخطوة الأولى؟', sugg3: 'أعطني مثالاً مشابهاً', backToQuestion: 'العودة للسؤال',
      debriefOk: 'المهمة اكتملت — المركبة سالمة', debriefAbort: 'أنهيت المهمة مبكراً', debriefFail: 'عودة اضطرارية — نفد {s}', debriefEnd: 'انتهت المهمة',
      dAnswered: 'أسئلة', dAccuracy: 'الدقة', dXp: 'XP (منها مكافأة {b})', dCombo: 'أفضل سلسلة', dFocus: 'التركيز', dRapid: 'تخمين سريع', dRank: 'الرتبة', dTotal: 'إجمالي XP',
      newBadges: 'أوسمة جديدة', practiced: 'المفاهيم التي تدربت عليها', adviceFocus: 'مؤشر تركيزك انخفض. خذ استراحة 5 دقائق بعيداً عن الشاشة قبل المهمة التالية.',
      adviceReview: 'راجع «{c}» — سيعيد لك النظام أسئلته قريباً.', adviceGreat: 'أداء ممتاز! سيرفع النظام مستوى الصعوبة تدريجياً.', adviceKeep: 'استمر! كل مهمة قصيرة تبني إتقانك خطوة بخطوة.',
      backHome: 'العودة للرئيسية', newMission: 'مهمة جديدة',
      boardTitle: 'لوحة المتصدرين', boardSub: 'نافس زملاءك واجمع XP بإجاباتك الصحيحة', scopeGlobal: 'الكل', scopeGrade: 'صفّي', scopeClass: 'فصلي', scopeWeekly: 'هذا الأسبوع',
      boardLocal: 'وضع غير متصل: القائمة تضم اللاعبين على هذا الجهاز فقط.', noClass: 'لم تنضم لفصل بعد — أضف كود الفصل من الإعدادات.',
      progressTitle: 'تقدمي', progressSub: 'تابع مستواك في كل مادة ومفهوم', missions: 'مهام', answers: 'إجابات', subjectLevel: 'مستواك المقدّر في كل مادة', subjectLevelHint: 'احتمال حل سؤال متوسط (Elo)',
      conceptsTitle: 'إتقان المفاهيم', conceptsHint: 'تتبع المعرفة البايزي (BKT)', noConcepts: 'ابدأ مهمة لتظهر مفاهيمك هنا', reviewQueue: 'أسئلة في قائمة المراجعة المتباعدة: {n} (مستحقة الآن: {d})',
      recent: 'آخر المهام', date: 'التاريخ', subject: 'المادة', correctCol: 'صحيح', result: 'النتيجة', downloadCsv: 'تنزيل إجاباتي (CSV)',
      settingsTitle: 'الإعدادات', profile: 'الملف الشخصي', learningMode: 'المسار', prefs: 'التفضيلات', sound: 'المؤثرات الصوتية', qTimer: 'مؤقت لكل سؤال', reduceMotion: 'تقليل الحركة',
      save: 'حفظ', saved: 'تم الحفظ ✓', joined: 'تم الانضمام للفصل ✓', about: 'حول النظام', mode: 'الوضع', bank: 'بنك الأسئلة', aiTutor: 'المدرس الذكي', mlModel: 'نموذج التعلم الآلي',
      aiLocal: 'شرح المنهج المحلي (لا يوجد مفتاح LLM)', modelSim: 'انحدار لوجستي · AUC {a} / {b} (بيانات محاكاة)', trackChanged: 'تم تغيير المسار ✓',
      teacherTitle: 'لوحة المعلم', teacherSub: 'تابع تقدم طلابك وتركيزهم', newClass: 'فصل جديد', classNamePh: 'اسم الفصل (مثلاً: 1/3 ثانوي)', classCreated: 'تم إنشاء الفصل — الكود: {c}',
      firstClass: 'أنشئ أول فصل لتبدأ متابعة طلابك.', joinCode: 'كود الانضمام', exportCsv: 'تصدير الإجابات CSV', studentCol: 'الطالب', missionsCol: 'مهام', focusCol: 'التركيز', rapidCol: 'تخمين سريع',
      weakestCol: 'أضعف المفاهيم', lastActive: 'آخر نشاط', noStudents: 'لا يوجد طلاب بعد — شارك الكود {c}', weakConcepts: 'المفاهيم الأضعف في الفصل', students: 'طالب',
      bankPreview: 'استعراض بنك الأسئلة', random5: 'اعرض 5 أسئلة عشوائية', teacherHint: 'شارك كود الفصل مع طلابك؛ يضيفونه عند التسجيل أو من الإعدادات.', tryGame: 'جرّب اللعبة',
      errors: {
        bad_credentials: 'اسم المستخدم أو كلمة المرور غير صحيحة.', username_taken: 'اسم المستخدم مستخدم بالفعل.', weak_password: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.',
        bad_username: 'اسم المستخدم: 3–20 حرفاً (حروف وأرقام و _ . -).', bad_grade: 'اختر الصف الدراسي أو وضع التعلّم الحر.', bad_class_code: 'كود الفصل غير صحيح.', rate_limited: 'محاولات كثيرة — انتظر دقيقة.',
        unauthorized: 'انتهت الجلسة — سجّل الدخول مرة أخرى.', network: 'تعذر الاتصال بالخادم.', google_not_configured: 'تسجيل Google غير مفعّل على هذا الخادم.', teachers_only: 'هذه الصفحة للمعلمين فقط.',
        mission_not_found: 'المهمة غير موجودة.', bad_subject: 'هذه المادة غير متاحة لمسارك.', mission_complete: 'اكتملت المهمة.', no_questions: 'لا توجد أسئلة متاحة.'
      }
    },
    en: {
      appName: 'Orbital Academy', tagline: 'Learn your subjects… and save your spaceship',
      heroTitle: 'Studying, turned into a space mission', heroSub: 'Answer questions from your subject to repair the ship. AI adapts the difficulty to your level and protects your focus.',
      feat1: '23,000+ questions — school curriculum and beyond', feat2: 'An AI tutor that explains every mistake', feat3: 'Short missions that keep you focused',
      topAcademy: 'Top Academy', beFirst: 'Be the first commander on the board 🚀',
      signIn: 'Sign in', signUp: 'Create account', welcomeBack: 'Welcome back 👋', createTitle: 'Start your learning journey',
      welcomeSub: 'Sign in to continue your mission', createSub: 'Free account — under a minute',
      username: 'Username', usernamePh: 'e.g. nour_ali', password: 'Password', grade: 'Grade', gradePh: 'Choose your grade or the learning track',
      learningOpt: '🌍 Learning — outside the curriculum (IQ, English, Science, Math)', schoolGroup: 'School curriculum', learningGroup: 'Outside the curriculum',
      accountType: 'Account type', student: 'Student', teacher: 'Teacher', classCode: 'Class code', optional: 'optional', avatar: 'Avatar',
      doSignIn: 'Sign in', doSignUp: 'Create account', orContinue: 'or', google: 'Continue with Google',
      noAccount: 'New here?', haveAccount: 'Already have an account?', online: 'Connected to server', offline: 'Offline mode — data stays on this device',
      questionsCount: '{n} questions', googleHint: 'Google sign-in is not enabled on this server. Use a username and password.',
      navHome: 'Home', navBoard: 'Leaderboard', navProgress: 'Progress', navSettings: 'Settings', navTeacher: 'Teacher', logout: 'Log out', language: 'Language',
      hi: 'Hi, {name} 👋', level: 'Level {n}', streakDays: '{n}-day streak', xp: 'XP',
      bannerTitle: 'Ready for a new mission?', bannerSub: 'Pick a subject once, then repair the ship by answering its questions.',
      step1: 'Choose a subject', step2: 'Mission length', byTime: 'By time', byCount: 'By questions', minutes: '{n} min', minute3: '3 min', questionsN: '{n} questions',
      startMission: 'Start mission', missionNote: 'All questions are from {grade} — difficulty adapts to your level.', missionNoteL: 'Questions are in {lang} — difficulty adapts to your level.',
      mastery: 'Mastery', notStarted: 'Not started', pickSubject: 'Choose a subject first',
      dailyGoal: 'Daily goal', dailyOf: '{a} of {b} questions', focusScore: 'Focus score', focusHint: 'Measured by AI from answer times and app switching',
      reviews: 'Reviews', reviewsDue: '{n} questions due for review', noReviews: 'No reviews due', badges: 'Badges', topGrade: 'Top in {grade}', seeAll: 'See all',
      yourRank: 'Your rank #{r} of {t}', noPlayers: 'No players yet', tip: 'Tip',
      tips: ['Short missions (3–5 min) keep your focus higher than one long session.', 'Rapid guessing earns no XP — read the whole question.', 'Leaving the app during a mission pauses the ship.', 'Questions you miss come back later for review.', 'The AI tutor explains why an answer is wrong, and you can ask it before answering — it won\'t reveal the answer.'],
      exit: 'Exit', pause: 'Pause', timeLeft: 'Time left', questionOf: 'Question {a} of {b}', combo: 'Combo', accuracy: 'Accuracy', focus: 'Focus',
      ship: 'Ship status', oxygen: 'Oxygen', power: 'Power', shield: 'Shield', comms: 'Comms',
      crisisTitle: '{c}!', crisisSub: '{s} system failing — answer {n} to repair it.', oneQ: 'one question', twoQ: 'two questions',
      fixed: 'System repaired!', fixedSub: 'Systems stable… scanning for new failures', partial: 'Partial repair', partialSub: 'The system is still weak — get ready for the next failure',
      easy: 'Easy', medium: 'Medium', hard: 'Hard', fifty: '50/50', hint: 'Rule hint', askTutor: 'Ask the tutor', halfXp: '½ XP', costPower: '−15 power', keys: 'Keys: 1–4 answer · H hint · T tutor',
      rule: 'Rule', copilot: 'AI co-pilot', predicted: 'Chance you answer correctly', zoneEasy: 'Easy for you', zoneFlow: 'In your learning zone', zoneOk: 'Good challenge', zoneHard: 'Tough challenge',
      conceptMastery: 'Your mastery of “{c}”', focusState: 'Focus status', focusGood: 'Focused', focusRisk: 'Distraction risk', modelNote: 'ML model (logistic regression) · AUC {a}',
      log: 'Mission log', rapid: 'Slow down, commander — that looked like a rapid guess, and guessing earns no XP.', newBadge: 'New badge: {b}', levelUp: 'Level up! You reached level {n}',
      timeUp: 'Time is up', confirmExit: 'End the mission now? You keep the XP you earned.', paused: 'Mission paused', pausedSub: 'The ship is on standby.', resume: 'Resume',
      welcomeBackShip: 'Welcome back', awaySub: 'The ship paused while you were away. Switching apps lowers your focus — finish the short mission, then take a break.', backToMission: 'Back to the mission',
      focusBreak: 'A short focus break 🧘', focusBreakSub: 'Your co-pilot noticed signs of distraction. Breathe with the circle: in as it grows… out as it shrinks.', inhale: 'Breathe in', exhale: 'Breathe out', backIn: 'Mission resumes in {n}s', continueNow: 'Continue now',
      tutorTitle: 'AI tutor', yourAnswer: 'Your answer', correctAnswer: 'Correct', timedOut: 'Time ran out', analysing: 'The tutor is analysing your answer…', localTutor: 'Curriculum explainer (offline)',
      askPlaceholder: 'Ask the tutor about this point…', send: 'Send', continueMission: 'Continue mission', tapToSkip: 'Tap the text to show it all',
      chatTitle: 'Ask the AI tutor', chatSub: 'Ask about the idea or the rule — I won\'t reveal the answer before you try 😉', chatHello: 'Hi commander! What is confusing you in this question?',
      sugg1: 'Explain the rule', sugg2: 'What is the first step?', sugg3: 'Give me a similar example', backToQuestion: 'Back to the question',
      debriefOk: 'Mission complete — the ship is safe', debriefAbort: 'You ended the mission early', debriefFail: 'Emergency return — {s} ran out', debriefEnd: 'Mission over',
      dAnswered: 'Questions', dAccuracy: 'Accuracy', dXp: 'XP (incl. {b} bonus)', dCombo: 'Best combo', dFocus: 'Focus', dRapid: 'Rapid guesses', dRank: 'Rank', dTotal: 'Total XP',
      newBadges: 'New badges', practiced: 'Concepts you practised', adviceFocus: 'Your focus dropped. Take a 5-minute screen break before the next mission.',
      adviceReview: 'Review “{c}” — its questions will come back soon.', adviceGreat: 'Excellent! The difficulty will rise gradually.', adviceKeep: 'Keep going! Every short mission builds mastery step by step.',
      backHome: 'Back to home', newMission: 'New mission',
      boardTitle: 'Leaderboard', boardSub: 'Compete with classmates and earn XP with correct answers', scopeGlobal: 'Everyone', scopeGrade: 'My grade', scopeClass: 'My class', scopeWeekly: 'This week',
      boardLocal: 'Offline mode: only players on this device are listed.', noClass: 'You haven\'t joined a class yet — add a class code in Settings.',
      progressTitle: 'My progress', progressSub: 'Track your level in every subject and concept', missions: 'Missions', answers: 'Answers', subjectLevel: 'Estimated level per subject', subjectLevelHint: 'chance of solving a medium question (Elo)',
      conceptsTitle: 'Concept mastery', conceptsHint: 'Bayesian Knowledge Tracing', noConcepts: 'Start a mission to see your concepts here', reviewQueue: 'Questions in spaced-review: {n} (due now: {d})',
      recent: 'Recent missions', date: 'Date', subject: 'Subject', correctCol: 'Correct', result: 'Result', downloadCsv: 'Download my answers (CSV)',
      settingsTitle: 'Settings', profile: 'Profile', learningMode: 'Track', prefs: 'Preferences', sound: 'Sound effects', qTimer: 'Timer per question', reduceMotion: 'Reduce motion',
      save: 'Save', saved: 'Saved ✓', joined: 'Joined the class ✓', about: 'About', mode: 'Mode', bank: 'Question bank', aiTutor: 'AI tutor', mlModel: 'ML model',
      aiLocal: 'Offline curriculum explainer (no LLM key)', modelSim: 'Logistic regression · AUC {a} / {b} (simulated data)', trackChanged: 'Track updated ✓',
      teacherTitle: 'Teacher dashboard', teacherSub: 'Follow your students\' progress and focus', newClass: 'New class', classNamePh: 'Class name (e.g. Grade 10-A)', classCreated: 'Class created — code: {c}',
      firstClass: 'Create your first class to start following your students.', joinCode: 'Join code', exportCsv: 'Export answers (CSV)', studentCol: 'Student', missionsCol: 'Missions', focusCol: 'Focus', rapidCol: 'Rapid guesses',
      weakestCol: 'Weakest concepts', lastActive: 'Last active', noStudents: 'No students yet — share the code {c}', weakConcepts: 'Weakest concepts in the class', students: 'students',
      bankPreview: 'Question bank preview', random5: 'Show 5 random questions', teacherHint: 'Share the class code with your students; they add it at sign-up or in Settings.', tryGame: 'Try the game',
      errors: {
        bad_credentials: 'Wrong username or password.', username_taken: 'That username is taken.', weak_password: 'The password needs at least 6 characters.',
        bad_username: 'Username: 3–20 characters (letters, digits, _ . -).', bad_grade: 'Choose a grade or the learning track.', bad_class_code: 'Invalid class code.', rate_limited: 'Too many attempts — wait a minute.',
        unauthorized: 'Your session expired — please sign in again.', network: 'Could not reach the server.', google_not_configured: 'Google sign-in is not enabled on this server.', teachers_only: 'This page is for teachers only.',
        mission_not_found: 'Mission not found.', bad_subject: 'That subject is not available on your track.', mission_complete: 'Mission complete.', no_questions: 'No questions available.'
      }
    }
  };
  var CRISES = {
    ar: { oxygen: ['تسرّب في دائرة الأكسجين', 'عطل في مُرشّح ثاني أكسيد الكربون', 'انخفاض ضغط الكبسولة'], power: ['خلل في معايرة المفاعل', 'انقطاع في الألواح الشمسية', 'حمل زائد على البطاريات'],
      shield: ['عاصفة شمسية تقترب', 'حزام كويكبات صغيرة', 'تشقق في الدرع الحراري'], comms: ['فقدان الإشارة مع الأرض', 'تشويش على الهوائي الرئيسي', 'رسالة مشفّرة من مركز التحكم'] },
    en: { oxygen: ['Oxygen loop leak', 'CO₂ scrubber failure', 'Cabin pressure drop'], power: ['Reactor calibration fault', 'Solar array outage', 'Battery overload'],
      shield: ['Solar storm incoming', 'Micro-asteroid belt ahead', 'Heat shield crack'], comms: ['Lost signal with Earth', 'Main antenna jamming', 'Encrypted message from mission control'] }
  };
  var lang = 'ar';
  try { lang = localStorage.getItem('oa_lang') || ((navigator.language || '').slice(0, 2) === 'en' ? 'en' : 'ar'); } catch (e) { }
  if (lang !== 'en') lang = 'ar';

  function t(key, vars) {
    var s = D[lang][key]; if (s == null) s = D.ar[key]; if (s == null) return key;
    if (typeof s === 'string' && vars) s = s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
    return s;
  }
  function apply() { var h = document.documentElement; h.lang = lang; h.dir = lang === 'ar' ? 'rtl' : 'ltr'; document.title = 'Orbital Academy'; }
  OA.t = t;
  OA.I18N = {
    get: function () { return lang; },
    set: function (l) { lang = l === 'en' ? 'en' : 'ar'; try { localStorage.setItem('oa_lang', lang); } catch (e) { } apply(); },
    err: function (code) { return (D[lang].errors[code]) || (lang === 'en' ? 'Something went wrong: ' : 'حدث خطأ: ') + code; },
    crises: function (sys) { return CRISES[lang][sys]; },
    apply: apply
  };
  apply();
})(window.OA = window.OA || {});
