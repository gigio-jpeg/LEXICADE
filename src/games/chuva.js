export function fallWords(words, dt, height = 400) {
  const falling = words.map((w) => ({ ...w, y: w.y + w.speed * dt }));
  return {
    remaining: falling.filter((w) => w.y < height - 20),
    missed: falling.filter((w) => w.y >= height - 20),
  };
}
export function specialEffect(kind, words, hit) {
  if (kind === "gold") return { words: [], life: 0, slow: 0 };
  if (kind === "freeze") return { words, life: 0, slow: 5 };
  if (kind === "heart") return { words, life: 1, slow: 0 };
  if (kind === "bomb")
    return {
      words: words.filter((w) => Math.hypot(w.x - hit.x, w.y - hit.y) > 120),
      life: 0,
      slow: 0,
    };
  return { words, life: 0, slow: 0 };
}
