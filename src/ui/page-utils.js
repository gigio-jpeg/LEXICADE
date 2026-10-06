import { el } from "./components.js";
import { t } from "../core/i18n.js";
import { config } from "../core/config.js";
export function page(main, title, subtitle = "") {
  const content = el("div", { class: "page-content" });
  main.replaceChildren(
    el(
      "div",
      { class: "container" },
      el(
        "div",
        { class: "page-heading" },
        el(
          "p",
          { class: "eyebrow" },
          config.name + " / " + t(title).toUpperCase(),
        ),
        el("h1", {}, t(title)),
        subtitle ? el("p", {}, t(subtitle)) : null,
      ),
      content,
    ),
  );
  return content;
}
export const stat = (label, value) =>
  el(
    "div",
    { class: "stat" },
    el("strong", {}, String(value)),
    el("span", {}, t(label)),
  );
export function downloadJSON(value, name = "lexicade-dados.json") {
  const blob = new Blob([JSON.stringify(value, null, 2)], {
      type: "application/json",
    }),
    url = URL.createObjectURL(blob);
  const a = el("a", { href: url, download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
