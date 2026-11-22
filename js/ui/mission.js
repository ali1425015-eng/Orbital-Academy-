/* ==========================================================================
   Mission = the core game loop.
   Ship systems drain over time; a crisis hits one system (= one subject).
   To repair it the student answers curriculum questions:
     correct → system +18, XP (× combo)      wrong → system −12 + AI tutor
   Focus features: tab-away auto-pause, rapid-guess detection (no XP),
   ML disengagement risk → short breathing break, short mission lengths.
   ========================================================================== */
(function (OA) {
  var U = OA.U, R = OA.Rules, C = OA.Concepts;
  var SYS_AR = { oxygen: ['🫁', 'الأكسجين', 'var(--oxygen)'], power: ['⚡', 'الطاقة', 'var(--power)'], shield: ['🛡️', 'الدرع', 'var(--shield)'], comms: ['📡', 'الاتصالات', 'var(--comms)'] };
  var CRISES = {
    oxygen: ['تسرّب في دائرة الأكسجين', 'عطل في مُرشّح ثاني أكسيد الكربون', 'انخفاض ضغط الكبسولة', 'توقف مضخة إعادة التدوير'],
    power: ['خلل في معايرة المفاعل', 'انقطاع في شبكة الألواح الشمسية', 'حمل زائد على البطاريات', 'عطل في حاسوب الملاحة'],
    shield: ['عاصفة شمسية تقترب', 'حزام كويكبات صغيرة أمامنا', 'تشقق في الدرع الحراري', 'إشعاع كوني مرتفع'],
    comms: ['فقدان الإشارة مع محطة الأرض', 'رسالة مشفّرة من مركز التحكم', 'تشويش على الهوائي الرئيسي', 'طلب إغاثة من مركبة أخرى']
  };
  var M = null;

  function now() { return Date.now(); }

  /* ---------------- start ---------------- */
  function start(subject, durationSec) {
    OA.Sound.click();
    OA.api.startMission(subject, durationSec).then(function (mission) {
      M = { mission: mission, subject: subject, durationSec: mission.durationSec, endAt: now() + mission.durationSec * 1000, paused: false, pauseReason: null,
        res: { oxygen: 100, power: 100, shield: 100, comms: 100 }, crisis: null, q: null, meta: null, servedAt: 0, pauseAcc: 0, busy: false,
        combo: 0, xp: 0, answered: 0, correct: 0, rapid: 0, focus: 1, tabs: 0, hiddenNow: false, lastBreakAt: now(), answersSinceBreak: 0, usedHint: false,
        log: [], level0: OA.app.user.currentLevel, startedAt: now() };
      renderShell();
      U.show('mission');
      M.timer = setInterval(tick, 200);
      newCrisis();
    }).catch(function (e) { U.toast(U.err(e), 'bad'); });
  }

  /* ---------------- shell ---------------- */
  function shipSVG() {
    function mod(id, x, y, w, h, label) { return '<g><rect class="mod" id="mod-' + id + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="10" fill="rgba(80,110,200,.35)" stroke="' + SYS_AR[id][2].replace('var(', '').replace(')', '') + '" stroke-width="2"/><text x="' + (x + w / 2) + '" y="' + (y + h / 2 + 6) + '" text-anchor="middle" font-size="18">' + label + '</text></g>'; }
    return '<svg class="shipview" viewBox="0 0 240 300" aria-hidden="true"><defs><linearGradient id="hull2" x1="0" x2="1"><stop offset="0" stop-color="#5a6a96"/><stop offset=".5" stop-color="#c9d3ea"/><stop offset="1" stop-color="#5a6a96"/></linearGradient></defs>' +
      '<path d="M120 10 L170 80 L178 230 L150 290 L90 290 L62 230 L70 80 Z" fill="url(#hull2)" opacity=".9"/><path d="M62 150 L10 220 L10 250 L66 236 Z M178 150 L230 220 L230 250 L174 236 Z" fill="#7f8db5"/>' +
      '<ellipse cx="120" cy="58" rx="16" ry="22" fill="#163a6e" stroke="#9ff4ff" stroke-width="2"/>' +
      mod('comms', 92, 88, 56, 40, '📡') + mod('power', 80, 136, 80, 46, '⚡') + mod('oxygen', 80, 190, 38, 44, '🫁') + mod('shield', 122, 190, 38, 44, '🛡️') +
      '<path class="flame" d="M96 290 L120 300 L144 290 L132 296 L120 300 L108 296 Z" fill="#3fe0ff" opacity=".8"/></svg>';
  }
  function renderShell() {
    var el = U.$('#mission');
    el.innerHTML =
      '<header class="glass hud"><div class="row"><button class="btn icon" id="m-pause" title="إيقاف مؤقت (Esc)" aria-label="إيقاف مؤقت">⏸</button><div><div class="tiny mut">الوقت المتبقي</div><div class="clock" id="m-clock">--:--</div></div></div>' +
        '<div class="hud-stats"><div class="stat"><b id="m-xp" class="en">0</b><span>XP</span></div><div class="stat combo"><b id="m-combo" class="en">×0</b><span>سلسلة</span></div>' +
        '<div class="stat"><b id="m-acc" class="en">—</b><span>الدقة</span></div><div class="stat focusmeter"><div class="row between" style="width:100%"><span class="tiny mut">🎯 التركيز</span><b class="en small" id="m-focus">100%</b></div><div class="bar" style="width:100%;margin-top:4px"><i id="m-focusbar" style="width:100%"></i></div></div></div>' +
        '<div class="row"><span class="chip" id="m-subj">🌀 المادة: تختارها عند كل عطل</span><button class="btn sm danger" id="m-abort">إنهاء</button></div></header>' +
      '<div class="mission-grid">' +
        '<aside class="side"><section class="glass"><div class="panel-h"><span>🛸 أنظمة المركبة</span><span class="en">SHIP</span></div><div class="panel-b" id="m-res"></div><div class="panel-b" style="padding-top:0">' + shipSVG() + '</div></section></aside>' +
        '<section><div id="m-banner"></div><div class="glass qcard" id="m-q"><div class="empty">جارِ الاتصال بالحاسوب المركزي…</div></div></section>' +
        '<aside class="side stack"><section class="glass copilot"><div class="panel-h"><span>🤖 مساعد القيادة الذكي</span><span class="en">AI CO-PILOT</span></div><div class="panel-b" id="m-ai"><div class="mut small">يحلل أداءك وتركيزك لحظياً…</div></div></section>' +
          '<section class="glass"><div class="panel-h"><span>📜 سجل المهمة</span></div><div class="panel-b log" id="m-log"></div></section></aside>' +
      '</div>';
    U.$('#m-pause').onclick = function () { pause('manual'); };
    U.$('#m-abort').onclick = function () { if (confirm('إنهاء المهمة الآن؟ ستحصل على النقاط التي جمعتها.')) finish(false, 'abort'); };
    renderRes();
  }
  function renderRes() {
    var box = U.$('#m-res'); if (!box) return;
    var active = M.crisis && M.crisis.system;
    box.innerHTML = Object.keys(SYS_AR).map(function (k) {
      var v = Math.max(0, M.res[k]), col = v < 25 ? 'var(--red)' : v < 50 ? 'var(--orange)' : SYS_AR[k][2];
      return '<div class="resource ' + (v < 25 ? 'crit ' : '') + (active === k ? 'active' : '') + '"><div class="row"><span>' + SYS_AR[k][0] + ' ' + SYS_AR[k][1] + '</span><span class="val">' + Math.round(v) + '%</span></div>' +
        '<div class="bar"><i style="width:' + v + '%;background:' + col + '"></i></div></div>';
    }).join('');
    Object.keys(SYS_AR).forEach(function (k) { var m = U.$('#mod-' + k); if (m) m.classList.toggle('alert', active === k); });
  }
  function hud() {
    U.$('#m-xp').textContent = U.fmt(M.xp);
    U.$('#m-combo').textContent = '×' + M.combo;
    U.$('#m-acc').textContent = M.answered ? Math.round(M.correct / M.answered * 100) + '%' : '—';
    U.$('#m-focus').textContent = Math.round(M.focus * 100) + '%';
    var fb = U.$('#m-focusbar'); fb.style.width = (M.focus * 100) + '%'; fb.style.background = M.focus > 0.7 ? 'var(--green)' : M.focus > 0.45 ? 'var(--gold)' : 'var(--red)';
  }
  function log(s) { M.log.unshift(s); var el = U.$('#m-log'); if (el) el.innerHTML = M.log.slice(0, 30).map(function (x) { return '<div>' + x + '</div>'; }).join(''); }

  /* ---------------- clock ---------------- */
  var lastTick = 0;
  function tick() {
    if (!M) return;
    var t = now(), dt = lastTick ? Math.min(1, (t - lastTick) / 1000) : 0; lastTick = t;
    if (M.paused) return;
    var left = Math.max(0, M.endAt - t), mm = Math.floor(left / 60000), ss = Math.floor(left / 1000) % 60;
    var clk = U.$('#m-clock'); if (clk) { clk.textContent = mm + ':' + (ss < 10 ? '0' : '') + ss; clk.classList.toggle('low', left < 30000); }
    Object.keys(M.res).forEach(function (k) { M.res[k] -= R.EFFECT.base * dt; });
    if (M.crisis && M.q && !M.busy) M.res[M.crisis.system] -= R.EFFECT.drain * dt;
    renderRes();
    if (M.q && !M.busy && U.settings.timer && M.qLimit) {
      var used = (t - M.servedAt - M.pauseAcc) / 1000, rem = Math.max(0, M.qLimit - used);
      var arc = U.$('#qt-arc'), tt = U.$('#qt-t');
      if (arc) { arc.style.strokeDashoffset = 151 * (1 - rem / M.qLimit); arc.style.stroke = rem < 8 ? '#ff4d6d' : '#3fe0ff'; }
      if (tt) tt.textContent = Math.ceil(rem);
      if (rem <= 0) choose(-1);
    }
    var dead = Object.keys(M.res).filter(function (k) { return M.res[k] <= 0; })[0];
    if (dead) return finish(false, dead);
    if (left <= 0 && !(M.q && M.busy)) return finish(true);
  }
  function pause(reason) {
    if (!M || M.paused) return;
    M.paused = true; M.pausedAt = now(); M.pauseReason = reason;
    if (reason === 'manual') {
      var o = U.overlay('<div class="panel-b" style="text-align:center;padding:28px"><div style="font-size:3rem">⏸</div><h2>المهمة متوقفة</h2><p class="mut">خذ نفساً، المركبة في وضع الانتظار.</p><button class="btn primary" data-close autofocus>▶ استئناف</button></div>', { onClose: resume });
      M.pauseOverlay = o;
    }
  }
  function resume() {
    if (!M || !M.paused) return;
    var d = now() - M.pausedAt; M.endAt += d; M.pauseAcc += d; M.paused = false; lastTick = now();
  }

  /* ---------------- crises & questions ---------------- */
  function newCrisis() {
    if (!M) return;
    // the weakest system is more likely to fail next, but any system can break
    var ks = Object.keys(M.res).sort(function (a, b) { return M.res[a] - M.res[b]; });
    var system = Math.random() < 0.4 ? ks[0] : ks[Math.floor(Math.random() * 4)];
    var need = Math.random() < 0.35 ? 2 : 1;
    M.crisis = { system: system, subject: null, title: CRISES[system][Math.floor(Math.random() * CRISES[system].length)], need: need, done: 0, good: 0 };
    OA.Sound.alarm();
    U.$('#m-banner').innerHTML = '<div class="crisis-banner"><span class="ic">⚠️</span><div class="grow"><b>' + M.crisis.title + '!</b><div class="small mut">نظام ' + SYS_AR[system][1] + ' معطّل — اختر المادة التي ستُصلحه بها، ثم أجب ' + (need > 1 ? 'عن سؤالين' : 'عن سؤال') + '.</div></div><span class="chip bad">' + SYS_AR[system][0] + '</span></div>';
    log('⚠️ ' + M.crisis.title);
    renderRes();
    showChooser();
  }

  /* The student picks the subject for this crisis, at their own pace (no question is on screen, so nothing drains). */
  function showChooser() {
    M.q = null; M.busy = true;
    var avg = OA.app.subjAvg || {}, HEX = { math: '#ffcf4a', science: '#a66bff', english: '#3dffa0', arabic: '#3fe0ff' };
    var el = U.$('#m-q');
    el.innerHTML = '<div class="qmeta"><span class="chip gold">🛠️ ' + SYS_AR[M.crisis.system][0] + ' إصلاح ' + SYS_AR[M.crisis.system][1] + '</span></div>' +
      '<h2 style="margin:6px 0 4px">اختر المادة التي ستُصلح بها العطل</h2><p class="mut small" style="margin:0 0 14px">خذ وقتك — لن يبدأ أي سؤال حتى تختار. الأسئلة من <b>' + U.esc(C.gradeAr[OA.app.user.gradeLevel] || '') + '</b> فقط.</p>' +
      '<div class="subj-grid">' + Object.keys(C.SUBJECTS).map(function (s) {
        return '<button class="subj-card" data-s="' + s + '" style="--c:' + HEX[s] + '"><span class="ico">' + C.SUBJECTS[s].icon + '</span><span><h3>' + C.SUBJECTS[s].ar + '</h3><span class="sub">' + (avg[s] == null ? 'لم تبدأ بعد' : 'إتقانك ' + Math.round(avg[s] * 100) + '%') + '</span></span>' + U.ring(avg[s], HEX[s]) + '</button>';
      }).join('') + '</div>';
    copilotIdle();
    U.$$('.subj-card', el).forEach(function (b) { b.onclick = function () { OA.Sound.click(); M.crisis.subject = b.dataset.s; nextQ(); }; });
  }
  function copilotIdle() {
    var box = U.$('#m-ai'); if (box) box.innerHTML = '<div class="small mut">اختر مادتك وسأحلل مستواك لأختار لك سؤالاً في «منطقة التعلّم» المناسبة، وأتابع تركيزك أثناء الحل.</div>';
  }

  function nextQ() {
    if (!M) return;
    M.busy = true;
    var ctx = { focus: M.focus, tabSwitches: M.tabs, sinceBreakMin: (now() - M.lastBreakAt) / 60000, subject: M.crisis.subject };
    OA.api.next(M.mission.missionId, ctx).then(function (r) {
      if (!M) return;
      // Focus protocol: ML disengagement risk (or a low focus score) → short guided break first
      var risky = (r.risk >= r.riskThreshold && M.focus < 0.8) || M.focus < 0.5;
      if (risky && M.answersSinceBreak >= 4 && now() - M.lastBreakAt > 90000) return focusBreak(r.risk, function () { showQ(r); });
      showQ(r);
    }).catch(function (e) { U.toast(U.err(e), 'bad'); M.busy = false; });
  }

  function showQ(r) {
    var q = r.question; M.q = q; M.meta = r; M.servedAt = now(); M.pauseAcc = 0; M.hiddenNow = false; M.usedHint = false; M.busy = false;
    M.qLimit = Math.round(Math.max(25, Math.min(90, (r.expectedSec || 15) * 3)));
    var sc = U.$('#m-subj'); if (sc) sc.textContent = C.SUBJECTS[q.subject].icon + ' ' + C.SUBJECTS[q.subject].ar;
    var ltr = q.lang === 'en';
    var el = U.$('#m-q');
    el.innerHTML =
      '<div class="qmeta"><span class="chip">' + C.SUBJECTS[q.subject].icon + ' ' + U.esc(r.conceptAr || q.conceptTag) + '</span><span class="chip ' + ['', 'good', 'gold', 'bad'][q.difficulty] + '">' + ['', 'سهل', 'متوسط', 'صعب'][q.difficulty] + '</span>' +
        '<span class="chip">' + U.esc(C.gradeAr[q.gradeLevel] || '') + '</span><span class="grow"></span>' +
        (U.settings.timer ? '<div class="qtimer"><svg width="52" height="52"><circle cx="26" cy="26" r="24" stroke="rgba(255,255,255,.12)" stroke-width="4" fill="none"/><circle id="qt-arc" cx="26" cy="26" r="24" stroke="#3fe0ff" stroke-width="4" fill="none" stroke-linecap="round" stroke-dasharray="151" stroke-dashoffset="0"/></svg><b id="qt-t">' + M.qLimit + '</b></div>' : '') + '</div>' +
      '<div class="qtext" dir="' + (ltr ? 'ltr' : 'rtl') + '">' + U.qhtml(q.questionText) + '</div>' +
      '<div class="options" dir="' + (ltr ? 'ltr' : 'rtl') + '">' + q.options.map(function (o, i) {
        return '<button class="opt" data-i="' + i + '"><span class="k">' + (ltr ? 'ABCD' : 'أبجد')[i] + '</span><span class="t" dir="auto">' + U.esc(o) + '</span></button>';
      }).join('') + '</div>' +
      '<div class="powerups"><button class="btn sm" id="pu-fifty" ' + (M.res.power < 20 ? 'disabled' : '') + '>✂️ حذف إجابتين <span class="tiny mut">(−15⚡)</span></button><button class="btn sm" id="pu-hint">💡 تلميح القاعدة <span class="tiny mut">(½ XP)</span></button><button class="btn sm" id="pu-ask">🤖 اسأل المدرس</button>' +
        '<span class="grow"></span><span class="tiny dim">مفاتيح: <span class="kbd">1</span>–<span class="kbd">4</span> للإجابة · <span class="kbd">H</span> تلميح</span></div><div id="m-hint"></div>';
    U.$$('.opt', el).forEach(function (b) { b.onclick = function () { choose(+b.dataset.i); }; });
    U.$('#pu-fifty').onclick = fifty;
    U.$('#pu-hint').onclick = hint;
    U.$('#pu-ask').onclick = askTutor;
    copilot(r, null);
  }

  function copilot(r, res) {
    var p = r.predicted, label = p > 0.82 ? 'سهل عليك' : p > 0.6 ? 'في منطقة التعلّم المثالية' : p > 0.4 ? 'تحدٍّ مناسب' : 'تحدٍّ صعب';
    var m0 = res ? res.masteryBefore : r.mastery, m1 = res ? res.mastery : r.mastery;
    var riskTxt = r.risk >= r.riskThreshold ? '<span class="chip bad">⚠️ خطر تشتت</span>' : '<span class="chip good">✓ تركيز جيد</span>';
    U.$('#m-ai').innerHTML =
      '<div class="small mut">توقع النموذج لفرصة إجابتك صحيحاً</div><div class="row between"><span class="big">' + Math.round(p * 100) + '%</span><span class="chip">' + label + '</span></div>' +
      '<div class="small" style="margin-top:10px">إتقانك لمفهوم <b>' + U.esc(r.conceptAr || '') + '</b></div><div class="bar" style="margin-top:6px"><i style="width:' + (m1 * 100).toFixed(0) + '%"></i></div>' +
      '<div class="row between tiny mut" style="margin-top:4px"><span>' + Math.round(m1 * 100) + '%</span>' + (res ? '<span class="' + (m1 >= m0 ? 'chip good' : 'chip bad') + '">' + (m1 >= m0 ? '▲ ' : '▼ ') + Math.abs(Math.round((m1 - m0) * 100)) + '%</span>' : '') + '</div>' +
      '<div class="row between" style="margin-top:12px"><span class="small">حالة التركيز</span>' + riskTxt + '</div>' +
      '<div class="tiny dim" style="margin-top:10px">النموذج: انحدار لوجستي مدرّب على ' + (OA.Model ? 'بيانات محاكاة · AUC ' + OA.Model.correct.auc.toFixed(2) : 'Elo') + '</div>';
  }

  function fifty() {
    if (!M || !M.q || M.busy || M.res.power < 20) return;
    OA.api.fifty(M.mission.missionId, M.q.questionId).then(function (r) {
      M.res.power -= 15; M.usedHint = true; renderRes();
      r.remove.forEach(function (i) { var b = U.$('.opt[data-i="' + i + '"]'); if (b) b.classList.add('gone'); });
      U.$('#pu-fifty').disabled = true; log('✂️ تم حذف إجابتين');
    }).catch(function (e) { U.toast(U.err(e), 'bad'); });
  }
  function hint() {
    if (!M || !M.q || M.busy) return;
    var c = C.ALL[M.q.conceptTag] || {};
    M.usedHint = true; U.$('#pu-hint').disabled = true;
    U.$('#m-hint').innerHTML = '<div class="hintbox">📌 <b>القاعدة:</b> ' + U.bidi(c.lesson || '') + '</div>';
  }

  /* Chat with the AI tutor BEFORE answering: the server knows the question is still open and never reveals the answer. */
  function askTutor() {
    if (!M || !M.q || M.busy || M.paused) return;
    pause('tutor');
    OA.Tutor.chat(M.q, function () { resume(); });
  }

  function choose(i) {
    if (!M || !M.q || M.busy || M.paused) return;
    M.busy = true;
    var q = M.q, ms = now() - M.servedAt - M.pauseAcc;
    U.$$('.opt').forEach(function (b) { b.disabled = true; });
    OA.api.answer(M.mission.missionId, { questionId: q.questionId, selected: i, ms: ms, hidden: M.hiddenNow, usedHint: M.usedHint }).then(function (r) {
      if (!M) return;
      M.answered++; M.answersSinceBreak++; if (r.correct) M.correct++; if (r.rapid) M.rapid++;
      M.combo = r.combo; M.xp += r.xp; M.focus = r.focus;
      var btn = U.$('.opt[data-i="' + r.correctOptionIndex + '"]'); if (btn) btn.classList.add('right');
      if (!r.correct && i >= 0) { var w = U.$('.opt[data-i="' + i + '"]'); if (w) w.classList.add('wrong'); }
      M.crisis.done++;
      if (r.correct) {
        M.crisis.good++; M.res[M.crisis.system] = Math.min(100, M.res[M.crisis.system] + R.EFFECT.correct);
        OA.Sound.good(); flash('good'); if (r.xp) floatXP('+' + r.xp, btn);
        log('✅ ' + U.esc(r.conceptAr) + (r.xp ? ' +' + r.xp + ' XP' : ''));
      } else {
        M.res[M.crisis.system] += r.timeout ? R.EFFECT.timeout : R.EFFECT.wrong;
        OA.Sound.bad(); flash('bad'); document.body.classList.add('shake'); setTimeout(function () { document.body.classList.remove('shake'); }, 400);
        log((r.timeout ? '⏱️ انتهى الوقت — ' : '❌ ') + U.esc(r.conceptAr));
      }
      if (r.rapid) { U.toast('⏳ تمهّل يا قائد — رصد النظام تخميناً سريعاً، والتخمين لا يمنح نقاطاً.', 'gold', 3800); log('⏳ تخمين سريع (' + (r.ms / 1000).toFixed(1) + ' ث)'); }
      (r.badges || []).forEach(function (b) { var B = OA.Service.BADGES[b]; if (B) { U.toast(B.icon + ' وسام جديد: <b>' + B.ar + '</b>', 'gold', 4200); OA.Sound.level(); } });
      if (r.level > M.level0) { M.level0 = r.level; U.toast('🎉 ترقية! وصلت للمستوى ' + r.level, 'gold', 4200); OA.Sound.level(); }
      hud(); renderRes(); copilot(M.meta, r);
      if (!r.correct) { pause('tutor'); OA.Tutor.open(q, i, r, function () { resume(); afterAnswer(); }); }
      else setTimeout(afterAnswer, 1100);
    }).catch(function (e) { U.toast(U.err(e), 'bad'); M.busy = false; U.$$('.opt').forEach(function (b) { b.disabled = false; }); });
  }

  function afterAnswer() {
    if (!M) return;
    M.q = null;
    if (M.endAt - now() <= 0) return finish(true);
    if (M.crisis.done >= M.crisis.need) {
      var ok = M.crisis.good >= Math.ceil(M.crisis.need / 2);
      U.$('#m-banner').innerHTML = '<div class="crisis-banner calm"><span class="ic">' + (ok ? '✅' : '🛠️') + '</span><div class="grow"><b>' + (ok ? 'تم إصلاح العطل!' : 'إصلاح جزئي — النظام ما زال ضعيفاً') + '</b><div class="small mut">' + (ok ? 'أحسنت يا قائد، الأنظمة مستقرة مؤقتاً…' : 'استعد للعطل القادم…') + '</div></div></div>';
      U.$('#m-q').innerHTML = '<div class="empty" style="padding:80px 20px"><div style="font-size:3rem">' + (ok ? '🛰️' : '🔧') + '</div>المسح جارٍ بحثاً عن أعطال جديدة…</div>';
      M.crisis = null; renderRes();
      setTimeout(function () { if (M && !M.paused) newCrisis(); else if (M) waitResume(newCrisis); }, 2200);
    } else nextQ();
  }
  function waitResume(fn) { var iv = setInterval(function () { if (!M) return clearInterval(iv); if (!M.paused) { clearInterval(iv); fn(); } }, 300); }

  function flash(kind) { var f = document.createElement('div'); f.className = 'flash ' + kind; document.body.appendChild(f); setTimeout(function () { f.remove(); }, 520); }
  function floatXP(txt, anchor) {
    var r = anchor ? anchor.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0 };
    var f = document.createElement('div'); f.className = 'floatxp'; f.textContent = txt; f.style.left = (r.left + r.width / 2 - 30) + 'px'; f.style.top = (r.top - 10) + 'px';
    document.body.appendChild(f); setTimeout(function () { f.remove(); }, 1250);
  }

  /* ---------------- focus protocol ---------------- */
  function focusBreak(risk, done) {
    pause('focus'); log('🧘 بروتوكول التركيز');
    var left = 20;
    var o = U.overlay('<div class="panel-b" style="text-align:center;padding:26px"><div class="en small" style="color:var(--cyan)">FOCUS PROTOCOL</div><h2>استراحة تركيز قصيرة 🧘</h2>' +
      '<p class="mut">لاحظ مساعد القيادة علامات تشتت (خطر ' + Math.round(risk * 100) + '%). تنفّس مع الدائرة: شهيق حين تكبر… وزفير حين تصغر.</p>' +
      '<div class="breath" id="br">شهيق</div><p class="small mut">تعود المهمة خلال <b id="br-t" class="en">20</b> ثانية</p><button class="btn sm" id="br-skip" disabled>متابعة الآن</button></div>', { dismissable: false });
    var iv = setInterval(function () {
      left--; var t = U.$('#br-t'); if (t) t.textContent = left;
      var b = U.$('#br'); if (b) b.textContent = (Math.floor((20 - left) / 4) % 2) ? 'زفير' : 'شهيق';
      if (left <= 15) { var s = U.$('#br-skip'); if (s) s.disabled = false; }
      if (left <= 0) end();
    }, 1000);
    function end() { clearInterval(iv); o.close(); M.lastBreakAt = now(); M.answersSinceBreak = 0; M.focus = Math.min(1, M.focus + 0.25); hud(); resume(); done(); }
    U.$('#br-skip').onclick = end;
  }

  document.addEventListener('visibilitychange', function () {
    if (!M) return;
    if (document.hidden) {
      M.tabs++; if (M.q) M.hiddenNow = true;
      if (!M.paused) pause('hidden');
      log('👀 غادرت المركبة (تبديل تطبيق)');
    } else if (M.paused && M.pauseReason === 'hidden') {
      U.overlay('<div class="panel-b" style="text-align:center;padding:26px"><div style="font-size:3rem">👀</div><h2>مرحباً بعودتك يا قائد</h2><p class="mut">توقفت المركبة أثناء غيابك. التنقل بين التطبيقات يخفض مؤشر التركيز —<br>أنهِ المهمة القصيرة ثم استرح كما تشاء.</p><button class="btn primary" data-close autofocus>▶ العودة للمهمة</button></div>', { onClose: resume });
    }
  });
  document.addEventListener('keydown', function (e) {
    if (!M || U.$('.overlay') || U.$('#mission').classList.contains('hidden')) return;
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    var k = e.key.toLowerCase(), map = { '1': 0, '2': 1, '3': 2, '4': 3, 'a': 0, 'b': 1, 'c': 2, 'd': 3 };
    if (map[k] != null) { var b = U.$('.opt[data-i="' + map[k] + '"]'); if (b && !b.disabled && !b.classList.contains('gone')) choose(map[k]); }
    else if (k === 'h') hint();
    else if (k === 't') askTutor();
    else if (k === 'escape') pause('manual');
  });

  /* ---------------- finish ---------------- */
  function finish(survived, cause) {
    if (!M || M.finishing) return;
    M.finishing = true; clearInterval(M.timer);
    var snap = M, mid = M.mission.missionId;
    OA.api.end(mid, survived).then(function (r) {
      OA.app.user = r.user; M = null;
      OA.Panels.debrief(r, snap, cause);
    }).catch(function (e) { M = null; U.toast(U.err(e), 'bad'); OA.Hub.show(); });
  }

  OA.Mission = { id: function () { return M ? M.mission.missionId : null; }, start: start, active: function () { return !!M; }, SYS_AR: SYS_AR };
})(window.OA = window.OA || {});
