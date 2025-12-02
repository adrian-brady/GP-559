import { PlayerController } from '../../components/PlayerController.js';
import { Command } from '../Command.js';

class ReleaseAimCommand extends Command {
  /**
   * @param {PlayerController} controller
   */
  execute(controller) {
    controller.handleAim();
  }
}

export { ReleaseAimCommand };
