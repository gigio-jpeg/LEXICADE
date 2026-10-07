import { el, button, getJSON } from "../ui/components.js";
import { t } from "../core/i18n.js";
import { path } from "../core/config.js";
import { session } from "../core/auth.js";
import { saveGuest, unlockGuest } from "../core/guest.js";
import { submitScore, ownProfile } from "../core/api.js";
import { sound } from "../core/audio.js";
export async function resultScreen(host, result, restart, alive) {
  const local = saveGuest(result);
  let reward = local,
    notice = t("room.saved");
  const status = el(
    "p",
    { class: "screen-save", role: "status" },
    t("common.loading"),
  );
  const total = el(
    "div",
    { class: "screen-result-score" },
    result.score.toLocaleString(),
  );
  const badge = el(
    "p",
    { class: "screen-result-label" },
    t(local.novo_recorde ? "room.record" : "room.finish"),
  );
  const extras = el(
    "p",
    { class: "screen-result-reward" },
    `+${local.xp_ganho} XP · +${local.moedas_ganhas} ◈`,
  );
  const metric =
    result.game === "typerush"
      ? `${result.metrics.ppm} ${t("room.wpm")} · ${result.metrics.precisao}% ${t("room.accuracy")}`
      : result.game === "decifra"
        ? `${result.metrics.tentativas}/6 · ${t(result.metrics.resolvido ? "game.solved" : "game.finish")}`
        : `${result.metrics.palavras ?? 0} ${t("game.words")}`;
  host.replaceChildren(
    el(
      "div",
      { class: "screen-result" },
      badge,
      total,
      el("p", {}, metric),
      result.answer ? el("p", { class: "screen-answer" }, result.answer) : null,
      extras,
      button(t("room.restart") + " →", restart, "screen-start"),
      status,
    ),
  );
  sound(local.novo_recorde ? "record" : "end");
  host.dispatchEvent(new CustomEvent("arcadefeedback", { bubbles: true, detail: { kind: local.novo_recorde ? "record" : "finish" } }));
  if (result.ghostWon) host.querySelector(".screen-result-label").textContent += ` · ${t("features.ghostWon")}`;
  if (session())
    try {
      reward = await submitScore(result);
      notice = t("room.synced");
      await ownProfile();
    } catch {
      notice = t("room.failed");
    }
  try {
    unlockGuest(await getJSON(path("data/achievements.json")));
  } catch {
    /* Result remains usable offline. */
  }
  if (!alive()) return;
  badge.textContent = t(reward.novo_recorde ? "room.record" : "room.finish") + (result.ghostWon ? ` · ${t("features.ghostWon")}` : "");
  extras.textContent = `+${reward.xp_ganho ?? 0} XP · +${reward.moedas_ganhas ?? 0} ◈`;
  status.textContent = notice;
  host.querySelector("button")?.focus();
}
