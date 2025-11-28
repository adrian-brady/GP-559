/**
 * @template T
 */
class SafeArray {
  /** @type {T[]} */
  array;
  /** @type {T[]} */
  addQueue;
  /** @type {Set<T>} */
  removeQueue;

  constructor() {
    this.array = [];
    this.addQueue = [];
    this.removeQueue = new Set();
  }

  /**
   * @returns {boolean} Whether or not the array is empty
   */
  get isEmpty() {
    return this.addQueue.length + this.array.length > 0;
  }

  /**
   * Queues an element for addition
   * @param {T} element Element to enqueue for addition
   */
  add(element) {
    this.addQueue.push(element);
  }

  /**
   * Queues an element for removal
   * @param {T} element to enqueue for removal
   */
  remove(element) {
    this.removeQueue.add(element);
  }

  /**
   * @param {(element: T) => void} fn
   */
  forEach(fn) {
    this._addQueued();
    this._removeQueued();
    for (const element of this.array) {
      if (this.removeQueue.has(element)) {
        continue;
      }
      fn(element);
    }
    this._removeQueued();
  }

  /** @private */
  _addQueued() {
    if (this.addQueue.length) {
      this.array.splice(this.array.length, 0, ...this.addQueue);
      this.addQueue = [];
    }
  }

  /** @private */
  _removeQueued() {
    if (this.removeQueue.size) {
      this.array = this.array.filter(element => !this.removeQueue.has(element));
      this.removeQueue.clear();
    }
  }
}

export { SafeArray };
