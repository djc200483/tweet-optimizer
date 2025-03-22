const CACHE_NAME = 'explore-images-cache-v1';
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

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

// Helper function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to fetch with retries
const fetchWithRetry = async (request, retries = MAX_RETRIES) => {
  try {
    const response = await fetch(request);
    if (!response || !response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      await delay(RETRY_DELAY);
      return fetchWithRetry(request, retries - 1);
    }
    throw error;
  }
};

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
          
          // Use fetchWithRetry instead of regular fetch
          return fetchWithRetry(event.request)
            .then((networkResponse) => {
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
            })
            .catch(error => {
              console.error('Fetch failed after retries:', error);
              // If we have a cached response, return it
              if (response) {
                return response;
              }
              // Otherwise, return a fallback response
              return new Response(
                'Image not available yet',
                {
                  status: 503,
                  statusText: 'Service Unavailable - Image still processing'
                }
              );
            });
        });
      })
    );
  }
}); 