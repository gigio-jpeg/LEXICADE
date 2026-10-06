import { findWords, clearWords } from "../../games/tetris-letras.js";
import { clear, text, roundRect, palette } from "./canvas-utils.js";
export function create(c) {
  const mode = c.select(
    "game.difficulty",
    [
      ["easy", c.t("game.easy")],
      ["hard", c.t("game.hard")],
    ],
    "easy",
  );
  const { draw, width, height } = c.canvas(400, 610),
    cols = 10,
    rows = 14,
    cell = 34,
    offset = 30;
  let grid = Array.from({ length: rows }, () => Array(cols).fill(null)),
    falling,
    queue = [],
    target = "",
    score = 0,
    words = 0,
    chain = 0,
    level = 1;
  const dictionary = [
    ...c.data.curated,
    ...Object.values(c.data["decifra-validas"]).flat(),
  ];
  function next() {
    if (!queue.length) {
      target = c.pick(
        c.data.curated.filter((w) => w.length >= 3 && w.length <= 6),
      );
      queue = [...c.normalize(target)];
    }
    falling = { x: 4, y: 0, letter: queue.shift() };
    if (grid[0][falling.x])
      c.finish(score, { palavras: words, cadeia_max: chain });
  }
  function settle() {
    const y = Math.max(0, Math.min(rows - 1, Math.floor(falling.y)));
    if (grid[y][falling.x]) {
      c.finish(score, { palavras: words, cadeia_max: chain });
      return;
    }
    grid[y][falling.x] = falling.letter;
    let depth = 0;
    for (let i = 0; i < rows; i++) {
      const match = findWords(grid, dictionary);
      if (!match.found.length) break;
      depth++;
      words += match.found.length;
      score +=
        match.found.reduce((sum, w) => sum + w.word.length * 80, 0) * depth;
      grid = clearWords(grid, match.cells);
      c.sound(depth > 1 ? "combo" : "correct");
    }
    chain = Math.max(chain, depth);
    level = 1 + Math.floor(words / 3);
    next();
  }
  function move([dx, dy]) {
    if (!falling) return;
    if (dx) {
      const x = falling.x + dx;
      if (x >= 0 && x < cols && !grid[Math.floor(falling.y)]?.[x])
        falling.x = x;
    } else if (dy) {
      while (
        falling.y < rows - 1 &&
        !grid[Math.floor(falling.y) + 1][falling.x]
      )
        falling.y = Math.floor(falling.y) + 1;
      settle();
    }
  }
  c.dpad(move);
  next();
  return {
    mode: () => (mode.value === "hard" ? "hard" : "classic"),
    start() {
      if (mode.value === "hard") {
        for (let x = 0; x < cols; x++)
          if (x % 3) grid[rows - 1][x] = c.pick([..."aeiostrn"]);
      }
    },
    update(dt) {
      falling.y += dt * Math.min(6, 0.8 + level * 0.18);
      const y = Math.floor(falling.y);
      if (y >= rows - 1 || grid[y + 1]?.[falling.x]) {
        falling.y = Math.min(rows - 1, y);
        settle();
      }
      c.status({ score, combo: Math.max(1, chain) });
    },
    render() {
      clear(draw, width, height);
      text(
        draw,
        `${c.t("game.target")}: ${target.toUpperCase()}`,
        width / 2,
        27,
        16,
        palette.cyan,
      );
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) {
          roundRect(
            draw,
            offset + x * cell,
            50 + y * cell,
            cell - 2,
            cell - 2,
            grid[y][x] ? "#26374d" : "#151b2d",
            4,
          );
          if (grid[y][x])
            text(
              draw,
              grid[y][x].toUpperCase(),
              offset + x * cell + 16,
              50 + y * cell + 16,
              21,
              palette.yellow,
            );
        }
      if (falling) {
        roundRect(
          draw,
          offset + falling.x * cell,
          50 + falling.y * cell,
          cell - 2,
          cell - 2,
          palette.cyan,
          4,
        );
        text(
          draw,
          falling.letter.toUpperCase(),
          offset + falling.x * cell + 16,
          50 + falling.y * cell + 16,
          21,
          palette.bg,
        );
      }
      text(draw, "↓ " + c.t("game.submit"), width / 2, 560, 13, palette.muted);
      text(
        draw,
        `${c.t("game.chooseLetter")}: ${queue.join(" ").toUpperCase()}`,
        width / 2,
        588,
        12,
        palette.muted,
      );
    },
  };
}
