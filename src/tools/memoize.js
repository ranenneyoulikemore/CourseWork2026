"use strict";

function memoize(fn, config = {}) {
    const cache = new Map();
    
    let limit = config.size; 
    if (limit === undefined) {
        limit = Infinity;
    }

    const type = config.policy || 'lru';

    return function(...args) {
        const key = JSON.stringify(args);

        if (cache.has(key)) {
            const cachedData = cache.get(key);

            cachedData.count += 1;
            if (type === 'lru') {
                cache.delete(key);
                cache.set(key, cachedData);
            }
            return cachedData.result;
        }

        const result = fn(...args);

        if (cache.size >= limit) {
            let keyToDelete = null;

            const firstKey = cache.keys().next().value;
            keyToDelete = firstKey;

            if (keyToDelete !== null) {
                cache.delete(keyToDelete);
            }
        }
        
        cache.set(key, {
            result: result,
            count: 1
        });

        return result;
    };
}