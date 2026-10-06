import { maze, neighbors, ghostStep } from "../../games/wordman.js";
import { clear, text, roundRect, creature, palette } from "./canvas-utils.js";
export function create(c) {
  const { draw, width, height } = c.canvas(570, 610),
    cell = 30;
  let level = 0,
    grid,
    player = [1, 1],
    direction = [0, 0],
    wanted = [0, 0],
    ghosts = [],
    visual = [],
    letters = [],
    pills = [],
    word = "",
    at = 0,
    lives = 3,
    score = 0,
    words = 0,
    captured = 0,
    frightened = 0,
    step = 0,
    tick = 0,
    grace = 2;
  function fresh() {
    grid = maze(level % 8);
    player = [1, 1];
    direction = [0, 0];
    wanted = [0, 0];
    word = c.pick(
      c.data.curated.filter(
        (w) => w.length >= 3 && w.length <= Math.min(10, 5 + level),
      ),
    );
    at = 0;
    const free = [];
    for (let y = 1; y < 18; y++)
      for (let x = 1; x < 18; x++)
        if (!grid[y][x] && (x !== 1 || y !== 1)) free.push([x, y]);
    const spots = c.shuffle(free);
    letters = [...c.normalize(word)].map((letter) => ({
      letter,
      position: spots.pop(),
    }));
    for (let i = 0; i < 5; i++)
      letters.push({
        letter: c.pick([..."abcdefghijklmnopqrstuvwxyz"]),
        position: spots.pop(),
      });
    pills = [spots.pop(), spots.pop()];
    ghosts = [
      [17, 17],
      [17, 1],
      [1, 17],
      [9, 9],
    ].map((position, kind) => ({ position, kind, respawn: 0 }));
    visual = [...player];
    grace = 2;
  }
  c.dpad((next) => {
    wanted = next;
  });
  fresh();
  const same = (a, b) => a[0] === b[0] && a[1] === b[1];
  function move() {
    tick++;
    const allowed = neighbors(grid, player);
    const destination = (d) => [(player[0] + d[0] + 19) % 19, player[1] + d[1]];
    if (allowed.some((p) => same(p, destination(wanted)))) direction = wanted;
    if (allowed.some((p) => same(p, destination(direction))))
      player = destination(direction);
    const i = letters.findIndex((l) => same(l.position, player));
    if (i >= 0) {
      const letter = letters.splice(i, 1)[0];
      if (letter.letter === c.normalize(word)[at]) {
        score += 100 * (level + 1);
        at++;
        c.sound("correct");
      } else {
        score = Math.max(0, score - 50);
        c.sound("error");
      }
      if (at === word.length) {
        words++;
        level++;
        score += 300;
        fresh();
        return;
      }
      if (!letters.some((l) => l.letter === c.normalize(word)[at])) {
        const empty = [];
        for (let y = 1; y < 18; y++)
          for (let x = 1; x < 18; x++)
            if (
              !grid[y][x] &&
              !letters.some((l) => same(l.position, [x, y])) &&
              !same(player, [x, y])
            )
              empty.push([x, y]);
        letters.push({
          letter: c.normalize(word)[at],
          position: c.pick(empty),
        });
      }
    }
    if (pills.some((p) => same(p, player))) {
      pills = pills.filter((p) => !same(p, player));
      frightened = Math.max(3, 8 - level * 0.3);
      c.sound("combo");
    }
    for (const ghost of ghosts) {
      if (ghost.respawn > 0) continue;
      const collided = same(ghost.position, player);
      if (tick % Math.max(1, 3 - Math.floor(level / 4)) === 0)
        ghost.position = ghostStep(
          grid,
          ghost,
          player,
          direction,
          tick,
          frightened > 0,
        );
      if ((collided || same(ghost.position, player)) && grace <= 0) {
        if (frightened > 0) {
          captured++;
          score += 200;
          ghost.position = [17, 17];
          ghost.respawn = 2;
          c.sound("combo");
        } else {
          lives--;
          player = [1, 1];
          direction = [0, 0];
          wanted = [0, 0];
          grace = 2;
          c.sound("life");
          if (lives <= 0) {
            c.finish(score, {
              fase: level + 1,
              palavras: words,
              fantasmas_capturados: captured,
            });
            return;
          }
        }
      }
    }
  }
  return {
    mode: () => "classic",
    update(dt) {
      ghosts.forEach((g) => (g.respawn = Math.max(0, g.respawn - dt)));
      frightened = Math.max(0, frightened - dt);
      grace = Math.max(0, grace - dt);
      step += dt;
      if (step >= Math.max(0.075, 0.14 - level * 0.003)) {
        step = 0;
        move();
      }
      c.status({ score, lives, combo: level + 1 });
    },
    render() {
      if (
        Math.abs(visual[0] - player[0]) > 2 ||
        Math.abs(visual[1] - player[1]) > 2
      )
        visual = [...player];
      visual = visual.map((v, i) => v + (player[i] - v) * 0.35);
      clear(draw, width, height);
      for (let y = 0; y < 19; y++)
        for (let x = 0; x < 19; x++)
          if (grid[y][x])
            roundRect(
              draw,
              x * cell + 3,
              y * cell + 3,
              cell - 6,
              cell - 6,
              "#29314b",
              4,
            );
      for (const l of letters)
        text(
          draw,
          l.letter.toUpperCase(),
          l.position[0] * cell + 15,
          l.position[1] * cell + 15,
          17,
          palette.yellow,
        );
      for (const p of pills) {
        draw.fillStyle = palette.pink;
        draw.beginPath();
        draw.arc(p[0] * cell + 15, p[1] * cell + 15, 5, 0, Math.PI * 2);
        draw.fill();
      }
      for (const g of ghosts)
        creature(
          draw,
          g.position[0] * cell + 15,
          g.position[1] * cell + 15,
          frightened > 0
            ? palette.purple
            : [palette.pink, palette.cyan, palette.yellow, palette.green][
                g.kind
              ],
          10,
        );
      draw.fillStyle = grace > 0 ? palette.yellow : palette.cyan;
      draw.beginPath();
      draw.arc(
        visual[0] * cell + 15,
        visual[1] * cell + 15,
        11,
        0,
        Math.PI * 2,
      );
      draw.fill();
      draw.fillStyle = palette.bg;
      draw.fillRect(visual[0] * cell + 12, visual[1] * cell + 9, 3, 5);
      draw.fillRect(visual[0] * cell + 19, visual[1] * cell + 9, 3, 5);
      text(
        draw,
        `${word.slice(0, at).toUpperCase()}▸${word.slice(at).toUpperCase()}`,
        width / 2,
        592,
        19,
        palette.cyan,
      );
    },
  };
}
