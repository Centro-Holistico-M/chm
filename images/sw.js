const CACHE_NAME = 'chm-v9';
const API_CACHE_NAME = 'chm-api-v9';

const ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/images/logo.png',
    '/images/icon-192.png',
    '/images/icon-512.png',
    '/images/manifest.json',
    'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Montserrat:wght@300;400;500&display=swap'
];

// ============================================
// INSTALL - Guardar archivos estáticos
// ============================================
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Guardando archivos en cache...');
                return cache.addAll(ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// ============================================
// ACTIVATE - Limpiar caches antiguos
// ============================================
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => {
                console.log('🧹 Limpiando caches antiguos...');
                return Promise.all(
                    keys.filter(key => key !== CACHE_NAME && key !== API_CACHE_NAME)
                        .map(key => {
                            console.log('  ❌ Eliminando:', key);
                            return caches.delete(key);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// ============================================
// FETCH - Estrategias diferenciadas
// ============================================
self.addEventListener('fetch', event => {
    const url = event.request.url;
    
    // Fuentes de Google: Cache-first
    if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
        event.respondWith(cacheFirst(url));
        return;
    }
    
    // APIs: Cache-first con datos guardados
    if (url.includes('opensheet.elk.sh')) {
        event.respondWith(apiCacheFirst(url));
        return;
    }
    
    // Archivos estáticos: Cache-first
    event.respondWith(cacheFirst(url));
});

// ============================================
// ESTRATEGIA: Cache-first para APIs
// ============================================
async function apiCacheFirst(url) {
    // 1. Buscar en cache primero
    const cached = await caches.match(url);
    if (cached) {
        console.log('📦 API desde cache:', url.substring(url.lastIndexOf('/') + 1));
        return cached;
    }
    
    // 2. Si no está en cache, intentar red
    try {
        const response = await fetch(url);
        
        if (response.ok) {
            const clone = response.clone();
            const cache = await caches.open(API_CACHE_NAME);
            cache.put(url, clone);
            console.log('✅ API guardada:', url.substring(url.lastIndexOf('/') + 1));
        }
        
        return response;
    } catch (error) {
        console.log('❌ Sin conexión ni cache para:', url);
        return new Response(JSON.stringify({ error: 'offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// ============================================
// ESTRATEGIA: Cache-first para archivos estáticos
// ============================================
async function cacheFirst(url) {
    const cached = await caches.match(url);
    if (cached) {
        return cached;
    }
    
    try {
        const response = await fetch(url);
        
        if (response.ok) {
            const clone = response.clone();
            const cache = await caches.open(CACHE_NAME);
            cache.put(url, clone);
        }
        
        return response;
    } catch (error) {
        if (url.includes('.html')) {
            return caches.match('/index.html');
        }
        
        return new Response('No disponible offline', { status: 503 });
    }
}
