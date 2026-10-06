import { seeded, pick } from "../core/rng.js";
export function maze(level = 0) {
  const size = 19,
    cells = Array.from({ length: size }, (_, y) =>
      Array.from({ length: size }, (_, x) =>
        x === 0 || y === 0 || x === size - 1 || y === size - 1 ? 1 : 0,
      ),
    );
  for (let y = 2; y < size - 2; y += 2)
    for (let x = 2; x < size - 2; x += 2) {
      cells[y][x] = 1;
      if ((x * 3 + y + level) % 4 === 0 && x < size - 3) cells[y][x + 1] = 1;
      if ((x + y * 5 + level) % 4 === 1 && y < size - 3) cells[y + 1][x] = 1;
    }
  // Horizontal tunnel is always clear, all odd rows/columns retain connected corridors.
  for (let x = 0; x < size; x++) cells[9][x] = 0;
  if (level % 8 >= 4) cells[2][2] = 0;
  return cells;
}
export function neighbors(grid, position) {
  return [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]
    .map(([dx, dy]) => [
      (position[0] + dx + grid.length) % grid.length,
      position[1] + dy,
    ])
    .filter(([x, y]) => grid[y]?.[x] === 0);
}
export function ghostStep(
  grid,
  ghost,
  player,
  direction,
  tick,
  frightened = false,
) {
  const possible = neighbors(grid, ghost.position);
  if (!possible.length) return ghost.position;
  const random = seeded(`${tick}:${ghost.kind}`);
  if (
    ghost.kind === 2 ||
    (ghost.kind === 3 &&
      Math.hypot(ghost.position[0] - player[0], ghost.position[1] - player[1]) <
        5)
  )
    return pick(possible, random);
  const target =
    ghost.kind === 1
      ? [player[0] + direction[0] * 3, player[1] + direction[1] * 3]
      : player;
  possible.sort(
    (a, b) =>
      Math.hypot(a[0] - target[0], a[1] - target[1]) -
      Math.hypot(b[0] - target[0], b[1] - target[1]),
  );
  if (frightened) return possible.at(-1);
  const goal = grid[target[1]]?.[target[0]] === 0 ? target : player;
  const queue = [{ position: ghost.position, first: null }],
    seen = new Set([ghost.position.join(",")]);
  for (let at = 0; at < queue.length; at++) {
    const current = queue[at];
    if (current.position[0] === goal[0] && current.position[1] === goal[1])
      return current.first ?? possible[0];
    for (const next of neighbors(grid, current.position)) {
      const key = next.join(",");
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({ position: next, first: current.first ?? next });
    }
  }
  return possible[0];
}
