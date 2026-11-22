/* ==========================================================================
   Mission — the core loop. The SUBJECT is chosen once (on Home). The mission
   lasts either a fixed TIME (3/5/10 min) or a fixed NUMBER OF QUESTIONS.
   Ship systems break; every crisis is repaired with questions of that subject:
     correct → system +18, XP × combo      wrong → system −12 + AI tutor
   Focus: tab-away auto-pause, rapid-guess detection, ML-triggered breathing break.
   ========================================================================== */
(function (OA) {
  var U = OA.U, R = OA.Rules, C = OA.Concepts, t = function (k, v) { return OA.t(k, v); };
  var SYS = { oxygen: ['🫁', '#2E90FA'], power: ['⚡', '#F79009'], shield: ['🛡️', '#7A5AF8'], comms: ['📡', '#12B76A'] };
  var M = null, lastTick = 0;
  function now() { return Date.now(); }

  function start(subject, opts) {
    OA.Sound.click(); opts = opts || { mode: 'time', durationSec: 300 };
    OA.api.startMission(subject, opts).then(function (mission) {
      M = { mission: mission, subject: subject, opts: opts, count: mission.mode === 'count', target: mission.target, durationSec: mission.durationSec,
        endAt: now() + mission.durationSec * 1000, paused: false, res: { oxygen: 100, power: 100, shield: 100, comms: 100 }, crisis: null, q: null, meta: null,
        servedAt: 0, pauseAcc: 0, busy: false, combo: 0, xp: 0, answered: 0, correct: 0, rapid: 0, focus: 1, tabs: 0, hiddenNow: false,
        lastBreakAt: now(), answersSinceBreak: 0, usedHint: false, log: [], level0: OA.app.user.currentLevel };
      shell(); U.show('mission');
      M.timer = setInterval(tick, 200);
      newCrisis();
    }).catch(function (e) { U.toast(U.err(e), 'bad'); });
  }

  function shipSVG() {
    function mod(id, x, y, w, h) { return '<rect class="mod" id="mod-' + id + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="10" fill="rgba(255,255,255,.14)" stroke="' + SYS[id][1] + '" stroke-width="2"/><text x="' + (x + w / 2) + '" y="' + (y + h / 2 + 6) + '" text-anchor="middle" font-size="17">' + SYS[id][0] + '</text>'; }
    return '<svg class="shipview" viewBox="0 0 240 300" aria-hidden="true"><defs><linearGradient id="hl" x1="0" x2="1"><stop offset="0" stop-color="#6F7BB0"/><stop offset=".5" stop-color="#E6E9F7"/><stop offset="1" stop-color="#6F7BB0"/></linearGradient></defs>' +
      '<path d="M120 10 L170 80 L178 230 L150 290 L90 290 L62 230 L70 80 Z" fill="url(#hl)" opacity=".95"/><path d="M62 150 L10 220 L10 250 L66 236 Z M178 150 L230 220 L230 250 L174 236 Z" fill="#8C95C4"/>' +
      '<ellipse cx="120" cy="58" rx="16" ry="22" fill="#2D1C8F" stroke="#C9BCFF" stroke-width="2"/>' + mod('comms', 92, 88, 56, 40) + mod('power', 80, 136, 80, 46) + mod('oxygen', 80, 190, 38, 44) + mod('shield', 122, 190, 38, 44) + '</svg>';
  }

  function shell() {
    var subj = M.subject;
    U.$('#mission').innerHTML =
      '<header class="m-top">' +
        '<button class="btn sm" id="m-exit">' + U.icon('x', 16) + '<span class="hide-sm">' + t('exit') + '</span></button>' +
        '<span class="chip" style="background:color-mix(in srgb,' + U.SUBJ_COLOR[subj] + ' 14%,#fff)">' + (C.SUBJECTS[subj] || {}).icon + ' ' + U.esc(U.subjectName(subj)) + '</span>' +
        '<div class="m-prog">' + U.icon(M.count ? 'list' : 'clock', 18) + '<div class="bar"><i id="m-pbar" style="width:0%"></i></div><b id="m-ptxt" class="num">--</b></div>' +
        '<span class="stat-pill">' + U.icon('star', 16) + '<span id="m-xp">0</span></span>' +
        '<span class="stat-pill combo" title="' + t('combo') + '">' + U.icon('flame', 16) + '×<span id="m-combo">0</span></span>' +
        '<span class="focusbox hide-sm" title="' + t('focus') + '">' + U.icon('target', 16) + '<div class="bar"><i id="m-fbar" style="width:100%"></i></div></span>' +
        '<button class="btn sm icon-btn" id="m-pause" title="' + t('pause') + '" aria-label="' + t('pause') + '">' + U.icon('pause', 16) + '</button>' +
      '</header>' +
      '<div class="m-grid">' +
        '<div class="shipcol"><section class="card shipcard"><div class="card-h"><h3>' + U.icon('rocket') + t('ship') + '</h3></div><div class="card-b"><div id="m-res"></div>' + shipSVG() + '</div></section></div>' +
        '<div class="qcol"><div id="m-banner"></div><section class="card qcard" id="m-q"><div class="empty">…</div></section></div>' +
        '<div class="stack-lg"><section class="card copilot"><div class="card-h"><h3>' + U.icon('sparkle') + t('copilot') + '</h3></div><div class="card-b" id="m-ai"></div></section>' +
          '<section class="card"><div class="card-h"><h3>' + U.icon('list') + t('log') + '</h3></div><div class="card-b log" id="m-log"></div></section></div>' +
      '</div>';
    U.$('#m-pause').onclick = function () { pause('manual'); };
    U.$('#m-exit').onclick = function () { if (confirm(t('confirmExit'))) finish(false, 'abort'); };
    renderRes(); hud();
  }

  function renderRes() {
    var box = U.$('#m-res'); if (!box) return;
    var active = M.crisis && M.crisis.system;
    box.innerHTML = Object.keys(SYS).map(function (k) {
      var v = Math.max(0, M.res[k]), col = v < 25 ? '#F04438' : v < 50 ? '#F79009' : SYS[k][1];
      return '<div class="res' + (v < 25 ? ' crit' : '') + (active === k ? ' active' : '') + '"><div class="row"><span>' + SYS[k][0] + ' ' + t(k) + '</span><span class="num">' + Math.round(v) + '%</span></div><div class="bar"><i style="width:' + v + '%;background:' + col + '"></i></div></div>';
    }).join('');
    Object.keys(SYS).forEach(function (k) { var m = U.$('#mod-' + k); if (m) m.classList.toggle('alert', active === k); });
  }
  function hud() {
    if (!U.$('#m-xp')) return;
    U.$('#m-xp').textContent = U.fmt(M.xp); U.$('#m-combo').textContent = M.combo;
    var fb = U.$('#m-fbar'); fb.style.width = (M.focus * 100) + '%'; fb.style.background = M.focus > 0.7 ? 'var(--green)' : M.focus > 0.45 ? 'var(--amber)' : 'var(--red)';
    if (M.count) { U.$('#m-pbar').style.width = (M.answered / M.target * 100) + '%'; U.$('#m-ptxt').textContent = M.answered + '/' + M.target; }
  }
  function log(s) { M.log.unshift(s); var el = U.$('#m-log'); if (el) el.innerHTML = M.log.slice(0, 30).map(function (x) { return '<div>' + x + '</div>'; }).join(''); }

  function tick() {
    if (!M) return;
    var tm = now(), dt = lastTick ? Math.min(1, (tm - lastTick) / 1000) : 0; lastTick = tm;
    if (M.paused) return;
    if (!M.count) {
      var left = Math.max(0, M.endAt - tm), mm = Math.floor(left / 60000), ss = Math.floor(left / 1000) % 60, txt = U.$('#m-ptxt');
      if (txt) { txt.textContent = mm + ':' + (ss < 10 ? '0' : '') + ss; txt.classList.toggle('low', left < 30000); U.$('#m-pbar').style.width = (100 - left / (M.durationSec * 1000) * 100) + '%'; }
      if (left <= 0 && !(M.q && M.busy)) return finish(true);
    }
    Object.keys(M.res).forEach(function (k) { M.res[k] -= R.EFFECT.base * dt; });
    if (M.crisis && M.q && !M.busy) M.res[M.crisis.system] -= R.EFFECT.drain * dt;
    renderRes();
    if (M.q && !M.busy && U.settings.timer && M.qLimit) {
      var rem = Math.max(0, M.qLimit - (tm - M.servedAt - M.pauseAcc) / 1000), arc = U.$('#qt-arc'), tt = U.$('#qt-t');
      if (arc) { arc.style.strokeDashoffset = 132 * (1 - rem / M.qLimit); arc.style.stroke = rem < 8 ? '#F04438' : '#6A4CFF'; }
      if (tt) tt.textContent = Math.ceil(rem);
      if (rem <= 0) choose(-1);
    }
    var dead = Object.keys(M.res).filter(function (k) { return M.res[k] <= 0; })[0];
    if (dead) finish(false, dead);
  }
  function pause(reason) {
    if (!M || M.paused) return;
    M.paused = true; M.pausedAt = now(); M.pauseReason = reason;
    if (reason === 'manual') OA.Tutor.notice('⏸️', t('paused'), t('pausedSub'), t('resume'), resume);
  }
  function resume() { if (!M || !M.paused) return; var d = now() - M.pausedAt; M.endAt += d; M.pauseAcc += d; M.paused = false; lastTick = now(); }

  function newCrisis() {
    if (!M) return;
    var ks = Object.keys(M.res).sort(function (a, b) { return M.res[a] - M.res[b]; });
    var system = Math.random() < 0.4 ? ks[0] : ks[Math.floor(Math.random() * 4)];
    var need = Math.random() < 0.35 ? 2 : 1;
    if (M.count) need = Math.min(need, M.target - M.answered);
    var list = OA.I18N.crises(system), title = list[Math.floor(Math.random() * list.length)];
    M.crisis = { system: system, title: title, need: need, done: 0, good: 0 };
    OA.Sound.alarm();
    U.$('#m-banner').innerHTML = '<div class="crisis"><span class="ci">⚠️</span><div class="grow"><b>' + t('crisisTitle', { c: U.esc(title) }) + '</b><div class="small">' + t('crisisSub', { s: t(system), n: need > 1 ? t('twoQ') : t('oneQ') }) + '</div></div><span class="ci">' + SYS[system][0] + '</span></div>';
    log('⚠️ ' + U.esc(title)); renderRes(); nextQ();
  }

  function nextQ() {
    if (!M) return;
    M.busy = true;
    OA.api.next(M.mission.missionId, { focus: M.focus, tabSwitches: M.tabs, sinceBreakMin: (now() - M.lastBreakAt) / 60000, lang: OA.I18N.get() }).then(function (r) {
      if (!M) return;
      var risky = (r.risk >= r.riskThreshold && M.focus < 0.8) || M.focus < 0.5;
      if (risky && M.answersSinceBreak >= 4 && now() - M.lastBreakAt > 90000) {
        pause('focus'); log('🧘 Focus');
        return OA.Tutor.focusBreak(r.risk, function () { M.lastBreakAt = now(); M.answersSinceBreak = 0; M.focus = Math.min(1, M.focus + 0.25); hud(); resume(); showQ(r); });
      }
      showQ(r);
    }).catch(function (e) { if (e && e.code === 'mission_complete') return finish(true); U.toast(U.err(e), 'bad'); M.busy = false; });
  }

  function showQ(r) {
    var q = r.question; M.q = q; M.meta = r; M.servedAt = now(); M.pauseAcc = 0; M.hiddenNow = false; M.usedHint = false; M.busy = false;
    M.qLimit = Math.round(Math.max(25, Math.min(90, (r.expectedSec || 15) * 3)));
    var ltr = q.lang === 'en', diff = ['', 'easy', 'medium', 'hard'][q.difficulty], dc = ['', 'green', 'amber', 'red'][q.difficulty];
    U.$('#m-q').innerHTML =
      '<div class="qmeta"><span class="chip brand">' + U.esc(U.conceptName(q.conceptTag)) + '</span><span class="chip ' + dc + '">' + t(diff) + '</span>' +
        (M.count ? '<span class="chip">' + t('questionOf', { a: M.answered + 1, b: M.target }) + '</span>' : '') +
        (U.settings.timer ? '<span class="qtimer"><svg width="46" height="46"><circle cx="23" cy="23" r="21" stroke="var(--line)" stroke-width="4" fill="none"/><circle id="qt-arc" cx="23" cy="23" r="21" stroke="#6A4CFF" stroke-width="4" fill="none" stroke-linecap="round" stroke-dasharray="132" stroke-dashoffset="0"/></svg><b id="qt-t">' + M.qLimit + '</b></span>' : '') + '</div>' +
      '<div class="qtext" dir="' + (ltr ? 'ltr' : 'rtl') + '">' + U.qhtml(q.questionText) + '</div>' +
      '<div class="options" dir="' + (ltr ? 'ltr' : 'rtl') + '">' + q.options.map(function (o, i) { return '<button class="opt" data-i="' + i + '"><span class="k">' + (ltr ? 'ABCD' : 'أبجد')[i] + '</span><span class="t" dir="auto">' + U.esc(o) + '</span></button>'; }).join('') + '</div>' +
      '<div class="tools"><button class="btn sm" id="pu-fifty"' + (M.res.power < 20 ? ' disabled' : '') + '>' + U.icon('scissors', 16) + t('fifty') + ' <span class="tiny mut">' + t('costPower') + '</span></button>' +
        '<button class="btn sm" id="pu-hint">' + U.icon('bulb', 16) + t('hint') + ' <span class="tiny mut">' + t('halfXp') + '</span></button>' +
        '<button class="btn sm soft" id="pu-ask">' + U.icon('chat', 16) + t('askTutor') + '</button><span class="grow"></span><span class="tiny mut hide-sm">' + t('keys') + '</span></div><div id="m-hint"></div>';
    U.$$('.opt').forEach(function (b) { b.onclick = function () { choose(+b.dataset.i); }; });
    U.$('#pu-fifty').onclick = fifty; U.$('#pu-hint').onclick = hint; U.$('#pu-ask').onclick = askTutor;
    copilot(r, null); hud();
  }

  function copilot(r, res) {
    var p = r.predicted, zone = p > 0.82 ? t('zoneEasy') : p > 0.6 ? t('zoneFlow') : p > 0.4 ? t('zoneOk') : t('zoneHard');
    var m0 = res ? res.masteryBefore : r.mastery, m1 = res ? res.mastery : r.mastery, risky = r.risk >= r.riskThreshold;
    U.$('#m-ai').innerHTML = '<div class="small mut">' + t('predicted') + '</div><div class="row between"><span class="big">' + Math.round(p * 100) + '%</span><span class="chip brand">' + zone + '</span></div>' +
      '<div class="small" style="margin-top:12px">' + t('conceptMastery', { c: U.esc(U.conceptName(r.question.conceptTag)) }) + '</div><div class="bar" style="margin-top:6px"><i style="width:' + Math.round(m1 * 100) + '%"></i></div>' +
      '<div class="row between tiny mut" style="margin-top:4px"><span class="num">' + Math.round(m1 * 100) + '%</span>' + (res ? '<span class="chip ' + (m1 >= m0 ? 'green' : 'red') + '">' + (m1 >= m0 ? '▲ ' : '▼ ') + Math.abs(Math.round((m1 - m0) * 100)) + '%</span>' : '') + '</div>' +
      '<div class="row between" style="margin-top:12px"><span class="small">' + t('focusState') + '</span><span class="chip ' + (risky ? 'red' : 'green') + '">' + (risky ? t('focusRisk') : t('focusGood')) + '</span></div>' +
      '<p class="tiny mut" style="margin-top:10px">' + (OA.Model ? t('modelNote', { a: OA.Model.correct.auc.toFixed(2) }) : 'Elo') + '</p>';
  }

  function fifty() {
    if (!M || !M.q || M.busy || M.res.power < 20) return;
    OA.api.fifty(M.mission.missionId, M.q.questionId).then(function (r) {
      M.res.power -= 15; M.usedHint = true; renderRes();
      r.remove.forEach(function (i) { var b = U.$('.opt[data-i="' + i + '"]'); if (b) b.classList.add('gone'); });
      U.$('#pu-fifty').disabled = true; log('✂️ ' + t('fifty'));
    }).catch(function (e) { U.toast(U.err(e), 'bad'); });
  }
  function hint() {
    if (!M || !M.q || M.busy) return;
    M.usedHint = true; U.$('#pu-hint').disabled = true;
    U.$('#m-hint').innerHTML = '<div class="hintbox">📌 <b>' + t('rule') + ':</b> ' + U.bidi(C.lesson(M.q.conceptTag, OA.I18N.get())) + '</div>';
  }
  function askTutor() { if (!M || !M.q || M.busy || M.paused) return; pause('tutor'); OA.Tutor.chat(M.q, function () { resume(); }); }

  function choose(i) {
    if (!M || !M.q || M.busy || M.paused) return;
    M.busy = true;
    var q = M.q, ms = now() - M.servedAt - M.pauseAcc;
    U.$$('.opt').forEach(function (b) { b.disabled = true; });
    OA.api.answer(M.mission.missionId, { questionId: q.questionId, selected: i, ms: ms, hidden: M.hiddenNow, usedHint: M.usedHint }).then(function (r) {
      if (!M) return;
      M.answered++; M.answersSinceBreak++; if (r.correct) M.correct++; if (r.rapid) M.rapid++;
      M.combo = r.combo; M.xp += r.xp; M.focus = r.focus; M.crisis.done++;
      var btn = U.$('.opt[data-i="' + r.correctOptionIndex + '"]'); if (btn) btn.classList.add('right');
      if (!r.correct && i >= 0) { var w = U.$('.opt[data-i="' + i + '"]'); if (w) w.classList.add('wrong'); }
      var cname = U.esc(U.conceptName(q.conceptTag));
      if (r.correct) {
        M.crisis.good++; M.res[M.crisis.system] = Math.min(100, M.res[M.crisis.system] + R.EFFECT.correct);
        OA.Sound.good(); if (r.xp) floatXP('+' + r.xp, btn); log('✅ ' + cname + (r.xp ? ' +' + r.xp + ' XP' : ''));
      } else {
        M.res[M.crisis.system] += r.timeout ? R.EFFECT.timeout : R.EFFECT.wrong;
        OA.Sound.bad(); log((r.timeout ? '⏱️ ' : '❌ ') + cname);
      }
      if (r.rapid) { U.toast('⏳ ' + t('rapid'), 'gold', 3800); }
      var lang = OA.I18N.get();
      (r.badges || []).forEach(function (b) { var B = OA.Service.BADGES[b]; if (B) { U.toast(B.icon + ' ' + t('newBadge', { b: lang === 'en' ? B.en : B.ar }), 'gold', 4200); OA.Sound.level(); } });
      if (r.level > M.level0) { M.level0 = r.level; U.toast('🎉 ' + t('levelUp', { n: r.level }), 'good', 4200); OA.Sound.level(); }
      hud(); renderRes(); copilot(M.meta, r);
      if (!r.correct) { pause('tutor'); OA.Tutor.open(q, i, r, function () { resume(); afterAnswer(); }); }
      else setTimeout(afterAnswer, 1000);
    }).catch(function (e) {
      if (e && e.code === 'mission_complete') return finish(true);
      U.toast(U.err(e), 'bad'); M.busy = false; U.$$('.opt').forEach(function (b) { b.disabled = false; });
    });
  }

  function afterAnswer() {
    if (!M) return;
    M.q = null;
    if (M.count && M.answered >= M.target) return finish(true);
    if (!M.count && M.endAt - now() <= 0) return finish(true);
    if (M.crisis.done >= M.crisis.need) {
      var ok = M.crisis.good >= Math.ceil(M.crisis.need / 2);
      U.$('#m-banner').innerHTML = '<div class="crisis ok"><span class="ci">' + (ok ? '✅' : '🛠️') + '</span><div class="grow"><b>' + (ok ? t('fixed') : t('partial')) + '</b><div class="small">' + (ok ? t('fixedSub') : t('partialSub')) + '</div></div></div>';
      U.$('#m-q').innerHTML = '<div class="empty" style="padding:90px 20px"><div style="font-size:2.6rem">🛰️</div>' + (ok ? t('fixedSub') : t('partialSub')) + '</div>';
      M.crisis = null; renderRes();
      setTimeout(function () { if (!M) return; if (!M.paused) newCrisis(); else waitResume(newCrisis); }, 1800);
    } else nextQ();
  }
  function waitResume(fn) { var iv = setInterval(function () { if (!M) return clearInterval(iv); if (!M.paused) { clearInterval(iv); fn(); } }, 300); }
  function floatXP(txt, anchor) {
    var r = anchor ? anchor.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0 };
    var f = document.createElement('div'); f.className = 'floatxp'; f.textContent = txt; f.style.left = (r.left + r.width / 2 - 24) + 'px'; f.style.top = (r.top - 8) + 'px';
    document.body.appendChild(f); setTimeout(function () { f.remove(); }, 1150);
  }

  document.addEventListener('visibilitychange', function () {
    if (!M) return;
    if (document.hidden) { M.tabs++; if (M.q) M.hiddenNow = true; if (!M.paused) pause('hidden'); log('👀'); }
    else if (M.paused && M.pauseReason === 'hidden') OA.Tutor.notice('👀', t('welcomeBackShip'), t('awaySub'), t('backToMission'), resume);
  });
  document.addEventListener('keydown', function (e) {
    if (!M || U.$('.modal-wrap') || U.$('#mission').classList.contains('hidden')) return;
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    var k = e.key.toLowerCase(), map = { '1': 0, '2': 1, '3': 2, '4': 3, 'a': 0, 'b': 1, 'c': 2, 'd': 3 };
    if (map[k] != null) { var b = U.$('.opt[data-i="' + map[k] + '"]'); if (b && !b.disabled && !b.classList.contains('gone')) choose(map[k]); }
    else if (k === 'h') hint(); else if (k === 't') askTutor(); else if (k === 'escape') pause('manual');
  });

  function finish(survived, cause) {
    if (!M || M.finishing) return;
    M.finishing = true; clearInterval(M.timer);
    var snap = { subject: M.subject, opts: M.opts }, mid = M.mission.missionId;
    OA.api.end(mid, survived).then(function (r) { OA.app.user = r.user; M = null; OA.Shell.go('home'); OA.Tutor.debrief(r, snap, cause); })
      .catch(function (e) { M = null; U.toast(U.err(e), 'bad'); OA.Shell.go('home'); });
  }

  OA.Mission = { id: function () { return M ? M.mission.missionId : null; }, start: start, active: function () { return !!M; } };
})(window.OA = window.OA || {});
