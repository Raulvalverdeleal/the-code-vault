/**
 * A class that manages a queue of tasks with controlled concurrency.
 * @class
 * @author Raul Valverde Leal
 */
class TaskQueue {
    
    /**
     * Creates an instance of TaskQueue.
     * @param {number} [concurrency=1] - The maximum number of tasks that can run concurrently.
     */
    constructor(concurrency = 1) {
        this.concurrency = concurrency; // Number of concurrent tasks allowed
        this.queue = []; // Task queue
        this.activeCount = 0; // Number of tasks currently being processed
    }

    /**
     * Adds a task to the queue.
     * The task will be executed as soon as concurrency limits allow.
     * 
     * @param {Function} task - A function that returns a promise.
     * @returns {Promise} A promise that resolves when the task is completed.
     * @example
     * const queue = new TaskQueue(2);
     * 
     * queue.add(() => fetch('https://api.example.com/data'))
     *     .then(response => console.log('Task completed:', response))
     *     .catch(error => console.error('Task failed:', error));
     */
    add(task) {
        return new Promise((resolve, reject) => {
            this.queue.push(() => 
                task().then(resolve).catch(reject)
            );
            this.#next();
        });
    }

    /**
     * Executes the next task in the queue if concurrency limits allow.
     * This method is private and should not be called directly.
     * 
     * @private
     */
    #next() {
        if (this.activeCount >= this.concurrency || this.queue.length === 0) {
            return;
        }

        const task = this.queue.shift();
        this.activeCount++;

        task().finally(() => {
            this.activeCount--;
            this.#next();
        });
    }
}