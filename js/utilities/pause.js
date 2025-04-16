/**
 * Pauses execution for a specified number of milliseconds.
 *
 * This function returns a Promise that resolves after the given number
 * of milliseconds. Useful for introducing delays in asynchronous code.
 *
 * @param {number} ms - The number of milliseconds to pause.
 * @returns {Promise<void>} A Promise that resolves after the delay.
 *
 * @example
 * // Pause for 1 second
 * pause(1000).then(() => {
 *   console.log('1 second has passed');
 * });
 *
 * @example
 * // Using async/await
 * async function example() {
 *   console.log('Start');
 *   await pause(2000);
 *   console.log('2 seconds later');
 * }
 * example();
 */
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
