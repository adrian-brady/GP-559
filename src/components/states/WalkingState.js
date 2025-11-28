import { PlayerState } from './PlayerState.js';
import { Vector3 } from 'three';
import { IdleState } from './IdleState.js';
import { JumpingState } from './JumpingState.js';

class WalkingState extends PlayerState {
  /**
   * @param {PlayerController} controller
   */
  enter(controller) {
    // Walking state doesn't reset velocity like idle does
  }

  /**
   * @param {PlayerController} controller
   * @param {Vector3} direction
   */
  handleMove(controller, direction) {
    if (direction.length() < 0.1) {
      // No input, go to idle
      controller.change(new IdleState());
      return;
    }

    // Update velocity based on direction
    controller.velocity.x = direction.x * controller.speed;
    controller.velocity.z = direction.z * controller.speed;
  }

  /**
   * @param {PlayerController} controller
   */
  handleJump(controller) {
    if (controller.isGrounded) {
      // Push jumping on top of walking
      controller.push(new JumpingState());
    }
  }

  /**
   * @param {PlayerController} controller
   * @param {number} deltaTime
   */
  update(controller, deltaTime) {
    // Apply gravity
    if (!controller.isGrounded) {
      controller.velocity.y -= controller.gravity * deltaTime;
    }
  }

  /**
   * @param {PlayerController} controller
   */
  reenter(controller) {
    // Called when jumping finishes and we return to walking
  }
}

export { WalkingState };
