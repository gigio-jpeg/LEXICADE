import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { deflateRawSync } from "node:zlib";
import { createHash } from "node:crypto";
const root = new URL("../", import.meta.url),
  entries = [];
async function walk(folder = "") {
  for (const item of await readdir(new URL(folder, root), {
    withFileTypes: true,
  })) {
    if (
      [
        ".git",
        "node_modules",
        "artifacts",
        ".env",
        ".vscode",
        ".idea",
      ].includes(item.name) ||
      item.name.endsWith(".log")
    )
      continue;
    const file = folder + item.name;
    if (item.isDirectory()) await walk(file + "/");
    else entries.push(file);
  }
}
await walk();
const table = Array.from({ length: 256 }, (_, i) => {
  let n = i;
  for (let j = 0; j < 8; j++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
const crc = (buffer) => {
  let n = 0xffffffff;
  for (const b of buffer) n = table[(n ^ b) & 255] ^ (n >>> 8);
  return (n ^ 0xffffffff) >>> 0;
};
let offset = 0;
const body = [],
  central = [];
const date = new Date(),
  dosTime =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    (date.getSeconds() >> 1),
  dosDate =
    ((date.getFullYear() - 1980) << 9) |
    ((date.getMonth() + 1) << 5) |
    date.getDate();
for (const file of entries.sort()) {
  const data = await readFile(new URL(file, root)),
    compressed = deflateRawSync(data),
    name = Buffer.from("LEXICADE/" + file),
    checksum = crc(data);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0x800, 6);
  local.writeUInt16LE(8, 8);
  local.writeUInt16LE(dosTime, 10);
  local.writeUInt16LE(dosDate, 12);
  local.writeUInt32LE(checksum, 14);
  local.writeUInt32LE(compressed.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(name.length, 26);
  body.push(local, name, compressed);
  const header = Buffer.alloc(46);
  header.writeUInt32LE(0x02014b50);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(20, 6);
  header.writeUInt16LE(0x800, 8);
  header.writeUInt16LE(8, 10);
  header.writeUInt16LE(dosTime, 12);
  header.writeUInt16LE(dosDate, 14);
  header.writeUInt32LE(checksum, 16);
  header.writeUInt32LE(compressed.length, 20);
  header.writeUInt32LE(data.length, 24);
  header.writeUInt16LE(name.length, 28);
  header.writeUInt32LE(offset, 42);
  central.push(header, name);
  offset += local.length + name.length + compressed.length;
}
const directory = Buffer.concat(central),
  end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50);
end.writeUInt16LE(entries.length, 8);
end.writeUInt16LE(entries.length, 10);
end.writeUInt32LE(directory.length, 12);
end.writeUInt32LE(offset, 16);
const zip = Buffer.concat([...body, directory, end]);
await mkdir(new URL("artifacts/", root), { recursive: true });
await writeFile(new URL("artifacts/LEXICADE.zip", root), zip);
await writeFile(
  new URL("artifacts/SHA256.txt", root),
  createHash("sha256").update(zip).digest("hex") + "  LEXICADE.zip\n",
);
console.log(
  `LEXICADE.zip: ${entries.length} arquivos, ${(zip.length / 1024 / 1024).toFixed(2)} MB. Sem Git, caches ou segredos locais.`,
);
