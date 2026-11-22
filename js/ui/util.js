/* UI helpers + icon set + per-device settings. */
(function (OA) {
  var U = OA.U = {};
  U.$ = function (s, r) { return (r || document).querySelector(s); };
  U.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  U.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  U.qhtml = function (s) { return U.esc(s).replace(/`([^`]+)`/g, '<span class="m">$1</span>'); };
  U.plain = function (s) { return String(s || '').replace(/`/g, ''); };
  var MATHRUN = /([A-Za-z0-9²³¹⁰-₟√π±×÷−+\-=*\/^(),.%°<>≤≥Δλρθ∫′|⇒→·_]+(?:[  ]+[A-Za-z0-9²³¹⁰-₟√π±×÷−+\-=*\/^(),.%°<>≤≥Δλρθ∫′|⇒→·_]+)*)/g;
  /* isolate equations / latin runs inside Arabic text so they read left-to-right */
  U.bidi = function (s) {
    if (OA.I18N.get() === 'en') return U.esc(U.plain(s));
    return U.esc(U.plain(s)).replace(MATHRUN, function (m) {
      if (!(/[0-9A-Za-z√π∫]/.test(m) && m.trim().length > 1)) return m;
      var tail = (m.match(/[.,:;\s]+$/) || [''])[0]; return '<span class="mi">' + m.slice(0, m.length - tail.length) + '</span>' + tail;
    });
  };
  U.fmt = function (n) { return Math.round(n || 0).toLocaleString('en-US'); };
  U.pct = function (x) { return x == null ? '—' : Math.round(x * 100) + '%'; };

  var P = {
    home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z', trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4',
    chart: 'M4 20V10M10 20V4M16 20v-7M2 20h20', logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
    settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
    users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
    globe: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20', play: 'M7 4l13 8-13 8z', pause: 'M7 4h3v16H7zM14 4h3v16h-3z',
    x: 'M18 6L6 18M6 6l12 12', clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2', list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
    bolt: 'M13 2L3 14h9l-1 8 10-12h-9z', sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8z',
    bulb: 'M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z', scissors: 'M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12',
    chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', check: 'M20 6L9 17l-5-5', flame: 'M12 22c4 0 7-3 7-7 0-4-3-6-4-9-1 2-2 3-4 3 0-2 0-4-2-6-2 4-4 7-4 12 0 4 3 7 7 7z',
    target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
    share: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13', refresh: 'M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15',
    rocket: 'M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1zM12 15l-3-3a22 22 0 0 1 2-4A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2zM9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5',
    star: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z', book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5z',
    send: 'M22 2L11 13M22 2l-7 20-4-9-9-4z', lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4', mail: 'M4 4h16v16H4zM4 6l8 7 8-7'
  };
  U.icon = function (name, size) { size = size || 20; return '<svg class="ic" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + (P[name] || '') + '"/></svg>'; };
  U.logo = function (light) {
    return '<div class="brand' + (light ? ' light' : '') + '"><span class="brand-mark"><svg viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke-width="4"><ellipse cx="32" cy="32" rx="26" ry="10" stroke="#fff"/><ellipse cx="32" cy="32" rx="26" ry="10" transform="rotate(60 32 32)" stroke="#fff" opacity=".8"/><ellipse cx="32" cy="32" rx="26" ry="10" transform="rotate(120 32 32)" stroke="#fff" opacity=".6"/></g><circle cx="32" cy="32" r="7" fill="#fff"/></svg></span><span class="brand-name">Orbital<b>Academy</b></span></div>';
  };

  U.SUBJ_COLOR = { math: '#F79009', science: '#7A5AF8', english: '#12B76A', arabic: '#2E90FA', iq: '#EE46BC', lmath: '#F79009', lscience: '#7A5AF8', lenglish: '#12B76A' };
  U.subjectTile = function (s, size) { var c = U.SUBJ_COLOR[s] || '#6A4CFF'; return '<span class="stile" style="--c:' + c + ';' + (size ? 'width:' + size + 'px;height:' + size + 'px' : '') + '">' + ((OA.Concepts.SUBJECTS[s] || {}).icon || '📘') + '</span>'; };

  U.show = function (id) {
    ['auth', 'app', 'mission'].forEach(function (k) { var el = U.$('#' + k); if (el) el.classList.toggle('hidden', k !== id); });
    document.body.dataset.screen = id; window.scrollTo(0, 0);
  };

  U.toast = function (msg, kind, ms) {
    var t = document.createElement('div'); t.className = 'toast ' + (kind || ''); t.innerHTML = msg;
    U.$('#toasts').appendChild(t);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 400); }, ms || 3200);
  };

  U.modal = function (html, opts) {
    opts = opts || {};
    var o = document.createElement('div'); o.className = 'modal-wrap'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true');
    o.innerHTML = '<div class="modal ' + (opts.size || '') + '">' + html + '</div>';
    U.$('#overlay-root').appendChild(o);
    function close() { if (o.parentNode) { o.remove(); document.removeEventListener('keydown', onKey); opts.onClose && opts.onClose(); } }
    function onKey(e) { if (e.key === 'Escape' && opts.dismissable !== false) close(); }
    document.addEventListener('keydown', onKey);
    if (opts.dismissable !== false) o.addEventListener('click', function (e) { if (e.target === o) close(); });
    U.$$('[data-close]', o).forEach(function (b) { b.addEventListener('click', close); });
    var f = o.querySelector('[autofocus]') || o.querySelector('.btn.primary'); if (f) setTimeout(function () { f.focus(); }, 30);
    return { el: o, close: close };
  };

  U.ring = function (v, color, size, label) {
    size = size || 56; var sw = Math.max(5, size / 10), r = size / 2 - sw / 2 - 1, c = 2 * Math.PI * r;
    return '<span class="ring" style="width:' + size + 'px;height:' + size + 'px"><svg width="' + size + '" height="' + size + '"><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke="var(--line)" stroke-width="' + sw + '" fill="none"/>' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke="' + color + '" stroke-width="' + sw + '" fill="none" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + (c * (1 - Math.max(0, Math.min(1, v || 0)))) + '"/></svg><b>' + (label != null ? label : v == null ? '—' : Math.round(v * 100) + '%') + '</b></span>';
  };
  U.medal = function (i) { return '<span class="medal m' + (i < 3 ? i + 1 : 'n') + '">' + (i + 1) + '</span>'; };
  U.err = function (e) { return OA.I18N.err((e && (e.code || e.message)) || 'network'); };

  var DEF = { sound: true, reduceMotion: false, timer: true, mode: 'time', length: 300, count: 10 };
  U.settings = (function () { try { return Object.assign({}, DEF, JSON.parse(localStorage.getItem('oa_settings') || '{}')); } catch (e) { return Object.assign({}, DEF); } })();
  U.saveSettings = function () { try { localStorage.setItem('oa_settings', JSON.stringify(U.settings)); } catch (e) { } document.documentElement.classList.toggle('reduce-motion', !!U.settings.reduceMotion); };
  U.saveSettings();
  U.gradeName = function (g) { return OA.Concepts.gradeName(g, OA.I18N.get()); };
  U.subjectName = function (s) { return OA.Concepts.subjectName(s, OA.I18N.get()); };
  U.conceptName = function (t) { return OA.Concepts.name(t, OA.I18N.get()); };
})(window.OA = window.OA || {});
