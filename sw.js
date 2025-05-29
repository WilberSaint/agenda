/**
 * Service Worker - Agenda Personal Pro
 * Maneja cache, offline functionality y background sync
 */

const CACHE_NAME = 'agenda-pro-v1.0.0';
const CACHE_VERSION = '1.0.0';
const DATA_CACHE_NAME = 'agenda-pro-data-v1.0.0';

// Archivos estáticos para cache inicial
const STATIC_CACHE_URLS = [
    '/',
    '/index.html',
    '/manifest.json',
    
    // CSS
    '/css/base.css',
    '/css/themes/masculine.css',
    '/css/themes/feminine.css',
    '/css/responsive.css',
    
    // JavaScript
    '/js/app.js',
    '/js/themes.js',
    '/js/storage.js',
    '/js/modules/agenda.js',
    
    // External CDN resources
    'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js',
    
    // Icons (se agregarán cuando estén disponibles)
    '/assets/icons/icon-192x192.png',
    '/assets/icons/icon-512x512.png',
    '/assets/icons/favicon-32x32.png',
    
    // Offline fallback page
    '/offline.html'
];

// URLs que siempre deben ir a la red (no cachear)
const NEVER_CACHE_URLS = [
    '/api/',
    'chrome-extension://',
    'moz-extension://'
];

// URLs de datos que se cachean dinámicamente
const DATA_CACHE_URLS = [
    '/api/tasks',
    '/api/habits',
    '/api/goals',
    '/api/sync'
];

/**
 * ===== EVENT LISTENERS =====
 */

// Install Event - Cachea recursos estáticos
self.addEventListener('install', (event) => {
    console.log('📦 Service Worker: Install event');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📥 Service Worker: Caching static assets');
                return cache.addAll(STATIC_CACHE_URLS.filter(url => {
                    // Solo cachear URLs que existen
                    return !url.includes('/assets/icons/') || url.includes('favicon');
                }));
            })
            .then(() => {
                console.log('✅ Service Worker: Static cache complete');
                // Forzar activación inmediata
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ Service Worker: Cache failed', error);
            })
    );
});

// Activate Event - Limpiar caches antiguos
self.addEventListener('activate', (event) => {
    console.log('🔄 Service Worker: Activate event');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // Eliminar caches antiguos
                        if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
                            console.log('🗑️ Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker: Cache cleanup complete');
                // Tomar control inmediato de todas las páginas
                return self.clients.claim();
            })
    );
});

// Fetch Event - Interceptar requests
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Ignorar requests que no deben ser cacheados
    if (shouldNeverCache(request.url)) {
        return;
    }
    
    // Manejar diferentes tipos de requests
    if (isStaticAsset(request)) {
        event.respondWith(handleStaticAsset(request));
    } else if (isDataRequest(request)) {
        event.respondWith(handleDataRequest(request));
    } else if (isNavigationRequest(request)) {
        event.respondWith(handleNavigationRequest(request));
    } else {
        event.respondWith(handleOtherRequest(request));
    }
});

// Background Sync - Para sincronizar datos cuando vuelva la conexión
self.addEventListener('sync', (event) => {
    console.log('🔄 Service Worker: Background sync event', event.tag);
    
    if (event.tag === 'background-sync-tasks') {
        event.waitUntil(syncTasks());
    } else if (event.tag === 'background-sync-habits') {
        event.waitUntil(syncHabits());
    }
});

// Push Event - Para notificaciones push (futuro)
self.addEventListener('push', (event) => {
    console.log('📢 Service Worker: Push event', event);
    
    if (event.data) {
        const data = event.data.json();
        event.waitUntil(showNotification(data));
    }
});

// Notification Click - Manejar clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
    console.log('👆 Service Worker: Notification click', event);
    
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow(event.notification.data?.url || '/')
    );
});

/**
 * ===== HELPER FUNCTIONS =====
 */

/**
 * Verificar si una URL nunca debe ser cacheada
 */
function shouldNeverCache(url) {
    return NEVER_CACHE_URLS.some(pattern => url.includes(pattern));
}

/**
 * Verificar si es un asset estático
 */
function isStaticAsset(request) {
    return request.method === 'GET' && (
        request.url.includes('.css') ||
        request.url.includes('.js') ||
        request.url.includes('.png') ||
        request.url.includes('.jpg') ||
        request.url.includes('.svg') ||
        request.url.includes('.ico') ||
        request.url.includes('.woff') ||
        request.url.includes('.woff2') ||
        request.url.includes('cdnjs.cloudflare.com')
    );
}

/**
 * Verificar si es un request de datos
 */
function isDataRequest(request) {
    return DATA_CACHE_URLS.some(pattern => request.url.includes(pattern));
}

/**
 * Verificar si es un request de navegación
 */
