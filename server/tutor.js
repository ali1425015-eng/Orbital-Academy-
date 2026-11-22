/* AI Tutor — LLM integration with a safe offline fallback.
   The key never reaches the browser; it is read from environment variables on the server.

   FREE options (no card needed) — set ANY of these, the first working one is used:
     GROQ_API_KEY        → Groq        (free tier, very fast;   GROQ_MODEL,       default llama-3.3-70b-versatile)
     CEREBRAS_API_KEY    → Cerebras    (free tier;              CEREBRAS_MODEL,   default llama-3.3-70b)
     OPENROUTER_API_KEY  → OpenRouter  (free ":free" models;    OPENROUTER_MODEL, default meta-llama/llama-3.3-70b-instruct:free)
     GEMINI_API_KEY      → Google Gemini (free tier in many accounts; GEMINI_MODEL, default gemini-2.5-flash)
     MISTRAL_API_KEY     → Mistral     (free "Experiment" plan; MISTRAL_MODEL,    default mistral-small-latest)
   PAID / other:
     OPENAI_API_KEY (OPENAI_MODEL, OPENAI_BASE_URL) · ANTHROPIC_API_KEY (ANTHROPIC_MODEL)
   ANY OpenAI-compatible service: AI_API_KEY + AI_BASE_URL (e.g. https://host/v1) + AI_MODEL.
   AI_PROVIDER=<name> puts one first. If the first provider fails (quota, outage) the next configured one is tried,
   and if all fail the curriculum-based local explanation is returned — the game never breaks. */
'use strict';

const TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS || '15000', 10);
const env = n => (process.env[n] || '').trim();

/* name → { key env, default base URL, default model env/name } — all but gemini/anthropic speak the OpenAI chat protocol */
const OPENAI_STYLE = {
  groq:       { key: 'GROQ_API_KEY',       base: 'https://api.groq.com/openai/v1',     model: ['GROQ_MODEL', 'llama-3.3-70b-versatile'] },
  cerebras:   { key: 'CEREBRAS_API_KEY',   base: 'https://api.cerebras.ai/v1',         model: ['CEREBRAS_MODEL', 'llama-3.3-70b'] },
  openrouter: { key: 'OPENROUTER_API_KEY', base: 'https://openrouter.ai/api/v1',       model: ['OPENROUTER_MODEL', 'meta-llama/llama-3.3-70b-instruct:free'] },
  mistral:    { key: 'MISTRAL_API_KEY',    base: 'https://api.mistral.ai/v1',          model: ['MISTRAL_MODEL', 'mistral-small-latest'] },
  openai:     { key: 'OPENAI_API_KEY',     base: null,                                 model: ['OPENAI_MODEL', 'gpt-4o-mini'] },
  custom:     { key: 'AI_API_KEY',         base: null,                                 model: ['AI_MODEL', 'default'] }
};
const MODEL_OVERRIDE = {};
/* Lists the provider's models and picks a sensible chat model (big instruct models first; no audio/guard/embedding models). */
async function discoverModel(p, url, key, failed) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { authorization: 'Bearer ' + key } });
    if (!r.ok) return null;
    const ids = ((await r.json()).data || []).map(m => m.id).filter(id => id && id !== failed && !/whisper|guard|tts|embed|moderation|vision-preview|orpheus|playai|transcribe|safeguard/i.test(id));
    const pref = [/llama-3\.3-70b/i, /gpt-oss-120b/i, /llama-3\.1-70b/i, /llama.*70b/i, /gpt-oss-20b/i, /llama-3\.1-8b-instant/i, /llama.*(8b|instant)/i, /qwen/i];
    for (const re of pref) { const hit = ids.find(id => re.test(id)); if (hit) { console.error('[ai] ' + p + ': "' + failed + '" is gone → using "' + hit + '"'); return hit; } }
    return ids[0] || null;
  } catch (e) { return null; }
}
const ORDER = ['groq', 'cerebras', 'openrouter', 'gemini', 'mistral', 'custom', 'openai', 'anthropic'];   // free first

