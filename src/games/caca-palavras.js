import { normalize, seeded, shuffle } from "../core/rng.js";
export const directions = [
  [1, 0],
  [0, 1],
  [1, 1],
  [-1, 1],
  [-1, 0],
  [0, -1],
  [-1, -1],
  [1, -1],
];
const forbidden = [
  "fuck",
  "shit",
  "puta",
  "porno",
  "merda",
  "buceta",
  "mierda",
  "joder",
  "nazi",
];
export function containsForbidden(grid) {
  for (let y = 0; y < grid.length; y++)
    for (let x = 0; x < grid.length; x++)
      for (const [dx, dy] of directions) {
        let text = "";
        for (let i = 0; i < 10; i++) {
          const cell = grid[y + dy * i]?.[x + dx * i];
          if (!cell) break;
          text += cell;
        }
        if (forbidden.some((w) => text.startsWith(w))) return true;
      }
  return false;
}
export function generateSearch(
  words,
  size = 12,
  hard = false,
  seed = "search",
) {
  const random = seeded(seed),
    list = [...new Set(words.map(normalize))].filter(
      (w) => w.length <= size && w.length >= 3,
    );
  for (let trial = 0; trial < 60; trial++) {
    const grid = Array.from({ length: size }, () => Array(size).fill(null)),
      placements = [];
    for (const word of list) {
      const possibilities = [];
      for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++)
          for (const [dx, dy] of hard ? directions : directions.slice(0, 3)) {
            if (
              [...word].every(
                (c, i) =>
                  grid[y + dy * i]?.[x + dx * i] !== undefined &&
                  (!grid[y + dy * i][x + dx * i] ||
                    grid[y + dy * i][x + dx * i] === c),
              )
            )
              possibilities.push({ word, x, y, dx, dy });
          }
      if (!possibilities.length) break;
      const place = possibilities[Math.floor(random() * possibilities.length)];
      [...word].forEach((c, i) => {
        grid[place.y + place.dy * i][place.x + place.dx * i] = c;
      });
      placements.push(place);
    }
    if (placements.length !== list.length) continue;
    for (const row of grid)
      for (let x = 0; x < size; x++)
        row[x] ??= "abcdefghijklmnopqrstuvwxyz"[Math.floor(random() * 26)];
    if (!containsForbidden(grid)) return { grid, placements, size };
  }
  throw new Error("Unable to place all words safely");
}
export function selectedWord(grid, start, end) {
  const vx = end[0] - start[0],
    vy = end[1] - start[1];
  if (vx && vy && Math.abs(vx) !== Math.abs(vy)) return null;
  const count = Math.max(Math.abs(vx), Math.abs(vy)) + 1,
    dx = Math.sign(vx),
    dy = Math.sign(vy);
  return Array.from(
    { length: count },
    (_, i) => grid[start[1] + i * dy]?.[start[0] + i * dx],
  ).join("");
}
