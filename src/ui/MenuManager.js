import { ReleaseAimCommand } from '../input/commands/ReleaseAimCommand.js';
import { InputSystem } from '../systems/InputSystem.js';

class MenuManager {
  /** @type {InputSystem} */
  inputSystem;

  escMenu;
  keybindsMenu;
  isMenuOpen = false;
  isPaused = false;

  /**
   *
   * @param {InputSystem} inputSystem
   */
  constructor(inputSystem) {
    this.inputSystem = inputSystem;

    const escMenu = document.getElementById('esc-menu');
    if (!escMenu) {
      console.warn('Failed to get escape menu');
      return;
    }
    const keybindsMenu = document.getElementById('keybinds-menu');
    if (!keybindsMenu) {
      console.warn('Failed to get keybinds menu');
      return;
    }
    this.keybindsMenu = keybindsMenu;
    this.escMenu = escMenu;

    this.setupEventListeners();
  }

  setupEventListeners() {
    const resumeButton = document.getElementById('resume-btn');
    const keybindsButton = document.getElementById('keybinds-btn');
    const keybindsBackButton = document.getElementById('keybinds-back-btn');

    if (!resumeButton) {
      console.warn('Failed to get resume button');
      return;
    }

    if (!keybindsButton) {
      console.warn('Failed to get keybinds button');
      return;
    }

    if (!keybindsBackButton) {
      console.warn('Failed to get keybinds back button');
      return;
    }

    resumeButton.addEventListener('click', () => {
      this.closeMenu();
    });
    keybindsButton.addEventListener('click', () => {
      this.showKeybindsMenu();
    });
    keybindsBackButton.addEventListener('click', () => {
      this.showEscMenu();
    });
  }

  toggleMenu() {
    if (this.isMenuOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu() {
    this.showEscMenu();
    this.isMenuOpen = true;
    this.isPaused = true;
    document.exitPointerLock();
  }

  closeMenu() {
    this.escMenu.classList.add('hidden');
    this.keybindsMenu.classList.add('hidden');
    this.isMenuOpen = false;
    this.isPaused = false;
    document.body.requestPointerLock();
  }

  showEscMenu() {
    this.escMenu.classList.remove('hidden');
    this.keybindsMenu.classList.add('hidden');
  }

  showKeybindsMenu() {
    this.escMenu.classList.add('hidden');
    this.keybindsMenu.classList.remove('hidden');
    this.renderKeybinds();
  }

  renderKeybinds() {
    const container = document.getElementById('keybinds-list');
    if (!container) {
      console.warn('Failed to get keybinds list container');
      return;
    }

    container.innerHTML = '';
    const actionNames = {
      ' ': 'Jump',
      c: 'Crouch',
      x: 'Prone',
      q: 'Lean Left',
      e: 'Lean Right',
      r: 'Reload',
      rightclick: 'Aim Down Sights',
      leftclick: 'Fire',
    };

    for (const [key, binding] of Object.entries(this.inputSystem.keyBindings)) {
      const item = document.createElement('div');
      item.className = 'keybind-item';

      const label = document.createElement('label');
      label.textContent = actionNames[key] || key;

      const button = document.createElement('button');
      button.textContent = this.formatKey(key);
      button.addEventListener('click', () => this.startRebind(key, button));

      item.appendChild(label);
      item.appendChild(button);
      container.appendChild(item);

      if (key === 'rightclick') {
        const toggleItem = document.createElement('div');
        toggleItem.className = 'keybind-item';

        const toggleLabel = document.createElement('label');
        toggleLabel.textContent = 'Hold to ADS';

        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'keybind-toggle';

        const toggleSwitch = document.createElement('label');
        toggleSwitch.className = 'toggle-switch';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = !binding.edgeDetect && binding.releaseCommand; // edgeDetect true = hold mode
        checkbox.addEventListener('change', e => {
          if (e.target.checked) {
            binding.edgeDetect = true;
            binding.releaseCommand = ReleaseAimCommand;
          } else {
            binding.edgeDetect = true;
            binding.releaseCommand = null;
          }
        });

        const slider = document.createElement('span');
        slider.className = 'toggle-slider';

        toggleSwitch.appendChild(checkbox);
        toggleSwitch.appendChild(slider);
        toggleContainer.appendChild(toggleSwitch);

        toggleItem.appendChild(toggleLabel);
        toggleItem.appendChild(toggleContainer);
        container.appendChild(toggleItem);
      }
    }
  }

  /**
   *
   * @param {string} key
   * @returns {string} Formatted key name
   */
  formatKey(key) {
    if (key === ' ') return 'Space';
    if (key === 'rightclick') return 'Right Click';
    if (key === 'leftclick') return 'Left Click';
    return key.toUpperCase();
  }

  /**
   *
   * @param {string} oldKey
   * @param {HTMLButtonElement} button
   */
  startRebind(oldKey, button) {
    button.textContent = 'Press any key...';
    button.classList.add('listening');

    const handleKey = (/** @type {KeyboardEvent} */ e) => {
      e.preventDefault();
      const newKey = e.key.toLowerCase();

      const binding = this.inputSystem.keyBindings[oldKey];
      delete this.inputSystem.keyBindings[oldKey];
      this.inputSystem.keyBindings[newKey] = binding;

      button.textContent = this.formatKey(newKey);
      button.classList.remove('listening');

      document.removeEventListener('keydown', handleKey);
      this.renderKeybinds(); // Refresh the list
    };

    document.addEventListener('keydown', handleKey, { once: true });
  }
}

export { MenuManager };
