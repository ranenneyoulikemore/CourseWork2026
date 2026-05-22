'use strict';

const LOG_LEVELS = { DEBUG: 0, INFO: 1, ERROR: 2 };
let globalLogLevel = LOG_LEVELS.DEBUG; 

export function setGlobalLogLevel(level) {
    globalLogLevel = LOG_LEVELS[level.toUpperCase()] ?? LOG_LEVELS.INFO;
}

export function withLogging({ level = 'INFO' } = {}) {
    const targetLevel = LOG_LEVELS[level.toUpperCase()];

    return function (fn) {
        return function (...args) {
            const startTime = performance.now();
            const timestamp = new Date().toISOString();

            const logOutput = (type, message) => {
                if (targetLevel < globalLogLevel) return; 
                if (level.toUpperCase() === 'ERROR' && type !== 'ERROR') return; 

                const time = (performance.now() - startTime).toFixed(2);
                console[type === 'ERROR' ? 'error' : 'log'](
                    `[${timestamp}] [${type}] ${fn.name || 'anonymous'} | Час: ${time}ms | ${message}`
                );
            };

            try {
                const result = fn.apply(this, args);
                logOutput('INFO', 'Виконано успішно');
                return result;
            } catch (err) {
                logOutput('ERROR', `Помилка виконання: ${err.message}`);
                throw err;
            }
        };
    };
}