/* Login / sign-up screen (matches the approved design: glass card in the
   centre, "TOP ACADEMY" leaderboard top-right, Google sign-in button). */
(function (OA) {
  var U = OA.U, C = OA.Concepts;
  var AVATARS = ['🧑‍🚀', '👩‍🚀', '👨‍🚀', '🤖', '👽', '🦊', '🐼', '🦉', '🐉', '🛸', '🌟', '🪐'];
  var state = { mode: null, role: 'student', avatar: AVATARS[0] };   // mode: main | login | signup

  function gradeOptions(sel) {
    return '<option value="" disabled ' + (sel ? '' : 'selected') + '>مثلاً: الصف الأول الثانوي</option>' + C.GRADES.map(function (g) { return '<option value="' + g + '"' + (+sel === g ? ' selected' : '') + '>' + C.gradeAr[g] + '</option>'; }).join('');
  }
  function lastGrade() { try { return localStorage.getItem('oa_last_grade'); } catch (e) { return null; } }
  var G_LOGO = '<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';

  function render() {
    var api = OA.api, google = !!api.info.google, mode = state.mode || (google ? 'main' : 'login'), signup = mode === 'signup', withPass = mode !== 'main';
    state.mode = mode;
    var el = U.$('#login');
    var foot = mode === 'main' ? 'أو <button type="button" class="linkbtn" id="to-login">سجّل الدخول ببيانات أخرى</button> &nbsp;·&nbsp; <button type="button" class="linkbtn" id="to-signup">إنشاء حساب</button>'
      : mode === 'login' ? (google ? '<button type="button" class="linkbtn" id="to-main">الدخول بحساب Google</button> &nbsp;·&nbsp; ' : 'أول مرة هنا؟ ') + '<button type="button" class="linkbtn" id="to-signup">إنشاء حساب</button>'
      : 'لديك حساب بالفعل؟ <button type="button" class="linkbtn" id="to-login">تسجيل الدخول</button>';
    el.innerHTML =
      '<aside class="glass topboard" aria-label="أفضل اللاعبين">' +
        '<div class="panel-h" style="justify-content:space-between"><span class="en" style="font-size:.9rem;color:#fff;letter-spacing:.06em">TOP ACADEMY</span><span style="display:flex;gap:12px"><button class="linkbtn" id="lb-refresh" title="تحديث" aria-label="تحديث" style="text-decoration:none;color:#dfe7ff;font-size:1.05rem">⤓</button><button class="linkbtn" id="lb-share" title="مشاركة" aria-label="مشاركة" style="text-decoration:none;color:#dfe7ff;font-size:1.05rem">⤴</button></span></div>' +
        '<div id="lb-list"><div class="empty small">…</div></div></aside>' +
      '<div class="auth-wrap"><form class="glass glow auth-card" id="auth" novalidate autocomplete="on">' + U.logo() +
        '<div class="stack">' +
          (signup ? '<div class="row between"><span class="small mut">نوع الحساب</span><div class="seg" id="role"><button type="button" data-r="student" class="' + (state.role === 'student' ? 'on' : '') + '">🧑‍🎓 طالب</button><button type="button" data-r="teacher" class="' + (state.role === 'teacher' ? 'on' : '') + '">👩‍🏫 معلم</button></div></div>' : '') +
          '<label class="field"><span>اسم المستخدم</span><input class="input" id="f-user" name="username" autocomplete="username" placeholder="اسم المستخدم" maxlength="20"></label>' +
          (withPass ? '<label class="field"><span>كلمة المرور</span><input class="input" id="f-pass" name="password" type="password" autocomplete="' + (signup ? 'new-password' : 'current-password') + '" placeholder="••••••"></label>' : '') +
          '<label class="field"><span>الصف الدراسي</span><select class="input" id="f-grade">' + gradeOptions(lastGrade()) + '</select></label>' +
          (signup ? '<label class="field"><span>كود الفصل <span class="dim small">(اختياري — من معلمك)</span></span><input class="input" id="f-class" maxlength="6" placeholder="ABC123" style="text-transform:uppercase"></label>' +
            '<div class="field"><span>اختر صورتك</span><div class="avatars" id="avs">' + AVATARS.map(function (a) { return '<button type="button" class="' + (a === state.avatar ? 'on' : '') + '" data-a="' + a + '" aria-label="avatar">' + a + '</button>'; }).join('') + '</div></div>' : '') +
          (withPass ? '<button class="btn primary" type="submit" style="width:100%;padding:13px" id="go">' + (signup ? '✨ إنشاء الحساب والانطلاق' : '🚀 دخول') + '</button>' : '') +
          (google && mode !== 'signup' ? '<div id="gbtn-wrap"><button class="btn google" type="button" id="gbtn"><span class="g">' + G_LOGO + '</span> تسجيل الدخول بواسطة Google</button></div>' : '') +
        '</div></form>' +
        '<div class="auth-foot">' + foot + '</div></div>' +
      '<div class="mode-pill chip ' + (api.mode === 'online' ? 'good' : 'gold') + '" title="' + (api.mode === 'online' ? 'متصل بالخادم' : 'كل البيانات محفوظة في هذا المتصفح فقط') + '">' +
        (api.mode === 'online' ? '🟢 متصل بالخادم · ' + U.fmt(api.info.questions) + ' سؤال' + (api.info.ai ? ' · AI ✓' : '') : '🟠 وضع غير متصل · ' + U.fmt(api.info.questions) + ' سؤال على الجهاز') + '</div>';

    [['to-login', 'login'], ['to-signup', 'signup'], ['to-main', 'main']].forEach(function (x) { var b = U.$('#' + x[0]); if (b) b.onclick = function () { state.mode = x[1]; render(); }; });
    if (signup) {
      U.$$('#role button').forEach(function (b) { b.onclick = function () { state.role = b.dataset.r; render(); }; });
      U.$$('#avs button').forEach(function (b) { b.onclick = function () { state.avatar = b.dataset.a; U.$$('#avs button').forEach(function (x) { x.classList.toggle('on', x === b); }); }; });
    }
    U.$('#auth').onsubmit = submit;
    var gb = U.$('#gbtn'); if (gb) gb.onclick = googleHint;
    U.$('#lb-refresh').onclick = loadBoard;
    U.$('#lb-share').onclick = function () {
      var url = location.href.split('?')[0];
      if (navigator.share) navigator.share({ title: 'Orbital Academy', url: url }).catch(function () { });
      else if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { U.toast('تم نسخ الرابط 🔗'); });
    };
    loadBoard();
    if (google && mode !== 'signup') mountGoogle(api.info.google);
  }

  function loadBoard() {
    var box = U.$('#lb-list'); if (!box) return;
    OA.api.publicBoard().then(function (top) {
      if (!top.length) { box.innerHTML = '<div class="empty small">كن أول قائد في القائمة! 🚀</div>'; return; }
      box.innerHTML = top.slice(0, 5).map(function (p, i) {
        return '<div class="lb-row">' + U.medal(i) + '<span class="av">' + U.esc(p.avatar || '🧑‍🚀') + '</span><span class="lb-name">' + U.esc(p.displayName || p.username) + '</span><span class="lb-score">' + U.fmt(p.totalXP) + '</span></div>';
      }).join('');
    }).catch(function () { box.innerHTML = '<div class="empty small">—</div>'; });
  }

  function busy(on) { var b = U.$('#go'); if (b) { b.disabled = on; b.style.opacity = on ? .7 : 1; } }
  function submit(e) {
    e.preventDefault();
    var pw = U.$('#f-pass'); var b = { username: U.$('#f-user').value.trim(), password: pw ? pw.value : '', gradeLevel: +U.$('#f-grade').value || null };
    if (!b.username) return U.toast('اكتب اسم المستخدم', 'bad');
    if (state.mode === 'signup') {
      if (!b.gradeLevel) return U.toast('اختر الصف الدراسي', 'bad');
      b.role = state.role; b.avatar = state.avatar; b.classCode = (U.$('#f-class').value || '').trim();
    }
    if (b.gradeLevel) try { localStorage.setItem('oa_last_grade', b.gradeLevel); } catch (x) { }
    busy(true);
    (state.mode === 'signup' ? OA.api.signup(b) : OA.api.login(b)).then(function (u) { OA.Sound.level(); OA.app.enter(u); })
      .catch(function (err) { U.toast(U.err(err), 'bad', 4200); }).then(function () { busy(false); });
  }

  /* Google Identity Services — only loaded when the server has GOOGLE_CLIENT_ID */
  function mountGoogle(clientId) {
    if (window.google && google.accounts) return init();
    var s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = init; document.head.appendChild(s);
    function init() {
      google.accounts.id.initialize({ client_id: clientId, callback: function (resp) {
        var grade = +U.$('#f-grade').value || null;
        OA.api.google({ credential: resp.credential, gradeLevel: grade, username: (U.$('#f-user').value || '').trim() || undefined }).then(OA.app.enter).catch(function (err) { U.toast(U.err(err), 'bad'); });
      } });
      var wrap = U.$('#gbtn-wrap'); if (!wrap) return;
      wrap.innerHTML = '<div id="gsi" style="display:flex;justify-content:center"></div>';
      google.accounts.id.renderButton(U.$('#gsi'), { theme: 'filled_blue', size: 'large', shape: 'rectangular', text: 'signin_with', width: Math.min(380, wrap.clientWidth || 380), locale: 'ar' });
    }
  }
  function googleHint() {
    U.toast(OA.api.mode === 'online' ? 'تسجيل Google يحتاج إعداد <b>GOOGLE_CLIENT_ID</b> على الخادم. استخدم اسم المستخدم وكلمة المرور الآن.' : 'تسجيل Google يعمل عند تشغيل الخادم فقط. في الوضع غير المتصل استخدم اسم مستخدم وكلمة مرور.', 'gold', 5000);
  }

  OA.Login = { show: function () { state.mode = null; render(); U.show('login'); }, render: render };
})(window.OA = window.OA || {});
