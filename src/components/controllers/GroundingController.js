import { GroundingState } from '../states/PlayerState.js';
import { PlayerController } from '../PlayerController.js';
import { RigidBody } from '../RigidBody.js';
import RAPIER from '@dimforge/rapier3d-compat';

/**
 * Controls the grounding state layer (grounded vs airborne)
 * Handles gravity, jumping, and ground detection
 */
class GroundingController {
  /** @type {PlayerController} */
  player;

  /** @type {number} */
  jumpCooldown = 0;

  /** @type {number} */
  jumpCooldownTime = 0.2;

  /**
   * @param {PlayerController} player
   */
  constructor(player) {
    this.player = player;
  }

  /**
   * Update grounding state and apply gravity
   * @param {number} deltaTime
   */
  update(deltaTime) {
    if (this.jumpCooldown > 0) {
      this.jumpCooldown -= deltaTime;
    }

    const rigidBody = this.player.entity.getComponent(RigidBody);
    if (!rigidBody) return;

    this.player.grounded = this.checkGrounded(rigidBody);

    if (this.player.isGrounded) {
      this.player.groundingState = GroundingState.GROUNDED;
    } else {
      this.player.groundingState = GroundingState.AIRBORNE;
    }
  }

  handleJump() {
    if (this.jumpCooldown > 0) return;

    if (this.player.groundingState !== GroundingState.GROUNDED) return;

    const rigidBody = this.player.entity.getComponent(RigidBody);
    if (!rigidBody) return;

    const currentVel = rigidBody.body.linvel();
    rigidBody.body.setLinvel(
      {
        x: currentVel.x * 0.5,
        y: currentVel.y,
        z: currentVel.z * 0.5,
      },
      true
    );

    rigidBody.body.applyImpulse({ x: 0, y: this.player.jumpForce, z: 0 }, true);

    this.player.groundingState = GroundingState.AIRBORNE;
    this.player.stanceController.forceStanding();

    this.jumpCooldown = this.jumpCooldownTime;
  }

  /**
   * @param {RigidBody} rigidBody
   * @returns
   */
  checkGrounded(rigidBody) {
    const physicsWorld = this.player.physicsWorld;
    if (!physicsWorld) return;
    const ray = new RAPIER.Ray(rigidBody.body.translation(), {
      x: 0,
      y: -1,
      z: 0,
    });

    const maxDistance = 1.2;
    const solid = true;

    const hit = physicsWorld.castRay(
      ray,
      maxDistance,
      solid,
      undefined,
      undefined,
      undefined,
      rigidBody.collider
    );

    return hit !== null;
  }
}

export { GroundingController };
