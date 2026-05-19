'use strict';

export function log() {
    return function (fn) {
        return function (...args) {
            const fnName = fn.name || 'anonymous';
            console.log(`[LOG] Виклик ${fnName} з аргументами:`, args);

            try {
                const result = fn.apply(this, args);
                
                if (result instanceof Promise) {
                    return result
                        .then(res => {
                            console.log(`[LOG] Результат ${fnName}:`, res);
                            return res;
                        })
                        .catch(err => {
                            console.error(`[LOG] Помилка в ${fnName}:`, err);
                            throw err;
                        });
                }
                
                console.log(`[LOG] Результат ${fnName}:`, result);
                return result;
            } catch (error) {
                console.error(`[LOG] Помилка в ${fnName}:`, error);
                throw error;
            }
        };
    };
}