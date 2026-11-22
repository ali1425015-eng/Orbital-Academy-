/* SQLite storage (Node's built-in node:sqlite — no native modules to install).
   Tables: questions, users, missions, answers, tutor_cache, classes. */
'use strict';
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const DB_FILE = process.env.DB_FILE || path.join(DATA_DIR, 'orbital.db');

function open() {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  const db = new DatabaseSync(DB_FILE);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT);
    CREATE TABLE IF NOT EXISTS questions (
      questionId TEXT PRIMARY KEY, gradeLevel INTEGER NOT NULL, subject TEXT NOT NULL, difficulty INTEGER NOT NULL, difficultyLabel TEXT,
      questionText TEXT NOT NULL, options TEXT NOT NULL, correctOptionIndex INTEGER NOT NULL, conceptTag TEXT NOT NULL,
      explanation TEXT, optionNotes TEXT, lang TEXT, source TEXT,
      rating REAL, ratingN INTEGER NOT NULL DEFAULT 0, answered INTEGER NOT NULL DEFAULT 0, correctCount INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1);
    CREATE INDEX IF NOT EXISTS idx_q_sg ON questions(subject, gradeLevel, difficulty);
    CREATE INDEX IF NOT EXISTS idx_q_concept ON questions(conceptTag);
    CREATE TABLE IF NOT EXISTS users (
      uid TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE, displayName TEXT, passHash TEXT, salt TEXT,
      googleSub TEXT UNIQUE, email TEXT, role TEXT NOT NULL DEFAULT 'student', gradeLevel INTEGER NOT NULL DEFAULT 9, avatar TEXT, classCode TEXT,
      totalXP INTEGER NOT NULL DEFAULT 0, currentLevel INTEGER NOT NULL DEFAULT 1, weeklyXP INTEGER NOT NULL DEFAULT 0, weekKey TEXT,
      streakDays INTEGER NOT NULL DEFAULT 0, lastActiveDay TEXT, state TEXT NOT NULL, createdAt INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_users_xp ON users(totalXP DESC);
    CREATE INDEX IF NOT EXISTS idx_users_week ON users(weekKey, weeklyXP DESC);
    CREATE INDEX IF NOT EXISTS idx_users_class ON users(classCode);
    CREATE TABLE IF NOT EXISTS missions (
      missionId TEXT PRIMARY KEY, uid TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE, subject TEXT, startedAt INTEGER, endedAt INTEGER,
      answered INTEGER DEFAULT 0, correct INTEGER DEFAULT 0, rapid INTEGER DEFAULT 0, xp INTEGER DEFAULT 0, survived INTEGER, state TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_m_uid ON missions(uid, startedAt DESC);
    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT, uid TEXT NOT NULL, missionId TEXT, questionId TEXT NOT NULL, conceptTag TEXT, subject TEXT, selected INTEGER,
      correct INTEGER, rapid INTEGER, ms INTEGER, hidden INTEGER, xp INTEGER, pBefore REAL, masteryAfter REAL, focus REAL, ts INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_a_uid ON answers(uid, ts);
    CREATE TABLE IF NOT EXISTS tutor_cache (k TEXT PRIMARY KEY, text TEXT NOT NULL, provider TEXT, createdAt INTEGER);
    CREATE TABLE IF NOT EXISTS classes (code TEXT PRIMARY KEY, name TEXT, teacherUid TEXT NOT NULL, createdAt INTEGER);
  `);
  return db;
}

/* Loads data/questions.json into SQLite when the bank file changed. Keeps
   the calibrated ratings of questions that already exist. */
function seedQuestions(db, file) {
  file = file || path.join(DATA_DIR, 'questions.json');
  if (!fs.existsSync(file)) throw new Error('Question bank not found: ' + file + ' — run `npm run build`');
  const stat = fs.statSync(file);
  const sig = stat.size + ':' + Math.round(stat.mtimeMs);
  const row = db.prepare('SELECT v FROM meta WHERE k = ?').get('bank_sig');
  const count = db.prepare('SELECT COUNT(*) AS n FROM questions').get().n;
  if (row && row.v === sig && count > 0) return { seeded: false, count };
  const bank = JSON.parse(fs.readFileSync(file, 'utf8'));
  const up = db.prepare(`INSERT INTO questions (questionId, gradeLevel, subject, difficulty, difficultyLabel, questionText, options, correctOptionIndex, conceptTag, explanation, optionNotes, lang, source, active)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1)
    ON CONFLICT(questionId) DO UPDATE SET gradeLevel=excluded.gradeLevel, subject=excluded.subject, difficulty=excluded.difficulty, difficultyLabel=excluded.difficultyLabel,
      questionText=excluded.questionText, options=excluded.options, correctOptionIndex=excluded.correctOptionIndex, conceptTag=excluded.conceptTag,
      explanation=excluded.explanation, optionNotes=excluded.optionNotes, lang=excluded.lang, source=excluded.source, active=1,
      rating=CASE WHEN questions.questionText = excluded.questionText THEN questions.rating ELSE NULL END,
      ratingN=CASE WHEN questions.questionText = excluded.questionText THEN questions.ratingN ELSE 0 END`);
  db.exec('BEGIN');
  try {
    db.exec('UPDATE questions SET active = 0');
    for (const q of bank) up.run(q.questionId, q.gradeLevel, q.subject, q.difficulty, q.difficultyLabel, q.questionText, JSON.stringify(q.options), q.correctOptionIndex, q.conceptTag, q.explanation, JSON.stringify(q.optionNotes), q.lang, q.source);
    db.prepare('INSERT INTO meta (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v').run('bank_sig', sig);
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
  return { seeded: true, count: bank.length };
}

function rowToQuestion(r) {
  if (!r) return null;
  return Object.assign({}, r, { options: JSON.parse(r.options), optionNotes: r.optionNotes ? JSON.parse(r.optionNotes) : [] });
}

module.exports = { open, seedQuestions, rowToQuestion, DATA_DIR, DB_FILE };
