import { el, button, field, getJSON, toast } from "./components.js";
import { t, lang } from "../core/i18n.js";
import { path, dataLang, config } from "../core/config.js";
import { query } from "../core/router.js";
import { dailyRandom, seeded, normalize, pick, shuffle } from "../core/rng.js";
import { createLoop } from "../core/loop.js";
import { hud } from "./hud.js";
import { tutorial } from "./tutorial.js";
import { results } from "./results.js";
import { settings } from "../core/storage.js";
import { bindDirections } from "../core/input.js";
import { sound } from "../core/audio.js";

export async function gamePage(main, id) {
  const abort = new AbortController(),
    signal = abort.signal;
  const games = await getJSON(path("data/games.json")),
    game = games.find((g) => g.id === id);
  if (!game) throw new Error("Unknown game");
  const language = dataLang(lang()),
    base = `data/words/${language}/`;
  const [curated, common, phrases] = await Promise.all(
    ["curadas.json", "comuns.json", "frases.json"].map((file) =>
      getJSON(path(base + file)),
    ),
  );
  const data = { curated, common, phrases };
  const content =
    {
      decifra: ["decifra-respostas.json", "decifra-validas.json"],
      anagrama: ["decifra-validas.json"],
      escada: ["decifra-validas.json"],
      "tetris-letras": ["decifra-validas.json"],
      intrusa: ["intrusa.json"],
      ortografia: ["ortografia.json"],
      rimas: ["rimas.json"],
    }[id] ?? [];
  for (const file of content)
    data[file.replace(".json", "")] = await getJSON(path(base + file));
  if (["cruzadinha", "forca", "caca-palavras"].includes(id)) {
    data.themes = {};
    for (const topic of [
      "animais",
      "comida",
      "natureza",
      "objetos",
      "ciencia",
      "esportes",
      "tecnologia",
    ])
      data.themes[topic] = await getJSON(path(`${base}temas/${topic}.json`));
  }
  let elapsed = 0,
    running = false,
    paused = false,
    ended = false,
    controller,
    pausedDialog,
    generation = 0;
  let controllerAbort = new AbortController();
  const options = el("div", { class: "game-options" }),
    area = el("div", { class: "game-area", id: "game-area" }),
    controls = el("div", { class: "game-controls" }),
    message = el("p", {
      class: "game-message",
      role: "status",
      "aria-live": "polite",
    }),
    status = hud();
  const start = button(t("game.start") + " ▶", () => begin());
  const pause = button("Ⅱ", () => togglePause(), "icon-button", {
    "aria-label": t("game.pause"),
  });
  const announcement = el("p", {
    class: "sr-only",
    role: "status",
    "aria-live": "polite",
  });
  const shell = el(
    "div",
    { class: "container game-page color-" + game.color },
    el(
      "div",
      { class: "game-toolbar" },
      el("a", { href: path() }, "← " + t("common.back")),
      el(
        "div",
        { class: "game-heading" },
        el("span", { class: "game-glyph", "aria-hidden": "true" }, game.icon),
        el("h1", {}, game.name[lang()]),
      ),
      pause,
    ),
    options,
    status.node,
    tutorial(
      id,
      t(
        {
          wordman: "game.wordmanHelp",
          snake: "game.snakeHelp",
          "tetris-letras": "game.tetrisHelp",
          flappy: "game.flappyHelp",
          decifra: "game.decifraHelp",
          "caca-palavras": "game.searchHelp",
          forca: "game.hangmanHelp",
          escada: "game.ladderHelp",
          cruzadinha: "game.crosswordHelp",
        }[id] ??
          (["intrusa", "ortografia"].includes(id)
            ? "game.click"
            : "game.typing"),
      ),
    ),
    area,
    message,
    announcement,
    controls,
    el("div", { class: "game-controls" }, start),
  );
  main.replaceChildren(shell);
  document.title = `${game.name[lang()]} · ${config.name}`;
  const daily = query("daily") === "1";
  const random = daily
    ? dailyRandom(id, language)
    : seeded(`${id}:${Date.now()}`);
  const ctx = {
    area,
    options,
    controls,
    message,
    data,
    game,
    lang: language,
    daily,
    random,
    signal: controllerAbort.signal,
    settings: settings(),
    t,
    el,
    button,
    normalize,
    pick: (array) => pick(array, random),
    shuffle: (array) => shuffle(array, random),
    sound: (kind) => {
      sound(kind);
      if (kind === "correct") announcement.textContent = t("game.correct");
      else if (kind === "error") announcement.textContent = t("game.wrong");
      else if (kind === "life") announcement.textContent = t("game.lostLife");
    },
    isRunning: () => running && !paused && !ended,
    elapsed: () => elapsed,
    begin: () => begin(),
    status: (state) => status.update({ ...state, elapsed }),
    notice: (text) => {
      message.textContent = text;
    },
    select(key, choices, value) {
      const select = el(
        "select",
        { "aria-label": t(key) },
        ...choices.map(([val, label]) =>
          el(
            "option",
            { value: val, selected: String(val) === String(value) },
            label,
          ),
        ),
      );
      options.append(field(t(key), select));
      return select;
    },
    toggle(key, value = false) {
      const input = el("input", { type: "checkbox", checked: value });
      options.append(el("label", { class: "toggle" }, input, t(key)));
      return input;
    },
    input(submit) {
      const input = el("input", {
        class: "game-input",
        placeholder: t("game.input"),
        "aria-label": t("game.input"),
        autocomplete: "off",
        autocapitalize: "off",
        spellcheck: "false",
      });
      const send = button(t("game.submit"), () => {
        if (ctx.isRunning()) submit(input.value, input);
      });
      controls.append(el("div", { class: "input-row" }, input, send));
      input.addEventListener(
        "keydown",
        (e) => {
          if (
            e.key === "Enter" ||
            (e.key === " " && !["typerush", "space-letters"].includes(id))
          ) {
            e.preventDefault();
            if (!running) begin();
            else if (ctx.isRunning()) submit(input.value, input);
          }
        },
        { signal },
      );
      return input;
    },
    dpad(callback) {
      const node = el("div", { class: "dpad", "aria-label": t("game.motion") });
      for (const [text, direction] of [
        ["↑", [0, -1]],
        ["←", [-1, 0]],
        ["↓", [0, 1]],
        ["→", [1, 0]],
      ])
        node.append(
          button(text, () => ctx.isRunning() && callback(direction), "", {
            "aria-label": text,
          }),
        );
      controls.append(node);
      bindDirections(
        area,
        (direction) => ctx.isRunning() && callback(direction),
        ctx.signal,
      );
    },
    canvas(width = 720, height = 440) {
      const canvas = el("canvas", {
        width,
        height,
        class: "game-canvas",
        "aria-label": game.name[lang()],
        role: "img",
      });
      area.append(canvas);
      return { canvas, draw: canvas.getContext("2d"), width, height };
    },
    finish(score, metrics, extras = {}) {
      if (ended) return;
      ended = true;
      running = false;
      generation++;
      pause.disabled = true;
      start.hidden = true;
      options.hidden = true;
      controls.hidden = true;
      const result = {
        game: id,
        mode: controller.mode?.() ?? (daily ? "daily" : "classic"),
        lang: language,
        score: Math.max(0, Math.round(score)),
        duration_ms: Math.max(1000, Math.round(elapsed * 1000)),
        metrics,
        daily:
          (controller.mode?.() ?? (daily ? "daily" : "classic")) === "daily",
        ...extras,
      };
      results(area, result, restart, game).catch(() =>
        toast(t("common.error"), true),
      );
    },
  };
  const module = await import(`./controllers/${id}.js`);
  function prepare() {
    controller = module.create(ctx);
    status.update({ score: 0, elapsed: 0 });
  }
  function begin() {
    if (ended || running) return;
    running = true;
    paused = false;
    start.hidden = true;
    options
      .querySelectorAll("select,input")
      .forEach((n) => (n.disabled = true));
    controller.start?.();
    controls.querySelector("input")?.focus();
  }
  function togglePause() {
    if (!running || ended) return;
    paused = !paused;
    if (paused) {
      pausedDialog = el(
        "dialog",
        { class: "modal" },
        el("h2", {}, t("game.paused")),
        button(t("game.resume"), () => {
          paused = false;
          pausedDialog.close();
        }),
      );
      document.body.append(pausedDialog);
      pausedDialog.showModal();
      pausedDialog.addEventListener("cancel", () => {
        paused = false;
      });
      pausedDialog.addEventListener("close", () => {
        paused = false;
        pausedDialog.remove();
      });
    } else pausedDialog?.close();
  }
  function restart() {
    controller.destroy?.();
    controllerAbort.abort();
    controllerAbort = new AbortController();
    ctx.signal = controllerAbort.signal;
    elapsed = 0;
    running = false;
    ended = false;
    paused = false;
    generation++;
    area.replaceChildren();
    controls.replaceChildren();
    controls.hidden = false;
    options.replaceChildren();
    options.hidden = false;
    start.hidden = false;
    pause.disabled = false;
    message.textContent = "";
    prepare();
  }
  prepare();
  const loop = createLoop(
    (dt) => {
      if (ctx.isRunning()) {
        elapsed += dt;
        controller.update?.(dt);
      }
    },
    (alpha) => {
      if (!ended) controller.render?.(alpha);
    },
  );
  loop.start();
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        togglePause();
      }
      if (
        !running &&
        !ended &&
        (e.key === "Enter" ||
          (!/INPUT|SELECT|TEXTAREA/.test(e.target.tagName) &&
            e.key.length === 1))
      ) {
        e.preventDefault();
        begin();
      }
    },
    { signal },
  );
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden && running && !paused) togglePause();
    },
    { signal },
  );
  return () => {
    generation++;
    abort.abort();
    controllerAbort.abort();
    loop.stop();
    controller?.destroy?.();
    pausedDialog?.close();
  };
}
