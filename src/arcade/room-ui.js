import { el, button } from "../ui/components.js";
import { t, lang, changeLanguage } from "../core/i18n.js";
import { config, path } from "../core/config.js";
import { settings, saveSettings } from "../core/storage.js";
import { session } from "../core/auth.js";
import { COLORS } from "./navigation.js";
import { music, currentTrack, nextTrack } from "../core/audio.js";
function icon(kind) {
 const paths={pause:'M8 5v14M16 5v14',play:'M7 4l13 8-13 8z',next:'M5 4l10 8-10 8zM19 4v16',menu:'M4 6h16M4 12h16M4 18h16',room:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',profile:'M4 20v-2a8 8 0 0116 0v2M16 7a4 4 0 11-8 0 4 4 0 018 0',ranking:'M4 20v-7h4v7M10 20V4h4v16M16 20v-11h4v11',settings:'M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6',login:'M14 4h6v16h-6M3 12h12M10 7l5 5-5 5',extras:'M12 3v18M3 12h18M6 6l12 12M6 18L18 6'};
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 for(const [key,value] of Object.entries({viewBox:'0 0 24 24',width:'20',height:'20',fill:'none',stroke:'currentColor','stroke-width':'1.7','stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true'}))svg.setAttribute(key,value);
 const line=document.createElementNS(svg.namespaceURI,'path');line.setAttribute('d',paths[kind]??paths.menu);svg.append(line);return svg;
}
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
  const skip = button(icon("next"), nextTrack, "room-player-button", { "aria-label": t("room.nextTrack"), title: t("room.nextTrack") });
  const player = el("div", { class: "room-player", role: "group", "aria-label": t("room.playlist") },
    el("div", { class: "room-track-copy" }, el("small", {}, "LEXICADE FM"), trackName), playback, skip);
  function syncAudio() {
    const s = settings();
    playback.replaceChildren(icon(s.music ? "pause" : "play"));
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
  let menuDialog, playing=false;
  const overview = button([icon('room'),el('span',{},t('room.room'))], actions.overview, 'room-overview', {'aria-label':t('room.room')});
  const account = button([icon('menu'),el('span',{},t('room.menu'))], openMenu, 'room-menu-button', {'aria-label':t('room.openMenu'),'aria-haspopup':'dialog','aria-expanded':'false'});
  function openMenu() {
    if(menuDialog?.open)return;
    const dialog=el('dialog',{class:'room-account-dialog room-menu-dialog'});
    menuDialog=dialog;account.setAttribute('aria-expanded','true');
    const close=button('×',()=>dialog.close(),'room-dialog-close',{'aria-label':t('common.close')});
    const sections=el('nav',{class:'room-menu-sections','aria-label':t('room.menu')});
    const entries=[...(session()?[]:[['login',t('room.login')]]),['profile',t('nav.profile')],['ranking',t('nav.ranking')],['settings',t('nav.settings')],['extras',t('features.title')]];
    for(const [route,label] of entries)sections.append(button([icon(route),el('span',{},label)],()=>{dialog.close();route==='extras'?actions.features():actions.account(route)},'room-menu-section',{disabled:playing&&route!=='settings'}));
    dialog.append(el('div',{class:'room-dialog-header'},el('h2',{},t('room.menu')),close),sections,el('section',{class:'room-menu-music'},el('h3',{},t('room.playlist')),player),el('label',{class:'room-menu-language'},el('span',{},t('nav.language')),language));
    dialog.addEventListener('close',()=>{player.remove();language.remove();dialog.remove();if(menuDialog===dialog)menuDialog=undefined;account.setAttribute('aria-expanded','false')},{once:true});
    document.body.append(dialog);dialog.showModal();
  }
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
  const extras = button(t("features.title"), actions.features, "room-extras");
  const footer = el(
    "footer",
    { class: "room-footer" },
    el("div", { class: "room-footer-extra" }, extras, el("span", { class: "room-control-guide" }, t("room.guide"))),
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
    playing = state === "play";
    language.disabled = state === "play";
    root.setAttribute("aria-label", game.name[lang()]);
  }
  return {
    openMenu,
    update,
    ready() {
      loading.remove();
      root.dataset.ready = "true";
    },
    dispose() {
      menuDialog?.close();
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
export async function accountPanel(route, onMenu) {
  const container = el("div", { class: "room-account-content" }),
    close = button("×", () => dialog.close(), "room-dialog-close", {
      "aria-label": t("common.close"),
    });
  const heading = el('div',{class:'room-section-heading'},
    ...(onMenu?[button('←',()=>{dialog.close();onMenu()},'room-menu-back',{'aria-label':t('room.backMenu')})]:[]),
    el('h2',{},t(['profile','ranking','settings'].includes(route)?`nav.${route}`:'room.login')));
  const dialog = el(
    "dialog",
    { class: "room-account-dialog" },
    el("div", { class: "room-dialog-header" }, heading, close),
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
