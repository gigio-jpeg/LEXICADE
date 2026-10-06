import { stepFlight, portalHit } from "../../games/flappy.js";
import {
  clear,
  text,
  stars,
  roundRect,
  creature,
  palette,
} from "./canvas-utils.js";
export function create(c) {
  const { draw, width, height, canvas } = c.canvas(720, 460);
  let flight = { y: 230, velocity: 0 },
    gates = [],
    spawn = 0,
    flap = false,
    score = 0,
    words = 0,
    portals = 0,
    word = "",
    at = 0,
    lives = 3;
  function target() {
    word = c.pick(
      c.data.curated.filter(
        (w) => w.length >= 3 && w.length <= Math.min(10, 5 + words),
      ),
    );
    at = 0;
  }
  function tap() {
    if (c.isRunning()) flap = true;
  }
  canvas.addEventListener("pointerdown", tap, { signal: c.signal });
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === " " && !/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) {
        e.preventDefault();
        tap();
      }
    },
    { signal: c.signal },
  );
  c.controls.append(c.button("↑ " + c.t("game.chooseLetter"), tap));
  target();
  function gate() {
    const correct = c.normalize(word)[at],
      wrong = c.pick(
        [..."abcdefghijklmnopqrstuvwxyz"].filter((l) => l !== correct),
      ),
      first = c.random() > 0.5;
    gates.push({
      x: width + 30,
      checked: false,
      portals: [
        { y: 140, height: 105, letter: first ? correct : wrong },
        { y: 330, height: 105, letter: first ? wrong : correct },
      ],
    });
  }
  function miss() {
    lives--;
    flight = { y: 230, velocity: 0 };
    gates = [];
    spawn = 1;
    c.sound("life");
    if (lives <= 0) c.finish(score, { palavras: words, portais: portals });
  }
  return {
    mode: () => "classic",
    update(dt) {
      flight = stepFlight(flight, dt, flap);
      flap = false;
      if (flight.y < 12 || flight.y > height - 12) {
        miss();
        return;
      }
      spawn -= dt;
      if (spawn <= 0 && !gates.length) {
        gate();
        spawn = 3;
      }
      for (const g of gates) {
        g.x -= dt * Math.min(180, 95 + words * 7);
        if (g.x < 140 && g.x > 94 && !g.checked) {
          g.checked = true;
          const hit = portalHit(flight.y, g.portals);
          if (hit?.letter === c.normalize(word)[at]) {
            at++;
            portals++;
            score += 150;
            c.sound("correct");
            if (at === word.length) {
              words++;
              score += 300;
              target();
            }
          } else {
            miss();
            return;
          }
        }
      }
      gates = gates.filter((g) => g.x > -40);
      c.status({ score, lives, combo: words + 1 });
    },
    render() {
      clear(draw, width, height);
      stars(draw, width, height, c.elapsed());
      text(
        draw,
        `${word.slice(0, at).toUpperCase()}▸${word.slice(at).toUpperCase()}`,
        width / 2,
        25,
        22,
        palette.cyan,
      );
      for (const g of gates) {
        roundRect(draw, g.x, 50, 35, height - 50, "#29314b", 5);
        for (const p of g.portals) {
          draw.fillStyle = palette.bg;
          draw.fillRect(g.x - 3, p.y - p.height / 2, 41, p.height);
          draw.strokeStyle = palette.purple;
          draw.strokeRect(g.x - 3, p.y - p.height / 2, 41, p.height);
          text(draw, p.letter.toUpperCase(), g.x + 17, p.y, 24, palette.yellow);
        }
      }
      creature(draw, 115, flight.y, palette.cyan, 13);
      text(
        draw,
        "↑ " + c.t("game.chooseLetter"),
        width / 2,
        height - 17,
        12,
        palette.muted,
      );
    },
  };
}
