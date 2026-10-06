import http from "node:http";
import { readFile, realpath } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, extname, sep } from "node:path";
const root = await realpath(fileURLToPath(new URL("../", import.meta.url)));
const index = process.argv.indexOf("--port"),
  port = index < 0 ? 5173 : Number(process.argv[index + 1]);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error("Use --port 1024..65535");
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ttf": "font/ttf",
  ".md": "text/plain; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
};
const server = http.createServer(async (req, res) => {
  if (!["GET", "HEAD"].includes(req.method)) {
    res.writeHead(405);
    res.end();
    return;
  }
  try {
    const route = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    if (
      route
        .split("/")
        .some(
          (p) => p.startsWith(".") || ["node_modules", "artifacts"].includes(p),
        )
    ) {
      res.writeHead(403);
      res.end();
      return;
    }
    const file = resolve(
      root,
      "." + route + (route.endsWith("/") ? "index.html" : ""),
    );
    const actual = await realpath(file);
    if (!actual.startsWith(root + sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    const buffer = await readFile(actual);
    res.writeHead(200, {
      "Content-Type": types[extname(file)] ?? "application/octet-stream",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    });
    res.end(req.method === "HEAD" ? undefined : buffer);
  } catch {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    try {
      res.end(await readFile(resolve(root, "404.html")));
    } catch {
      res.end("404");
    }
  }
});
server.on("error", (error) => {
  console.error(
    error.code === "EADDRINUSE"
      ? `Porta ${port} ocupada. Use npm start -- --port 5174.`
      : error.message,
  );
  process.exitCode = 1;
});
server.listen(port, "127.0.0.1", () =>
  console.log(`LEXICADE: http://localhost:${port}\nCtrl+C para parar.`),
);
