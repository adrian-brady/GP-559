import { PlayerController } from '../../components/PlayerController.js';
import { Command } from '../Command.js';

class LeanLeftCommand extends Command {
  /**
   *
   * @param {PlayerController} controller
   */
  execute(controller) {
    controller.handleLeanLeft();
  }
}

export { LeanLeftCommand };
