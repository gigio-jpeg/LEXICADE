import { el, button, toast, getJSON } from "./components.js";
import { t, lang } from "../core/i18n.js";
import { path, config } from "../core/config.js";
import { session } from "../core/auth.js";
import { submitScore } from "../core/api.js";
import { saveGuest, unlockGuest } from "../core/guest.js";
import { chart } from "./charts.js";
import { confetti } from "./confetti.js";
import { sound } from "../core/audio.js";
const metricLabels = {
  ppm: "game.ppm",
  precisao: "game.accuracy",
  erros: "game.mistakes",
  palavras: "game.words",
  tentativas: "game.attempts",
  passos: "game.steps",
  minimo: "game.minimum",
  ondas: "game.wave",
  caracteres_certos: "game.correctChars",
  nivel_max: "common.level",
  vidas_restantes: "game.lives",
  acertos: "game.hits",
  rimas: "game.rhymes",
  portais: "game.portals",
  resolvido: "game.solved",
  tamanho: "game.length",
  fase: "game.phase",
  fantasmas_capturados: "game.ghosts",
  palavras_certas: "game.words",
  ajudas: "game.hints",
  maior_palavra: "game.biggest",
  tamanho_grade: "game.gridsize",
  tamanho_max: "game.maxlength",
  cadeia_max: "game.chain",
  sequencia_max: "game.streak",
  maior_sequencia: "game.streak",
  tempo_medio: "game.responseTime",
  chefes: "game.boss",
  nivel: "common.level",
};
export async function results(host, result, restart, game) {
  const local = saveGuest(result);
  let reward = local,
    notice = t("game.localSaved");
  host.replaceChildren(el("p", { class: "game-message" }, t("common.loading")));
  if (session()) {
    try {
      reward = await submitScore(result);
      notice = t("game.cloudSaved");
    } catch {
      notice = t("game.cloudFailed");
    }
  }
  const catalog = await getJSON(path("data/achievements.json"));
  const unlocked = unlockGuest(catalog);
  if (reward.novo_recorde) {
    sound("record");
    confetti();
  } else sound("end");
  const share = async () => {
    const text = `${game.name[lang()]} · ${result.score} ${t("common.points")} · ${result.lang}\n${result.share ?? ""}\n${config.name}`;
    try {
      if (navigator.share)
        await navigator.share({ title: game.name[lang()], text });
      else {
        await navigator.clipboard.writeText(text);
        toast(t("game.copied"));
      }
    } catch {
      /* User cancellation. */
    }
  };
  const node = el(
    "div",
    { class: "result" },
    el(
      "p",
      { class: "eyebrow" },
      t(reward.novo_recorde ? "game.record" : "game.finish"),
    ),
    el("h2", {}, game.name[lang()]),
    el("div", { class: "result-score" }, result.score.toLocaleString()),
    el("span", { class: "muted" }, t("common.points")),
    el(
      "div",
      { class: "reward-row" },
      el("span", {}, `+${reward.xp_ganho ?? 0} XP`),
      el("span", {}, `+${reward.moedas_ganhas ?? 0} ◈`),
    ),
    el(
      "div",
      { class: "metric-list" },
      ...Object.entries(result.metrics ?? {})
        .filter(([, v]) => typeof v === "number" || typeof v === "boolean")
        .map(([k, v]) =>
          el(
            "div",
            {},
            el(
              "span",
              {},
              metricLabels[k] ? t(metricLabels[k]) : k.replaceAll("_", " "),
            ),
            el(
              "strong",
              {},
              typeof v === "boolean" ? (v ? "✓" : "×") : String(v),
            ),
          ),
        ),
    ),
    result.speedHistory?.length
      ? chart(result.speedHistory, t("game.speedChart"))
      : null,
    result.missedLetters
      ? el(
          "p",
          {},
          `${t("game.missedLetters")}: ${
            Object.entries(result.missedLetters)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([c, n]) => `${c} (${n})`)
              .join(" · ") || "—"
          }`,
        )
      : null,
    unlocked.length
      ? el(
          "p",
          { class: "accent" },
          "✦ ",
          unlocked.map((a) => a.name[lang()]).join(" · "),
        )
      : null,
    el("p", { class: "game-message" }, notice),
    el(
      "div",
      { class: "actions", style: "justify-content:center" },
      button(t("game.restart"), restart),
      el("a", { class: "button ghost", href: path() }, t("common.back")),
      button(t("game.share"), share, "button ghost"),
    ),
  );
  host.replaceChildren(node);
  node.querySelector("button")?.focus();
}
