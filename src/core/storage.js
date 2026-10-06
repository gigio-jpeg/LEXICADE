const prefix = "lexicade:";
const memory = new Map();
export function read(key, fallback = null) {
  try {
    return JSON.parse(localStorage.getItem(prefix + key) ?? "null") ?? fallback;
  } catch {
    return memory.get(key) ?? fallback;
  }
}
export function write(key, value) {
  memory.set(key, value);
  try {
    localStorage.setItem(prefix + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export function remove(key) {
  memory.delete(key);
  try {
    localStorage.removeItem(prefix + key);
  } catch {
    /* restricted storage */
  }
}
export function clearLocal() {
  memory.clear();
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(prefix))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* restricted storage */
  }
}
export const defaultSettings = {
  lang: "pt-BR",
  theme: "neon",
  sound: false,
  volume: 0.15,
  music: false,
  crt: false,
  reducedMotion: false,
  colorblind: false,
  fontSize: 16,
  accents: false,
  focus: false,
  cursor: "line",
};
export const settings = () => ({ ...defaultSettings, ...read("settings", {}) });
export function saveSettings(changes) {
  const next = { ...settings(), ...changes };
  write("settings", next);
  if (typeof document !== "undefined")
    document.dispatchEvent(new CustomEvent("settings", { detail: next }));
  return next;
}
