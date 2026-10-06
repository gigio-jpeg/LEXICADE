// Depois de publicar: node tests/configure-domain.mjs https://nome.pages.dev
import { readdir, readFile, writeFile } from "node:fs/promises";
const site = new URL(process.argv[2] ?? "https://lexicade.example/");
if (
  site.protocol !== "https:" ||
  site.username ||
  site.password ||
  site.search ||
  site.hash
)
  throw new Error(
    "Use um endereço público HTTPS sem credenciais, consulta ou fragmento.",
  );
if (!site.pathname.endsWith("/")) site.pathname += "/";
const root = new URL("../", import.meta.url),
  pages = ["index.html", "404.html"];
for (const folder of ["pages/", "games/"]) {
  async function walk(dir) {
    for (const e of await readdir(new URL(dir, root), {
      withFileTypes: true,
    })) {
      if (e.isDirectory()) await walk(dir + e.name + "/");
      else if (
        e.name.endsWith(".html") &&
        ![
          "login.html",
          "redefinir-senha.html",
          "escolher-nome.html",
          "404.html",
        ].includes(e.name)
      )
        pages.push(dir + e.name);
    }
  }
  await walk(folder);
}
const safe = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;");
for (const file of pages) {
  const target = new URL(file === "index.html" ? "" : file, site).href,
    share = new URL("assets/icons/share.png", site).href;
  let html = await readFile(new URL(file, root), "utf8");
  html = html
    .replace(/\s*<link rel="canonical"[^>]*>/g, "")
    .replace(/\s*<meta property="og:url"[^>]*>/g, "")
    .replace(
      /<meta property="og:image"[^>]*>/,
      `<meta property="og:image" content="${safe(share)}">`,
    );
  if (file === "404.html")
    html = html.replace(
      /<base href="[^"]*">/,
      `<base href="${safe(site.pathname)}">`,
    );
  html = html.replace(
    "</head>",
    `  <link rel="canonical" href="${safe(target)}">\n  <meta property="og:url" content="${safe(target)}">\n</head>`,
  );
  await writeFile(new URL(file, root), html);
}
await writeFile(
  new URL("sitemap.xml", root),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    pages
      .map(
        (file) =>
          `  <url><loc>${safe(new URL(file === "index.html" ? "" : file, site).href)}</loc></url>`,
      )
      .join("\n") +
    "\n</urlset>\n",
);
console.log(
  site.hostname === "lexicade.example"
    ? "SEO com domínio de exemplo: configurar o domínio real antes de publicar."
    : `SEO configurado para ${site.href}`,
);
