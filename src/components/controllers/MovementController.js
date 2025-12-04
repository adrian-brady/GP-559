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

      const targetVelocity = new Vector3(
        this.movementDirection.x * speed,
        0,
        this.movementDirection.z * speed
      );

      const currentVel = rigidBody.body.linvel();
      const currentHorizontal = new Vector3(currentVel.x, 0, currentVel.z);

      let acceleration = this.player.isGrounded() ? 8.0 : 0.5;

      const newHorizontal = new Vector3().lerpVectors(
        currentHorizontal,
        targetVelocity,
        acceleration * deltaTime
      );

      rigidBody.body.setLinvel(
        {
          x: newHorizontal.x,
          y: currentVel.y,
          z: newHorizontal.z,
        },
        true
      );

      this.player.velocity.set(newHorizontal.x, currentVel.y, newHorizontal.z);
    } else {
      this.player.movementState = MovementState.IDLE;

      const currentVel = rigidBody.body.linvel();
      const currentHorizontal = new Vector3(currentVel.x, 0, currentVel.z);
      let deceleration = this.player.isGrounded() ? 6.0 : 2.0;

      const newHorizontal = currentHorizontal.lerp(
        new Vector3(0, 0, 0),
        deceleration * deltaTime
      );
      rigidBody.body.setLinvel(
        {
          x: newHorizontal.x,
          y: currentVel.y,
          z: newHorizontal.z,
        },
        true
      );

      this.player.velocity.set(newHorizontal.x, currentVel.y, newHorizontal.z);
    }

    this.movementDirection.set(0, 0, 0);
  }

  /**
   * Handle movement input
   * @param {Vector3} direction  - Normalized movement direction
   */
  handleMove(direction) {
    this.movementDirection.copy(direction);

    this.player.inputDirection.x = direction.x;
    this.player.inputDirection.y = direction.z;
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
