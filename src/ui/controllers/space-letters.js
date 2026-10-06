import { bossWave, waveCount, waveSpeed } from "../../games/space-letters.js";
import { normalize } from "../../core/rng.js";
import { precision } from "../../core/scoring.js";
import { clear, text, stars, roundRect, palette } from "./canvas-utils.js";
export function create(c) {
  const { draw, width, height } = c.canvas();
  let wave = 1,
    enemies = [],
    score = 0,
    lives = 3,
    combo = 1,
    correct = 0,
    errors = 0,
    bosses = 0,
    shield = 0,
    double = 0,
    bombs = 1,
    flash = 0;
  const input = c.input((value, node) => {
    const enemy = enemies.find((e) => normalize(e.word) === normalize(value));
    if (!enemy) {
      errors++;
      combo = 1;
      c.sound("error");
      return;
    }
    correct += enemy.word.length;
    score += enemy.word.length * 40 * combo;
    combo = Math.min(5, combo + 1);
    enemies = enemies.filter((e) => e !== enemy);
    if (double > 0) {
      enemies.shift();
      double--;
    }
    if (enemy.boss) bosses++;
    flash = 0.2;
    node.value = "";
    c.sound("correct");
    if (!enemies.length) advance();
  });
  function next() {
    const boss = bossWave(wave);
    enemies = Array.from({ length: boss ? 1 : waveCount(wave) }, (_, i) => ({
      word: boss ? c.pick(c.data.phrases.phrases) : c.pick(c.data.common.easy),
      x: boss ? width / 2 : 80 + (i % 4) * 180,
      y: boss ? 70 : 40 + Math.floor(i / 4) * 70,
      boss,
    }));
    if (wave > 1 && wave % 3 === 0) {
      shield++;
      double += 2;
      bombs = Math.min(3, bombs + 1);
    }
  }
  function advance() {
    wave++;
    next();
  }
  c.controls.append(
    c.button(
      "◈ " + c.t("power.shield"),
      () => {
        if (c.isRunning() && shield > 0) {
          shield--;
          lives = Math.min(5, lives + 1);
          c.sound("combo");
        }
      },
      "button ghost",
    ),
    c.button(
      "↟ " + c.t("power.double"),
      () => {
        if (c.isRunning() && double > 0) {
          enemies.splice(0, Math.min(2, enemies.length));
          double--;
          if (!enemies.length) advance();
        }
      },
      "button ghost",
    ),
    c.button(
      "◉ " + c.t("power.bomb"),
      () => {
        if (!c.isRunning() || bombs <= 0 || bossWave(wave)) return;
        bombs--;
        score += enemies.length * 100;
        enemies = [];
        advance();
      },
      "button ghost",
    ),
  );
  next();
  return {
    mode: () => "classic",
    update(dt) {
      flash = Math.max(0, flash - dt);
      if (!enemies.length) advance();
      for (const enemy of enemies) enemy.y += waveSpeed(wave) * dt;
      if (enemies.some((e) => e.y > height - 65)) {
        lives--;
        combo = 1;
        c.sound("life");
        if (lives <= 0) {
          c.finish(score, {
            ondas: wave - 1,
            chefes: bosses,
            precisao: precision(correct, errors),
          });
          return;
        }
        advance();
      }
      c.status({ score, lives, combo });
    },
    render() {
      clear(draw, width, height);
      stars(draw, width, height, c.elapsed());
      text(
        draw,
        `${c.t("game.wave")} ${wave}${bossWave(wave) ? " · " + c.t("game.boss") : ""}`,
        width / 2,
        20,
        14,
        palette.purple,
      );
      for (const e of enemies) {
        const color = e.boss ? palette.pink : palette.cyan;
        roundRect(draw, e.x - 20, e.y - 23, 40, 20, color, 4);
        draw.fillStyle = color;
        draw.fillRect(e.x - 28, e.y - 12, 12, 8);
        draw.fillRect(e.x + 16, e.y - 12, 12, 8);
        const lines = e.boss
          ? (e.word.match(/.{1,42}(?:\s|$)/g) ?? [e.word])
          : [e.word];
        lines.forEach((line, i) =>
          text(
            draw,
            line.trim(),
            e.x,
            e.y + 15 + i * 21,
            e.boss ? 15 : 17,
            color,
          ),
        );
      }
      draw.fillStyle = palette.cyan;
      draw.beginPath();
      draw.moveTo(width / 2, height - 48);
      draw.lineTo(width / 2 - 15, height - 25);
      draw.lineTo(width / 2 + 15, height - 25);
      draw.closePath();
      draw.fill();
      if (flash > 0) {
        draw.fillStyle = palette.yellow;
        draw.fillRect(width / 2 - 1, 40, 2, height - 90);
      }
      text(
        draw,
        `${c.t("power.shield")} ${shield} · ${c.t("power.double")} ${double} · ${c.t("power.bomb")} ${bombs}`,
        width / 2,
        height - 10,
        11,
        palette.muted,
      );
    },
  };
}
