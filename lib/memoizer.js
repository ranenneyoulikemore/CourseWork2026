'use strict'
export function createMemoizer(fn) {
    const cache = new Map();

    return function(...args) {
        const key = JSON.stringify(args);

        
        if (cache.has(key)) {
            console.log("Взято з кешу!");
            return cache.get(key);
        }

        
        const result = fn(...args);
        cache.set(key, result);
        
        return result;
    };
}