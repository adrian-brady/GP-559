import { MoveCommand } from '../input/commands/MoveCommand.js';
import { JumpCommand } from '../input/commands/JumpCommand.js';
import { Vector3, PerspectiveCamera } from 'three';
import { PlayerController } from '../components/PlayerController.js';
import { LeanLeftCommand } from '../input/commands/LeanLeftCommand.js';
import { LeanRightCommand } from '../input/commands/LeanRightCommand.js';
import { ReloadCommand } from '../input/commands/ReloadCommand.js';

class InputSystem {
  /** @type {EntityManager} */
  entityManager;

  /** @type {Object<string, boolean>} */
  keysPressed = {};

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

  /**
   * @param {EntityManager} entityManager
   * @param {PerspectiveCamera} camera
   */
  constructor(entityManager, camera = null) {
    this.entityManager = entityManager;
    this.camera = camera;
  }

  /**
   * Call during World.start()
   */
  initialize() {
    document.addEventListener('keydown', e => {
      this.keysPressed[e.key.toLowerCase()] = true;
      this.handleKeyDown(e.key.toLowerCase());
    });

    document.addEventListener('keyup', e => {
      this.keysPressed[e.key.toLowerCase()] = false;
    });

    // Request pointer lock on click
    document.addEventListener('click', () => {
      document.body.requestPointerLock();
    });

    // Handle pointer lock change
    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement !== null;
    });

    // Track mouse movement
    document.addEventListener('mousemove', e => {
      if (this.isPointerLocked) {
        this.mouseX += e.movementX;
        this.mouseY += e.movementY;
      }
    });

    document.addEventListener('mousedown', e => {
      if (e.button === 2) {
        this.keysPressed['rightclick'] = true;
      }
    });

    document.addEventListener('mouseup', e => {
      if (e.button === 2) {
        this.keysPressed['rightclick'] = false;
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
    this.updateMouseLook();
    const movementInput = this.getMovementInput();
    const isAiming = this.keysPressed['rightclick'];

    this.entityManager.entities.forEach(entity => {
      /** @type {PlayerController} */
      const controller = entity.getComponent(PlayerController);
      if (controller) {
        if (movementInput.length() > 0) {
          new MoveCommand(movementInput).execute(controller);
        }

        if (isAiming) {
          controller.handleAim();
        } else {
          controller.handleAimRelease();
        }
      }
    });
  }

  /**
   * Update camera rotation based on mouse movement
   */
  updateMouseLook() {
    if (!this.camera) return;

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
   * @param {string} key
   */
  handleKeyDown(key) {
    const commands = {
      ' ': () => new JumpCommand(),
      c: () => new CrouchCommand(),
      x: () => new ProneCommand(),
      q: () => new LeanLeftCommand(),
      e: () => new LeanRightCommand(),
      r: () => new ReloadCommand(),
    };

    const command = commands[key]?.();
    if (!command) return;
    console.log('command:', command);

    this.entityManager.entities.forEach(entity => {
      const controller = entity.getComponent(PlayerController);
      if (controller) {
        command.execute(controller);
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
