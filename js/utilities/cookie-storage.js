/**
 * CookieStorage: A utility class for managing browser cookies.
 * 
 * This class provides methods to set, get, delete, and check the existence of cookies.
 * It also supports default options for cookie configurations and verifies cookie support in the browser.
 * @class
 * @author Raul Valverde Leal
 * @example
 * const storage = new CookieStorage({sameSite: 'Strict'});
 * storage.setCookie('username', 'JohnDoe', { expires: '2025-01-01', secure: true });
 */
class CookieStorage {

    /**
     * @typedef {Object} SetCookieOptions
     * @property {Date | number | string} [expires] - A Date instance will be created from this value.
     * @property {string} [path] - The path for the cookie. Defaults to '/' if not provided.
     * @property {boolean} [secure] - Whether the cookie is secure (sent only over HTTPS).
     * @property {"Strict" | "Lax" | "None"} [sameSite] - The SameSite attribute for the cookie.
     */

    /**
     * Creates an instance of CookieStorage with default options.
     * @param {SetCookieOptions} [defaultOptions={}] - The default options to use for all cookies.
     */
    constructor(defaultOptions = {}) {

        if (typeof defaultOptions !== 'object' || Array.isArray(defaultOptions)) {
            throw new Error(`Invalid defaultOptions: ${defaultOptions}`)
        }

        /**@type {SetCookieOptions} */
        this.defaultOptions = {path: '/', secure: true, ...defaultOptions};
    }

    /**
     * Sets a cookie with the specified key, value, and options.
     * @param {string} key - The name of the cookie.
     * @param {string} value - The value of the cookie.
     * @param {SetCookieOptions} [options] - Options for the cookie, merged with the default options.
     * @example
     * const storage = new CookieStorage();
     * storage.setCookie('username', 'JohnDoe', { expires: '2025-01-01', secure: true });
     */
    setCookie(key, value, options) {
        if (typeof key !== 'string' || !key) throw new Error(`Invalid key: ${key}`);
        if (typeof value !== 'string' || !value) throw new Error(`Invalid value: ${value}`);
        
        options = { ...this.defaultOptions, ...options };
        let cookieString = `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;

        if (options?.expires) {
            const expirationDate = new Date(options.expires);
            if (isNaN(expirationDate.getTime())) throw new Error(`Could not instance a Date object from ${options.expires}`);
            cookieString += `; expires=${expirationDate.toUTCString()}`;
        }

        if (options?.path) {
            if (typeof options.path !== 'string') throw new Error(`Invalid path: ${options.path}`);
            cookieString += `; path=${options.path}`;
        }

        if (options?.secure) {
            cookieString += '; secure';
        }

        if (options?.sameSite) {
            if (!['Lax', 'None', 'Strict'].includes(options.sameSite)) throw new Error(`Invalid SameSite ${options.sameSite}`);
            cookieString += `; SameSite=${options.sameSite}`;
        }

        if (!navigator.cookieEnabled) {
            console.warn("Cookies are disabled in this browser.");
            return;
        }

        document.cookie = cookieString;
    }

    /**
     * Checks if a cookie with the specified key exists.
     * @param {string} key - The name of the cookie to check.
     * @returns {boolean} True if the cookie exists, false otherwise.
     * @example
     * const storage = new CookieStorage();
     * console.log(storage.hasCookie('username')); // Output: true or false
     */
    hasCookie(key) {
        if (typeof key !== 'string' || !key) throw new Error(`Invalid key: ${key}`);
        return Boolean(document.cookie.match(new RegExp(`(?:^|; )${encodeURIComponent(key)}=([^;]*)`)));
    }

    /**
     * Retrieves the value of a cookie by its key.
     * @param {string} key - The name of the cookie.
     * @returns {string | undefined} The value of the cookie, or undefined if it does not exist.
     * @example
     * const storage = new CookieStorage();
     * console.log(storage.getCookie('username')); // Output: 'JohnDoe' or undefined
     */
    getCookie(key) {
        if (typeof key !== 'string' || !key) throw new Error(`Invalid key: ${key}`);
        const match = document.cookie.match(new RegExp(`(?:^|; )${encodeURIComponent(key)}=([^;]*)`));
        return match ? decodeURIComponent(match[1]) : undefined;
    }

    /**
     * Deletes a cookie by its key.
     * @param {string} key - The name of the cookie to delete.
     * @param {string} [path='/'] - The path of the cookie to delete.
     * @example
     * const storage = new CookieStorage();
     * storage.deleteCookie('username'); // Deletes the 'username' cookie
     */
    deleteCookie(key, path = '/') {
        if (typeof key !== 'string' || !key) throw new Error(`Invalid key: ${key}`);
        this.setCookie(key, '', { expires: new Date(0), path });
    }

    /**
     * Retrieves all cookies as an object of key-value pairs.
     * @returns {Object.<string, string>} An object containing all cookies.
     * @example
     * const storage = new CookieStorage();
     * console.log(storage.getAllCookies()); // Output: { username: 'JohnDoe', sessionId: '12345' }
     */
    getAllCookies() {
        if (!navigator.cookieEnabled) {
            console.warn("Cookies are disabled in this browser.");
            return {};
        }

        return document.cookie.split('; ').reduce((cookies, cookie) => {
            const [key, value] = cookie.split('=');
            cookies[decodeURIComponent(key)] = decodeURIComponent(value);
            return cookies;
        }, {});
    }

    /**
     * Checks if cookies are supported in the current browser.
     * @returns {boolean} True if cookies are supported, false otherwise.
     * @example
     * const storage = new CookieStorage();
     * console.log(storage.isCookieSupported()); // Output: true or false
     */
    isCookieSupported() {
        return navigator.cookieEnabled;
    }
}
