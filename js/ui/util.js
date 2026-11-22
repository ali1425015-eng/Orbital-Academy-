/* Small UI helpers shared by every screen. */
(function (OA) {
  var U = OA.U = {};
  U.$ = function (s, r) { return (r || document).querySelector(s); };
  U.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  U.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  /* question text: escape, then `math` → isolated LTR span */
  U.qhtml = function (s) { return U.esc(s).replace(/`([^`]+)`/g, '<span class="m">$1</span>'); };
  /* Escapes text and isolates runs of math/latin (e.g. "f(5) = 1(5)² + 2") as
     left-to-right so equations inside Arabic sentences don't get scrambled. */
  var MATHRUN = /([A-Za-z0-9\u00B2\u00B3\u00B9\u2070-\u209F√π±×÷−+\-=*\/^(),.%°<>≤≥Δλρθ∫′|⇒→·_]+(?:[ \u00A0]+[A-Za-z0-9\u00B2\u00B3\u00B9\u2070-\u209F√π±×÷−+\-=*\/^(),.%°<>≤≥Δλρθ∫′|⇒→·_]+)*)/g;
  U.bidi = function (s) {
    return U.esc(U.plain(s)).replace(MATHRUN, function (m) { if (!(/[0-9A-Za-z√π∫]/.test(m) && m.trim().length > 1)) return m;
      var tail = (m.match(/[.,:;\s]+$/) || [''])[0]; return '<span class="mi">' + m.slice(0, m.length - tail.length) + '</span>' + tail; });
  };
  U.plain = function (s) { return String(s || '').replace(/`/g, ''); };
  U.fmt = function (n) { return Math.round(n || 0).toLocaleString('en-US'); };
  U.pct = function (x) { return x == null ? '—' : Math.round(x * 100) + '%'; };
  U.show = function (id) { ['login', 'hub', 'mission', 'teacher'].forEach(function (k) { U.$('#' + k).classList.toggle('hidden', k !== id); }); document.body.classList.toggle('in-game', id === 'mission'); document.body.classList.toggle('in-app', id === 'hub' || id === 'teacher'); window.scrollTo(0, 0); };

  U.toast = function (msg, kind, ms) {
    var t = document.createElement('div'); t.className = 'toast ' + (kind || ''); t.innerHTML = msg;
    U.$('#toasts').appendChild(t);
    setTimeout(function () { t.style.transition = 'opacity .4s'; t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 450); }, ms || 3200);
  };

  U.overlay = function (html, opts) {
    opts = opts || {};
    var root = U.$('#overlay-root');
    var o = document.createElement('div'); o.className = 'overlay'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true');
    o.innerHTML = '<div class="glass glow sheet ' + (opts.wide ? 'wide' : '') + '">' + html + '</div>';
    root.appendChild(o);
    function close() { if (o.parentNode) { o.remove(); document.removeEventListener('keydown', onKey); opts.onClose && opts.onClose(); } }
    function onKey(e) { if (e.key === 'Escape' && opts.dismissable !== false) close(); }
    document.addEventListener('keydown', onKey);
    if (opts.dismissable !== false) o.addEventListener('click', function (e) { if (e.target === o) close(); });
    U.$$('[data-close]', o).forEach(function (b) { b.addEventListener('click', close); });
    var f = o.querySelector('[autofocus], button, input'); if (f) setTimeout(function () { f.focus(); }, 30);
    return { el: o, close: close };
  };

  U.logo = function () {
    return '<div class="logo"><svg viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke-width="3"><ellipse cx="32" cy="32" rx="26" ry="10" stroke="#3fe0ff"/>' +
      '<ellipse cx="32" cy="32" rx="26" ry="10" transform="rotate(60 32 32)" stroke="#7b8cff"/><ellipse cx="32" cy="32" rx="26" ry="10" transform="rotate(120 32 32)" stroke="#b48cff"/></g>' +
      '<circle cx="32" cy="32" r="7" fill="#9ff4ff"/><circle cx="32" cy="32" r="12" fill="#3fe0ff" opacity=".25"/></svg><div><div class="t1">ORBITAL</div><div class="t2">ACADEMY</div></div></div>';
  };
  U.ring = function (v, color, size) {
    size = size || 54; var r = size / 2 - 5, c = 2 * Math.PI * r;
    return '<div class="ring" style="width:' + size + 'px;height:' + size + 'px"><svg width="' + size + '" height="' + size + '"><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke="rgba(255,255,255,.12)" stroke-width="5" fill="none"/>' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke="' + color + '" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + (c * (1 - Math.max(0, Math.min(1, v || 0)))) + '"/></svg><b>' + (v == null ? '—' : Math.round(v * 100) + '%') + '</b></div>';
  };
  U.medal = function (i) { return '<span class="medal ' + (i < 3 ? 'm' + (i + 1) : 'mn') + '">' + (i + 1) + '</span>'; };

  var ERR = {
    bad_credentials: 'اسم المستخدم أو كلمة المرور غير صحيحة.', username_taken: 'اسم المستخدم مستخدم بالفعل — اختر اسماً آخر.', weak_password: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.',
    bad_username: 'اسم المستخدم: 3–20 حرفاً (حروف وأرقام و _ . - فقط).', bad_grade: 'اختر الصف الدراسي.', bad_class_code: 'كود الفصل غير صحيح.', rate_limited: 'محاولات كثيرة — انتظر دقيقة.',
    unauthorized: 'انتهت الجلسة — سجّل الدخول مرة أخرى.', network: 'تعذر الاتصال بالخادم.', google_not_configured: 'تسجيل Google غير مفعّل على هذا الخادم — استخدم اسم المستخدم وكلمة المرور.',
    teachers_only: 'هذه الصفحة للمعلمين فقط.', mission_not_found: 'المهمة غير موجودة.'
  };
  U.err = function (e) { var k = (e && (e.code || e.message)) || 'network'; return ERR[k] || ('حدث خطأ: ' + k); };

  /* settings (per device) */
  var DEF = { sound: true, reduceMotion: false, timer: true, length: 300 };
  U.settings = (function () { try { return Object.assign({}, DEF, JSON.parse(localStorage.getItem('oa_settings') || '{}')); } catch (e) { return Object.assign({}, DEF); } })();
  U.saveSettings = function () { try { localStorage.setItem('oa_settings', JSON.stringify(U.settings)); } catch (e) { } document.documentElement.classList.toggle('reduce-motion', !!U.settings.reduceMotion); };
  U.saveSettings();
})(window.OA = window.OA || {});
