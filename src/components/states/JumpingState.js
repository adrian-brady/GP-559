import { PlayerState } from './PlayerState.js';
import { WalkingState } from './WalkingState.js';

class JumpingState extends PlayerState {
  /**
   * @param {PlayerController} controller
   */
  enter(controller) {
    controller.velocity.y = controller.jumpForce;
    controller.isGrounded = false;
  }

  /**
   * @param {PlayerController} controller
   * @param {number} deltaTime
   */
  update(controller, deltaTime) {
    // Apply gravity while jumping
    controller.velocity.y -= controller.gravity * deltaTime;

    // Land when velocity reaches 0 and grounded
    if (controller.velocity.y <= 0 && controller.isGrounded) {
      controller.pop(); // Pop back to previous state
    }
  }

  /**
   * @param {PlayerController} controller
   */
  exit(controller) {
    // Clean up velocity on exit if needed
  }
}

export { JumpingState };
