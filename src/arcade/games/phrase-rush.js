import { loadGhost, ghostValue, saveGhost } from "../ghost.js";
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
  const pool = c.data.phrases.phrases.filter((s) => s.length <= 120);
  const ghost = loadGhost(c.lang, pool);
  const phrases = ghost?.phrases ?? c.shuffle(pool);
  const raceLabel = el("span", {}, c.t(ghost ? "features.ghost" : "features.ghostFirst"));
  const youBar = el("i", { class: "ghost-you" }), ghostBar = el("i", { class: "ghost-record" });
  const race = el("div", { class: "ghost-race", "aria-label": c.t("features.ghost") }, raceLabel,
    el("div", { class: "ghost-lane" }, youBar), el("div", { class: "ghost-lane" }, ghostBar));
  c.area.append(race);
  let samples = [{ ms: 0, value: 0 }], peak = 0, saved = false;
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
        c.feedback?.({ kind: "combo", combo: completed });
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
      peak = Math.max(peak, correct + current.correct);
      const opponent = ghost && started ? ghostValue(ghost.samples, c.elapsed() * 1000) : 0;
      const maximum = Math.max(1, ghost?.samples.at(-1)?.value ?? 300, peak);
      youBar.style.width = `${Math.min(100, peak / maximum * 100)}%`;
      ghostBar.style.width = `${Math.min(100, opponent / maximum * 100)}%`;
      if (ghost) raceLabel.textContent = `${c.t("features.ghost")} · ${Math.round(peak - opponent) >= 0 ? "+" : ""}${Math.round(peak - opponent)}`;
      c.status({ score, remaining });
      if (started && c.elapsed() - sample >= 1) {
        sample = c.elapsed();
        history.push(metrics.ppm);
        samples.push({ ms: Math.min(60000, Math.round(c.elapsed() * 1000)), value: peak });
      }
      if (remaining <= 0 && !saved) {
        saved = true;
        samples.push({ ms: 60000, value: peak });
        saveGhost(c.lang, { phrases, samples, score }, ghost);
        c.finish(score, metrics, { speedHistory: history, ghostWon: !!ghost && score > ghost.score });
      }
    },
  };
}
