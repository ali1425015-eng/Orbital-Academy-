/* Sign-in / sign-up — split screen: brand hero with the space artwork + a clean form. */
(function (OA) {
  var U = OA.U, C = OA.Concepts, t = function (k, v) { return OA.t(k, v); };
  var AVATARS = ['🧑‍🚀', '👩‍🚀', '👨‍🚀', '🤖', '👽', '🦊', '🐼', '🦉', '🐉', '🛸', '🌟', '🪐'];
  var st = { mode: 'signin', role: 'student', avatar: AVATARS[0] };
  var G_LOGO = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';

  function lastGrade() { try { return localStorage.getItem('oa_last_grade'); } catch (e) { return null; } }
  function gradeOptions(sel) {
    var s = sel == null ? '' : String(sel);
    return '<option value="" disabled' + (s === '' ? ' selected' : '') + '>' + t('gradePh') + '</option>' +
      '<optgroup label="' + t('schoolGroup') + '">' + C.GRADES.map(function (g) { return '<option value="' + g + '"' + (s === String(g) ? ' selected' : '') + '>' + U.gradeName(g) + '</option>'; }).join('') + '</optgroup>' +
      '<optgroup label="' + t('learningGroup') + '"><option value="0"' + (s === '0' ? ' selected' : '') + '>' + t('learningOpt') + '</option></optgroup>';
  }
  function langPill() { var l = OA.I18N.get(); return '<div class="lang-pill" role="group" aria-label="' + t('language') + '"><button type="button" data-l="ar" class="' + (l === 'ar' ? 'on' : '') + '">عربي</button><button type="button" data-l="en" class="' + (l === 'en' ? 'on' : '') + '">English</button></div>'; }

  function render() {
    var api = OA.api, up = st.mode === 'signup', google = !!api.info.google;
    U.$('#auth').innerHTML =
      '<div class="auth-hero">' +
        '<div>' + U.logo(true) +
          '<h1>' + t('heroTitle') + '</h1><p class="lead">' + t('heroSub') + '</p>' +
          '<div class="feats">' + ['feat1', 'feat2', 'feat3'].map(function (k, i) { return '<div>' + U.icon(['book', 'sparkle', 'target'][i], 26) + t(k) + '</div>'; }).join('') + '</div>' +
        '</div>' +
        '<div class="hero-board"><h4><span>' + t('topAcademy') + '</span><button class="linkbtn" id="lb-share" style="color:#fff" aria-label="share">' + U.icon('share', 16) + '</button></h4><div id="lb-list"><div class="small" style="opacity:.8;padding:8px 0">…</div></div></div>' +
      '</div>' +
      '<div class="auth-panel"><div class="auth-box">' +
        '<div class="auth-top">' + U.logo() + '<span class="row" style="gap:6px">' + U.theme.button('theme-auth') + langPill() + '</span></div>' +
        '<h2>' + (up ? t('createTitle') : t('welcomeBack')) + '</h2><p class="sub">' + (up ? t('createSub') : t('welcomeSub')) + '</p>' +
        '<div class="seg" style="width:100%;margin-bottom:18px"><button type="button" data-m="signin" class="' + (!up ? 'on' : '') + '" style="flex:1">' + t('signIn') + '</button><button type="button" data-m="signup" class="' + (up ? 'on' : '') + '" style="flex:1">' + t('signUp') + '</button></div>' +
        '<form id="authf" class="stack" novalidate autocomplete="on">' +
          (up ? '<div class="row between"><span class="small ink2" style="font-weight:700">' + t('accountType') + '</span><div class="seg" id="role"><button type="button" data-r="student" class="' + (st.role === 'student' ? 'on' : '') + '">' + t('student') + '</button><button type="button" data-r="teacher" class="' + (st.role === 'teacher' ? 'on' : '') + '">' + t('teacher') + '</button></div></div>' : '') +
          '<label class="field"><span>' + t('username') + '</span><input class="input" id="f-user" autocomplete="username" placeholder="' + t('usernamePh') + '" maxlength="20" dir="ltr"></label>' +
          '<label class="field"><span>' + t('password') + '</span><input class="input" id="f-pass" type="password" autocomplete="' + (up ? 'new-password' : 'current-password') + '" placeholder="••••••" dir="ltr"></label>' +
          '<label class="field"><span>' + t('grade') + '</span><select class="input" id="f-grade">' + gradeOptions(lastGrade()) + '</select></label>' +
          (up && st.role === 'student' ? '<label class="field"><span>' + t('classCode') + ' <em>(' + t('optional') + ')</em></span><input class="input" id="f-class" maxlength="6" placeholder="ABC123" style="text-transform:uppercase" dir="ltr"></label>' : '') +
          (up ? '<div class="field"><span>' + t('avatar') + '</span><div class="avatars" id="avs">' + AVATARS.map(function (a) { return '<button type="button" class="' + (a === st.avatar ? 'on' : '') + '" data-a="' + a + '">' + a + '</button>'; }).join('') + '</div></div>' : '') +
          '<button class="btn primary lg block" type="submit" id="go">' + (up ? t('doSignUp') : t('doSignIn')) + '</button>' +
          (google ? '<div class="divider">' + t('orContinue') + '</div><div id="gbtn-wrap"><button class="btn google lg" type="button" id="gbtn">' + G_LOGO + ' ' + t('google') + '</button></div>' : '') +
        '</form>' +
        '<p class="auth-foot">' + (up ? t('haveAccount') + ' <button type="button" class="linkbtn" data-m="signin">' + t('signIn') + '</button>' : t('noAccount') + ' <button type="button" class="linkbtn" data-m="signup">' + t('signUp') + '</button>') + '</p>' +
        '<p class="auth-foot"><span class="chip ' + (api.mode === 'online' ? 'green' : 'amber') + '">' + (api.mode === 'online' ? '● ' + t('online') : '● ' + t('offline')) + ' · ' + t('questionsCount', { n: U.fmt(api.info.questions) }) + '</span></p>' +
      '</div></div>';

    U.theme.wire('theme-auth');
    U.$$('[data-l]').forEach(function (b) { b.onclick = function () { OA.I18N.set(b.dataset.l); render(); }; });
    U.$$('[data-m]').forEach(function (b) { b.onclick = function () { st.mode = b.dataset.m; render(); }; });
    U.$$('#role button').forEach(function (b) { b.onclick = function () { st.role = b.dataset.r; render(); }; });
    U.$$('#avs button').forEach(function (b) { b.onclick = function () { st.avatar = b.dataset.a; U.$$('#avs button').forEach(function (x) { x.classList.toggle('on', x === b); }); }; });
    U.$('#authf').onsubmit = submit;
    var gb = U.$('#gbtn'); if (gb) gb.onclick = function () { U.toast(t('googleHint'), 'gold', 4500); };
    U.$('#lb-share').onclick = function () { var url = location.href.split('?')[0]; if (navigator.share) navigator.share({ title: 'Orbital Academy', url: url }).catch(function () { }); else if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { U.toast('🔗 ✓'); }); };
    loadBoard();
    if (google) mountGoogle(api.info.google);
  }

  function loadBoard() {
    OA.api.publicBoard().then(function (top) {
      var box = U.$('#lb-list'); if (!box) return;
      box.innerHTML = top.length ? top.slice(0, 3).map(function (p, i) { return '<div class="lb-row">' + U.medal(i) + '<span class="avatar" style="width:32px;height:32px;font-size:1rem;background:rgba(255,255,255,.18)">' + U.esc(p.avatar || '🧑‍🚀') + '</span><span class="name">' + U.esc(p.displayName || p.username) + '</span><span class="lb-score">' + U.fmt(p.totalXP) + '</span></div>'; }).join('')
        : '<div class="small" style="opacity:.85;padding:8px 0">' + t('beFirst') + '</div>';
    }).catch(function () { });
  }

  function submit(e) {
    e.preventDefault();
    var g = U.$('#f-grade').value;
    var b = { username: U.$('#f-user').value.trim(), password: U.$('#f-pass').value, gradeLevel: g === '' ? null : +g };
    if (st.mode === 'signup') {
      if (b.gradeLevel === null) return U.toast(OA.I18N.err('bad_grade'), 'bad');
      b.role = st.role; b.avatar = st.avatar; var cc = U.$('#f-class'); b.classCode = cc ? cc.value.trim() : '';
    }
    if (b.gradeLevel !== null) try { localStorage.setItem('oa_last_grade', b.gradeLevel); } catch (x) { }
    var go = U.$('#go'); go.disabled = true;
    (st.mode === 'signup' ? OA.api.signup(b) : OA.api.login(b)).then(function (u) { OA.Sound.level(); OA.app.enter(u); })
      .catch(function (err) { U.toast(U.err(err), 'bad', 4200); }).then(function () { if (go) go.disabled = false; });
  }

  function mountGoogle(clientId) {
    function init() {
      google.accounts.id.initialize({ client_id: clientId, callback: function (resp) {
        var g = U.$('#f-grade').value;
        OA.api.google({ credential: resp.credential, gradeLevel: g === '' ? undefined : +g, username: (U.$('#f-user').value || '').trim() || undefined }).then(OA.app.enter).catch(function (err) { U.toast(U.err(err), 'bad'); });
      } });
      var wrap = U.$('#gbtn-wrap'); if (!wrap) return;
      wrap.innerHTML = '<div id="gsi" style="display:flex;justify-content:center"></div>';
      google.accounts.id.renderButton(U.$('#gsi'), { theme: 'outline', size: 'large', shape: 'rectangular', text: 'continue_with', width: Math.min(400, wrap.clientWidth || 400), locale: OA.I18N.get() });
    }
    if (window.google && google.accounts) return init();
    var s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = init; document.head.appendChild(s);
  }

  OA.Login = { show: function () { st.mode = 'signin'; render(); U.show('auth'); }, render: render };
})(window.OA = window.OA || {});
