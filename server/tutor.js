/* AI Tutor — LLM integration with a safe offline fallback.
   Provider is chosen by env vars (the key never reaches the browser):
     GEMINI_API_KEY     → Google Gemini   (GEMINI_MODEL,    default gemini-2.5-flash)
     OPENAI_API_KEY     → OpenAI          (OPENAI_MODEL,    default gpt-4o-mini; OPENAI_BASE_URL optional)
     ANTHROPIC_API_KEY  → Anthropic Claude(ANTHROPIC_MODEL, default claude-haiku-5-5)
   AI_PROVIDER=gemini|openai|anthropic forces one when several keys exist.
   Any error/timeout → the curriculum-based local explanation is returned. */
'use strict';

const TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS || '15000', 10);

function provider() {
  const forced = (process.env.AI_PROVIDER || '').toLowerCase();
  const has = { gemini: !!process.env.GEMINI_API_KEY, openai: !!process.env.OPENAI_API_KEY, anthropic: !!process.env.ANTHROPIC_API_KEY };
  if (forced && has[forced]) return forced;
  return ['gemini', 'openai', 'anthropic'].find(p => has[p]) || null;
}
function modelName(p) {
  return p === 'gemini' ? (process.env.GEMINI_MODEL || 'gemini-2.5-flash') : p === 'openai' ? (process.env.OPENAI_MODEL || 'gpt-4o-mini') : (process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5');
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

async function callLLM(prompt, maxTokens) {
  const p = provider();
  if (!p) throw new Error('no_provider');
  const signal = AbortSignal.timeout(TIMEOUT_MS);
  const model = modelName(p);
  maxTokens = maxTokens || 300;
  if (p === 'gemini') {
    const url = (process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com') + '/v1beta/models/' + encodeURIComponent(model) + ':generateContent';
    const r = await fetch(url, { method: 'POST', signal, headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: geminiConfig(model, maxTokens) }) });
    if (!r.ok) throw await httpError('gemini', r);
    const j = await r.json();
    const text = (((j.candidates || [])[0] || {}).content || {}).parts;
    return { text: (text || []).map(x => x.text || '').join('').trim(), provider: 'gemini:' + model };
  }
  if (p === 'openai') {
    const url = (process.env.OPENAI_BASE_URL || 'https://api.openai.com') + '/v1/chat/completions';
    const r = await fetch(url, { method: 'POST', signal, headers: { 'content-type': 'application/json', authorization: 'Bearer ' + process.env.OPENAI_API_KEY },
      body: JSON.stringify({ model, max_tokens: maxTokens, temperature: 0.4, messages: [{ role: 'user', content: prompt }] }) });
    if (!r.ok) throw await httpError('openai', r);
    const j = await r.json();
    return { text: ((j.choices || [])[0] || {}).message.content.trim(), provider: 'openai:' + model };
  }
  const url = (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com') + '/v1/messages';
  const r = await fetch(url, { method: 'POST', signal, headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model, max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] }) });
  if (!r.ok) throw await httpError('anthropic', r);
  const j = await r.json();
  return { text: (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim(), provider: 'anthropic:' + model };
}

module.exports = { provider, modelName, callLLM };
