const CACHE_NAME = 'explore-images-cache-v1';
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Only cache S3 image requests
  if (event.request.url.includes('.s3.') && event.request.method === 'GET') {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response) {
            // Check if cache is expired
            const headers = new Headers(response.headers);
            const cachedTime = headers.get('cached-time');
            if (cachedTime && Date.now() - Number(cachedTime) < CACHE_EXPIRATION) {
              return response;
            }
          }
          
          return fetch(event.request).then((networkResponse) => {
            const clonedResponse = networkResponse.clone();
            // Add cache time header
            const headers = new Headers(clonedResponse.headers);
            headers.append('cached-time', Date.now().toString());
            
            const cachedResponse = new Response(clonedResponse.body, {
              status: clonedResponse.status,
              statusText: clonedResponse.statusText,
              headers: headers
            });
            
            cache.put(event.request, cachedResponse);
            return networkResponse;
          });
        });
      })
    );
  }
}); 