import { anagramPool, wordDeck } from "../word-deck.js";
import { read, write } from "../../core/storage.js";
import { canBuild } from "../../games/anagrama.js";
import { el } from "../../ui/components.js";
import { scramble, anagramScore } from "../../games/anagrama.js";
export function create(c) {
  const label = el("p", { class: "screen-instruction" }, c.t("room.letters")),
    letters = el("div", { class: "anagram-tiles" }),
    progress = el("p", { class: "screen-hint" });
  c.area.append(label, letters, progress);
  let answer = "",
    score = 0,
    words = 0,
    largest = 0,
    remaining = 60;
  const pool = anagramPool(c.data.curated, c.data.common);
  const valid = new Set(pool.map(c.normalize));
  const recentKey = `anagram-recent:${c.lang}`;
  const recent = read(recentKey, []);
  const draw = wordDeck(pool, c.random, Array.isArray(recent) ? recent : []);
  let drawn = [];
  const input = c.input((value) => {
    if (!valid.has(c.normalize(value)) || c.normalize(value).length !== c.normalize(answer).length || !canBuild(value, answer)) {
      c.notice(c.t("room.wrong"));
      c.sound("error");
      return;
    }
    score += anagramScore(c.normalize(answer));
    words++;
    largest = Math.max(largest, c.normalize(answer).length);
    c.sound("correct");
    c.feedback?.({ kind: "combo", combo: words });
    next();
  });
  function next() {
    const max = Math.min(8, 5 + Math.floor(words / 3));
    answer = draw(max);
    drawn.unshift(answer);
    write(recentKey, [...drawn, ...(Array.isArray(recent) ? recent : [])].slice(0, 80));
    const mixed = scramble(c.normalize(answer), c.random);
    letters.replaceChildren(
      ...[...mixed].map((l) => el("span", {}, l.toUpperCase())),
    );
    input.value = "";
    progress.textContent = `${words} ${c.t("game.words")}  ·  ${c.t("room.enter")}`;
  }
  next();
  return {
    mode: () => "classic",
    update(dt) {
      remaining -= dt;
      c.status({ score, remaining });
      if (remaining <= 0)
        c.finish(score, { palavras: words, maior_palavra: largest });
    },
  };
}
