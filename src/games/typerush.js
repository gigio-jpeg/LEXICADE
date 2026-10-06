import { normalize } from "../core/rng.js";
import { ppm, precision } from "../core/scoring.js";
export function compareText(target, typed, accents = false) {
  const a = accents ? target : normalize(target),
    b = accents ? typed : normalize(typed);
  let correct = 0,
    errors = 0;
  for (let i = 0; i < b.length; i++) b[i] === a[i] ? correct++ : errors++;
  return { correct, errors, complete: b === a };
}
export function typingMetrics(correct, errors, duration, level = 1) {
  return {
    ppm: ppm(correct, duration),
    precisao: precision(correct, errors),
    nivel_max: level,
    caracteres_certos: correct,
    erros: errors,
  };
}
export function survivalTime(remaining, correct) {
  return Math.max(0, Math.min(45, remaining + (correct ? 2 : -3)));
}
export function accelerationLevel(words) {
  return Math.min(12, 1 + Math.floor(words / 5));
}
