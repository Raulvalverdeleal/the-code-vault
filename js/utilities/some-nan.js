/**
 * @param  {...number | number[]} values 
 * @returns {boolean} true if some value is NaN
 * @example
 * if (someNaN(id, date.getTime(), eventId)) throw new Error('Invalid parameters')
 */
function someNaN(...values) {
    return values.flat().some(value => isNaN(value))
}