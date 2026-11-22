#!/usr/bin/env node
/* Orbital Academy — HTTP server (REST API + static files). Zero dependencies:
   node:http, node:sqlite, node:crypto, global fetch (Node ≥ 22.13).
   Start:  npm start      →  http://localhost:8080 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { open, seedQuestions, rowToQuestion } = require('./db');
const auth = require('./auth');
const tutor = require('./tutor');
const PUB = path.join(__dirname, '..');   // site files live at the repo root (index.html, css/, js/, assets/, data/bank/)
const Service = require(path.join(PUB, 'js/shared/service.js'));
const Rules = require(path.join(PUB, 'js/shared/rules.js'));
const Concepts = require(path.join(PUB, 'js/shared/concepts.js'));
const TutorLocal = require(path.join(PUB, 'js/shared/tutor-local.js'));
let Model = null; try { Model = require(path.join(PUB, 'js/shared/model-weights.js')); } catch (e) { Model = null; }

const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const VERSION = require('../package.json').version;

const db = open();
const seed = seedQuestions(db);
log('question bank: ' + seed.count + ' questions' + (seed.seeded ? ' (seeded)' : ''));

/* ---------- in-memory question cache (13k rows ≈ 15 MB) ---------- */
const Q = new Map();
const POOLS = {};
function loadQuestions() {
  Q.clear(); Object.keys(POOLS).forEach(k => delete POOLS[k]);
  for (const r of db.prepare('SELECT * FROM questions WHERE active = 1').all()) {
    const q = rowToQuestion(r); Q.set(q.questionId, q);
    (POOLS[q.subject + '|' + q.gradeLevel] = POOLS[q.subject + '|' + q.gradeLevel] || []).push(q);
  }
}
loadQuestions();
function poolFor(subject, grade) {
  const subs = subject === 'mixed' ? Object.keys(Concepts.SUBJECTS) : [subject];
  let out = [];
  for (const s of subs) out = out.concat(POOLS[s + '|' + grade] || []);   // ONLY the student's own grade
  return out;
}

/* ---------- users ---------- */
const getUserRow = db.prepare('SELECT * FROM users WHERE uid = ?');
function loadUser(uid) {
  const r = getUserRow.get(uid); if (!r) return null;
  const st = JSON.parse(r.state);
  return Object.assign({ uid: r.uid, username: r.username, displayName: r.displayName, role: r.role, gradeLevel: r.gradeLevel, avatar: r.avatar, classCode: r.classCode || '',
    totalXP: r.totalXP, currentLevel: r.currentLevel, weeklyXP: r.weeklyXP, weekKey: r.weekKey, streakDays: r.streakDays, lastActiveDay: r.lastActiveDay, createdAt: r.createdAt,
    email: r.email, passHash: r.passHash, salt: r.salt }, st);
}
const saveUserStmt = db.prepare(`UPDATE users SET displayName=?, gradeLevel=?, avatar=?, classCode=?, totalXP=?, currentLevel=?, weeklyXP=?, weekKey=?, streakDays=?, lastActiveDay=?, state=? WHERE uid=?`);
function saveUser(u) {
  saveUserStmt.run(u.displayName, u.gradeLevel, u.avatar, u.classCode || null, u.totalXP, u.currentLevel, u.weeklyXP, u.weekKey || '', u.streakDays, u.lastActiveDay || '',
    JSON.stringify({ badges: u.badges, stats: u.stats, resources: u.resources, learner: u.learner }), u.uid);
}
function insertUser(u, extra) {
  db.prepare(`INSERT INTO users (uid, username, displayName, passHash, salt, googleSub, email, role, gradeLevel, avatar, classCode, totalXP, currentLevel, weeklyXP, weekKey, streakDays, lastActiveDay, state, createdAt)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,0,1,0,'',0,'',?,?)`).run(u.uid, u.username, u.displayName, extra.passHash || null, extra.salt || null, extra.googleSub || null, extra.email || null,
    u.role, u.gradeLevel, u.avatar, u.classCode || null, JSON.stringify({ badges: u.badges, stats: u.stats, resources: u.resources, learner: u.learner }), u.createdAt);
}

