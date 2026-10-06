import { normalize } from "../core/rng.js";
export function findWords(grid, dictionary) {
  const valid = new Set(dictionary.map(normalize).filter((w) => w.length >= 3)),
    found = [],
    cells = new Set();
  for (let y = 0; y < grid.length; y++)
    for (let x = 0; x < grid[0].length; x++)
      for (const [dx, dy] of [
        [1, 0],
        [0, 1],
      ]) {
        let word = "";
        for (let i = 0; i < 12; i++) {
          const letter = grid[y + i * dy]?.[x + i * dx];
          if (!letter) break;
          word += letter;
          if (valid.has(word)) {
            const coords = Array.from({ length: i + 1 }, (_, j) => [
              x + j * dx,
              y + j * dy,
            ]);
            found.push({ word, coords });
            coords.forEach(([cx, cy]) => cells.add(`${cx},${cy}`));
          }
        }
      }
  return { found, cells };
}
export function clearWords(grid, cells) {
  const copy = grid.map((row) => [...row]);
  for (const key of cells) {
    const [x, y] = key.split(",").map(Number);
    copy[y][x] = null;
  }
  for (let x = 0; x < copy[0].length; x++) {
    const letters = copy.map((row) => row[x]).filter(Boolean);
    for (let y = copy.length - 1; y >= 0; y--)
      copy[y][x] = letters.pop() ?? null;
  }
  return copy;
}
export function dropLetter(grid, x, letter) {
  const y = grid.length - 1 - [...grid].reverse().findIndex((row) => !row[x]);
  if (y === grid.length) return null;
  // Only the lowest accessible cell is valid: an occupied cell above a hole blocks it.
  let row = 0;
  while (row < grid.length && !grid[row][x]) row++;
  if (row === 0) return null;
  const copy = grid.map((r) => [...r]);
  copy[row - 1][x] = letter;
  return copy;
}
