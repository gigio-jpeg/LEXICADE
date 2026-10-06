import { test } from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
async function walk(folder) {
  const result = [];
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    if ([".git", "node_modules", "artifacts"].includes(entry.name)) continue;
    const file = new URL(entry.name + (entry.isDirectory() ? "/" : ""), folder);
    if (entry.isDirectory()) result.push(...(await walk(file)));
    else result.push(file);
  }
  return result;
}
test("Todos os módulos JavaScript compilam e seus imports locais existem", async () => {
  for (const file of await walk(new URL("../src/", import.meta.url))) {
    if (!file.pathname.endsWith(".js")) continue;
    const checked = spawnSync(
      process.execPath,
      ["--check", fileURLToPath(file)],
      { encoding: "utf8" },
    );
    assert.equal(checked.status, 0, checked.stderr);
    const text = await readFile(file, "utf8");
    for (const match of text.matchAll(
      /(?:from\s+|import\s*)['"]([^'"]+)['"]/g,
    )) {
      if (match[1].startsWith(".")) await access(new URL(match[1], file));
    }
  }
});
test("Todas as páginas têm CSP, viewport, descrição e arquivos locais válidos", async () => {
  for (const file of await walk(new URL("../", import.meta.url))) {
    if (!file.pathname.endsWith(".html")) continue;
    const text = await readFile(file, "utf8");
    assert.match(text, /Content-Security-Policy/);
    assert.match(text, /name="viewport"/);
    assert.match(text, /name="description"/);
    // A base URL is a browser routing prefix, not an asset on the filesystem.
    const assetMarkup = text.replace(/<base\b[^>]*>/g, "");
    for (const m of assetMarkup.matchAll(/(?:href|src)="([^"#]+)"/g)) {
      if (!m[1].includes("://")) await access(new URL(m[1], file));
    }
  }
});
