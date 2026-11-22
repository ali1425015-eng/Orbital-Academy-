#!/usr/bin/env node
/* ==========================================================================
   Simulated-learner study (agent-based). Uses the REAL question bank and the
   REAL adaptive/focus code from js/shared.

   Each virtual student has hidden (true) state the system cannot see:
     θ_c      ability per concept           ~ N(μ, 0.8), μ ~ N(0, 0.7)
     α        learning rate                 ~ U(0.04, 0.12)
     e0       attentional control           ~ U(0.25, 0.95)
     φ        fatigue rate per minute       ~ U(0.03, 0.09)
   Answer model:
     disengaged with p = σ(−4.4 + 2.6(1−e0) + 1.6·φ·tFatigue + 0.35·consecWrong + 0.7·tooHard)
       (calibrated so rapid-guess rates fall in the 5–30% band reported for low-stakes tests)
       → rapid guess, 0.6–1.5 s, 25% correct, no learning, may leave the tab
     else P(correct) = 0.2 + 0.75·σ(θ_c − b_true), log-normal response time
   Learning (assumption, stated in the report): after an engaged answer
     θ_c += α · exp(−(θ_c − b)²/2) · (correct ? 0.6 : 0.35 + 0.25·explanation + 0.15·tutor)
   Forgetting between daily sessions: θ_c ← θ_c − 0.08(θ_c − θ0_c).

   Modes:
     node ml/simulate.js dataset 2500   → research/sim-dataset.csv (ML training data)
     node ml/simulate.js ablation 800   → research/ablation.json   (policy comparison)
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const RNG = require('../js/shared/rng.js');
const A = require('../js/shared/adaptive.js');
const R = require('../js/shared/rules.js');
const ROOT = path.join(__dirname, '..');
const bank = require(path.join(ROOT, 'data', 'questions.json')).map(q => ({
  id: q.questionId, subject: q.subject, grade: q.gradeLevel, difficulty: q.difficulty, conceptTag: q.conceptTag,
  questionText: q.questionText, options: q.options
}));
let MODEL = null;
try { MODEL = require(path.join(ROOT, 'js', 'shared', 'model-weights.js')); if (!MODEL || !MODEL.correct) MODEL = null; } catch (e) { MODEL = null; }

const SUBJ = ['math', 'science', 'english', 'arabic'];
// sensitivity parameters (see report): width of the "learning zone" and extra effect of the LLM tutor
const ZONE = parseFloat(process.env.SIM_ZONE || '1');
const TUTOR = parseFloat(process.env.SIM_TUTOR || '0.15');
const pools = {};
for (const s of SUBJ) for (let g = 7; g <= 12; g++) pools[s + g] = bank.filter(q => q.subject === s && q.grade === g);   // same rule as the app: the student's OWN grade only

const sig = x => 1 / (1 + Math.exp(-x));
const TRUE_B = {};
function trueB(q, rng, g) { if (TRUE_B[q.id] == null) TRUE_B[q.id] = { 1: -0.9, 2: 0, 3: 0.9 }[q.difficulty] + new RNG('b' + q.id).normal(0, 0.5); return TRUE_B[q.id] + 0.55 * (q.grade - g); }

const POLICIES = {
  random: { select: 'random', explanation: false, tutor: false, focus: false },
  elo: { select: 'elo', explanation: true, tutor: false, focus: false },
  elo_sr: { select: 'full', explanation: true, tutor: false, focus: false, model: false },
  elo_sr_focus: { select: 'full', explanation: true, tutor: false, focus: true, model: false },
  full: { select: 'full', explanation: true, tutor: true, focus: true, model: true }
};

function makeStudent(rng, id) {
  const g = rng.int(7, 12), mu = rng.normal(0, 0.7);
  return { id, grade: g, mu, theta: {}, theta0: {}, alpha: 0.04 + rng.next() * 0.08, e0: 0.25 + rng.next() * 0.7, phi: 0.03 + rng.next() * 0.06 };
}
function th(st, tag, rng) { if (st.theta[tag] == null) { st.theta[tag] = st.mu + rng.normal(0, 0.8); st.theta0[tag] = st.theta[tag]; } return st.theta[tag]; }

function testScore(st, subjects, rng) {
  // true probability of solving a medium, on-grade question, averaged over the concepts in the student's pools
  let s = 0, n = 0;
  for (const sub of subjects) {
    const tags = new Set(pools[sub + st.grade].map(q => q.conceptTag));
    tags.forEach(t => { s += sig(th(st, t, rng)); n++; });
  }
  return n ? s / n : 0;
}

/* Runs one student through `days` daily sessions under a policy.
   onAnswer(row) receives the observable log row (for the ML dataset). */
