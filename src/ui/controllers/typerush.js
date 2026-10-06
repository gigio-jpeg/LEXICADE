import { el } from "../components.js";
import {
  compareText,
  typingMetrics,
  survivalTime,
  accelerationLevel,
} from "../../games/typerush.js";
import { points } from "../../core/scoring.js";
export function create(c) {
  const mode = c.select(
    "game.mode",
    c.daily
      ? [["daily", c.t("game.daily")]]
      : [
          ["classic", c.t("game.classic")],
          ["acceleration", c.t("game.acceleration")],
          ["survival", c.t("game.survival")],
        ],
    c.daily ? "daily" : "classic",
  );
  const duration = c.select(
    "game.duration",
    [15, 30, 60, 120].map((v) => [v, `${v}s`]),
    30,
  );
  const limit = c.select(
    "game.words",
    [[0, "∞"], ...[25, 50, 100].map((v) => [v, String(v)])],
    0,
  );
  const kind = c.select(
    "game.content",
    [
      ["words", c.t("game.words")],
      ["phrases", c.t("game.phrases")],
      ["texts", c.t("game.texts")],
    ],
    "words",
  );
  const punctuation = c.toggle("game.punctuation"),
    accents = c.toggle("game.accents", c.settings.accents),
    focus = c.toggle("game.focus", c.settings.focus);
  const display = el("div", {
      class: "typing-text",
      "data-cursor": c.settings.cursor,
    }),
    live = el("div", { class: "typing-stats" }),
    pressure = el("div", { class: "pressure" }, el("span"));
  c.area.append(display, live, pressure);
  let target = "",
    correct = 0,
    errors = 0,
    words = 0,
    combo = 1,
    score = 0,
    level = 1,
    remaining = 30,
    stress = 0,
    history = [],
    missed = {},
    lastSample = 0;
  const input = c.input((value, node) => submit(value, node));
  input.setAttribute("aria-label", c.t("game.input"));
  function next() {
    target =
      kind.value === "words"
        ? c.pick(c.data.common.easy)
        : c.pick(
            c.data.phrases[kind.value === "phrases" ? "phrases" : "texts"],
          );
    if (!punctuation.checked && kind.value !== "words")
      target = target.toLowerCase().replace(/[.,!?¿¡;:]/g, "");
    input.value = "";
    paint();
  }
  function paint() {
    const typed = input.value;
    display.replaceChildren(
      ...[...target].map((letter, i) =>
        el(
          "span",
          {
            class:
              i < typed.length
                ? (accents.checked ? typed[i] : c.normalize(typed[i])) ===
                  (accents.checked ? letter : c.normalize(letter))
                  ? "right"
                  : "wrong"
                : i === typed.length
                  ? "cursor"
                  : "",
          },
          letter,
        ),
      ),
    );
  }
  function submit(value, node) {
    if (!value) return;
    const comparison = compareText(target, value, accents.checked);
    correct += comparison.correct;
    errors += comparison.errors;
    if (comparison.complete) {
      words++;
      combo++;
      level = mode.value === "acceleration" ? accelerationLevel(words) : 1;
      score += points(target.length, combo, level);
      c.sound("correct");
      stress = Math.max(0, stress - 0.4);
    } else {
      combo = 1;
      c.sound("error");
      for (let i = 0; i < value.length; i++)
        if (c.normalize(value[i]) !== c.normalize(target[i] ?? ""))
          missed[target[i] ?? "?"] = (missed[target[i] ?? "?"] ?? 0) + 1;
    }
    if (mode.value === "survival")
      remaining = survivalTime(remaining, comparison.complete);
    if (Number(limit.value) && words >= Number(limit.value)) {
      finish();
      return;
    }
    next();
  }
  input.addEventListener(
    "input",
    () => {
      paint();
      if (c.isRunning() && input.value.endsWith(" ")) {
        input.value = input.value.trimEnd();
        submit(input.value, input);
      }
    },
    { signal: c.signal },
  );
  input.addEventListener(
    "keydown",
    (e) => {
      if (e.key === " " && kind.value === "words") {
        e.preventDefault();
        if (c.isRunning()) submit(input.value, input);
      }
    },
    { signal: c.signal },
  );
  input.addEventListener(
    "keydown",
    (e) => {
      if (!c.isRunning() && e.key.length === 1) c.begin();
    },
    { signal: c.signal },
  );
  const finish = () =>
    c.finish(score, typingMetrics(correct, errors, c.elapsed() * 1000, level), {
      speedHistory: history,
      missedLetters: missed,
    });
  if (c.daily) {
    duration.value = "60";
    limit.value = "0";
    kind.value = "texts";
  }
  next();
  for (const select of [kind, punctuation])
    select.addEventListener("change", next, { signal: c.signal });
  return {
    mode: () => mode.value,
    start() {
      remaining = mode.value === "survival" ? 12 : Number(duration.value);
      document.body.classList.toggle("focus-mode", focus.checked);
    },
    update(dt) {
      if (mode.value === "acceleration") {
        stress += dt * (0.08 + level * 0.014);
        if (stress >= 1) {
          finish();
          return;
        }
      } else if (!Number(limit.value) || mode.value !== "classic") {
        remaining -= dt;
        if (remaining <= 0) {
          finish();
          return;
        }
      }
      if (c.elapsed() - lastSample >= 1) {
        lastSample = c.elapsed();
        history.push(typingMetrics(correct, errors, c.elapsed() * 1000).ppm);
      }
      const current = compareText(target, input.value, accents.checked);
      const metrics = typingMetrics(
        correct + current.correct,
        errors + current.errors,
        c.elapsed() * 1000,
        level,
      );
      live.textContent = `${metrics.ppm} ${c.t("game.ppm")} · ${metrics.precisao}% ${c.t("game.accuracy")} · ${c.t("common.level")} ${level}`;
      pressure.firstChild.style.width = `${Math.min(100, stress * 100)}%`;
      c.status({
        score,
        combo,
        remaining: mode.value === "acceleration" ? null : remaining,
      });
    },
    destroy() {
      document.body.classList.remove("focus-mode");
    },
  };
}
