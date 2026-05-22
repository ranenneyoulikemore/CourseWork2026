'use strict';

const LOG_LEVELS = { DEBUG: 0, INFO: 1, ERROR: 2 };
let globalLogLevel = LOG_LEVELS.DEBUG; 

export function setGlobalLogLevel(level) {
    globalLogLevel = LOG_LEVELS[level.toUpperCase()] ?? LOG_LEVELS.INFO;
}

export function withLogging({ level = 'INFO', format = 'text' } = {}) {
    const targetLevel = LOG_LEVELS[level.toUpperCase()];

    return function (fn) {
        return function (...args) {
            const startTime = performance.now();
            const timestamp = new Date().toISOString();

            const logOutput = (type, data) => {
                if (targetLevel < globalLogLevel) return; 
                if (level.toUpperCase() === 'ERROR' && type !== 'ERROR') return; 

                const logEntry = {
                    timestamp,
                    function: fn.name || 'anonymous',
                    level: type,
                    ...data
                };

                if (format === 'json') {
                    console[type === 'ERROR' ? 'error' : 'log'](JSON.stringify(logEntry));
                } else {
                    console[type === 'ERROR' ? 'error' : 'log'](
                        `[${logEntry.timestamp}] [${logEntry.level}] ${logEntry.function} | Час: ${logEntry.executionTimeMs}ms | ${logEntry.message}`
                    );
                }
            };

            try {
                const result = fn.apply(this, args);

                if (result instanceof Promise) {
                    return result
                        .then(res => {
                            const time = (performance.now() - startTime).toFixed(2);
                            logOutput('INFO', { message: 'Виконано успішно', args, result: res, executionTimeMs: time });
                            return res;
                        })
                        .catch(err => {
                            const time = (performance.now() - startTime).toFixed(2);
                            logOutput('ERROR', { message: 'Помилка виконання', args, error: err.message, executionTimeMs: time });
                            throw err;
                        });
                }

                const time = (performance.now() - startTime).toFixed(2);
                logOutput('INFO', { message: 'Виконано успішно', args, result, executionTimeMs: time });
                return result;

            } catch (err) {
                const time = (performance.now() - startTime).toFixed(2);
                logOutput('ERROR', { message: 'Помилка виконання', args, error: err.message, executionTimeMs: time });
                throw err;
            }
        };
    };
}