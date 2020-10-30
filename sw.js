const CACHE_NAME = "HeartsV0.1"

this.addEventListener('install', async function() {
    const cache = await caches.open(CACHE_NAME);
    cache.addAll([
        '',
        '/',
        '/index.html',
        '/workerbundle.js',
        '/bundle.js',
        '/cards.png'
    ])
});

self.addEventListener('fetch', event => {
    async function getCustomResponsePromise() {
        console.log(`URL ${event.request.url}`, `location origin ${location}`)

        try {
            const cachedResponse = await caches.match(event.request)
            if (cachedResponse) {
                console.log(`Cached response ${cachedResponse}`)

                // I'll use that cached response, but also update the cache with the network
                fetch(event.request).then((netResponse) => {
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, netResponse.clone());
                    });
                });

                return cachedResponse
            }
            // else no cache
            const netResponse = await fetch(event.request)

            console.log(`adding net response to cache`)
            let cache = await caches.open(CACHE_NAME)
            cache.put(event.request, netResponse.clone())

            return netResponse
        }
        catch (err) {
            console.error(`Error ${err}`)
            throw err
        }
    }

    event.respondWith(getCustomResponsePromise())
});
