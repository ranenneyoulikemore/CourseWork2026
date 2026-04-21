'use strict'

export function asyncFindCallback(array, asyncPredicate, finalCallback) {
    let index = 0;

    function next() {
        if (index >= array.length) {
            return finalCallback(null, undefined);
        }

        const item = array[index++];
        
        asyncPredicate(item, (error, isMatch) => {
            if (error) return finalCallback(error);
            if (isMatch) return finalCallback(null, item);
            next();
        });
    }

    next();
}

export async function asyncFindPromise(array, asyncPredicatePromise, options = {}) {
    const { signal } = options;

    for (let i = 0; i < array.length; i++) {
        if (signal?.aborted) {
            throw new DOMException("Aborted", "AbortError");
        }

        const isMatch = await asyncPredicatePromise(array[i]);
        
        if (isMatch) {
            return array[i];
        }
    }
    return undefined;
}