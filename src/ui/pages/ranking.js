import { el, button, field, getJSON } from "../components.js";
import { t, lang } from "../../core/i18n.js";
import { path, dataLang } from "../../core/config.js";
import { leaderboard } from "../../core/api.js";
import { avatarGlyph } from "../../core/cosmetics.js";
import { session } from "../../core/auth.js";
import { page } from "../page-utils.js";
export async function rankingPage(main) {
  const content = page(main, "ranking.title", "ranking.subtitle"),
    games = await getJSON(path("data/games.json"));
  let offset = 0,
    request = 0;
  const game = el(
      "select",
      {},
      ...games.map((g) => el("option", { value: g.id }, g.name[lang()])),
    ),
    mode = el(
      "select",
      {},
      ...[
        "classic",
        "daily",
        "acceleration",
        "survival",
        "infinite",
        "duet",
        "quartet",
        "advanced",
        "sequence",
        "timed",
        "hard",
      ].map((k) => el("option", { value: k }, t(`game.${k}`))),
    );
  const period = el(
      "select",
      {},
      ...["day", "week", "month", "all"].map((k) =>
        el("option", { value: k }, t(`ranking.${k}`)),
      ),
    ),
    language = el(
      "select",
      {},
      el("option", { value: "" }, t("ranking.any")),
      ...["pt", "en", "es"].map((k) =>
        el("option", { value: k }, k.toUpperCase()),
      ),
    ),
    country = el("input", {
      maxlength: 2,
      placeholder: "BR",
      "aria-label": t("ranking.country"),
    });
  language.value = dataLang(lang());
  const filters = el(
      "div",
      { class: "game-options" },
      field(t("nav.play"), game),
      field(t("game.mode"), mode),
      field(t("ranking.period"), period),
      field(t("nav.language"), language),
      field(t("ranking.country"), country),
    ),
    results = el("div", { class: "panel table-wrap" }),
    pagination = el("div", { class: "actions", style: "margin-top:18px" });
  content.append(filters, results, pagination);
  async function load() {
    const revision = ++request;
    results.replaceChildren(el("p", { class: "empty" }, t("common.loading")));
    try {
      // Ranking requests happen only on this page after the Supabase schema is applied.
      if (!navigator.onLine) {
        results.replaceChildren(
          el("p", { class: "empty" }, t("common.onlineOnly")),
        );
        return;
      }
      const data = await leaderboard({
        p_game: game.value,
        p_mode: mode.value,
        p_lang: language.value || null,
        p_period: period.value,
        p_country: country.value.toUpperCase() || null,
        p_limit: 20,
        p_offset: offset,
      });
      if (revision !== request) return;
      const rows = data.rows ?? [];
      if (!rows.length) {
        results.replaceChildren(el("p", { class: "empty" }, t("common.empty")));
        return;
      }
      const table = el(
          "table",
          { class: "table" },
          el(
            "thead",
            {},
            el(
              "tr",
              {},
              ...["position", "player"].map((k) =>
                el("th", {}, t(`ranking.${k}`)),
              ),
              el("th", {}, t("game.score")),
            ),
          ),
        ),
        body = el("tbody");
      for (const row of rows)
        body.append(
          el(
            "tr",
            { class: row.is_me ? "own" : "" },
            el("td", {}, String(row.position).padStart(2, "0")),
            el(
              "td",
              {},
              el(
                "a",
                {
                  class: "ranking-player",
                  href: path(
                    `pages/perfil.html?u=${encodeURIComponent(row.username)}`,
                  ),
                },
                el(
                  "span",
                  { class: "avatar", "data-frame": row.equipped?.frame ?? "" },
                  avatarGlyph(row.equipped),
                ),
                row.username,
              ),
              ` · ${t("common.level")} ${row.level}`,
            ),
            el("td", {}, row.score.toLocaleString()),
          ),
        );
      table.append(body);
      results.replaceChildren(table);
      if (data.my_position)
        results.append(el("p", {}, `${t("common.you")}: #${data.my_position}`));
    } catch {
      if (revision === request)
        results.replaceChildren(el("p", { class: "empty" }, t("common.error")));
    }
  }
  for (const select of [game, mode, period, language, country])
    select.addEventListener("change", () => {
      offset = 0;
      load();
    });
  pagination.append(
    button(
      "← " + t("common.previous"),
      () => {
        offset = Math.max(0, offset - 20);
        load();
      },
      "button ghost",
    ),
    button(
      t("common.next") + " →",
      () => {
        offset += 20;
        load();
      },
      "button ghost",
    ),
  );
  // No automatic remote request before user interaction: development does not modify or query the owner's project.
  results.append(
    el("p", { class: "empty" }, t("ranking.loadHint")),
    button(t("ranking.load"), load, "button"),
  );
  return () => request++;
}
