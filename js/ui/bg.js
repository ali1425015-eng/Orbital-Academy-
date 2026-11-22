/* Animated star field: 3 parallax layers, twinkle, occasional shooting star.
   Pauses when the tab is hidden; static when reduced motion is requested. */
(function (OA) {
  var cv = document.getElementById('space'), ctx = cv.getContext('2d');
  var stars = [], shooters = [], W = 0, H = 0, dpr = 1, last = 0;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2); W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.round(W * H / 2600); stars = [];
    for (var i = 0; i < n; i++) {
      var layer = Math.random() < 0.7 ? 0 : Math.random() < 0.8 ? 1 : 2;
      stars.push({ x: Math.random() * W, y: Math.random() * H, r: [0.6, 1.1, 1.7][layer] * (0.6 + Math.random() * 0.6), v: [2, 6, 12][layer], p: Math.random() * 6.28, hue: Math.random() < 0.15 ? 'rgba(180,200,255,' : Math.random() < 0.1 ? 'rgba(255,220,190,' : 'rgba(255,255,255,' });
    }
    draw(0);
  }
  function draw(dt) {
    ctx.clearRect(0, 0, W, H);
    var still = OA.U && OA.U.settings.reduceMotion;
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      if (!still) { s.x -= s.v * dt; if (s.x < -2) { s.x = W + 2; s.y = Math.random() * H; } s.p += dt * (0.8 + s.v * 0.1); }
      var a = 0.45 + 0.45 * Math.sin(s.p);
      ctx.fillStyle = s.hue + a.toFixed(2) + ')';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
      if (s.r > 1.6) { ctx.fillStyle = s.hue + (a * 0.15).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 3.2, 0, 6.283); ctx.fill(); }
    }
    if (!still && Math.random() < dt * 0.12) shooters.push({ x: Math.random() * W * 0.8 + W * 0.2, y: Math.random() * H * 0.4, vx: -520, vy: 220, life: 1 });
    for (var j = shooters.length - 1; j >= 0; j--) {
      var m = shooters[j]; m.x += m.vx * dt; m.y += m.vy * dt; m.life -= dt * 1.1;
      if (m.life <= 0) { shooters.splice(j, 1); continue; }
      var g = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 0.18, m.y - m.vy * 0.18);
      g.addColorStop(0, 'rgba(255,255,255,' + m.life + ')'); g.addColorStop(1, 'rgba(120,200,255,0)');
      ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x - m.vx * 0.18, m.y - m.vy * 0.18); ctx.stroke();
    }
  }
  function loop(t) {
    var dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
    if (!document.hidden) draw(dt);
    requestAnimationFrame(loop);
  }
  window.addEventListener('resize', resize);
  resize(); requestAnimationFrame(loop);
})(window.OA = window.OA || {});
