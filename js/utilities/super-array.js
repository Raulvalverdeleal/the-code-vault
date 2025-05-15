class SuperArray extends Array {
    /**
     * Creates an instance of SuperArray, extending the native Array class.
     * It supports all standard Array functionalities and adds custom utilities.
     * 
     * @param {...any} params - Elements to initialize the array with.
     * @example
     * const superArray = new SuperArray(1, 2, 3, 4);
     * console.log(superArray); // Output: SuperArray [1, 2, 3, 4]
     */
    constructor(...params) {
        super(...params);
    }

    /**
     * Internal method to fetch values based on a selector.
     * @private
     * @param {Object|any} item - The object or value to fetch data from.
     * @param {string|number|function} selector - The key, index, or function to extract a value.
     * @returns {any} - The extracted value.
     */
    #getValueBySelector(item, selector) {
        switch (typeof selector) {
            case 'function': return selector(item);
            case 'string':
            case 'number':
            case 'bigint': return item[selector];
            default: return item;
        }
    }

    /**
     * Sums the elements in the array. Supports grouping and field selection.
     * @param {Object} options - Options for summing.
     * @param {string} [options.field] - The field / selector to sum from objects in the array.
     * @param {string|string[]} [options.groupBy] - The field(s) / selector(s) to group by.
     * @param {string} [options.keySeparator='_'] - The separator for group keys ('_' as default).
     * @returns {number|Object} - Total sum or grouped sums.
     */
    sum({ field, groupBy, keySeparator } = {}) {
        if (!field && !groupBy) {
            let total = 0;
            for (const item of this) { total += item; }
            return total;
        }

        const totals = {};

        for (const item of this) {
            const keySelectors = Array.isArray(groupBy) ? groupBy : [groupBy];
            const key = keySelectors.map(selector => this.#getValueBySelector(item, selector)).join(keySeparator || '_');

            const value = parseFloat(this.#getValueBySelector(item, field)) || 0;
            totals[key] = (totals[key] || 0) + value;
        }

        return totals;
    }

    /**
     * Swaps two elements in the array.
     * @param {number} index1 - The index of the first element.
     * @param {number} index2 - The index of the second element.
     * @returns {SuperArray} - The modified array.
     */
    swap(index1, index2) {
        if (index1 < 0 || index1 >= this.length || index2 < 0 || index2 >= this.length) {
            throw new RangeError('Index out of bounds');
        }
        [this[index1], this[index2]] = [this[index2], this[index1]];
        return this;
    }

    /**
     * Moves an element from one index to another.
     * @param {number} oldIndex - The index of the element to move.
     * @param {number} newIndex - The target index.
     * @returns {SuperArray} - The modified array.
     */
    move(oldIndex, newIndex) {
        if (oldIndex < 0 || oldIndex >= this.length || newIndex < 0 || newIndex >= this.length) {
            throw new RangeError('Index out of bounds');
        }
        const [element] = this.splice(oldIndex, 1);
        this.splice(newIndex, 0, element);
        return this;
    }

    /**
     * Returns the element at the specified index. Supports negative indexing.
     * @param {number} index - The index of the element.
     * @returns {any} - The element at the index.
     */
    at(index) {
        return this[(index >= 0 ? index : this.length + index)] || undefined;
    }

    /**
     * Searches for elements that match a specified value.
     * @param {string|number} like - The value to search for.
     * @param {string|function} selector - The field or function to extract values for comparison.
     * @returns {SuperArray} - The filtered array of matches.
     */
    search(like, selector) {
        const normalize = (value = '') => typeof value === 'string' ?
            value.toLocaleLowerCase().trim()
            :
            parseFloat(value);

        const likeNormalized = normalize(like);

        return this.filter(item => {
            const value = normalize(this.#getValueBySelector(item, selector));
            return typeof value === 'number' ? value === like : value.includes(likeNormalized);
        });
    }

    /**
     * Returns a new array with unique elements.
     * @returns {SuperArray} - The array of unique elements.
     */
    unique() {
        return new SuperArray(...new Set(this));
    }

    /**
     * Groups the array elements by a specified selector.
     * @param {string|function} selector - The field or function to group by.
     * @returns {Object} - An object with grouped elements.
     */
    groupBy(selector) {
        if (!selector) {
            throw new Error('Selector is required for groupBy');
        }
        const grouped = {};
        for (const item of this) {
            const key = this.#getValueBySelector(item, selector);
            grouped[key] = grouped[key] || [];
            grouped[key].push(item);
        }
        return grouped;
    }

    /**
     * Splits the array into chunks of specified size.
     * @param {number} size - The size of each chunk.
     * @returns {SuperArray[]} - An array of chunks.
     */
    chunk(size) {
        const chunks = [];
        for (let i = 0; i < this.length; i += size) {
            chunks.push(new SuperArray(...this.slice(i, i + size)));
        }
        return chunks;
    }

    /**
     * Randomly shuffles the array elements in place.
     * @returns {SuperArray} - The shuffled array.
     */
    shuffle() {
        for (let i = this.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this[i], this[j]] = [this[j], this[i]];
        }
        return this;
    }

    /**
     * Sorts the array by a specified selector.
     * @param {Object} options - Sorting options.
     * @param {'asc'|'desc'} [options.order='asc'] - The order of sorting.
     * @param {string|function} options.selector - The field or function to sort by.
     * @param {'date'|'string'|'number'} [options.type='number'] - The type of data.
     * @returns {SuperArray} - The sorted array.
     */
    sortBy({ order = 'asc', selector, type } = {}) {
        return this.sort((a, b) => {
            const valueA = this.#getValueBySelector(a, selector);
            const valueB = this.#getValueBySelector(b, selector);
            const comparison = type === 'date' ? 
                new Date(valueA) - new Date(valueB) : 
                (typeof valueA === 'string' ? valueA.localeCompare(valueB) : valueA - valueB);
            return order === 'asc' ? comparison : -comparison;
        });
    }

    /**
     * Returns the last element in the array.
     * @returns {any} - The last element.
     */
    last() {
        return this[this.length - 1];
    }

    /**
     * Returns a new array with elements common to this array and another.
     * @param {Array} array - The array to intersect with.
     * @returns {SuperArray} - The intersected array.
     */
    intersect(array) {
        return new SuperArray(...this.filter(item => array.includes(item)));
    }

    /**
     * Returns a new array with elements in this array but not in another.
     * @param {Array} array - The array to compare with.
     * @returns {SuperArray} - The difference array.
     */
    difference(array) {
        return new SuperArray(...this.filter(item => !array.includes(item)));
    }
}