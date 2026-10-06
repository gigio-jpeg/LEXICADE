import { el, button } from "../components.js";
import { generateCrossword } from "../../games/cruzadinha.js";
import { dayKey } from "../../core/rng.js";
export function create(c) {
  const topic = c.select(
    "game.content",
    Object.keys(c.data.themes).map((k) => [k, c.t(`topic.${k}`)]),
    "natureza",
  );
  const difficulty = c.select(
    "game.difficulty",
    [
      ["easy", c.t("game.easy")],
      ["medium", c.t("game.medium")],
      ["hard", c.t("game.hard")],
    ],
    "easy",
  );
  const layout = el("div", { class: "puzzle-layout" }),
    grid = el("div", { class: "cross-grid" }),
    list = el("div", { class: "clue-list" });
  layout.append(grid, list);
  c.area.append(layout);
  let puzzle,
    active = 0,
    solved = new Set(),
    revealed = new Map(),
    helps = 0,
    score = 0;
  const input = c.input((value, node) => {
    const entry = puzzle.entries[active];
    if (c.normalize(value) !== entry.answer) {
      c.notice(c.t("game.wrong"));
      c.sound("error");
      return;
    }
    solved.add(active);
    score += Math.max(50, entry.answer.length * 60);
    c.sound("correct");
    node.value = "";
    paint();
    if (solved.size === puzzle.entries.length) finish();
    else {
      active = puzzle.entries.findIndex((e, i) => !solved.has(i));
      paint();
    }
  });
  function setup() {
    const suitable = (entry) =>
      difficulty.value === "easy"
        ? entry.word.length <= 7
        : difficulty.value === "hard"
          ? entry.word.length >= 6
          : true;
    let source = c.data.themes[topic.value].filter(suitable);
    if (source.length < 10)
      source = Object.values(c.data.themes).flat().filter(suitable);
    const seed = c.daily
      ? `${dayKey()}:${c.lang}:${difficulty.value}`
      : `${Date.now()}:${topic.value}`;
    puzzle = generateCrossword(source, seed);
    active = 0;
    solved = new Set();
    revealed = new Map();
    score = 0;
    helps = 0;
    paint();
  }
  function paint() {
    grid.style.gridTemplateColumns = `repeat(${puzzle.size},1fr)`;
    grid.replaceChildren();
    list.replaceChildren();
    for (let y = 0; y < puzzle.size; y++)
      for (let x = 0; x < puzzle.size; x++) {
        const present = puzzle.cells[y][x];
        const entry = puzzle.entries[active];
        const selected = entry.dx
          ? y === entry.y && x >= entry.x && x < entry.x + entry.answer.length
          : x === entry.x && y >= entry.y && y < entry.y + entry.answer.length;
        const n = puzzle.entries.find((e) => e.x === x && e.y === y);
        let shown = revealed.get(`${x},${y}`) ?? "";
        for (const index of solved) {
          const e = puzzle.entries[index];
          for (let i = 0; i < e.answer.length; i++)
            if (e.x + e.dx * i === x && e.y + e.dy * i === y)
              shown = e.word[i]?.toUpperCase() ?? e.answer[i].toUpperCase();
        }
        grid.append(
          el(
            "button",
            {
              type: "button",
              class: `cross-cell ${!present ? "block" : selected ? "active" : ""}`,
              disabled: !present,
              "aria-label": present ? `${x + 1}, ${y + 1}` : null,
              onclick: () => {
                const i = puzzle.entries.findIndex((e) =>
                  Array.from({ length: e.answer.length }, (_, k) => [
                    e.x + e.dx * k,
                    e.y + e.dy * k,
                  ]).some((p) => p[0] === x && p[1] === y),
                );
                if (i >= 0) {
                  active = i;
                  paint();
                  input.focus();
                }
              },
            },
            n ? el("small", {}, n.number) : null,
            shown,
          ),
        );
      }
    puzzle.entries.forEach((entry, i) =>
      list.append(
        button(
          `${entry.number}. ${entry.clue} (${entry.answer.length})`,
          () => {
            active = i;
            paint();
            input.focus();
          },
          `clue ${active === i ? "active" : ""} ${solved.has(i) ? "done" : ""}`,
        ),
      ),
    );
    input.placeholder = `${puzzle.entries[active].number}. ${c.t("game.input")}`;
    c.status({ score });
  }
  c.controls.append(
    button(
      c.t("game.hintCost"),
      () => {
        if (!c.isRunning()) return;
        helps++;
        score = Math.max(0, score - 50);
        const e = puzzle.entries[active];
        const cells = Array.from({ length: e.answer.length }, (_, i) => [
          e.x + e.dx * i,
          e.y + e.dy * i,
          e.word[i],
        ]);
        const hidden = cells.find(([x, y]) => !revealed.has(`${x},${y}`));
        if (hidden)
          revealed.set(`${hidden[0]},${hidden[1]}`, hidden[2].toUpperCase());
        paint();
      },
      "button ghost",
    ),
    button(
      c.t("game.reveal"),
      () => {
        if (!c.isRunning()) return;
        helps++;
        score = Math.max(0, score - 200);
        solved.add(active);
        paint();
        if (solved.size === 10) finish();
      },
      "button ghost",
    ),
    button(
      c.t("game.check"),
      () => {
        if (!c.isRunning()) return;
        c.notice(
          c.normalize(input.value) === puzzle.entries[active].answer
            ? c.t("game.correct")
            : c.t("game.wrong"),
        );
      },
      "button ghost",
    ),
  );
  const finish = () =>
    c.finish(score, {
      palavras_certas: solved.size,
      ajudas: helps,
      dificuldade: difficulty.value,
    });
  topic.addEventListener("change", setup, { signal: c.signal });
  difficulty.addEventListener("change", setup, { signal: c.signal });
  setup();
  return {
    mode: () => (c.daily ? "daily" : "classic"),
    start: setup,
    update() {
      c.status({ score });
    },
  };
}
