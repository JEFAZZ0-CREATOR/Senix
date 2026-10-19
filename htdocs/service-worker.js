/* ==========================================================
 * Senix v2.0 — Service Worker (PWA)
 * Modo offline y caché inteligente
 * ========================================================== */

const CACHE_NAME    = 'senix-v2.0.0';
const CACHE_STATIC  = 'senix-static-v7';
const CACHE_DYNAMIC = 'senix-dynamic-v3';
const CACHE_IMAGES  = 'senix-images-v3';

const STATIC_ASSETS = [
    '/',
    '/index.php',
    '/login.php',
    '/register.php',
    '/menu.php',
    '/offline.php',
    '/manifest.json',
    '/assets/css/style.css',
    '/assets/css/animations.css',
    '/assets/js/main.js',
    '/assets/js/ui.js',
    '/assets/img/logo.svg',
    '/assets/img/icon-192.png',
    '/assets/img/icon-512.png',
    '/assets/css/senix-gargantua.css',
    '/assets/js/senix-gargantua.js',
    '/assets/js/senix-3d-all.js',
    '/assets/audio/correct.mp3',
    '/assets/audio/incorrect.mp3'
];

const CDN_ASSETS = [
    'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;600;700&display=swap',
    'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js',
    'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
    'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js'
];

// ==========================================================
// INSTALL
// ==========================================================
self.addEventListener('install', event => {
    console.log('[SW] Instalando...');
    
    event.waitUntil(
        caches.open(CACHE_STATIC)
            .then(cache => {
                return cache.addAll(STATIC_ASSETS).catch(err => {
                    console.warn('[SW] Algunos assets no se pudieron cachear:', err);
                });
            })
            .then(() => {
                return caches.open(CACHE_DYNAMIC).then(cache => {
                    return Promise.all(
                        CDN_ASSETS.map(url =>
                            fetch(url, { mode: 'cors' })
                                .then(res => res.ok ? cache.put(url, res) : null)
                                .catch(() => null)
                        )
                    );
                });
            })
            .then(() => self.skipWaiting())
    );
});

// ==========================================================
// ACTIVATE
// ==========================================================
self.addEventListener('activate', event => {
    console.log('[SW] Activando...');
    
    const validCaches = [CACHE_STATIC, CACHE_DYNAMIC, CACHE_IMAGES];
    
    event.waitUntil(
        caches.keys()
            .then(names => {
                return Promise.all(
                    names.map(name => {
                        if (!validCaches.includes(name)) {
                            console.log('[SW] Borrando caché vieja:', name);
                            return caches.delete(name);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// ==========================================================
// FETCH
// ==========================================================
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Ignorar requests no-GET
    if (request.method !== 'GET') return;
    
    // Ignorar extensiones de Chrome
    if (url.protocol === 'chrome-extension:') return;
    
    // API: network-first (siempre datos frescos)
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirst(request, CACHE_DYNAMIC));
        return;
    }
    
    // Imágenes: cache-first
    if (request.destination === 'image' || /\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(url.pathname)) {
        event.respondWith(cacheFirst(request, CACHE_IMAGES));
        return;
    }
    
    // CSS, JS, fuentes: stale-while-revalidate
    if (/\.(css|js|woff2?|ttf|otf)$/i.test(url.pathname) || 
        url.hostname.includes('fonts.g') ||
        url.hostname.includes('cdn.jsdelivr')) {
        event.respondWith(staleWhileRevalidate(request, CACHE_STATIC));
        return;
    }
    
    // HTML/PHP: network-first con fallback a offline
    if (request.destination === 'document' || url.pathname.endsWith('.php')) {
        event.respondWith(networkFirstWithOffline(request));
        return;
    }
    
    // Por defecto: network-first
    event.respondWith(networkFirst(request, CACHE_DYNAMIC));
});

// ==========================================================
// ESTRATEGIAS
// ==========================================================

async function cacheFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;
    
    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        return new Response('', { status: 503, statusText: 'Offline' });
    }
}

async function networkFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    
    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        const cached = await cache.match(request);
        if (cached) return cached;
        throw err;
    }
}

async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    const fetchPromise = fetch(request)
        .then(response => {
            if (response.ok) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => null);
    
    return cached || await fetchPromise || new Response('', { status: 503 });
}

async function networkFirstWithOffline(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_DYNAMIC);
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        const cached = await caches.match(request);
        if (cached) return cached;
        
        return caches.match('/offline.php');
    }
}

// ==========================================================
// BACKGROUND SYNC (para futuras sincronizaciones)
// ==========================================================
self.addEventListener('sync', event => {
    console.log('[SW] Sync:', event.tag);
    if (event.tag === 'sync-progress') {
        event.waitUntil(syncProgress());
    }
});

async function syncProgress() {
    // Aquí sincronizarías progreso guardado offline
    console.log('[SW] Sincronizando progreso...');
}

// ==========================================================
// PUSH NOTIFICATIONS
// ==========================================================
self.addEventListener('push', event => {
    const data = event.data ? event.data.json() : {};
    
    const options = {
        body: data.body || 'Nueva notificación de Senix',
        icon: '/assets/img/icon-192.png',
        badge: '/assets/img/badge-72.png',
        vibrate: [200, 100, 200],
        data: { url: data.url || '/menu.php' },
        actions: [
            { action: 'open', title: 'Abrir' },
            { action: 'close', title: 'Cerrar' }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'Senix', options)
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'close') return;
    
    const url = event.notification.data.url || '/menu.php';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(clientList => {
                for (const client of clientList) {
                    if (client.url.includes(url) && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) return clients.openWindow(url);
            })
    );
});

// ==========================================================
// MENSAJES DESDE LA PÁGINA
// ==========================================================
self.addEventListener('message', event => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
    if (event.data === 'clearCache') {
        caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
        });
    }
});
