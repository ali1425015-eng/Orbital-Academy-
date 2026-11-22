/* Teacher dashboard: classes, per-student progress + focus, weakest
   concepts in the class, CSV export, question-bank preview. */
(function (OA) {
  var U = OA.U, C = OA.Concepts;
  var current = null;

  function show() {
    U.show('teacher');
    var u = OA.app.user, el = U.$('#teacher');
    el.innerHTML = '<header class="glass topbar">' + U.logo() + '<div class="grow"></div><span class="chip">👩‍🏫 ' + U.esc(u.displayName) + '</span>' +
      '<button class="btn sm" id="t-hub">🛰️ تجربة اللعبة</button><button class="btn icon" id="t-out" aria-label="خروج">🚪</button></header>' +
      '<div class="hub-grid"><section class="glass"><div class="panel-h"><span>📊 فصولي</span><span class="en">CLASSES</span></div><div class="panel-b">' +
        '<form class="row" id="t-new"><input class="input" id="t-name" placeholder="اسم الفصل (مثلاً: 1/3 ثانوي)" maxlength="40"><button class="btn primary">+ فصل جديد</button></form>' +
        '<div id="t-classes" style="margin-top:12px"></div><div id="t-view" style="margin-top:16px"></div></div></section>' +
      '<aside class="stack"><section class="glass"><div class="panel-h"><span>📚 استعراض بنك الأسئلة</span></div><div class="panel-b stack">' +
        '<div class="row"><select class="input" id="t-subj">' + Object.keys(C.SUBJECTS).map(function (s) { return '<option value="' + s + '">' + C.SUBJECTS[s].ar + '</option>'; }).join('') + '</select>' +
        '<select class="input" id="t-grade">' + C.GRADES.map(function (g) { return '<option value="' + g + '"' + (g === u.gradeLevel ? ' selected' : '') + '>' + C.gradeAr[g] + '</option>'; }).join('') + '</select></div>' +
        '<button class="btn sm" id="t-fetch">🎲 اعرض 5 أسئلة عشوائية</button><div id="t-qs" class="stack"></div></div></section>' +
        '<div class="tip-card small">شارك <b>كود الفصل</b> مع طلابك؛ يضيفونه عند التسجيل أو من الإعدادات. ستظهر لك دقة كل طالب ومؤشر تركيزه ونسبة التخمين السريع وأضعف المفاهيم — لتعرف من يحتاج مساعدة ومتى.</div></aside></div>';
    U.$('#t-hub').onclick = function () { OA.Hub.show(); };
    U.$('#t-out').onclick = function () { OA.api.logout().then(function () { OA.Login.show(); }); };
    U.$('#t-new').onsubmit = function (e) { e.preventDefault(); OA.api.createClass(U.$('#t-name').value.trim()).then(function (r) { U.toast('تم إنشاء الفصل — الكود: <b class="en">' + r.code + '</b>', 'good', 6000); current = r.code; loadClasses(); }).catch(function (er) { U.toast(U.err(er), 'bad'); }); };
    U.$('#t-fetch').onclick = preview;
    loadClasses();
  }

  function loadClasses() {
    OA.api.classes().then(function (cls) {
      U.$('#t-classes').innerHTML = cls.length ? '<div class="tabs">' + cls.map(function (c) { return '<button class="btn sm ' + (c.code === current ? 'primary' : '') + '" data-c="' + c.code + '">' + U.esc(c.name) + ' · <span class="en">' + c.code + '</span> (' + c.students + ')</button>'; }).join('') + '</div>' : '<div class="empty">أنشئ أول فصل لتبدأ متابعة طلابك.</div>';
      U.$$('#t-classes [data-c]').forEach(function (b) { b.onclick = function () { current = b.dataset.c; loadClasses(); }; });
      if (!current && cls.length) current = cls[0].code;
      if (current) view(current);
    });
  }

  function view(code) {
    U.$('#t-view').innerHTML = '<div class="empty">…</div>';
    OA.api.classView(code).then(function (r) {
      var rows = r.students.map(function (s) {
        var warn = (s.focusAvg != null && s.focusAvg < 0.6) || (s.rapidRate != null && s.rapidRate > 0.15);
        return '<tr><td><span class="av" style="display:inline-grid;width:28px;height:28px">' + U.esc(s.avatar) + '</span> ' + U.esc(s.displayName) + '</td><td class="en">' + U.fmt(s.totalXP) + '</td><td class="en">' + s.missions + '</td><td class="en">' + U.pct(s.accuracy) + '</td>' +
          '<td class="en" style="color:' + (warn ? 'var(--red)' : 'inherit') + '">' + U.pct(s.focusAvg) + (warn ? ' ⚠️' : '') + '</td><td class="en">' + U.pct(s.rapidRate) + '</td><td class="small">' + (s.weakest.map(U.esc).join('، ') || '—') + '</td><td class="tiny">' + U.esc(s.lastActive || '—') + '</td></tr>';
      }).join('');
      var cons = r.concepts.slice(0, 10).map(function (c) { return '<div class="concept-row"><span>' + C.SUBJECTS[c.subject].icon + ' ' + U.esc(c.ar) + ' <span class="tiny dim">(' + c.students + ' طالب)</span></span><div class="bar"><i style="width:' + (c.avgMastery * 100).toFixed(0) + '%;background:' + (c.avgMastery < .4 ? 'var(--red)' : c.avgMastery < .7 ? 'var(--gold)' : 'var(--green)') + '"></i></div><span class="en small">' + Math.round(c.avgMastery * 100) + '%</span></div>'; }).join('');
      U.$('#t-view').innerHTML = '<div class="row between"><h3 style="margin:0">' + U.esc(r.class.name) + ' — كود الانضمام: <span class="en" style="color:var(--cyan)">' + r.class.code + '</span></h3><button class="btn sm" id="t-csv">📥 تصدير الإجابات CSV</button></div>' +
        (rows ? '<div style="overflow:auto;margin-top:10px"><table class="tbl"><thead><tr><th>الطالب</th><th>XP</th><th>مهام</th><th>الدقة</th><th>التركيز</th><th>تخمين سريع</th><th>أضعف المفاهيم</th><th>آخر نشاط</th></tr></thead><tbody>' + rows + '</tbody></table></div>' : '<div class="empty">لا يوجد طلاب بعد — شارك الكود <b class="en">' + r.class.code + '</b></div>') +
        (cons ? '<h3>🧩 المفاهيم الأضعف في الفصل</h3>' + cons : '');
      U.$('#t-csv').onclick = function () { OA.api.exportClass(code); };
    }).catch(function (e) { U.$('#t-view').innerHTML = '<div class="empty">' + U.err(e) + '</div>'; });
  }

  function preview() {
    OA.api.questions(U.$('#t-subj').value, +U.$('#t-grade').value, 5).then(function (qs) {
      U.$('#t-qs').innerHTML = qs.map(function (q) {
        return '<div class="tip-card" dir="' + (q.lang === 'en' ? 'ltr' : 'rtl') + '"><div class="tiny mut">' + U.esc((C.ALL[q.conceptTag] || {}).ar || q.conceptTag) + ' · ' + q.difficultyLabel + ' · ' + q.questionId + '</div><div class="qtext" style="font-size:1rem;margin:4px 0">' + U.qhtml(q.questionText) + '</div>' +
          q.options.map(function (o, i) { return '<div class="small" style="' + (i === q.correctOptionIndex ? 'color:var(--green);font-weight:800' : '') + '">' + (i + 1) + ') ' + U.esc(o) + (i === q.correctOptionIndex ? ' ✓' : '') + '</div>'; }).join('') + '</div>';
      }).join('');
    }).catch(function (e) { U.toast(U.err(e), 'bad'); });
  }

  OA.Teacher = { show: show };
})(window.OA = window.OA || {});
