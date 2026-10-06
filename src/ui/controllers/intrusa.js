import { el } from "../components.js";
import { isOdd, options, timeLimit } from "../../games/intrusa.js";
export function create(c) {
  const heading = el("p", { class: "word-target" }, c.t("game.click")),
    choices = el("div", { class: "choice-grid" });
  c.area.append(heading, choices);
  let entry,
    remaining = 8,
    round = 0,
    lives = 3,
    score = 0,
    combo = 0,
    max = 0;
  function next() {
    entry = c.pick(c.data.intrusa);
    remaining = timeLimit(round);
    choices.replaceChildren(
      ...options(entry, c.random).map((word) =>
        c.button(word, () => answer(word), "choice"),
      ),
    );
  }
  function answer(word) {
    if (!c.isRunning()) return;
    if (isOdd(word, entry.answer)) {
      round++;
      combo++;
      max = Math.max(max, combo);
      score += 100 + combo * 15;
      c.sound("correct");
    } else {
      lives--;
      combo = 0;
      c.notice(`${c.t("game.answer")}: ${entry.answer}`);
      c.sound("error");
    }
    if (lives <= 0) {
      c.finish(score, { acertos: round, sequencia_max: max });
      return;
    }
    next();
  }
  next();
  return {
    mode: () => "classic",
    update(dt) {
      remaining -= dt;
      if (remaining <= 0) answer("");
      c.status({ score, lives, combo, remaining });
    },
  };
}
