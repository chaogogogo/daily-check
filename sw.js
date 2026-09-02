const CACHE = "cc-gogogo-v76";
const OFFLINE_PAGE = "./daily-checkin.html";
const ASSETS = [OFFLINE_PAGE, "./style.css?v=76", "./app.js?v=76", "./manifest.json?v=76", "./icon-180.png?v=76", "./icon-192.png?v=76", "./icon-512.png?v=76"];

self.addEventListener("install", e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});
self.addEventListener("activate", e => {
    e.waitUntil(Promise.all([
        caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("cc-gogogo-") && k !== CACHE).map(k => caches.delete(k)))),
        self.clients.claim(),
    ]));
});
// 页面点击「立即更新」后，让等待中的新版本立即接管
self.addEventListener("message", e => {
    if (e.data === "skipWaiting") self.skipWaiting();
});
// 网络优先、失败时用缓存，保证离线也能打开
self.addEventListener("fetch", e => {
    if (e.request.method !== "GET") return;
    if (e.request.mode === "navigate") {
        e.respondWith(
            fetch(e.request).then(res => {
                const clone = res.clone();
                caches.open(CACHE).then(c => c.put(OFFLINE_PAGE, clone)).catch(() => { });
                return res;
            }).catch(async () => {
                return (await caches.match(e.request, { ignoreSearch: true }))
                    || (await caches.match(OFFLINE_PAGE))
                    || new Response("应用暂时无法离线启动，请联网后重试。", {
                        status: 503,
                        headers: { "Content-Type": "text/plain; charset=utf-8" },
                    });
            })
        );
        return;
    }
    e.respondWith(
        fetch(e.request).then(res => {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => { });
            return res;
        }).catch(async () => {
            return (await caches.match(e.request, { ignoreSearch: true }))
                || new Response("", { status: 504, statusText: "Offline" });
        })
    );
});