function isNavigationRequest(request) {
    return request.mode === 'navigate' || 
           (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

/**
 * Manejar assets estáticos - Cache First Strategy
 */
async function handleStaticAsset(request) {
    try {
        // Intentar servir desde cache primero
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Si no está en cache, buscar en red y cachear
        const networkResponse = await fetch(request);
        
        // Solo cachear respuestas exitosas
        if (networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.error('❌ Service Worker: Static asset failed', error);
        
        // Fallback para iconos/imágenes
        if (request.url.includes('.png') || request.url.includes('.jpg')) {
            return new Response('', { status: 404 });
        }
        
        throw error;
    }
}

/**
 * Manejar requests de datos - Network First Strategy
 */
async function handleDataRequest(request) {
    try {
        // Intentar red primero para datos frescos
        const networkResponse = await fetch(request);
        
        // Cachear respuesta exitosa
        if (networkResponse.status === 200) {
            const cache = await caches.open(DATA_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('🔄 Service Worker: Network failed, trying cache');
        
        // Si falla la red, servir desde cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Si no hay cache, retornar respuesta offline
        return new Response(JSON.stringify({
            error: 'Offline',
            message: 'No network connection and no cached data available'
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Manejar requests de navegación - Network First con Offline Fallback
 */
async function handleNavigationRequest(request) {
    try {
        // Intentar red primero
        const networkResponse = await fetch(request);
        return networkResponse;
        
    } catch (error) {
        console.log('🔄 Service Worker: Navigation failed, serving cached page');
        
        // Servir página cacheada
        const cachedResponse = await caches.match('/index.html') || 
                             await caches.match('/');
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Última opción: página offline
        return caches.match('/offline.html') || 
               new Response(getOfflineHTML(), {
                   headers: { 'Content-Type': 'text/html' }
               });
    }
}

/**
 * Manejar otros requests - Network First
 */
async function handleOtherRequest(request) {
    try {
        return await fetch(request);
    } catch (error) {
        // Intentar cache como fallback
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

/**
 * ===== BACKGROUND SYNC FUNCTIONS =====
 */

/**
 * Sincronizar tareas pendientes
 */
async function syncTasks() {
    try {
        console.log('🔄 Service Worker: Syncing tasks...');
        
        // Obtener tareas pendientes de sincronización desde IndexedDB
        const pendingTasks = await getPendingSyncTasks();
        
        for (const task of pendingTasks) {
            try {
                await fetch('/api/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(task)
                });
                
                // Eliminar de pendientes si se sincronizó exitosamente
                await removePendingSyncTask(task.id);
                
            } catch (error) {
                console.error('❌ Service Worker: Task sync failed', task.id, error);
            }
        }
        
        console.log('✅ Service Worker: Task sync complete');
        
    } catch (error) {
        console.error('❌ Service Worker: Task sync error', error);
    }
}

/**
 * Sincronizar hábitos pendientes
 */
async function syncHabits() {
    try {
        console.log('🔄 Service Worker: Syncing habits...');
        
        // Implementar sincronización de hábitos cuando esté listo el módulo
        console.log('✅ Service Worker: Habit sync complete');
        
    } catch (error) {
        console.error('❌ Service Worker: Habit sync error', error);
    }
}

/**
 * ===== NOTIFICATION FUNCTIONS =====
 */

/**
 * Mostrar notificación push
 */
async function showNotification(data) {
    const options = {
        body: data.body || 'Nueva notificación de Agenda Pro',
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/favicon-32x32.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/',
            timestamp: Date.now()
        },
        actions: [
            {
                action: 'open',
                title: 'Abrir',
                icon: '/assets/icons/icon-192x192.png'
            },
            {
                action: 'close',
                title: 'Cerrar'
            }
        ],
        requireInteraction: true,
        silent: false
    };
    
    return self.registration.showNotification(
        data.title || 'Agenda Personal Pro',
        options
    );
}

/**
 * ===== UTILITY FUNCTIONS =====
 */

/**
 * Obtener tareas pendientes de sincronización (placeholder)
 */
async function getPendingSyncTasks() {
    // TODO: Implementar con IndexedDB cuando sea necesario
    return [];
}

/**
 * Eliminar tarea pendiente de sincronización (placeholder)
 */
async function removePendingSyncTask(taskId) {
    // TODO: Implementar con IndexedDB cuando sea necesario
    return true;
}

/**
 * HTML de página offline
 */
function getOfflineHTML() {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sin Conexión - Agenda Personal Pro</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #f8fafc, #f1f5f9);
                margin: 0;
                padding: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                color: #334155;
            }
            .offline-container {
                text-align: center;
                padding: 2rem;
                max-width: 400px;
            }
            .offline-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
                opacity: 0.6;
            }
            .offline-title {
                font-size: 1.5rem;
                font-weight: 600;
                margin-bottom: 0.5rem;
            }
            .offline-message {
                color: #64748b;
                margin-bottom: 2rem;
                line-height: 1.5;
            }
            .retry-button {
                background: linear-gradient(135deg, #334155, #1e293b);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s ease;
            }
            .retry-button:hover {
                transform: translateY(-1px);
            }
            .features {
                margin-top: 2rem;
                text-align: left;
            }
            .feature {
                display: flex;
                align-items: center;
                margin-bottom: 0.5rem;
                color: #64748b;
                font-size: 0.9rem;
            }
            .feature-icon {
                margin-right: 0.5rem;
                color: #10b981;
            }
        </style>
    </head>
    <body>
        <div class="offline-container">
            <div class="offline-icon">📱</div>
            <h1 class="offline-title">Sin Conexión</h1>
            <p class="offline-message">
                No tienes conexión a internet, pero puedes seguir usando la app. 
                Tus datos se sincronizarán cuando vuelvas a conectarte.
            </p>
            
            <button class="retry-button" onclick="window.location.reload()">
                Reintentar Conexión
            </button>
            
            <div class="features">
                <div class="feature">
                    <span class="feature-icon">✅</span>
                    Ver y editar tus tareas
                </div>
                <div class="feature">
                    <span class="feature-icon">✅</span>
                    Agregar nuevas tareas
                </div>
                <div class="feature">
                    <span class="feature-icon">✅</span>
                    Usar todos los módulos
                </div>
                <div class="feature">
                    <span class="feature-icon">✅</span>
                    Datos seguros en tu dispositivo
                </div>
            </div>
        </div>
        
        <script>
            // Auto-reintentar conexión cada 30 segundos
            setInterval(() => {
                if (navigator.onLine) {
                    window.location.reload();
                }
            }, 30000);
            
            // Escuchar cuando vuelva la conexión
            window.addEventListener('online', () => {
                window.location.reload();
            });
        </script>
    </body>
    </html>
    `;
}

/**
 * ===== CACHE MANAGEMENT =====
 */

// Función para limpiar cache viejo (se puede llamar periódicamente)
async function cleanOldCaches() {
    const cacheWhitelist = [CACHE_NAME, DATA_CACHE_NAME];
    const cacheNames = await caches.keys();
    
    return Promise.all(
        cacheNames.map((cacheName) => {
            if (!cacheWhitelist.includes(cacheName)) {
                console.log('🗑️ Service Worker: Deleting cache', cacheName);
                return caches.delete(cacheName);
            }
        })
    );
}

// Función para pre-cachear recursos adicionales
async function precacheAdditionalResources() {
    const cache = await caches.open(CACHE_NAME);
    
    const additionalResources = [
        // Recursos que se cargan dinámicamente
        '/css/themes/masculine.css',
        '/css/themes/feminine.css'
    ];
    
    return cache.addAll(additionalResources.filter(Boolean));
}

/**
 * ===== MESSAGE HANDLING =====
 */

// Escuchar mensajes desde la página principal
self.addEventListener('message', (event) => {
    console.log('💬 Service Worker: Message received', event.data);
    
    if (event.data && event.data.type) {
        switch (event.data.type) {
            case 'SKIP_WAITING':
                self.skipWaiting();
                break;
                
            case 'GET_CACHE_INFO':
                getCacheInfo().then(info => {
                    event.ports[0].postMessage(info);
                });
                break;
                
            case 'CLEAN_CACHES':
                cleanOldCaches().then(() => {
                    event.ports[0].postMessage({ success: true });
                });
                break;
                
            case 'SCHEDULE_SYNC':
                if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
                    self.registration.sync.register(event.data.tag);
                }
                break;
        }
    }
});

/**
 * Obtener información de cache
 */
async function getCacheInfo() {
    const cacheNames = await caches.keys();
    const info = {
        caches: {},
        totalSize: 0
    };
    
    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        let size = 0;
        
        for (const request of requests) {
            try {
                const response = await cache.match(request);
                if (response) {
                    const blob = await response.blob();
                    size += blob.size;
                }
            } catch (error) {
                // Ignorar errores individuales
            }
        }
        
        info.caches[cacheName] = {
            requests: requests.length,
            size: size,
            sizeFormatted: formatBytes(size)
        };
        
        info.totalSize += size;
    }
    
    info.totalSizeFormatted = formatBytes(info.totalSize);
    return info;
}

/**
 * Formatear bytes
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * ===== INITIALIZATION =====
 */

console.log('🚀 Service Worker: Script loaded');

// Versión del Service Worker para debugging
self.version = CACHE_VERSION;
self.cacheName = CACHE_NAME;