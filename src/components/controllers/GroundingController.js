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
    const rigidBody = this.player.entity.getComponent(RigidBody);
    if (!rigidBody) return;

    this.player.isGrounded = this.checkGrounded(rigidBody);

    if (this.player.isGrounded) {
      this.player.groundingState = GroundingState.GROUNDED;
    } else {
      this.player.groundingState = GroundingState.AIRBORNE;
    }
  }

  handleJump() {
    if (this.player.groundingState !== GroundingState.GROUNDED) return;

    const rigidBody = this.player.entity.getComponent(RigidBody);
    if (!rigidBody) return;

    rigidBody.body.applyImpulse({ x: 0, y: this.player.jumpForce, z: 0 }, true);

    this.player.groundingState = GroundingState.AIRBORNE;
    this.player.stanceController.forceStanding();
    console.log('player grounding state:', this.player.groundingState);
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
    console.log('hit:', hit !== null);

    return hit !== null;
  }
}

export { GroundingController };
