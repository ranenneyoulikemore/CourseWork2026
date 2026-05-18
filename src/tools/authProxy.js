'use strict';

export class AuthProxy {
    constructor() {
        this.strategy = 'none'; 
        this.credentials = {};
    }

    setStrategy(strategy, credentials) {
        this.strategy = strategy;
        this.credentials = credentials;
        console.log(`[AuthProxy] Стратегію змінено на: ${strategy}`);
    }

    async fetch(url, options = {}) {
        this._logRequest(url);

        let { finalUrl, finalOptions } = this._injectCredentials(url, options);
        let response = await fetch(finalUrl, finalOptions);

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

    _logRequest(url) {
        console.log(`[API Monitor] Fetch: ${url} | Стратегія: ${this.strategy}`);
    }
}

export const apiProxy = new AuthProxy();