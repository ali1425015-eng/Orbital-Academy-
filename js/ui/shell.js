/* App shell: sidebar (desktop) / bottom nav (mobile), top bar, page router. Pages register in OA.Pages. */
(function (OA) {
  var U = OA.U, t = function (k, v) { return OA.t(k, v); };
  OA.Pages = OA.Pages || {};
  var current = 'home';

  function items(u) {
    var list = [['home', 'home', 'navHome'], ['board', 'trophy', 'navBoard'], ['progress', 'chart', 'navProgress']];
    if (u.role === 'teacher') list.push(['teacher', 'users', 'navTeacher']);
    list.push(['settings', 'settings', 'navSettings']);
    return list;
  }

  function frame() {
    var u = OA.app.user, l = OA.I18N.get(), list = items(u);
    var nav = list.map(function (x) { return '<a data-p="' + x[0] + '" class="' + (current === x[0] ? 'on' : '') + '">' + U.icon(x[1]) + '<span>' + t(x[2]) + '</span></a>'; }).join('');
    U.$('#app').innerHTML =
      '<aside class="sidebar">' + U.logo() +
        '<nav class="nav">' + nav + '</nav>' +
        '<div class="side-foot">' +
          '<div class="lang-pill" style="justify-self:start"><button data-l="ar" class="' + (l === 'ar' ? 'on' : '') + '">عربي</button><button data-l="en" class="' + (l === 'en' ? 'on' : '') + '">English</button></div>' +
          '<div class="me-card"><span class="avatar">' + U.esc(u.avatar) + '</span><span class="grow"><b>' + U.esc(u.displayName) + '</b><span class="tiny mut">' + U.esc(u.role === 'teacher' ? t('teacher') : U.gradeName(u.gradeLevel)) + '</span></span>' +
            '<button class="btn ghost icon-btn" id="logout" title="' + t('logout') + '" aria-label="' + t('logout') + '">' + U.icon('logout', 18) + '</button></div>' +
        '</div></aside>' +
      '<div class="main"><header class="topbar"><span class="title" id="ptitle"></span><span class="grow"></span>' +
        '<span class="pill hide-sm">' + U.icon('star', 16) + '<span class="num">' + U.fmt(u.totalXP) + '</span> XP</span>' +
        '<span class="pill fire">' + U.icon('flame', 16) + '<span class="num">' + (u.streakDays || 0) + '</span></span>' +
        '<span class="pill hide-sm">' + u.rank.icon + ' ' + t('level', { n: u.currentLevel }) + '</span>' +
        '<button class="btn ghost sm" id="lang-top" aria-label="' + t('language') + '">' + U.icon('globe', 16) + (l === 'ar' ? 'EN' : 'ع') + '</button>' +
      '</header><div class="page" id="page"></div></div>' +
      '<nav class="bnav" style="--n:' + list.length + '">' + list.map(function (x) { return '<a data-p="' + x[0] + '" class="' + (current === x[0] ? 'on' : '') + '">' + U.icon(x[1]) + '<span>' + t(x[2]) + '</span></a>'; }).join('') + '</nav>';
    U.$$('[data-p]').forEach(function (a) { a.onclick = function () { go(a.dataset.p); }; });
    U.$$('.side-foot [data-l]').forEach(function (b) { b.onclick = function () { OA.I18N.set(b.dataset.l); go(current); }; });
    U.$('#lang-top').onclick = function () { OA.I18N.set(l === 'ar' ? 'en' : 'ar'); go(current); };
    U.$('#logout').onclick = function () { OA.api.logout().then(function () { OA.app.user = null; OA.Login.show(); }); };
  }

  function go(page) {
    current = OA.Pages[page] ? page : 'home';
    U.show('app'); frame();
    var titles = { home: 'navHome', board: 'navBoard', progress: 'navProgress', settings: 'navSettings', teacher: 'navTeacher' };
    U.$('#ptitle').textContent = t(titles[current]);
    OA.Pages[current](U.$('#page'));
  }
  OA.Shell = { go: go, refreshTop: function () { if (!U.$('#app').classList.contains('hidden')) { var p = current; frame(); U.$('#ptitle').textContent = t({ home: 'navHome', board: 'navBoard', progress: 'navProgress', settings: 'navSettings', teacher: 'navTeacher' }[p]); OA.Pages[p](U.$('#page')); } } };
})(window.OA = window.OA || {});
