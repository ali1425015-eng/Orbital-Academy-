/* Game rules + focus model, shared by server and browser so XP can be
   re-computed by the server (no trusting the client for the leaderboard). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.OA = root.OA || {}).Rules = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var XP_BASE = { 1: 10, 2: 15, 3: 22 };
  var RANKS = [
    { lvl: 1, ar: 'متدرّب', en: 'Cadet', icon: '🎒' },
    { lvl: 3, ar: 'ملاح', en: 'Navigator', icon: '🧭' },
    { lvl: 6, ar: 'ملازم فضاء', en: 'Lieutenant', icon: '🎖️' },
    { lvl: 10, ar: 'قائد سرب', en: 'Commander', icon: '🚀' },
    { lvl: 15, ar: 'قبطان', en: 'Captain', icon: '🌟' },
    { lvl: 22, ar: 'أدميرال المجرّة', en: 'Admiral', icon: '🌌' }
  ];

  /* ---- Focus model ----
     Expected reading+solving time grows with text length and difficulty.
     A "rapid guess" is an answer faster than 25% of that (min 1.6 s): the
     response-time-effort idea of Wise & Kong (2005). Rapid guesses earn no
     XP and do not move the ability estimate. */
  function expectedSeconds(q) {
    var chars = (q.questionText || '').length + (q.options || []).join(' ').length;
    return (3 + 0.045 * chars) * (1 + 0.3 * ((q.difficulty || 2) - 1));
  }
  function isRapid(q, ms) { return ms < Math.max(1600, 250 * expectedSeconds(q)); }
  /* focus ∈ [0,1], exponential moving average of an engagement signal. */
  function updateFocus(focus, ev) {
    var sig = 1;
    if (ev.rapid) sig = 0;
    else if (ev.timeout) sig = 0.35;
    else if (ev.hidden) sig = 0.3;          // left the tab during the question
    else if (ev.idleMs > 25000) sig = 0.6;
    return Math.max(0, Math.min(1, 0.78 * (focus == null ? 1 : focus) + 0.22 * sig));
  }

  function xpFor(q, correct, rapid, combo) {
    if (!correct || rapid) return 0;
    var mult = 1 + Math.min(combo || 0, 5) * 0.1;
    return Math.round((XP_BASE[q.difficulty || 2] || 15) * mult);
  }
  function missionBonus(stats) {
    // stats: { answered, correct, rapid, survived }
    if (!stats.answered) return 0;
    var acc = stats.correct / stats.answered;
    var focusOk = stats.rapid === 0 ? 25 : 0;
    return Math.round((stats.survived ? 40 : 10) + 60 * acc + focusOk);
  }
  function level(xp) { return Math.floor(Math.sqrt((xp || 0) / 40)) + 1; }
  function levelFloor(l) { return 40 * (l - 1) * (l - 1); }
  function rank(lvl) { var r = RANKS[0]; RANKS.forEach(function (x) { if (lvl >= x.lvl) r = x; }); return r; }

  /* Ship resource effects */
  var EFFECT = { correct: 18, wrong: -12, timeout: -15, drain: 0.45 /* per second on the crisis system */, base: 0.06 };

  return { XP_BASE: XP_BASE, RANKS: RANKS, expectedSeconds: expectedSeconds, isRapid: isRapid, updateFocus: updateFocus,
    xpFor: xpFor, missionBonus: missionBonus, level: level, levelFloor: levelFloor, rank: rank, EFFECT: EFFECT };
});
