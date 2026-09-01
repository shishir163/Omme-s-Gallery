/* OMME'S GALLERY — service worker (Vol 6, local)
   Caches the app shell so it opens offline. API calls (POST to Apps Script)
   always go to the network and are never cached. */
const CACHE = 'omme-shell-v6';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE)
      .then(function(c){ return c.addAll(SHELL); })
      .catch(function(){})           // don't fail install if one file is missing
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; })
                             .map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET') return;              // leave API POSTs alone

  if (req.mode === 'navigate'){                  // page loads: try net, fall back to cached shell
    e.respondWith(fetch(req).catch(function(){ return caches.match('./index.html'); }));
    return;
  }

  var url = new URL(req.url);
  e.respondWith(
    caches.match(req).then(function(cached){
      var net = fetch(req).then(function(res){
        if (res && res.status === 200 &&
            (url.origin === self.location.origin || url.href.indexOf('jsdelivr') !== -1)){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copy); });
        }
        return res;
      }).catch(function(){ return cached; });
      return cached || net;                       // cache-first, refresh in background
    })
  );
});
