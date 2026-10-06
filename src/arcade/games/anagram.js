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
  const pool = c.shuffle(
    c.data.curated.filter((w) => w.length >= 4 && w.length <= 8),
  );
  let index = 0;
  const input = c.input((value) => {
    if (c.normalize(value) !== c.normalize(answer)) {
      c.notice(c.t("room.wrong"));
      c.sound("error");
      return;
    }
    score += anagramScore(c.normalize(answer));
    words++;
    largest = Math.max(largest, c.normalize(answer).length);
    c.sound("correct");
    next();
  });
  function next() {
    const max = Math.min(8, 5 + Math.floor(words / 3));
    let candidates = pool.filter((w) => w.length <= max);
    answer = candidates[index++ % candidates.length];
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
