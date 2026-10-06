import { el } from "../components.js";
import { validateRhyme, rhymeScore } from "../../games/rimas.js";
export function create(c) {
  const target = el("div", { class: "big-word" }),
    list = el("div", { class: "word-list" });
  c.area.append(target, list);
  let group = c.pick(c.data.rimas),
    used = [group[0]],
    score = 0,
    remaining = 60,
    combo = 0,
    max = 0;
  target.textContent = group[0].toUpperCase();
  c.input((value, node) => {
    const state = validateRhyme(value, group, used);
    if (state !== "valid") {
      c.notice(c.t(`game.${state}`));
      if (state === "invalid") combo = 0;
      c.sound("error");
      return;
    }
    used.push(c.normalize(value));
    combo++;
    max = Math.max(max, combo);
    score += rhymeScore(value, combo);
    list.append(el("span", { class: "tag" }, value));
    node.value = "";
    c.sound("correct");
    if (used.length === group.length) {
      group = c.pick(c.data.rimas.filter((g) => g[0] !== group[0]));
      used = [group[0]];
      target.textContent = group[0].toUpperCase();
      remaining = Math.min(90, remaining + 10);
    }
  });
  let total = 0;
  const observer = new MutationObserver((records) => {
    total += records.reduce((sum, r) => sum + r.addedNodes.length, 0);
  });
  observer.observe(list, { childList: true });
  return {
    mode: () => "classic",
    update(dt) {
      remaining -= dt;
      if (remaining <= 0)
        c.finish(score, { rimas: total, maior_sequencia: max });
      c.status({ score, combo, remaining });
    },
    destroy() {
      observer.disconnect();
    },
  };
}
