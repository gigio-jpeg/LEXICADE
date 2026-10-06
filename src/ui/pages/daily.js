import { el, getJSON, button } from "../components.js";
import { t, lang } from "../../core/i18n.js";
import { path, dataLang } from "../../core/config.js";
import { guestProfile } from "../../core/guest.js";
import { dayKey } from "../../core/rng.js";
import { session } from "../../core/auth.js";
import { dailyState } from "../../core/api.js";
import { page, stat } from "../page-utils.js";
export async function dailyPage(main) {
  const content = page(main, "daily.title", "daily.subtitle"),
    p = guestProfile(),
    games = await getJSON(path("data/games.json"));
  let date = dayKey();
  const heading = el(
      "div",
      { class: "stat-grid" },
      stat("game.daily", date),
      stat("profile.streak", p.streak),
      stat("common.xp", "+20"),
      stat("nav.play", "4"),
    ),
    grid = el("div", { class: "daily-grid", style: "margin-top:25px" });
  content.append(heading, grid);
  function render(completed = p.daily) {
    grid.replaceChildren(
      ...games
        .filter((g) =>
          ["typerush", "decifra", "cruzadinha", "escada"].includes(g.id),
        )
        .map((g) => {
          const done = !!completed[`${date}:${g.id}:${dataLang(lang())}`];
          return el(
            "div",
            { class: `daily-card color-${g.color}` },
            el("div", { class: "game-glyph" }, g.icon),
            el(
              "div",
              {},
              el("h3", {}, g.name[lang()]),
              el(
                "p",
                {},
                done ? "✓ " + t("daily.done") : g.description[lang()],
              ),
              el(
                "a",
                {
                  class: "button small ghost",
                  href: path(`${g.path}?daily=1`),
                },
                t("daily.play"),
                " ↗",
              ),
            ),
          );
        }),
    );
  }
  render();
  if (session())
    content.append(
      button(
        t("ranking.load"),
        async () => {
          try {
            const data = await dailyState();
            date = data.play_date;
            const completed = {};
            data.results.forEach(
              (r) => (completed[`${date}:${r.game}:${r.lang}`] = true),
            );
            render(completed);
          } catch {
            grid.append(el("p", {}, t("common.error")));
          }
        },
        "button ghost",
      ),
    );
}