function runStudent(st, policyName, rng, days, onAnswer) {
  const P = POLICIES[policyName];
  const L = A.newLearner(st.grade);
  const subjects = rng.shuffle(SUBJ).slice(0, 2);
  const pre = testScore(st, subjects, rng);
  const tot = { answers: 0, correct: 0, rapid: 0, engagedAnswers: 0, breaks: 0 };
  let clockMin = 0;
  for (let day = 0; day < days; day++) {
    // forgetting overnight
    Object.keys(st.theta).forEach(t => { st.theta[t] -= 0.08 * (st.theta[t] - st.theta0[t]); });
    clockMin = day * 24 * 60;
    const subj = subjects[day % 2], pool = pools[subj + st.grade];
    let t = 0, tFat = 0, sinceBreak = 0, focus = 1, tabs = 0, lastSortie = 0, lastBreak = 0, sinceAns = 0;
    const exclude = {};
    const SESSION = 15 * 60;
    while (t < SESSION) {
      const ctx = { focus, sessionMin: t / 60, tabSwitches: tabs, sinceBreakMin: sinceBreak / 60 };
      // focus protocol: proactive micro-break when the disengagement model says risk is high
      if (P.focus) {
        // same rule as the game (js/ui/mission.js): 20-s guided break when the
        // disengagement model flags risk (or focus is low), at most every 90 s and after ≥4 answers;
        // missions are short sorties, modelled as a 30-s pause every 5 minutes.
        const risk = A.disengageRisk(L, null, ctx, P.model ? MODEL : null);
        const thr = P.model && MODEL ? MODEL.disengage.threshold : 0.45;
        const high = ((risk >= thr && focus < 0.8) || focus < 0.5) && sinceAns >= 4 && t - lastBreak >= 90;
        if (high || t - lastSortie >= 5 * 60) {
          const len = high ? 20 : 30;
          t += len; tFat *= high ? 0.5 : 0.6; sinceBreak = 0; lastBreak = t; sinceAns = 0; if (!high) lastSortie = t; focus = Math.min(1, focus + 0.25); tot.breaks++;
          continue;
        }
      }
      const q = A.select(L, pool, { exclude, nowMin: clockMin + t / 60, rng: () => rng.next(), model: P.model ? MODEL : null, ctx, policy: P.select, sample: 60 });
      exclude[q.id] = true;
      const featC = A.features(L, q, ctx), featD = A.disFeatures(L, q, ctx);
      const theta = th(st, q.conceptTag, rng), b = trueB(q, rng, st.grade);
      const tooHard = theta - b < -1.2 ? 1 : 0;
      const pDis = sig(-4.4 + 2.6 * (1 - st.e0) + st.phi * (tFat / 60) * 1.6 + 0.35 * Math.min(L.consecWrong, 4) + 0.7 * tooHard);
      const dis = rng.next() < pDis;
      let correct, ms, hidden = false;
      if (dis) { correct = rng.next() < 0.25; ms = 600 + rng.next() * 900; hidden = rng.next() < 0.5; if (hidden) tabs++; }
      else {
        correct = rng.next() < 0.2 + 0.75 * sig(theta - b);
        ms = 1000 * R.expectedSeconds(q) * Math.exp(rng.normal(-0.15, 0.35)) * (1 + 0.15 * Math.max(0, b - theta));
      }
      const rapid = R.isRapid(q, ms);
      onAnswer && onAnswer({ sid: st.id, f: featC, d: featD, correct: correct ? 1 : 0, rapid: rapid ? 1 : 0 });
      // learning
      if (!dis) {
        const w = Math.exp(-Math.pow(theta - b, 2) / (2 * ZONE * ZONE));
        const gain = correct ? 0.6 : 0.35 + (P.explanation ? 0.25 : 0) + (P.tutor ? TUTOR : 0);
        st.theta[q.conceptTag] = theta + st.alpha * w * gain;
        tot.engagedAnswers++;
      }
      A.record(L, q, { correct, rapid, nowMin: clockMin + t / 60 });
      focus = R.updateFocus(focus, { rapid, hidden, timeout: false });
      const spent = ms / 1000 + 4 + (!correct && P.explanation ? (P.tutor ? 14 : 8) : 0);
      t += spent; tFat += spent; sinceBreak += spent;
      tot.answers++; tot.correct += correct ? 1 : 0; tot.rapid += rapid ? 1 : 0; sinceAns++;
    }
  }
  const post = testScore(st, subjects, rng);
  return { pre, post, gain: post - pre, ...tot };
}

