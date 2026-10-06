import { normalize, shuffle } from "../core/rng.js";
export const isOdd = (choice, answer) =>
  normalize(choice) === normalize(answer);
export const timeLimit = (round) =>
  Math.max(2, 8 - Math.floor(round / 3) * 0.5);
export const options = (group, random) => shuffle(group.words, random);
