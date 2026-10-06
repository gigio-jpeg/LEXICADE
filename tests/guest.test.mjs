import { test } from "node:test";
import assert from "node:assert/strict";
import { clearLocal } from "../src/core/storage.js";
import { saveGuest, guestProfile } from "../src/core/guest.js";

test("Reabrir o diário concluído não duplica XP, moedas, partidas ou estatísticas", () => {
  clearLocal();
  const round = {
    game: "decifra",
    mode: "daily",
    lang: "pt",
    daily: true,
    score: 1000,
    duration_ms: 30000,
    metrics: { tentativas: 3, resolvido: true, tamanho: 5, variante: "daily" },
  };
  const first = saveGuest(round);
  assert.ok(first.xp_ganho > 0);
  const before = guestProfile();
  assert.equal(before.decifraStats.wins, 1);
  const repeat = saveGuest(round);
  assert.equal(repeat.xp_ganho, 0);
  assert.equal(repeat.moedas_ganhas, 0);
  assert.deepEqual(guestProfile(), before);
  const otherLanguage = saveGuest({ ...round, lang: "en" });
  assert.ok(otherLanguage.xp_ganho > 0);
  assert.equal(guestProfile().totalRounds, 2);
  clearLocal();
});
