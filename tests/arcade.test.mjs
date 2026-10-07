import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  MACHINE_IDS,
  wrapIndex,
  cameraPose,
  ease,
  machineX,
} from "../src/arcade/navigation.js";
test("A navegação percorre somente as quatro máquinas e volta ao começo", () => {
  assert.deepEqual(MACHINE_IDS, ["typerush", "decifra", "wordman", "anagrama"]);
  assert.equal(wrapIndex(-1), 3);
  assert.equal(wrapIndex(4), 0);
  assert.equal(wrapIndex(9), 1);
  assert.ok(Math.abs(machineX(1) - machineX(0) - 3.15) < 1e-9);
});
test("A câmera enquadra a tela e afasta proporcionalmente em retrato", () => {
  const desktop = cameraPose(2, "play", 1.6),
    portrait = cameraPose(2, "play", 0.5);
  assert.equal(desktop.position[0], desktop.target[0]);
  assert.equal(desktop.position[1], desktop.target[1]);
  assert.ok(portrait.position[2] > desktop.position[2]);
  assert.equal(ease(0), 0);
  assert.equal(ease(0.5), 0.5);
  assert.equal(ease(1), 1);
  for (const state of ["browse", "overview", "play"])
    for (const ratio of [0.35, 0.8, 1, 2.5]) {
      const pose = cameraPose(0, state, ratio);
      assert.ok([...pose.position, ...pose.target].every(Number.isFinite));
    }
});
test("O monitor 3D cabe no celular, na horizontal e com teclado aberto", () => {
  for (const [width, height] of [[320, 568], [390, 744], [667, 375], [390, 400]]) {
    const pose = cameraPose(1, "play", width / height, { width, height });
    const distance = pose.position[2] - .906;
    const pixelsPerUnit = height / (2 * distance * Math.tan(21 * Math.PI / 180));
    const center = height / 2 + (pose.target[1] - 2.8) * pixelsPerUnit;
    assert.ok(1.92 * pixelsPerUnit <= width * .88 + .01);
    assert.ok(center - .8 * pixelsPerUnit >= 88);
    assert.ok(center + .8 * pixelsPerUnit <= height - 12);
  }
});
test("As frases novas têm trinta entradas originais completas por idioma", async () => {
  const phrases = JSON.parse(
    await readFile(
      new URL("../data/arcade/phrases.json", import.meta.url),
      "utf8",
    ),
  );
  for (const lang of ["pt", "en", "es"]) {
    assert.equal(phrases[lang].length, 30);
    assert.equal(new Set(phrases[lang]).size, 30);
    for (const sentence of phrases[lang])
      assert.ok(sentence.length >= 35 && sentence.length <= 120);
  }
});
