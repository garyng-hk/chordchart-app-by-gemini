self.addEventListener('install', (e) => {
    console.log('[Service Worker] Install');
});

self.addEventListener('fetch', (e) => {
    // 讓 PWA 能夠運作的基礎攔截
    e.respondWith(fetch(e.request).catch(() => new Response('網路連線失敗')));
});// JavaScript Document