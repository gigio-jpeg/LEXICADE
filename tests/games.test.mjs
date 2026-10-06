import { test } from "node:test";
import assert from "node:assert/strict";
import { clues, hardValid } from "../src/games/decifra.js";
import { compareText, survivalTime } from "../src/games/typerush.js";
import { normalize, seeded, dayKey, shuffle } from "../src/core/rng.js";
import { rewards, threshold, levelForXP, ppm } from "../src/core/scoring.js";
import {
  generateCrossword,
  validateCrossword,
} from "../src/games/cruzadinha.js";
import {
  generateSearch,
  selectedWord,
  containsForbidden,
} from "../src/games/caca-palavras.js";
import { shortestPath, oneApart } from "../src/games/escada.js";
import { canBuild, scramble } from "../src/games/anagrama.js";
import { guessLetter } from "../src/games/forca.js";
import { stepSnake, createSnake, turnSnake } from "../src/games/snake.js";
import {
  findWords,
  clearWords,
  dropLetter,
} from "../src/games/tetris-letras.js";
import { maze, neighbors, ghostStep } from "../src/games/wordman.js";
import { specialEffect, fallWords } from "../src/games/chuva.js";
import { stepFlight, portalHit } from "../src/games/flappy.js";
import { spellingRound, judge } from "../src/games/ortografia.js";
import { validateRhyme } from "../src/games/rimas.js";
import { readFile } from "node:fs/promises";
test("Decifra: letras repetidas não ganham pistas extras", () => {
  assert.deepEqual(clues("apple", "allee"), [
    "correct",
    "present",
    "absent",
    "absent",
    "correct",
  ]);
  assert.deepEqual(clues("canto", "tacto"), [
    "absent",
    "correct",
    "present",
    "correct",
    "correct",
  ]);
  assert.deepEqual(clues("limão", "limao"), Array(5).fill("correct"));
  assert.throws(() => clues("word", "words"), RangeError);
});
test("Modo difícil mantém posição e quantidade das letras reveladas", () => {
  assert.equal(
    hardValid("ample", [{ word: "allee", colors: clues("apple", "allee") }]),
    true,
  );
  assert.equal(
    hardValid("ample", [{ word: "apple", colors: clues("apple", "apple") }]),
    false,
  );
});
test("Acentos pt/es e pontuação", () => {
  assert.equal(normalize("  AÇÃO, Niño!  "), "acao, nino!");
  assert.equal(compareText("ação", "acao").complete, true);
  assert.equal(compareText("ação", "acao", true).complete, false);
});
test("Diários determinísticos e fuso na virada do dia", () => {
  const a = seeded("date"),
    b = seeded("date");
  assert.deepEqual(
    Array.from({ length: 10 }, a),
    Array.from({ length: 10 }, b),
  );
  assert.equal(
    dayKey(new Date("2026-10-06T01:00:00Z"), "America/Sao_Paulo"),
    "2026-10-05",
  );
  assert.equal(
    dayKey(new Date("2026-10-06T04:00:00Z"), "America/Sao_Paulo"),
    "2026-10-06",
  );
});
test("XP, limiares de nível, teto de sequência e PPM", () => {
  assert.equal(threshold(2), 283);
  assert.equal(levelForXP(282), 1);
  assert.equal(levelForXP(283), 2);
  assert.deepEqual(
    rewards({
      score: 300,
      duration: 30000,
      record: true,
      daily: true,
      streak: 100,
    }),
    { xp: 135, coins: 27 },
  );
  assert.equal(ppm(250, 60000), 50);
  assert.equal(survivalTime(44, true), 45);
});
test("Gerador de cruzadinha: 10 entradas, conexa, determinística e interseções válidas", async () => {
  const entries = JSON.parse(
    await readFile(
      new URL("../data/words/pt/temas/natureza.json", import.meta.url),
    ),
  );
  const a = generateCrossword(entries, "test"),
    b = generateCrossword(entries, "test");
  assert.deepEqual(a, b);
  assert.equal(a.entries.length, 10);
  assert.ok(validateCrossword(a));
  a.cells[a.entries[0].y][a.entries[0].x] = "?";
  assert.equal(validateCrossword(a), false);
});
test("Caça-palavras coloca todas as palavras e não contém termos bloqueados", () => {
  for (let i = 0; i < 20; i++) {
    const p = generateSearch(
      ["gato", "cobra", "urso", "pato", "tigre"],
      10,
      true,
      i,
    );
    assert.equal(p.placements.length, 5);
    assert.equal(containsForbidden(p.grid), false);
    for (const w of p.placements)
      assert.equal(
        selectedWord(
          p.grid,
          [w.x, w.y],
          [w.x + w.dx * (w.word.length - 1), w.y + w.dy * (w.word.length - 1)],
        ),
        w.word,
      );
  }
});
test("Escada usa menor caminho, não aceita saltos e detecta impossibilidade", () => {
  assert.deepEqual(
    shortestPath("cold", "warm", ["cold", "cord", "card", "ward", "warm"]),
    ["cold", "cord", "card", "ward", "warm"],
  );
  assert.equal(oneApart("cold", "card"), false);
  assert.equal(shortestPath("gato", "urso", ["gato", "urso"]), null);
});
test("Anagrama respeita quantidades, embaralha sem perder letras", () => {
  assert.equal(canBuild("casa", "saca"), true);
  assert.equal(canBuild("casaa", "saca"), false);
  const value = scramble("banana", seeded(4));
  assert.notEqual(value, "banana");
  assert.deepEqual([...value].sort(), [..."banana"].sort());
});
test("Forca não conta tentativas repetidas ou inválidas", () => {
  const a = guessLetter("casa", [], "á");
  assert.equal(a.correct, true);
  assert.equal(guessLetter("casa", a.guesses, "a").valid, false);
  assert.equal(guessLetter("casa", [], "ab").valid, false);
});
test("Snake: crescimento, reversão proibida e colisão", () => {
  let a = createSnake();
  assert.deepEqual(turnSnake(a, [-1, 0]).direction, [1, 0]);
  assert.equal(stepSnake(a, 18, true).body.length, 4);
  a.body[0] = [17, 8];
  assert.equal(stepSnake(a).alive, false);
});
test("Tetris: detecta horizontal/vertical, limpa e aplica gravidade", () => {
  const grid = [
    ["c", null, null],
    ["a", null, null],
    ["t", "c", "a"],
  ];
  const match = findWords(grid, ["cat"]);
  assert.equal(match.found.length, 1);
  const clean = clearWords(grid, match.cells);
  assert.equal(clean[2][0], null);
  assert.equal(clean[2][1], "c");
  assert.equal(dropLetter([["a"], ["b"]], 0, "c"), null);
});
test("Oito labirintos distintos e conectados; quatro IAs só andam em caminhos", () => {
  const signatures = new Set();
  for (let i = 0; i < 8; i++) {
    const grid = maze(i);
    signatures.add(JSON.stringify(grid));
    const queue = [[1, 1]],
      seen = new Set();
    while (queue.length) {
      const p = queue.shift(),
        key = p.join(",");
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push(...neighbors(grid, p).filter((q) => !seen.has(q.join(","))));
    }
    assert.equal(seen.size, grid.flat().filter((c) => c === 0).length);
    for (let kind = 0; kind < 4; kind++) {
      const next = ghostStep(
        grid,
        { kind, position: [17, 17] },
        [1, 1],
        [1, 0],
        10,
      );
      assert.ok(
        neighbors(grid, [17, 17]).some((p) => p.join(",") === next.join(",")),
      );
    }
  }
  assert.equal(signatures.size, 8);
});
test("Chuva: queda e efeitos especiais", () => {
  assert.equal(fallWords([{ y: 398, speed: 50 }], 1).missed.length, 1);
  assert.equal(specialEffect("gold", [{ x: 1, y: 1 }], {}).words.length, 0);
  assert.equal(specialEffect("heart", [], {}).life, 1);
});
test("Flappy: física e limites dos portais", () => {
  assert.ok(stepFlight({ y: 100, velocity: 0 }, 0.1, true).y < 100);
  assert.ok(stepFlight({ y: 100, velocity: 0 }, 0.1).y > 100);
  assert.equal(portalHit(100, [{ y: 100, height: 80 }]).y, 100);
  assert.equal(portalHit(140, [{ y: 100, height: 80 }]), null);
});
test("Ortografia e rimas validam resposta, repetição e lista", () => {
  const round = spellingRound({ correct: "casa", wrong: "csa" }, () => 0.8);
  assert.equal(judge(round, true), true);
  assert.equal(validateRhyme("pato", ["gato", "pato"], ["gato"]), "valid");
  assert.equal(validateRhyme("pato", ["gato", "pato"], ["pato"]), "used");
  assert.equal(validateRhyme("mesa", ["gato", "pato"], []), "invalid");
});
