> **للنشر أونلاين على رابط واحد اقرأ [`DEPLOY.md`](DEPLOY.md).**

# Setup & deployment

## 1. Local (laptop / school lab server)
```bash
node --version        # must be ≥ 22.13 (built-in SQLite, no flag needed)
npm start             # http://localhost:8080
```
Students on the same Wi-Fi open `http://<laptop-ip>:8080`.

## 2. Environment variables (`.env.example`)
| Variable | Purpose |
|---|---|
| `PORT` | default 8080 |
| `AUTH_SECRET` | token signing secret (auto-generated into `data/.secret` if empty) |
| `GEMINI_API_KEY` / `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | enables the LLM tutor (first one found is used; `AI_PROVIDER` forces one) |
| `GEMINI_MODEL`, `OPENAI_MODEL`, `ANTHROPIC_MODEL` | override the default models (`gemini-2.5-flash`, `gpt-4o-mini`, `claude-haiku-5-5`) |
| `GOOGLE_CLIENT_ID` | enables "Sign in with Google" (create an OAuth *Web* client in Google Cloud Console, add your site to *Authorized JavaScript origins*) |
| `DB_FILE` | SQLite path (default `data/orbital.db`) |

Node does not read `.env` files by itself; use `node --env-file=.env server/server.js` (Node ≥ 20.6) or export the variables.

## 3. Cloud hosting (online leaderboard for many schools)
Any host that runs Node 22 works (Render, Railway, Fly.io, a VPS). Start command `npm start`, persistent disk mounted at `data/`. Put it behind HTTPS (Google Sign-In requires it).

## 4. Static only (GitHub Pages)
Upload the repository (the site is at the root: `index.html`, `css/`, `js/`, `assets/`, `data/bank/`). With no `/api` available the app switches to **offline mode** automatically (accounts, XP and leaderboard live in each browser; tutor = curriculum explainer). Good for a demo link; use the server for a real class.

## 5. Updating the question bank
Edit or add a generator in `generator/`, then:
```bash
npm run build      # regenerate + validate every question
npm start          # the server re-seeds SQLite automatically when the bank changes (keeps calibrated difficulty ratings)
```
