export class SuperFetch {

    #token
    #root
    #logRequests
    #controllers

    constructor(root, token, options) {

        this.#token = token
        this.#root = root
        this.#controllers = new Map()

        this.#logRequests = options?.logRequests ?? false
    }

    async #wrapper(method, path, data, {timeout} = {}) {

        const url = `${this.#root}${path}`
        this.abortRequest(path)

        const controller = this.createController(path);
        const startTime = performance.now()

        let timeoutId
        if (timeout) timeoutId = setTimeout(() => this.abortRequest(path), timeout)

        const headers = {
            'Content-Type': 'application/json',
            ...(this.#token && { Authorization: `Bearer ${this.#token}` }),
        }

        const options = {
            method,
            headers,
            body: data ? JSON.stringify(data) : undefined,
            signal: controller.signal,
        }

        try {

            const result = await fetch(url, options);
            const duration = performance.now() - startTime;
            
            clearTimeout(timeoutId)

            this.logRequest(method, path, result.status, duration);

            if (!result.ok) {
                const errorData = await result.json();
                throw new Error(`Error ${result.status}: ${errorData.message || result.statusText}`);
            }

            return result.json();

        } catch (error) {

            if (error.name === 'AbortError') console.warn(`Request to ${url} was aborted.`);
            else console.error(`Error in ${method} ${url}:`, error.message);

            clearTimeout(timeoutId)

            this.logRequest(method, path, 'ERROR', duration);

            return { result: 'nok', message: error.message };
        }

    }

    get root() {
        return this.#root
    }

    get token() {
        return this.#token
    }

    set token(token) {
        this.#token = token
    }

    async get(path) {
        return this.#wrapper('GET', path)
    }

    async post(path, data) {
        return this.#wrapper('POST', path, data)
    }

    async put(path, data) {
        return this.#wrapper('PUT', path, data)
    }

    async delete(path) {
        return this.#wrapper('DELETE', path)
    }

    async fake(data, ms) {

        const error = false
        return new Promise((resolve) => setTimeout(resolve, ms ?? 1000)).then(() => ({
            result: error ? 'nok' : 'ok',
            message: error ? 'error' : 'success',
            data,
        }))
    }

    logRequest(method, path, status, duration) {

        if (!this.#logRequests) return
        console.log(`[${new Date().toISOString()}] ${method} ${path} - Status: ${status} - Duration: ${duration}ms`);
    }

    buildQuery(params = {}, parentKey = '') {

        return Object.entries(params).map(([key, value]) => {

            const fullKey = parentKey ? `${parentKey}[${key}]` : key;
            if (typeof value === 'object' && value !== null) return this.buildQuery(value, fullKey);
            return `${encodeURIComponent(fullKey)}=${encodeURIComponent(value)}`;
            
        }).join('&');
    }

    createController(path) {

        const controller = new AbortController();
        this.#controllers.set(path, controller);
        return controller;
    }

    abortRequest(path) {

        const controller = this.#controllers.get(path);
        if (controller) {
            controller.abort();
            this.#controllers.delete(path);
        }
    }
    
}
