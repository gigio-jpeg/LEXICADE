import { el } from "../components.js";
import { generateSearch, selectedWord } from "../../games/caca-palavras.js";
export function create(c) {
  const topic = c.select(
      "game.content",
      Object.keys(c.data.themes).map((k) => [k, c.t(`topic.${k}`)]),
      "animais",
    ),
    sizeSelect = c.select(
      "game.length",
      [
        [10, "10 × 10"],
        [12, "12 × 12"],
        [15, "15 × 15"],
      ],
      12,
    );
  const mode = c.select(
      "game.mode",
      [
        ["classic", c.t("game.classic")],
        ["timed", c.t("game.survival")],
      ],
      "classic",
    ),
    hard = c.toggle("game.hard");
  const grid = el("div", {
      class: "search-grid",
      role: "grid",
      "aria-label": c.game.name[document.documentElement.lang],
    }),
    list = el("div", { class: "word-list" });
  c.area.append(grid, list);
  let puzzle,
    found = new Set(),
    start = null,
    last = null,
    score = 0,
    remaining = 180,
    dragStart = null,
    dragging = false;
  function cellsBetween(a, b) {
    const vx = b[0] - a[0],
      vy = b[1] - a[1];
    if (vx && vy && Math.abs(vx) !== Math.abs(vy)) return [];
    return Array.from(
      { length: Math.max(Math.abs(vx), Math.abs(vy)) + 1 },
      (_, i) => `${a[0] + i * Math.sign(vx)},${a[1] + i * Math.sign(vy)}`,
    );
  }
  function mark() {
    grid
      .querySelectorAll(".selected")
      .forEach((n) => n.classList.remove("selected"));
    if (start && last)
      for (const key of cellsBetween(start, last))
        grid.querySelector(`[data-cell="${key}"]`)?.classList.add("selected");
  }
  function choose(position) {
    if (!c.isRunning()) return;
    if (!start) {
      start = position;
      last = position;
      mark();
    } else {
      last = position;
      complete();
    }
  }
  function complete() {
    if (!start || !last) return;
    const text = selectedWord(puzzle.grid, start, last);
    const word = puzzle.placements.find(
      (p) => p.word === text || p.word === [...(text ?? "")].reverse().join(""),
    );
    if (word && !found.has(word.word)) {
      found.add(word.word);
      score += word.word.length * 80;
      c.sound("correct");
      for (const key of cellsBetween(start, last))
        grid.querySelector(`[data-cell="${key}"]`)?.classList.add("found");
      list.querySelector(`[data-word="${word.word}"]`)?.classList.add("found");
      if (found.size === puzzle.placements.length)
        c.finish(score, { palavras: found.size, tamanho_grade: puzzle.size });
    }
    start = null;
    last = null;
    mark();
  }
  function setup() {
    puzzle = generateSearch(
      c.shuffle(c.data.themes[topic.value].map((e) => e.word)).slice(0, 8),
      Number(sizeSelect.value),
      hard.checked,
      Math.floor(c.random() * 1e8),
    );
    found = new Set();
    score = 0;
    remaining = 180;
    grid.style.gridTemplateColumns = `repeat(${puzzle.size},1fr)`;
    grid.replaceChildren(
      ...puzzle.grid.flatMap((row, y) =>
        row.map((letter, x) =>
          el(
            "button",
            {
              type: "button",
              class: "search-cell",
              role: "gridcell",
              "data-cell": `${x},${y}`,
              "aria-label": `${letter.toUpperCase()} ${x + 1}, ${y + 1}`,
              onclick: () => choose([x, y]),
            },
            letter,
          ),
        ),
      ),
    );
    list.replaceChildren(
      ...puzzle.placements.map((p) =>
        el("span", { class: "tag", "data-word": p.word }, p.word.toUpperCase()),
      ),
    );
  }
  grid.addEventListener(
    "pointerdown",
    (e) => {
      const cell = e.target.closest("[data-cell]");
      if (!cell || !c.isRunning()) return;
      dragStart = cell.dataset.cell.split(",").map(Number);
      dragging = false;
    },
    { signal: c.signal },
  );
  grid.addEventListener(
    "pointermove",
    (e) => {
      if (!dragStart || !e.buttons) return;
      const cell = document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest("[data-cell]");
      if (cell) {
        const position = cell.dataset.cell.split(",").map(Number);
        if (position.join(",") !== dragStart.join(",")) {
          dragging = true;
          start = dragStart;
          last = position;
          mark();
        }
      }
    },
    { signal: c.signal },
  );
  grid.addEventListener(
    "pointerup",
    (e) => {
      if (dragging) {
        e.preventDefault();
        complete();
        grid.dataset.suppress = "1";
        setTimeout(() => delete grid.dataset.suppress, 0);
      }
      dragStart = null;
      dragging = false;
    },
    { signal: c.signal },
  );
  grid.addEventListener(
    "click",
    (e) => {
      if (grid.dataset.suppress) e.stopImmediatePropagation();
    },
    { capture: true, signal: c.signal },
  );
  setup();
  return {
    mode: () => mode.value,
    start: setup,
    update(dt) {
      if (mode.value === "timed") {
        remaining -= dt;
        if (remaining <= 0)
          c.finish(score, { palavras: found.size, tamanho_grade: puzzle.size });
      }
      c.status({
        score,
        remaining: mode.value === "timed" ? remaining : undefined,
      });
    },
  };
}
