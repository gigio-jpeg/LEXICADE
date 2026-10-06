import { normalize } from "../core/rng.js";
export function clues(answer, guess) {
  const target = [...normalize(answer)],
    attempt = [...normalize(guess)];
  if (target.length !== attempt.length)
    throw new RangeError("Different lengths");
  const result = target.map((c, i) =>
    c === attempt[i] ? "correct" : "absent",
  );
  const remaining = new Map();
  target.forEach((c, i) => {
    if (result[i] !== "correct") remaining.set(c, (remaining.get(c) ?? 0) + 1);
  });
  attempt.forEach((c, i) => {
    if (result[i] === "correct") return;
    if ((remaining.get(c) ?? 0) > 0) {
      result[i] = "present";
      remaining.set(c, remaining.get(c) - 1);
    }
  });
  return result;
}
export function hardValid(guess, history) {
  const normalized = normalize(guess);
  return history.every(({ word, colors }) => {
    const counts = new Map();
    for (let i = 0; i < colors.length; i++) {
      const letter = normalize(word)[i];
      if (colors[i] === "correct" && normalized[i] !== letter) return false;
      if (colors[i] === "present" && normalized[i] === letter) return false;
      if (colors[i] !== "absent")
        counts.set(letter, (counts.get(letter) ?? 0) + 1);
    }
    return [...counts].every(
      ([c, count]) => [...normalized].filter((x) => x === c).length >= count,
    );
  });
}
export function decifraScore(attempts, solved, boards = 1) {
  return solved ? Math.max(100, (8 - attempts) * 150) * boards : 0;
}
