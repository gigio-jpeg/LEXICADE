import { el, getJSON, field, button, toast } from "../components.js";
import { t, lang } from "../../core/i18n.js";
import { path, dataLang } from "../../core/config.js";
import { guestProfile } from "../../core/guest.js";
import { session } from "../../core/auth.js";
import {
  ownProfile,
  publicProfile,
  myStats,
  updateProfile,
} from "../../core/api.js";
import { threshold } from "../../core/scoring.js";
import { page, stat } from "../page-utils.js";
import { avatarGlyph } from "../../core/cosmetics.js";
import { chart } from "../charts.js";
export async function profilePage(main) {
  const content = page(main, "profile.title");
  const username = new URL(location.href).searchParams.get("u");
  let profile = guestProfile(),
    stats = {
      history: profile.history,
      bests: Object.values(profile.bests),
      rounds: profile.totalRounds ?? profile.history.length,
      time_ms:
        profile.totalTime ??
        profile.history.reduce((n, r) => n + r.duration_ms, 0),
      per_game: Object.entries(profile.gameCounts ?? {}).map(
        ([game, rounds]) => ({ game, rounds }),
      ),
      decifra: profile.decifraStats ?? { played: 0, wins: 0, distribution: {} },
    };
  if (username) {
    try {
      profile = await publicProfile(username);
      if (!profile) {
        content.append(el("p", { class: "empty" }, t("common.empty")));
        return;
      }
      content.append(
        el(
          "div",
          { class: "profile-heading" },
          el(
            "div",
            { class: "avatar", "data-frame": profile.equipped?.frame ?? "" },
            avatarGlyph(profile.equipped),
          ),
          el(
            "div",
            {},
            el("h2", {}, profile.username),
            el(
              "p",
              {},
              `${t("common.level")} ${profile.level} · ${profile.country ?? "—"}`,
            ),
          ),
        ),
      );
      return;
    } catch {
      content.append(el("p", { class: "empty" }, t("common.error")));
      return;
    }
  }
  if (session()) {
    try {
      profile = await ownProfile();
      stats = await myStats();
    } catch {
      toast(t("common.error"), true);
    }
  }
  const p = profile ?? guestProfile(),
    avatar = el(
      "div",
      { class: "avatar", "data-frame": p.equipped?.frame ?? "" },
      avatarGlyph(p.equipped),
    );
  const baseline = (p.level ?? 1) === 1 ? 0 : threshold(p.level);
  const progress = Math.min(
    100,
    (100 * ((p.xp ?? 0) - baseline)) /
      (threshold((p.level ?? 1) + 1) - baseline),
  );
  const bar = el(
    "div",
    { class: "progress", "aria-label": t("common.xp") },
    el("span"),
  );
  bar.style.setProperty("--progress", `${progress}%`);
  content.append(
    el(
      "div",
      { class: "profile-heading" },
      avatar,
      el(
        "div",
        {},
        el("h2", {}, p.username ?? t("nav.guest")),
        el("p", {}, `${t("common.level")} ${p.level} · ${p.xp} XP`),
        bar,
      ),
    ),
    el(
      "div",
      { class: "stat-grid" },
      stat("profile.played", stats.rounds ?? 0),
      stat("common.coins", p.coins ?? 0),
      stat("profile.streak", p.streak_current ?? p.streak ?? 0),
      stat("profile.time", `${Math.round((stats.time_ms ?? 0) / 60000)} min`),
    ),
  );
  const games = await getJSON(path("data/games.json"));
  const names = Object.fromEntries(games.map((g) => [g.id, g.name[lang()]]));
  const columns = el("div", { class: "profile-columns" }),
    history = el(
      "section",
      { class: "panel" },
      el("h2", {}, t("profile.history")),
    ),
    bests = el("section", { class: "panel" }, el("h2", {}, t("profile.bests")));
  const rows = stats.history ?? [];
  if (rows.length) {
    history.append(
      chart(
        rows
          .filter((r) => r.game === "typerush")
          .map((r) => r.metrics?.ppm ?? 0)
          .reverse(),
        t("game.speedChart"),
      ),
    );
    const table = el(
        "table",
        { class: "table" },
        el(
          "thead",
          {},
          el(
            "tr",
            {},
            el("th", {}, t("nav.play")),
            el("th", {}, t("game.score")),
            el("th", {}, t("game.time")),
          ),
        ),
      ),
      body = el("tbody");
    rows
      .slice(0, 20)
      .forEach((r) =>
        body.append(
          el(
            "tr",
            {},
            el("td", {}, names[r.game] ?? r.game),
            el("td", {}, r.score.toLocaleString()),
            el("td", {}, new Date(r.created_at).toLocaleDateString(lang())),
          ),
        ),
      );
    table.append(body);
    history.append(el("div", { class: "table-wrap" }, table));
  } else history.append(el("p", { class: "empty" }, t("common.empty")));
  const records = stats.bests ?? [];
  if (records.length)
    records
      .slice(0, 16)
      .forEach((r) =>
        bests.append(
          el(
            "p",
            {},
            el("strong", {}, names[r.game] ?? r.game),
            " · ",
            String(r.best_score ?? r.score),
            " · ",
            r.lang,
          ),
        ),
      );
  else bests.append(el("p", { class: "empty" }, t("common.empty")));
  columns.append(history, bests);
  content.append(columns);
  const byGame = el(
    "section",
    { class: "panel", style: "margin-top:20px" },
    el("h2", {}, t("profile.byGame")),
  );
  for (const item of stats.per_game ?? [])
    byGame.append(
      el(
        "p",
        {},
        el("strong", {}, names[item.game] ?? item.game),
        " · ",
        String(item.rounds),
        " ",
        t("profile.played").toLowerCase(),
      ),
    );
  if (!(stats.per_game ?? []).length)
    byGame.append(el("p", {}, t("common.empty")));
  const ds = stats.decifra ?? { played: 0, wins: 0, distribution: {} };
  const decode = el(
    "section",
    { class: "panel", style: "margin-top:20px" },
    el("h2", {}, t("profile.decodeStats")),
    el("p", {}, `${ds.wins ?? 0}/${ds.played ?? 0} ${t("profile.wins")}`),
    chart(
      Array.from({ length: 9 }, (_, i) => ds.distribution?.[i + 1] ?? 0),
      t("profile.distribution"),
    ),
    el(
      "p",
      { class: "mono" },
      Object.entries(ds.distribution ?? {})
        .map(([attempts, count]) => `${attempts}: ${count}`)
        .join(" · ") || "—",
    ),
  );
  content.append(el("div", { class: "profile-columns" }, byGame, decode));
  if (session()) {
    const name = el("input", {
        value: p.username ?? "",
        pattern: "[A-Za-z0-9_]{3,20}",
        required: true,
      }),
      country = el("input", {
        value: p.country ?? "",
        maxlength: 2,
        pattern: "[A-Za-z]{2}",
      }),
      form = el(
        "form",
        { class: "panel", style: "margin-top:20px" },
        field(t("profile.username"), name),
        field(t("profile.country"), country),
      );
    const submit = el(
      "button",
      { type: "submit", class: "button" },
      t("common.save"),
    );
    form.append(
      submit,
      el(
        "a",
        {
          class: "button ghost",
          href: path(`pages/perfil.html?u=${encodeURIComponent(p.username)}`),
        },
        t("profile.public"),
      ),
    );
    form.onsubmit = async (e) => {
      e.preventDefault();
      submit.disabled = true;
      try {
        await updateProfile({
          p_username: name.value,
          p_country: country.value.toUpperCase() || null,
          p_lang: dataLang(lang()),
          p_avatar: p.avatar_id ?? "default",
          p_time_zone:
            p.time_zone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
          p_age_band: p.age_band ?? "adult",
          p_guardian_consent: p.guardian_consent ?? false,
          p_terms_accepted: true,
        });
        toast(t("common.saved"));
      } catch {
        toast(t("common.error"), true);
      } finally {
        submit.disabled = false;
      }
    };
    content.append(form);
  }
}
