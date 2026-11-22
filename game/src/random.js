// Ember Duel — deterministic seeded random numbers (mulberry32).
// One seed drives every shuffle, draw and rival choice, so the same seed
// always replays the same duel — the screenshot scenes depend on it.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer in [0, n) from the seeded stream. */
export function rollInt(rng, n) {
  return Math.floor(rng() * n);
}
