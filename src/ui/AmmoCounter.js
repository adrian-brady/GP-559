class AmmoCounter {
  /** @type {HTMLElement} */
  element;

  constructor() {
    this.element = document.getElementById('ammo-display');
    if (!this.element) {
      console.warn('Ammo display element not found');
    }
  }

  /**
   * Update the ammo display
   * @param {number} current - Current ammo in magazine
   * @param {number} max - Max magazine size
   * @param {boolean} isReloading - Whether currently reloading
   */
  update(current, max, isReloading = false) {
    if (!this.element) return;

    this.element.textContent = `${current} / ${max}`;

    if (isReloading) {
      this.element.classList.add('reloading');
    } else {
      this.element.classList.remove('reloading');
    }
  }

  /**
   * Hide hte ammo display
   */
  hide() {
    if (this.element) {
      this.element.style.display = 'none';
    }
  }

  /**
   * Show the ammo display
   */
  show() {
    if (this.element) {
      this.element.style.display = 'block';
    }
  }
}

export { AmmoCounter };
