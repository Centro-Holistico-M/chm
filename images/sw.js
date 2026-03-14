const CACHE_NAME = 'chm-v7';
const API_CACHE_NAME = 'chm-api-v7';

const ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/images/logo.png',
    '/images/icon-192.png',
    '/images/icon-512.png',
    '/images/manifest.json'
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
    
    // APIs: Network-first con cache fallback
    if (url.includes('opensheet.elk.sh')) {
        event.respondWith(networkFirstAPI(url));
        return;
    }
    
    // Fuentes de Google: Cache-first
    if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
        event.respondWith(cacheFirst(url));
        return;
    }
    
    // Archivos estáticos: Cache-first
    event.respondWith(cacheFirst(url));
});

// ============================================
// ESTRATEGIA: Network-first para APIs
// ============================================
async function networkFirstAPI(url) {
    try {
        // Intentar primero online
        const response = await fetch(url);
        
        if (response.ok) {
            const clone = response.clone();
            const cache = await caches.open(API_CACHE_NAME);
            cache.put(url, clone);
            console.log('✅ API online:', url.substring(url.lastIndexOf('/') + 1));
        }
        
        return response;
    } catch (error) {
        // Si falla, intentar del cache
        console.log('⚠️ Sin conexión, buscando en cache:', url.substring(url.lastIndexOf('/') + 1));
        
        const cached = await caches.match(url);
        if (cached) {
            return cached;
        }
        
        // Si no hay cache, devolver error
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
    // 1. Buscar en cache
    const cached = await caches.match(url);
    if (cached) {
        return cached;
    }
    
    // 2. Si no está, descargar y guardar
    try {
        const response = await fetch(url);
        
        if (response.ok) {
            const clone = response.clone();
            const cache = await caches.open(CACHE_NAME);
            cache.put(url, clone);
        }
        
        return response;
    } catch (error) {
        // Si es HTML, devolver index.html
        if (url.includes('.html')) {
            return caches.match('/index.html');
        }
        
        return new Response('No disponible offline', { status: 503 });
    }
}
