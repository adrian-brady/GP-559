import { PlayerController } from '../PlayerController.js';
import { RigidBody } from '../RigidBody.js';
import { MovementState } from '../states/PlayerState.js';
import { StanceState, WeaponState } from '../states/PlayerState.js';
import { Vector3 } from 'three';

/**
 * Controls the movement layer (idle vs moving)
 * Handles movement velocity and speed modifiers
 */
class MovementController {
  /** @type {PlayerController} */
  player;

  /** @type {Vector3} */
  movementDirection;

  /**
   * @param {PlayerController} player
   */
  constructor(player) {
    this.player = player;
    this.movementDirection = new Vector3();
  }

  /**
   * Update movement state and apply velocity
   * @param {number} deltaTime
   */
  update(deltaTime) {
    const rigidBody = this.player.entity.getComponent(RigidBody);
    if (!rigidBody) return;

    if (this.movementDirection.length() > 0) {
      this.player.movementState = MovementState.MOVING;

      let speed = this.player.speed;
      speed *= this.getStanceSpeedModifier();
      speed *= this.getAimingSpeedModifier();

      const currentVel = rigidBody.body.linvel();
      rigidBody.body.setLinvel(
        {
          x: this.movementDirection.x * speed,
          y: currentVel.y,
          z: this.movementDirection.z * speed,
        },
        true
      );
    } else {
      this.player.movementState = MovementState.IDLE;

      const currentVel = rigidBody.body.linvel();
      rigidBody.body.setLinvel(
        {
          x: 0,
          y: currentVel.y,
          z: 0,
        },
        true
      );
    }

    this.movementDirection.set(0, 0, 0);
  }

  /**
   * Handle movement input
   * @param {Vector3} direction  - Normalized movement direction
   */
  handleMove(direction) {
    this.movementDirection.copy(direction);
  }

  /**
   * Get speed modifier based on current stance
   * @returns {number}
   */
  getStanceSpeedModifier() {
    switch (this.player.stanceState) {
      case StanceState.STANDING:
        return 1.0;
      case StanceState.CROUCHING:
        return 0.5;
      case StanceState.PRONE:
        return 0.2;
      default:
        return 1.0;
    }
  }

  /**
   * Get speed modifier based on current aiming state
   * @returns {number}
   */
  getAimingSpeedModifier() {
    switch (this.player.weaponState) {
      case WeaponState.ADS || WeaponState.RELOAD || WeaponState.FOCUS_HIPFIRE:
        return 0.5;
      default:
        return 1.0;
    }
  }
}

export { MovementController };
