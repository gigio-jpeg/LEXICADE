import { el, button } from "../ui/components.js";
import { t, lang, changeLanguage } from "../core/i18n.js";
import { config, path } from "../core/config.js";
import { settings, saveSettings } from "../core/storage.js";
import { session } from "../core/auth.js";
import { COLORS } from "./navigation.js";
import { music, currentTrack, nextTrack } from "../core/audio.js";
export function roomUI(root, games, actions) {
  const abort = new AbortController();
  if (settings().audioDefaultsVersion !== 2)
    saveSettings({ sound: true, music: true, audioDefaultsVersion: 2 });
  const logo = el(
    "a",
    { class: "room-logo", href: path(), "aria-label": config.name },
    el("span", { class: "room-logo-symbol", "aria-hidden": "true" }, "L"),
    el("span", {}, config.name, el("small", {}, "WORD ARCADE")),
  );
  const language = el(
    "select",
    {
      "aria-label": t("nav.language"),
      class: "room-language",
      onchange: (e) => changeLanguage(e.target.value),
    },
    ...["pt-BR", "en", "es"].map((value) =>
      el(
        "option",
        { value, selected: value === lang() },
        value === "pt-BR" ? "PT" : value.toUpperCase(),
      ),
    ),
  );
  const trackName = el("span", { class: "room-track-name" }, currentTrack().name);
  const playback = button("Ⅱ", () => saveSettings({ music: !settings().music }), "room-player-button");
  const skip = button("›|", nextTrack, "room-player-button", { "aria-label": t("room.nextTrack"), title: t("room.nextTrack") });
  const player = el("div", { class: "room-player", role: "group", "aria-label": t("room.playlist") },
    el("div", { class: "room-track-copy" }, el("small", {}, "LEXICADE FM"), trackName), playback, skip);
  function syncAudio() {
    const s = settings();
    playback.textContent = s.music ? "Ⅱ" : "▷";
    playback.setAttribute("aria-label", t(s.music ? "room.pauseMusic" : "room.playMusic"));
    playback.title = t(s.music ? "room.pauseMusic" : "room.playMusic");
    playback.setAttribute("aria-pressed", s.music);
    trackName.textContent = currentTrack().name;
    player.title = currentTrack().name;
    music(s.music && !document.hidden);
  }
  document.addEventListener("settings", syncAudio, { signal: abort.signal });
  document.addEventListener("visibilitychange", syncAudio, { signal: abort.signal });
  document.addEventListener("musictrackchange", syncAudio, { signal: abort.signal });
  for (const event of ["pointerdown", "keydown"])
    document.addEventListener(event, () => {
      if (settings().music && !document.hidden) music(true);
    }, { signal: abort.signal });
  syncAudio();
  const overview = button(
    "⌑ " + t("room.room"),
    actions.overview,
    "room-text-button",
  );
  const account = button(
    session() ? t("room.profile") : t("room.login"),
    () => actions.account(session() ? "profile" : "login"),
    "room-account-button",
  );
  const exit = button("← " + t("room.close"), actions.leave, "room-exit");
  exit.hidden = true;
  const header = el(
    "header",
    { class: "room-header" },
    logo,
    el(
      "div",
      { class: "room-header-actions" },
      overview,
      language,
      player,
      account,
      exit,
    ),
  );
  const title = el(
    "h1",
    {},
    t("room.title"),
    el("em", {}, t("room.titleAccent")),
  );
  const intro = el(
    "div",
    { class: "room-intro" },
    el("p", { class: "room-eyebrow" }, el("i", {}), t("room.eyebrow")),
    title,
    el("p", { class: "room-subtitle" }, t("room.subtitle")),
    button(t("room.play") + " →", actions.play, "room-primary"),
    el("p", { class: "room-free" }, t("room.free")),
  );
  const name = el("h2"),
    description = el("p"),
    index = el("span", { class: "room-machine-number" }),
    dots = el("div", { class: "room-dots" });
  const nav = el(
    "nav",
    { class: "room-machine-navigation", "aria-label": t("room.machine") },
    button("←", () => actions.step(-1), "room-nav-arrow", {
      "aria-label": t("room.previous"),
    }),
    el(
      "div",
      { class: "room-machine-copy" },
      el(
        "div",
        { class: "room-machine-meta" },
        index,
        el("span", {}, "ORIGINAL GAME"),
      ),
      name,
      description,
    ),
    button("→", () => actions.step(1), "room-nav-arrow", {
      "aria-label": t("room.next"),
    }),
  );
  games.forEach((g, i) =>
    dots.append(
      button(
        String(i + 1).padStart(2, "0"),
        () => actions.select(i),
        "room-dot",
        { "aria-label": g.name[lang()] },
      ),
    ),
  );
  const footer = el(
    "footer",
    { class: "room-footer" },
    el("span", { class: "room-control-guide" }, t("room.guide")),
    dots,
    el("span", { class: "room-coordinate" }, "EST. 2026 / ONLINE ARCADE"),
  );
  const loading = el(
    "div",
    { class: "room-loader", role: "status" },
    el("div", { class: "room-loader-mark" }, "L"),
    el("p", {}, t("room.loading")),
  );
  root.append(header, intro, nav, footer, loading);
  function update(i, state) {
    root.style.setProperty("--machine-color", COLORS[i]);
    const game = games[i];
    name.textContent = game.name[lang()];
    description.textContent = game.description[lang()];
    index.textContent = `${t("room.machine")} ${String(i + 1).padStart(2, "0")} / 04`;
    dots.querySelectorAll("button").forEach((node, n) => {
      node.classList.toggle("active", i === n);
      node.setAttribute("aria-current", i === n ? "true" : "false");
    });
    root.dataset.view = state;
    exit.hidden = state !== "play";
    overview.hidden = state === "play";
    root.classList.toggle("is-playing", state === "play");
    intro.hidden = state === "play" || state === "overview";
    nav.hidden = state === "play";
    footer.hidden = state === "play";
    account.hidden = state === "play";
    language.disabled = state === "play";
    root.setAttribute("aria-label", game.name[lang()]);
  }
  return {
    update,
    ready() {
      loading.remove();
      root.dataset.ready = "true";
    },
    dispose() {
      abort.abort();
      music(false);
      header.remove();
      intro.remove();
      nav.remove();
      footer.remove();
      loading.remove();
    },
  };
}
export async function accountPanel(route) {
  const container = el("div", { class: "room-account-content" }),
    close = button("×", () => dialog.close(), "room-dialog-close", {
      "aria-label": t("common.close"),
    });
  const navigation = el(
    "nav",
    { class: "room-panel-nav" },
    ...["profile", "ranking", "settings"].map((view) =>
      button(
        t(`nav.${view}`),
        () => {
          dialog.close();
          accountPanel(view);
        },
        view === route ? "active" : "",
      ),
    ),
  );
  const dialog = el(
    "dialog",
    { class: "room-account-dialog" },
    el("div", { class: "room-dialog-header" }, ...(["reset", "onboard"].includes(route) ? [] : [navigation]), close),
    container,
  );
  document.body.append(dialog);
  dialog.showModal();
  let cleanup;
  dialog.addEventListener(
    "close",
    () => {
      cleanup?.();
      const url = new URL(location.href);url.searchParams.delete("panel");url.searchParams.delete("u");history.replaceState(history.state,"",url);
      dialog.remove();
    },
    { once: true },
  );
  try {
    if (["login", "reset", "onboard"].includes(route))
      cleanup = await (
        await import("../ui/pages/login.js")
      ).loginPage(container, route);
    else if (route === "profile")
      await (await import("../ui/pages/profile.js")).profilePage(container);
    else if (route === "ranking")
      cleanup = await (
        await import("../ui/pages/ranking.js")
      ).rankingPage(container);
    else if (route === "settings")
      cleanup = (await import("../ui/pages/settings.js")).settingsPage(
        container,
      );
    else if (route === "about")
      (await import("../ui/pages/about.js")).aboutPage(container);
    else if (["shop", "achievements"].includes(route))
      await (
        await import("../ui/pages/collection.js")
      ).collectionPage(container, route);
    close.focus();
  } catch {
    container.replaceChildren(el("p", {}, t("common.error")));
  }
}
