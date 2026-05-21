'use strict';

export function log({ level = 'INFO' } = {}) {
    return function (fn) {
        return function (...args) {
            const start = performance.now();
            const fnName = fn.name || 'anonymous';

            const handleLog = (result, error) => {
                const time = performance.now() - start;
                const timestamp = new Date().toISOString();

                if (level === 'ERROR' && !error) return;

                if (error) {
                    console.error(`[${timestamp}] [${level}] ${fnName}(${JSON.stringify(args)}) - ERROR: ${error.message} (${time.toFixed(2)}ms)`);
                } else {
                    console.log(`[${timestamp}] [${level}] ${fnName}(${JSON.stringify(args)}) - Result: ${JSON.stringify(result)} (${time.toFixed(2)}ms)`);
                }
            };

            try {
                const result = fn.apply(this, args);
                if (result instanceof Promise) {
                    return result
                        .then(res => { handleLog(res, null); return res; })
                        .catch(err => { handleLog(null, err); throw err; });
                }
                handleLog(result, null);
                return result;
            } catch (error) {
                handleLog(null, error);
                throw error;
            }
        };
    };
}