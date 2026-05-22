'use strict';

export const formatters = {
    default: (level, name, args, result, error, time) => {
        const timestamp = new Date().toISOString();
        if (error) {
            return `[${timestamp}] [${level}] ${name}(${JSON.stringify(args)}) - ERROR: ${error.message} (${time.toFixed(2)}ms)`;
        }
        return `[${timestamp}] [${level}] ${name}(${JSON.stringify(args)}) - Result: ${JSON.stringify(result)} (${time.toFixed(2)}ms)`;
    },
    json: (level, name, args, result, error, time) => {
        return JSON.stringify({
            timestamp: new Date().toISOString(),
            level,
            function: name,
            arguments: args,
            result: result || null,
            error: error ? error.message : null,
            executionTimeMs: Number(time.toFixed(2))
        });
    }
};

export function log({ level = 'INFO', formatter = formatters.default, output = console.log } = {}) {
    return function (fn) {
        return function (...args) {
            const start = performance.now();
            const fnName = fn.name || 'anonymous';

            const handleLog = (result, error) => {
                const time = performance.now() - start;

                if (level === 'ERROR' && !error) return;

                const logMessage = formatter(level, fnName, args, result, error, time);
                
                if (error && output === console.log) {
                    console.error(logMessage);
                } else {
                    output(logMessage);
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