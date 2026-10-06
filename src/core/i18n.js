import { path, config } from "./config.js";
import { settings, saveSettings } from "./storage.js";
let dictionary = {};
let language = settings().lang;
export const lang = () => language;
export async function loadLanguage(value = language) {
  language = config.languages.includes(value) ? value : "pt-BR";
  const response = await fetch(path(`data/i18n/${language}.json`));
  if (!response.ok) throw new Error("Translations unavailable");
  dictionary = await response.json();
  document.documentElement.lang = language;
  return dictionary;
}
export function t(key, values = {}) {
  let value = key.split(".").reduce((o, k) => o?.[k], dictionary) ?? key;
  if (typeof value === "object")
    value = value[values.count === 1 ? "one" : "other"] ?? key;
  return String(value).replace(/\{(\w+)\}/g, (_, k) =>
    String(values[k] ?? `{${k}}`),
  );
}
export async function changeLanguage(value) {
  saveSettings({ lang: value });
  await loadLanguage(value);
  document.dispatchEvent(new CustomEvent("languagechange", { detail: value }));
}
