/* Passwords (scrypt), signed session tokens (HMAC-SHA256) and Google
   Sign-In ID-token verification. No external packages. */
'use strict';
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('./db');

const TOKEN_DAYS = 30;
let SECRET = process.env.AUTH_SECRET;
if (!SECRET) {
  const f = path.join(DATA_DIR, '.secret');
  try { SECRET = fs.readFileSync(f, 'utf8').trim(); } catch (e) { /* first run */ }
  if (!SECRET) { SECRET = crypto.randomBytes(48).toString('hex'); fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(f, SECRET, { mode: 0o600 }); }
}

function hashPassword(pw, salt) {
  salt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(pw), salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
  return { hash, salt };
}
function checkPassword(pw, hash, salt) {
  if (!hash || !salt) return false;
  const h = Buffer.from(hashPassword(pw, salt).hash, 'hex'), ref = Buffer.from(hash, 'hex');
  return h.length === ref.length && crypto.timingSafeEqual(h, ref);
}

const b64u = b => Buffer.from(b).toString('base64url');
function sign(data) { return crypto.createHmac('sha256', SECRET).update(data).digest('base64url'); }
function issueToken(uid) {
  const body = b64u(JSON.stringify({ uid, exp: Date.now() + TOKEN_DAYS * 86400000 }));
  return body + '.' + sign(body);
}
function verifyToken(tok) {
  if (!tok || typeof tok !== 'string' || tok.indexOf('.') < 0) return null;
  const [body, sig] = tok.split('.');
  const expect = sign(body);
  if (!sig || sig.length !== expect.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
  try { const p = JSON.parse(Buffer.from(body, 'base64url').toString()); return p.exp > Date.now() ? p.uid : null; } catch (e) { return null; }
}

/* Verifies a Google ID token with Google's tokeninfo endpoint. */
async function verifyGoogle(credential, clientId) {
  if (!clientId) throw new Error('google_not_configured');
  const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(credential), { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error('google_invalid');
  const p = await r.json();
  if (p.aud !== clientId) throw new Error('google_wrong_audience');
  if (!['accounts.google.com', 'https://accounts.google.com'].includes(p.iss)) throw new Error('google_wrong_issuer');
  if (Number(p.exp) * 1000 < Date.now()) throw new Error('google_expired');
  return { sub: p.sub, email: p.email, emailVerified: p.email_verified === 'true' || p.email_verified === true, name: p.given_name || p.name || 'Pilot', picture: p.picture };
}

module.exports = { hashPassword, checkPassword, issueToken, verifyToken, verifyGoogle };
