'use strict';

export class AuthProxy {
    constructor() {
        this.strategy = 'none'; 
        this.credentials = {};
        this.requestCount = 0;
        this.rateLimitResetTime = Date.now();
        this.MAX_REQUESTS_PER_MINUTE = 40; 
    }

    setStrategy(strategy, credentials) {
        this.strategy = strategy;
        this.credentials = credentials;
        console.log(`[AuthProxy] Стратегію змінено на: ${strategy}`);
    }

    async fetch(url, options = {}) {
        this._logRequest(url);
        
        await this._checkRateLimit();

        let { finalUrl, finalOptions } = this._injectCredentials(url, options);
        let response = await fetch(finalUrl, finalOptions);

        if (response.status === 401 && (this.strategy === 'jwt' || this.strategy === 'oauth')) {
            console.warn('[AuthProxy] Токен прострочено (401). Спроба оновлення...');
            await this._renewToken();
            
            let retrySetup = this._injectCredentials(url, options);
            response = await fetch(retrySetup.finalUrl, retrySetup.finalOptions);
        }

        return response;
    }

    _injectCredentials(url, options) {
        const newOptions = { ...options, headers: { ...(options.headers || {}) } };
        let newUrl = new URL(url);

        if (this.strategy === 'apiKey') {
            newUrl.searchParams.append('api_key', this.credentials.apiKey);
        } else if (this.strategy === 'jwt' || this.strategy === 'oauth') {
            newOptions.headers['Authorization'] = `Bearer ${this.credentials.token}`;
        }

        return { finalUrl: newUrl.toString(), finalOptions: newOptions };
    }

    async _renewToken() {
        return new Promise(resolve => {
            setTimeout(() => {
                this.credentials.token = 'new_fresh_jwt_token_8899';
                console.log('[AuthProxy] Токен успішно оновлено!');
                resolve();
            }, 500);
        });
    }

    async _checkRateLimit() {
        const now = Date.now();
        if (now - this.rateLimitResetTime > 60000) { 
            this.requestCount = 0;
            this.rateLimitResetTime = now;
        }

        if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
            console.warn('[AuthProxy] Перевищено ліміт запитів! Очікування...');
            const waitTime = 60000 - (now - this.rateLimitResetTime);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            
            this.requestCount = 0;
            this.rateLimitResetTime = Date.now();
        }
        this.requestCount++;
    }

    _logRequest(url) {
        console.log(`[API Monitor] Fetch: ${url} | Стратегія: ${this.strategy}`);
    }
}

export const apiProxy = new AuthProxy();