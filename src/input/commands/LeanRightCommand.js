import { PlayerController } from '../../components/PlayerController.js';
import { Command } from '../Command.js';

class LeanRightCommand extends Command {
  /**
   *
   * @param {PlayerController} controller
   */
  execute(controller) {
    controller.handleLeanRight();
  }
}

export { LeanRightCommand };
