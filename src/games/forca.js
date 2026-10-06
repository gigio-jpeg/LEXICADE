import { normalize } from "../core/rng.js";
export function masked(word, guesses) {
  const normalized = normalize(word);
  return [...word]
    .map((c, i) => (guesses.includes(normalized[i]) ? c : "_"))
    .join(" ");
}
export function guessLetter(word, guesses, letter) {
  letter = normalize(letter);
  if (!/^[a-z]$/.test(letter) || guesses.includes(letter))
    return { valid: false, guesses, correct: false };
  const next = [...guesses, letter],
    answer = normalize(word);
  return {
    valid: true,
    guesses: next,
    correct: answer.includes(letter),
    solved: [...answer].every((c) => next.includes(c)),
  };
}