function configured() {
  const has = n => {
    if (n === 'gemini') return !!env('GEMINI_API_KEY');
    if (n === 'anthropic') return !!env('ANTHROPIC_API_KEY');
    if (n === 'custom') return !!env('AI_API_KEY') && !!env('AI_BASE_URL');
    return !!env(OPENAI_STYLE[n].key);
  };
  const list = ORDER.filter(has), forced = env('AI_PROVIDER').toLowerCase();
  if (forced && list.includes(forced)) return [forced].concat(list.filter(p => p !== forced));
  return list;
}
function provider() { return configured()[0] || null; }
function modelName(p) {
  if (p === 'gemini') return env('GEMINI_MODEL') || 'gemini-2.5-flash';
  if (p === 'anthropic') return env('ANTHROPIC_MODEL') || 'claude-haiku-5-5';
  const m = OPENAI_STYLE[p].model; return env(m[0]) || MODEL_OVERRIDE[p] || m[1];
}

function geminiConfig(model, maxTokens) {
  const gc = { maxOutputTokens: Math.max(maxTokens || 300, 600), temperature: 0.4 };
  if (/2\.5-flash/.test(model)) gc.thinkingConfig = { thinkingBudget: 0 };   // only models that support it
  return gc;
}

/* Turn an HTTP error into a readable message for the server log (the API key is never part of it). */
async function httpError(prefix, r) {
  let body = ''; try { body = (await r.text()).replace(/\s+/g, ' ').slice(0, 220); } catch (e) { /* ignore */ }
  return new Error(prefix + '_' + r.status + (body ? ': ' + body : ''));
}

async function callOne(p, prompt, maxTokens) {
  const signal = AbortSignal.timeout(TIMEOUT_MS), model = modelName(p);
  if (p === 'gemini') {
    const url = (env('GEMINI_BASE_URL') || 'https://generativelanguage.googleapis.com') + '/v1beta/models/' + encodeURIComponent(model) + ':generateContent';
    const r = await fetch(url, { method: 'POST', signal, headers: { 'content-type': 'application/json', 'x-goog-api-key': env('GEMINI_API_KEY') },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: geminiConfig(model, maxTokens) }) });
    if (!r.ok) throw await httpError('gemini', r);
    const j = await r.json();
    const text = (((j.candidates || [])[0] || {}).content || {}).parts;
    return { text: (text || []).map(x => x.text || '').join('').trim(), provider: 'gemini:' + model };
  }
  if (p === 'anthropic') {
    const url = (env('ANTHROPIC_BASE_URL') || 'https://api.anthropic.com') + '/v1/messages';
    const r = await fetch(url, { method: 'POST', signal, headers: { 'content-type': 'application/json', 'x-api-key': env('ANTHROPIC_API_KEY'), 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model, max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] }) });
    if (!r.ok) throw await httpError('anthropic', r);
    const j = await r.json();
    return { text: (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim(), provider: 'anthropic:' + model };
  }
  // OpenAI-compatible chat completions (Groq, Cerebras, OpenRouter, Mistral, OpenAI, any custom endpoint)
  const c = OPENAI_STYLE[p];
  const base = (env(p === 'custom' ? 'AI_BASE_URL' : p.toUpperCase() + '_BASE_URL') || c.base || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const url = /\/chat\/completions$/.test(base) ? base : (/\/v\d+$/.test(base) ? base : base + '/v1') + '/chat/completions';
  const r = await fetch(url, { method: 'POST', signal, headers: { 'content-type': 'application/json', authorization: 'Bearer ' + env(c.key) },
    body: JSON.stringify({ model, max_tokens: maxTokens, temperature: 0.4, messages: [{ role: 'user', content: prompt }] }) });
  if (!r.ok) {
    // the default model was retired/renamed by the provider → ask the provider which chat models it has now and retry once
    if ((r.status === 404 || r.status === 400) && !env(c.model[0])) {
      const alt = await discoverModel(p, url.replace(/\/chat\/completions$/, '/models'), env(c.key), model);
      if (alt) { MODEL_OVERRIDE[p] = alt; return callOne(p, prompt, maxTokens); }
    }
    throw await httpError(p, r);
  }
  const j = await r.json();
  const text = (((j.choices || [])[0] || {}).message || {}).content;
  if (!text) throw new Error(p + '_empty_reply');
  return { text: String(text).trim(), provider: p + ':' + model };
}

async function callLLM(prompt, maxTokens) {
  const list = configured();
  if (!list.length) throw new Error('no_provider');
  maxTokens = maxTokens || 300;
  let last = null;
  for (const p of list) {
    try { const r = await callOne(p, prompt, maxTokens); if (r.text) return r; last = new Error(p + '_empty_reply'); }
    catch (e) { last = e; console.error('[ai] ' + p + ' failed → ' + (list.length > 1 ? 'trying the next provider: ' : '') + e.message); }
  }
  throw last || new Error('ai_failed');
}

module.exports = { provider, modelName, callLLM, configured };
