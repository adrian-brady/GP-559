import { MoveCommand } from '../input/commands/MoveCommand.js';
import { CrouchCommand } from '../input/commands/CrouchCommand.js';
import { JumpCommand } from '../input/commands/JumpCommand.js';
import { Vector3, PerspectiveCamera } from 'three';
import { PlayerController } from '../components/PlayerController.js';
import { LeanLeftCommand } from '../input/commands/LeanLeftCommand.js';
import { LeanRightCommand } from '../input/commands/LeanRightCommand.js';
import { ReloadCommand } from '../input/commands/ReloadCommand.js';
import { ProneCommand } from '../input/commands/ProneCommand.js';
import { EntitySpawner } from './EntitySpawner.js';
import { SpawnWeaponCommand } from '../input/commands/SpawnWeaponCommand.js';
import { FireCommand } from '../input/commands/FireCommand.js';
import { AimCommand } from '../input/commands/AimCommand.js';
import { ReleaseAimCommand } from '../input/commands/ReleaseAimCommand.js';
import { MenuManager } from '../ui/MenuManager.js';
import { Weapon } from '../components/Weapon.js';
import { GameConfig } from '../config/GameConfig.js';

class InputSystem {
  /** @type {EntityManager} */
  entityManager;

  /** @type {EntitySpawner} */
  entitySpawner;

  /** @type {Object<string, boolean>} */
  keysPressed = {};

  /** @type {Object<string, boolean>} */
  keysPressedPrevious = {};

  /** @type {number} */
  mouseX = 0;

  /** @type {number} */
  mouseY = 0;

  /** @type {number} */
  mouseSensitivity = 0.005;

  /** @type {number} */
  pitch = 0;

  /** @type {number} */
  yaw = 0;

  /** @type {boolean} */
  isPointerLocked = false;

  /** @type {PerspectiveCamera} */
  camera = null;

  /** @type {MenuManager} */
  menuManager = null;

  /** @type {PlayerController} */
  playerController;

  keyBindings = {
    ' ': { command: JumpCommand, continuous: false },
    c: { command: CrouchCommand, continuous: false },
    x: { command: ProneCommand, continuous: false },
    q: { command: LeanLeftCommand, continuous: false },
    e: { command: LeanRightCommand, continuous: false },
    r: { command: ReloadCommand, continuous: false },
    rightclick: {
      command: AimCommand,
      continuous: false,
      edgeDetect: true,
      releaseCommand: null,
    },
    leftclick: { command: FireCommand, continuous: true },
  };

  /**
   * @param {EntityManager} entityManager
   * @param {PerspectiveCamera} camera
   */
  constructor(entityManager, camera = null) {
    this.entityManager = entityManager;
    this.camera = camera;
    this.menuManager = new MenuManager(this);
  }

  /**
   * Set the entity spawner
   * @param {EntitySpawner} entitySpawner
   */
  setEntitySpawner(entitySpawner) {
    this.entitySpawner = entitySpawner;
  }

  /**
   * Call during World.start()
   */
  initialize() {
    document.addEventListener('keydown', e => {
      const key = e.key.toLowerCase();

      // if (key === 'escape') {
      //   this.menuManager.toggleMenu();
      //   if (this.menuManager.isMenuOpen) {
      //     document.exitPointerLock();
      //   }
      //   return;
      // }

      if (this.menuManager.isPaused) return;

      // Only handle a key if not already pressed
      if (!this.keysPressed[key]) {
        this.handleKeyDown(key);
      }

      this.keysPressed[key] = true;
    });

    document.addEventListener('keyup', e => {
      const key = e.key.toLowerCase();
      this.handleKeyUp(key);
      this.keysPressed[key] = false;
    });

    // Request pointer lock on click
    document.addEventListener('click', () => {
      if (!this.menuManager.isPaused) {
        document.body.requestPointerLock();
      }
    });

    // Handle pointer lock change
    document.addEventListener('pointerlockchange', () => {
      const wasLocked = this.isPointerLocked;
      this.isPointerLocked = document.pointerLockElement !== null;

      // If pointer lock was just released and menu isn't already open, open it
      if (
        wasLocked &&
        !this.isPointerLocked &&
        !this.menuManager.isMenuOpen &&
        !this.menuManager.isPaused
      ) {
        setTimeout(() => {
          if (!this.isPointerLocked && !this.menuManager.isMenuOpen) {
            this.menuManager.openMenu();
          }
        }, 50);
      }
    });

    // Track mouse movement
    document.addEventListener('mousemove', e => {
      if (this.isPointerLocked) {
        this.mouseX += e.movementX;
        this.mouseY += e.movementY;
      }
    });

    document.addEventListener('mousedown', e => {
      console.log('event:', e);
      if (e.button === 2) {
        this.keysPressed['rightclick'] = true;
      } else if (e.button === 0) {
        this.keysPressed['leftclick'] = true;
      }
    });

    document.addEventListener('mouseup', e => {
      if (e.button === 2) {
        this.keysPressed['rightclick'] = false;
      } else if (e.button === 0) {
        this.keysPressed['leftclick'] = false;
      }
    });

    document.addEventListener('contextmenu', e => {
      e.preventDefault();
    });
  }

