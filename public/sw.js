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
  // Only cache S3 image requests from the explore tab
  if (event.request.url.includes('.s3.') && 
      event.request.method === 'GET' && 
      event.request.referrer.includes('/explore')) {
    
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
          
          // If no cache or expired, fetch from network
          return fetch(event.request).then((networkResponse) => {
            // Only cache successful responses
            if (networkResponse.ok) {
              const clonedResponse = networkResponse.clone();
              const headers = new Headers(clonedResponse.headers);
              headers.append('cached-time', Date.now().toString());
              
              cache.put(event.request, clonedResponse);
            }
            return networkResponse;
          });
        });
      })
    );
  }
}); 