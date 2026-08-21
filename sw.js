// おやこアーケード Service Worker
// オフラインでも全ゲームを遊べるように、初回アクセス時に全ファイルをキャッシュする。
//
// キャッシュの中身を変えたとき（画像やゲームの追加/更新）は、
// CACHE_VERSION の値を書き換えてデプロイすること（古いキャッシュを破棄して新しいものに切り替わる）。
const CACHE_VERSION = 'v16';
const CACHE_NAME = `oyako-arcade-${CACHE_VERSION}`;
const FONT_CACHE_NAME = 'oyako-arcade-fonts';

// アプリの起動に必要な全ファイル（ここに列挙したものはオフラインで確実に開ける）
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './pause-ui.js',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/favicon-32.png',
  './games/choitashi-simon.html',
  './games/friends-masu.html',
  './games/hanbun-hanbun.html',
  './games/make10.html',
  './games/mvp_stg_v2.html',
  './games/reaction-duel.html',
  './games/stg_stage1.html',
  './games/timing-duel.html',
  './games/img/dragon.png',
  './games/img/dragon_atack.png',
  './games/img/fighter.png',
  './games/img/fighter_atack.png',
  './games/img/fireatack.mp3',
  './games/img/magckatack.mp3',
  './games/img/magic.png',
  './games/img/magic_atack.png',
  './games/img/swordattak.mp3',
  './games/img/warrior.png',
  './games/img/warrior_atack.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // addAll は1件でも失敗すると全体が失敗するので、1件ずつ試して失敗しても続行する
      return Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })).catch((err) => {
            console.warn('[sw] precache failed:', url, err);
          })
        )
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME && name !== FONT_CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isGoogleFonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  const isSameOrigin = url.origin === self.location.origin;

  if (!isSameOrigin && !isGoogleFonts) return; // それ以外の外部リソースはSWを介さない

  event.respondWith(
    (async () => {
      const cacheName = isGoogleFonts ? FONT_CACHE_NAME : CACHE_NAME;
      const cache = await caches.open(cacheName);
      const cached = await cache.match(req);

      // 表示は基本キャッシュ優先（オフラインでも即座に開ける）。
      // 裏側でネットワークから最新版を取りに行き、次回アクセス用に更新しておく。
      const networkFetch = fetch(req)
        .then((res) => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);

      if (cached) {
        event.waitUntil(networkFetch);
        return cached;
      }

      const fresh = await networkFetch;
      if (fresh) return fresh;

      // オフラインかつキャッシュにも無い場合、ページ遷移ならトップページを代わりに返す
      if (req.mode === 'navigate') {
        const fallback = await cache.match('./index.html');
        if (fallback) return fallback;
      }
      return new Response('オフラインのため表示できません。', {
        status: 503,
        statusText: 'Offline',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    })()
  );
});
