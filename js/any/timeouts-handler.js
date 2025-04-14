/**
 * author: raulvalverdeleal
 */

/**
 * A utility class to manage timeouts more safely, preventing duplicate timeouts using unique tokens.
 * @class
 */
class TimeoutsHandler {

    /**
     * A private map to store active timeouts and their tokens.
     * @type {Map<string, number>}
     * @private
     */
    #tokens

    /**
     * Initializes the TimeoutsHandler instance.
     */
    constructor() {
        this.#tokens = new Map()
    }

    /**
     * The number of pending timeouts.
     * @returns {number} The size of the tokens map.
     * @example
     * console.log(timeouts.pending) // 0
     * timeouts.set("animation-01", () => console.log("Timeout finished"), 1000)
     * console.log(timeouts.pending) // 1
     */
    get pending() {
        return this.#tokens.size
    }

    /**
     * Sets a timeout and associates it with a unique token.
     * @param {string} token A unique timeout identifier assigned by the developer.
     * @param {() => void} callBack The callback function to execute after the timeout.
     * @param {number} ms The timeout duration in milliseconds.
     * @throws {Error} If the token is not a string, the callBack is not a function, or the ms is not a number.
     * @example
     * timeouts.set("animation-01", () => console.log("Timeout finished"), 1000)
     */
    set(token, callBack, ms) {
        if (typeof token !== 'string') throw new Error(`${token} is not a string`)
        if (typeof callBack !== 'function') throw new Error(`${callBack} is not a function`)
        if (typeof ms !== 'number' || isNaN(ms)) throw new Error(`${ms} is not a number`)

        this.clear(token) // Ensure no duplicate timeout exists
        const id = setTimeout(() => {
            callBack()
            this.#tokens.delete(token)
        }, ms)
        this.#tokens.set(token, id)
    }

    /**
     * Checks if a timeout associated with a token is still pending.
     * @param {string} token A unique timeout identifier assigned by the developer, not the timeout ID.
     * @returns {boolean} True if the token is still pending, false otherwise.
     * @example
     * timeouts.set("animation-01", () => console.log("Timeout finished"), 1000)
     * console.log(timeouts.isPending("animation-01")) // true
     */
    isPending(token) {
        return this.#tokens.has(token)
    }

    /**
     * Clears a timeout by its token and removes it from the map.
     * @param {string} token The unique timeout identifier assigned by the developer.
     * @example
     * timeouts.set("animation-01", () => console.log("Timeout finished"), 1000)
     * timeouts.clear("animation-01")
     * console.log(timeouts.isPending("animation-01")) // false
     */
    clear(token) {
        if (!this.#tokens.has(token)) return
        clearTimeout(this.#tokens.get(token))
        this.#tokens.delete(token)
    }

    /**
     * Clears all timeouts and removes all tokens from the map.
     * @example
     * timeouts.set("animation-01", () => console.log("Timeout finished"), 1000)
     * timeouts.set("animation-02", () => console.log("Timeout finished"), 1000)
     * timeouts.clearAll()
     * console.log(timeouts.pending) // 0
     */
    clearAll() {
        this.#tokens.forEach((timeoutId, token) => this.clear(token))
    }
}