/* ---------- missions ---------- */
function loadMission(id, uid) {
  const r = db.prepare('SELECT state FROM missions WHERE missionId = ? AND uid = ?').get(id, uid);
  return r ? JSON.parse(r.state) : null;
}
function saveMission(m) {
  db.prepare(`INSERT INTO missions (missionId, uid, subject, startedAt, endedAt, answered, correct, rapid, xp, survived, state) VALUES (?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(missionId) DO UPDATE SET endedAt=excluded.endedAt, answered=excluded.answered, correct=excluded.correct, rapid=excluded.rapid, xp=excluded.xp, survived=excluded.survived, state=excluded.state`)
    .run(m.missionId, m.uid, m.subject, m.startedAt, m.endedAt, m.answered, m.correct, m.rapid, m.xp, m.survived == null ? null : (m.survived ? 1 : 0), JSON.stringify(m));
}

/* ---------- http helpers ---------- */
function log(s) { console.log('[' + new Date().toISOString().slice(11, 19) + '] ' + s); }
function send(res, code, obj, headers) {
  const body = typeof obj === 'string' ? obj : JSON.stringify(obj);
  res.writeHead(code, Object.assign({ 'content-type': typeof obj === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8', 'cache-control': 'no-store' }, headers || {}));
  res.end(body);
}
class HttpError extends Error { constructor(code, msg) { super(msg); this.code = code; } }
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > 64 * 1024) { reject(new HttpError(413, 'body_too_large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { if (!chunks.length) return resolve({}); try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch (e) { reject(new HttpError(400, 'bad_json')); } });
    req.on('error', reject);
  });
}
const buckets = new Map();
function rateLimit(key, perMin) {
  const now = Date.now(); let b = buckets.get(key);
  if (!b || now - b.t > 60000) { b = { t: now, n: 0 }; buckets.set(key, b); }
  if (++b.n > perMin) throw new HttpError(429, 'rate_limited');
}
setInterval(() => { const now = Date.now(); for (const [k, b] of buckets) if (now - b.t > 120000) buckets.delete(k); }, 60000).unref();
function ip(req) { return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress; }
function requireUser(req) {
  const h = req.headers.authorization || '';
  const uid = auth.verifyToken(h.startsWith('Bearer ') ? h.slice(7) : '');
  const u = uid && loadUser(uid);
  if (!u) throw new HttpError(401, 'unauthorized');
  return u;
}
function cleanUsername(s) {
  s = String(s || '').trim();
  if (!/^[\p{L}\p{N}_.\-]{3,20}$/u.test(s)) throw new HttpError(400, 'bad_username');
  return s;
}
function cleanGrade(g) { g = parseInt(g, 10); if (!(g >= 7 && g <= 12)) throw new HttpError(400, 'bad_grade'); return g; }
const AVATARS = ['🧑‍🚀', '👩‍🚀', '👨‍🚀', '🤖', '👽', '🦊', '🐼', '🦉', '🐉', '🛸', '🌟', '🪐'];
function newUid() { return crypto.randomUUID(); }

/* ---------- routes ---------- */
const routes = [];
function route(method, pattern, handler) { routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), handler }); }

route('GET', '/api/health', () => ({ ok: true, version: VERSION, questions: Q.size, ai: tutor.provider() ? tutor.provider() + ':' + tutor.modelName(tutor.provider()) : null,
  google: GOOGLE_CLIENT_ID || null, model: Model ? { version: Model.version, aucCorrect: Model.correct.auc, aucDisengage: Model.disengage.auc } : null }));

route('GET', '/api/bank/stats', () => {
  const rows = db.prepare('SELECT subject, gradeLevel, conceptTag, difficulty, COUNT(*) AS n FROM questions WHERE active=1 GROUP BY subject, gradeLevel, conceptTag, difficulty').all();
  return { total: Q.size, rows };
});

route('POST', '/api/auth/signup', async (req) => {
  rateLimit('signup:' + ip(req), 60);   // a whole class often shares ONE public IP (school NAT), so this must be generous
  const b = await readBody(req);
  const username = cleanUsername(b.username);
  if (String(b.password || '').length < 6) throw new HttpError(400, 'weak_password');
  const role = b.role === 'teacher' ? 'teacher' : 'student';
  if (db.prepare('SELECT 1 FROM users WHERE username = ?').get(username)) throw new HttpError(409, 'username_taken');
  let classCode = String(b.classCode || '').trim().toUpperCase();
  if (classCode && !db.prepare('SELECT 1 FROM classes WHERE code = ?').get(classCode)) throw new HttpError(400, 'bad_class_code');
  const u = Service.newUser({ uid: newUid(), username, displayName: String(b.displayName || username).slice(0, 30), role, gradeLevel: cleanGrade(b.gradeLevel || 9),
    avatar: AVATARS.includes(b.avatar) ? b.avatar : AVATARS[Math.floor(Math.random() * 4)], classCode, now: Date.now() });
  const { hash, salt } = auth.hashPassword(b.password);
  insertUser(u, { passHash: hash, salt });
  return { token: auth.issueToken(u.uid), user: Service.publicUser(u) };
});

