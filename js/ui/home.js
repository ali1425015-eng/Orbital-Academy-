/* Home: banner, mission setup (subject ONCE + length by time or by number of questions), daily goal, focus, badges, top of grade. */
(function (OA) {
  var U = OA.U, C = OA.Concepts, S = OA.Service, t = function (k, v) { return OA.t(k, v); };
  var sel = { subject: null };

  function subjectAvg(prog) {
    var m = {}, out = {};
    (prog && prog.concepts || []).forEach(function (c) { (m[c.subject] = m[c.subject] || []).push(c.mastery); });
    Object.keys(m).forEach(function (s) { out[s] = m[s].reduce(function (a, b) { return a + b; }, 0) / m[s].length; });
    return out;
  }

  function render(el, u, prog) {
    var subs = C.subjectsFor(u.gradeLevel, OA.I18N.get()), avg = subjectAvg(prog), st = U.settings, l = OA.I18N.get();
    OA.app.subjAvg = avg;
    if (subs.indexOf(sel.subject) < 0) sel.subject = subs[0];
    var today = (prog && prog.daily || [])[0], todayKey = new Date().toISOString().slice(0, 10), done = today && today.d === todayKey ? today.n : 0;
    var tips = t('tips'), tip = tips[Math.floor(Math.random() * tips.length)];
    var learning = +u.gradeLevel === 0;
    var span = Math.max(1, u.nextLevelXP - u.levelXP), into = Math.max(0, u.totalXP - u.levelXP);
    el.innerHTML =
      '<div class="banner"><div><h2>' + t('hi', { name: U.esc(u.displayName) }) + '</h2><p>' + t('bannerSub') + '</p>' +
        '<div class="stats"><span>' + u.rank.icon + ' ' + t('level', { n: u.currentLevel }) + ' · <span class="num">' + Math.round(into / span * 100) + '%</span></span><span><span class="num">' + U.fmt(u.totalXP) + '</span> XP</span><span>🔥 ' + t('streakDays', { n: u.streakDays || 0 }) + '</span><span>' + U.esc(U.gradeName(u.gradeLevel)) + '</span></div></div></div>' +
      '<div class="grid-2" style="margin-top:20px">' +
        '<section class="card"><div class="card-h"><h3>' + U.icon('rocket') + t('bannerTitle') + '</h3></div><div class="card-b">' +
          '<div class="step-t"><i>1</i>' + t('step1') + '</div>' +
          '<div class="subj-grid" id="subjs">' + subs.map(function (s) {
            var a = avg[s];
            return '<button class="subj-card' + (sel.subject === s ? ' on' : '') + '" data-s="' + s + '" style="--c:' + U.SUBJ_COLOR[s] + '">' + U.subjectTile(s) +
              '<span><b>' + U.esc(U.subjectName(s)) + '</b><span class="meta">' + (a == null ? t('notStarted') : t('mastery') + ' ' + Math.round(a * 100) + '%') + '</span><div class="bar"><i style="width:' + Math.round((a || 0) * 100) + '%"></i></div></span></button>';
          }).join('') + '</div>' +
          '<div class="step-t" style="margin-top:20px"><i>2</i>' + t('step2') + '</div>' +
          '<div class="len-row"><div class="seg" id="mode"><button data-v="time" class="' + (st.mode !== 'count' ? 'on' : '') + '">' + U.icon('clock', 16) + ' ' + t('byTime') + '</button><button data-v="count" class="' + (st.mode === 'count' ? 'on' : '') + '">' + U.icon('list', 16) + ' ' + t('byCount') + '</button></div>' +
            '<div class="opt-chips" id="lens"></div></div>' +
          '<div class="launch"><p class="small mut" style="max-width:420px">' + (learning ? t('missionNoteL', { lang: l === 'en' ? 'English' : 'العربية' }) : t('missionNote', { grade: U.esc(U.gradeName(u.gradeLevel)) })) + '</p>' +
            '<button class="btn primary lg" id="launch">' + U.icon('play', 18) + t('startMission') + '</button></div>' +
        '</div></section>' +
        '<aside class="stack-lg">' +
          '<section class="card"><div class="card-b"><div class="kpi">' + U.ring(Math.min(1, done / 20), '#6A4CFF', 64, done) + '<div><div style="font-weight:800">' + t('dailyGoal') + '</div><div class="mut small">' + t('dailyOf', { a: done, b: 20 }) + '</div>' +
            '<div class="chip ' + (prog && prog.reviewsDue ? 'amber' : 'green') + '" style="margin-top:6px">' + (prog && prog.reviewsDue ? t('reviewsDue', { n: prog.reviewsDue }) : t('noReviews')) + '</div></div></div></div></section>' +
          '<section class="card"><div class="card-b"><div class="kpi">' + U.ring(prog ? prog.focusAvg : null, '#12B76A', 64) + '<div><div style="font-weight:800">' + t('focusScore') + '</div><div class="mut small">' + t('focusHint') + '</div></div></div></div></section>' +
          '<section class="card"><div class="card-h"><h3>' + U.icon('star') + t('badges') + '</h3><span class="chip">' + u.badges.length + ' / ' + Object.keys(S.BADGES).length + '</span></div><div class="card-b"><div class="badges">' +
            Object.keys(S.BADGES).map(function (k) { var b = S.BADGES[k], on = u.badges.indexOf(k) >= 0; return '<span class="badge' + (on ? '' : ' off') + '" title="' + U.esc(l === 'en' ? b.en + ' — ' + b.descEn : b.ar + ' — ' + b.desc) + '">' + b.icon + '</span>'; }).join('') + '</div></div></section>' +
          '<section class="card"><div class="card-h"><h3>' + U.icon('trophy') + t('topGrade', { grade: U.esc(U.gradeName(u.gradeLevel)) }) + '</h3><button class="linkbtn small" id="seeall">' + t('seeAll') + '</button></div><div class="card-b" id="mini-lb"><div class="empty">…</div></div></section>' +
          '<div class="tipcard"><span style="font-size:1.4rem">💡</span><div><b>' + t('tip') + '</b><p class="small ink2">' + tip + '</p></div></div>' +
        '</aside></div>';

    function lens() {
      var box = U.$('#lens'), count = U.settings.mode === 'count';
      var opts = count ? [10, 15, 20] : [180, 300, 600];
      box.innerHTML = opts.map(function (v) {
        var on = count ? U.settings.count === v : U.settings.length === v;
        return '<button data-v="' + v + '" class="' + (on ? 'on' : '') + '">' + (count ? t('questionsN', { n: v }) : t('minutes', { n: v / 60 })) + '</button>';
      }).join('');
      U.$$('button', box).forEach(function (b) { b.onclick = function () { if (count) U.settings.count = +b.dataset.v; else U.settings.length = +b.dataset.v; U.saveSettings(); lens(); }; });
    }
    lens();
    U.$$('#mode button').forEach(function (b) { b.onclick = function () { U.settings.mode = b.dataset.v; U.saveSettings(); U.$$('#mode button').forEach(function (x) { x.classList.toggle('on', x === b); }); lens(); }; });
    U.$$('#subjs .subj-card').forEach(function (b) { b.onclick = function () { OA.Sound.click(); sel.subject = b.dataset.s; U.$$('#subjs .subj-card').forEach(function (x) { x.classList.toggle('on', x === b); }); }; });
    U.$('#launch').onclick = function () {
      if (!sel.subject) return U.toast(t('pickSubject'), 'bad');
      var count = U.settings.mode === 'count';
      OA.Mission.start(sel.subject, count ? { mode: 'count', target: U.settings.count } : { mode: 'time', durationSec: U.settings.length });
    };
    U.$('#seeall').onclick = function () { OA.Shell.go('board'); };
    OA.api.board('grade').then(function (r) {
      var box = U.$('#mini-lb'); if (!box) return;
      box.innerHTML = r.top.length ? r.top.slice(0, 5).map(function (p, i) { return '<div class="lb-row' + (p.username === u.username ? ' me' : '') + '">' + U.medal(i) + '<span class="avatar" style="width:34px;height:34px;font-size:1.05rem">' + U.esc(p.avatar) + '</span><span class="name">' + U.esc(p.displayName || p.username) + '</span><span class="lb-score">' + U.fmt(p.totalXP) + '</span></div>'; }).join('') +
        (r.me.rank ? '<p class="small mut" style="margin-top:8px">' + t('yourRank', { r: r.me.rank, t: r.me.total }) + '</p>' : '') : '<div class="empty">' + t('noPlayers') + '</div>';
    }).catch(function () { });
  }

  OA.Pages.home = function (el) {
    render(el, OA.app.user, OA.app.prog);
    OA.api.progress().then(function (p) {
      OA.app.prog = p; var changed = JSON.stringify(p.user) !== JSON.stringify(OA.app.user); OA.app.user = p.user;
      if (U.$('#launch')) { if (changed) OA.Shell.refreshTop(); else render(el, p.user, p); }
    }).catch(function (e) { if (e && e.code === 'unauthorized') OA.Login.show(); });
  };
  OA.Home = { setSubject: function (s) { sel.subject = s; } };
})(window.OA = window.OA || {});
