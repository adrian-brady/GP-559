import { Command } from '../Command.js';

class JumpCommand extends Command {
  /**
   * @param {PlayerController} controller
   */
  execute(controller) {
    controller.handleJump();
  }
}

export { JumpCommand };
