import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import { normalize } from "../src/core/rng.js";
import { validateCrossword } from "../src/games/cruzadinha.js";
const read = async (file) =>
  JSON.parse(await readFile(new URL("../" + file, import.meta.url), "utf8"));
export async function validateContent() {
  const report = {};
  for (const lang of ["pt", "en", "es"]) {
    const base = `data/words/${lang}/`;
    const common = await read(base + "comuns.json"),
      words = Object.values(common).flat();
    assert.equal(
      new Set(words.map(normalize)).size,
      words.length,
      `${lang}: duplicate common word`,
    );
    words.forEach((w) => assert.match(w, /^[\p{L}]+$/u));
    assert.ok(words.length >= 2000);
    const valid = await read(base + "decifra-validas.json"),
      answers = await read(base + "decifra-respostas.json");
    for (const [size, list] of Object.entries(valid)) {
      assert.equal(new Set(list.map(normalize)).size, list.length);
      list.forEach((w) => assert.equal(normalize(w).length, Number(size)));
      answers[size].forEach((w) =>
        assert.ok(list.map(normalize).includes(normalize(w))),
      );
    }
    const phrases = await read(base + "frases.json");
    assert.equal(new Set(phrases.phrases).size, phrases.phrases.length);
    assert.equal(new Set(phrases.texts).size, phrases.texts.length);
    assert.ok(phrases.phrases.length >= 150 && phrases.texts.length >= 30);
    const spelling = await read(base + "ortografia.json");
    assert.equal(
      new Set(spelling.map((p) => normalize(p.correct))).size,
      spelling.length,
    );
    spelling.forEach((p) => assert.notEqual(p.correct, p.wrong));
    assert.ok(spelling.length >= 400);
    const intrusa = await read(base + "intrusa.json");
    assert.ok(intrusa.length >= 200);
    for (const round of intrusa) {
      assert.equal(round.words.length, 4);
      assert.equal(new Set(round.words.map(normalize)).size, 4);
      assert.ok(round.words.includes(round.answer));
      assert.ok(round.group);
    }
    const rhymes = await read(base + "rimas.json");
    rhymes.forEach((group) => {
      assert.ok(group.length >= 2);
      assert.equal(new Set(group.map(normalize)).size, group.length);
    });
    const crossword = (await read(base + "curadas.json")).length;
    const catalog = await read(`data/crosswords/${lang}/index.json`);
    assert.ok(catalog.length >= 60);
    assert.ok(catalog.filter((p) => p.daily).length >= 30);
    for (const item of catalog) {
      const puzzle = await read(`data/crosswords/${lang}/${item.file}`);
      assert.ok(validateCrossword(puzzle));
      assert.equal(puzzle.entries.length, 10);
    }
    report[lang] = {
      common: words.length,
      phrases: phrases.phrases.length,
      texts: phrases.texts.length,
      answers5: answers["5"].length,
      valid5: valid["5"].length,
      crossword,
      rhymes: rhymes.length,
      intrusa: intrusa.length,
      spelling: spelling.length,
      crosswords: catalog.length,
    };
  }
  const keyset = (obj, prefix = "") =>
    Object.entries(obj)
      .flatMap(([k, v]) =>
        typeof v === "object" ? keyset(v, `${prefix}${k}.`) : [prefix + k],
      )
      .sort();
  const pt = await read("data/i18n/pt-BR.json");
  for (const lang of ["en", "es"])
    assert.deepEqual(keyset(await read(`data/i18n/${lang}.json`)), keyset(pt));
  const achievements = await read("data/achievements.json");
  assert.ok(achievements.length >= 40);
  assert.equal(
    new Set(achievements.map((a) => a.id)).size,
    achievements.length,
  );
  const games = await read("data/games.json");
  assert.equal(games.length, 4);
  assert.deepEqual(
    games.map((g) => g.id),
    ["typerush", "decifra", "wordman", "anagrama"],
  );
  for (const g of games) {
    await readFile(new URL("../" + g.path, import.meta.url));
    for (const lang of ["pt-BR", "en", "es"])
      assert.ok(g.name[lang] && g.description[lang]);
  }
  return report;
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const report = await validateContent();
  console.log(JSON.stringify(report, null, 2));
  for (const [lang, counts] of Object.entries(report)) {
    for (const [key, minimum] of Object.entries({
      answers5: 1500,
      valid5: 10000,
      crossword: 500,
      rhymes: 300,
    })) {
      if (counts[key] < minimum)
        console.warn(
          `PENDENTE ${lang}: ${key} ${counts[key]}/${minimum}. Consulte docs/PENDENCIAS.md.`,
        );
    }
  }
}
