import { el, button, getJSON } from "../ui/components.js";
import { path, dataLang } from "../core/config.js";
import { t, lang } from "../core/i18n.js";
import { settings } from "../core/storage.js";
import { seeded, normalize, pick, shuffle } from "../core/rng.js";
import { createLoop } from "../core/loop.js";
import { bindDirections } from "../core/input.js";
import { sound } from "../core/audio.js";
import { resultScreen } from "./result.js";
const modules = {
  typerush: () => import("./games/phrase-rush.js"),
  decifra: () => import("../ui/controllers/decifra.js"),
  wordman: () => import("../ui/controllers/wordman.js"),
  anagrama: () => import("./games/anagram.js"),
};
export async function runGame(screen, game) {
  const abort = new AbortController(),
    signal = abort.signal,
    language = dataLang(lang());
  let disposed = false,
    elapsed = 0,
    paused = false,
    ended = false,
    controller,
    loop,
    roundAbort = new AbortController();
  const root = el("div", {
    class: `screen-game screen-game-${game.id}`,
    "data-game": game.id,
  });
  screen.replaceChildren(root);
  root.append(el("p", { class: "screen-loading" }, t("room.loadingGame")));
  const names = [
    "curadas",
    "comuns",
    "frases",
    ...(game.id === "decifra" ? ["decifra-respostas", "decifra-validas"] : []),
  ];
  const content = await Promise.all(
    names.map((name) => getJSON(path(`data/words/${language}/${name}.json`))),
  );
  if (disposed) return () => {};
  const data = {};
  names.forEach(
    (name, i) =>
      (data[
        { curadas: "curated", comuns: "common", frases: "phrases" }[name] ??
          name
      ] = content[i]),
  );
  if (game.id === "typerush")
    data.phrases = {
      phrases: (await getJSON(path("data/arcade/phrases.json")))[language],
    };
  const area = el("div", { class: "screen-game-area" }),
    controls = el("div", { class: "screen-controls" }),
    notice = el("p", {
      class: "screen-notice",
      role: "status",
      "aria-live": "polite",
    }),
    score = el("strong", {}, "0"),
    time = el("strong", {}, "1:00"),
    life = el("strong", {}, "♥ 3");
  const pause = button("Ⅱ", () => togglePause(), "screen-pause-button", {
    "aria-label": t("room.pause"),
  });
  const header = el(
    "div",
    { class: "screen-hud" },
    el("div", {}, el("small", {}, game.name[lang()]), score),
    el("div", {}, game.id === "wordman" ? life : time),
    pause,
  );
  root.replaceChildren(header, area, controls, notice);
  const overlay = el(
    "div",
    { class: "screen-pause", hidden: true },
    el("p", {}, t("room.paused")),
    button(t("room.resume"), () => togglePause(), "screen-start"),
  );
  root.append(overlay);
  function togglePause() {
    if (ended) return;
    paused = !paused;
    overlay.hidden = !paused;
    if (!paused) controls.querySelector("input")?.focus();
    else overlay.querySelector("button").focus();
  }
  const random = seeded(`${game.id}:${Date.now()}`),
    ctx = {
      area,
      controls,
      options: el("div"),
      data,
      game,
      lang: language,
      daily: false,
      signal: roundAbort.signal,
      settings: settings(),
      random,
      t,
      el,
      button,
      normalize,
      pick: (a) => pick(a, random),
      shuffle: (a) => shuffle(a, random),
      isRunning: () => !disposed && !paused && !ended,
      elapsed: () => elapsed,
      resetClock: () => {
        elapsed = 0;
      },
      begin: () => {},
      sound: (kind) => sound(kind),
      notice: (value) => {
        notice.textContent = value;
      },
      status: (state) => {
        const newScore = Math.round(state.score ?? 0).toLocaleString();
        if(score.textContent !== newScore) score.textContent = newScore;
        const newTime =
          game.id === "decifra"
            ? `${state.lives ?? 6}/6`
            : `${Math.floor(Math.max(0, Math.ceil(state.remaining ?? elapsed)) / 60)}:${String(Math.max(0, Math.ceil(state.remaining ?? elapsed)) % 60).padStart(2, "0")}`;
        if(time.textContent !== newTime)time.textContent=newTime;
        const newLife=`♥ ${state.lives ?? 3}`;
        if(life.textContent !== newLife)life.textContent = newLife;
      },
      select(_, choices, value) {
        const node = el(
          "select",
          {},
          ...choices.map(([v, label]) =>
            el(
              "option",
              { value: v, selected: String(v) === String(value) },
              label,
            ),
          ),
        );
        ctx.options.append(node);
        return node;
      },
      toggle(_, value = false) {
        return el("input", { type: "checkbox", checked: value });
      },
      input(submit) {
        const input = el("input", {
          class: "screen-input",
          placeholder: t("room.typeHere"),
          "aria-label": t("room.typeHere"),
          autocomplete: "off",
          autocapitalize: "off",
          spellcheck: "false",
        });
        const send = button(
          "↵",
          () => {
            if (ctx.isRunning()) submit(input.value, input);
          },
          "screen-submit",
          { "aria-label": t("room.submit") },
        );
        controls.append(el("div", { class: "screen-input-row" }, input, send));
        input.addEventListener(
          "keydown",
          (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (ctx.isRunning()) submit(input.value, input);
            }
          },
          { signal: ctx.signal },
        );
        return input;
      },
      dpad(callback) {
        const pad = el("div", { class: "screen-dpad" });
        for (const [label, d] of [
          ["←", [-1, 0]],
          ["↑", [0, -1]],
          ["↓", [0, 1]],
          ["→", [1, 0]],
        ])
          pad.append(
            button(label, () => ctx.isRunning() && callback(d), "", {
              "aria-label": label,
            }),
          );
        controls.append(pad);
        bindDirections(area, (d) => ctx.isRunning() && callback(d), ctx.signal);
      },
      canvas(width, height) {
        const canvas = el("canvas", {
          width,
          height,
          class: "screen-canvas",
          "aria-label": game.name[lang()],
          role: "img",
        });
        area.append(canvas);
        return { canvas, draw: canvas.getContext("2d"), width, height };
      },
      finish(points, metrics, extras = {}) {
        if (ended || disposed) return;
        ended = true;
        pause.hidden = true;
        controls.hidden = true;
        const answer = game.id === "decifra" ? notice.textContent : "";
        notice.textContent = "";
        const result = {
          game: game.id,
          mode: "classic",
          lang: language,
          score: Math.max(0, Math.round(points)),
          duration_ms: Math.max(1000, Math.round(elapsed * 1000)),
          metrics,
          daily: false,
          answer,
          ...extras,
        };
        if (game.id === "decifra") result.mode = "infinite";
        resultScreen(area, result, restart, () => !disposed && ended).catch(
          () => {
            if (!disposed) notice.textContent = t("common.error");
          },
        );
      },
    };
  const module = await modules[game.id]();
  function prepare() {
    controller = module.create(ctx);
    controller.start?.();
    controls.querySelector("input")?.focus();
  }
  function restart() {
    controller?.destroy?.();
    roundAbort.abort();
    roundAbort = new AbortController();
    ctx.signal = roundAbort.signal;
    elapsed = 0;
    paused = false;
    ended = false;
    area.replaceChildren();
    controls.replaceChildren();
    controls.hidden = false;
    pause.hidden = false;
    ctx.options.replaceChildren();
    notice.textContent = "";
    prepare();
  }
  prepare();
  loop = createLoop(
    (dt) => {
      if (ctx.isRunning()) {
        elapsed += dt;
        controller.update?.(dt);
      }
    },
    (alpha) => {
      if (!ended && !disposed) controller.render?.(alpha);
    },
  );
  loop.start();
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden && !paused && !ended) togglePause();
    },
    { signal },
  );
  return () => {
    disposed = true;
    abort.abort();
    roundAbort.abort();
    loop?.stop();
    controller?.destroy?.();
    screen.replaceChildren();
  };
}
