import { read, write } from "../core/storage.js";
import { session } from "../core/auth.js";
const key = (lang) => `ghost:v1:${session()?.user.id ?? "guest"}:${lang}`;
export function loadGhost(lang, pool) {
  const record = read(key(lang));
  if (!record || record.version !== 1 || !Array.isArray(record.phrases) || !record.phrases.length || !record.phrases.every((p) => pool.includes(p)) || !Array.isArray(record.samples) || record.samples.length > 125) return null;
  if (!record.samples.every((s, i) => Number.isFinite(s.ms) && s.ms >= 0 && s.ms <= 61000 && Number.isFinite(s.value) && s.value >= 0 && (!i || s.ms >= record.samples[i - 1].ms))) return null;
  return record;
}
export function ghostValue(samples, ms) {
  if (!samples.length || ms <= samples[0].ms) return samples[0]?.value ?? 0;
  for (let i = 1; i < samples.length; i++) {
    if (samples[i].ms >= ms) {
      const a = samples[i - 1], b = samples[i];
      return a.value + (b.value - a.value) * (ms - a.ms) / Math.max(1, b.ms - a.ms);
    }
  }
  return samples.at(-1).value;
}
export function saveGhost(lang, record, previous) {
  if (record.score <= 0 || (previous && record.score <= previous.score)) return false;
  write(key(lang), { ...record, version: 1 });
  return true;
}
