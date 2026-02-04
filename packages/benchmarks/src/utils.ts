export function zipfKeys(n: number, skew = 1.2) {
  const keys = Array.from({ length: n }, (_, i) => i);
  const weights = keys.map((k) => 1 / Math.pow(k + 1, skew));
  const sum = weights.reduce((a, b) => a + b, 0);
  const probs = weights.map((w) => w / sum);

  return () => {
    let r = Math.random();
    for (let i = 0; i < probs.length; i++) {
      r -= probs[i];
      if (r <= 0) return keys[i];
    }
    return keys[keys.length - 1];
  };
}

export function randomKeys(n: number) {
  return () => Math.floor(Math.random() * n);
}
