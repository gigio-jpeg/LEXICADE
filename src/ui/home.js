import { el, getJSON } from "./components.js";
import { path, config } from "../core/config.js";
import { t, lang } from "../core/i18n.js";
import { guestProfile } from "../core/guest.js";
import { dayKey } from "../core/rng.js";
export function gameCard(game) {
  const bests = Object.entries(guestProfile().bests)
    .filter(([key]) => key.startsWith(game.id + ":"))
    .map(([, r]) => r.score);
  const best = Math.max(0, ...bests);
  return el(
    "a",
    {
      class: `game-card color-${game.color}`,
      href: path(game.path),
      "aria-label": `${t("home.open")} ${game.name[lang()]}`,
    },
    el(
      "div",
      { class: "card-art" },
      el(
        "span",
        { class: "card-badge" },
        t(`category.${game.category}`).toUpperCase(),
      ),
      el("span", { class: "game-glyph", "aria-hidden": "true" }, game.icon),
    ),
    el(
      "div",
      { class: "card-body" },
      el("h3", {}, game.name[lang()]),
      el("p", {}, game.description[lang()]),
      el(
        "div",
        { class: "card-bottom" },
        el(
          "span",
          {},
          `${t("home.best")} ${best ? best.toLocaleString() : "—"}`,
        ),
        el("span", { class: "card-arrow", "aria-hidden": "true" }, "↗"),
      ),
    ),
  );
}
export async function home(main) {
  const games = await getJSON(path("data/games.json"));
  const board = el(
    "div",
    { class: "arcade-board", "aria-hidden": "true" },
    el(
      "div",
      { class: "board-caption" },
      el("span", {}, config.name),
      el("span", {}, "01"),
    ),
    el(
      "div",
      { class: "board-grid" },
      ...[..."JOGARPLAY!WORDS"].map((c, i) =>
        el(
          "span",
          { class: `board-key ${i < 5 ? "correct" : i > 9 ? "present" : ""}` },
          c,
        ),
      ),
    ),
    el(
      "div",
      { class: "board-bottom" },
      el("span", {}, "● " + t("home.player")),
      el("span", {}, t("home.ready") + "_"),
    ),
  );
  const hero = el(
    "section",
    { class: "hero" },
    el("div", { class: "background-grid" }),
    el(
      "div",
      { class: "hero-copy" },
      el("div", { class: "eyebrow" }, t("home.eyebrow")),
      el("h1", {}, t("home.title"), el("span", {}, t("home.titleAccent"))),
      el("p", { class: "hero-description" }, t("home.description")),
      el(
        "a",
        { class: "button large", href: path(games[0].path) },
        "▶ ",
        t("home.cta"),
      ),
      el("p", { class: "hero-note" }, t("home.noAccount")),
      el(
        "div",
        { class: "hero-facts" },
        ...["games", "languages", "free"].map((key) =>
          el("span", {}, t(`home.${key}`)),
        ),
      ),
    ),
    el(
      "div",
      { class: "hero-art", "aria-hidden": "true" },
      el("div", { class: "art-halo" }),
      board,
      el(
        "div",
        { class: "floating-card top" },
        el("small", {}, t("game.record")),
        el("strong", {}, "2.840"),
      ),
      el(
        "div",
        { class: "floating-card bottom" },
        el("small", {}, t("home.keepGoing")),
        el("strong", {}, t("game.combo").toUpperCase() + " ×8"),
      ),
      el("span", { class: "art-spark" }, "✦"),
      el("span", { class: "art-spark second" }, "✦"),
    ),
  );
  const daily = el(
    "section",
    { class: "daily-banner" },
    el("div", { class: "daily-icon", "aria-hidden": "true" }, "◈"),
    el(
      "div",
      {},
      el(
        "div",
        { class: "daily-date" },
        `${t("nav.daily").toUpperCase()} / ${dayKey()}`,
      ),
      el("h3", {}, t("home.dailyTitle")),
      el("p", {}, t("home.dailyText")),
    ),
    el(
      "a",
      { class: "button small ghost", href: path("pages/diario.html") },
      t("home.dailyButton"),
      " ↗",
    ),
  );
  const grid = el("div", { class: "game-grid" }),
    filters = el("div", { class: "filters" });
  let category = "all",
    search = "";
  const render = () =>
    grid.replaceChildren(
      ...games
        .filter(
          (g) =>
            (category === "all" || g.category === category) &&
            g.name[lang()].toLowerCase().includes(search.toLowerCase()),
        )
        .map(gameCard),
    );
  for (const key of [
    "all",
    "typing",
    "logic",
    "arcade",
    "crossword",
    "reflex",
  ]) {
    const node = el(
      "button",
      {
        type: "button",
        class: `chip ${key === "all" ? "active" : ""}`,
        "aria-pressed": key === "all",
      },
      t(`category.${key}`),
    );
    node.addEventListener("click", () => {
      category = key;
      for (const b of filters.children) {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      }
      node.classList.add("active");
      node.setAttribute("aria-pressed", "true");
      render();
    });
    filters.append(node);
  }
  render();
  const input = el("input", {
    class: "search",
    type: "search",
    placeholder: t("home.search"),
    "aria-label": t("home.search"),
    oninput: (e) => {
      search = e.target.value;
      render();
    },
  });
  const library = el(
    "section",
    { class: "section", id: "games" },
    el(
      "div",
      { class: "section-heading" },
      el(
        "div",
        {},
        el("p", { class: "eyebrow" }, t("home.select")),
        el("h2", {}, t("home.library")),
        el("p", {}, t("home.subtitle")),
      ),
    ),
    el("div", { class: "filter-row" }, filters, input),
    grid,
  );
  const account = el(
    "aside",
    { class: "account-banner" },
    el("div", { class: "avatar", "aria-hidden": "true" }, "✦"),
    el(
      "div",
      {},
      el("h3", {}, t("home.accountTitle")),
      el("p", {}, t("home.accountText")),
    ),
    el(
      "a",
      { class: "button ghost", href: path("pages/login.html") },
      t("auth.signup"),
      " ↗",
    ),
  );
  main.replaceChildren(
    el("div", { class: "container" }, hero, daily, library, account),
  );
}
