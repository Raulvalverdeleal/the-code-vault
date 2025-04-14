/**
 * A utility class to manage intervals more safely, preventing duplicate intervals using unique tokens.
 * @class
 * @author Raul Valverde Leal
 * @example
 * const intervals = new IntervalsHandler();
 * intervals.set("animation-01", () => console.log("interval"), 1000);
 * intervals.set("animation-01", () => console.log("interval"), 1000);
 * // Only one interval with "animation-01" will remain active.
 */
class IntervalsHandler {

    /**
     * A private map to store active intervals and their tokens.
     * @type {Map<string, number>}
     * @private
     */
    #tokens;

    /**
     * Initializes the IntervalsHandler instance.
     */
    constructor() {
        this.#tokens = new Map();
    }

    /**
     * The number of intervals currently in progress.
     * @returns {number} The size of the tokens map.
     * @example
     * console.log(intervals.inProgress); // 0
     * intervals.set("animation-01", () => console.log("interval"), 1000);
     * console.log(intervals.inProgress); // 1
     */
    get inProgress() {
        return this.#tokens.size;
    }

    /**
     * Sets an interval and associates it with a unique token.
     * Prevents duplicate intervals with the same token.
     * @param {string} token A unique interval identifier assigned by the developer.
     * @param {() => void} callBack The callback function to execute at each interval.
     * @param {number} ms The interval duration in milliseconds.
     * @throws {Error} If the token is not a string, the callBack is not a function, or the ms is not a number.
     * @example
     * intervals.set("animation-01", () => console.log("interval"), 1000);
     */
    set(token, callBack, ms) {
        if (typeof token !== 'string') throw new Error(`${token} is not a string`);
        if (typeof callBack !== 'function') throw new Error(`${callBack} is not a function`);
        if (typeof ms !== 'number' || isNaN(ms)) throw new Error(`${ms} is not a number`);

        this.clear(token); // Ensure no duplicate interval exists
        const id = setInterval(callBack, ms);
        this.#tokens.set(token, id);
    }

    /**
     * Checks if an interval associated with a token is currently in progress.
     * @param {string} token A unique interval identifier assigned by the developer, not the interval ID.
     * @returns {boolean} True if the interval is in progress, false otherwise.
     * @example
     * intervals.set("animation-01", () => console.log("interval"), 1000);
     * console.log(intervals.isInProgress("animation-01")); // true
     */
    isInProgress(token) {
        return this.#tokens.has(token);
    }

    /**
     * Clears an interval by its token and removes it from the map.
     * If the token does not exist, the method does nothing.
     * @param {string} token The unique interval identifier assigned by the developer.
     * @example
     * intervals.set("animation-01", () => console.log("interval"), 1000);
     * intervals.clear("animation-01");
     * console.log(intervals.isInProgress("animation-01")); // false
     */
    clear(token) {
        if (!this.#tokens.has(token)) return;
        clearInterval(this.#tokens.get(token));
        this.#tokens.delete(token);
    }

    /**
     * Clears all intervals and removes all tokens from the map.
     * @example
     * intervals.set("animation-01", () => console.log("interval"), 1000);
     * intervals.set("animation-02", () => console.log("interval"), 1000);
     * intervals.clearAll();
     * console.log(intervals.inProgress); // 0
     */
    clearAll() {
        this.#tokens.forEach((intervalId, token) => this.clear(token));
    }
}
