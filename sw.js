/* ZR ルック比較 — オフライン用 Service Worker */
const VERSION = "v1";
const SHELL = "shell-" + VERSION;   // アプリ本体（HTML / manifest / アイコン）
const MEDIA = "media-" + VERSION;   // 比較画像（必要になった分だけ貯める）
const SHELL_FILES = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/maskable-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL && k !== MEDIA).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // 画像：キャッシュ優先（一度見た画像は電波が無くても出る）
  if (url.pathname.includes("/img/")) {
    e.respondWith(
      caches.open(MEDIA).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      })
    );
    return;
  }

  // それ以外：ネット優先、失敗したらキャッシュ
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) caches.open(SHELL).then((c) => c.put(req, res.clone()));
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("./index.html")))
  );
});

// 画面からの「すべて保存」要求
self.addEventListener("message", async (e) => {
  const data = e.data || {};
  if (data.type === "PRECACHE" && Array.isArray(data.urls)) {
    const cache = await caches.open(MEDIA);
    let done = 0;
    for (const u of data.urls) {
      try {
        if (!(await cache.match(u))) {
          const res = await fetch(u, { cache: "reload" });
          if (res.ok) await cache.put(u, res.clone());
        }
      } catch (err) { /* 失敗した分は次回に回す */ }
      done++;
      if (done % 8 === 0 || done === data.urls.length) {
        const clients = await self.clients.matchAll();
        clients.forEach((c) => c.postMessage({ type: "PRECACHE_PROGRESS", done, total: data.urls.length }));
      }
    }
  }
  if (data.type === "CLEAR_MEDIA") {
    await caches.delete(MEDIA);
    const clients = await self.clients.matchAll();
    clients.forEach((c) => c.postMessage({ type: "MEDIA_CLEARED" }));
  }
});
