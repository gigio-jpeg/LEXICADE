import { normalize } from "../core/rng.js";
export function validateRhyme(word, group, used) {
  const value = normalize(word);
  if (used.map(normalize).includes(value)) return "used";
  if (!group.map(normalize).includes(value)) return "invalid";
  return "valid";
}
export const rhymeScore = (word, combo) =>
  word.length * 35 + Math.min(200, combo * 15);
