import { settings, read, write } from "./storage.js";
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
  if (!settings().sound || settings().volume <= 0) return;
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
export const TRACKS = Object.freeze([
  { name: "Neon Drift", bpm: 108, melody: [64, 67, 71, 67, 62, 67, 69, 67, 60, 64, 67, 64, 62, 66, 69, 71], bass: [40, 43, 36, 38], wave: "square" },
  { name: "Pixel Sunset", bpm: 96, melody: [72, 67, 64, 67, 69, 64, 60, 64, 71, 67, 62, 67, 69, 66, 62, 66], bass: [36, 33, 43, 38], wave: "triangle" },
  { name: "Midnight Coins", bpm: 124, melody: [64, 64, 67, 71, 62, 62, 67, 69, 60, 60, 64, 67, 62, 66, 69, 67], bass: [40, 38, 36, 43], wave: "square" },
]);
let trackIndex = Math.max(0, Math.trunc(Number(read("music-track", 0))) || 0) % TRACKS.length;
export const currentTrack = () => TRACKS[trackIndex];
export function nextTrack() {
  music(false);
  trackIndex = (trackIndex + 1) % TRACKS.length;
  write("music-track", trackIndex);
  document.dispatchEvent(new CustomEvent("musictrackchange"));
  if (settings().music && !document.hidden) music(true);
}
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
      const s = settings(), track = currentTrack();
      while (nextBeat < ctx.currentTime + 0.16) {
        if (beat >= 256) { nextTrack(); return; }
        const volume = Math.max(0, Math.min(0.3, s.volume));
        if (volume > 0)
          tone(ctx, hz(track.melody[beat % 16]), nextBeat, 0.17, volume * 0.13, track.wave, musicVoices);
        if (volume > 0 && beat % 2 === 0) {
          const bass = track.bass[Math.floor(beat / 16) % 4];
          tone(ctx, hz(bass), nextBeat, 0.32, volume * 0.2, "triangle", musicVoices);
        }
        beat++;
        nextBeat += 60 / track.bpm / 2;
      }
    }
    musicTimer = setInterval(schedule, 80);
    schedule();
  } catch {
    /* Browsers without Web Audio can still play the games. */
  }
}
