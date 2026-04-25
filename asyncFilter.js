'use strict';

export function asyncFilterCallback(array, asyncPredicate, finalCallback) {
    if (array.length === 0) return finalCallback(null, []);

    const results = [];
    let completed = 0;
    let hasError = false;

    array.forEach((item, index) => {
        asyncPredicate(item, (err, isMatch) => {
            if (hasError) return;

            if (err) {
                hasError = true;
                return finalCallback(err, null);
            }

            if (isMatch) results.push({ item, index });

            completed++;
            if (completed === array.length) {
                results.sort((a, b) => a.index - b.index);
                finalCallback(null, results.map(r => r.item));
            }
        });
    });
}

export async function asyncFilterPromise(array, asyncPredicate) {
    return new Promise((resolve, reject) => {
        Promise.all(array.map(item => asyncPredicate(item)))
            .then(booleans => {
                const filtered = array.filter((_, i) => booleans[i]);
                resolve(filtered);
            })
            .catch(error => reject(error));
    });
}