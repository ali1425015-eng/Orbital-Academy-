/* Seeded RNG (mulberry32) — same output in Node and the browser, so the
   question bank and every simulation are reproducible. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.OA = root.OA || {}).RNG = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  function RNG(seed) {
    var s = (typeof seed === 'string') ? hash(seed) : (seed >>> 0);
    this.next = function () {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  RNG.prototype.int = function (a, b) { return a + Math.floor(this.next() * (b - a + 1)); };
  RNG.prototype.pick = function (arr) { return arr[Math.floor(this.next() * arr.length)]; };
  RNG.prototype.chance = function (p) { return this.next() < p; };
  RNG.prototype.shuffle = function (arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(this.next() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  };
  RNG.prototype.normal = function (mu, sd) {
    var u = 1 - this.next(), v = this.next();
    return (mu || 0) + (sd == null ? 1 : sd) * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  RNG.hash = hash;
  return RNG;
});
