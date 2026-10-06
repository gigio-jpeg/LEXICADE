import { el, button } from "./components.js";
import { t, lang, changeLanguage } from "../core/i18n.js";
import { path, config } from "../core/config.js";
import { settings, saveSettings, read } from "../core/storage.js";
import { session, signOut } from "../core/auth.js";
import { themeChoices } from "../core/cosmetics.js";
import { threshold } from "../core/scoring.js";
export function brand() {
  return el(
    "a",
    { class: "brand", href: path(), "aria-label": config.name },
    el("span", { class: "brand-mark", "aria-hidden": "true" }, config.name[0]),
    el("span", {}, config.name, el("span", { class: "brand-dot" }, ".")),
  );
}
export function applySettings() {
  const s = settings();
  document.documentElement.dataset.theme = s.theme;
  document.documentElement.dataset.motion = s.reducedMotion ? "reduced" : "";
  document.documentElement.dataset.colorblind = s.colorblind;
  document.documentElement.style.setProperty(
    "--font-size",
    `${Math.max(14, Math.min(22, s.fontSize))}px`,
  );
  document.body.classList.toggle("crt", s.crt);
  document.body.classList.toggle("focus-mode", s.focus);
}
export function header(active = "") {
  const nav = el(
    "nav",
    { class: "main-nav", "aria-label": t("nav.play") },
    ...[
      ["play", ""],
      ["daily", "pages/diario.html"],
      ["ranking", "pages/ranking.html"],
    ].map(([key, route]) =>
      el(
        "a",
        { href: path(route), class: active === key ? "active" : "" },
        t(`nav.${key}`),
      ),
    ),
  );
  const language = el(
    "select",
    {
      class: "compact-select",
      "aria-label": t("nav.language"),
      onchange: (e) => changeLanguage(e.target.value),
    },
    ...[
      ["pt-BR", "PT-BR"],
      ["en", "EN"],
      ["es", "ES"],
    ].map(([value, label]) =>
      el("option", { value, selected: value === lang() }, label),
    ),
  );
  const theme = el(
    "select",
    {
      class: "compact-select theme-select",
      "aria-label": t("nav.theme"),
      onchange: (e) => saveSettings({ theme: e.target.value }),
    },
    ...themeChoices().map((value) =>
      el(
        "option",
        { value, selected: value === settings().theme },
        t(`theme.${value}`),
      ),
    ),
  );
  const sound = button(
    settings().sound ? "♪" : "♫",
    () => {
      const s = saveSettings({ sound: !settings().sound });
      sound.setAttribute("aria-pressed", s.sound);
      sound.textContent = s.sound ? "♪" : "♫";
    },
    "icon-button",
    { "aria-label": t("nav.sound"), "aria-pressed": settings().sound },
  );
  let login = el(
    "a",
    {
      class: "button small ghost header-login",
      href: path("pages/login.html"),
    },
    t("nav.login"),
    " ↗",
  );
  if (session()) {
    const profile = read("account-summary", {
      username: t("nav.profile"),
      level: 1,
      xp: 0,
    });
    const bar = el("div", { class: "progress" }, el("span"));
    const baseline = profile.level === 1 ? 0 : threshold(profile.level);
    bar.style.setProperty(
      "--progress",
      `${Math.min(100, (100 * (profile.xp - baseline)) / (threshold(profile.level + 1) - baseline))}%`,
    );
    const menu = el(
      "div",
      { class: "user-menu" },
      ...[
        ["profile", "perfil"],
        ["achievements", "conquistas"],
        ["shop", "loja"],
        ["settings", "ajustes"],
      ].map(([key, file]) =>
        el("a", { href: path(`pages/${file}.html`) }, t(`nav.${key}`)),
      ),
      button(
        t("nav.logout"),
        () => signOut().then(() => (location.href = path())),
        "button small ghost",
      ),
    );
    login = el(
      "details",
      { class: "user-details" },
      el(
        "summary",
        {},
        el(
          "span",
          { class: "user-label" },
          profile.username,
          el("small", {}, `${t("common.level")} ${profile.level}`),
          bar,
        ),
      ),
      menu,
    );
  }
  return el(
    "header",
    { class: "site-header" },
    el(
      "div",
      { class: "container header-row" },
      brand(),
      nav,
      el("div", { class: "header-tools" }, language, theme, sound, login),
    ),
  );
}
export function footer() {
  return el(
    "footer",
    { class: "site-footer" },
    el(
      "div",
      { class: "container" },
      el(
        "div",
        { class: "footer-row" },
        el("div", {}, brand(), el("p", {}, t("footer.text"))),
        el(
          "nav",
          { class: "footer-links", "aria-label": t("nav.settings") },
          ...[
            ["achievements", "conquistas"],
            ["shop", "loja"],
            ["settings", "ajustes"],
            ["about", "sobre"],
          ].map(([key, file]) =>
            el("a", { href: path(`pages/${file}.html`) }, t(`nav.${key}`)),
          ),
        ),
      ),
      el("p", { class: "eyebrow" }, "● ", t("footer.status")),
    ),
  );
}
