import { settings } from "./storage.js";
let context;
const frequencies = {
  key: 440,
  correct: 880,
  error: 150,
  combo: 1100,
  life: 220,
  level: 1320,
  end: 330,
  record: 1760,
};
export function sound(kind = "correct") {
  if (!settings().sound) return;
  try {
    context ??= new AudioContext();
    context.resume();
    const oscillator = context.createOscillator(),
      gain = context.createGain();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(
      frequencies[kind] ?? 440,
      context.currentTime,
    );
    gain.gain.setValueAtTime(
      Math.min(0.3, settings().volume) * 0.2,
      context.currentTime,
    );
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.14);
  } catch {
    /* Audio is optional. */
  }
}
let musicTimer;
export function music(enabled) {
  clearInterval(musicTimer);
  if (!enabled) return;
  let beat = 0;
  const melody =
    settings().melody === "pulse"
      ? ["key", "key", "combo", "correct", "key", "combo", "key", "end"]
      : ["key", "correct", "key", "combo", "key", "level", "correct", "key"];
  musicTimer = setInterval(() => sound(melody[beat++ % melody.length]), 450);
}
