/* Tiny WebAudio synth — no audio files. */
(function (OA) {
  var ac = null;
  function ctx() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } } return ac; }
  function tone(f, d, type, vol, when, slide) {
    var a = ctx(); if (!a || !OA.U.settings.sound) return;
    var t = a.currentTime + (when || 0), o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + d + 0.02);
  }
  OA.Sound = {
    click: function () { tone(660, 0.06, 'triangle', 0.05); },
    good: function () { tone(660, 0.12, 'sine', 0.12); tone(990, 0.18, 'sine', 0.1, 0.09); },
    bad: function () { tone(180, 0.3, 'sawtooth', 0.07, 0, 110); },
    alarm: function () { tone(520, 0.18, 'square', 0.04); tone(390, 0.18, 'square', 0.04, 0.2); },
    level: function () { [523, 659, 784, 1046].forEach(function (f, i) { tone(f, 0.2, 'triangle', 0.09, i * 0.09); }); },
    tick: function () { tone(1200, 0.03, 'square', 0.02); },
    type: function () { tone(1400 + Math.random() * 300, 0.015, 'square', 0.012); },
    unlock: function () { var a = ctx(); if (a && a.state === 'suspended') a.resume(); }
  };
  document.addEventListener('pointerdown', function () { OA.Sound.unlock(); }, { once: true });
})(window.OA = window.OA || {});
