export const threshold = (level) => Math.round(100 * Math.max(1, level) ** 1.5);
export function levelForXP(xp) {
  let level = 1;
  while (level < 10000 && Math.max(0, xp) >= threshold(level + 1)) level++;
  return level;
}
export function rewards({
  score = 0,
  duration = 30000,
  record = false,
  daily = false,
  streak = 0,
} = {}) {
  const performance = Math.min(
    2,
    Math.max(0.5, score / Math.max(1, duration / 1000) / 5),
  );
  const xp = Math.round(
    (30 * performance + (record ? 10 : 0) + (daily ? 20 : 0)) *
      (1 + Math.min(0.5, Math.max(0, streak) * 0.01)),
  );
  return { xp, coins: Math.floor(xp * 0.2) };
}
export const points = (letters, combo = 1, level = 1) =>
  Math.round(
    letters * 10 * Math.min(5, 1 + Math.floor(combo / 5) * 0.25) * level,
  );
export function ppm(correct, durationMs) {
  return Math.round(
    Math.max(0, correct) / 5 / (Math.max(1000, durationMs) / 60000),
  );
}
export const precision = (correct, errors) =>
  Math.round((100 * correct) / Math.max(1, correct + errors));
