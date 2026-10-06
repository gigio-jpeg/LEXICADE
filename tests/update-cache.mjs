import { readdir, writeFile } from "node:fs/promises";
const root = new URL("../", import.meta.url),
  files = [
    "./",
    "404.html",
    "index.html",
    "manifest.webmanifest",
    "assets/icons/logo.svg",
    "assets/icons/icon-192.png",
    "assets/icons/icon-512.png",
    "assets/fonts/Silkscreen-Regular.ttf",
    "vendor/supabase-2.57.4.js",
  ];
async function walk(folder) {
  for (const item of await readdir(new URL(folder, root), {
    withFileTypes: true,
  })) {
    const file = folder + item.name;
    if (item.isDirectory()) await walk(file + "/");
    else if (!file.endsWith(".md")) files.push(file);
  }
}
for (const folder of ["src/", "pages/", "games/", "data/", "vendor/three/"]) await walk(folder);
await writeFile(
  new URL("data/offline-files.json", root),
  JSON.stringify([...new Set(files)].sort(), null, 2) + "\n",
);
console.log(
  `Cache offline: ${new Set(files).size} arquivos estáticos. Sem respostas privadas.`,
);
