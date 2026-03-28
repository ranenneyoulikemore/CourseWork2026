"use strict";

function memoize(fn, config = {}) {
    const cache = new Map();
    
    let limit = config.size; 
    if (limit === undefined) {
        limit = Infinity;
    }

    const type = config.policy || 'lru';
    const timeLimit = config.expiry || 0;

    return function(...args) {
        const key = JSON.stringify(args);
        const now = Date.now(); 

        if (cache.has(key)) {
            const cachedData = cache.get(key);

            if (timeLimit > 0) {
                if (now - cachedData.time > timeLimit) {
                    cache.delete(key);
                } else {
                    cachedData.count = cachedData.count + 1;
                    if (type === 'lru') {
                        cache.delete(key);
                        cache.set(key, cachedData);
                    }
                    return cachedData.result;
                }
            } else {
                cachedData.count += 1;
                if (type === 'lru') {
                    cache.delete(key);
                    cache.set(key, cachedData);
                }
                return cachedData.result;
            }
        }

        const result = fn(...args);

        if (cache.size >= limit) {
            let keyToDelete = null;

            if (type === 'lfu') {
                let min = Infinity;
                for (const [k, val] of cache.entries()) {
                    if (val.count < min) {
                        min = val.count;
                        keyToDelete = k;
                    }
                }
            } else if (type === 'custom' && typeof config.customPolicy === 'function') {
                keyToDelete = config.customPolicy(cache);
            } else {
                const firstKey = cache.keys().next().value;
                keyToDelete = firstKey;
            }

            if (keyToDelete !== null) {
                cache.delete(keyToDelete);
            }
        }
        
        cache.set(key, {
            result: result,
            count: 1,
            time: now
        });

        return result;
    };
}