route('POST', '/api/auth/login', async (req) => {
  rateLimit('login-ip:' + ip(req), 200);
  const b = await readBody(req);
  rateLimit('login-user:' + String(b.username || '').trim().toLowerCase(), 10);   // password-guessing protection per account (not per IP)
  const r = db.prepare('SELECT uid, passHash, salt FROM users WHERE username = ?').get(String(b.username || '').trim());
  if (!r || !auth.checkPassword(b.password || '', r.passHash, r.salt)) throw new HttpError(401, 'bad_credentials');
  const u = loadUser(r.uid);
  if (b.gradeLevel && u.role === 'student') { u.gradeLevel = cleanGrade(b.gradeLevel); saveUser(u); }
  return { token: auth.issueToken(u.uid), user: Service.publicUser(u) };
});

route('POST', '/api/auth/google', async (req) => {
  rateLimit('google:' + ip(req), 200);
  const b = await readBody(req);
  let g; try { g = await auth.verifyGoogle(String(b.credential || ''), GOOGLE_CLIENT_ID); } catch (e) { throw new HttpError(e.message === 'google_not_configured' ? 501 : 401, e.message); }
  let r = db.prepare('SELECT uid FROM users WHERE googleSub = ?').get(g.sub);
  if (!r) {
    // privacy: never expose the real Google name publicly — use the chosen username, or a random pilot name
    let base = b.username ? cleanUsername(b.username) : 'pilot' + crypto.randomInt(1000, 9999);
    let name = base, i = 1;
    while (db.prepare('SELECT 1 FROM users WHERE username = ?').get(name)) name = base + '_' + (++i);
    const u = Service.newUser({ uid: newUid(), username: name, displayName: name, gradeLevel: cleanGrade(b.gradeLevel || 9), avatar: AVATARS[0], now: Date.now() });
    insertUser(u, { googleSub: g.sub, email: g.email });
    r = { uid: u.uid };
  }
  const u = loadUser(r.uid);
  if (b.gradeLevel && u.role === 'student') { u.gradeLevel = cleanGrade(b.gradeLevel); saveUser(u); }
  return { token: auth.issueToken(u.uid), user: Service.publicUser(u) };
});

route('GET', '/api/me', (req) => ({ user: Service.publicUser(requireUser(req)) }));
route('PATCH', '/api/me', async (req) => {
  const u = requireUser(req), b = await readBody(req);
  if (b.gradeLevel != null) u.gradeLevel = cleanGrade(b.gradeLevel);
  if (b.avatar && AVATARS.includes(b.avatar)) u.avatar = b.avatar;
  if (b.displayName) u.displayName = String(b.displayName).trim().slice(0, 30) || u.displayName;
  if (b.classCode != null) {
    const c = String(b.classCode).trim().toUpperCase();
    if (c && !db.prepare('SELECT 1 FROM classes WHERE code = ?').get(c)) throw new HttpError(400, 'bad_class_code');
    u.classCode = c;
  }
  saveUser(u); return { user: Service.publicUser(u) };
});

/* fetchQuestions(gradeLevel, subject, limit) — random sample for practice / previews.
   Students never receive the answer key; teachers do. */
route('GET', '/api/questions', (req, url) => {
  const u = requireUser(req);
  const subject = url.searchParams.get('subject') || 'math', grade = cleanGrade(url.searchParams.get('grade') || u.gradeLevel);
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10)));
  const diff = parseInt(url.searchParams.get('difficulty') || '0', 10);
  const rows = db.prepare('SELECT * FROM questions WHERE active=1 AND subject=? AND gradeLevel=? AND (?=0 OR difficulty=?) ORDER BY random() LIMIT ?').all(subject, grade, diff, diff, limit).map(rowToQuestion);
  return { questions: rows.map(q => u.role === 'teacher' ? q : Service.publicQuestion(q)) };
});

