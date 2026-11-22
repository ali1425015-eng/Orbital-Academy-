/* End-to-end API test: real server, temporary database, and a mock
   OpenAI-compatible LLM so the AI-tutor integration is exercised without a key. */
'use strict';
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');
const assert = require('assert');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'oa-test-'));
process.env.DB_FILE = path.join(tmp, 'test.db');
process.env.AUTH_SECRET = 'test-secret-' + Math.random();

let lastPrompt = '';
const mock = http.createServer((req, res) => {
  let b = ''; req.on('data', c => b += c); req.on('end', () => {
    const j = JSON.parse(b); lastPrompt = j.messages[0].content;
    assert.strictEqual(req.headers.authorization, 'Bearer test-key');
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ choices: [{ message: { content: 'يا قائد، شرح تجريبي من النموذج.' } }] }));
  });
});

let pass = 0;
function ok(name) { pass++; console.log('  ✔ ' + name); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  await new Promise(r => mock.listen(0, '127.0.0.1', r));
  // mock of Google's tokeninfo endpoint
  const GCLIENT = 'test-client.apps.googleusercontent.com';
  const gmock = http.createServer((req, res) => {
    const tok = new URL(req.url, 'http://x').searchParams.get('id_token');
    const base = { iss: 'https://accounts.google.com', sub: 'sub-' + tok, email: 'real.name@example.com', email_verified: 'true', given_name: 'Ahmed', exp: String(Math.floor(Date.now() / 1000) + 3600) };
    if (tok === 'good' || tok === 'good2') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify(Object.assign(base, { aud: GCLIENT, sub: tok === 'good' ? 'sub-fixed' : 'sub-two' }))); }
    if (tok === 'wrongaud') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify(Object.assign(base, { aud: 'someone-else.apps.googleusercontent.com' }))); }
    if (tok === 'expired') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify(Object.assign(base, { aud: GCLIENT, exp: '1000' }))); }
    res.writeHead(400, { 'content-type': 'application/json' }); res.end('{"error":"invalid_token"}');
  });
  await new Promise(r => gmock.listen(0, '127.0.0.1', r));
  process.env.GOOGLE_CLIENT_ID = GCLIENT;
  process.env.GOOGLE_TOKENINFO_URL = 'http://127.0.0.1:' + gmock.address().port + '/tokeninfo';
  process.env.OPENAI_API_KEY = 'test-key';
  process.env.OPENAI_BASE_URL = 'http://127.0.0.1:' + mock.address().port;
  const { server, db } = require('../server/server.js');
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const call = async (method, p, body, token) => {
    const r = await fetch(base + p, { method, headers: Object.assign({ 'content-type': 'application/json' }, token ? { authorization: 'Bearer ' + token } : {}), body: body ? JSON.stringify(body) : undefined });
    const ct = r.headers.get('content-type') || '';
    return { status: r.status, body: ct.includes('json') ? await r.json() : await r.text() };
  };
  try {
    let r = await call('GET', '/api/health');
    assert.strictEqual(r.status, 200); assert.ok(r.body.questions > 10000); assert.ok(r.body.ai.startsWith('openai')); ok('health: ' + r.body.questions + ' questions, AI ' + r.body.ai);

    r = await call('POST', '/api/auth/signup', { username: 'nour_7', password: 'secret12', gradeLevel: 10 });
    assert.strictEqual(r.status, 200); const tok = r.body.token; ok('signup');
    r = await call('POST', '/api/auth/signup', { username: 'NOUR_7', password: 'secret12', gradeLevel: 10 });
    assert.strictEqual(r.status, 409); ok('duplicate username rejected (case-insensitive)');
    r = await call('POST', '/api/auth/login', { username: 'nour_7', password: 'wrong' }); assert.strictEqual(r.status, 401); ok('wrong password rejected');
    r = await call('POST', '/api/auth/login', { username: 'nour_7', password: 'secret12' }); assert.strictEqual(r.status, 200); ok('login');
    for (let i = 0; i < 12; i++) r = await call('POST', '/api/auth/login', { username: 'guess_me', password: 'x' + i });
    assert.strictEqual(r.status, 429); r = await call('POST', '/api/auth/login', { username: 'nour_7', password: 'secret12' }); assert.strictEqual(r.status, 200);
    ok('password guessing on one account is rate-limited (429) without affecting other accounts on the same IP');
    for (let i = 0; i < 25; i++) { r = await call('POST', '/api/auth/signup', { username: 'class_kid' + i, password: 'secret12', gradeLevel: 9 }); assert.strictEqual(r.status, 200, 'signup ' + i + ' -> ' + r.status); }
    ok('25 students can sign up from the same IP within a minute (school network)');
    r = await call('GET', '/api/me', null, 'forged.token'); assert.strictEqual(r.status, 401); ok('forged token rejected');
    r = await call('GET', '/api/health'); assert.strictEqual(r.body.google, GCLIENT); ok('health exposes the Google client id (the login screen then shows the Google button)');
    r = await call('POST', '/api/auth/google', { credential: 'garbage' }); assert.strictEqual(r.status, 401); ok('Google: invalid token rejected');
    r = await call('POST', '/api/auth/google', { credential: 'wrongaud' }); assert.strictEqual(r.status, 401); ok('Google: token issued for a different app rejected');
    r = await call('POST', '/api/auth/google', { credential: 'expired' }); assert.strictEqual(r.status, 401); ok('Google: expired token rejected');
    r = await call('POST', '/api/auth/google', { credential: 'good', gradeLevel: 8 }); assert.strictEqual(r.status, 200); const gUser = r.body.user;
    assert.ok(/^pilot\d{4}$/.test(gUser.username), 'random pilot username, got ' + gUser.username); assert.ok(!JSON.stringify(gUser).includes('Ahmed') && !JSON.stringify(gUser).includes('real.name'), 'real name/email never exposed'); assert.strictEqual(gUser.gradeLevel, 8);
    ok('Google: new account created with a random pilot name (' + gUser.username + ') — real name & email not exposed');
    r = await call('POST', '/api/auth/google', { credential: 'good' }); assert.strictEqual(r.body.user.uid, gUser.uid); ok('Google: same Google account → same user (no duplicates)');
    r = await call('POST', '/api/auth/google', { credential: 'good2', gradeLevel: 9, username: 'sara_9' }); assert.strictEqual(r.body.user.username, 'sara_9'); ok('Google: chosen username used for a second account');
    r = await call('GET', '/api/leaderboard/public'); assert.ok(!JSON.stringify(r.body).includes('Ahmed')); ok('public leaderboard never shows the Google real name');

    r = await call('GET', '/api/questions?subject=math&grade=10&limit=5', null, tok);
    assert.strictEqual(r.body.questions.length, 5); assert.strictEqual(r.body.questions[0].correctOptionIndex, undefined); ok('fetchQuestions hides the answer key from students');

    r = await call('POST', '/api/missions', { subject: 'math', durationSec: 120 }, tok); const mid = r.body.mission.missionId; ok('mission started');
    // every served question must belong to the student's own grade (10) — 120 draws across all subjects
    r = await call('POST', '/api/missions', { subject: 'mixed', durationSec: 120 }, tok); const gm = r.body.mission.missionId; const seenSubj = new Set();
    for (let i = 0; i < 120; i++) { const sub = ['math', 'science', 'english', 'arabic'][i % 4]; r = await call('POST', '/api/missions/' + gm + '/next', { subject: sub }, tok); assert.strictEqual(r.body.question.gradeLevel, 10, 'served grade ' + r.body.question.gradeLevel); assert.strictEqual(r.body.question.subject, sub); seenSubj.add(r.body.question.subject); }
    assert.strictEqual(seenSubj.size, 4); ok('120 questions across 4 chosen subjects — all from grade 10 only');
    r = await call('POST', '/api/missions/' + mid + '/next', { focus: 1, tabSwitches: 0 }, tok);
    let q = r.body.question; assert.ok(q && q.options.length === 4 && q.correctOptionIndex === undefined); assert.ok(r.body.predicted > 0 && r.body.predicted < 1);
    ok('adaptive next question (predicted P=' + r.body.predicted.toFixed(2) + ', concept ' + r.body.conceptAr + ')');
    const correctIdx = db.prepare('SELECT correctOptionIndex FROM questions WHERE questionId=?').get(q.questionId).correctOptionIndex;
    // AI chat BEFORE answering: the prompt must forbid revealing the answer and must not contain it
    r = await call('POST', '/api/tutor/ask', { questionId: q.questionId, message: 'ممكن تشرح لي الفكرة؟', missionId: mid }, tok);
    assert.strictEqual(r.body.before, true); assert.ok(r.body.text.includes('شرح')); assert.ok(/NEVER reveal/.test(lastPrompt)); assert.ok(!lastPrompt.includes('correct answer is'));
    ok('AI chat before answering: server marks it "before", prompt forbids revealing the answer');
    // rapid guess: instant answer → correct but no XP
    r = await call('POST', '/api/missions/' + mid + '/answer', { questionId: q.questionId, selected: correctIdx, ms: 400 }, tok);
    assert.strictEqual(r.body.correct, true); assert.strictEqual(r.body.rapid, true); assert.strictEqual(r.body.xp, 0); ok('rapid guess detected → 0 XP');
    r = await call('POST', '/api/missions/' + mid + '/answer', { questionId: q.questionId, selected: correctIdx, ms: 9000 }, tok);
    assert.strictEqual(r.status, 409); ok('cannot answer the same served question twice');
    r = await call('POST', '/api/missions/' + mid + '/next', { focus: 0.9 }, tok); q = r.body.question;
    await sleep(2600);
    const ci = db.prepare('SELECT correctOptionIndex FROM questions WHERE questionId=?').get(q.questionId).correctOptionIndex;
    r = await call('POST', '/api/missions/' + mid + '/answer', { questionId: q.questionId, selected: ci, ms: 60000 }, tok);
    assert.strictEqual(r.body.correct, true); assert.ok(r.body.ms <= 2600 + 1600, 'client time clamped to server time'); assert.ok(r.body.xp > 0 || r.body.rapid);
    ok('correct answer: +' + r.body.xp + ' XP, mastery ' + r.body.mastery.toFixed(2) + ' (client time clamped to ' + r.body.ms + ' ms)');
    r = await call('POST', '/api/missions/' + mid + '/next', {}, tok); q = r.body.question;
    const wrong = (db.prepare('SELECT correctOptionIndex FROM questions WHERE questionId=?').get(q.questionId).correctOptionIndex + 1) % 4;
    await sleep(1700);
    r = await call('POST', '/api/missions/' + mid + '/answer', { questionId: q.questionId, selected: wrong, ms: 5000 }, tok);
    assert.strictEqual(r.body.correct, false); assert.ok(r.body.note); ok('wrong answer returns the misconception note');
    r = await call('POST', '/api/tutor', { questionId: q.questionId, selected: wrong }, tok);
    assert.ok(r.body.provider.startsWith('openai')); assert.ok(r.body.text.includes('شرح تجريبي')); assert.ok(lastPrompt.includes('grade 10') && lastPrompt.includes('The student answered'));
    ok('AI tutor called the LLM with the curriculum prompt');
    r = await call('POST', '/api/tutor', { questionId: q.questionId, selected: wrong }, tok); assert.strictEqual(r.body.cached, true); ok('tutor answer cached');
    mock.close(); process.env.OPENAI_BASE_URL = 'http://127.0.0.1:1';
    r = await call('POST', '/api/tutor', { questionId: q.questionId, selected: (wrong + 1) % 4 === ci ? (wrong + 2) % 4 : (wrong + 1) % 4 }, tok);
    assert.strictEqual(r.body.provider, 'local'); assert.ok(r.body.text.includes('الإجابة الصحيحة')); ok('LLM down → offline curriculum explanation');

    r = await call('POST', '/api/missions/' + mid + '/end', { survived: true }, tok);
    assert.strictEqual(r.body.survived, false, 'instant finish is not "survived"'); assert.ok(r.body.badges.includes('first_mission')); ok('mission end: anti-farming survived check, badge first_mission');

    r = await call('GET', '/api/leaderboard?scope=global', null, tok); assert.strictEqual(r.body.top[0].username, 'nour_7'); assert.strictEqual(r.body.me.rank, 1); ok('leaderboard + my rank');
    r = await call('GET', '/api/progress', null, tok); assert.ok(r.body.concepts.length >= 1); ok('progress: ' + r.body.concepts.length + ' concepts tracked');

    r = await call('POST', '/api/auth/signup', { username: 'ms_hoda', password: 'teacher1', role: 'teacher', gradeLevel: 10 }); const tt = r.body.token;
    r = await call('POST', '/api/classes', { name: '1/3 ثانوي' }, tt); const code = r.body.code; assert.ok(/^[A-Z0-9]{6}$/.test(code)); ok('teacher created class ' + code);
    r = await call('POST', '/api/classes', { name: 'x' }, tok); assert.strictEqual(r.status, 403); ok('students cannot create classes');
    r = await call('PATCH', '/api/me', { classCode: code }, tok); assert.strictEqual(r.body.user.classCode, code); ok('student joined class');
    r = await call('GET', '/api/classes/' + code, null, tt); assert.strictEqual(r.body.students.length, 1); ok('teacher dashboard: ' + r.body.students.length + ' student, ' + r.body.concepts.length + ' concepts');
    r = await call('GET', '/api/classes/' + code + '/answers.csv', null, tt); assert.ok(r.body.includes('username') && r.body.includes('nour_7')); ok('class CSV export');
    console.log('\nAll ' + pass + ' API checks passed ✔');
  } catch (e) { console.error('FAILED after ' + pass + ' checks:', e); process.exitCode = 1; }
  finally { server.close(); try { mock.close(); gmock.close(); } catch (e) {} db.close(); fs.rmSync(tmp, { recursive: true, force: true }); }
})();
