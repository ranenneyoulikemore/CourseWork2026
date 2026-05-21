'use strict';

export class TMDBAuthStrategy {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }
    modifyRequest(url, options) {
        const urlObj = new URL(url);
        urlObj.searchParams.set('api_key', this.apiKey);
        urlObj.searchParams.set('language', 'uk-UA');
        return { url: urlObj.toString(), options };
    }
}

export class JwtAuthStrategy {
    constructor(token) {
        this.token = token;
    }
    modifyRequest(url, options) {
        const headers = options.headers || {};
        headers['Authorization'] = `Bearer ${this.token}`;
        return { url, options: { ...options, headers } };
    }
}