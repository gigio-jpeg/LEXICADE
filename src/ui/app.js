import { installErrorReporter } from "../core/errors.js";
import { loadLanguage, t } from "../core/i18n.js";
import { initAuth, session } from "../core/auth.js";
import { header, footer, applySettings } from "./header.js";
import { el, toast } from "./components.js";
import { home } from "./home.js";
import { path, config } from "../core/config.js";
import { ownProfile } from "../core/api.js";
let cleanup,
  revision = 0;
let offlineFallback = false;
const main = document.getElementById("main");
const initialRoute = document.body.dataset.page;
const embeddedRoutes = [
  "game",
  "daily",
  "login",
  "reset",
  "onboard",
  "profile",
  "ranking",
  "settings",
  "about",
  "shop",
  "achievements",
];
const forwarding = embeddedRoutes.includes(initialRoute);
if (forwarding) {
  const old = new URL(location.href),
    url = new URL(path());
  old.searchParams.forEach((value, key) => url.searchParams.set(key, value));
  url.hash = old.hash;
  if (initialRoute === "game") {
    const id = document.body.dataset.game;
    if (["typerush", "decifra", "wordman", "anagrama"].includes(id)) {
      url.searchParams.set("machine", id);
      url.searchParams.set("play", "1");
    }
  } else if (initialRoute !== "daily")
    url.searchParams.set("panel", initialRoute);
  location.replace(url.href);
}

async function render() {
  const current = ++revision;
  cleanup?.();
  cleanup = null;
  applySettings();
  const route = document.body.dataset.page ?? "home";
  document
    .getElementById("header")
    .replaceChildren(header(route === "home" ? "play" : route));
  document.getElementById("footer").replaceChildren(footer());
  main.replaceChildren(el("p", { class: "empty" }, t("common.loading")));
  try {
    let dispose;
    if (route === "home") dispose = await home(main);
    else if (route === "game")
      dispose = await (
        await import("./game.js")
      ).gamePage(main, document.body.dataset.game);
    else if (["login", "reset", "onboard"].includes(route))
      dispose = await (await import("./pages/login.js")).loginPage(main, route);
    else if (route === "profile")
      await (await import("./pages/profile.js")).profilePage(main);
    else if (route === "ranking")
      dispose = await (await import("./pages/ranking.js")).rankingPage(main);
    else if (route === "daily")
      await (await import("./pages/daily.js")).dailyPage(main);
    else if (["shop", "achievements"].includes(route))
      await (await import("./pages/collection.js")).collectionPage(main, route);
    else if (route === "settings")
      dispose = (await import("./pages/settings.js")).settingsPage(main);
    else if (route === "about")
      (await import("./pages/about.js")).aboutPage(main);
    else
      main.replaceChildren(
        el(
          "div",
          { class: "container not-found" },
          el("div", { class: "pixel" }, "404"),
          el("h1", {}, t("404.title")),
          el("p", {}, t("404.description")),
          el("a", { href: path(), class: "button" }, t("common.back")),
        ),
      );
    if (current === revision) cleanup = dispose;
    else dispose?.();
  } catch (error) {
    console.error(error);
    main.replaceChildren(
      el(
        "div",
        { class: "container section" },
        el("h1", {}, t("common.error")),
        el("a", { href: path(), class: "button" }, t("common.back")),
      ),
    );
  }
}
function connectivity() {
  const node = document.getElementById("offline");
  node.hidden = navigator.onLine && !offlineFallback;
  node.textContent = t("common.offline");
}
document.addEventListener("settings", applySettings);
document.addEventListener("languagechange", () => {
  connectivity();
  render();
});
document.addEventListener("authchange", () => {
  document.getElementById("header").replaceChildren(header());
});
window.addEventListener("online", () => {
  offlineFallback = false;
  connectivity();
});
window.addEventListener("offline", connectivity);
if ("serviceWorker" in navigator)
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "OFFLINE_FALLBACK") {
      offlineFallback = true;
      connectivity();
    }
  });
installErrorReporter(window, () => toast(t("common.error"), true));
window.addEventListener("pagehide", () => cleanup?.());
if (!forwarding) {
  await loadLanguage();
  try {
    await initAuth(
      ["login", "reset", "onboard"].includes(document.body.dataset.page),
    );
  } catch {
    toast(t("auth.failure"), true);
  }
  if (session())
    try {
      const profile = await ownProfile();
      if (
        profile?.onboarding_required &&
        new URL(location.href).searchParams.get("panel") !== "onboard"
      ) {
        location.replace(path("?panel=onboard"));
      }
    } catch {
      toast(t("common.error"), true);
    }
  document.title = document.title.replaceAll("LEXICADE", config.name);
  connectivity();
  await render();
  const structured = el("script", { type: "application/ld+json" });
  structured.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: config.name,
    url: path(),
    inLanguage: ["pt-BR", "en", "es"],
    description: t("about.story"),
  });
  document.head.append(structured);
  if ("serviceWorker" in navigator)
    navigator.serviceWorker
      .register(path("sw.js"), { scope: new URL(path()).pathname })
      .catch(() => {});
}
