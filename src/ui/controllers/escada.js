import { el, button } from "../components.js";
import { oneApart, shortestPath } from "../../games/escada.js";
import { seeded, dayKey, pick } from "../../core/rng.js";
export function create(c) {
  const startWord = el("div", { class: "big-word" }),
    goal = el("p", { class: "word-target" }),
    route = el("div", { class: "ladder-path" });
  c.area.append(startWord, goal, route);
  const dictionary = Object.values(c.data["decifra-validas"])
    .flat()
    .map(c.normalize);
  let solution,
    path = [],
    helps = 0,
    score = 0;
  const known =
    c.lang === "en"
      ? [
          ["cold", "cord", "card", "ward", "warm"],
          ["cat", "cot", "dot", "dog"],
        ]
      : [
          ["gato", "pato", "pata", "pala", "sala"],
          ["casa", "cosa", "copa"],
        ];
  const valid = new Set([...dictionary, ...known.flat()]);
  function paint() {
    startWord.textContent = path.at(-1).toUpperCase();
    goal.textContent = `${c.t("game.target")}: ${solution.at(-1).toUpperCase()} · ${c.t("game.minimum")}: ${solution.length - 1}`;
    route.replaceChildren(
      ...path.map((w, i) =>
        el("span", { class: "tag" }, `${i + 1}. ${w.toUpperCase()}`),
      ),
    );
    c.status({ score });
  }
  function setup() {
    const random = c.daily ? seeded(`${dayKey()}:${c.lang}:ladder`) : c.random;
    const candidate = pick(known, random);
    solution =
      shortestPath(candidate[0], candidate.at(-1), [...valid]) ?? candidate;
    path = [solution[0]];
    score = 0;
    helps = 0;
    paint();
  }
  const input = c.input((value, node) => {
    const w = c.normalize(value);
    if (!valid.has(w) || !oneApart(path.at(-1), w)) {
      c.notice(c.t("game.invalid"));
      return;
    }
    if (path.includes(w)) {
      c.notice(c.t("game.used"));
      return;
    }
    path.push(w);
    c.sound("correct");
    node.value = "";
    paint();
    if (w === solution.at(-1)) {
      score = Math.max(
        50,
        1500 - (path.length - 1 - (solution.length - 1)) * 100 - helps * 100,
      );
      c.finish(score, { passos: path.length - 1, minimo: solution.length - 1 });
    }
  });
  c.controls.append(
    button(
      c.t("game.hintCost"),
      () => {
        if (!c.isRunning()) return;
        const next = shortestPath(path.at(-1), solution.at(-1), [...valid]);
        helps++;
        c.notice(`${c.t("common.help")}: ${next?.[1]?.toUpperCase() ?? "—"}`);
      },
      "button ghost",
    ),
  );
  setup();
  return {
    mode: () => (c.daily ? "daily" : "classic"),
    start: setup,
    update() {
      c.status({ score });
    },
  };
}
