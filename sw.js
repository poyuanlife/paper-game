// 離線快取（PWA）
//  - 遊戲本身的檔案：先拿網路上最新的，沒網路才用存起來的（更新後馬上看得到）
//  - 去背工具、字型（CDN）：存起來就一直用（檔案很大、不會變）
// 新增檔案時記得加進 SHELL，並把 VERSION 加一。
'use strict';
const VERSION = 'paper-v2';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/store.js', 'js/cutout.js', 'js/puppet.js', 'js/pet.js', 'js/main.js', 'js/maker.js',
  'js/games/runner.js', 'js/games/catch.js', 'js/games/fly.js', 'js/games/boxing.js',
  'js/games/stack.js', 'js/games/launch.js', 'js/games/dance.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
];
const CDN = ['cdn.jsdelivr.net', 'storage.googleapis.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== 'paper-cdn').map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (CDN.includes(url.hostname)) {
    e.respondWith(caches.open('paper-cdn').then(async c => {
      const hit = await c.match(req); if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') c.put(req, res.clone()).catch(() => {});
      return res;
    }));
    return;
  }
  if (url.origin !== location.origin || url.pathname.includes('/_test/')) return;
  e.respondWith((async () => {
    const c = await caches.open(VERSION);
    try {
      const res = await fetch(req, { cache: 'no-cache' });
      if (res.ok) c.put(req, res.clone()).catch(() => {});
      return res;
    } catch (err) {
      return (await c.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' && await c.match('index.html')) || Response.error();
    }
  })());
});
