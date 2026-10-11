/* OMME'S GALLERY — service worker (Vol 7, Firebase)
   Caches the app shell so it opens offline. Firebase / Google API calls
   always go straight to the network (Firestore keeps its own offline copy of the data). */
const CACHE = 'omme-shell-v8';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './firebase-config.js',
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

  // never touch Firebase / Google API traffic (login + database sync)
  if (/(^|\.)(googleapis\.com|firebaseio\.com|firebaseapp\.com)$/.test(url.hostname)) return;

  // Always fetch the app shell fresh (network-first) so new versions show up.
  if (url.origin === self.location.origin &&
      (url.pathname.endsWith('/') || url.pathname.endsWith('index.html') ||
       url.pathname.endsWith('sw.js') || url.pathname.endsWith('manifest.json') ||
       url.pathname.endsWith('firebase-config.js'))){
    e.respondWith(
      fetch(req).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); });
        return res;
      }).catch(function(){ return caches.match(req).then(function(c){ return c || caches.match('./index.html'); }); })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function(cached){
      var net = fetch(req).then(function(res){
        var okRes = res && (res.status === 200 || res.type === 'opaque');   // <script> tags load cross-site files as opaque
        if (okRes &&
            (url.origin === self.location.origin || url.href.indexOf('jsdelivr') !== -1 ||
             url.hostname === 'www.gstatic.com')){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copy); });
        }
        return res;
      }).catch(function(){ return cached; });
      return cached || net;                       // cache-first, refresh in background
    })
  );
});
