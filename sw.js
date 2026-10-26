// Fliperama de Bolso service worker: keeps the launcher, the games and their fonts on the phone,
// so the installed app opens without internet. Change VERSION whenever a game is added or removed.
'use strict';
const VERSION = 'fliperama-v1';
const FILES = [
    './',
    'index.html',
    'capivara-crossing.html',
    'pega-ladrao.html',
    'radical-racing-gt.html',
    'raide-fighting.html',
    'manifest.webmanifest',
    'icon-192.png',
    'icon-512.png'
];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(key => key !== VERSION).map(key => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

function save(request, response) {
    const copy = response.clone();
    caches.open(VERSION).then(cache => cache.put(request, copy));
    return response;
}

self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET') {
        return;
    }
    const url = new URL(request.url);
    // Fonts never change: use the saved copy first
    if (FONT_HOSTS.includes(url.hostname)) {
        event.respondWith(caches.match(request).then(hit => hit || fetch(request).then(response => save(request, response))));
        return;
    }
    if (url.origin !== self.location.origin) {
        return;
    }
    // Launcher and games: the newest version when online, the saved copy when offline
    event.respondWith(
        fetch(request)
            .then(response => (response.ok ? save(request, response) : response))
            .catch(() => caches.match(request, { ignoreSearch: true }).then(hit => hit || caches.match('./')))
    );
});
