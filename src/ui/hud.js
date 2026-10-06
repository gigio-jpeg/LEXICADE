import { el } from "./components.js";
import { t } from "../core/i18n.js";
export function hud() {
  const score = el("strong", {}, "0"),
    lives = el("strong", {}, "—"),
    combo = el("strong", {}, "×1"),
    time = el("strong", {}, "0:00");
  const row = el(
    "div",
    { class: "hud", "aria-label": t("game.hud") },
    ...[
      [score, "game.score"],
      [lives, "game.lives"],
      [combo, "game.combo"],
      [time, "game.time"],
    ].map(([node, key]) => el("div", {}, el("span", {}, t(key)), node)),
  );
  return {
    node: row,
    update(state) {
      score.textContent = Math.round(state.score ?? 0).toLocaleString();
      lives.textContent =
        state.lives == null ? "—" : `♥ ×${Math.max(0, state.lives)}`;
      combo.textContent = `×${state.combo ?? 1}`;
      const seconds = Math.max(
        0,
        Math.ceil(state.remaining ?? state.elapsed ?? 0),
      );
      time.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
    },
  };
}