route('POST', '/api/missions', async (req) => {
  const u = requireUser(req), b = await readBody(req);
  const subject = ['math', 'science', 'english', 'arabic', 'mixed'].includes(b.subject) ? b.subject : 'mixed';
  const m = Service.startMission(u, { missionId: crypto.randomUUID(), subject, durationSec: parseInt(b.durationSec, 10) || 300 }, Date.now());
  saveMission(m); saveUser(u);
  return { mission: { missionId: m.missionId, subject: m.subject, durationSec: m.durationSec, startedAt: m.startedAt } };
});

route('POST', '/api/missions/:id/next', async (req, url, p) => {
  const u = requireUser(req), b = await readBody(req);
  const m = loadMission(p.id, u.uid); if (!m || m.endedAt) throw new HttpError(404, 'mission_not_found');
  const subj = b.subject && ['math', 'science', 'english', 'arabic'].includes(b.subject) && (m.subject === 'mixed' || m.subject === b.subject) ? b.subject : m.subject;
  const pool = poolFor(subj, u.gradeLevel);
  const r = Service.nextQuestion(u, m, pool, { focus: b.focus == null ? null : Number(b.focus), tabSwitches: Number(b.tabSwitches) || 0, sinceBreakMin: b.sinceBreakMin == null ? null : Number(b.sinceBreakMin) }, Model, Date.now());
  if (!r) throw new HttpError(404, 'no_questions');
  saveMission(m);
  return { question: Service.publicQuestion(r.q), predicted: r.predicted, risk: r.risk, riskThreshold: Model ? Model.disengage.threshold : 0.45, mastery: r.mastery, elo: r.elo,
    conceptAr: (Concepts.ALL[r.q.conceptTag] || {}).ar, expectedSec: Rules.expectedSeconds(r.q) };
});

