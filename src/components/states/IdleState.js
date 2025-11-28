import { PlayerState } from './PlayerState.js';
import { PlayerController } from '../PlayerController.js';
import { WalkingState } from './WalkingState.js';

class IdleState extends PlayerState {
  /**
   * @param {PlayerController} controller
   */
  enter(controller) {
    controller.velocity.x = 0;
    controller.velocity.y = 0;
  }

  /**
   * @param {PlayerController} controller
   * @param {Vector3} direction
   */
  handleMove(controller, direction) {
    if (direction.length() > 0) {
      controller.change(new WalkingState());
    }
  }

  /**
   * @param {PlayerController} controller
   */
  handleJump(controller) {
    if (controller.isGrounded) {
      controller.push(new JumpingState());
    }
  }
}

export { IdleState };
