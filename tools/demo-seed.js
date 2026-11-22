/* Creates CLEARLY-LABELLED demo accounts (demo_*) with simulated play history,
   so a leaderboard and a teacher dashboard can be shown at a fair/presentation.
   They play real missions through the real Service code with simulated answers.
   Never run this on a production server with real students.
   Usage: npm run demo-seed            (password for every demo account: demo1234) */
'use strict';
const path = require('path');
const crypto = require('crypto');
const { open, seedQuestions, rowToQuestion } = require('../server/db');
const auth = require('../server/auth');
const PUB = path.join(__dirname, '..', 'js', 'shared');
const Service = require(path.join(PUB, 'service.js'));
const RNG = require(path.join(PUB, 'rng.js'));
let Model = null; try { Model = require(path.join(PUB, 'model-weights.js')); } catch (e) { }

const db = open(); seedQuestions(db);
const all = db.prepare('SELECT * FROM questions WHERE active=1').all().map(rowToQuestion);
const rng = new RNG('demo-seed');
const NAMES = [['demo_nour', 'نور (تجريبي)', '👩‍🚀'], ['demo_omar', 'عمر (تجريبي)', '🧑‍🚀'], ['demo_salma', 'سلمى (تجريبي)', '🦊'], ['demo_youssef', 'يوسف (تجريبي)', '🤖'],
  ['demo_mariam', 'مريم (تجريبي)', '🦉'], ['demo_ali', 'علي (تجريبي)', '🐉'], ['demo_hana', 'هنا (تجريبي)', '🌟'], ['demo_karim', 'كريم (تجريبي)', '👽']];

if (db.prepare("SELECT 1 FROM users WHERE username = 'demo_teacher'").get()) { console.log('demo accounts already exist'); process.exit(0); }
const { hash, salt } = auth.hashPassword('demo1234');
const t = Service.newUser({ uid: crypto.randomUUID(), username: 'demo_teacher', displayName: 'أ. هدى (تجريبي)', role: 'teacher', gradeLevel: 10, now: Date.now() });
db.prepare(`INSERT INTO users (uid, username, displayName, passHash, salt, role, gradeLevel, avatar, totalXP, currentLevel, weeklyXP, weekKey, streakDays, lastActiveDay, state, createdAt) VALUES (?,?,?,?,?,?,?,?,0,1,0,'',0,'',?,?)`)
  .run(t.uid, t.username, t.displayName, hash, salt, 'teacher', 10, '👩‍🏫', JSON.stringify({ badges: [], stats: t.stats, resources: t.resources, learner: t.learner }), t.createdAt);
const code = 'DEMO10';
db.prepare('INSERT OR IGNORE INTO classes (code, name, teacherUid, createdAt) VALUES (?,?,?,?)').run(code, 'فصل تجريبي 1/3 ثانوي', t.uid, Date.now());

const insA = db.prepare('INSERT INTO answers (uid, missionId, questionId, conceptTag, subject, selected, correct, rapid, ms, hidden, xp, pBefore, masteryAfter, focus, ts) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
for (const [username, display, avatar] of NAMES) {
  const skill = rng.normal(0.4, 0.7), attention = 0.4 + rng.next() * 0.55;
  const u = Service.newUser({ uid: crypto.randomUUID(), username, displayName: display, gradeLevel: 10, avatar, classCode: code, now: Date.now() - 10 * 86400000 });
  const missions = rng.int(3, 9);
  let clock = Date.now() - missions * 86400000;
  const h = auth.hashPassword('demo1234');
  db.exec('BEGIN');
  db.prepare(`INSERT INTO users (uid, username, displayName, passHash, salt, role, gradeLevel, avatar, classCode, totalXP, currentLevel, weeklyXP, weekKey, streakDays, lastActiveDay, state, createdAt) VALUES (?,?,?,?,?,?,?,?,?,0,1,0,'',0,'','{}',?)`)
    .run(u.uid, username, display, h.hash, h.salt, 'student', 10, avatar, code, u.createdAt);
  for (let k = 0; k < missions; k++) {
    const subject = rng.pick(['math', 'science', 'english', 'arabic']);
    const m = Service.startMission(u, { missionId: crypto.randomUUID(), subject, durationSec: 300 }, clock);
    const pool = all.filter(q => q.subject === subject && Math.abs(q.gradeLevel - 10) <= 1);
    for (let i = 0; i < rng.int(10, 18); i++) {
      const r = Service.nextQuestion(u, m, pool, { focus: m.focus }, Model, clock, () => rng.next());
      const q = r.q, p = 0.2 + 0.75 / (1 + Math.exp(-(skill - (q.difficulty - 2) * 0.9)));
      const rapidGuess = rng.next() > attention + 0.35;
      const correct = rapidGuess ? rng.next() < 0.25 : rng.next() < p;
      const sel = correct ? q.correctOptionIndex : (q.correctOptionIndex + rng.int(1, 3)) % 4;
      const ms = rapidGuess ? 900 : rng.int(6000, 25000);
      clock += ms + 3000;
      const res = Service.answer(u, m, q, { selected: sel, ms }, clock);
      insA.run(u.uid, m.missionId, q.questionId, q.conceptTag, q.subject, sel, res.correct ? 1 : 0, res.rapid ? 1 : 0, res.ms, 0, res.xp, res.pBefore, res.mastery, res.focus, clock);
    }
    clock = m.startedAt + 300 * 1000 + 1000;
    Service.endMission(u, m, { survived: rng.next() < 0.7 }, clock);
    db.prepare('INSERT INTO missions (missionId, uid, subject, startedAt, endedAt, answered, correct, rapid, xp, survived, state) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
      .run(m.missionId, u.uid, m.subject, m.startedAt, m.endedAt, m.answered, m.correct, m.rapid, m.xp, m.survived ? 1 : 0, JSON.stringify(m));
    clock += 86400000;
  }
  db.prepare('UPDATE users SET totalXP=?, currentLevel=?, weeklyXP=?, weekKey=?, streakDays=?, lastActiveDay=?, state=? WHERE uid=?')
    .run(u.totalXP, u.currentLevel, u.weeklyXP, u.weekKey, u.streakDays, u.lastActiveDay, JSON.stringify({ badges: u.badges, stats: u.stats, resources: u.resources, learner: u.learner }), u.uid);
  db.exec('COMMIT');
  console.log('  ' + username.padEnd(14) + ' ' + String(u.totalXP).padStart(5) + ' XP, ' + missions + ' missions');
}
console.log('Demo accounts ready (password demo1234). Teacher: demo_teacher, class code ' + code);
