#!/usr/bin/env node
/* Builds two single-file distributions into dist/:
   1. orbital-academy.html       — the whole app in ONE html file (offline mode):
                                    CSS + JS inlined, question bank gzip+base64 embedded.
   2. orbital-academy-server.js  — ONE node file containing the entire project
                                    (server, app, question bank, docs, research code).
                                    `node orbital-academy-server.js` extracts it next to
                                    itself (first run only) and starts the full server.
   Usage: node tools/bundle.js */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const ROOT = path.join(__dirname, '..');
const PUB = ROOT;   // the site lives at the repo root
const DIST = path.join(ROOT, 'dist');
const VERSION = require('../package.json').version;
fs.mkdirSync(DIST, { recursive: true });

/* ---------------- 1. single HTML ---------------- */
const safe = s => s.replace(/<\/script/gi, '<\\/script');
let html = fs.readFileSync(path.join(PUB, 'index.html'), 'utf8');
html = html.replace('<link rel="icon" href="assets/icon.svg" type="image/svg+xml">',
  '<link rel="icon" href="data:image/svg+xml;base64,' + fs.readFileSync(path.join(PUB, 'assets/icon.svg')).toString('base64') + '">');
const css = fs.readFileSync(path.join(PUB, 'css/app.css'), 'utf8').replace(/url\(\.\.\/assets\/([\w.-]+)\)/g, (m, f) => {
  const mime = /\.webp$/.test(f) ? 'image/webp' : /\.png$/.test(f) ? 'image/png' : /\.svg$/.test(f) ? 'image/svg+xml' : 'application/octet-stream';
  return 'url(data:' + mime + ';base64,' + fs.readFileSync(path.join(PUB, 'assets', f)).toString('base64') + ')';
});
html = html.replace('<link rel="stylesheet" href="css/app.css">', () => '<style>\n' + css + '\n</style>');

// question bank: every chunk → one gzip+base64 blob, decompressed in the browser on first use
const bankDir = path.join(PUB, 'data/bank');
const all = {};
const captured = {};
global.OA_BANK_LOAD = (k, rows) => { captured[k] = rows; };
for (const f of fs.readdirSync(bankDir)) {
  if (f === 'index.js') continue;
  new Function('OA_BANK_LOAD', fs.readFileSync(path.join(bankDir, f), 'utf8'))(global.OA_BANK_LOAD);
}
Object.assign(all, captured);
const packed = zlib.gzipSync(JSON.stringify(all), { level: 9 }).toString('base64');
const bankLoader = `
/* single-file build: the question bank is embedded (gzip + base64) */
(function (OA) {
  var B64 = "${packed}";
  var pack = null;
  function load() {
    if (pack) return pack;
    var bin = atob(B64), u = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    if (!window.DecompressionStream) { alert('هذا المتصفح قديم ولا يدعم فك ضغط بنك الأسئلة. استخدم Chrome أو Edge أو Firefox أو Safari حديثاً.'); return (pack = Promise.resolve({})); }
    var ds = new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'));
    pack = new Response(ds).text().then(JSON.parse);
    return pack;
  }
  OA.Bank.loadChunk = function (key) {
    if (OA.Bank.chunks[key]) return Promise.resolve(OA.Bank.chunks[key]);
    return load().then(function (all) { if (!OA.Bank.chunks[key]) window.OA_BANK_LOAD(key, all[key] || []); return OA.Bank.chunks[key]; });
  };
})(window.OA);
`;
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => {
  const code = fs.readFileSync(path.join(PUB, src), 'utf8');
  let out = '<script>/* ' + src + ' */\n' + safe(code) + '\n</script>';
  if (src === 'js/api.js') out += '\n<script>' + safe(bankLoader) + '</script>';
  return out;
});
if (/<script src=/.test(html)) throw new Error('unresolved script tag');
const htmlOut = path.join(DIST, 'orbital-academy.html');
fs.writeFileSync(htmlOut, html);

