import { PlayerController } from '../PlayerController.js';

/**
 * Base state class for player controller
 */
class PlayerState {
  /**
   * Called when entering this state
   * @param {PlayerController} controller
   */
  enter(controller) {}

  /**
   * Called every frame while in this state
   * @param {PlayerController} controller
   * @param {number} deltaTime
   */
  update(controller, deltaTime) {}

  /**
   * @param {PlayerController} controller
   */
  exit(controller) {}

  /**
   * Called when returning to this state after a pop
   * @param {PlayerController} controller
   */
  reenter(controller) {}
}

export { PlayerState };
