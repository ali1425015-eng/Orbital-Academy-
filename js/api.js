/* ==========================================================================
   API layer. Two implementations with the SAME interface:
   - RemoteApi: talks to the Node server (accounts, central leaderboard,
     server-side answer checking, LLM tutor).
   - LocalApi: runs everything in the browser with the same shared Service
     code (offline / GitHub Pages / double-click index.html). Data stays in
     this browser's localStorage.
   OA.Api.connect() picks Remote when /api/health answers, else Local.
   ========================================================================== */
(function (OA) {
  var S = OA.Service, C = OA.Concepts;

  /* ------------------------------ Remote ------------------------------ */
  function RemoteApi(health) {
    this.mode = 'online'; this.info = health;
    this.token = null; try { this.token = localStorage.getItem('oa_token'); } catch (e) { }
  }
  RemoteApi.prototype.req = function (method, path, body) {
    var self = this;
    return fetch('api/' + path, { method: method, headers: Object.assign({ 'content-type': 'application/json' }, self.token ? { authorization: 'Bearer ' + self.token } : {}), body: body ? JSON.stringify(body) : undefined })
      .catch(function () { throw { code: 'network' }; })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok) { if (r.status === 401 && path !== 'auth/login') { self.setToken(null); } var e = new Error(j.error || 'http_' + r.status); e.code = j.error || 'http_' + r.status; throw e; }
          return j;
        });
      });
  };
  RemoteApi.prototype.setToken = function (t) { this.token = t; try { t ? localStorage.setItem('oa_token', t) : localStorage.removeItem('oa_token'); } catch (e) { } };
  RemoteApi.prototype._auth = function (p) { var self = this; return p.then(function (r) { self.setToken(r.token); return r.user; }); };
  RemoteApi.prototype.hasSession = function () { return !!this.token; };
  RemoteApi.prototype.signup = function (b) { return this._auth(this.req('POST', 'auth/signup', b)); };
  RemoteApi.prototype.login = function (b) { return this._auth(this.req('POST', 'auth/login', b)); };
  RemoteApi.prototype.google = function (b) { return this._auth(this.req('POST', 'auth/google', b)); };
  RemoteApi.prototype.logout = function () { this.setToken(null); return Promise.resolve(); };
  RemoteApi.prototype.me = function () { return this.req('GET', 'me').then(function (r) { return r.user; }); };
  RemoteApi.prototype.updateMe = function (b) { return this.req('PATCH', 'me', b).then(function (r) { return r.user; }); };
  RemoteApi.prototype.publicBoard = function () { return this.req('GET', 'leaderboard/public').then(function (r) { return r.top; }); };
  RemoteApi.prototype.board = function (scope) { return this.req('GET', 'leaderboard?scope=' + scope); };
  RemoteApi.prototype.startMission = function (subject, o) { o = o || {}; return this.req('POST', 'missions', { subject: subject, mode: o.mode, target: o.target, durationSec: o.durationSec }).then(function (r) { return r.mission; }); };
  RemoteApi.prototype.next = function (mid, ctx) { return this.req('POST', 'missions/' + mid + '/next', ctx); };
  RemoteApi.prototype.answer = function (mid, b) { return this.req('POST', 'missions/' + mid + '/answer', b); };
  RemoteApi.prototype.fifty = function (mid, qid) { return this.req('POST', 'missions/' + mid + '/fifty', { questionId: qid }); };
  RemoteApi.prototype.end = function (mid, survived) { return this.req('POST', 'missions/' + mid + '/end', { survived: survived }); };
  RemoteApi.prototype.tutor = function (qid, sel, lang) { return this.req('POST', 'tutor', { questionId: qid, selected: sel, lang: lang }); };
  RemoteApi.prototype.ask = function (qid, msg, mid, lang) { return this.req('POST', 'tutor/ask', { questionId: qid, message: msg, missionId: mid, lang: lang }); };
  RemoteApi.prototype.progress = function () { return this.req('GET', 'progress'); };
  RemoteApi.prototype.classes = function () { return this.req('GET', 'classes').then(function (r) { return r.classes; }); };
  RemoteApi.prototype.createClass = function (name) { return this.req('POST', 'classes', { name: name }); };
  RemoteApi.prototype.classView = function (code) { return this.req('GET', 'classes/' + encodeURIComponent(code)); };
  RemoteApi.prototype.questions = function (subject, grade, limit, lang) { return this.req('GET', 'questions?subject=' + subject + '&grade=' + grade + '&limit=' + (limit || 10) + '&lang=' + (lang || 'ar')).then(function (r) { return r.questions; }); };
  RemoteApi.prototype.download = function (path, name) {
    return fetch('api/' + path, { headers: { authorization: 'Bearer ' + this.token } }).then(function (r) { return r.blob(); }).then(function (b) { saveBlob(b, name); });
  };
  RemoteApi.prototype.exportMine = function () { return this.download('me/answers.csv', 'my-answers.csv'); };
  RemoteApi.prototype.exportClass = function (code) { return this.download('classes/' + code + '/answers.csv', 'class-' + code + '.csv'); };

  function saveBlob(blob, name) { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); }

  /* ------------------------------ Bank loader (static chunks) ------------------------------ */
  var Bank = OA.Bank = { chunks: {}, waiting: {} };
  window.OA_BANK_LOAD = function (key, rows) {
    var qr = LocalStore.data ? LocalStore.data.qrating : {};
    Bank.chunks[key] = rows.map(function (r) {
      var subject = key.split('-')[0], rt = qr && qr[r[0]];
      return { questionId: r[0], gradeLevel: r[1], subject: subject, difficulty: r[2], difficultyLabel: ['', 'Easy', 'Medium', 'Hard'][r[2]], conceptTag: r[3], questionText: r[4], options: r[5],
        correctOptionIndex: r[6], explanation: r[7], optionNotes: r[8], lang: r[9], ui: r[10] || null, rating: rt ? rt[0] : null, ratingN: rt ? rt[1] : 0 };
    });
    (Bank.waiting[key] || []).forEach(function (f) { f(); }); delete Bank.waiting[key];
  };
  Bank.loadChunk = function (key) {
    if (Bank.chunks[key]) return Promise.resolve(Bank.chunks[key]);
    var idx = window.OA_BANK_INDEX; if (idx && idx.chunks && !idx.chunks[key]) return Promise.resolve([]);
    return new Promise(function (res) {
      var first = !Bank.waiting[key]; (Bank.waiting[key] = Bank.waiting[key] || []).push(function () { res(Bank.chunks[key]); });
      if (!first) return;
      var s = document.createElement('script'); s.src = 'data/bank/' + key + '.js'; s.async = true;
      s.onerror = function () { Bank.chunks[key] = []; (Bank.waiting[key] || []).forEach(function (f) { f(); }); delete Bank.waiting[key]; };
      document.head.appendChild(s);
    });
  };
  /* ONLY the student's own grade; learning track (grade 0): only the interface language */
  Bank.pool = function (subject, grade, ui) {
    var l = ui === 'en' ? 'en' : 'ar';
    return Bank.loadChunk(subject + '-g' + grade + '-' + l).then(function (rows) { return rows.filter(function (q) { return q.ui === l; }); });
  };

  /* ------------------------------ Local ------------------------------ */
  var LocalStore = {
    data: null,
    load: function () { try { this.data = JSON.parse(localStorage.getItem('oa_local_db') || 'null'); } catch (e) { this.data = null; }
      this.data = this.data || { users: {}, creds: {}, missions: {}, answers: [], classes: {}, qrating: {} }; return this.data; },
    save: function () {
      var d = this.data;
      Object.keys(d.missions).forEach(function (k) { if (d.missions[k].endedAt && Date.now() - d.missions[k].endedAt > 7 * 86400000) delete d.missions[k]; });
      if (d.answers.length > 4000) d.answers = d.answers.slice(-4000);
      for (var i = 0; i < 3; i++) { try { localStorage.setItem('oa_local_db', JSON.stringify(d)); return true; } catch (e) { d.answers = d.answers.slice(-Math.floor(d.answers.length / 2)); } }
      return false;
    }
  };
  function sha(str) {
    if (window.crypto && crypto.subtle && window.isSecureContext !== false) {
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)).then(function (b) { return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); });
    }
    var h = 0x811c9dc5, out = ''; for (var r = 0; r < 8; r++) { for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i) + r; h = Math.imul(h, 16777619); } out += ('0000000' + (h >>> 0).toString(16)).slice(-8); }
    return Promise.resolve(out);
  }
  function validGrade(g) { return g !== undefined && g !== null && g !== '' && (+g === 0 || (+g >= 7 && +g <= 12)); }
  function uid() { return 'L-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function fail(code) { var e = new Error(code); e.code = code; return Promise.reject(e); }

  function LocalApi() {
    this.mode = 'local'; this.db = LocalStore.load(); this.cache = {}; this.rng = new OA.RNG(Date.now() >>> 0);
    this.info = { ok: true, mode: 'local', questions: window.OA_BANK_INDEX ? window.OA_BANK_INDEX.total : 0, ai: null, google: null, model: OA.Model ? { version: OA.Model.version } : null };
    try { this.session = localStorage.getItem('oa_local_session'); } catch (e) { this.session = null; }
  }
  var L = LocalApi.prototype;
  L.hasSession = function () { return !!(this.session && this.db.users[this.session]); };
  L.user = function () { var u = this.db.users[this.session]; if (!u) throw { code: 'unauthorized' }; return u; };
  L.setSession = function (id) { this.session = id; try { id ? localStorage.setItem('oa_local_session', id) : localStorage.removeItem('oa_local_session'); } catch (e) { } };
  L.signup = function (b) {
    var self = this, name = String(b.username || '').trim();
    if (!/^[\p{L}\p{N}_.\-]{3,20}$/u.test(name)) return fail('bad_username');
    if (String(b.password || '').length < 6) return fail('weak_password');
    if (self.db.creds[name.toLowerCase()]) return fail('username_taken');
    var code = String(b.classCode || '').trim().toUpperCase(); if (code && !self.db.classes[code]) return fail('bad_class_code');
    var salt = Math.random().toString(36).slice(2);
    return sha(salt + ':' + b.password).then(function (h) {
      var u = S.newUser({ uid: uid(), username: name, displayName: b.displayName || name, role: b.role === 'teacher' ? 'teacher' : 'student', gradeLevel: validGrade(b.gradeLevel) ? +b.gradeLevel : 9, avatar: b.avatar, classCode: code, now: Date.now() });
      self.db.users[u.uid] = u; self.db.creds[name.toLowerCase()] = { uid: u.uid, salt: salt, hash: h }; LocalStore.save(); self.setSession(u.uid);
      return S.publicUser(u);
    });
  };
  L.login = function (b) {
    var self = this, c = self.db.creds[String(b.username || '').trim().toLowerCase()];
    if (!c) return fail('bad_credentials');
    return sha(c.salt + ':' + b.password).then(function (h) {
      if (h !== c.hash) throw { code: 'bad_credentials' };
      var u = self.db.users[c.uid]; if (validGrade(b.gradeLevel) && u.role === 'student') u.gradeLevel = +b.gradeLevel;
      LocalStore.save(); self.setSession(u.uid); return S.publicUser(u);
    });
  };
  L.google = function () { return fail('google_not_configured'); };
  L.logout = function () { this.setSession(null); return Promise.resolve(); };
  L.me = function () { try { return Promise.resolve(S.publicUser(this.user())); } catch (e) { return Promise.reject(e); } };
  L.updateMe = function (b) {
    var u = this.user();
    if (validGrade(b.gradeLevel)) u.gradeLevel = +b.gradeLevel; if (b.avatar) u.avatar = b.avatar; if (b.displayName) u.displayName = String(b.displayName).slice(0, 30);
    if (b.classCode != null) { var c = String(b.classCode).trim().toUpperCase(); if (c && !this.db.classes[c]) return fail('bad_class_code'); u.classCode = c; }
    LocalStore.save(); return Promise.resolve(S.publicUser(u));
  };
  L.students = function () { var us = this.db.users; return Object.keys(us).map(function (k) { return us[k]; }).filter(function (u) { return u.role === 'student'; }); };
  L.publicBoard = function () {
    return Promise.resolve(this.students().sort(function (a, b) { return b.totalXP - a.totalXP; }).slice(0, 5).map(function (u) { return { username: u.username, displayName: u.displayName, avatar: u.avatar, totalXP: u.totalXP, currentLevel: u.currentLevel }; }));
  };
  L.board = function (scope) {
    var me = this.user(), wk = S.weekKey(Date.now());
    var list = this.students().filter(function (u) { return scope === 'grade' ? u.gradeLevel === me.gradeLevel : scope === 'class' ? (me.classCode && u.classCode === me.classCode) : scope === 'weekly' ? u.weekKey === wk : true; });
    var key = scope === 'weekly' ? 'weeklyXP' : 'totalXP';
    list.sort(function (a, b) { return b[key] - a[key]; });
    var rank = list.indexOf(me);
    return Promise.resolve({ scope: scope, top: list.slice(0, 10).map(function (u) { return { username: u.username, displayName: u.displayName, avatar: u.avatar, totalXP: u.totalXP, weeklyXP: u.weeklyXP, currentLevel: u.currentLevel, gradeLevel: u.gradeLevel }; }),
      me: { rank: me.role === 'student' ? (rank < 0 ? list.length + 1 : rank + 1) : null, score: me[key], total: list.length } });
  };
  L.startMission = function (subject, o) {
    o = o || {};
    var u = this.user(); if (C.subjectsFor(u.gradeLevel).indexOf(subject) < 0) return fail('bad_subject');
    var m = S.startMission(u, { missionId: uid(), subject: subject, mode: o.mode, target: o.target, durationSec: o.durationSec }, Date.now());
    this.db.missions[m.missionId] = m; LocalStore.save();
    return Promise.resolve({ missionId: m.missionId, subject: m.subject, mode: m.mode, target: m.target, durationSec: m.durationSec, startedAt: m.startedAt });
  };
  L.next = function (mid, ctx) {
    var self = this, u = this.user(), m = this.db.missions[mid];
    if (!m || m.endedAt) return fail('mission_not_found');
    if (m.mode === 'count' && m.answered >= m.target) return fail('mission_complete');
    return Bank.pool(m.subject, u.gradeLevel, ctx && ctx.lang).then(function (pool) {
      var r = S.nextQuestion(u, m, pool, ctx, OA.Model, Date.now(), function () { return self.rng.next(); });
      if (!r) throw { code: 'no_questions' };
      self.cache[r.q.questionId] = r.q;
      return { question: S.publicQuestion(r.q), predicted: r.predicted, risk: r.risk, riskThreshold: OA.Model ? OA.Model.disengage.threshold : 0.45, mastery: r.mastery, elo: r.elo,
        conceptAr: C.name(r.q.conceptTag, 'ar'), conceptEn: C.name(r.q.conceptTag, 'en'), expectedSec: OA.Rules.expectedSeconds(r.q) };
    });
  };
  L.answer = function (mid, b) {
    var u = this.user(), m = this.db.missions[mid], q = this.cache[b.questionId];
    if (!m || !q) return fail('mission_not_found');
    var r = S.answer(u, m, q, { selected: b.selected, ms: b.ms, hidden: b.hidden, idleMs: b.idleMs, usedHint: b.usedHint }, Date.now());
    if (r.error) return fail(r.error);
    if (r.newQRating != null) { var o = this.db.qrating[q.questionId] || [null, 0]; this.db.qrating[q.questionId] = [r.newQRating, o[1] + 1]; q.rating = r.newQRating; q.ratingN = o[1] + 1; }
    this.db.answers.push({ ts: Date.now(), uid: u.uid, username: u.username, missionId: mid, questionId: q.questionId, subject: q.subject, conceptTag: q.conceptTag, selected: b.selected,
      correct: r.correct ? 1 : 0, rapid: r.rapid ? 1 : 0, ms: r.ms, hidden: b.hidden ? 1 : 0, xp: r.xp, pBefore: +r.pBefore.toFixed(4), masteryAfter: +r.mastery.toFixed(4), focus: +r.focus.toFixed(3) });
    LocalStore.save(); delete r.newQRating;
    return Promise.resolve(r);
  };
  L.fifty = function (mid, qid) {
    var m = this.db.missions[mid], q = this.cache[qid]; if (!m || !q) return fail('mission_not_found');
    var r = OA.Service.fifty(m, q); return r.error ? fail(r.error) : Promise.resolve(r);
  };
  L.end = function (mid, survived) {
    var u = this.user(), m = this.db.missions[mid]; if (!m) return fail('mission_not_found');
    var r = S.endMission(u, m, { survived: survived }, Date.now()); if (r.error) return fail(r.error);
    LocalStore.save(); r.user = S.publicUser(u); return Promise.resolve(r);
  };
  L.tutor = function (qid, sel, lang) { var q = this.cache[qid], u = this.user(); return Promise.resolve({ text: OA.TutorLocal.explain(q, sel, u.gradeLevel, lang), provider: 'local' }); };
  L.ask = function (qid, msg, mid, lang) {
    var q = this.cache[qid], m = mid && this.db.missions[mid], u = this.user();
    var before = !!(m && !m.endedAt && m.served && m.served.id === qid);
    return Promise.resolve({ text: OA.TutorLocal.askLocal(q, u.gradeLevel, before, lang), provider: 'local', before: before });
  };
  L.progress = function () {
    var u = this.user(), mine = this.db.answers.filter(function (a) { return a.uid === u.uid; });
    var by = {}, daily = {};
    mine.forEach(function (a) { var s = by[a.subject] = by[a.subject] || { subject: a.subject, n: 0, c: 0, r: 0 }; s.n++; s.c += a.correct; s.r += a.rapid;
      var d = new Date(a.ts).toISOString().slice(0, 10), x = daily[d] = daily[d] || { d: d, n: 0, c: 0, f: 0 }; x.n++; x.c += a.correct; x.f += a.focus; });
    var ms = this.db.missions, recent = Object.keys(ms).map(function (k) { return ms[k]; }).filter(function (m) { return m.uid === u.uid && m.endedAt; }).sort(function (a, b) { return b.startedAt - a.startedAt; }).slice(0, 12)
      .map(function (m) { return { missionId: m.missionId, subject: m.subject, startedAt: m.startedAt, answered: m.answered, correct: m.correct, rapid: m.rapid, xp: m.xp, survived: m.survived ? 1 : 0 }; });
    return Promise.resolve(Object.assign(S.progress(u), { recent: recent, bySubject: Object.keys(by).map(function (k) { return by[k]; }),
      daily: Object.keys(daily).sort().reverse().slice(0, 14).map(function (k) { var x = daily[k]; return { d: x.d, n: x.n, c: x.c, f: x.f / x.n }; }), user: S.publicUser(u) }));
  };
  L.classes = function () {
    var u = this.user(), self = this;
    return Promise.resolve(Object.keys(this.db.classes).map(function (k) { return self.db.classes[k]; }).filter(function (c) { return c.teacherUid === u.uid; })
      .map(function (c) { return { code: c.code, name: c.name, createdAt: c.createdAt, students: self.students().filter(function (s) { return s.classCode === c.code; }).length }; }));
  };
  L.createClass = function (name) {
    var u = this.user(); if (u.role !== 'teacher') return fail('teachers_only');
    var code; do { code = Math.random().toString(36).slice(2, 8).toUpperCase(); } while (this.db.classes[code] || code.length < 6);
    this.db.classes[code] = { code: code, name: name || 'فصلي', teacherUid: u.uid, createdAt: Date.now() }; LocalStore.save();
    return Promise.resolve({ code: code });
  };
  L.classView = function (code) {
    var u = this.user(), c = this.db.classes[code]; if (!c || c.teacherUid !== u.uid) return fail('class_not_found');
    var agg = {};
    var students = this.students().filter(function (s) { return s.classCode === code; }).map(function (s) {
      var pr = S.progress(s);
      pr.concepts.forEach(function (k) { var a = agg[k.tag] = agg[k.tag] || { tag: k.tag, ar: k.ar, subject: k.subject, sum: 0, n: 0 }; a.sum += k.mastery; a.n++; });
      return { username: s.username, displayName: s.displayName, avatar: s.avatar, gradeLevel: s.gradeLevel, totalXP: s.totalXP, level: s.currentLevel, streakDays: s.streakDays, answered: s.stats.answered,
        accuracy: s.stats.answered ? s.stats.correct / s.stats.answered : null, rapidRate: s.stats.answered ? s.stats.rapid / s.stats.answered : null, focusAvg: pr.focusAvg, missions: s.stats.missions,
        weakest: pr.concepts.filter(function (k) { return k.attempts >= 2; }).slice(0, 3).map(function (k) { return k.ar; }), lastActive: s.lastActiveDay };
    });
    return Promise.resolve({ class: { code: c.code, name: c.name }, students: students, concepts: Object.keys(agg).map(function (k) { var a = agg[k]; return { tag: a.tag, ar: a.ar, subject: a.subject, avgMastery: a.sum / a.n, students: a.n }; }).sort(function (a, b) { return a.avgMastery - b.avgMastery; }) });
  };
  L.questions = function (subject, grade, limit, lang) {
    var self = this, u = this.user();
    return Bank.pool(subject, grade, lang).then(function (rows) { return self.rng.shuffle(rows).slice(0, limit || 10).map(function (q) { return u.role === 'teacher' ? q : S.publicQuestion(q); }); });
  };
  function csv(rows) {
    if (!rows.length) return 'empty\n'; var cols = Object.keys(rows[0]);
    return '﻿' + cols.join(',') + '\n' + rows.map(function (r) { return cols.map(function (c) { var v = r[c]; v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','); }).join('\n') + '\n';
  }
  L.exportMine = function () { var u = this.user(); saveBlob(new Blob([csv(this.db.answers.filter(function (a) { return a.uid === u.uid; }))], { type: 'text/csv' }), 'my-answers.csv'); return Promise.resolve(); };
  L.exportClass = function (code) { var self = this; var ids = {}; this.students().forEach(function (s) { if (s.classCode === code) ids[s.uid] = 1; });
    saveBlob(new Blob([csv(this.db.answers.filter(function (a) { return ids[a.uid]; }))], { type: 'text/csv' }), 'class-' + code + '.csv'); return Promise.resolve(); };

  /* ------------------------------ connect ------------------------------ */
  OA.Api = {
    connect: function () {
      var forceLocal = /[?&]local=1/.test(location.search) || location.protocol === 'file:';
      if (forceLocal) return Promise.resolve(new LocalApi());
      var ctl = window.AbortController ? new AbortController() : null;
      var to = setTimeout(function () { ctl && ctl.abort(); }, 2500);
      return fetch('api/health', { signal: ctl && ctl.signal }).then(function (r) { clearTimeout(to); if (!r.ok) throw 0; return r.json(); })
        .then(function (h) { if (!h || !h.ok) throw 0; return new RemoteApi(h); })
        .catch(function () { clearTimeout(to); return new LocalApi(); });
    }
  };
})(window.OA = window.OA || {});
