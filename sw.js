// SW Version
const version = '1.0';

// Static Cache - App Shell
const appAssets = [
    'index.html',
    'main.js',
    'images/flame.png',
    'images/logo.png',
    'images/sync.png',
    'vendor/bootstrap.min.css',
    'vendor/jquery.min.js'
]

// SW Install
self.addEventListener( 'install', e => {
    e.waitUntil(
        caches.open( `static-${version}` )
            .then( cache => cache.addAll(appAssets) )
    );
});

// SW Activate
self.addEventListener( 'activate', e => {

    // Clean static cache
    let cleaned = caches.keys().then( keys => {
        keys.forEach( key => {
            if ( key !== `static-${version}` && key.match('static-')) {
                return caches.delete(key);
            }
        });
    });
    e.waitUntil(cleaned);

});

// Static cache strategy - Cache with Network Fallback
const staticCache = (req, cacheName = `static-${version}`) => {

    return caches.match(req).then( cachedRes => {

        // Return cached response if found
        if (cachedRes) return cachedRes;

        // Fall back to network
        return fetch(req).then( networkRes => {

            // Update cache with new response
            caches.open(cacheName)
                .then( cache => cache.put( req, networkRes));

            // Return Clone of Network Response
            return networkRes.clone();
        });
    });
};

// Network with Cache Fallback
const fallbackCache = (req) => {

    // Try network
    return fetch(req).then( networkRes => {

        // Check res is Ok, else go to cache
        if (!networkRes.ok) throw 'Fetch Error';

        // Update Cache
        caches.open(`static-${version}`)
            .then( cache => cache.put(req, networkRes));

        //Return Clone of Network Response
        return networkRes.clone();
    })

    // Try Cache
    .catch( err => caches.match(req));
};

// Clean Old Giphys from the 'giphy' Cache
const cleanGiphyCache = (giphys) => {

    caches.open('giphy').then( cache => {

        // Get All Cache Entries
        cache.keys().then( keys => {

            // Loop Entries (Requests)
            keys.forEach( key => {

                // If Entry Is NOT Part of Current Giphys, Delete
                if (!giphys.includes(key.url)) cache.delete(key);
            });
        });
    });
};

// SW Fetch
self.addEventListener('fetch', e => {

    // App Shell
    if (e.request.url.match(location.origin)) {
        e.respondWith( staticCache(e.request));
    
    // Giphy API
    } else if (e.request.url.match('api.giphy.com/v1/gifs/trending')) {
        e.respondWith(fallbackCache(e.request));

    // Giphy Media
    } else if (e.request.url.match('giphy.com/media')) {
        e.respondWith( staticCache(e.request, 'giphy'))
    }
});

// Listen for Message from Client
self.addEventListener('message', e => {

    // Identify the Message
    if (e.data.action === 'cleanGiphyCache') cleanGiphyCache(e.data.giphys);
});

