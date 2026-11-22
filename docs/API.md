# REST API

All endpoints are JSON. Authenticated endpoints need `Authorization: Bearer <token>` (returned by signup/login/google).

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | – | version, question count, AI provider, Google client id, ML model AUCs |
| GET | `/api/bank/stats` | – | counts per subject/grade/concept/difficulty |
| POST | `/api/auth/signup` | – | `{username, password, gradeLevel (7–12, or 0 = learning track), role?: 'student'|'teacher', classCode?, displayName?, avatar?}` → `{token, user}` |
| POST | `/api/auth/login` | – | `{username, password, gradeLevel?}` → `{token, user}` |
| POST | `/api/auth/google` | – | `{credential (Google ID token), gradeLevel?}` → `{token, user}` (501 if `GOOGLE_CLIENT_ID` not set) |
| GET / PATCH | `/api/me` | ✓ | read / update `gradeLevel, avatar, displayName, classCode` |
| GET | `/api/questions?subject&grade&limit&difficulty&lang` | ✓ | `fetchQuestions` — random sample; students never receive `correctOptionIndex` |
| POST | `/api/missions` | ✓ | `{subject, mode: 'time'|'count', durationSec (time) or target (count, 5–50)}` → mission. School grades: `math|science|english|arabic`; learning track (grade 0): `iq|lenglish|lscience|lmath`. The subject is fixed for the whole mission. |
| POST | `/api/missions/:id/next` | ✓ | `{focus, tabSwitches, sinceBreakMin, lang: 'ar'|'en'}` (lang picks the question pool — every subject has an Arabic and an English pool; Arabic grammar only exists in `ar`; 409 `mission_complete` when a count mission is done) → adaptive question + `predicted`, `risk`, `riskThreshold`, `mastery` |
| POST | `/api/missions/:id/answer` | ✓ | `{questionId, selected (-1 = timeout), ms, hidden, usedHint}` → `{correct, correctOptionIndex, explanation, note, xp, combo, focus, mastery, rapid, badges...}` |
| POST | `/api/missions/:id/fifty` | ✓ | `{questionId}` → `{remove:[i,j]}` (server picks two wrong options, ½ XP) |
| POST | `/api/missions/:id/end` | ✓ | `{survived}` → bonus, level, rank, new badges, summary |
| POST | `/api/tutor` | ✓ | `{questionId, selected, lang}` → `{text, provider}` (LLM, cached; falls back to the curriculum explainer) |
| POST | `/api/tutor/ask` | ✓ | `{questionId, message, missionId, lang}` → follow-up answer (LLM only) |
| GET | `/api/leaderboard/public` | – | top 5 (login screen) |
| GET | `/api/leaderboard?scope=global|grade|class|weekly` | ✓ | top 10 + my rank |
| GET | `/api/progress` | ✓ | Elo per subject, BKT mastery per concept, reviews due, badges, recent missions, daily activity |
| GET | `/api/me/answers.csv` | ✓ | my answer log |
| POST / GET | `/api/classes` | teacher | create a class (`{name}` → `{code}`) / list mine |
| GET | `/api/classes/:code` | teacher | students (XP, accuracy, focus, rapid-guess rate, weakest concepts) + class concept mastery |
| GET | `/api/classes/:code/answers.csv` | teacher | full answer log for research |

Anti-cheat rules (in `js/shared/service.js`): an answer is accepted only for the question the server last served in that mission, once; client response time is capped by the server-measured time; rapid guesses earn 0 XP; "survived" requires ≥90% of the mission time and ≥3 answers; the completion bonus scales with the fraction of the mission actually flown.
