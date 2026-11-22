/* Leaderboard, Progress and Settings pages. */
(function (OA) {
  var U = OA.U, C = OA.Concepts, S = OA.Service, t = function (k, v) { return OA.t(k, v); };

  /* ---------------- leaderboard ---------------- */
  OA.Pages.board = function (el) {
    var scope = 'global';
    el.innerHTML = '<div class="page-head"><h1>' + t('boardTitle') + '</h1><p>' + t('boardSub') + '</p></div>' +
      '<div class="seg" id="scopes" style="margin-bottom:18px">' + [['global', 'scopeGlobal'], ['grade', 'scopeGrade'], ['class', 'scopeClass'], ['weekly', 'scopeWeekly']].map(function (x) { return '<button data-s="' + x[0] + '" class="' + (x[0] === scope ? 'on' : '') + '">' + t(x[1]) + '</button>'; }).join('') + '</div>' +
      '<div id="lbody"></div>' + (OA.api.mode === 'local' ? '<p class="small mut" style="margin-top:12px">' + t('boardLocal') + '</p>' : '');
    function load() {
      var body = U.$('#lbody'); body.innerHTML = '<div class="empty">…</div>';
      OA.api.board(scope).then(function (r) {
        var key = scope === 'weekly' ? 'weeklyXP' : 'totalXP', me = OA.app.user.username;
        if (!r.top.length) { body.innerHTML = '<div class="card"><div class="empty">' + (scope === 'class' && !OA.app.user.classCode ? t('noClass') : t('noPlayers')) + '</div></div>'; return; }
        var top3 = r.top.slice(0, 3), order = [1, 0, 2].filter(function (i) { return top3[i]; });
        var pod = '<div class="podium">' + order.map(function (i) { var p = top3[i]; return '<div class="pod p' + (i + 1) + '">' + U.medal(i).replace('class="medal', 'style="margin:0 auto 8px" class="medal') + '<span class="avatar">' + U.esc(p.avatar) + '</span><b>' + U.esc(p.displayName || p.username) + '</b><span class="lb-score">' + U.fmt(p[key]) + ' XP</span></div>'; }).join('') + '</div>';
        body.innerHTML = pod + '<div class="card"><div class="card-b">' + r.top.map(function (p, i) {
          return '<div class="lb-row' + (p.username === me ? ' me' : '') + '">' + U.medal(i) + '<span class="avatar">' + U.esc(p.avatar) + '</span><span class="name">' + U.esc(p.displayName || p.username) + '<small>' + U.esc(U.gradeName(p.gradeLevel)) + ' · ' + t('level', { n: p.currentLevel }) + '</small></span><span class="lb-score">' + U.fmt(p[key]) + '</span></div>';
        }).join('') + '</div></div>' + (r.me.rank ? '<div class="card" style="margin-top:14px"><div class="card-b row between"><b>' + t('yourRank', { r: r.me.rank, t: r.me.total }) + '</b><span class="lb-score">' + U.fmt(r.me.score) + ' XP</span></div></div>' : '');
      }).catch(function (e) { body.innerHTML = '<div class="empty">' + U.err(e) + '</div>'; });
    }
    U.$$('#scopes button').forEach(function (b) { b.onclick = function () { scope = b.dataset.s; U.$$('#scopes button').forEach(function (x) { x.classList.toggle('on', x === b); }); load(); }; });
    load();
  };

  /* ---------------- progress ---------------- */
  OA.Pages.progress = function (el) {
    el.innerHTML = '<div class="page-head"><h1>' + t('progressTitle') + '</h1><p>' + t('progressSub') + '</p></div><div id="pbody"><div class="empty">…</div></div>';
    OA.api.progress().then(function (p) {
      var u = p.user, st = p.stats, subs = C.subjectsFor(u.gradeLevel), l = OA.I18N.get();
      var kpis = [[st.missions, t('missions'), 'rocket'], [st.answered, t('answers'), 'check'], [U.pct(st.answered ? st.correct / st.answered : null), t('accuracy'), 'target'], [U.pct(p.focusAvg), t('focusScore'), 'sparkle']];
      var level = subs.map(function (s) {
        var e = p.elo[s], v = e == null ? null : 1 / (1 + Math.exp(-e));
        return '<div class="crow"><span class="row" style="gap:10px">' + U.subjectTile(s, 34) + '<span>' + U.esc(U.subjectName(s)) + ' <span class="tiny mut">(' + (p.answeredBySubject[s] || 0) + ')</span></span></span><div class="bar"><i style="width:' + Math.round((v || 0) * 100) + '%;background:' + U.SUBJ_COLOR[s] + '"></i></div><span class="num">' + U.pct(v) + '</span></div>';
      }).join('');
      var groups = subs.map(function (s) {
        var cs = p.concepts.filter(function (c) { return c.subject === s; }); if (!cs.length) return '';
        return '<div class="sgroup"><h4>' + U.subjectTile(s, 28) + U.esc(U.subjectName(s)) + '</h4>' + cs.map(function (c) {
          var col = c.mastery < .4 ? 'var(--red)' : c.mastery < .75 ? 'var(--amber)' : 'var(--green)';
          return '<div class="crow"><span>' + U.esc(U.conceptName(c.tag)) + ' <span class="tiny mut">×' + c.attempts + '</span></span><div class="bar"><i style="width:' + Math.round(c.mastery * 100) + '%;background:' + col + '"></i></div><span class="num">' + Math.round(c.mastery * 100) + '%</span></div>';
        }).join('') + '</div>';
      }).join('');
      var badges = Object.keys(S.BADGES).map(function (k) { var b = S.BADGES[k], on = p.badges.indexOf(k) >= 0; return '<div class="row" style="opacity:' + (on ? 1 : .45) + '"><span class="badge' + (on ? '' : ' off') + '">' + b.icon + '</span><div><b>' + U.esc(l === 'en' ? b.en : b.ar) + '</b><div class="tiny mut">' + U.esc(l === 'en' ? b.descEn : b.desc) + '</div></div></div>'; }).join('');
      var recent = (p.recent || []).map(function (m) { return '<tr><td>' + new Date(m.startedAt).toLocaleDateString(l === 'en' ? 'en-GB' : 'ar-EG') + '</td><td>' + (C.SUBJECTS[m.subject] ? U.esc(U.subjectName(m.subject)) : '🌀') + '</td><td class="num">' + m.correct + '/' + m.answered + '</td><td class="num">+' + m.xp + '</td><td>' + (m.survived ? '✅' : '⚠️') + '</td></tr>'; }).join('');
      U.$('#pbody').innerHTML =
        '<div class="grid-4">' + kpis.map(function (k) { return '<div class="card"><div class="card-b kpi"><span class="stile" style="--c:#6A4CFF">' + U.icon(k[2], 22) + '</span><div><div class="v num">' + k[0] + '</div><div class="l">' + k[1] + '</div></div></div></div>'; }).join('') + '</div>' +
        '<div class="grid-2" style="margin-top:20px"><div class="stack-lg">' +
          '<section class="card"><div class="card-h"><h3>' + U.icon('chart') + t('subjectLevel') + '</h3><span class="tiny mut">' + t('subjectLevelHint') + '</span></div><div class="card-b">' + level + '</div></section>' +
          '<section class="card"><div class="card-h"><h3>' + U.icon('bulb') + t('conceptsTitle') + '</h3><span class="tiny mut">' + t('conceptsHint') + '</span></div><div class="card-b">' + (groups || '<div class="empty">' + t('noConcepts') + '</div>') +
            '<p class="small mut" style="margin-top:12px">🔁 ' + t('reviewQueue', { n: p.reviewsTotal, d: p.reviewsDue }) + '</p></div></section>' +
          (recent ? '<section class="card"><div class="card-h"><h3>' + U.icon('rocket') + t('recent') + '</h3></div><div class="card-b" style="overflow:auto"><table class="tbl"><thead><tr><th>' + t('date') + '</th><th>' + t('subject') + '</th><th>' + t('correctCol') + '</th><th>XP</th><th>' + t('result') + '</th></tr></thead><tbody>' + recent + '</tbody></table></div></section>' : '') +
        '</div><aside class="stack-lg"><section class="card"><div class="card-h"><h3>' + U.icon('star') + t('badges') + '</h3></div><div class="card-b stack">' + badges + '</div></section>' +
          '<button class="btn block" id="csv">' + U.icon('download', 18) + t('downloadCsv') + '</button></aside></div>';
      U.$('#csv').onclick = function () { OA.api.exportMine(); };
    }).catch(function (e) { U.$('#pbody').innerHTML = '<div class="empty">' + U.err(e) + '</div>'; });
  };

  /* ---------------- settings ---------------- */
  var AV = ['🧑‍🚀', '👩‍🚀', '👨‍🚀', '🤖', '👽', '🦊', '🐼', '🦉', '🐉', '🛸', '🌟', '🪐'];
  OA.Pages.settings = function (el) {
    var u = OA.app.user, api = OA.api, st = U.settings, l = OA.I18N.get();
    function sw(id, on, label) { return '<label class="row between" style="padding:10px 0;border-bottom:1px solid var(--line)"><span>' + label + '</span><span class="switch"><input type="checkbox" id="' + id + '"' + (on ? ' checked' : '') + '><i></i></span></label>'; }
    el.innerHTML = '<div class="page-head"><h1>' + t('settingsTitle') + '</h1></div><div class="grid-2"><div class="stack-lg">' +
      '<section class="card"><div class="card-h"><h3>' + U.icon('users') + t('profile') + '</h3></div><div class="card-b stack">' +
        '<div class="row"><span class="avatar" style="width:56px;height:56px;font-size:1.8rem">' + U.esc(u.avatar) + '</span><div><b>' + U.esc(u.displayName) + '</b><div class="small mut" dir="ltr" style="text-align:start">@' + U.esc(u.username) + '</div></div></div>' +
        '<div class="field"><span>' + t('avatar') + '</span><div class="avatars" id="avs">' + AV.map(function (a) { return '<button type="button" class="' + (a === u.avatar ? 'on' : '') + '" data-a="' + a + '">' + a + '</button>'; }).join('') + '</div></div>' +
        (u.role === 'student' ? '<label class="field"><span>' + t('learningMode') + ' / ' + t('grade') + '</span><select class="input" id="s-grade">' +
          '<optgroup label="' + t('schoolGroup') + '">' + C.GRADES.map(function (g) { return '<option value="' + g + '"' + (g === u.gradeLevel ? ' selected' : '') + '>' + U.gradeName(g) + '</option>'; }).join('') + '</optgroup>' +
          '<optgroup label="' + t('learningGroup') + '"><option value="0"' + (+u.gradeLevel === 0 ? ' selected' : '') + '>' + t('learningOpt') + '</option></optgroup></select></label>' +
          '<label class="field"><span>' + t('classCode') + '</span><div class="row"><input class="input" id="s-class" maxlength="6" value="' + U.esc(u.classCode || '') + '" style="text-transform:uppercase" dir="ltr"><button class="btn" id="s-join">' + t('save') + '</button></div></label>' : '') +
      '</div></section>' +
      '<section class="card"><div class="card-h"><h3>' + U.icon('settings') + t('prefs') + '</h3></div><div class="card-b">' +
        '<div class="row between" style="padding:6px 0 12px;border-bottom:1px solid var(--line)"><span>' + t('language') + '</span><div class="lang-pill"><button data-l="ar" class="' + (l === 'ar' ? 'on' : '') + '">عربي</button><button data-l="en" class="' + (l === 'en' ? 'on' : '') + '">English</button></div></div>' +
        sw('s-sound', st.sound, t('sound')) + sw('s-timer', st.timer, t('qTimer')) + sw('s-motion', st.reduceMotion, t('reduceMotion')) +
      '</div></section></div>' +
      '<aside><section class="card"><div class="card-h"><h3>' + U.icon('sparkle') + t('about') + '</h3></div><div class="card-b stack small">' +
        '<div class="row between"><span class="mut">' + t('mode') + '</span><span class="chip ' + (api.mode === 'online' ? 'green' : 'amber') + '">' + (api.mode === 'online' ? t('online') : t('offline')) + '</span></div>' +
        '<div class="row between"><span class="mut">' + t('bank') + '</span><b class="num">' + U.fmt(api.info.questions) + '</b></div>' +
        '<div><span class="mut">' + t('aiTutor') + '</span><div>' + (api.info.ai ? '✨ ' + U.esc(api.info.ai) : t('aiLocal')) + '</div></div>' +
        '<div><span class="mut">' + t('mlModel') + '</span><div>' + (OA.Model ? t('modelSim', { a: OA.Model.correct.auc.toFixed(3), b: OA.Model.disengage.auc.toFixed(3) }) : 'Elo') + '</div></div>' +
      '</div></section></aside></div>';
    U.$$('[data-l]', el).forEach(function (b) { b.onclick = function () { OA.I18N.set(b.dataset.l); OA.Shell.go('settings'); }; });
    U.$$('#avs button').forEach(function (b) { b.onclick = function () { api.updateMe({ avatar: b.dataset.a }).then(function (nu) { OA.app.user = nu; OA.Shell.go('settings'); }); }; });
    var g = U.$('#s-grade'); if (g) g.onchange = function () { api.updateMe({ gradeLevel: +g.value }).then(function (nu) { OA.app.user = nu; OA.app.prog = null; OA.Home.setSubject(null); U.toast(t('trackChanged'), 'good'); OA.Shell.go('settings'); }).catch(function (e) { U.toast(U.err(e), 'bad'); }); };
    var j = U.$('#s-join'); if (j) j.onclick = function () { api.updateMe({ classCode: U.$('#s-class').value }).then(function (nu) { OA.app.user = nu; U.toast(t('joined'), 'good'); }).catch(function (e) { U.toast(U.err(e), 'bad'); }); };
    U.$('#s-sound').onchange = function () { st.sound = this.checked; U.saveSettings(); };
    U.$('#s-timer').onchange = function () { st.timer = this.checked; U.saveSettings(); };
    U.$('#s-motion').onchange = function () { st.reduceMotion = this.checked; U.saveSettings(); };
  };
})(window.OA = window.OA || {});
