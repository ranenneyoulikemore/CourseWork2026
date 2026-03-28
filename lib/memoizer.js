'use strict'
export function createMemoizer(fn, options = {}) {
    const cache = new Map();
    const accessCount = new Map(); 
    const timestamps = new Map();  

    const { maxSize = Infinity, strategy = 'LRU', ttl = 60000, customEvict = null } = options;

    return function(...args) {
        const key = JSON.stringify(args);
        const now = Date.now();

        
        if (strategy === 'TIME' && timestamps.has(key) && (now - timestamps.get(key) > ttl)) {
            cache.delete(key);
            timestamps.delete(key);
            accessCount.delete(key);
        }

        if (cache.has(key)) {
            if (strategy === 'LRU') {
                const value = cache.get(key);
                cache.delete(key);
                cache.set(key, value);
            } else if (strategy === 'LFU') {
                accessCount.set(key, accessCount.get(key) + 1);
            }
            return cache.get(key);
        }

        const result = fn(...args);

        if (cache.size >= maxSize && maxSize > 0) {
            let keyToRemove = null;

            if (strategy === 'LRU' || strategy === 'TIME') {
                keyToRemove = cache.keys().next().value;
            } else if (strategy === 'LFU') {
                let minAccess = Infinity;
                for (const [k, count] of accessCount.entries()) {
                    if (count < minAccess) { minAccess = count; keyToRemove = k; }
                }
            } else if (strategy === 'CUSTOM' && customEvict) {
                
                keyToRemove = customEvict(cache, accessCount, timestamps);
            }

            if (keyToRemove) {
                cache.delete(keyToRemove);
                accessCount.delete(keyToRemove);
                timestamps.delete(keyToRemove);
            }
        }

        cache.set(key, result);
        if (strategy === 'LFU') accessCount.set(key, 1);
        if (strategy === 'TIME') timestamps.set(key, now);

        return result;
    };
}