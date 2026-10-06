import { el } from "../../ui/components.js";
import { typingMetrics, compareText } from "../../games/typerush.js";
import { points } from "../../core/scoring.js";
export function create(c) {
  const label = el(
    "p",
    { class: "screen-instruction" },
    c.t("room.startTyping"),
  );
  const display = el("div", {
    class: "phrase-target",
    "aria-label": c.t("game.phrases"),
  });
  const stats = el("div", { class: "phrase-stats" });
  c.area.append(label, display, stats);
  let target = "",
    score = 0,
    completed = 0,
    correct = 0,
    errors = 0,
    remaining = 60,
    started = false,
    previous = "",
    sample = 0,
    history = [];
  const phrases = c.shuffle(
    c.data.phrases.phrases.filter((s) => s.length <= 120),
  );
  let index = 0;
  const input = c.input(() => {});
  input.placeholder = c.t("room.typeHere");
  input.setAttribute("aria-label", c.t("game.phrases"));
  input.maxLength = 180;
  function next() {
    target = phrases[index++ % phrases.length];
    input.value = "";
    previous = "";
    paint();
  }
  function paint() {
    display.replaceChildren(
      ...[...target].map((letter, i) =>
        el(
          "span",
          {
            class:
              i < input.value.length
                ? c.normalize(input.value[i]) === c.normalize(letter)
                  ? "right"
                  : "wrong"
                : i === input.value.length
                  ? "cursor"
                  : "",
          },
          letter,
        ),
      ),
    );
  }
  input.addEventListener(
    "input",
    () => {
      if (!c.isRunning()) return;
      if (!started) {
        started = true;
        c.resetClock();
        label.textContent = c.t("room.tagline");
      }
      const value = input.value;
      if (value.length > previous.length) {
        for (let i = previous.length; i < value.length; i++)
          if (c.normalize(value[i]) !== c.normalize(target[i] ?? "")) errors++;
      }
      previous = value;
      paint();
      if (compareText(target, value).complete) {
        correct += target.length;
        completed++;
        score += points(target.length, completed, 1);
        c.sound("correct");
        next();
      }
    },
    { signal: c.signal },
  );
  next();
  return {
    mode: () => "classic",
    update(dt) {
      if (started) remaining -= dt;
      const current = compareText(target, input.value),
        metrics = typingMetrics(
          correct + current.correct,
          errors,
          c.elapsed() * 1000,
        );
      const nextStats = `${metrics.ppm} ${c.t("room.wpm")}  ·  ${metrics.precisao}% ${c.t("room.accuracy")}  ·  ${completed} ${c.t("room.played")}`;
      if(stats.textContent !== nextStats)stats.textContent=nextStats;
      c.status({ score, remaining });
      if (started && c.elapsed() - sample >= 1) {
        sample = c.elapsed();
        history.push(metrics.ppm);
      }
      if (remaining <= 0) c.finish(score, metrics, { speedHistory: history });
    },
  };
}
