/* Modals: AI tutor (after a wrong answer), tutor chat (before answering), focus break, debrief. */
(function (OA) {
  var U = OA.U, S = OA.Service, t = function (k, v) { return OA.t(k, v); };
  var BOT = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="12" y="16" width="40" height="34" rx="11" fill="#fff"/><rect x="18" y="24" width="28" height="14" rx="7" fill="#2D1C8F"/>' +
    '<circle cx="26" cy="31" r="3.5" fill="#9FEFFF"/><circle cx="38" cy="31" r="3.5" fill="#9FEFFF"/><rect class="mouth" x="26" y="42" width="12" height="3" rx="1.5" fill="#6A4CFF" style="transform-origin:32px 43px"/>' +
    '<line x1="32" y1="16" x2="32" y2="8" stroke="#fff" stroke-width="3"/><circle cx="32" cy="7" r="3.5" fill="#FFD25E"/></svg>';
  function provName(p) { return p === 'local' ? t('localTutor') : '✨ ' + String(p).split(':')[0].replace('gemini', 'Gemini').replace('openai', 'OpenAI').replace('anthropic', 'Claude'); }

  function typewrite(el, text, bot) {
    if (!el) return function () { };
    text = U.plain(text); var i = 0, done = false, speed = U.settings.reduceMotion ? 0 : 14;
    bot && bot.classList.add('talk');
    (function step() {
      if (done) return;
      i = speed ? Math.min(text.length, i + 2) : text.length;
      el.innerHTML = U.bidi(text.slice(0, i)) + (i < text.length ? '<span class="cursor"></span>' : '');
      if (i % 8 === 0) OA.Sound.type();
      if (i >= text.length) { done = true; bot && bot.classList.remove('talk'); return; }
      setTimeout(step, speed);
    })();
    el.onclick = function () { i = text.length - 1; };
    return function () { done = true; bot && bot.classList.remove('talk'); };
  }

  var Tutor = OA.Tutor = {};
  Tutor.open = function (q, selected, res, onDone) {
    var stop = null, lang = OA.I18N.get();
    var o = U.modal('<div class="modal-b"><div class="tutor"><div class="bot" id="bot">' + BOT + '</div><div>' +
      '<div class="row between"><h2>' + t('tutorTitle') + '</h2><span class="chip brand" id="prov">…</span></div>' +
      '<p class="small mut" style="margin:6px 0 12px">' + (selected === -1 ? t('timedOut') : t('yourAnswer') + ': <b dir="auto">' + U.esc(q.options[selected]) + '</b>') + ' · ' + t('correctAnswer') + ': <b style="color:var(--green)" dir="auto">' + U.esc(q.options[res.correctOptionIndex]) + '</b></p>' +
      '<div class="typed" id="typed"><span class="mut">' + t('analysing') + '</span><span class="cursor"></span></div>' +
      '<form class="ask" id="ask"><input class="input" id="ask-in" maxlength="300" placeholder="' + t('askPlaceholder') + '"><button class="btn soft">' + U.icon('send', 16) + '</button></form>' +
      '<div class="typed small" id="ask-out" style="min-height:0;margin-top:8px"></div>' +
      '<div class="row end" style="margin-top:16px"><span class="tiny mut grow">' + t('tapToSkip') + '</span><button class="btn primary" data-close>' + t('continueMission') + '</button></div>' +
      '</div></div></div>', { dismissable: false, onClose: function () { stop && stop(); onDone && onDone(); } });
    OA.api.tutor(q.questionId, selected, lang).then(function (r) { U.$('#prov').textContent = provName(r.provider); stop = typewrite(U.$('#typed'), r.text, U.$('#bot')); })
      .catch(function () { stop = typewrite(U.$('#typed'), (res.note ? res.note + '\n' : '') + (res.explanation || ''), U.$('#bot')); });
    U.$('#ask').onsubmit = function (e) {
      e.preventDefault(); var v = U.$('#ask-in').value.trim(); if (!v) return;
      U.$('#ask-out').innerHTML = '<span class="mut">…</span>'; U.$('#ask-in').value = '';
      OA.api.ask(q.questionId, v, OA.Mission.id(), lang).then(function (r) { typewrite(U.$('#ask-out'), r.text, U.$('#bot')); }).catch(function (err) { U.$('#ask-out').textContent = U.err(err); });
    };
    return o;
  };

  Tutor.chat = function (q, onDone) {
    var lang = OA.I18N.get(), ai = OA.api.mode === 'online' && OA.api.info.ai;
    U.modal('<div class="modal-b"><div class="tutor"><div class="bot" id="bot">' + BOT + '</div><div>' +
      '<div class="row between"><h2>' + t('chatTitle') + '</h2><span class="chip brand">' + (ai ? provName(OA.api.info.ai) : t('localTutor')) + '</span></div>' +
      '<p class="small mut" style="margin-top:6px">' + t('chatSub') + '</p>' +
      '<div class="chat" id="chat"><div class="bub ai">' + t('chatHello') + '</div></div>' +
      '<div class="sugg" id="sugg"><button type="button">' + t('sugg1') + '</button><button type="button">' + t('sugg2') + '</button><button type="button">' + t('sugg3') + '</button></div>' +
      '<form class="ask" id="ask"><input class="input" id="ask-in" maxlength="300" placeholder="' + t('askPlaceholder') + '" autofocus><button class="btn soft">' + U.icon('send', 16) + '</button></form>' +
      '<div class="row end" style="margin-top:14px"><button class="btn primary" data-close>' + t('backToQuestion') + '</button></div>' +
      '</div></div></div>', { dismissable: false, onClose: function () { onDone && onDone(); } });
    function send(text) {
      text = (text || '').trim(); if (!text) return;
      var chat = U.$('#chat'), me = document.createElement('div'); me.className = 'bub me'; me.textContent = text; chat.appendChild(me);
      var b = document.createElement('div'); b.className = 'bub ai'; b.innerHTML = '<span class="mut">…</span>'; chat.appendChild(b); chat.scrollTop = chat.scrollHeight;
      U.$('#ask-in').value = '';
      OA.api.ask(q.questionId, text, OA.Mission.id(), lang).then(function (r) { typewrite(b, r.text, U.$('#bot')); setTimeout(function () { chat.scrollTop = chat.scrollHeight; }, 80); }).catch(function (e) { b.textContent = U.err(e); });
    }
    U.$('#ask').onsubmit = function (e) { e.preventDefault(); send(U.$('#ask-in').value); };
    U.$$('#sugg button').forEach(function (b) { b.onclick = function () { send(b.textContent); }; });
  };

  Tutor.focusBreak = function (risk, done) {
    var left = 20;
    var o = U.modal('<div class="modal-b" style="text-align:center"><span class="chip brand">FOCUS PROTOCOL · ' + Math.round(risk * 100) + '%</span><h2 style="margin-top:10px">' + t('focusBreak') + '</h2>' +
      '<p class="mut" style="margin-top:6px">' + t('focusBreakSub') + '</p><div class="breath" id="br">' + t('inhale') + '</div><p class="small mut" id="br-t">' + t('backIn', { n: 20 }) + '</p>' +
      '<button class="btn" id="br-skip" disabled style="margin-top:10px">' + t('continueNow') + '</button></div>', { dismissable: false, size: 'narrow' });
    var iv = setInterval(function () {
      left--; var tt = U.$('#br-t'); if (tt) tt.textContent = t('backIn', { n: left });
      var b = U.$('#br'); if (b) b.textContent = (Math.floor((20 - left) / 4) % 2) ? t('exhale') : t('inhale');
      if (left <= 15) { var s = U.$('#br-skip'); if (s) s.disabled = false; }
      if (left <= 0) end();
    }, 1000);
    function end() { clearInterval(iv); o.close(); done(); }
    U.$('#br-skip').onclick = end;
  };

  Tutor.notice = function (icon, title, sub, btn, onClose) {
    return U.modal('<div class="modal-b" style="text-align:center;padding:30px 24px"><div style="font-size:2.6rem">' + icon + '</div><h2 style="margin-top:8px">' + title + '</h2><p class="mut" style="margin-top:8px">' + sub + '</p>' +
      '<button class="btn primary lg" data-close style="margin-top:18px">' + btn + '</button></div>', { size: 'narrow', onClose: onClose });
  };

  Tutor.debrief = function (r, snap, cause) {
    var s = r.summary, acc = s.answered ? s.correct / s.answered : 0, lang = OA.I18N.get();
    var title = r.survived ? '✅ ' + t('debriefOk') : cause === 'abort' ? '🛑 ' + t('debriefAbort') : ['oxygen', 'power', 'shield', 'comms'].indexOf(cause) >= 0 ? '🚨 ' + t('debriefFail', { s: t(cause) }) : '🛰️ ' + t('debriefEnd');
    var concepts = Object.keys(s.concepts || {}).map(function (k) { return { tag: k, m: s.concepts[k] }; }).sort(function (a, b) { return a.m - b.m; });
    var advice = [];
    if (s.focus < 0.6 || s.rapid > 1) advice.push('🧘 ' + t('adviceFocus'));
    if (concepts.length && concepts[0].m < 0.5) advice.push('📌 ' + t('adviceReview', { c: U.esc(U.conceptName(concepts[0].tag)) }));
    if (acc >= 0.8 && s.answered >= 5) advice.push('🚀 ' + t('adviceGreat'));
    if (!advice.length) advice.push('🎯 ' + t('adviceKeep'));
    var stats = [[s.answered, t('dAnswered')], [Math.round(acc * 100) + '%', t('dAccuracy')], ['+' + U.fmt(s.xp), t('dXp', { b: r.bonus })], ['×' + s.bestCombo, t('dCombo')],
      [Math.round(s.focus * 100) + '%', t('dFocus')], [s.rapid, t('dRapid')], [r.rank.icon + ' ' + r.level, lang === 'en' ? r.rank.en : r.rank.ar], [U.fmt(r.totalXP), t('dTotal')]];
    var o = U.modal('<div class="modal-h"><h2>' + title + '</h2></div><div class="modal-b stack-lg">' +
      '<div class="dstats">' + stats.map(function (x) { return '<div class="dstat"><b>' + x[0] + '</b><span>' + x[1] + '</span></div>'; }).join('') + '</div>' +
      (r.badges.length ? '<div><b>' + t('newBadges') + ':</b> ' + r.badges.map(function (b) { var B = S.BADGES[b]; return '<span class="chip amber">' + B.icon + ' ' + U.esc(lang === 'en' ? B.en : B.ar) + '</span>'; }).join(' ') + '</div>' : '') +
      (concepts.length ? '<div><b>' + t('practiced') + '</b>' + concepts.map(function (c) { return '<div class="crow"><span>' + U.esc(U.conceptName(c.tag)) + '</span><div class="bar"><i style="width:' + Math.round(c.m * 100) + '%"></i></div><span class="num">' + Math.round(c.m * 100) + '%</span></div>'; }).join('') + '</div>' : '') +
      '<div class="tipcard"><div>' + advice.join('<br>') + '</div></div>' +
      '<div class="row end wrap"><button class="btn" id="db-home">' + t('backHome') + '</button><button class="btn primary" id="db-again">' + U.icon('play', 16) + t('newMission') + '</button></div></div>', { dismissable: false, size: 'wide' });
    if (r.survived) OA.Sound.level();
    U.$('#db-home').onclick = function () { o.close(); OA.Shell.go('home'); };
    U.$('#db-again').onclick = function () { o.close(); OA.Mission.start(snap.subject, snap.opts); };
  };
})(window.OA = window.OA || {});