  /**
   * Call this every frame in World.update()
   */
  update() {
    if (this.menuManager.isPaused) return;

    this.updateMouseLook();
    const movementInput = this.getMovementInput();

    const currentKeysPressed = { ...this.keysPressed };

    this.entityManager.entities.forEach(entity => {
      /** @type {PlayerController} */
      const controller = entity.getComponent(PlayerController);
      if (!controller) return;

      if (movementInput.length() > 0) {
        new MoveCommand(movementInput).execute(controller);
      }

      for (const [key, binding] of Object.entries(this.keyBindings)) {
        const isPressed = currentKeysPressed[key];
        const wasPressed = this.keysPressedPrevious[key];

        if (binding.edgeDetect) {
          if (isPressed && !wasPressed) {
            const command = new binding.command();
            console.log('executing command (isPressed, !wasPressed):', command);
            command.execute(controller);
          } else if (!isPressed && wasPressed) {
            if (binding.releaseCommand) {
              const command = new binding.releaseCommand();
              console.log(
                'executing command (!isPressed, wasPressed):',
                command
              );
              command.execute(controller);
            }
          }
        } else if (binding.continuous && isPressed) {
          const command = new binding.command();
          console.log('executing command:', command);
          command.execute(controller);
        }
      }
    });

    this.keysPressedPrevious = currentKeysPressed;
  }

  /**
   * Update camera rotation based on mouse movement
   */
  updateMouseLook() {
    if (!this.camera) return;

    const mouseDeltaX = this.mouseX;
    const mouseDeltaY = this.mouseY;

    // Update pitch and yaw based on mouse movement
    this.yaw -= this.mouseX * this.mouseSensitivity;
    this.pitch -= this.mouseY * this.mouseSensitivity;

    // Clamp pitch to prevent flipping
    const maxPitch = Math.PI / 2.5;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));

    // Reset mouse movement
    this.mouseX = 0;
    this.mouseY = 0;

    // Apply rotation to camera using Euler angles
    // Using Y-axis rotation (yaw) for left/right
    // Using X-axis rotation (pitch) for up/down
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  /**
   * Handle key release
   * @param {string} key
   */
  handleKeyUp(key) {
    const binding = this.keyBindings[key];
    if (!binding || !binding.releaseCommand) return;

    if (!this.keysPressedPrevious[key]) return;

    const command = new binding.releaseCommand();

    this.entityManager.entities.forEach(entity => {
      /** @type {PlayerController} */
      const controller = entity.getComponent(PlayerController);
      if (controller) {
        command.execute(controller);
      }
    });
  }

  /**
   * @param {string} key
   */
  handleKeyDown(key) {
    if (key === 'm') {
      GameConfig.toggleMode();
      return;
    }

    const binding = this.keyBindings[key];
    if (!binding) return;

    let command;
    if (key === 'p' && this.entitySpawner) {
      command = new SpawnWeaponCommand(this.entitySpawner, this.camera, 'ak47');
    } else {
      command = new binding.command();
    }

    if (!command) return;

    this.entityManager.entities.forEach(async entity => {
      const controller = entity.getComponent(PlayerController);
      if (controller) {
        await command.execute(controller);
      }
    });
  }

  /**
   * Gets movement input on each update
   * @returns {Vector3}
   */
  getMovementInput() {
    const direction = new Vector3();
    if (this.keysPressed['w']) direction.z -= 1;
    if (this.keysPressed['a']) direction.x -= 1;
    if (this.keysPressed['s']) direction.z += 1;
    if (this.keysPressed['d']) direction.x += 1;

    if (direction.length() === 0) return direction;

    direction.normalize();

    const rotatedDirection = direction.clone();
    rotatedDirection.applyAxisAngle(new Vector3(0, 1, 0), this.yaw);

    return rotatedDirection;
  }
}

export { InputSystem };
