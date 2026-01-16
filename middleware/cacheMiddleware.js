const setCache = (duration = 60) => (req, res, next) => {
    // Skip caching for non-GET requests or if user is authenticated (to serve personalized content)
    // Checking req.user might depend on where this middleware is placed relative to auth middleware
    if (req.method !== 'GET') {
        return next();
    }

    // Set Cache-Control header
    // public: response can be cached by anyone (browser, CDN)
    // max-age: how long to cache in seconds
    res.set('Cache-Control', `public, max-age=${duration}`);
    next();
};

export default setCache;
