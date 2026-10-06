import { readFile, writeFile, mkdir } from "node:fs/promises";
import {
  generateCrossword,
  validateCrossword,
} from "../src/games/cruzadinha.js";
const topics = [
  "animais",
  "comida",
  "natureza",
  "objetos",
  "ciencia",
  "esportes",
  "tecnologia",
];
for (const lang of ["pt", "en", "es"]) {
  const words = (
    await Promise.all(
      topics.map(async (topic) =>
        JSON.parse(
          await readFile(
            new URL(
              `../data/words/${lang}/temas/${topic}.json`,
              import.meta.url,
            ),
            "utf8",
          ),
        ),
      ),
    )
  ).flat();
  const folder = new URL(`../data/crosswords/${lang}/`, import.meta.url);
  await mkdir(folder, { recursive: true });
  const catalog = [];
  for (let i = 0; i < 60; i++) {
    const puzzle = generateCrossword(words, `${lang}:catalog:${i}`);
    if (!validateCrossword(puzzle) || puzzle.entries.length !== 10)
      throw new Error(`Invalid crossword ${lang}/${i}`);
    const name = `grade-${String(i + 1).padStart(3, "0")}.json`;
    await writeFile(new URL(name, folder), JSON.stringify(puzzle) + "\n");
    catalog.push({
      file: name,
      daily: i < 30,
      difficulty: ["easy", "medium", "hard"][i % 3],
    });
  }
  await writeFile(
    new URL("index.json", folder),
    JSON.stringify(catalog, null, 2) + "\n",
  );
  console.log(`${lang}: 60 grades conexas, com 10 dicas; 30 diárias.`);
}