/* ---------------- 2. single server file ---------------- */
const SKIP = [/^dist\//, /^data\/orbital\.db/, /^data\/\.secret/, /^research\/sim-dataset\.csv$/, /^node_modules\//, /^\.env$/, /^\.git\//];
const files = {};
(function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const abs = path.join(dir, f), rel = path.relative(ROOT, abs).split(path.sep).join('/');
    if (SKIP.some(r => r.test(rel + (fs.statSync(abs).isDirectory() ? '/' : '')))) continue;
    if (fs.statSync(abs).isDirectory()) walk(abs);
    else files[rel] = fs.readFileSync(abs).toString('base64');
  }
})(ROOT);
const blob = zlib.gzipSync(JSON.stringify(files), { level: 9 }).toString('base64');
const launcher = `#!/usr/bin/env node
/* ==========================================================================
   ORBITAL ACADEMY v${VERSION} — single-file installer + launcher
   Requires Node.js >= 22.5. No npm install needed.

     node orbital-academy-server.js            → extract (first run) and start on http://localhost:8080
     PORT=3000 node orbital-academy-server.js  → another port
     GEMINI_API_KEY=... node orbital-academy-server.js   → enable the LLM tutor (or OPENAI_API_KEY / ANTHROPIC_API_KEY)
     GOOGLE_CLIENT_ID=... node orbital-academy-server.js → enable Google sign-in
     node orbital-academy-server.js --extract  → only unpack the full project (source, docs, research)
     node orbital-academy-server.js --test     → run the test suite
     node orbital-academy-server.js --demo     → add demo accounts (password demo1234)

   The project is unpacked into ./orbital-academy-app next to this file.
   Your database (orbital-academy-app/data/orbital.db) is never overwritten.
   ========================================================================== */
'use strict';
const VERSION = '${VERSION}';
const PACK = '${blob}';
const fs = require('fs'), path = require('path'), zlib = require('zlib'), { spawnSync, spawn } = require('child_process');
const [maj, min] = process.versions.node.split('.').map(Number);
if (maj < 22 || (maj === 22 && min < 5)) { console.error('Orbital Academy needs Node.js 22.5 or newer (you have ' + process.version + '). Download: https://nodejs.org'); process.exit(1); }
const DIR = process.env.OA_DIR || path.join(__dirname, 'orbital-academy-app');
const marker = path.join(DIR, '.bundle-version');
let current = null; try { current = fs.readFileSync(marker, 'utf8').trim(); } catch (e) {}
if (current !== VERSION + ':' + PACK.length) {
  console.log('Unpacking Orbital Academy v' + VERSION + ' → ' + DIR);
  const files = JSON.parse(zlib.gunzipSync(Buffer.from(PACK, 'base64')).toString('utf8'));
  for (const rel of Object.keys(files)) {
    const out = path.join(DIR, rel);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, Buffer.from(files[rel], 'base64'));
  }
  fs.writeFileSync(marker, VERSION + ':' + PACK.length);
  console.log('  ' + Object.keys(files).length + ' files ready.');
}
const arg = process.argv[2] || '';
const node = (script) => spawnSync(process.execPath, ['--no-warnings=ExperimentalWarning', path.join(DIR, script)], { stdio: 'inherit', cwd: DIR, env: process.env }).status;
if (arg === '--extract') { console.log('Done. Open ' + DIR + '/README.md'); process.exit(0); }
if (arg === '--test') process.exit(node('tests/test-bank.js') || node('tests/test-api.js'));
if (arg === '--demo') process.exit(node('tools/demo-seed.js'));
const child = spawn(process.execPath, ['--no-warnings=ExperimentalWarning', path.join(DIR, 'server/server.js')], { stdio: 'inherit', cwd: DIR, env: process.env });
child.on('exit', c => process.exit(c || 0));
for (const s of ['SIGINT', 'SIGTERM']) process.on(s, () => child.kill(s));
`;
const srvOut = path.join(DIST, 'orbital-academy-server.js');
fs.writeFileSync(srvOut, launcher);
const mb = f => (fs.statSync(f).size / 1e6).toFixed(1) + ' MB';
console.log('dist/orbital-academy.html        ' + mb(htmlOut) + '  (open in a browser — offline mode, ' + Object.values(all).reduce((a, r) => a + r.length, 0) + ' questions)');
console.log('dist/orbital-academy-server.js   ' + mb(srvOut) + '  (node orbital-academy-server.js — full server, ' + Object.keys(files).length + ' files inside)');
