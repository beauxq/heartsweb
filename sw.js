// this sw.js from https://itnext.io/pwa-from-scratch-guide-yet-another-one-bdfa438b50aa

const CACHE_NAME = "HeartsV0.1"

/**
 * The install event is fired when the registration succeeds.
 * After the install step, the browser tries to activate the service worker.
 * Generally, we cache static resources that allow the website to run offline
 */
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

/**
 * The fetch event is fired every time the browser sends a request. 
 * In this case, the service worker acts as a proxy. We can for example return the cached
 * version of the resource matching the request, or send the request to the internet.
 * We can even make our own response from scratch !
 * Here, we are going to use cache first strategy
 */
self.addEventListener('fetch', event => {
    // We define the promise (the async code block) that return
    // either the cached response or the network one
    // It should return a response object.
    async function getCustomResponsePromise() {
        console.log(`URL ${event.request.url}`, `location origin ${location}`)

        try {
            // Try to get the cached response
            const cachedResponse = await caches.match(event.request)
            if (cachedResponse) {
                // Return the cached response if present
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
            // get the network response
            const netResponse = await fetch(event.request)

            console.log(`adding net response to cache`)
            // open the cache to put the network response in
            let cache = await caches.open(CACHE_NAME)
            // We must provide a clone of the response here
            cache.put(event.request, netResponse.clone())

            return netResponse
        }
        catch (err) {
            console.error(`Error ${err}`)
            throw err
        }
    }

    // In order to override the default fetch behavior,
    // we must provide the result of our custom behavior to the
    // event.respondWith method
    event.respondWith(getCustomResponsePromise())
});
