import { normalize, shuffle, seeded } from "../core/rng.js";
export function generateCrossword(
  words,
  seed = "crossword",
  count = 10,
  size = 21,
) {
  const random = seeded(seed);
  const source = [
    ...new Map(words.map((w) => [normalize(w.word), w])).values(),
  ].filter((w) => normalize(w.word).length <= size - 2);
  if (source.length < count) throw new RangeError("Not enough entries");
  for (let trial = 0; trial < 70; trial++) {
    const grid = Array.from({ length: size }, () => Array(size).fill(null));
    const axes = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => new Set()),
    );
    const placed = [],
      candidates = shuffle(source, random);
    function fit(word, x, y, dx, dy, first) {
      const endX = x + dx * (word.length - 1),
        endY = y + dy * (word.length - 1),
        axis = dx ? "h" : "v";
      if (x < 0 || y < 0 || endX >= size || endY >= size) return false;
      if (grid[y - dy]?.[x - dx] || grid[endY + dy]?.[endX + dx]) return false;
      let intersections = 0;
      for (let i = 0; i < word.length; i++) {
        const cx = x + dx * i,
          cy = y + dy * i,
          existing = grid[cy][cx];
        if (existing) {
          if (existing !== word[i] || axes[cy][cx].has(axis)) return false;
          intersections++;
        } else if (grid[cy + dx]?.[cx + dy] || grid[cy - dx]?.[cx - dy])
          return false;
      }
      return first || intersections > 0;
    }
    function place(entry, x, y, dx, dy) {
      const word = normalize(entry.word),
        axis = dx ? "h" : "v";
      for (let i = 0; i < word.length; i++) {
        grid[y + dy * i][x + dx * i] = word[i];
        axes[y + dy * i][x + dx * i].add(axis);
      }
      placed.push({ ...entry, answer: word, x, y, dx, dy });
    }
    const first = candidates.shift();
    place(
      first,
      Math.floor((size - normalize(first.word).length) / 2),
      Math.floor(size / 2),
      1,
      0,
    );
    for (let pass = 0; pass < 3 && placed.length < count; pass++) {
      for (const entry of candidates) {
        if (placed.some((e) => e.word === entry.word)) continue;
        const word = normalize(entry.word),
          possible = [];
        for (let y = 0; y < size; y++)
          for (let x = 0; x < size; x++) {
            if (!grid[y][x]) continue;
            for (let i = 0; i < word.length; i++)
              if (word[i] === grid[y][x]) {
                for (const [dx, dy] of [
                  [1, 0],
                  [0, 1],
                ])
                  if (fit(word, x - i * dx, y - i * dy, dx, dy, false))
                    possible.push([x - i * dx, y - i * dy, dx, dy]);
              }
          }
        if (possible.length)
          place(entry, ...possible[Math.floor(random() * possible.length)]);
        if (placed.length === count) break;
      }
    }
    if (placed.length !== count) continue;
    const minX = Math.min(...placed.map((e) => e.x)),
      minY = Math.min(...placed.map((e) => e.y));
    const maxX = Math.max(
        ...placed.map((e) => e.x + e.dx * (e.answer.length - 1)),
      ),
      maxY = Math.max(...placed.map((e) => e.y + e.dy * (e.answer.length - 1)));
    const dimension = Math.max(maxX - minX + 1, maxY - minY + 1);
    const cells = Array.from({ length: dimension }, (_, y) =>
      Array.from(
        { length: dimension },
        (_, x) => grid[y + minY]?.[x + minX] ?? null,
      ),
    );
    const entries = placed
      .map((e) => ({ ...e, x: e.x - minX, y: e.y - minY }))
      .sort((a, b) => a.y - b.y || a.x - b.x);
    const numbers = new Map();
    let number = 0;
    entries.forEach((e) => {
      const key = `${e.x},${e.y}`;
      if (!numbers.has(key)) numbers.set(key, ++number);
      e.number = numbers.get(key);
    });
    return { size: dimension, cells, entries };
  }
  throw new Error("Unable to generate a connected crossword");
}
export function validateCrossword(puzzle) {
  if (!puzzle.entries.length) return false;
  for (const entry of puzzle.entries)
    for (let i = 0; i < entry.answer.length; i++) {
      if (
        puzzle.cells[entry.y + entry.dy * i]?.[entry.x + entry.dx * i] !==
        entry.answer[i]
      )
        return false;
    }
  const occupied = puzzle.cells.flat().filter(Boolean).length,
    visited = new Set(),
    queue = [];
  const first = puzzle.entries[0];
  queue.push([first.x, first.y]);
  while (queue.length) {
    const [x, y] = queue.shift(),
      key = `${x},${y}`;
    if (visited.has(key) || !puzzle.cells[y]?.[x]) continue;
    visited.add(key);
    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return visited.size === occupied;
}
