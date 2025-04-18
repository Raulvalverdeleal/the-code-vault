/**
 * A utility class to manage intervals more safely, preventing duplicate intervals using unique tokens.
 * @class
 * @author Raul Valverde Leal
 * @example
 * const api = new SuperFetch('http://localhost:3000', {timeout: 5000});
 */
export class SuperFetch {

    #token;
    #root;
    #logRequests;
    #defaultTimeout;
    #defaultRetries;
    #controllers;

    /**
     * @typedef {Object} SuperFetchOptions
     * @property {string|null} [token] - Optional authorization token to be included in the Authorization header.
     * @property {boolean} [logRequests=false] - If true, all requests will be logged.
     * @property {number} [timeout=0] - Default timeout in milliseconds for all requests; 0 disables timeout.
     * @property {number} [retries=0] - Default number of retry attempts for failed requests.
     */

    /**
     * @typedef {Object} RequestOptions 
     * @property {string|null} [token] - Optional authorization token to be included in the Authorization header.
     * @property {number} [timeout] - Timeout in milliseconds for this request; overrides default timeout.
     * @property {boolean} [log] - If true, forces logging for this request regardless of global "logRequests" setting.
     * @property {number} [retries] - Number of retry attempts for this request; overrides default retries.
     * @property {Object<string,string>} [headers] - Additional HTTP headers to include (e.g., Content-Type, Accept).
     */

    /**
     * Creates an instance of SuperFetch.
     * @param {string} root - The base URL for all HTTP requests (e.g., https://api.example.com).
     * @param {SuperFetchOptions} options - Global options
     */
    constructor(root, options = {}) {

        if (!root || typeof root !== 'string' || !/^https?:\/\//.test(root)) {
            throw new Error("Invalid 'root' URL provided.");
        }

        this.#root = root;
        this.#token = options.token || null;
        this.#logRequests = options.logRequests || false;
        this.#defaultTimeout = options.timeout || 0;
        this.#defaultRetries = options.retries || 0;
        this.#controllers = new Map();
    }

    /**
     * Performs an HTTP request with support for timeout, abort, retry, and custom headers.
     * @private
     * @param {string} method - HTTP method (GET, POST, PUT, DELETE).
     * @param {string} path - Endpoint path appended to the base URL.
     * @param {Object|string|null} [data=null] - Request payload for non-GET methods. If string, sent as-is; otherwise JSON-stringified.
     * @param {RequestOptions} [opts={}] - Per-request options overriding defaults.
     * @returns {Promise<any>} Resolves with parsed JSON response on 2xx; rejects with Error on failure.
     * @throws {Error} Throws if the request is aborted, times out, or exhausts all retries without success.
     */
    async #request(method, path, data = null, opts = {}) {

        const url = this.#buildUrl(path, method === 'GET' ? data : null);
        const controller = this.#createAbortController(`${method}::${url}`)
        
        const timeoutMs = opts.timeout ?? this.#defaultTimeout;
        const attempts = 1 + (opts.retries ?? this.#defaultRetries);
        
        for (let attempt = 0; attempt < attempts; attempt++) {
            
            let timeoutId;
            const startTime = performance.now()
            
            try {
                
                if (timeoutMs > 0) timeoutId = setTimeout(() => controller.abort(), timeoutMs);
                
                const headers = {
                    ...(this.#token ? { Authorization: `Bearer ${this.#token}` } : {}),
                    ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
                    ...(opts.headers || {}),
                };
                
                let body;
                let contentType;
                
                if (data instanceof FormData) {
                    contentType = 'multipart/form-data';
                    body = data;
                } else if (data instanceof Blob) {
                    contentType = data.type || 'application/octet-stream';
                    body = data;
                } else if (data && typeof data === 'object') {
                    contentType = 'application/json';
                    body = JSON.stringify(data);
                } else if (typeof data === 'string') {
                    contentType = 'text/plain';
                    body = data;
                }
                
                const requestHeaders = {
                    'Content-Type': contentType,
                    ...headers,
                };
                
                const response = await fetch(url, { method, headers: requestHeaders, body, signal: controller.signal });
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    const errorDetails = {
                        status: response.status,
                        statusText: response.statusText,
                        headers: Object.fromEntries(response.headers.entries()),
                        body: await response.text(),
                    };
                    throw new Error(`Request failed: ${JSON.stringify(errorDetails)}`);
                }
                
                let responseData;
                if (response.headers.get('Content-Type')?.includes('application/json')) {
                    responseData = await response.json();
                } else if (response.headers.get('Content-Type')?.includes('text/plain')) {
                    responseData = await response.text();
                } else if (response.headers.get('Content-Type')?.includes('application/octet-stream')) {
                    responseData = await response.blob();
                } else {
                    responseData = await response.arrayBuffer(); // Fallback para otros binarios.
                }
                
                this.#log(method, path, response.status, attempt, opts.log, startTime);

                return responseData;

            } catch (err) {
                clearTimeout(timeoutId);

                if (err.name === 'AbortError') {
                    this.#log(method, path, 'ABORT', attempt, opts.log, startTime);
                    return { result: 'nok', message: err.message }
                }

                if (attempt < attempts - 1) {
                    this.#log(method, path, 'RETRY', attempt, opts.log, startTime);
                    continue;
                }

                this.#log(method, path, 'ERROR', attempt, opts.log, startTime);
                return { result: 'nok', message: err.message }
            }
        }

    }

