import { createSnake, turnSnake, stepSnake } from "../../games/snake.js";
import { clear, text, roundRect, palette } from "./canvas-utils.js";
export function create(c) {
  const { draw, width, height } = c.canvas(540, 590),
    size = 18,
    cell = 30;
  let state = createSnake(),
    letters = [],
    word = "",
    at = 0,
    score = 0,
    words = 0,
    max = 3,
    step = 0,
    obstacles = [];
  const same = (a, b) => a[0] === b[0] && a[1] === b[1];
  function empty() {
    const cells = [];
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++)
        if (
          ![
            ...state.body,
            ...obstacles,
            ...letters.map((l) => l.position),
          ].some((p) => same(p, [x, y]))
        )
          cells.push([x, y]);
    return c.pick(cells);
  }
  function target() {
    word = c.pick(
      c.data.curated.filter(
        (w) => w.length >= 3 && w.length <= Math.min(10, 5 + words),
      ),
    );
    at = 0;
    letters = [];
    const pool = [
      ...new Set([
        ...c.normalize(word),
        ...c.shuffle([..."abcdefghijklm"]).slice(0, 3),
      ]),
    ];
    for (const letter of pool) {
      const position = empty();
      if (position) letters.push({ letter, position });
    }
  }
  c.dpad((direction) => {
    state = turnSnake(state, direction);
  });
  target();
  return {
    mode: () => "classic",
    update(dt) {
      step += dt;
      if (step >= Math.max(0.07, 0.22 - words * 0.01)) {
        step = 0;
        const head = [
            state.body[0][0] + state.direction[0],
            state.body[0][1] + state.direction[1],
          ],
          hit = letters.find((l) => same(l.position, head)),
          good = hit?.letter === c.normalize(word)[at];
        state = stepSnake(state, size, good, obstacles);
        if (!state.alive) {
          c.finish(score, { palavras: words, tamanho_max: max });
          return;
        }
        if (hit) {
          letters = letters.filter((l) => l !== hit);
          if (good) {
            at++;
            score += 100;
            c.sound("correct");
            max = Math.max(max, state.body.length);
            if (at === word.length) {
              words++;
              score += 300;
              if (words >= 3) {
                const cell = empty();
                if (cell) obstacles.push(cell);
              }
              target();
            }
          } else {
            if (state.body.length > 2) state.body.pop();
            score = Math.max(0, score - 50);
            c.sound("error");
          }
          if (!letters.some((l) => l.letter === c.normalize(word)[at])) {
            const position = empty();
            if (position)
              letters.push({ letter: c.normalize(word)[at], position });
          }
        }
      }
      c.status({ score, combo: words + 1 });
    },
    render() {
      clear(draw, width, height);
      draw.strokeStyle = palette.line;
      for (let i = 0; i <= size; i++) {
        draw.beginPath();
        draw.moveTo(i * cell, 0);
        draw.lineTo(i * cell, 540);
        draw.moveTo(0, i * cell);
        draw.lineTo(540, i * cell);
        draw.stroke();
      }
      state.body.forEach((p, i) =>
        roundRect(
          draw,
          p[0] * cell + 3,
          p[1] * cell + 3,
          cell - 6,
          cell - 6,
          i === 0 ? palette.cyan : "#348b78",
          6,
        ),
      );
      for (const p of obstacles)
        roundRect(
          draw,
          p[0] * cell + 3,
          p[1] * cell + 3,
          cell - 6,
          cell - 6,
          palette.pink,
          3,
        );
      for (const l of letters)
        text(
          draw,
          l.letter.toUpperCase(),
          l.position[0] * cell + 15,
          l.position[1] * cell + 15,
          18,
          palette.yellow,
        );
      text(draw, word.toUpperCase(), width / 2, 563, 20, palette.cyan);
      text(draw, `${at}/${word.length}`, width / 2, 583, 11, palette.muted);
    },
  };
}
