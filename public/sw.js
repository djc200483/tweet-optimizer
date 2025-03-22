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
  // Only handle S3 image requests
  if (event.request.url.includes('.s3.') && event.request.method === 'GET') {
    const timestamp = new Date().getTime();
    const urlPath = new URL(event.request.url).pathname;
    
    // Check if this is a newly generated image (contains timestamp close to now)
    const isNewlyGenerated = urlPath.includes(`/${timestamp.toString().slice(0, -3)}`);
    
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response && !isNewlyGenerated) {
            // For cached responses, check if they're expired
            const headers = new Headers(response.headers);
            const cachedTime = headers.get('cached-time');
            if (cachedTime && Date.now() - Number(cachedTime) < CACHE_EXPIRATION) {
              return response;
            }
          }
          
          // For new images or expired cache, fetch from network
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse.ok) {
              // Don't cache newly generated images immediately
              if (!isNewlyGenerated) {
                const clonedResponse = networkResponse.clone();
                const headers = new Headers(clonedResponse.headers);
                headers.append('cached-time', Date.now().toString());
                cache.put(event.request, clonedResponse);
              }
            }
            return networkResponse;
          });
        });
      })
    );
  }
}); 