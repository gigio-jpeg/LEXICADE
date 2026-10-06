import { el, button } from "../components.js";
import { guessLetter, masked } from "../../games/forca.js";
export function create(c) {
  const topic = c.select(
      "game.content",
      Object.keys(c.data.themes).map((k) => [k, c.t(`topic.${k}`)]),
      "animais",
    ),
    mode = c.select(
      "game.mode",
      [
        ["classic", c.t("game.classic")],
        ["sequence", c.t("game.survival")],
      ],
      "classic",
    );
  const drawing = el("div"),
    word = el("div", { class: "big-word" }),
    clue = el("p", { class: "game-message" }),
    keyboard = el("div", { class: "keyboard" });
  c.area.append(drawing, word, clue, keyboard);
  let entry,
    guesses = [],
    lives = 6,
    score = 0,
    words = 0;
  const keys = new Map();
  for (const letters of ["qwertyuiop", "asdfghjkl", "zxcvbnm"]) {
    const row = el("div", { class: "keyboard-row" });
    for (const letter of letters) {
      const key = button(letter.toUpperCase(), () => play(letter), "");
      keys.set(letter, key);
      row.append(key);
    }
    keyboard.append(row);
  }
  function paint() {
    word.textContent = masked(entry.word, guesses).toUpperCase();
    keys.forEach((key, letter) => {
      key.disabled = guesses.includes(letter);
      key.className = guesses.includes(letter)
        ? c.normalize(entry.word).includes(letter)
          ? "correct"
          : "absent"
        : "";
    });
    drawing.replaceChildren();
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 190 160");
    svg.classList.add("hangman");
    svg.setAttribute("aria-hidden", "true");
    const shapes = [
      ["path", { d: "M25 150 H165 M45 150 V15 H110 V30" }],
      ["circle", { cx: 110, cy: 47, r: 17 }],
      ["path", { d: "M110 64 V105" }],
      ["path", { d: "M110 75 L85 90" }],
      ["path", { d: "M110 75 L135 90" }],
      ["path", { d: "M110 105 L90 135" }],
      ["path", { d: "M110 105 L130 135" }],
    ];
    shapes.slice(0, 7 - lives).forEach(([tag, attrs]) => {
      const node = document.createElementNS(svg.namespaceURI, tag);
      for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
      node.setAttribute("fill", "none");
      node.setAttribute("stroke", "var(--accent)");
      node.setAttribute("stroke-width", "4");
      svg.append(node);
    });
    drawing.append(svg);
    c.status({ score, lives });
  }
  function next() {
    entry = c.pick(c.data.themes[topic.value]);
    guesses = [];
    lives = 6;
    clue.textContent = "";
    paint();
  }
  function play(letter) {
    if (!c.isRunning()) return;
    const result = guessLetter(entry.word, guesses, letter);
    if (!result.valid) return;
    guesses = result.guesses;
    if (result.correct) c.sound("correct");
    else {
      lives--;
      c.sound("error");
    }
    paint();
    if (result.solved) {
      words++;
      score += entry.word.length * 100 + lives * 50;
      if (mode.value === "sequence") next();
      else c.finish(score, { palavras: words, vidas_restantes: lives });
    } else if (lives <= 0) {
      c.notice(`${c.t("game.answer")}: ${entry.word}`);
      c.finish(score, { palavras: words, vidas_restantes: 0 });
    }
  }
  document.addEventListener(
    "keydown",
    (e) => {
      if (!/INPUT|SELECT|TEXTAREA/.test(e.target.tagName) && e.key.length === 1)
        play(e.key);
    },
    { signal: c.signal },
  );
  c.controls.append(
    button(
      c.t("common.help") + " (−♥)",
      () => {
        if (!c.isRunning() || lives <= 1) return;
        lives--;
        clue.textContent = entry.clue;
        paint();
      },
      "button ghost",
    ),
    button(
      c.t("game.chooseLetter") + " (−♥)",
      () => {
        if (!c.isRunning() || lives <= 1) return;
        lives--;
        const letter = [...c.normalize(entry.word)].find(
          (k) => !guesses.includes(k),
        );
        if (letter) play(letter);
        paint();
      },
      "button ghost",
    ),
  );
  next();
  return {
    mode: () => mode.value,
    start: next,
    update() {
      c.status({ score, lives });
    },
  };
}
