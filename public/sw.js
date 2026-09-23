/**
 * Part 19 — Service Worker
 * 
 * Implements caching strategies for PWA:
 * - App shell, fonts, icons, token CSS → cache-first with versioned invalidation
 * - Reference/master data → stale-while-revalidate with 24h freshness ceiling
 * - Transactional reads → network-first with visible "cached data" banner
 * - Writes → never cached, always go through outbox
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `dx-erp-cache-${CACHE_VERSION}`;

// Resources to cache immediately on install
const PRECACHE_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Reference data endpoints (stale-while-revalidate)
const REFERENCE_DATA_PATTERNS = [
  '/api/dx/v1/masters/*',
  '/api/dx/v1/projects/*/boq',
  '/api/dx/v1/projects/*/vendors',
  '/api/dx/v1/projects/*/employees',
  '/api/dx/v1/projects/*/equipment',
];

// Transactional read endpoints (network-first)
const TRANSACTIONAL_READ_PATTERNS = [
  '/api/dx/v1/procurement/*',
  '/api/dx/v1/store/*',
  '/api/dx/v1/finance/*',
  '/api/dx/v1/billing/*',
  '/api/dx/v1/hr/*',
  '/api/dx/v1/quality/*',
  '/api/dx/v1/safety/*',
];

// Write endpoints (never cache)
const WRITE_PATTERNS = [
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
];

// ═══════════════════════════════════════════════════════════════════════════
// INSTALL EVENT
// ═══════════════════════════════════════════════════════════════════════════

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Precaching app shell');
      return cache.addAll(PRECACHE_RESOURCES);
    })
  );
  
  // Activate immediately without waiting for old service worker to be released
  self.skipWaiting();
});

// ═══════════════════════════════════════════════════════════════════════════
// ACTIVATE EVENT
// ═══════════════════════════════════════════════════════════════════════════

self.addEventListener('activate', (event) => {
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('dx-erp-cache-') && name !== CACHE_NAME)
          .map((name) => {
            console.log('[ServiceWorker] Removing old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  
  // Take control of all clients immediately
  self.clients.claim();
});

// ═══════════════════════════════════════════════════════════════════════════
// FETCH EVENT
// ═══════════════════════════════════════════════════════════════════════════

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Only handle same-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // Never cache write operations
  if (WRITE_PATTERNS.includes(request.method)) {
    return;
  }
  
  // Determine caching strategy based on URL pattern
  if (isReferenceData(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
  } else if (isTransactionalRead(url.pathname)) {
    event.respondWith(networkFirst(request));
  } else if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
  } else {
    // Default to network-first for HTML pages
    event.respondWith(networkFirst(request));
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// CACHING STRATEGIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Cache-first strategy
 * Use for: app shell, fonts, icons, static assets
 */
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[ServiceWorker] Cache-first failed:', error);
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Network-first strategy
 * Use for: transactional reads (POs, GRNs, bills, etc.)
 * Shows "cached data from HH:MM" banner if serving from cache
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Add header to indicate this is cached data
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-Cached-Data', 'true');
      headers.set('X-Cache-Time', new Date().toISOString());
      
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers,
      });
    }
    
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Stale-while-revalidate strategy
 * Use for: reference/master data (BOQ, items, vendors, etc.)
 * Returns cached data immediately, updates cache in background
 * Cache expires after 24 hours
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Start network request in background
  const networkPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      // Add timestamp to cache entry
      const headers = new Headers(networkResponse.headers);
      headers.set('X-Cache-Timestamp', Date.now().toString());
      
      const responseWithTimestamp = new Response(networkResponse.body, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers,
      });
      
      cache.put(request, responseWithTimestamp);
    }
    return networkResponse;
  }).catch((error) => {
    console.error('[ServiceWorker] Background revalidation failed:', error);
    return null;
  });
  
  // Return cached response immediately if available
  if (cachedResponse) {
    // Check if cache is stale (older than 24 hours)
    const cacheTimestamp = cachedResponse.headers.get('X-Cache-Timestamp');
    if (cacheTimestamp) {
      const age = Date.now() - parseInt(cacheTimestamp, 10);
      const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
      
      if (age > MAX_AGE) {
        console.log('[ServiceWorker] Cache stale, waiting for network');
        return networkPromise;
      }
    }
    
    return cachedResponse;
  }
  
  // No cache, wait for network
  return networkPromise;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if URL matches reference data patterns
 */
function isReferenceData(pathname) {
  return REFERENCE_DATA_PATTERNS.some((pattern) => {
    const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
    return regex.test(pathname);
  });
}

/**
 * Check if URL matches transactional read patterns
 */
function isTransactionalRead(pathname) {
  return TRANSACTIONAL_READ_PATTERNS.some((pattern) => {
    const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
    return regex.test(pathname);
  });
}

/**
 * Check if URL is a static asset
 */
function isStaticAsset(pathname) {
  return (
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.ttf') ||
    pathname.endsWith('.eot') ||
    pathname.startsWith('/icons/')
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BACKGROUND SYNC
// ═══════════════════════════════════════════════════════════════════════════

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-outbox') {
    console.log('[ServiceWorker] Background sync triggered');
    event.waitUntil(syncOutbox());
  }
});

/**
 * Trigger outbox sync when network becomes available
 */
async function syncOutbox() {
  // Notify all clients to trigger sync
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({
      type: 'SYNC_OUTBOX',
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// PUSH NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════

self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }
  
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
    actions: data.actions || [],
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const url = event.notification.data.url;
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
