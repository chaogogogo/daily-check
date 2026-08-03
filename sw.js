const CACHE = "cc-gogogo-v28";
const ASSETS = ["./daily-checkin.html", "./style.css", "./app.js", "./manifest.json", "./icon-180.png", "./icon-512.png"];

self.addEventListener("install", e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});
self.addEventListener("activate", e => {
    e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
    self.clients.claim();
});
// 页面点击「立即更新」后，让等待中的新版本立即接管
self.addEventListener("message", e => {
    if (e.data === "skipWaiting") self.skipWaiting();
});
// 网络优先、失败时用缓存，保证离线也能打开
self.addEventListener("fetch", e => {
    e.respondWith(
        fetch(e.request).then(res => {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => { });
            return res;
        }).catch(() => caches.match(e.request))
    );
});
