import test from "node:test";
import assert from "node:assert/strict";
import { music, nextTrack, currentTrack, TRACKS } from "../src/core/audio.js";
import { saveSettings } from "../src/core/storage.js";

test("A playlist avança automaticamente e respeita pausa com efeitos desligados", () => {
  const previous = Object.fromEntries(["AudioContext", "setInterval", "clearInterval", "document"].map((key) => [key, globalThis[key]]));
  let tick, clock = 0, notes = 0;
  class AudioContext {
    state = "running";
    destination = {};
    get currentTime() { return clock; }
    createOscillator() { return { frequency: { setValueAtTime() {} }, connect() {}, disconnect() {}, start() { notes++; }, stop() {} }; }
    createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
  }
  globalThis.AudioContext = AudioContext;
  globalThis.setInterval = (callback) => { tick = callback; return 1; };
  globalThis.clearInterval = () => { tick = undefined; };
  globalThis.document = new EventTarget();
  globalThis.document.hidden = false;
  try {
    saveSettings({ sound: false, music: true });
    const initial = currentTrack().name;
    music(true);
    assert.ok(notes > 0, "Música funciona mesmo sem efeitos sonoros");
    for (let i = 0; i < 350 && currentTrack().name === initial; i++) {
      clock += 0.3;
      tick();
    }
    assert.notEqual(currentTrack().name, initial, "Faixa termina e inicia a próxima");
    assert.equal(typeof tick, "function");
    saveSettings({ music: false });
    music(false);
    const before = notes;
    nextTrack();
    assert.equal(tick, undefined, "Avançar pausado não inicia reprodução");
    assert.equal(notes, before);
    const track = currentTrack().name;
    for (let i = 0; i < TRACKS.length; i++) nextTrack();
    assert.equal(currentTrack().name, track, "Lista é circular");
  } finally {
    music(false);
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  }
});
