/**
 * Global game configuration
 * Manages prototype vs full mode
 */
class GameConfig {
  static isPrototypeMode = false;
  static onModeChangeCallbacks = [];

  static toggleMode() {
    this.isPrototypeMode = !this.isPrototypeMode;
    console.log(
      `Switched to ${this.isPrototypeMode ? 'PROTOTYPE' : 'FULL'} mode`
    );
    this.onModeChangeCallbacks.forEach(callback =>
      callback(this.isPrototypeMode)
    );
  }

  /**
   * Set mode explicitly
   * @param {boolean} isPrototype
   */
  static setMode(isPrototype) {
    if (this.isPrototypeMode !== isPrototype) {
      this.isPrototypeMode = isPrototype;

      this.isPrototypeMode = isPrototype;
      console.log(`Set to ${this.isPrototypeMode ? 'PROTOTYPE' : 'FULL'} mode`);

      this.onModeChangeCallbacks.forEach(callback =>
        callback(this.isPrototypeMode)
      );
    }
  }

  /**
   * Register a callback for when mode changes
   * @param {Function} callback - (isPrototype: boolean) => void
   */
  static onModeChange(callback) {
    this.onModeChangeCallbacks.push(callback);
  }

  /**
   * Remove a callback
   * @param {Function} callback
   */
  static offModeChange(callback) {
    const index = this.onModeChangeCallbacks.indexOf(callback);
    if (index > -1) {
      this.onModeChangeCallbacks.splice(index, 1);
    }
  }
}

export { GameConfig };
