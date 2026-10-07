import { settings } from "./storage.js";
let context;
const frequencies = {
  key: 440, correct: 880, error: 150, combo: 1100,
  life: 220, level: 1320, end: 330, record: 1760,
};
function audioContext() {
  context ??= new AudioContext();
  if (context.state === "suspended") context.resume().catch(() => {});
  return context;
}
function tone(ctx, frequency, start, duration, volume, type = "square", voices) {
  const oscillator = ctx.createOscillator(), gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(Math.max(0.0001, volume), start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  voices?.add(oscillator);
  oscillator.onended = () => {
    voices?.delete(oscillator);
    oscillator.disconnect();
    gain.disconnect();
  };
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}
export function sound(kind = "correct") {
  if (!settings().sound) return;
  try {
    const ctx = audioContext();
    tone(ctx, frequencies[kind] ?? 440, ctx.currentTime, 0.12,
      Math.min(0.3, settings().volume) * 0.2);
  } catch {
    /* Audio is optional. */
  }
}
let musicTimer, beat = 0, nextBeat = 0;
const musicVoices = new Set();
const melodies = {
  arcade: [64, 67, 71, 67, 62, 67, 69, 67, 60, 64, 67, 64, 62, 66, 69, 71],
  pulse: [64, 64, 67, 71, 62, 62, 67, 69, 60, 60, 64, 67, 62, 66, 69, 67],
};
const hz = (note) => 440 * 2 ** ((note - 69) / 12);
export function music(enabled) {
  if (!enabled) {
    clearInterval(musicTimer);
    musicTimer = undefined;
    for (const voice of musicVoices) {
      try { voice.stop(); } catch { /* Already stopped. */ }
    }
    musicVoices.clear();
    return;
  }
  try {
    const ctx = audioContext();
    if (musicTimer !== undefined) return;
    beat = 0;
    nextBeat = ctx.currentTime + 0.03;
    function schedule() {
      if (ctx.state !== "running") return;
      if (nextBeat < ctx.currentTime) nextBeat = ctx.currentTime + 0.03;
      const s = settings(), melody = melodies[s.melody] ?? melodies.arcade;
      while (nextBeat < ctx.currentTime + 0.16) {
        const volume = Math.max(0, Math.min(0.3, s.volume));
        if (volume > 0)
          tone(ctx, hz(melody[beat % 16]), nextBeat, 0.17, volume * 0.13, "square", musicVoices);
        if (volume > 0 && beat % 2 === 0) {
          const bass = [40, 43, 36, 38][Math.floor(beat / 4) % 4];
          tone(ctx, hz(bass), nextBeat, 0.32, volume * 0.2, "triangle", musicVoices);
        }
        beat++;
        nextBeat += 0.225;
      }
    }
    musicTimer = setInterval(schedule, 80);
    schedule();
  } catch {
    /* Browsers without Web Audio can still play the games. */
  }
}
