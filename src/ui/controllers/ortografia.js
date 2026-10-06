import { el, button } from "../components.js";
import { spellingRound, judge } from "../../games/ortografia.js";
export function create(c) {
  const display = el("div", { class: "big-word" }),
    explanation = el("p", { class: "game-message" });
  c.area.append(display, explanation);
  let round,
    remaining = 8,
    score = 0,
    correct = 0,
    lives = 3,
    combo = 0,
    total = 0,
    roundStart = 0;
  function next() {
    round = spellingRound(c.pick(c.data.ortografia), c.random);
    remaining = Math.max(2, 8 - correct * 0.15);
    roundStart = c.elapsed();
    display.textContent = round.text;
  }
  function answer(choice) {
    if (!c.isRunning()) return;
    const success = judge(round, choice);
    if (success) {
      correct++;
      combo++;
      score += 100 + Math.round(remaining * 15);
      total += c.elapsed() - roundStart;
      c.sound("correct");
      explanation.textContent = "";
    } else {
      lives--;
      combo = 0;
      explanation.textContent = `${c.t("game.answer")}: ${round.answer}. ${round.explanation}`;
      c.sound("error");
    }
    if (lives <= 0) {
      c.finish(score, {
        acertos: correct,
        tempo_medio: correct ? Math.round((total / correct) * 1000) : 0,
      });
      return;
    }
    next();
  }
  c.controls.append(
    button("✓ " + c.t("game.correctSpelling"), () => answer(true)),
    button(
      "× " + c.t("game.wrongSpelling"),
      () => answer(false),
      "button ghost",
    ),
  );
  next();
  return {
    mode: () => "classic",
    update(dt) {
      remaining -= dt;
      if (remaining <= 0) answer(!round.correct);
      c.status({ score, lives, combo, remaining });
    },
  };
}
