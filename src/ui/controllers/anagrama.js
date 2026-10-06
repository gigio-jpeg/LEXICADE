import { el, button } from "../components.js";
import { scramble, canBuild, anagramScore } from "../../games/anagrama.js";
export function create(c) {
  const mode = c.select(
    "game.mode",
    [
      ["classic", c.t("game.classic")],
      ["advanced", c.t("game.advanced")],
    ],
    "classic",
  );
  const word = el("div", { class: "big-word" }),
    found = el("div", { class: "word-list" });
  c.area.append(word, found);
  let answer = "",
    remaining = 30,
    score = 0,
    words = 0,
    largest = 0,
    lives = 3,
    used = [];
  const input = c.input((value, node) => {
    const w = c.normalize(value);
    const pool = [
      ...Object.values(c.data["decifra-validas"]).flat(),
      ...c.data.common.easy,
    ];
    const valid =
      mode.value === "advanced"
        ? w.length >= 3 &&
          canBuild(w, answer) &&
          pool.some((k) => c.normalize(k) === w)
        : w === c.normalize(answer);
    if (used.includes(w)) {
      c.notice(c.t("game.used"));
      return;
    }
    if (!valid) {
      c.notice(c.t("game.invalid"));
      c.sound("error");
      return;
    }
    score += anagramScore(w);
    words++;
    largest = Math.max(largest, w.length);
    used.push(w);
    c.sound("correct");
    node.value = "";
    if (mode.value === "advanced") {
      found.append(el("span", { class: "tag" }, value));
      remaining = Math.min(90, remaining + 3);
    } else next();
    c.status({ score, lives, remaining });
  });
  function next() {
    answer = c.pick(
      c.data.curated.filter(
        (w) =>
          w.length >= 4 && w.length <= Math.min(9, 5 + Math.floor(words / 3)),
      ),
    );
    if (mode.value === "advanced")
      answer = c.pick(c.data.curated.filter((w) => w.length === 6));
    word.textContent = scramble(answer, c.random).toUpperCase();
    remaining = mode.value === "advanced" ? 60 : Math.max(8, 30 - words);
    used = [];
    found.replaceChildren();
    input.value = "";
  }
  c.controls.append(
    button(
      "⇄",
      () => {
        if (c.isRunning()) {
          score = Math.max(0, score - 25);
          word.textContent = scramble(answer, c.random).toUpperCase();
        }
      },
      "button ghost",
      { "aria-label": c.t("game.advanced") },
    ),
    button(
      c.t("game.hintCost"),
      () => {
        if (!c.isRunning()) return;
        score = Math.max(0, score - 50);
        c.notice(`${c.t("game.help")}: ${answer[0].toUpperCase()}`);
      },
      "button ghost",
    ),
  );
  next();
  return {
    mode: () => mode.value,
    start: next,
    update(dt) {
      remaining -= dt;
      if (remaining <= 0) {
        if (mode.value === "advanced" || --lives <= 0) {
          c.finish(score, { palavras: words, maior_palavra: largest });
          return;
        }
        c.notice(`${c.t("game.answer")}: ${answer}`);
        next();
      }
      c.status({ score, lives, remaining });
    },
  };
}
