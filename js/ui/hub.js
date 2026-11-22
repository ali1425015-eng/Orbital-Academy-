/* The Bridge (home). The student does NOT pick a subject here any more:
   a mission starts directly, ship systems break, and at every crisis the student
   chooses which subject to repair it with. This screen shows the level in each
   subject, the mission length and the launch button. */
(function (OA) {
  var U = OA.U, C = OA.Concepts, S = OA.Service;
  var HEX = { math: '#ffcf4a', science: '#a66bff', english: '#3dffa0', arabic: '#3fe0ff' };
  var TIPS = ['الطلعات القصيرة (3–5 دقائق) تحافظ على تركيزك أعلى من جلسة طويلة متواصلة.', 'التخمين السريع لا يمنح نقاطاً — اقرأ السؤال كاملاً قبل الإجابة.',
    'إذا غادرت التطبيق أثناء المهمة تتوقف المركبة وينخفض مؤشر التركيز.', 'الأسئلة التي أخطأت فيها تعود لك لاحقاً للمراجعة (تكرار متباعد).', 'السلسلة ×5 تعطيك مكافأة نقاط — الدقة أهم من السرعة.',
    'المدرس الذكي يشرح لك سبب الخطأ تحديداً، ويمكنك سؤاله قبل الإجابة أيضاً (بدون أن يكشف لك الحل).', 'عند كل عطل أنت تختار المادة — ابدأ بالمادة التي تريد تقويتها!'];
  var sel = { length: U.settings.length || 300 };

  function userChip(u) {
    var span = Math.max(1, u.nextLevelXP - u.levelXP), into = Math.max(0, u.totalXP - u.levelXP);
    return '<div class="userchip"><span class="av">' + U.esc(u.avatar) + '</span><div><div style="font-weight:800">' + U.esc(u.displayName) + ' <span class="chip gold" style="margin-inline-start:6px">' + u.rank.icon + ' ' + u.rank.ar + '</span></div>' +
      '<div class="row small mut" style="gap:8px"><span class="en">LV ' + u.currentLevel + '</span><div class="bar xpbar"><i style="width:' + (into / span * 100).toFixed(1) + '%"></i></div><span class="en">' + U.fmt(u.totalXP) + ' XP</span></div></div></div>';
  }

  function topbar(u) {
    return '<header class="glass topbar">' + U.logo() + '<div class="grow"></div>' + userChip(u) +
      '<span class="chip gold" title="أيام متتالية">🔥 ' + (u.streakDays || 0) + '</span>' +
      (u.role === 'teacher' ? '<button class="btn sm" id="to-teacher">👩‍🏫 لوحة المعلم</button>' : '') +
      '<button class="btn icon" id="b-board" title="لوحة المتصدرين" aria-label="لوحة المتصدرين">🏆</button>' +
      '<button class="btn icon" id="b-prog" title="تقدمي" aria-label="تقدمي">📈</button>' +
      '<button class="btn icon" id="b-set" title="الإعدادات" aria-label="الإعدادات">⚙️</button>' +
      '<button class="btn icon" id="b-out" title="خروج" aria-label="خروج">🚪</button></header>';
  }

  function subjectAvg(prog) {
    var mast = {}, out = {};
    (prog && prog.concepts || []).forEach(function (c) { (mast[c.subject] = mast[c.subject] || []).push(c.mastery); });
    Object.keys(C.SUBJECTS).forEach(function (s) { var a = mast[s]; out[s] = a && a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : null; });
    return out;
  }

  function render(u, prog) {
    var el = U.$('#hub'), avg = subjectAvg(prog);
    OA.app.subjAvg = avg;
    var today = (prog && prog.daily || [])[0], todayKey = new Date().toISOString().slice(0, 10);
    var doneToday = today && today.d === todayKey ? today.n : 0;
    var tiles = Object.keys(C.SUBJECTS).map(function (s) {
      return '<div class="subj-card" data-s="' + s + '" style="--c:' + HEX[s] + ';cursor:default"><span class="ico">' + C.SUBJECTS[s].icon + '</span><span><h3>' + C.SUBJECTS[s].ar + '</h3><span class="sub">' + U.esc(C.gradeAr[u.gradeLevel] || '') + '</span></span>' + U.ring(avg[s], HEX[s]) + '</div>';
    }).join('');
    var badges = Object.keys(S.BADGES).map(function (k) { var b = S.BADGES[k], on = u.badges.indexOf(k) >= 0; return '<span class="badge ' + (on ? '' : 'off') + '" title="' + b.ar + ' — ' + b.desc + '">' + b.icon + '</span>'; }).join('');
    el.innerHTML = topbar(u) +
      '<div class="hub-grid">' +
        '<section class="glass"><div class="panel-h"><span>🚀 جاهز للانطلاق؟</span><span class="en">MISSION</span></div><div class="panel-b">' +
          '<div class="tip-card" style="margin-bottom:14px"><b>كيف تعمل المهمة؟</b><br>تنطلق المركبة، وتقع أعطال في أنظمتها (الأكسجين ⚡ الطاقة 🛡️ الدرع 📡 الاتصالات). عند كل عطل <b>تختار أنت المادة</b> التي تريد الإصلاح بها وتدخل براحتك، ثم تجيب عن أسئلة <b>' + U.esc(C.gradeAr[u.gradeLevel] || '') + '</b> فقط.</div>' +
          '<div class="small mut" style="margin-bottom:8px">مستواك الحالي في كل مادة (إتقان المفاهيم)</div>' +
          '<div class="subj-grid">' + tiles + '</div>' +
          '<div class="launchbar"><div><div class="small mut" style="margin-bottom:4px">مدة المهمة</div><div class="seg" id="len">' +
            [[180, '⚡ 3 د'], [300, '🎯 5 د'], [600, '🚀 10 د']].map(function (x) { return '<button data-l="' + x[0] + '" class="' + (sel.length === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div></div>' +
            '<div class="grow small mut">طلعات قصيرة = تركيز أعلى. الصعوبة تتكيف تلقائياً مع مستواك.</div>' +
            '<button class="btn launch" id="launch">🚀 إطلاق المهمة</button></div>' +
        '</div></section>' +
        '<aside class="stack">' +
          '<section class="glass"><div class="panel-h"><span>🎯 هدف اليوم</span><span class="en">DAILY</span></div><div class="panel-b goal">' +
            '<div class="row between small"><span>' + doneToday + ' / 20 سؤالاً</span><span class="chip">' + (prog && prog.reviewsDue ? '🔁 ' + prog.reviewsDue + ' للمراجعة' : '✓ لا مراجعات مستحقة') + '</span></div>' +
            '<div class="bar" style="margin-top:8px"><i style="width:' + Math.min(100, doneToday / 20 * 100) + '%"></i></div>' +
            '<div class="row" style="margin-top:12px;gap:14px">' + U.ring(prog ? prog.focusAvg : null, '#3dffa0', 60) + '<div class="small"><b>متوسط تركيزك</b><div class="mut">يقيس الذكاء الاصطناعي تركيزك من زمن الإجابة والتنقل بين التطبيقات.</div></div></div>' +
          '</div></section>' +
          '<section class="glass"><div class="panel-h"><span>🏅 الأوسمة</span><span class="small mut">' + u.badges.length + ' / ' + Object.keys(S.BADGES).length + '</span></div><div class="panel-b"><div class="badges">' + badges + '</div></div></section>' +
          '<section class="glass"><div class="panel-h"><span>🏆 أفضل ' + U.esc(C.gradeAr[u.gradeLevel] || '') + '</span><button class="linkbtn small" id="b-board2">الكل</button></div><div id="mini-lb"><div class="empty small">…</div></div></section>' +
          '<div class="tip-card">💡 ' + TIPS[Math.floor(Math.random() * TIPS.length)] + '</div>' +
        '</aside>' +
      '</div>';

    U.$$('#len button', el).forEach(function (b) { b.onclick = function () { sel.length = +b.dataset.l; U.settings.length = sel.length; U.saveSettings(); U.$$('#len button').forEach(function (x) { x.classList.toggle('on', x === b); }); }; });
    U.$('#launch').onclick = function () { OA.Mission.start('mixed', sel.length); };
    U.$('#b-board').onclick = U.$('#b-board2').onclick = function () { OA.Panels.board(); };
    U.$('#b-prog').onclick = function () { OA.Panels.progress(); };
    U.$('#b-set').onclick = function () { OA.Panels.settings(); };
    U.$('#b-out').onclick = function () { OA.api.logout().then(function () { OA.app.user = null; OA.Login.show(); }); };
    if (U.$('#to-teacher')) U.$('#to-teacher').onclick = function () { OA.Teacher.show(); };

    OA.api.board('grade').then(function (r) {
      U.$('#mini-lb').innerHTML = r.top.length ? r.top.slice(0, 5).map(function (p, i) {
        return '<div class="lb-row">' + U.medal(i) + '<span class="av">' + U.esc(p.avatar) + '</span><span class="lb-name">' + U.esc(p.displayName || p.username) + '</span><span class="lb-score">' + U.fmt(p.totalXP) + '</span></div>';
      }).join('') + (r.me.rank ? '<div class="lb-row small mut"><span>ترتيبك: <b class="en" style="color:#fff">#' + r.me.rank + '</b> من ' + r.me.total + '</span></div>' : '') : '<div class="empty small">لا يوجد لاعبون بعد</div>';
    }).catch(function () { });
  }

  OA.Hub = {
    show: function () {
      U.show('hub');
      render(OA.app.user, null);
      OA.api.progress().then(function (p) { OA.app.user = p.user; render(p.user, p); }).catch(function (e) { if (e && e.code === 'unauthorized') OA.Login.show(); });
    },
    HEX: HEX
  };
})(window.OA = window.OA || {});
