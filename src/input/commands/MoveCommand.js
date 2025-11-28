import { Command } from '../Command.js';
import { Vector3 } from 'three';

class MoveCommand extends Command {
  /**
   * @param {Vector3} direction
   */
  constructor(direction) {
    super();
    this.direction = direction;
  }

  /**
   * @param {PlayerController} controller
   */
  execute(controller) {
    controller.handleMove(this.direction);
  }
}

export { MoveCommand };
