import { PlayerController } from '../../components/PlayerController.js';
import { Command } from '../Command.js';

class ProneCommand extends Command {
  /**
   *
   * @param {PlayerController} controller
   */
  execute(controller) {
    controller.handleProne();
  }
}

export { ProneCommand };
