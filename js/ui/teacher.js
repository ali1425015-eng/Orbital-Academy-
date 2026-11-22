/* Teacher dashboard (a page inside the app shell). */
(function (OA) {
  var U = OA.U, C = OA.Concepts, t = function (k, v) { return OA.t(k, v); };
  var current = null;

  OA.Pages.teacher = function (el) {
    var u = OA.app.user;
    if (u.role !== 'teacher') { el.innerHTML = '<div class="empty">' + OA.I18N.err('teachers_only') + '</div>'; return; }
    el.innerHTML = '<div class="page-head row between wrap"><div><h1>' + t('teacherTitle') + '</h1><p>' + t('teacherSub') + '</p></div><button class="btn" id="t-try">' + U.icon('play', 16) + t('tryGame') + '</button></div>' +
      '<div class="grid-2"><section class="card"><div class="card-b">' +
        '<form class="row" id="t-new"><input class="input" id="t-name" placeholder="' + t('classNamePh') + '" maxlength="40"><button class="btn primary">+ ' + t('newClass') + '</button></form>' +
        '<div id="t-classes" style="margin-top:14px"></div><div id="t-view" style="margin-top:18px"></div></div></section>' +
      '<aside class="stack-lg"><section class="card"><div class="card-h"><h3>' + U.icon('book') + t('bankPreview') + '</h3></div><div class="card-b stack">' +
        '<select class="input" id="t-grade">' + C.GRADES.map(function (g) { return '<option value="' + g + '">' + U.gradeName(g) + '</option>'; }).join('') + '<option value="0">' + U.gradeName(0) + '</option></select>' +
        '<select class="input" id="t-subj"></select><button class="btn" id="t-fetch">' + U.icon('refresh', 16) + t('random5') + '</button><div id="t-qs" class="stack"></div></div></section>' +
        '<div class="tipcard"><span style="font-size:1.3rem">👩‍🏫</span><p class="small ink2">' + t('teacherHint') + '</p></div></aside></div>';
    function subjOpts() { var g = +U.$('#t-grade').value; U.$('#t-subj').innerHTML = C.subjectsFor(g).map(function (s) { return '<option value="' + s + '">' + U.esc(U.subjectName(s)) + '</option>'; }).join(''); }
    U.$('#t-grade').onchange = subjOpts; subjOpts();
    U.$('#t-try').onclick = function () { U.toast('🚀', 'good'); OA.Shell.go('home'); };
    U.$('#t-new').onsubmit = function (e) { e.preventDefault(); OA.api.createClass(U.$('#t-name').value.trim()).then(function (r) { U.toast(t('classCreated', { c: r.code }), 'good', 6000); current = r.code; loadClasses(); }).catch(function (er) { U.toast(U.err(er), 'bad'); }); };
    U.$('#t-fetch').onclick = preview;
    loadClasses();
  };

  function loadClasses() {
    OA.api.classes().then(function (cls) {
      var box = U.$('#t-classes'); if (!box) return;
      box.innerHTML = cls.length ? '<div class="opt-chips">' + cls.map(function (c) { return '<button data-c="' + c.code + '" class="' + (c.code === current ? 'on' : '') + '">' + U.esc(c.name) + ' · <span class="num">' + c.code + '</span> (' + c.students + ')</button>'; }).join('') + '</div>' : '<div class="empty">' + t('firstClass') + '</div>';
      U.$$('[data-c]', box).forEach(function (b) { b.onclick = function () { current = b.dataset.c; loadClasses(); }; });
      if (!current && cls.length) current = cls[0].code;
      if (current) view(current);
    });
  }

  function view(code) {
    var box = U.$('#t-view'); box.innerHTML = '<div class="empty">…</div>';
    OA.api.classView(code).then(function (r) {
      var rows = r.students.map(function (s) {
        var warn = (s.focusAvg != null && s.focusAvg < 0.6) || (s.rapidRate != null && s.rapidRate > 0.15);
        return '<tr><td><span class="row" style="gap:8px"><span class="avatar" style="width:30px;height:30px;font-size:1rem">' + U.esc(s.avatar) + '</span>' + U.esc(s.displayName) + '</span></td><td class="num">' + U.fmt(s.totalXP) + '</td><td class="num">' + s.missions + '</td><td class="num">' + U.pct(s.accuracy) + '</td>' +
          '<td class="num" style="color:' + (warn ? 'var(--red)' : 'inherit') + '">' + U.pct(s.focusAvg) + (warn ? ' ⚠️' : '') + '</td><td class="num">' + U.pct(s.rapidRate) + '</td><td class="small">' + (s.weakest.map(U.esc).join('، ') || '—') + '</td><td class="tiny">' + U.esc(s.lastActive || '—') + '</td></tr>';
      }).join('');
      var cons = r.concepts.slice(0, 10).map(function (c) { var col = c.avgMastery < .4 ? 'var(--red)' : c.avgMastery < .7 ? 'var(--amber)' : 'var(--green)'; return '<div class="crow"><span>' + U.esc(U.conceptName(c.tag)) + ' <span class="tiny mut">(' + c.students + ')</span></span><div class="bar"><i style="width:' + Math.round(c.avgMastery * 100) + '%;background:' + col + '"></i></div><span class="num">' + Math.round(c.avgMastery * 100) + '%</span></div>'; }).join('');
      box.innerHTML = '<div class="row between wrap"><h3>' + U.esc(r.class.name) + ' — ' + t('joinCode') + ': <span class="num" style="color:var(--brand)">' + r.class.code + '</span></h3><button class="btn sm" id="t-csv">' + U.icon('download', 16) + t('exportCsv') + '</button></div>' +
        (rows ? '<div style="overflow:auto;margin-top:10px"><table class="tbl"><thead><tr><th>' + t('studentCol') + '</th><th>XP</th><th>' + t('missionsCol') + '</th><th>' + t('accuracy') + '</th><th>' + t('focusCol') + '</th><th>' + t('rapidCol') + '</th><th>' + t('weakestCol') + '</th><th>' + t('lastActive') + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
          : '<div class="empty">' + t('noStudents', { c: r.class.code }) + '</div>') +
        (cons ? '<h3 style="margin-top:18px">' + t('weakConcepts') + '</h3>' + cons : '');
      U.$('#t-csv').onclick = function () { OA.api.exportClass(code); };
    }).catch(function (e) { box.innerHTML = '<div class="empty">' + U.err(e) + '</div>'; });
  }

  function preview() {
    OA.api.questions(U.$('#t-subj').value, +U.$('#t-grade').value, 5, OA.I18N.get()).then(function (qs) {
      U.$('#t-qs').innerHTML = qs.map(function (q) {
        return '<div class="card" style="padding:14px" dir="' + (q.lang === 'en' ? 'ltr' : 'rtl') + '"><div class="tiny mut">' + U.esc(U.conceptName(q.conceptTag)) + ' · ' + q.difficultyLabel + ' · ' + q.questionId + '</div><div style="font-weight:700;margin:6px 0;white-space:pre-line">' + U.qhtml(q.questionText) + '</div>' +
          q.options.map(function (o, i) { return '<div class="small" style="' + (i === q.correctOptionIndex ? 'color:var(--green);font-weight:800' : '') + '">' + (i + 1) + ') ' + U.esc(o) + (i === q.correctOptionIndex ? ' ✓' : '') + '</div>'; }).join('') + '</div>';
      }).join('');
    }).catch(function (e) { U.toast(U.err(e), 'bad'); });
  }
})(window.OA = window.OA || {});
