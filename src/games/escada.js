import { normalize } from "../core/rng.js";
export function oneApart(a, b) {
  a = normalize(a);
  b = normalize(b);
  return (
    a.length === b.length && [...a].filter((c, i) => c !== b[i]).length === 1
  );
}
export function shortestPath(start, target, words) {
  start = normalize(start);
  target = normalize(target);
  if (start.length !== target.length) return null;
  const pool = new Set(
    words.map(normalize).filter((w) => w.length === start.length),
  );
  pool.add(target);
  const queue = [start],
    previous = new Map([[start, null]]);
  const buckets = new Map();
  for (const w of new Set([start, ...pool]))
    for (let i = 0; i < w.length; i++) {
      const pattern = w.slice(0, i) + "*" + w.slice(i + 1);
      const group = buckets.get(pattern) ?? [];
      group.push(w);
      buckets.set(pattern, group);
    }
  for (let at = 0; at < queue.length; at++) {
    const word = queue[at];
    if (word === target) {
      const path = [];
      let cur = word;
      while (cur != null) {
        path.unshift(cur);
        cur = previous.get(cur);
      }
      return path;
    }
    for (let i = 0; i < word.length; i++) {
      const pattern = word.slice(0, i) + "*" + word.slice(i + 1);
      for (const next of buckets.get(pattern) ?? [])
        if (!previous.has(next)) {
          previous.set(next, word);
          queue.push(next);
        }
      buckets.delete(pattern);
    }
  }
  return null;
}
