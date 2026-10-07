const VERSION = "lexicade-v2.3.2";
const base = new URL("./", self.location.href);
self.addEventListener("install", (event) =>
  event.waitUntil(
    (async () => {
      const response = await fetch(new URL("data/offline-files.json", base), {
        cache: "reload",
      });
      if (!response.ok) throw new Error("Offline manifest unavailable");
      const files = await response.json(),
        cache = await caches.open(VERSION);
      // Individual verified responses avoid one broken URL silently poisoning the cache.
      await Promise.all(
        files.map(async (file) => {
          const url = new URL(file, base);
          const resource = await fetch(url, { cache: "reload" });
          if (!resource.ok) throw new Error(`Offline asset failed: ${file}`);
          await cache.put(url, resource);
        }),
      );
    })(),
  ),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys())
        if (key.startsWith("lexicade-") && key !== VERSION)
          await caches.delete(key);
      await self.clients.claim();
    })(),
  ),
);
self.addEventListener("fetch", (event) => {
  const request = event.request,
    url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.origin !== base.origin ||
    !url.pathname.startsWith(base.pathname) ||
    /\/(supabase|tests|artifacts)\//.test(url.pathname)
  )
    return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(VERSION),
        cached = await cache.match(request, { ignoreSearch: true });
      try {
        const response = await fetch(request);
        if (response.ok && cached)
          await cache.put(
            new Request(url.origin + url.pathname),
            response.clone(),
          );
        return response;
      } catch {
        const client = await self.clients.get(
          event.clientId || event.resultingClientId,
        );
        client?.postMessage({ type: "OFFLINE_FALLBACK" });
        if (cached) return cached;
        if (request.mode === "navigate") {
          const indexURL = new URL(url.href);
          if (indexURL.pathname.endsWith("/"))
            indexURL.pathname += "index.html";
          const page = await cache.match(indexURL, { ignoreSearch: true });
          if (page) return page;
          return (
            (await cache.match(new URL("pages/404.html", base))) ??
            Response.error()
          );
        }
        return Response.error();
      }
    })(),
  );
});
