import { normalize, shuffle } from "../core/rng.js";
export function canBuild(word, letters) {
  const bag = [...normalize(letters)];
  return [...normalize(word)].every((c) => {
    const i = bag.indexOf(c);
    if (i < 0) return false;
    bag.splice(i, 1);
    return true;
  });
}
export function scramble(word, random = Math.random) {
  const letters = [...normalize(word)];
  for (let i = 0; i < 15; i++) {
    const mixed = shuffle(letters, random).join("");
    if (mixed !== normalize(word)) return mixed;
  }
  return [...letters.slice(1), letters[0]].join("");
}
export function anagramScore(word) {
  return normalize(word).length * 60 + (normalize(word).length === 6 ? 200 : 0);
}
