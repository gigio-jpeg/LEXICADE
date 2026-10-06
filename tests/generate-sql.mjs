import { readFile, writeFile } from "node:fs/promises";
const files = [
  "migrations/001_schema.sql",
  "migrations/002_rpcs.sql",
  "migrations/003_queries.sql",
  "seed.sql",
  "migrations/004_arcade_focus.sql",
];
const chunks = [
  "-- LEXICADE 2: somente para projeto Supabase vazio.",
  "-- Execute este arquivo no SQL Editor. Nao execute se ja instalou a primeira versao.",
  "-- Tudo e instalado em uma transacao: qualquer falha desfaz a instalacao inteira.",
  "begin;",
];
for (const file of files) {
  const sql = await readFile(
    new URL("../supabase/" + file, import.meta.url),
    "utf8",
  );
  chunks.push(
    "-- Arquivo: " + file,
    sql.replace(/^(begin|commit);\s*$/gim, ""),
  );
}
chunks.push("commit;");
await writeFile(
  new URL("../supabase/INSTALAR-TUDO.sql", import.meta.url),
  chunks.join("\n") + "\n",
);
console.log(
  "supabase/INSTALAR-TUDO.sql gerado: banco vazio, instalacao atomica.",
);
