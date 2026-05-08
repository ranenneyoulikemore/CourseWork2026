'use strict'
export function createMemoizer(fn, options = {}) {
    const cache = new Map(); 
    const accessCount = new Map(); 

    const { maxSize = Infinity, strategy = 'LRU' } = options; 

    return function(...args) {
        const key = JSON.stringify(args); 

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

            if (strategy === 'LRU') {
                keyToRemove = cache.keys().next().value; 
            } else if (strategy === 'LFU') {
                let minAccess = Infinity;
                for (const [k, count] of accessCount.entries()) {
                    if (count < minAccess) {
                        minAccess = count;
                        keyToRemove = k;
                    }
                }
            }

            if (keyToRemove) {
                cache.delete(keyToRemove);
                accessCount.delete(keyToRemove);
            }
        }

        cache.set(key, result); 
        if (strategy === 'LFU') accessCount.set(key, 1); 

        return result; 
    };
}