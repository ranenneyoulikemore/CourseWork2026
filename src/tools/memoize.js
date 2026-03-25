"use strict";

function memoize(fn, options) {
    const cache = new Map();
    const size = options.size || 10;
    const policy = options.policy || 'lru';

    return function(...args) {
        const key = JSON.stringify(args);
        
        if (cache.has(key)) {
            const result = cache.get(key);
            
            if (policy === 'lru') {
                cache.delete(key);
                cache.set(key, result);
            }
            return result;
        }
    };
}