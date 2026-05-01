// Tiny seeded PRNG (mulberry32). Keeps wave generation deterministic per run
// — matters if we ever want to replay-validate runs server-side. Returns a
// closure that mutates the seed and returns floats in [0, 1).

export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return function rand(): number {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pure variant — returns next float and the new state. Useful inside `tick`
 * which keeps seed in `RunState.rngState` for reproducibility. */
export function nextFloat(state: number): { value: number; state: number } {
  let t = (state + 0x6d2b79f5) >>> 0;
  let r = t;
  r = Math.imul(r ^ (r >>> 15), r | 1);
  r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
  const value = ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  return { value, state: t };
}
