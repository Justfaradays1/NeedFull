// WHAT: Deterministic pseudo-random generator for the Studio.
// WHY:  Every render must be frame-identical — confetti, avatar hues,
//       shimmer patterns, cursor wobble all use this. No Math.random in
//       any composition code.

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededRange(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min);
}

export function seededInt(rng: Rng, min: number, max: number): number {
  return Math.floor(seededRange(rng, min, max + 1));
}
