import { cabinetStyle, loadCabinetStyle } from "./personalization.js";
import * as THREE from "../../vendor/three/three.module.js";
import {
  CSS3DRenderer,
  CSS3DObject,
} from "../../vendor/three/addons/renderers/CSS3DRenderer.js";
import { EffectComposer } from "../../vendor/three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "../../vendor/three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "../../vendor/three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "../../vendor/three/addons/postprocessing/OutputPass.js";
import { roomTheme } from "./themes.js";
import { cabinet } from "./cabinet.js";
import { environment } from "./environment.js";
import { cameraPose, wrapIndex, ease } from "./navigation.js";
import { runGame } from "./game-runner.js";
import { settings } from "../core/storage.js";
import { el } from "../ui/components.js";
import { lang, t } from "../core/i18n.js";

export function createEngine(host, games, onChange, onFail) {
  const reduced = () => settings().reducedMotion || matchMedia("(prefers-reduced-motion: reduce)").matches;
  const abort = new AbortController(),
    signal = abort.signal,
    small = innerWidth < 700;
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.25 : 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = !small;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.domElement.className = "room-webgl";
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.prepend(renderer.domElement);
  const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(42, 1, 0.1, 90),
    cssScene = new THREE.Scene(),
    cssRenderer = new CSS3DRenderer();
  cssRenderer.domElement.className = "room-css3d";
  host.append(cssRenderer.domElement);
  const world = environment(scene, small),
    cabinets = games.map((game, index) =>
      cabinet({ name: game.name[lang()] }, index),
    );
  cabinets.forEach((c) => scene.add(c.group));
  const screenElement = el("div", {
      class: "room-screen",
      role: "region",
      "aria-label": t("room.play"),
    }),
    cssScreen = new CSS3DObject(screenElement);
  cssScreen.visible = false;
  cssScene.add(cssScreen);
  const composer = new EffectComposer(renderer),
    renderPass = new RenderPass(scene, camera),
    bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.22, 0.5, 1.05),
    output = new OutputPass();
  composer.addPass(renderPass);
  composer.addPass(bloom);
  composer.addPass(output);
  function applyTheme(event) {
    const theme = roomTheme(event?.detail?.theme ?? settings().theme);
    world.applyTheme(theme);
    cabinets.forEach((c) => { c.applyTheme(theme); c.personalize(cabinetStyle()); });
    renderer.toneMappingExposure = theme.exposure;
    bloom.strength = theme.bloom;
    renderer.shadowMap.needsUpdate = true;
    host.dataset.theme = event?.detail?.theme ?? settings().theme;
  }
  document.addEventListener("settings", applyTheme, { signal });
  document.addEventListener("settingspreview", applyTheme, { signal });
  applyTheme();
  document.addEventListener("cabinetstyle", () => cabinets.forEach((c) => c.personalize(cabinetStyle())), { signal });
  loadCabinetStyle().catch(() => {});
  let resizeFrame = 0, lastWidth = 0, lastHeight = 0;
  let crt = settings().crt;
  document.addEventListener("settings", (event) => { crt = event.detail.crt; }, { signal });
  document.addEventListener("settingspreview", (event) => { crt = event.detail.crt; }, { signal });
  let pulse = 0;
  host.addEventListener("arcadefeedback", (event) => {
    if (["correct", "combo", "record", "finish", "level"].includes(event.detail?.kind)) {
      pulse = Math.max(pulse, event.detail.kind === "record" ? 1.5 : event.detail.kind === "combo" ? Math.min(1.3, .5 + (event.detail.combo ?? 0) * .08) : .6);
      host.dataset.reaction = event.detail.kind;
    }
  }, { signal });
  let lastDraw = 0;
  let index = 0,
    state = "browse",
    disposed = false,
    frame = 0,
    last = 0,
    transition,
    stopGame,
    generation = 0,
    parallax = { x: 0, y: 0 },
    pointerDown;
  const target = new THREE.Vector3(),
    goalPosition = new THREE.Vector3(),
    goalTarget = new THREE.Vector3(),
    basePosition = new THREE.Vector3(),
    fromPosition = new THREE.Vector3(),
    fromTarget = new THREE.Vector3();
  function pose(instant = false) {
    const p = cameraPose(index, state, camera.aspect);
    goalPosition.fromArray(p.position);
    goalTarget.fromArray(p.target);
    fromPosition.copy(basePosition);
    fromTarget.copy(target);
    transition = {
      start: performance.now(),
      duration: reduced()
        ? 0
        : instant
          ? 0
          : state === "play"
            ? 1050
            : 850,
    };
    if (transition.duration === 0) {
      basePosition.copy(goalPosition);
      target.copy(goalTarget);
    }
  }
  function resize() {
    const width = host.clientWidth,
      height = host.clientHeight;
    if (width === lastWidth && height === lastHeight) return;
    lastWidth = width; lastHeight = height;
    renderer.setSize(width, height);
    cssRenderer.setSize(width, height);
    composer.setSize(width, height);
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
    const virtualWidth = width < 700 ? 480 : 720;
    screenElement.style.width = virtualWidth + "px";
    screenElement.style.height = virtualWidth / 1.2 + "px";
    cssScreen.scale.setScalar(1.92 / virtualWidth);
    pose(true);
  }
  function announce() {
    onChange(index, state);
    host.dataset.machine = games[index].id;
    const url = new URL(location.href);
    url.searchParams.set("machine", games[index].id);
    if (state === "play") url.searchParams.set("play", "1");
    else url.searchParams.delete("play");
    history.replaceState(history.state, "", url);
  }
  function select(value) {
    if (state === "play") leave();
    index = wrapIndex(value);
    state = "browse";
    pose();
    announce();
  }
  function overview() {
    if (state === "play") return;
    state = state === "overview" ? "browse" : "overview";
    pose();
    announce();
  }
  function leave() {
    generation++;
    stopGame?.();
    stopGame = null;
    cssScreen.visible = false;
    cabinets.forEach((c) => (c.monitor.visible = true));
    state = "browse";
    pose();
    announce();
    host.querySelector(".room-primary")?.focus();
  }
  async function play(options = {}) {
    if (state === "play" || disposed) return;
    state = "play";
    const current = ++generation;
    pose();
    announce();
    screenElement.style.setProperty(
      "--screen-color",
      cabinets[index].color.getStyle(),
    );
    screenElement.replaceChildren(
      el("p", { class: "screen-loading" }, t("room.loadingGame")),
    );
    cssScreen.position
      .copy(cabinets[index].group.position)
      .add(new THREE.Vector3(0, 2.8, 0.906));
    cssScreen.visible = true;
    cabinets[index].monitor.visible = false;
    try {
      const cleanup = await runGame(screenElement, games[index], options);
      if (disposed || current !== generation) cleanup();
      else stopGame = cleanup;
    } catch {
      if (current === generation) {
        screenElement.replaceChildren(
          el("div", { class: "screen-result" }, el("p", {}, t("common.error"))),
        );
      }
    }
  }
  const ray = new THREE.Raycaster(),
    pointer = new THREE.Vector2();
  renderer.domElement.addEventListener(
    "pointerdown",
    (e) => {
      pointerDown = [e.clientX, e.clientY];
    },
    { signal },
  );
  renderer.domElement.addEventListener(
    "pointerup",
    (e) => {
      if (
        state === "play" ||
        !pointerDown ||
        Math.hypot(e.clientX - pointerDown[0], e.clientY - pointerDown[1]) > 12
      )
        return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      ray.setFromCamera(pointer, camera);
      const hit = ray.intersectObjects(
        cabinets.map((c) => c.group),
        true,
      )[0];
      if (!hit) return;
      let node = hit.object;
      while (node.parent && node.userData.index == null) node = node.parent;
      select(node.userData.index);
      play();
    },
    { signal },
  );
  host.addEventListener(
    "pointermove",
    (e) => {
      if (state === "play") return;
      parallax.x = (e.clientX / innerWidth - 0.5) * 0.18;
      parallax.y = (e.clientY / innerHeight - 0.5) * 0.1;
    },
    { signal },
  );
  renderer.domElement.addEventListener(
    "webglcontextlost",
    (event) => {
      event.preventDefault();
      if (!disposed) {
        dispose();
        onFail();
      }
    },
    { signal },
  );
  const observer = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(resize);
  });
  observer.observe(host);
  resize();
  basePosition.copy(goalPosition);
  target.copy(goalTarget);
  announce();
  function animate(now) {
    if (disposed) return;
    frame = requestAnimationFrame(animate);
    if (!transition && now - lastDraw < (state === "play" && pulse === 0 ? 250 : 33)) return;
    lastDraw = now;
    const time = now / 1000,
      dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (transition) {
      const progress =
        transition.duration === 0
          ? 1
          : Math.min(1, (now - transition.start) / transition.duration);
      basePosition.lerpVectors(fromPosition, goalPosition, ease(progress));
      target.lerpVectors(fromTarget, goalTarget, ease(progress));
      if (progress === 1) transition = null;
    }
    camera.position.copy(basePosition);
    if (state !== "play" && !reduced()) {
      camera.position.x += parallax.x;
      camera.position.y += parallax.y;
    }
    camera.lookAt(target);
    cabinets.forEach((c) => {
      if (c.monitor.visible && c.screen.draw(time + c.index * 3, crt))
        c.screen.texture.needsUpdate = true;
    });
    pulse = Math.max(0, pulse - dt * .8);
    const energy = reduced() ? 0 : pulse;
    world.react(energy);
    cabinets.forEach((c, i) => c.react(i === index ? energy : 0));
    world.dust.rotation.y += reduced() ? 0 : dt * 0.008;
    composer.render();
    cssRenderer.render(cssScene, camera);
  }
  frame = requestAnimationFrame(animate);
  function dispose() {
    if (disposed) return;
    disposed = true;
    generation++;
    stopGame?.();
    abort.abort();
    observer.disconnect();
    cancelAnimationFrame(resizeFrame);
    cancelAnimationFrame(frame);
    world.dispose();
    const textures = new Set(),
      materials = new Set(),
      geometries = new Set();
    scene.traverse((node) => {
      if (node.geometry) geometries.add(node.geometry);
      if (node.material) {
        for (const m of Array.isArray(node.material)
          ? node.material
          : [node.material]) {
          materials.add(m);
          Object.values(m).forEach((value) => {
            if (value?.isTexture) textures.add(value);
          });
        }
      }
    });
    textures.forEach((x) => x.dispose());
    materials.forEach((x) => x.dispose());
    geometries.forEach((x) => x.dispose());
    bloom.dispose();
    output.dispose();
    composer.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    cssRenderer.domElement.remove();
  }
  return {
    select,
    step: (d) => select(index + d),
    overview,
    play,
    leave,
    dispose,
    get state() {
      return state;
    },
    get index() {
      return index;
    },
  };
}