function meanCI(xs) {
  const n = xs.length, m = xs.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(xs.reduce((a, b) => a + (b - m) * (b - m), 0) / (n - 1));
  return { mean: m, sd, ci95: 1.96 * sd / Math.sqrt(n), n };
}

const mode = process.argv[2] || 'ablation';
const N = parseInt(process.argv[3] || (mode === 'dataset' ? '2500' : '800'), 10);
fs.mkdirSync(path.join(ROOT, 'research'), { recursive: true });

if (mode === 'dataset') {
  const out = fs.openSync(path.join(ROOT, 'research', 'sim-dataset.csv'), 'w');
  fs.writeSync(out, ['student', 'split'].concat(A.FEATURES, A.DIS_FEATURES.map(x => 'd_' + x), ['correct', 'rapid', 'next_rapid']).join(',') + '\n');
  let rows = 0;
  for (let i = 0; i < N; i++) {
    const rng = new RNG('ds-' + i), st = makeStudent(rng, i);
    const split = i % 5 === 0 ? 'test' : 'train';
    const log = [];
    runStudent(st, rng.chance(0.5) ? 'elo_sr' : (rng.chance(0.5) ? 'random' : 'elo'), rng, 4, r => log.push(r));
    let buf = '';
    for (let k = 0; k < log.length; k++) {
      const r = log[k], nxt = log[k + 1] ? log[k + 1].rapid : 0;
      buf += [r.sid, split].concat(r.f.map(v => +v.toFixed(4)), r.d.map(v => +v.toFixed(4)), [r.correct, r.rapid, nxt]).join(',') + '\n';
    }
    fs.writeSync(out, buf); rows += log.length;
  }
  fs.closeSync(out);
  console.log('Dataset: ' + N + ' simulated students, ' + rows + ' answers → research/sim-dataset.csv');
} else {
  const res = { students: N, days: 6, sessionMinutes: 15, modelLoaded: !!MODEL, zone: ZONE, tutorBoost: TUTOR, policies: {} };
  for (const p of Object.keys(POLICIES)) {
    const gains = [], acc = [], rapid = [], eng = [], ans = [], brk = [];
    for (let i = 0; i < N; i++) {
      const rng = new RNG('ab-' + i); // same students for every policy (paired design)
      const st = makeStudent(rng, i);
      const r = runStudent(st, p, new RNG('ab-run-' + i + '-' + p), 6);
      gains.push(r.gain); acc.push(r.correct / r.answers); rapid.push(r.rapid / r.answers); eng.push(r.engagedAnswers); ans.push(r.answers); brk.push(r.breaks);
    }
    res.policies[p] = { gain: meanCI(gains), accuracy: meanCI(acc), rapidRate: meanCI(rapid), engagedAnswers: meanCI(eng), answers: meanCI(ans), breaks: meanCI(brk), gains };
    console.log(p.padEnd(14), 'learning gain', (res.policies[p].gain.mean * 100).toFixed(2) + ' pts ±' + (res.policies[p].gain.ci95 * 100).toFixed(2),
      '| accuracy', (res.policies[p].accuracy.mean * 100).toFixed(1) + '%', '| rapid guesses', (res.policies[p].rapidRate.mean * 100).toFixed(1) + '%',
      '| engaged answers', res.policies[p].engagedAnswers.mean.toFixed(0));
  }
  // paired comparison vs random (difference of gains, same students)
  res.paired = {};
  for (const p of Object.keys(POLICIES)) if (p !== 'random') {
    const d = res.policies[p].gains.map((g, i) => g - res.policies.random.gains[i]);
    const s = meanCI(d), tstat = s.mean / (s.sd / Math.sqrt(s.n));
    const d2 = res.policies[p].gains.map((g, i) => g - res.policies.elo.gains[i]), s2 = meanCI(d2);
    res.paired[p] = { vsRandom: { diff: s.mean, ci95: s.ci95, t: tstat, cohen_dz: s.mean / s.sd }, vsElo: { diff: s2.mean, ci95: s2.ci95, t: s2.mean / (s2.sd / Math.sqrt(s2.n)) } };
  }
  Object.values(res.policies).forEach(v => delete v.gains);
  const outName = process.env.SIM_OUT || 'ablation.json';
  fs.writeFileSync(path.join(ROOT, 'research', outName), JSON.stringify(res, null, 2));
  console.log('→ research/' + outName);
}
