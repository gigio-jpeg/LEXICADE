import { featuresPanel } from "./features-ui.js";
import { validDuelId, rememberDuel, pendingDuel } from "./duel-link.js";
import { session } from "../core/auth.js";
import { el, button, getJSON } from "../ui/components.js";
import { path } from "../core/config.js";
import { t, lang } from "../core/i18n.js";
import { roomUI, accountPanel } from "./room-ui.js";
import { runGame } from "./game-runner.js";
import { COLORS, wrapIndex } from "./navigation.js";
export async function arcadeRoom(main) {
  const games = await getJSON(path("data/games.json")),
    root = el("section", { class: "arcade-room", "aria-label": "LEXICADE 3D" });
  main.replaceChildren(root);
  document.body.classList.add("room-mode");
  let engine,
    disposed = false,
    fallbackCleanup;
  const params = new URL(location.href).searchParams;
  function playDuel(id) {
    const url = new URL(location.href);url.searchParams.set("duel",id);history.replaceState(history.state,"",url);
    engine.select(0);engine.play({duel:id});
  }
  const ui = roomUI(root, games, {
    select: (i) => engine?.select(i),
    step: (d) => engine?.step(d),
    play: () => engine?.play(),
    overview: () => engine?.overview(),
    leave: () => engine?.leave(),
    account: accountPanel,
    features: () => featuresPanel(playDuel),
  });
  function fallback() {
    if (disposed) return;
    root.classList.add("room-fallback");
    ui.ready();
    const grid = el("div", { class: "room-fallback-machines" });
    let index = 0,
      state = "overview",
      generation = 0;
    const screen = el("div", {
      class: "room-screen fallback-screen",
      hidden: true,
    });
    root.append(
      grid,
      screen,
      el("p", { class: "room-fallback-notice" }, t("room.fallback")),
    );
    games.forEach((game, i) => {
      const box = el(
        "div",
        { class: "fallback-cabinet", style: `--machine-color:${COLORS[i]}` },
        el("h2", {}, game.name[lang()]),
        el(
          "div",
          { class: "fallback-monitor" },
          el("span", {}, game.icon),
          button(t("room.play"), () => engine.play(i), "screen-start"),
        ),
        el("div", { class: "fallback-controls" }, "●  ● ●"),
      );
      grid.append(box);
    });
    engine = {
      get state() {
        return state;
      },
      get index() {
        return index;
      },
      select: (i) => {
        index = wrapIndex(i);
        state = "browse";
        ui.update(index, "browse");
      },
      step: (d) => engine.select(index + d),
      overview: () => {
        if (state === "play") engine.leave();
        state = "overview";
        ui.update(index, state);
      },
      async play(value = index) {
        const options = typeof value === "object" ? value : {};
        index = typeof value === "number" ? value : index;
        state = "play";
        ui.update(index, "play");
        screen.hidden = false;
        grid.hidden = true;
        fallbackCleanup?.();
        const current = ++generation;
        const cleanup = await runGame(screen, games[index], options);
        if (disposed || current !== generation) cleanup();
        else fallbackCleanup = cleanup;
      },
      leave() {
        generation++;
        fallbackCleanup?.();
        screen.hidden = true;
        grid.hidden = false;
        state = "browse";
        ui.update(index, "browse");
      },
      dispose() {
        generation++;
        fallbackCleanup?.();
      },
    };
    ui.update(0, "overview");
  }
  try {
    await document.fonts.load("16px Silkscreen");
    const { createEngine } = await import("./engine.js");
    if (disposed) return () => {};
    engine = createEngine(root, games, ui.update, fallback);
    ui.ready();
  } catch {
    fallback();
  }
  if (!disposed) {
    const i = games.findIndex((g) => g.id === params.get("machine"));
    if (i >= 0) engine.select(i);
    const duelId = validDuelId(params.get("duel")) ? params.get("duel") : session() ? pendingDuel() : null;
    if (duelId) { rememberDuel(duelId);playDuel(duelId); }
    else if (params.get("play") === "1") engine.play();
    if (
      [
        "login",
        "profile",
        "ranking",
        "settings",
        "about",
        "shop",
        "achievements",
        "reset",
        "onboard",
      ].includes(params.get("panel"))
    )
      accountPanel(params.get("panel"));
  }
  const abort = new AbortController();
  document.addEventListener(
    "keydown",
    (e) => {
      if (document.querySelector("dialog[open]")) return;
      if (engine?.state === "play") {
        if (e.key === "Escape") {
          e.preventDefault();
          engine.leave();
        }
        return;
      }
      if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        engine?.step(e.key === "ArrowLeft" ? -1 : 1);
      } else if (e.key === "Enter" && !/BUTTON|A/.test(e.target.tagName)) {
        e.preventDefault();
        engine?.play();
      }
    },
    { signal: abort.signal },
  );
  return () => {
    disposed = true;
    document
      .querySelectorAll(".room-account-dialog")
      .forEach((dialog) => dialog.close());
    abort.abort();
    engine?.dispose();
    ui.dispose();
    root.remove();
    document.body.classList.remove("room-mode");
  };
}
