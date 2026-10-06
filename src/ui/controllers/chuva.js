import { fallWords, specialEffect } from "../../games/chuva.js";
import { points, precision } from "../../core/scoring.js";
import { clear, text, stars, roundRect, palette } from "./canvas-utils.js";
export function create(c) {
  const { draw, width, height } = c.canvas();
  let falling = [],
    lives = 3,
    score = 0,
    combo = 1,
    words = 0,
    level = 1,
    spawn = 0,
    slow = 0,
    errors = 0,
    correct = 0,
    uid = 0;
  const input = c.input((value, node) => {
    const index = falling.findIndex(
      (w) => c.normalize(w.word) === c.normalize(value),
    );
    if (index < 0) {
      errors++;
      combo = 1;
      c.sound("error");
      return;
    }
    const hit = falling.splice(index, 1)[0];
    words++;
    correct += hit.word.length;
    combo++;
    level = 1 + Math.floor(words / 8);
    score +=
      points(hit.word.length, combo, level) + Math.round((height - hit.y) / 4);
    const effect = specialEffect(hit.kind, falling, hit);
    falling = effect.words;
    lives = Math.min(5, lives + effect.life);
    slow = effect.slow || slow;
    node.value = "";
    c.sound("correct");
  });
  function add() {
    if (falling.length >= 9) return;
    const pool =
      level < 3
        ? c.data.common.easy
        : level < 6
          ? c.data.common.medium
          : c.data.common.hard;
    const word = c.pick(pool.length ? pool : c.data.curated);
    const lane = uid++ % 5;
    const kind =
      uid % 8 === 0 ? c.pick(["gold", "freeze", "heart", "bomb"]) : "normal";
    falling.push({
      word,
      x: 75 + lane * 140,
      y: 15,
      speed: 19 + Math.min(80, level * 6),
      kind,
    });
  }
  add();
  return {
    mode: () => "classic",
    update(dt) {
      spawn -= dt;
      slow = Math.max(0, slow - dt);
      if (spawn <= 0) {
        add();
        spawn = Math.max(0.5, 2.8 - level * 0.16);
      }
      const step = fallWords(falling, dt * (slow > 0 ? 0.45 : 1), height);
      falling = step.remaining;
      if (step.missed.length) {
        lives -= step.missed.length;
        combo = 1;
        c.sound("life");
      }
      if (lives <= 0) {
        c.finish(score, {
          palavras: words,
          nivel: level,
          precisao: precision(correct, errors),
        });
        return;
      }
      c.status({ score, lives, combo });
    },
    render() {
      clear(draw, width, height);
      stars(draw, width, height, c.elapsed());
      draw.strokeStyle = palette.line;
      draw.beginPath();
      draw.moveTo(0, height - 20);
      draw.lineTo(width, height - 20);
      draw.stroke();
      for (const w of falling) {
        const color = {
          normal: palette.cyan,
          gold: palette.yellow,
          freeze: palette.purple,
          heart: palette.pink,
          bomb: palette.green,
        }[w.kind];
        roundRect(
          draw,
          w.x - w.word.length * 5 - 10,
          w.y - 16,
          w.word.length * 10 + 20,
          32,
          "#1c2337",
        );
        text(draw, w.word, w.x, w.y, 16, color);
        if (w.kind !== "normal")
          text(
            draw,
            { gold: "✦", freeze: "❄", heart: "♥", bomb: "◉" }[w.kind],
            w.x,
            w.y - 27,
            12,
            color,
          );
      }
    },
  };
}
