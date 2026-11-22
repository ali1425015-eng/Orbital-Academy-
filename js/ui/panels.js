/* Overlays: AI tutor, mission debrief, leaderboard, progress, settings. */
(function (OA) {
  var U = OA.U, C = OA.Concepts, S = OA.Service;
  var ROBOT = '<svg viewBox="0 0 64 64"><rect x="12" y="16" width="40" height="34" rx="10" fill="#cfe9ff"/><rect x="18" y="24" width="28" height="14" rx="7" fill="#0d1640"/>' +
    '<circle cx="26" cy="31" r="3.5" fill="#3fe0ff"/><circle cx="38" cy="31" r="3.5" fill="#3fe0ff"/><rect class="mouth" x="26" y="42" width="12" height="3" rx="1.5" fill="#3a4a8a" style="transform-origin:32px 43px"/>' +
    '<line x1="32" y1="16" x2="32" y2="8" stroke="#cfe9ff" stroke-width="3"/><circle cx="32" cy="7" r="3" fill="#ff5fb4"/></svg>';

  /* ---------------- AI tutor ---------------- */
  var Tutor = OA.Tutor = {};
  Tutor.open = function (q, selected, res, onDone) {
    var online = OA.api.mode === 'online' && OA.api.info.ai;
    var o = U.overlay(
      '<div class="tutor"><div class="robot" id="rb">' + ROBOT + '</div><div>' +
        '<div class="row between"><h2 style="margin:0">🤖 المدرس الذكي</h2><span class="chip" id="tut-prov">…</span></div>' +
        '<div class="small mut" style="margin:4px 0 10px">' + (selected === -1 ? 'انتهى الوقت' : 'إجابتك: <b dir="auto">' + U.esc(q.options[selected]) + '</b>') + ' · الصحيحة: <b style="color:var(--green)" dir="auto">' + U.esc(q.options[res.correctOptionIndex]) + '</b></div>' +
        '<div class="typed" id="typed"><span class="mut">يحلّل المدرس إجابتك…</span><span class="cursor"></span></div>' +
        '<form class="ask" id="ask"><input class="input" id="ask-in" maxlength="300" placeholder="اسأل المدرس سؤالاً عن هذه النقطة…"><button class="btn sm">إرسال</button></form><div class="typed small" id="ask-out" style="min-height:0;margin-top:8px"></div>' +
        '<div class="row" style="margin-top:14px;justify-content:flex-end"><span class="tiny dim grow">اضغط على النص لإظهاره كاملاً</span><button class="btn primary" id="tut-go" data-close>متابعة المهمة ▶</button></div>' +
      '</div></div>', { dismissable: false, onClose: function () { stop && stop(); onDone && onDone(); } });
    var stop = null;
    OA.api.tutor(q.questionId, selected).then(function (r) {
      var prov = r.provider === 'local' ? '📚 شرح المنهج (محلي)' : '✨ ' + r.provider.split(':')[0].replace('gemini', 'Gemini').replace('openai', 'OpenAI').replace('anthropic', 'Claude');
      U.$('#tut-prov').textContent = prov;
      stop = typewrite(U.$('#typed'), r.text, U.$('#rb'));
    }).catch(function () { stop = typewrite(U.$('#typed'), res.note ? res.note + '\n' + (res.explanation || '') : (res.explanation || ''), U.$('#rb')); });
    var ask = U.$('#ask');
    if (ask) ask.onsubmit = function (e) {
      e.preventDefault(); var v = U.$('#ask-in').value.trim(); if (!v) return;
      U.$('#ask-out').innerHTML = '<span class="mut">…</span>'; U.$('#ask-in').value = '';
      OA.api.ask(q.questionId, v, OA.Mission.id()).then(function (r) { typewrite(U.$('#ask-out'), r.text, U.$('#rb')); }).catch(function (err) { U.$('#ask-out').textContent = U.err(err); });
    };
    setTimeout(function () { var b = U.$('#tut-go'); b && b.focus(); }, 50);
    return o;
  };
  /* Chat with the tutor while a question is still open. The SERVER decides it is "before answering"
     and the prompt forbids revealing the answer. */
  Tutor.chat = function (q, onDone) {
    var online = OA.api.mode === 'online' && OA.api.info.ai;
    var o = U.overlay(
      '<div class="tutor"><div class="robot" id="rb">' + ROBOT + '</div><div>' +
        '<div class="row between"><h2 style="margin:0">🤖 اسأل المدرس الذكي</h2><span class="chip">' + (online ? '✨ ' + U.esc(OA.api.info.ai.split(':')[0]) : '📚 شرح المنهج') + '</span></div>' +
        '<div class="small mut" style="margin:4px 0 8px">اسأل عن فكرة السؤال أو القاعدة — لن أكشف لك الإجابة قبل أن تحاول 😉</div>' +
        '<div class="chat" id="chat"><div class="bub ai">أهلاً يا قائد! ما الذي يحيّرك في هذا السؤال؟</div></div>' +
        '<div class="sugg" id="sugg"><button type="button">اشرح لي القاعدة</button><button type="button">ما هي الخطوة الأولى؟</button><button type="button">أعطني مثالاً مشابهاً</button></div>' +
        '<form class="ask" id="ask"><input class="input" id="ask-in" maxlength="300" placeholder="اكتب سؤالك…" autofocus><button class="btn sm">إرسال</button></form>' +
        '<div class="row" style="margin-top:12px;justify-content:flex-end"><button class="btn primary" data-close>العودة للسؤال ▶</button></div>' +
      '</div></div>', { dismissable: false, onClose: function () { onDone && onDone(); } });
    function send(text) {
      text = (text || '').trim(); if (!text) return;
      var chat = U.$('#chat'), me = document.createElement('div'); me.className = 'bub me'; me.textContent = text; chat.appendChild(me);
      var ai = document.createElement('div'); ai.className = 'bub ai'; ai.innerHTML = '<span class="mut">…</span>'; chat.appendChild(ai); chat.scrollTop = chat.scrollHeight;
      U.$('#ask-in').value = '';
      OA.api.ask(q.questionId, text, OA.Mission.id()).then(function (r) { typewrite(ai, r.text, U.$('#rb')); setTimeout(function () { chat.scrollTop = chat.scrollHeight; }, 60); })
        .catch(function (e) { ai.textContent = U.err(e); });
    }
    U.$('#ask').onsubmit = function (e) { e.preventDefault(); send(U.$('#ask-in').value); };
    U.$$('#sugg button').forEach(function (b) { b.onclick = function () { send(b.textContent); }; });
    return o;
  };

  function typewrite(el, text, robot) {
    if (!el) return function () { };
    text = U.plain(text); var i = 0, done = false;
    robot && robot.classList.add('talk');
    var speed = U.settings.reduceMotion ? 0 : 16;
    function step() {
      if (done) return;
      i = speed ? Math.min(text.length, i + 2) : text.length;
      el.innerHTML = U.bidi(text.slice(0, i)) + (i < text.length ? '<span class="cursor"></span>' : '');
      if (i % 6 === 0) OA.Sound.type();
      if (i >= text.length) { done = true; robot && robot.classList.remove('talk'); return; }
      setTimeout(step, speed);
    }
    el.onclick = function () { i = text.length - 1; };
    step();
    return function () { done = true; robot && robot.classList.remove('talk'); };
  }

  /* ---------------- debrief ---------------- */
  var Panels = OA.Panels = {};
  Panels.debrief = function (r, M, cause) {
    var s = r.summary, acc = s.answered ? s.correct / s.answered : 0;
    var title = r.survived ? '✅ المهمة اكتملت — المركبة سالمة' : cause === 'abort' ? '🛑 أنهيت المهمة مبكراً' : OA.Mission.SYS_AR[cause] ? '🚨 عودة اضطرارية — نفد ' + OA.Mission.SYS_AR[cause][1] : '🛰️ انتهت المهمة';
    var concepts = Object.keys(s.concepts || {}).map(function (t) { return { tag: t, ar: (C.ALL[t] || {}).ar || t, m: s.concepts[t] }; }).sort(function (a, b) { return a.m - b.m; });
    var advice = [];
    if (s.focus < 0.6 || s.rapid > 1) advice.push('🧘 مؤشر تركيزك انخفض في هذه المهمة. خذ استراحة 5 دقائق بعيداً عن الشاشة قبل المهمة التالية.');
    if (concepts.length && concepts[0].m < 0.5) advice.push('📌 راجع مفهوم <b>' + U.esc(concepts[0].ar) + '</b> — سيعيد لك النظام أسئلته قريباً.');
    if (acc >= 0.8 && s.answered >= 5) advice.push('🚀 أداء ممتاز! سيرفع النظام مستوى الصعوبة تدريجياً.');
    if (!advice.length) advice.push('🎯 استمر! كل مهمة قصيرة تبني إتقانك خطوة بخطوة.');
    U.overlay(
      '<div class="panel-h"><span style="font-size:1.15rem">' + title + '</span><span class="en">DEBRIEF</span></div><div class="panel-b stack">' +
      '<div class="debrief-stats"><div class="stat"><b class="en">' + s.answered + '</b><span>سؤالاً</span></div><div class="stat"><b class="en">' + Math.round(acc * 100) + '%</b><span>الدقة</span></div>' +
        '<div class="stat"><b class="en" style="color:var(--gold)">+' + U.fmt(s.xp) + '</b><span>XP (منها مكافأة ' + r.bonus + ')</span></div><div class="stat combo"><b class="en">×' + s.bestCombo + '</b><span>أفضل سلسلة</span></div>' +
        '<div class="stat"><b class="en">' + Math.round(s.focus * 100) + '%</b><span>التركيز</span></div><div class="stat"><b class="en">' + s.rapid + '</b><span>تخمين سريع</span></div>' +
        '<div class="stat"><b class="en">' + r.rank.icon + '</b><span>' + r.rank.ar + ' · مستوى ' + r.level + '</span></div><div class="stat"><b class="en">' + U.fmt(r.totalXP) + '</b><span>إجمالي XP</span></div></div>' +
      (r.badges.length ? '<div><b>🏅 أوسمة جديدة:</b> ' + r.badges.map(function (b) { return '<span class="chip gold">' + S.BADGES[b].icon + ' ' + S.BADGES[b].ar + '</span>'; }).join(' ') + '</div>' : '') +
      (concepts.length ? '<div><b>🧠 المفاهيم التي تدربت عليها</b>' + concepts.map(function (c) { return '<div class="concept-row"><span>' + U.esc(c.ar) + '</span><div class="bar"><i style="width:' + (c.m * 100).toFixed(0) + '%"></i></div><span class="en small">' + Math.round(c.m * 100) + '%</span></div>'; }).join('') + '</div>' : '') +
      '<div class="tip-card">' + advice.join('<br>') + '</div>' +
      '<div class="row wrap" style="justify-content:flex-end"><button class="btn" id="db-hub">🛰️ العودة للقيادة</button><button class="btn launch" id="db-again">🚀 مهمة جديدة</button></div></div>',
      { dismissable: false });
    if (r.survived) OA.Sound.level();
    U.$('#db-hub').onclick = function () { U.$('.overlay').remove(); OA.Hub.show(); };
    U.$('#db-again').onclick = function () { U.$('.overlay').remove(); OA.Mission.start(M.subject, M.durationSec); };
  };

  /* ---------------- leaderboard ---------------- */
  Panels.board = function () {
    var o = U.overlay('<div class="panel-h"><span style="font-size:1.1rem">🏆 لوحة المتصدرين</span><button class="btn icon" data-close aria-label="إغلاق">✕</button></div><div class="panel-b">' +
      '<div class="seg" id="lb-tabs"><button data-s="global" class="on">العالم</button><button data-s="grade">صفّي</button><button data-s="class">فصلي</button><button data-s="weekly">هذا الأسبوع</button></div>' +
      '<div id="lb-body" style="margin-top:12px"></div>' + (OA.api.mode === 'local' ? '<p class="tiny dim">وضع غير متصل: القائمة تضم اللاعبين على هذا الجهاز فقط. شغّل الخادم لقائمة مركزية بين كل الطلاب.</p>' : '') + '</div>');
    function load(scope) {
      U.$('#lb-body').innerHTML = '<div class="empty">…</div>';
      OA.api.board(scope).then(function (r) {
        var key = scope === 'weekly' ? 'weeklyXP' : 'totalXP', me = OA.app.user.username;
        U.$('#lb-body').innerHTML = r.top.length ? r.top.map(function (p, i) {
          return '<div class="lb-row" style="' + (p.username === me ? 'background:rgba(63,224,255,.1);border-radius:10px' : '') + '">' + U.medal(i) + '<span class="av">' + U.esc(p.avatar) + '</span><span class="lb-name">' + U.esc(p.displayName || p.username) +
            ' <span class="tiny dim">' + U.esc(C.gradeAr[p.gradeLevel] || '') + ' · LV ' + p.currentLevel + '</span></span><span class="lb-score">' + U.fmt(p[key]) + '</span></div>';
        }).join('') + (r.me.rank ? '<div class="tip-card" style="margin-top:10px">ترتيبك: <b class="en">#' + r.me.rank + '</b> من ' + r.me.total + ' · ' + U.fmt(r.me.score) + ' XP</div>' : '')
          : '<div class="empty">' + (scope === 'class' && !OA.app.user.classCode ? 'لم تنضم لفصل بعد — أضف كود الفصل من الإعدادات ⚙️' : 'لا يوجد لاعبون بعد') + '</div>';
      }).catch(function (e) { U.$('#lb-body').innerHTML = '<div class="empty">' + U.err(e) + '</div>'; });
    }
    U.$$('#lb-tabs button', o.el).forEach(function (b) { b.onclick = function () { U.$$('#lb-tabs button').forEach(function (x) { x.classList.toggle('on', x === b); }); load(b.dataset.s); }; });
    load('global');
  };

  /* ---------------- progress ---------------- */
  Panels.progress = function () {
    var o = U.overlay('<div class="panel-h"><span style="font-size:1.1rem">📈 تقدمي</span><button class="btn icon" data-close aria-label="إغلاق">✕</button></div><div class="panel-b" id="pg"><div class="empty">…</div></div>', { wide: true });
    OA.api.progress().then(function (p) {
      var st = p.stats, subj = Object.keys(C.SUBJECTS);
      var level = subj.map(function (s) {
        var e = p.elo[s], n = p.answeredBySubject[s] || 0, v = e == null ? null : 1 / (1 + Math.exp(-e));
        return '<div class="concept-row"><span>' + C.SUBJECTS[s].icon + ' ' + C.SUBJECTS[s].ar + ' <span class="tiny dim">(' + n + ' إجابة)</span></span><div class="bar"><i style="width:' + ((v || 0) * 100).toFixed(0) + '%;background:' + OA.Hub.HEX[s] + '"></i></div><span class="en small">' + (v == null ? '—' : Math.round(v * 100) + '%') + '</span></div>';
      }).join('');
      var groups = subj.map(function (s) {
        var cs = p.concepts.filter(function (c) { return c.subject === s; }); if (!cs.length) return '';
        return '<h4 style="margin:12px 0 4px">' + C.SUBJECTS[s].icon + ' ' + C.SUBJECTS[s].ar + '</h4>' + cs.map(function (c) {
          return '<div class="concept-row"><span>' + U.esc(c.ar) + ' <span class="tiny dim">×' + c.attempts + '</span></span><div class="bar"><i style="width:' + (c.mastery * 100).toFixed(0) + '%;background:' + (c.mastery < .4 ? 'var(--red)' : c.mastery < .75 ? 'var(--gold)' : 'var(--green)') + '"></i></div><span class="en small">' + Math.round(c.mastery * 100) + '%</span></div>';
        }).join('');
      }).join('');
      var badges = Object.keys(S.BADGES).map(function (k) { var b = S.BADGES[k], on = p.badges.indexOf(k) >= 0; return '<div class="row" style="opacity:' + (on ? 1 : .4) + '"><span class="badge ' + (on ? '' : 'off') + '">' + b.icon + '</span><div><b>' + b.ar + '</b><div class="tiny mut">' + b.desc + '</div></div></div>'; }).join('');
      var recent = (p.recent || []).map(function (m) { return '<tr><td>' + new Date(m.startedAt).toLocaleDateString('ar-EG') + '</td><td>' + (m.subject === 'mixed' ? '🌀' : C.SUBJECTS[m.subject].icon + ' ' + C.SUBJECTS[m.subject].ar) + '</td><td class="en">' + m.correct + '/' + m.answered + '</td><td class="en">' + m.rapid + '</td><td class="en" style="color:var(--gold)">+' + m.xp + '</td><td>' + (m.survived ? '✅' : '⚠️') + '</td></tr>'; }).join('');
      U.$('#pg').innerHTML =
        '<div class="debrief-stats" style="margin-bottom:14px"><div class="stat"><b class="en">' + st.missions + '</b><span>مهمة</span></div><div class="stat"><b class="en">' + st.answered + '</b><span>إجابة</span></div>' +
          '<div class="stat"><b class="en">' + U.pct(st.answered ? st.correct / st.answered : null) + '</b><span>الدقة</span></div><div class="stat"><b class="en">' + U.pct(p.focusAvg) + '</b><span>متوسط التركيز</span></div></div>' +
        '<div class="hub-grid" style="margin-top:0"><div><h3 style="margin:0 0 6px">🎚️ مستواك المقدّر في كل مادة <span class="tiny dim">(Elo → احتمال حل سؤال متوسط من صفك)</span></h3>' + level +
          '<h3 style="margin:16px 0 0">🧠 إتقان المفاهيم <span class="tiny dim">(تتبع المعرفة البايزي BKT)</span></h3>' + (groups || '<div class="empty">ابدأ مهمة لتظهر مفاهيمك هنا</div>') +
          '<p class="small mut">🔁 أسئلة في قائمة المراجعة المتباعدة: <b>' + p.reviewsTotal + '</b> (مستحقة الآن: ' + p.reviewsDue + ')</p></div>' +
          '<div><h3 style="margin:0 0 8px">🏅 الأوسمة</h3><div class="stack">' + badges + '</div></div></div>' +
        (recent ? '<h3>🛰️ آخر المهام</h3><table class="tbl"><thead><tr><th>التاريخ</th><th>المادة</th><th>صحيح</th><th>تخمين سريع</th><th>XP</th><th>النتيجة</th></tr></thead><tbody>' + recent + '</tbody></table>' : '') +
        '<div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn sm" id="pg-csv">📥 تنزيل إجاباتي (CSV)</button></div>';
      U.$('#pg-csv').onclick = function () { OA.api.exportMine(); };
    }).catch(function (e) { U.$('#pg').innerHTML = '<div class="empty">' + U.err(e) + '</div>'; });
  };

  /* ---------------- settings ---------------- */
  Panels.settings = function () {
    var u = OA.app.user, api = OA.api, st = U.settings;
    var AV = ['🧑‍🚀', '👩‍🚀', '👨‍🚀', '🤖', '👽', '🦊', '🐼', '🦉', '🐉', '🛸', '🌟', '🪐'];
    var o = U.overlay('<div class="panel-h"><span style="font-size:1.1rem">⚙️ الإعدادات</span><button class="btn icon" data-close aria-label="إغلاق">✕</button></div><div class="panel-b stack">' +
      '<label class="field"><span>الصف الدراسي</span><select class="input" id="s-grade">' + C.GRADES.map(function (g) { return '<option value="' + g + '"' + (g === u.gradeLevel ? ' selected' : '') + '>' + C.gradeAr[g] + '</option>'; }).join('') + '</select></label>' +
      '<div class="field"><span>الصورة</span><div class="avatars" id="s-av">' + AV.map(function (a) { return '<button type="button" class="' + (a === u.avatar ? 'on' : '') + '" data-a="' + a + '">' + a + '</button>'; }).join('') + '</div></div>' +
      '<label class="field"><span>كود الفصل (من معلمك)</span><div class="row"><input class="input" id="s-class" maxlength="6" value="' + U.esc(u.classCode || '') + '" style="text-transform:uppercase"><button class="btn sm" id="s-join">حفظ</button></div></label>' +
      '<div class="row between"><span>🔊 المؤثرات الصوتية</span><input type="checkbox" id="s-sound" ' + (st.sound ? 'checked' : '') + '></div>' +
      '<div class="row between"><span>⏱️ مؤقت لكل سؤال</span><input type="checkbox" id="s-timer" ' + (st.timer ? 'checked' : '') + '></div>' +
      '<div class="row between"><span>🌙 تقليل الحركة</span><input type="checkbox" id="s-motion" ' + (st.reduceMotion ? 'checked' : '') + '></div>' +
      '<div class="tip-card small"><b>حول النظام</b><br>الوضع: ' + (api.mode === 'online' ? '🟢 متصل بالخادم' : '🟠 غير متصل (البيانات على هذا الجهاز)') + '<br>بنك الأسئلة: ' + U.fmt(api.info.questions) + ' سؤال<br>' +
        'المدرس الذكي: ' + (api.info.ai ? '✨ ' + U.esc(api.info.ai) : '📚 شرح المنهج المحلي (لا يوجد مفتاح LLM)') + '<br>نموذج التعلم الآلي: ' + (OA.Model ? 'انحدار لوجستي · AUC ' + OA.Model.correct.auc.toFixed(3) + ' / ' + OA.Model.disengage.auc.toFixed(3) + ' (بيانات محاكاة)' : 'Elo فقط') + '</div>' +
      '</div>', { onClose: function () { if (!OA.Mission.active()) OA.Hub.show(); } });
    U.$('#s-grade').onchange = function () { api.updateMe({ gradeLevel: +this.value }).then(function (nu) { OA.app.user = nu; U.toast('تم تحديث الصف ✓', 'good'); }); };
    U.$$('#s-av button').forEach(function (b) { b.onclick = function () { api.updateMe({ avatar: b.dataset.a }).then(function (nu) { OA.app.user = nu; U.$$('#s-av button').forEach(function (x) { x.classList.toggle('on', x === b); }); }); }; });
    U.$('#s-join').onclick = function () { api.updateMe({ classCode: U.$('#s-class').value }).then(function (nu) { OA.app.user = nu; U.toast('تم الانضمام للفصل ✓', 'good'); }).catch(function (e) { U.toast(U.err(e), 'bad'); }); };
    U.$('#s-sound').onchange = function () { st.sound = this.checked; U.saveSettings(); };
    U.$('#s-timer').onchange = function () { st.timer = this.checked; U.saveSettings(); };
    U.$('#s-motion').onchange = function () { st.reduceMotion = this.checked; U.saveSettings(); };
  };
})(window.OA = window.OA || {});
