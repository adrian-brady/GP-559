import { PlayerController } from '../../components/PlayerController.js';
import { Command } from '../Command.js';

class HipfireCommand extends Command {
  /**
   * @param {PlayerController} controller
   */
  execute(controller) {
    controller.handleCrouch();
  }
}

export { HipfireCommand };
