// 離線快取（PWA）
//  - 遊戲本身的檔案：先拿網路上最新的，沒網路才用存起來的（更新後馬上看得到）
//  - 去背工具、字型（CDN）：存起來就一直用（檔案很大、不會變）
// 新增檔案時記得加進 SHELL，並把 VERSION 加一。
'use strict';
const VERSION = 'paper-v10';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/store.js', 'js/cutout.js', 'js/puppet.js', 'js/pet.js', 'js/main.js', 'js/kidkit.js', 'js/tilt.js', 'js/maker.js',
  'js/games/runner.js', 'js/games/catch.js', 'js/games/fly.js', 'js/games/boxing.js',
  'js/games/stack.js', 'js/games/launch.js', 'js/games/dance.js', 'js/games/bubble.js', 'js/games/peek.js', 'js/games/memory.js',
  'js/games/balloon.js', 'js/games/count.js', 'js/games/piano.js', 'js/games/fishing.js', 'js/games/garden.js', 'js/games/dots.js', 'js/games/coloring.js', 'js/games/puzzle.js', 'js/games/feed.js', 'js/games/shapes.js',
  'js/games/drum.js', 'js/games/eggs.js', 'js/games/bath.js', 'js/games/crossing.js', 'js/games/size.js', 'js/games/animals.js', 'js/games/sort.js', 'js/games/paint.js', 'js/games/flashlight.js', 'js/games/inflate.js', 'js/games/basket.js', 'js/games/keepup.js', 'js/games/darts.js', 'js/games/bricks.js', 'js/games/snake.js', 'js/games/space.js', 'js/games/bowling.js', 'js/games/ski.js', 'js/games/baseball.js', 'js/games/mathrush.js',
  'js/games/marble.js', 'js/games/maze.js', 'js/games/tightrope.js', 'js/games/tiltcar.js', 'js/games/tiltcatch.js',
  'js/games/tiltrun.js', 'js/games/tiltroam.js', 'js/games/tiltball.js', 'js/games/tiltmisc.js', 'js/games/shake.js', 'js/games/board.js', 'js/games/puzzles.js', 'js/games/kidquiz.js', 'js/games/nightmarket.js', 'js/games/timing.js', 'js/games/create.js', 'js/games/tiltpack2.js', 'js/games/tiltphys.js', 'js/games/shake2.js', 'js/games/kidquiz2.js', 'js/games/kidplay.js', 'js/games/brain.js', 'js/games/skill.js', 'js/games/tilt3.js', 'js/games/motion3.js', 'js/games/kid3.js', 'js/games/puzzle3.js', 'js/games/board3.js',
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