const insAnswer = db.prepare('INSERT INTO answers (uid, missionId, questionId, conceptTag, subject, selected, correct, rapid, ms, hidden, xp, pBefore, masteryAfter, focus, ts) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
const updQ = db.prepare('UPDATE questions SET rating=?, ratingN=ratingN+1, answered=answered+1, correctCount=correctCount+? WHERE questionId=?');
const updQcount = db.prepare('UPDATE questions SET answered=answered+1, correctCount=correctCount+? WHERE questionId=?');
route('POST', '/api/missions/:id/answer', async (req, url, p) => {
  const u = requireUser(req), b = await readBody(req);
  rateLimit('ans:' + u.uid, 90);
  const m = loadMission(p.id, u.uid); if (!m || m.endedAt) throw new HttpError(404, 'mission_not_found');
  const q = Q.get(String(b.questionId)); if (!q) throw new HttpError(404, 'question_not_found');
  const sel = parseInt(b.selected, 10);
  if (!(sel === -1 || (sel >= 0 && sel < 4))) throw new HttpError(400, 'bad_selection');
  const now = Date.now();
  const r = Service.answer(u, m, q, { selected: sel, ms: Number(b.ms) || 0, hidden: !!b.hidden, idleMs: Number(b.idleMs) || 0, usedHint: !!b.usedHint }, now);
  if (r.error) throw new HttpError(409, r.error);
  db.exec('BEGIN');
  try {
    if (r.newQRating != null) { updQ.run(r.newQRating, r.correct ? 1 : 0, q.questionId); q.rating = r.newQRating; q.ratingN = (q.ratingN || 0) + 1; }
    else updQcount.run(r.correct ? 1 : 0, q.questionId);
    insAnswer.run(u.uid, m.missionId, q.questionId, q.conceptTag, q.subject, sel, r.correct ? 1 : 0, r.rapid ? 1 : 0, r.ms, b.hidden ? 1 : 0, r.xp, r.pBefore, r.mastery, r.focus, now);
    saveMission(m); saveUser(u);
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
  delete r.newQRating;
  return r;
});

route('POST', '/api/missions/:id/fifty', async (req, url, p) => {
  const u = requireUser(req), b = await readBody(req);
  const m = loadMission(p.id, u.uid); if (!m || m.endedAt) throw new HttpError(404, 'mission_not_found');
  const q = Q.get(String(b.questionId)); if (!q) throw new HttpError(404, 'question_not_found');
  const r = Service.fifty(m, q); if (r.error) throw new HttpError(409, r.error);
  saveMission(m); return r;
});

route('POST', '/api/missions/:id/end', async (req, url, p) => {
  const u = requireUser(req), b = await readBody(req);
  const m = loadMission(p.id, u.uid); if (!m) throw new HttpError(404, 'mission_not_found');
  const r = Service.endMission(u, m, { survived: !!b.survived }, Date.now());
  if (r.error) throw new HttpError(409, r.error);
  saveMission(m); saveUser(u);
  r.user = Service.publicUser(u);
  return r;
});

/* AI tutor — explanation after a wrong answer (cached per question+choice+grade) */
const tutorGet = db.prepare('SELECT text, provider FROM tutor_cache WHERE k = ?');
const tutorPut = db.prepare('INSERT OR REPLACE INTO tutor_cache (k, text, provider, createdAt) VALUES (?,?,?,?)');
route('POST', '/api/tutor', async (req) => {
  const u = requireUser(req), b = await readBody(req);
  const q = Q.get(String(b.questionId)); if (!q) throw new HttpError(404, 'question_not_found');
  const sel = parseInt(b.selected, 10);
  if (sel !== -1 && !(sel >= 0 && sel < 4)) throw new HttpError(400, 'bad_selection');
  const local = TutorLocal.explain(q, sel, u.gradeLevel);
  if (!tutor.provider()) return { text: local, provider: 'local', source: 'curriculum' };
  const key = q.questionId + ':' + sel + ':' + u.gradeLevel;
  const hit = tutorGet.get(key); if (hit) return { text: hit.text, provider: hit.provider, cached: true, fallback: local };
  try { rateLimit('tutor:' + u.uid, 20); } catch (e) { return { text: local, provider: 'local', source: 'rate_limited' }; }
  try {
    const r = await tutor.callLLM(TutorLocal.prompt(q, sel, u.gradeLevel), 300);
    if (!r.text) throw new Error('empty');
    tutorPut.run(key, r.text, r.provider, Date.now());
    return { text: r.text, provider: r.provider, fallback: local };
  } catch (e) { log('tutor fallback: ' + e.message); return { text: local, provider: 'local', source: 'llm_error' }; }
});
route('POST', '/api/tutor/ask', async (req) => {
  const u = requireUser(req), b = await readBody(req);
  const q = Q.get(String(b.questionId)); if (!q) throw new HttpError(404, 'question_not_found');
  const msg = String(b.message || '').trim().slice(0, 300); if (!msg) throw new HttpError(400, 'empty_message');
  // the SERVER decides whether the question is still unanswered (a client cannot claim otherwise)
  const m = b.missionId ? loadMission(String(b.missionId), u.uid) : null;
  const before = !!(m && !m.endedAt && m.served && m.served.id === q.questionId);
  if (!tutor.provider()) return { text: TutorLocal.askLocal(q, u.gradeLevel, before), provider: 'local', before };
  rateLimit('ask:' + u.uid, 12);
  try { const r = await tutor.callLLM(TutorLocal.followupPrompt(q, u.gradeLevel, msg, before), 350); return { text: r.text, provider: r.provider, before }; }
  catch (e) { return { text: TutorLocal.askLocal(q, u.gradeLevel, before), provider: 'local', before, source: 'llm_error' }; }
});

/* Leaderboards */
function lbRows(where, args, order) {
  return db.prepare(`SELECT username, displayName, avatar, totalXP, weeklyXP, currentLevel, gradeLevel FROM users WHERE role='student' ${where} ORDER BY ${order} DESC, createdAt ASC LIMIT 10`).all(...args);
}
route('GET', '/api/leaderboard/public', () => ({ top: lbRows('', [], 'totalXP').slice(0, 5) }));
route('GET', '/api/leaderboard', (req, url) => {
  const u = requireUser(req), scope = url.searchParams.get('scope') || 'global';
  let where = '', args = [], order = 'totalXP';
  if (scope === 'grade') { where = 'AND gradeLevel = ?'; args = [u.gradeLevel]; }
  else if (scope === 'class') { where = 'AND classCode = ?'; args = [u.classCode || '-']; }
  else if (scope === 'weekly') { where = 'AND weekKey = ?'; args = [Service.weekKey(Date.now())]; order = 'weeklyXP'; }
  const top = lbRows(where, args, order);
  const mine = order === 'weeklyXP' ? (u.weekKey === Service.weekKey(Date.now()) ? u.weeklyXP : 0) : u.totalXP;
  const rank = u.role === 'student' ? db.prepare(`SELECT COUNT(*) AS n FROM users WHERE role='student' ${where} AND ${order} > ?`).get(...args, mine).n + 1 : null;
  const total = db.prepare(`SELECT COUNT(*) AS n FROM users WHERE role='student' ${where}`).get(...args).n;
  return { scope, top, me: { rank, score: mine, total } };
});

route('GET', '/api/progress', (req) => {
  const u = requireUser(req);
  const recent = db.prepare('SELECT missionId, subject, startedAt, answered, correct, rapid, xp, survived FROM missions WHERE uid = ? AND endedAt IS NOT NULL ORDER BY startedAt DESC LIMIT 12').all(u.uid);
  const bySubject = db.prepare('SELECT subject, COUNT(*) AS n, SUM(correct) AS c, SUM(rapid) AS r FROM answers WHERE uid = ? GROUP BY subject').all(u.uid);
  const daily = db.prepare("SELECT date(ts/1000,'unixepoch') AS d, COUNT(*) AS n, SUM(correct) AS c, AVG(focus) AS f FROM answers WHERE uid = ? GROUP BY d ORDER BY d DESC LIMIT 14").all(u.uid);
  return Object.assign(Service.progress(u), { recent, bySubject, daily, user: Service.publicUser(u) });
});
route('GET', '/api/me/answers.csv', (req) => {
  const u = requireUser(req);
  const rows = db.prepare('SELECT ts, missionId, questionId, subject, conceptTag, selected, correct, rapid, ms, hidden, xp, pBefore, masteryAfter, focus FROM answers WHERE uid = ? ORDER BY ts').all(u.uid);
  return { __csv: toCsv(rows), __name: 'my-answers.csv' };
});

/* Teacher: classes */
function requireTeacher(req) { const u = requireUser(req); if (u.role !== 'teacher') throw new HttpError(403, 'teachers_only'); return u; }
route('POST', '/api/classes', async (req) => {
  const u = requireTeacher(req), b = await readBody(req);
  let code; do { code = crypto.randomBytes(4).toString('base64url').replace(/[-_]/g, 'X').slice(0, 6).toUpperCase(); } while (db.prepare('SELECT 1 FROM classes WHERE code=?').get(code));
  db.prepare('INSERT INTO classes (code, name, teacherUid, createdAt) VALUES (?,?,?,?)').run(code, String(b.name || 'فصلي').slice(0, 40), u.uid, Date.now());
  return { code };
});
route('GET', '/api/classes', (req) => {
  const u = requireTeacher(req);
  return { classes: db.prepare('SELECT c.code, c.name, c.createdAt, (SELECT COUNT(*) FROM users WHERE classCode = c.code) AS students FROM classes c WHERE teacherUid = ? ORDER BY createdAt DESC').all(u.uid) };
});
function ownClass(u, code) { const c = db.prepare('SELECT * FROM classes WHERE code = ? AND teacherUid = ?').get(code, u.uid); if (!c) throw new HttpError(404, 'class_not_found'); return c; }
route('GET', '/api/classes/:code', (req, url, p) => {
  const u = requireTeacher(req), c = ownClass(u, p.code);
  const studs = db.prepare("SELECT uid FROM users WHERE classCode = ? AND role='student'").all(c.code).map(r => loadUser(r.uid));
  const conceptAgg = {};
  const students = studs.map(s => {
    const pr = Service.progress(s);
    pr.concepts.forEach(k => { const a = conceptAgg[k.tag] = conceptAgg[k.tag] || { tag: k.tag, ar: k.ar, subject: k.subject, sum: 0, n: 0 }; a.sum += k.mastery; a.n++; });
    return { username: s.username, displayName: s.displayName, avatar: s.avatar, gradeLevel: s.gradeLevel, totalXP: s.totalXP, level: s.currentLevel, streakDays: s.streakDays,
      answered: s.stats.answered, accuracy: s.stats.answered ? s.stats.correct / s.stats.answered : null, rapidRate: s.stats.answered ? s.stats.rapid / s.stats.answered : null,
      focusAvg: pr.focusAvg, missions: s.stats.missions, weakest: pr.concepts.filter(k => k.attempts >= 2).slice(0, 3).map(k => k.ar), lastActive: s.lastActiveDay };
  });
  const concepts = Object.values(conceptAgg).map(a => ({ tag: a.tag, ar: a.ar, subject: a.subject, avgMastery: a.sum / a.n, students: a.n })).sort((a, b) => a.avgMastery - b.avgMastery);
  return { class: { code: c.code, name: c.name }, students, concepts };
});
route('GET', '/api/classes/:code/answers.csv', (req, url, p) => {
  const u = requireTeacher(req), c = ownClass(u, p.code);
  const rows = db.prepare('SELECT a.ts, u.username, a.missionId, a.questionId, a.subject, a.conceptTag, a.selected, a.correct, a.rapid, a.ms, a.hidden, a.xp, a.pBefore, a.masteryAfter, a.focus FROM answers a JOIN users u ON u.uid = a.uid WHERE u.classCode = ? ORDER BY a.ts').all(c.code);
  return { __csv: toCsv(rows), __name: 'class-' + c.code + '-answers.csv' };
});
function toCsv(rows) {
  if (!rows.length) return 'empty\n';
  const cols = Object.keys(rows[0]);
  const esc = v => v == null ? '' : /[",\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v);
  return '﻿' + cols.join(',') + '\n' + rows.map(r => cols.map(c => esc(r[c])).join(',')).join('\n') + '\n';
}

/* ---------- static files ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.webmanifest': 'application/manifest+json' };
const CSP = "default-src 'self'; script-src 'self' https://accounts.google.com/gsi/client; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com/gsi/style; " +
  "font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https://*.googleusercontent.com; connect-src 'self' https://accounts.google.com/gsi/; frame-src https://accounts.google.com/gsi/; base-uri 'self'; form-action 'self'";
function serveStatic(req, res, pathname) {
  if (pathname === '/') pathname = '/index.html';
  const file = path.normalize(path.join(PUB, decodeURIComponent(pathname)));
  if (!file.startsWith(PUB + path.sep)) return send(res, 403, 'forbidden');
  // allow-list: never serve server code, the database, the master question file or research data
  const rel = path.relative(PUB, file).split(path.sep).join('/');
  if (!/^(index\.html$|css\/|js\/|assets\/|data\/bank\/)/.test(rel)) return send(res, 404, 'not found');
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, 'not found');
    const ext = path.extname(file);
    res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream', 'content-length': st.size,
      'cache-control': /\/data\/bank\//.test(pathname) ? 'public, max-age=3600' : 'no-cache', 'x-content-type-options': 'nosniff', 'referrer-policy': 'same-origin',
      'content-security-policy': CSP, 'cross-origin-opener-policy': 'same-origin-allow-popups' });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (!url.pathname.startsWith('/api/')) return (req.method === 'GET' || req.method === 'HEAD') ? serveStatic(req, res, url.pathname) : send(res, 405, 'method not allowed');
  const r = routes.find(rt => rt.method === req.method && rt.re.test(url.pathname));
  if (!r) return send(res, 404, { error: 'not_found' });
  try {
    const out = await r.handler(req, url, url.pathname.match(r.re).groups || {});
    if (out && out.__csv != null) { res.writeHead(200, { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="' + out.__name + '"' }); return res.end(out.__csv); }
    send(res, 200, out);
  } catch (e) {
    if (e instanceof HttpError) return send(res, e.code, { error: e.message });
    log('ERROR ' + req.method + ' ' + url.pathname + ': ' + (e.stack || e));
    send(res, 500, { error: 'server_error' });
  }
});

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    log('Orbital Academy v' + VERSION + ' → http://localhost:' + PORT);
    log('AI tutor: ' + (tutor.provider() ? tutor.provider() + ' (' + tutor.modelName(tutor.provider()) + ')' : 'offline curriculum explainer (set GEMINI_API_KEY / OPENAI_API_KEY / ANTHROPIC_API_KEY to enable an LLM)'));
    log('Google sign-in: ' + (GOOGLE_CLIENT_ID ? 'enabled' : 'disabled (set GOOGLE_CLIENT_ID)'));
    log('ML model: ' + (Model ? 'loaded (' + Model.version + ')' : 'not found — using Elo only'));
  });
}
module.exports = { server, db };
