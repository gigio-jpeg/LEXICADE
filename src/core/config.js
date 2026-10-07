export const config = Object.freeze({
  name: "LEXICADE",
  version: "2.2.0",
  supabaseUrl: "https://oxsyodnhnjpqffafvijv.supabase.co",
  supabaseKey: "sb_publishable_lbUuyBr4qGGe5ieTqdMozg_yZCkdp2s",
  // Ative somente após configurar o provedor no painel Supabase.
  googleEnabled: false,
  magicLinkEnabled: true,
  languages: ["pt-BR", "en", "es"],
  themes: ["neon", "soft", "light", "phosphor", "minimal"],
  baseXP: 30,
  coinRate: 0.2,
  dailyBonus: 20,
  recordBonus: 10,
});

export const rootURL = new URL("../../", import.meta.url);
export const path = (relative = "") => new URL(relative, rootURL).href;
export const dataLang = (language) => (language === "pt-BR" ? "pt" : language);
export const supabaseConfigured = () =>
  !!config.supabaseUrl &&
  config.supabaseKey.startsWith("sb_publishable_") &&
  !config.supabaseKey.includes("EXEMPLO");
