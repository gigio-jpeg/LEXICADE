import { read, write } from "../core/storage.js";
import { el, button } from "./components.js";
import { t } from "../core/i18n.js";
export function tutorial(game, description) {
  if (read(`tutorial:${game}`)) return null;
  const node = el("aside", { class: "tutorial" }, el("p", {}, description));
  node.append(
    button(
      t("game.gotIt"),
      () => {
        write(`tutorial:${game}`, true);
        node.remove();
      },
      "button small ghost",
    ),
  );
  return node;
}
