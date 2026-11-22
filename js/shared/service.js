/* Game service — the authoritative rules for a mission, used by the Node
   server AND by the offline LocalApi in the browser (one implementation).
   Storage is the caller's job; these functions only mutate the objects. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./adaptive.js'), require('./rules.js'), require('./concepts.js'));
  else (root.OA = root.OA || {}).Service = factory(root.OA.Adaptive, root.OA.Rules, root.OA.Concepts);
})(typeof self !== 'undefined' ? self : this, function (A, R, C) {
  var BADGES = {
    first_mission: { ar: 'أول مهمة', icon: '🚀', desc: 'أنهيت أول مهمة' },
    combo_5: { ar: 'سلسلة ×5', icon: '🔥', desc: '5 إجابات صحيحة متتالية' },
    combo_10: { ar: 'سلسلة ×10', icon: '☄️', desc: '10 إجابات صحيحة متتالية' },
    focus_master: { ar: 'سيد التركيز', icon: '🎯', desc: 'مهمة كاملة (10+ أسئلة) بلا تخمين سريع' },
    concept_master: { ar: 'متقن مفهوم', icon: '🧠', desc: 'وصلت إتقان 95% في مفهوم' },
    survivor: { ar: 'الناجي', icon: '🛡️', desc: 'أعدت المركبة سالمة 5 مرات' },
    xp_1000: { ar: 'ألف نقطة', icon: '💎', desc: 'جمعت 1000 XP' },
    streak_3: { ar: '3 أيام متتالية', icon: '📅', desc: 'لعبت 3 أيام متتالية' },
    polyglot: { ar: 'متعدد المهارات', icon: '🌐', desc: 'أنهيت مهام في 4 مواد' }
  };

  function dayKey(ms) { var d = new Date(ms); return d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + d.getUTCDate(); }
  function weekKey(ms) {
    var d = new Date(ms); var t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    var day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
    var y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return t.getUTCFullYear() + '-W' + Math.ceil(((t - y0) / 86400000 + 1) / 7);
  }

  function newUser(fields) {
    var u = {
      uid: fields.uid, username: fields.username, displayName: fields.displayName || fields.username, role: fields.role || 'student',
      gradeLevel: fields.gradeLevel || 9, avatar: fields.avatar || '🧑‍🚀', classCode: fields.classCode || '', totalXP: 0, currentLevel: 1,
      weeklyXP: 0, weekKey: '', streakDays: 0, lastActiveDay: '', badges: [], stats: { missions: 0, survived: 0, subjects: {}, answered: 0, correct: 0, rapid: 0, focusSum: 0, focusN: 0 },
      resources: { oxygen: 100, power: 100, shield: 100, comms: 100 }, learner: A.newLearner(fields.gradeLevel || 9), createdAt: fields.now || Date.now()
    };
    return u;
  }

  function touchActivity(u, now) {
    var dk = dayKey(now), wk = weekKey(now);
    if (u.weekKey !== wk) { u.weekKey = wk; u.weeklyXP = 0; }
    if (u.lastActiveDay !== dk) {
      var y = dayKey(now - 86400000);
      u.streakDays = u.lastActiveDay === y ? (u.streakDays || 0) + 1 : 1;
      u.lastActiveDay = dk;
    }
  }
  function addXP(u, xp, now) { touchActivity(u, now); u.totalXP += xp; u.weeklyXP += xp; u.currentLevel = R.level(u.totalXP); }
  function award(u, id, list) { if (u.badges.indexOf(id) < 0) { u.badges.push(id); list.push(id); } }

  function startMission(u, opts, now) {
    u.learner.grade = u.gradeLevel;
    return {
      missionId: opts.missionId, uid: u.uid, subject: opts.subject || 'mixed', durationSec: Math.max(120, Math.min(1800, opts.durationSec || 300)),
      startedAt: now, endedAt: null, answered: 0, correct: 0, rapid: 0, xp: 0, combo: 0, bestCombo: 0, tabSwitches: 0, focus: 1,
      served: null, servedIds: {}, survived: null, concepts: {}, subs: {}
    };
  }

  /* Picks the next question. pool: candidate questions (full objects).
     ctx comes from the client (focus / tab switches) — used only for selection. */
  function nextQuestion(u, m, pool, ctx, model, now, rng) {
    var sessionMin = (now - m.startedAt) / 60000;
    var num = function (v, d) { v = Number(v); return (v === v && isFinite(v) && v !== null) ? v : d; };
    ctx = ctx || {};
    var c = { focus: Math.max(0, Math.min(1, num(ctx.focus, m.focus))), sessionMin: sessionMin, tabSwitches: num(ctx.tabSwitches, m.tabSwitches), sinceBreakMin: num(ctx.sinceBreakMin, sessionMin) };
    var q = A.select(u.learner, pool, { exclude: m.servedIds, nowMin: now / 60000, rng: rng || Math.random, model: model, ctx: c, policy: 'full' });
    if (!q) return null;
    m.served = { id: q.questionId || q.id, at: now };
    m.servedIds[m.served.id] = true;
    var qa = adaptQ(q);
    return { q: q, predicted: A.predict(u.learner, qa, c, model), risk: A.disengageRisk(u.learner, qa, c, model), mastery: A.mastery(u.learner, qa.conceptTag), elo: u.learner.elo[qa.subject] || 0 };
  }

  /* the adaptive module expects id/grade/subject fields */
  function adaptQ(q) {
    if (q.id && q.grade) return q;
    return { id: q.questionId, grade: q.gradeLevel, subject: q.subject, difficulty: q.difficulty, conceptTag: q.conceptTag, questionText: q.questionText, options: q.options, rating: q.rating, ratingN: q.ratingN };
  }

  /* input: { selected (-1 = timeout), ms, hidden, idleMs, usedHint }
     Returns the result + the new question rating to persist. */
  function answer(u, m, q, input, now) {
    if (!m.served || m.served.id !== q.questionId) return { error: 'not_served' };
    var serverMs = now - m.served.at, hinted = !!m.served.hint;
    var ms = Math.max(0, Math.min(input.ms || serverMs, serverMs + 1500)); // client time, but never longer than the server saw
    m.served = null;
    var timeout = input.selected === -1;
    var correct = !timeout && input.selected === q.correctOptionIndex;
    var rapid = !timeout && R.isRapid(q, ms);
    var qa = adaptQ(q);
    var rec = A.record(u.learner, qa, { correct: correct, rapid: rapid, nowMin: now / 60000 });
    m.answered++; if (correct) m.correct++; if (rapid) m.rapid++;
    if (input.hidden) m.tabSwitches++;
    m.focus = R.updateFocus(m.focus, { rapid: rapid, hidden: !!input.hidden, timeout: timeout, idleMs: input.idleMs || 0 });
    m.combo = correct && !rapid ? m.combo + 1 : 0;
    if (m.combo > m.bestCombo) m.bestCombo = m.combo;
    var xp = R.xpFor(q, correct, rapid, m.combo - 1);
    if ((input.usedHint || hinted) && xp) xp = Math.round(xp / 2);
    m.xp += xp; addXP(u, xp, now);
    m.concepts[q.conceptTag] = rec.mastery; m.subs = m.subs || {}; m.subs[q.subject] = (m.subs[q.subject] || 0) + 1;
    var st = u.stats; st.answered++; if (correct) st.correct++; if (rapid) st.rapid++;
    var newBadges = [];
    if (m.combo >= 5) award(u, 'combo_5', newBadges);
    if (m.combo >= 10) award(u, 'combo_10', newBadges);
    if (rec.mastery >= 0.95) award(u, 'concept_master', newBadges);
    if (u.totalXP >= 1000) award(u, 'xp_1000', newBadges);
    return {
      correct: correct, timeout: timeout, rapid: rapid, ms: Math.round(ms), correctOptionIndex: q.correctOptionIndex, explanation: q.explanation,
      note: (!correct && !timeout && q.optionNotes) ? q.optionNotes[input.selected] : null, xp: xp, totalXP: u.totalXP, level: u.currentLevel,
      combo: m.combo, focus: m.focus, mastery: rec.mastery, masteryBefore: rec.masteryBefore, elo: rec.elo, pBefore: rec.pBefore,
      newQRating: rec.newQRating, badges: newBadges, conceptAr: (C.ALL[q.conceptTag] || {}).ar || q.conceptTag
    };
  }

  /* 50/50 power-up: the server (not the client) knows the answer, so it picks
     two wrong options to remove and marks the question as hinted (½ XP). */
  function fifty(m, q, rnd) {
    if (!m.served || m.served.id !== q.questionId) return { error: 'not_served' };
    m.served.hint = true;
    var wrong = [0, 1, 2, 3].filter(function (i) { return i !== q.correctOptionIndex; });
    rnd = rnd || Math.random;
    wrong.splice(Math.floor(rnd() * wrong.length), 1);
    return { remove: wrong };
  }

  function endMission(u, m, input, now) {
    if (m.endedAt) return { error: 'ended' };
    m.endedAt = now;
    var elapsed = (now - m.startedAt) / 1000;
    // "survived" only counts if the mission actually lasted (no instant-finish farming)
    m.survived = !!(input && input.survived) && elapsed >= m.durationSec * 0.9 && m.answered >= 3;
    // completion bonus scales with how much of the mission was actually flown (no start-and-quit farming)
    var flown = Math.min(1, elapsed / m.durationSec);
    var bonus = m.answered >= 3 ? Math.round(flown * R.missionBonus({ answered: m.answered, correct: m.correct, rapid: m.rapid, survived: m.survived })) : 0;
    m.xp += bonus; addXP(u, bonus, now);
    var st = u.stats; st.missions++; if (m.survived) st.survived++;
    // a mission counts for every subject the student actually answered in (the subject is chosen per crisis)
    var played = Object.keys(m.subs || {}); if (!played.length && m.subject !== 'mixed') played = [m.subject];
    played.forEach(function (sb) { st.subjects[sb] = (st.subjects[sb] || 0) + 1; });
    st.focusSum += m.focus; st.focusN++;
    var nb = [];
    award(u, 'first_mission', nb);
    if (m.answered >= 10 && m.rapid === 0) award(u, 'focus_master', nb);
    if (st.survived >= 5) award(u, 'survivor', nb);
    if (u.streakDays >= 3) award(u, 'streak_3', nb);
    if (['math', 'science', 'english', 'arabic'].every(function (s) { return st.subjects[s]; })) award(u, 'polyglot', nb);
    if (u.totalXP >= 1000) award(u, 'xp_1000', nb);
    return { bonus: bonus, totalXP: u.totalXP, level: u.currentLevel, rank: R.rank(u.currentLevel), badges: nb, survived: m.survived,
      summary: { answered: m.answered, correct: m.correct, rapid: m.rapid, xp: m.xp, bestCombo: m.bestCombo, focus: m.focus, concepts: m.concepts, durationSec: Math.round(elapsed) } };
  }

  function progress(u) {
    var L = u.learner, conceptsOut = [];
    Object.keys(L.bkt).forEach(function (t) { var c = C.ALL[t]; conceptsOut.push({ tag: t, ar: c ? c.ar : t, subject: c ? c.subject : '', mastery: L.bkt[t], attempts: L.attempts[t] || 0 }); });
    conceptsOut.sort(function (a, b) { return a.mastery - b.mastery; });
    return { elo: L.elo, answeredBySubject: L.n, concepts: conceptsOut, reviewsDue: A.dueReviews(L, Date.now() / 60000).length, reviewsTotal: Object.keys(L.sr).length,
      stats: u.stats, focusAvg: u.stats.focusN ? u.stats.focusSum / u.stats.focusN : null, badges: u.badges, streakDays: u.streakDays };
  }

  function publicUser(u) {
    return { uid: u.uid, username: u.username, displayName: u.displayName, role: u.role, gradeLevel: u.gradeLevel, avatar: u.avatar, classCode: u.classCode,
      totalXP: u.totalXP, currentLevel: u.currentLevel, weeklyXP: u.weeklyXP, streakDays: u.streakDays, badges: u.badges, resources: u.resources, rank: R.rank(u.currentLevel),
      nextLevelXP: R.levelFloor(u.currentLevel + 1), levelXP: R.levelFloor(u.currentLevel) };
  }
  /* strips the answer before sending a question to the client (server mode) */
  function publicQuestion(q) {
    return { questionId: q.questionId, gradeLevel: q.gradeLevel, subject: q.subject, difficulty: q.difficulty, difficultyLabel: q.difficultyLabel,
      questionText: q.questionText, options: q.options, conceptTag: q.conceptTag, lang: q.lang };
  }

  return { BADGES: BADGES, dayKey: dayKey, weekKey: weekKey, newUser: newUser, touchActivity: touchActivity, startMission: startMission, nextQuestion: nextQuestion,
    answer: answer, fifty: fifty, endMission: endMission, progress: progress, publicUser: publicUser, publicQuestion: publicQuestion, adaptQ: adaptQ };
});
