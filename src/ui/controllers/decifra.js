import { el, button } from "../components.js";
import { clues, hardValid, decifraScore } from "../../games/decifra.js";
import { dayKey } from "../../core/rng.js";
import { checkGuess } from "../../core/api.js";
import { session } from "../../core/auth.js";
import { read, write } from "../../core/storage.js";
export function create(c) {
  const mode = c.select(
    "game.mode",
    [
      ["daily", c.t("game.daily")],
      ["infinite", c.t("game.infinite")],
      ["duet", c.t("game.duet")],
      ["quartet", c.t("game.quartet")],
    ],
    c.daily ? "daily" : "infinite",
  );
  const length = c.select(
      "game.length",
      [
        [4, "4"],
        [5, "5"],
        [6, "6"],
      ],
      5,
    ),
    hard = c.toggle("game.hard");
  const host = el("div"),
    keyboard = el("div", { class: "keyboard" });
  c.area.append(host, keyboard);
  let answers = [],
    history = [],
    solved = [],
    max = 6,
    size = 5,
    boards = 1,
    busy = false;
  const input = c.input(async (value, node) => {
    await submit(value);
    node.value = "";
  });
  input.maxLength = 6;
  const keys = new Map();
  for (const row of ["qwertyuiop", "asdfghjkl", "zxcvbnm"]) {
    const line = el("div", { class: "keyboard-row" });
    for (const letter of row) {
      const key = button(
        letter.toUpperCase(),
        () => {
          if (c.isRunning() && input.value.length < size) input.value += letter;
        },
        "",
      );
      keys.set(letter, key);
      line.append(key);
    }
    keyboard.append(line);
  }
  const last = el(
    "div",
    { class: "keyboard-row" },
    button(
      "⌫",
      () => {
        input.value = input.value.slice(0, -1);
      },
      "wide",
      { "aria-label": c.t("game.backspace") },
    ),
    button(
      c.t("game.submit"),
      () =>
        submit(input.value).then(() => {
          input.value = "";
        }),
      "wide",
    ),
  );
  keyboard.append(last);
  function setup() {
    size = mode.value === "infinite" ? Number(length.value) : 5;
    boards = mode.value === "duet" ? 2 : mode.value === "quartet" ? 4 : 1;
    max = boards === 2 ? 7 : boards === 4 ? 9 : 6;
    answers = c
      .shuffle(c.data["decifra-respostas"][String(size)])
      .slice(0, boards);
    solved = Array(boards).fill(false);
    history = [];
    if (mode.value === "daily" && !session()) {
      const list = c.data["decifra-respostas"]["5"];
      let hash = 0;
      for (const n of `${dayKey()}:${c.lang}`)
        hash = (hash * 31 + n.charCodeAt(0)) >>> 0;
      answers = [list[hash % list.length]];
      const cached = read(`decifra:${dayKey()}:${c.lang}`);
      if (cached) {
        history = cached.history;
        solved = cached.solved;
      }
    }
    input.maxLength = size;
    host.className = boards > 1 ? "multi-boards" : "";
    paint();
  }
  function paint() {
    host.replaceChildren(
      ...Array.from({ length: boards }, (_, b) =>
        el(
          "div",
          { class: "letter-board" },
          ...Array.from({ length: max }, (_, row) =>
            el(
              "div",
              { class: "board-row" },
              ...Array.from({ length: size }, (_, i) =>
                el(
                  "span",
                  { class: "letter " + (history[row]?.colors[b]?.[i] ?? "") },
                  history[row]?.colors[b]
                    ? history[row].word[i].toUpperCase()
                    : "",
                ),
              ),
            ),
          ),
        ),
      ),
    );
    keys.forEach((key) => (key.className = ""));
    for (const turn of history)
      for (let i = 0; i < size; i++) {
        const key = keys.get(turn.word[i]);
        if (!key) continue;
        const states = turn.colors.filter(Boolean).map((colors) => colors[i]);
        const state = states.includes("correct")
          ? "correct"
          : states.includes("present")
            ? "present"
            : "absent";
        if (
          key.className !== "correct" &&
          (state === "correct" || key.className !== "present")
        )
          key.className = state;
      }
  }
  function finish() {
    const won = solved.every(Boolean);
    const shares = history
      .map((turn) =>
        turn.colors
          .map((colors) =>
            colors
              ? colors
                  .map(
                    (x) => ({ correct: "🟩", present: "🟨", absent: "⬛" })[x],
                  )
                  .join("")
              : "⬜".repeat(size),
          )
          .join(" "),
      )
      .join("\n");
    c.finish(
      decifraScore(history.length, won, boards),
      {
        tentativas: history.length,
        resolvido: won,
        tamanho: size,
        variante: mode.value,
      },
      { share: shares },
    );
  }
  async function submit(value) {
    if (!c.isRunning() || busy) return;
    const word = c.normalize(value);
    if (
      word.length !== size ||
      !c.data["decifra-validas"][String(size)].some(
        (w) => c.normalize(w) === word,
      )
    ) {
      c.notice(c.t("game.invalid"));
      return;
    }
    if (
      hard.checked &&
      history.length &&
      !answers.some(
        (_, b) =>
          !solved[b] &&
          hardValid(
            word,
            history
              .filter((h) => h.colors[b])
              .map((h) => ({ word: h.word, colors: h.colors[b] })),
          ),
      )
    ) {
      c.notice(c.t("game.wrong"));
      return;
    }
    busy = true;
    try {
      let colors;
      if (mode.value === "daily" && session()) {
        const response = await checkGuess(dayKey(), c.lang, word);
        colors = [response.colors];
        history = response.history ?? [...history, { word, colors }];
        solved[0] = response.solved;
        if (response.answer) answers = [response.answer];
      } else {
        colors = answers.map((a, b) => (solved[b] ? null : clues(a, word)));
        history.push({ word, colors });
        answers.forEach((answer, b) => {
          if (c.normalize(answer) === word) solved[b] = true;
        });
        if (mode.value === "daily")
          write(`decifra:${dayKey()}:${c.lang}`, { history, solved });
      }
      paint();
      c.sound(solved.every(Boolean) ? "correct" : "key");
      c.status({
        score: decifraScore(history.length, solved.every(Boolean), boards),
        lives: max - history.length,
      });
      if (solved.every(Boolean) || history.length >= max) {
        c.notice(`${c.t("game.answer")}: ${answers.join(" · ")}`);
        finish();
      }
    } catch {
      c.notice(c.t("common.error"));
    } finally {
      busy = false;
    }
  }
  mode.addEventListener("change", setup, { signal: c.signal });
  length.addEventListener("change", setup, { signal: c.signal });
  setup();
  return {
    mode: () => (mode.value === "daily" ? "daily" : mode.value),
    start() {
      setup();
      if (mode.value === "daily" && !session())
        c.notice(c.t("game.hiddenDaily"));
      if (history.length >= max || solved.every(Boolean)) finish();
    },
    update() {
      c.status({
        score: decifraScore(history.length, solved.every(Boolean), boards),
        lives: max - history.length,
      });
    },
  };
}