    /**
     * Performs a GET request and returns parsed JSON.
     * @param {string} path - Endpoint path or full URL if absolute.
     * @param {Object} [params] - Query parameters to serialize into the URL.
     * @param {RequestOptions} [opts] - Per-request options (timeout, log, retries, headers).
     * @returns {Promise<any>} Parsed JSON response.
     */
    get(path, params, opts) {
        return this.#request('GET', path, params, opts);
    }

    /**
     * Performs a POST request with JSON or custom payload.
     * @param {string} path - Endpoint path or full URL if absolute.
     * @param {Object|string} data - Payload to send. Use string for pre-encoded bodies.
     * @param {RequestOptions} [opts] - Per-request options (timeout, log, retries, headers).
     * @returns {Promise<any>} Parsed JSON response.
     */
    post(path, data, opts) {
        return this.#request('POST', path, data, opts);
    }

    /**
     * Performs a PUT request with JSON or custom payload.
     * @param {string} path - Endpoint path or full URL if absolute.
     * @param {Object|string} data - Payload to send. Use string for pre-encoded bodies.
     * @param {RequestOptions} [opts] - Per-request options (timeout, log, retries, headers).
     * @returns {Promise<any>} Parsed JSON response.
     */
    put(path, data, opts) {
        return this.#request('PUT', path, data, opts);
    }

    /**
     * Performs a PATCH request with JSON or custom payload.
     * @param {string} path - Endpoint path or full URL if absolute.
     * @param {Object|string} data - Payload to send. Use string for pre-encoded bodies.
     * @param {RequestOptions} [opts] - Per-request options (timeout, log, retries, headers).
     * @returns {Promise<any>} Parsed JSON response.
     */
    patch(path, data, opts) {
        return this.#request('PATCH', path, data, opts);
    }

    /**
     * Performs a DELETE request.
     * @param {string} path - Endpoint path or full URL if absolute.
     * @param {RequestOptions} [opts] - Per-request options (timeout, log, retries, headers).
     * @returns {Promise<any>} Parsed JSON response.
     */
    delete(path, opts) {
        return this.#request('DELETE', path, null, opts);
    }

    /**
     * Constructs full URL including serialized query parameters.
     * @private
     * @param {string} path - Endpoint path or full URL if absolute.
     * @param {Object} [params] - Key/value pairs for query string.
     * @returns {string} Fully qualified URL with encoded parameters.
     */
    #buildUrl(path, params) {
        const url = new URL(path, this.#root);
        if (params && typeof params === 'object') {
            Object.entries(params).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    value.forEach(val => url.searchParams.append(key, val));
                } else {
                    url.searchParams.append(key, value);
                }
            });
        }
        return url.toString();
    }

    /**
     * Aborts any ongoing request associated with the given key and cleans up the controller.
     * @private
     * @param {string} key - Request identifier combining method and path.
     */
    #abort(key) {
        const ctrl = this.#controllers.get(key);
        if (ctrl) {
            ctrl.abort();
            this.#controllers.delete(key);
        }
    }

    /**
     * Creates an abort controller
     * @private
     * @param {string} key - Request identifier combining method and path.
     * @returns {AbortController}
     */
    #createAbortController(key) {
        this.#abort(key);
        const controller = new AbortController()
        this.#controllers.set(key, controller);
        return controller
    }

    abortAll() {
        this.#controllers.forEach(controller => controller.abort());
        this.#controllers.clear();
    }

    /**
     * Logs request details to console when enabled.
     * @private
     * @param {string} method - HTTP method used.
     * @param {string} path - Request path.
     * @param {number|string} status - HTTP status code or custom status string.
     * @param {number} attempt - Current attempt number for retries.
     * @param {boolean} [forceLog] - If true, forces logging regardless of global setting.
     */
    #log(method, path, status, attempt, forceLog, startTime) {
        if (!this.#logRequests && !forceLog) return;
        console.log(`${method} ${path} | Status: ${status} | Attempt: ${attempt + 1} | Duration: ${Math.round(performance.now() - startTime)}ms`);
    }

    /**
     * Sets the authorization token used in subsequent requests.
     * @param {string|null} value - Bearer token string or null to clear.
     */
    set token(value) {
        this.#token = value;
    }

    /**
     * Retrieves the current authorization token.
     * @type {string|null}
     */
    get token() {
        return this.#token;
    }

    /**
     * Retrieves the base URL for requests.
     * @type {string}
     */
    get root() {
        return this.#root;
    }
}