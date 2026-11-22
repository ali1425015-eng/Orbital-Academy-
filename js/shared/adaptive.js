/* ==========================================================================
   Adaptive learning core — shared by the browser, the server and the
   simulator (one implementation, so training data and runtime match).

   1. Elo rating (Pelánek 2016, "Applications of the Elo rating system in
      adaptive educational systems"): student ability θ per subject and
      question difficulty b, updated online after every answer.
   2. Bayesian Knowledge Tracing (Corbett & Anderson 1994): probability the
      student has mastered each concept tag.
   3. Leitner spaced repetition: a missed question comes back after
      increasing intervals until it is answered correctly 4 times.
   4. Question selection: picks the question whose predicted success is
      closest to a target (≈0.72, the "desirable difficulty" / flow zone),
      boosted for due reviews and weak concepts. When focus drops the target
      rises so the student gets quick wins and re-engages.
   5. features(): the exact feature vector the ML model was trained on.
   ========================================================================== */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.OA = root.OA || {}).Adaptive = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var BKT = { pL0: 0.25, pT: 0.12, pS: 0.10, pG: 0.25 };
  var LEITNER_MIN = [0, 10, 60 * 24, 60 * 24 * 3, 60 * 24 * 7, 60 * 24 * 16]; // minutes per box
  var DIFF_PRIOR = { 1: -0.9, 2: 0, 3: 0.9 };
  var FEATURES = ['elo_diff', 'mastery', 'log_attempts', 'recent_acc', 'focus', 'seen', 'difficulty', 'session_min', 'grade_gap'];
  var DIS_FEATURES = ['focus', 'session_min', 'recent_rapid', 'consec_wrong', 'tab_switches', 'elo_diff', 'since_break_min'];

  function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

  function newLearner(grade) {
    return { grade: grade || 9, elo: {}, n: {}, bkt: {}, attempts: {}, sr: {}, seen: {}, recent: [], recentRapid: [], consecWrong: 0 };
  }

  /* Question prior difficulty: the generator's level, shifted by how far the
     question's grade is from the student's grade. */
  function baseB(q) { return q.rating != null ? q.rating : DIFF_PRIOR[q.difficulty || 2]; }
  function priorB(q, studentGrade) { return DIFF_PRIOR[q.difficulty || 2] + 0.55 * ((q.grade || studentGrade) - studentGrade); }
  function qRating(q, studentGrade) { return baseB(q) + 0.55 * ((q.grade || studentGrade) - studentGrade); }

  function eloP(L, q) { return sigmoid((L.elo[q.subject] || 0) - qRating(q, L.grade)); }

  /* Elo update. K shrinks with experience so ratings settle. Rapid guesses
     are NOT used to update ability (they carry no information about skill). */
  function updateElo(L, q, correct) {
    var s = q.subject, n = L.n[s] || 0;
    var p = eloP(L, q);
    var K = 0.8 / (1 + 0.06 * n);
    L.elo[s] = clamp((L.elo[s] || 0) + K * ((correct ? 1 : 0) - p), -4, 4);
    L.n[s] = n + 1;
    var qn = q.ratingN || 0, Kq = 0.6 / (1 + 0.05 * qn);
    var newRating = clamp(baseB(q) - Kq * ((correct ? 1 : 0) - p), -4, 4);
    return { p: p, newQRating: newRating };
  }

  function mastery(L, tag) { return L.bkt[tag] != null ? L.bkt[tag] : BKT.pL0; }
  function updateBKT(L, tag, correct) {
    var pL = mastery(L, tag), post;
    if (correct) post = pL * (1 - BKT.pS) / (pL * (1 - BKT.pS) + (1 - pL) * BKT.pG);
    else post = pL * BKT.pS / (pL * BKT.pS + (1 - pL) * (1 - BKT.pG));
    L.bkt[tag] = post + (1 - post) * BKT.pT;
    L.attempts[tag] = (L.attempts[tag] || 0) + 1;
    return L.bkt[tag];
  }

  function updateSR(L, qid, correct, nowMin) {
    var it = L.sr[qid];
    if (!correct) { L.sr[qid] = { box: 1, due: nowMin + LEITNER_MIN[1] }; return; }
    if (!it) return; // first-time correct: no review needed
    it.box = Math.min(it.box + 1, 5);
    if (it.box >= 5) { delete L.sr[qid]; return; }
    it.due = nowMin + LEITNER_MIN[it.box];
  }
  function dueReviews(L, nowMin) { return Object.keys(L.sr).filter(function (k) { return L.sr[k].due <= nowMin; }); }

  function recentAcc(L) { var r = L.recent; if (!r.length) return 0.5; var s = 0; for (var i = 0; i < r.length; i++) s += r[i]; return s / r.length; }

  /* ctx = { focus, sessionMin, tabSwitches, sinceBreakMin } */
  function features(L, q, ctx) {
    ctx = ctx || {};
    return [
      (L.elo[q.subject] || 0) - qRating(q, L.grade),
      mastery(L, q.conceptTag),
      Math.log(1 + (L.attempts[q.conceptTag] || 0)),
      recentAcc(L),
      ctx.focus != null ? ctx.focus : 1,
      L.seen[q.id] ? 1 : 0,
      q.difficulty || 2,
      Math.min(ctx.sessionMin || 0, 60),
      (q.grade || L.grade) - L.grade
    ];
  }
  function disFeatures(L, q, ctx) {
    ctx = ctx || {};
    var rr = 0; for (var i = 0; i < L.recentRapid.length; i++) rr += L.recentRapid[i];
    return [ctx.focus != null ? ctx.focus : 1, Math.min(ctx.sessionMin || 0, 60), rr, Math.min(L.consecWrong || 0, 6),
      Math.min(ctx.tabSwitches || 0, 10), q ? (L.elo[q.subject] || 0) - qRating(q, L.grade) : 0, Math.min(ctx.sinceBreakMin != null ? ctx.sinceBreakMin : (ctx.sessionMin || 0), 60)];
  }

  function linModel(m, x) {
    if (!m || !m.coef) return null;
    var z = m.intercept;
    for (var i = 0; i < x.length; i++) z += m.coef[i] * (x[i] - m.mean[i]) / m.scale[i];
    return sigmoid(z);
  }

  /* P(correct): trained ML model when available, otherwise plain Elo. */
  function predict(L, q, ctx, model) {
    var p = model && model.correct ? linModel(model.correct, features(L, q, ctx)) : null;
    return p == null ? eloP(L, q) : p;
  }
  function disengageRisk(L, q, ctx, model) {
    var p = model && model.disengage ? linModel(model.disengage, disFeatures(L, q, ctx)) : null;
    if (p == null) { var f = ctx && ctx.focus != null ? ctx.focus : 1; return clamp(1 - f, 0, 1); }
    return p;
  }

  /* Choose the next question from a candidate pool.
     opts: { exclude: {id:true}, nowMin, rng(), model, ctx, policy } */
  function select(L, pool, opts) {
    opts = opts || {};
    var ctx = opts.ctx || {}, nowMin = opts.nowMin || 0, rnd = opts.rng || Math.random;
    var policy = opts.policy || 'full';
    var cand = pool.filter(function (q) { return !(opts.exclude && opts.exclude[q.id]); });
    if (!cand.length) cand = pool;
    if (policy === 'random') return cand[Math.floor(rnd() * cand.length)];
    var focus = ctx.focus != null ? ctx.focus : 1;
    var target = focus < 0.55 ? 0.84 : 0.72;
    var best = null, bestS = -1e9;
    var useSR = policy !== 'elo';
    // evaluate a random subset for speed on big pools
    var S = opts.sample || 400;
    var sample = cand.length > S ? sampleN(cand, S, rnd) : cand.slice();
    if (useSR) {
      dueReviews(L, nowMin).forEach(function (id) {
        for (var i = 0; i < cand.length; i++) if (cand[i].id === id && sample.indexOf(cand[i]) < 0) { sample.push(cand[i]); break; }
      });
    }
    for (var i = 0; i < sample.length; i++) {
      var q = sample[i];
      var p = predict(L, q, ctx, policy === 'elo' ? null : opts.model);
      var s = -3 * Math.abs(p - target) + rnd() * 0.25;
      if (useSR) {
        var sr = L.sr[q.id];
        if (sr && sr.due <= nowMin) s += 1.2;
        s += 0.6 * (1 - mastery(L, q.conceptTag));
        if (L.seen[q.id] && !sr && nowMin - L.seen[q.id] < 60 * 24) s -= 2;
      } else if (L.seen[q.id] && nowMin - L.seen[q.id] < 60 * 24) s -= 2;
      if (s > bestS) { bestS = s; best = q; }
    }
    return best;
  }
  function sampleN(arr, n, rnd) {
    var a = arr.slice(), out = [];
    for (var i = 0; i < n && a.length; i++) { var j = Math.floor(rnd() * a.length); out.push(a[j]); a[j] = a[a.length - 1]; a.pop(); }
    return out;
  }

  /* Record one answer in the learner state. Returns what changed. */
  function record(L, q, ans) {
    // ans = { correct, rapid, nowMin }
    var out = { pBefore: eloP(L, q), masteryBefore: mastery(L, q.conceptTag) };
    if (!ans.rapid) {
      var e = updateElo(L, q, ans.correct);
      out.newQRating = e.newQRating;
      updateBKT(L, q.conceptTag, ans.correct);
    }
    updateSR(L, q.id, ans.correct && !ans.rapid, ans.nowMin || 0);
    L.seen[q.id] = ans.nowMin || 0;
    L.recent.push(ans.correct ? 1 : 0); if (L.recent.length > 5) L.recent.shift();
    L.recentRapid.push(ans.rapid ? 1 : 0); if (L.recentRapid.length > 5) L.recentRapid.shift();
    L.consecWrong = ans.correct ? 0 : (L.consecWrong || 0) + 1;
    out.mastery = mastery(L, q.conceptTag);
    out.elo = L.elo[q.subject] || 0;
    return out;
  }

  return { BKT: BKT, FEATURES: FEATURES, DIS_FEATURES: DIS_FEATURES, newLearner: newLearner, eloP: eloP, qRating: qRating,
    priorB: priorB, updateElo: updateElo, updateBKT: updateBKT, mastery: mastery, updateSR: updateSR, dueReviews: dueReviews,
    features: features, disFeatures: disFeatures, predict: predict, disengageRisk: disengageRisk, select: select, record: record,
    sigmoid: sigmoid, linModel: linModel };
});
