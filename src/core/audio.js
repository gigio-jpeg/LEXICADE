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
  { name: 'Neon Boulevard', bpm: 116, wave:'sawtooth', swing:0, steps:16, melody:[64,null,67,71,null,74,71,null,62,null,69,72,null,69,67,null,60,null,64,67,72,null,67,64,62,null,66,69,null,74,69,null], bass:[40,38,36,43], chords:[[64,67,71],[62,65,69],[60,64,67],[62,66,69]], kicks:[0,8,10], snares:[4,12], hats:[2,6,10,14], stabs:[0,10] },
  { name: 'Coin Slot Funk', bpm: 104, wave:'square', swing:.12, steps:16, melody:[null,72,75,null,77,null,75,72,null,70,null,67,70,null,72,null,75,null,77,79,null,77,75,null,72,null,70,67,null,70,null,72], bass:[36,41,43,36], chords:[[60,63,70],[65,68,72],[67,70,74],[60,63,67]], kicks:[0,6,11], snares:[4,12], hats:[0,3,6,8,11,14], stabs:[3,7,14] },
  { name: 'After Hours Jazz', bpm: 90, wave:'triangle', swing:.32, steps:16, melody:[72,null,76,79,null,83,81,null,79,76,null,74,72,null,null,null,69,null,72,76,null,79,77,null,76,null,74,71,69,null,null,null], bass:[36,33,38,43], chords:[[60,64,67,71],[57,60,64,67],[62,65,69,72],[59,62,65,69]], kicks:[0,10], snares:[4,12], hats:[2,6,10,14], stabs:[0,7] },
  { name: 'Boss Circuit', bpm: 148, wave:'square', swing:0, steps:16, melody:[76,79,83,88,83,79,76,74,76,79,83,86,83,79,74,71,72,76,79,84,79,76,72,71,74,78,81,86,81,78,74,null], bass:[40,40,36,38], chords:[[64,67,71],[64,67,72],[60,64,67],[62,66,69]], kicks:[0,4,8,12], snares:[4,12], hats:[0,2,4,6,8,10,12,14], stabs:[0,8] },
  { name: 'Moonlit Carousel', bpm: 76, wave:'sine', swing:0, steps:12, melody:[72,null,76,null,79,null,83,null,79,null,76,null,69,null,72,null,76,null,81,null,76,null,72,null], bass:[36,33,41,43], chords:[[60,64,67],[57,60,64],[65,69,72],[67,71,74]], kicks:[0], snares:[], hats:[4,8], stabs:[4,8] },
  { name: 'Orbital Breaks', bpm: 132, wave:'triangle', swing:0, steps:16, melody:[null,75,null,82,79,null,77,null,75,null,null,72,null,70,72,null,79,null,82,null,84,82,null,79,null,77,75,null,72,null,70,null], bass:[36,39,34,41], chords:[[60,63,67],[63,67,70],[58,62,65],[65,68,72]], kicks:[0,7,10], snares:[4,12,15], hats:[0,2,3,6,8,10,11,14], stabs:[0,11] },
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
        if (beat >= track.steps * 32) { nextTrack(); return; }
        const volume = Math.max(0, Math.min(0.3, s.volume));
        if (volume > 0) {
          const step=beat%track.steps, bar=Math.floor(beat/track.steps)%4;
          const note=track.melody[beat%track.melody.length];
          if(note!==null)tone(ctx,hz(note),nextBeat,.14,volume*.07,track.wave,musicVoices);
          if(step===0||step===track.steps/2)tone(ctx,hz(track.bass[bar]),nextBeat,.28,volume*.17,'triangle',musicVoices);
          if(track.stabs.includes(step))for(const note of track.chords[bar])tone(ctx,hz(note),nextBeat,.35,volume*.025,'triangle',musicVoices);
          if(track.kicks.includes(step))tone(ctx,65,nextBeat,.13,volume*.21,'sine',musicVoices);
          if(track.snares.includes(step))tone(ctx,185,nextBeat,.065,volume*.07,'triangle',musicVoices);
          if(track.hats.includes(step))tone(ctx,6200,nextBeat,.025,volume*.009,'square',musicVoices);
        }
        beat++;
        nextBeat += 60 / track.bpm / 4 * (1 + (beat % 2 ? track.swing : -track.swing));
      }
    }
    musicTimer = setInterval(schedule, 80);
    schedule();
  } catch {
    /* Browsers without Web Audio can still play the games. */
  }
}
