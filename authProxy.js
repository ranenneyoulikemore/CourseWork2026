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

export class ApiAuthProxy {
    constructor(strategy) {
        this.strategy = strategy;
        this.nextAllowedTime = Date.now(); 
    }

    setStrategy(newStrategy) {
        this.strategy = newStrategy;
        console.log("🔄 [PROXY]: Стратегію авторизації змінено.");
    }

    async fetch(url, options = {}) {
        const now = Date.now();
        if (now < this.nextAllowedTime) {
            const delay = this.nextAllowedTime - now;
            this.nextAllowedTime += 200; 
            console.warn(`⏳ [PROXY RATE LIMIT]: Запит пригальмовано на ${delay}мс`);
            await new Promise(resolve => setTimeout(resolve, delay));
        } else {
            this.nextAllowedTime = now + 200;
        }

        const { url: authUrl, options: authOptions } = this.strategy.modifyRequest(url, options);
        console.log(`🚀 [PROXY REQ]: Перехоплено запит до: ${authUrl}`);

        try {
            const response = await fetch(authUrl, authOptions);
            
            if (response.status === 401) {
                console.error("🚨 [PROXY AUTH ERROR]: Недійсний ключ або прострочений токен (401).");
                throw new Error("Помилка авторизації. Відмовлено в доступі.");
            }

            console.log(`✅ [PROXY RES]: Успіх. Статус: ${response.status}`);
            return response;
        } catch (error) {
            console.error(`❌ [PROXY ERROR]: Мережева помилка - ${error.message}`);
            throw error;
        }
    }
}